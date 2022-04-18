/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, ColorResolvable, CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, StageChannel, TextBasedChannel, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, PlayerSubscription, StreamType, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionStatus } from "@discordjs/voice";
import { Station } from "../interfaces/Station";

import { Readable } from 'stream';

import { DynamicMessage } from "./DynamicMessage";
import { ClassLogger } from "./Logger";

import { RADIO_TYPES } from "../globals/RadioTypes";
import { stationsPool } from "../globals/StationsPool";

import axios, { AxiosResponse } from "axios";

import { promisify } from "util";
const wait = promisify(setTimeout);

/* ==== Class ============================================================================================================================= */
export class RadioPlayer {
    private logger: ClassLogger;

    /* ==== MetaData =========== */
    private UUID: number;                                               // Unique indentifier user to identify ButtonInteractions
    private volume: number;                                             // Float
    private currentStation: Station;                                    // Currently playing station metadata
    private chunkId: number;                                            // Used in STREAM stations to keep track of the chunk polling

    /* ==== Audio ============== */
    // TODO: on voice channel changed, update this.voiceChannel
    private voiceChannel: VoiceChannel | StageChannel;                  // The current voiceChannel the bot is in
    private connection: VoiceConnection;                                // Voice connection events handler
    private player: AudioPlayer;                                        // Music player
    private resource: AudioResource<null>;                              // Resource - stream that is being played
    private subscription: PlayerSubscription;                           // Product of the .subscribe of the connection
    private stream: Readable;                                           // The readable stream used to push new informations

    private intervalId: NodeJS.Timer;                                   // Id used to keep track of the chunk pusher and clear it when necessary

    /* ==== DynamicMessages ==== */
    private textChannel: TextBasedChannel;                              // Where to log / send all the messages
    private currentRadioDynamicMessage: DynamicMessage;                 // Main player message handler

    /* ==== Constructor ================================================================================= */
    public constructor() {
        // Initialize UUID, volume and audioPlayer for this session
        this.UUID = Date.now();
        this.volume = 1;
        this.player = createAudioPlayer();

        // Inizializzo messaggio col quale l'utente si interfaccia alla selezione della stazione, identificandolo con l'id creato per la sessione
        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);

        // Initialize audioPlayer events for logging purposes
        this.player.on("stateChange", (_, newState) => this.logger.debug("AudioPlayer state changed to " + newState.status));
        this.player.on("error", (e) => this.logger.error("AudioPlayer error: " + e.message));    // TODO: if error, try to reconnect

        // Initialize logger with session UUID
        this.logger = new ClassLogger("RadioPlayer " + this.UUID);
        this.logger.info(`New instance created - Listening to AudioPlayer events`);
    }

    /* ==== Public functions ============================================================================ */
    /** Completely resets all session informations and connections */
    public reset = () => {
        // Kill chunkPolling, audio playing, connection, user interface
        this.closeInterval();
        this.player?.stop();
        this.connection?.destroy();
        this.currentRadioDynamicMessage?.delete();

        // Initialize instance variables
        this.player = createAudioPlayer();
        this.volume = 1;
        this.UUID = Date.now();
        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);

        // Reset other instance variables
        this.resource = undefined;
        this.textChannel = undefined;
        this.voiceChannel = undefined;
        this.connection = undefined;
        this.chunkId = undefined;
    }

    /** Validates a request, used for ButtonInteractions */
    public checkUUID = (UUID: number): RadioPlayer => (!UUID || this.UUID == UUID) ? this : undefined;

    /** Binds the bot log messages to a new textChannel, sending again the dynamic messages */
    public updateTextChannel = (textChannel: TextBasedChannel): void => {
        this.textChannel = textChannel;
        this.currentRadioDynamicMessage.updateTextChannel(textChannel).resend();
    }

    /** Used to manipulate user interface, updating or resending the dynamic message */
    public editCurrentRadioDynamicMessage = async (): Promise<Message> => this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).edit();
    public resendCurrentRadioDynamicMessage = async (): Promise<Message> => this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).resend();

    /** Pauses the currently playing stream */
    public pause = (): void => {
        if (this.isPaused()) return;
        this.player.pause();
        this.editCurrentRadioDynamicMessage();
    }

    /** Resumes the currently playing stream */
    public resume = (): void => {
        if (this.isPlaying()) return;
        this.player.unpause();
        this.editCurrentRadioDynamicMessage();
    }

    /** Applies the AudioResource volume, or sets a new one (from input parameter) */
    public setVolume = (volume: number = this.volume) => {
        this.volume = volume;                           // Set new volume value
        this.resource?.volume.setVolume(this.volume);   // If there's a resource, apply the volume
    }

    /**
     * Checks and instances all the variables, then joins the voice channel, playing the selected station.
     * If the bot is already in a voice channel, the bot will ignore the request.
     * If the user is not in a voice channel, the bot will ignore the request.
     */
    public playStation = async (risp: Message | CommandInteraction | ButtonInteraction, stationName: string): Promise<boolean> => {
        this.logger.info(`PlayStation started [stationName: ${stationName}]`);

        // If there's something playing, exit - don't delete the RadioPlayer
        if (!this.checkVoice(risp)) return this.isPlaying();

        // Check textChannel and set it if null
        if (!this.textChannel) this.updateTextChannel(risp.channel);

        // Check voiceChannel and set it if null
        if (!(risp.member instanceof GuildMember)) return this.isPlaying();
        if (!this.voiceChannel) this.voiceChannel = risp.member.voice?.channel;

        // Retrieve station metadata - if the station is of type STREAM, the Readable stream will be initiated
        if (!await this.setCurrentStation(stationName)) return this.isPlaying();

        // Check connection and join the voiceChannel if null or destroyed
        if (!this.connection || this.connection.state.status == "destroyed") {
            this.connection = joinVoiceChannel({ channelId: this.voiceChannel.id, guildId: this.voiceChannel.guildId, adapterCreator: this.voiceChannel.guild.voiceAdapterCreator });
            this.subscription = this.connection.subscribe(this.player);     // Join together the connection and the player... More connections can subscribe to one audioPlayer

            // Initialize connection events for logging and reconnection purposes
            this.connection.on("error", () => this.logger.warn("Connection error"))
            this.connection.on("stateChange", async (_, newState) => {
                this.logger.debug("Connection state changed to " + newState.status);
                // Handle disconnection
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                        try {
                            await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);                    // Probably moved voice channel
                        } catch {
                            this.connection.destroy();                                                                      // Probably removed from voice channel
                        }
                    } else if (this.connection.rejoinAttempts < 5) {    		                                            // Disconnect is recoverable, and we have <5 repeated attempts so we will reconnect.
                        await wait((this.connection.rejoinAttempts + 1) * 5_000);
                        this.connection.rejoin();
                    } else this.connection.destroy();                                                                       // Disconnect may be recoverable, but we have no more remaining attempts - destroy.			
                } else if (newState.status === VoiceConnectionStatus.Destroyed) this.logger.warn("Connection destroyed");   // Once destroyed, stop the subscription
            });
            this.logger.info("New connection established - Listening to connection events");
        }

        try {
            // Creates the readable stream and uses it to create the new audioResource and sets the volume
            this.resource = createAudioResource(await this.createReadableStream(), { inlineVolume: true, inputType: StreamType.Arbitrary });
            this.setVolume();

            // Stop currently playing station, if any, and starts the new stream on the player
            if (this.isPlaying()) this.player.stop();
            this.player.play(this.resource);
        } catch (e) {
            this.logger.error("Failed to create and play AudioResource: " + e.message);
            this.reset();
            return;
        }

        // Se l'ultimo messaggio del textChannel salvato è l'interfaccia, aggiornala - altrimenti rimandala eliminando la precedente
        this.textChannel.messages.fetch({ limit: 1 }).then(fetchedMessages => {
            (fetchedMessages.first().id != this.currentRadioDynamicMessage.message?.id)
                ? this.resendCurrentRadioDynamicMessage()           // If the last message is another one, resend currentRadio
                : this.editCurrentRadioDynamicMessage();            // Else, update it
        });

        this.logger.info("Station changed successfully");
        return true;
    }

    /** TODO che non mi ricordo - public checkPresence = (risp: Message | CommandInteraction | ButtonInteraction) => {} */

    /* ==== Private functions =========================================================================== */
    /** Checks if the AudioPlayer is playing or not */
    private isPlaying = (): boolean => this.player.state.status === "playing";
    private isPaused = (): boolean => this.player.state.status === "paused";

    /** Checks if the user is in a voice channel and the bot is either in that channel or in none */
    private checkVoice = (risp: Message | CommandInteraction | ButtonInteraction): RadioPlayer => {
        if (!(risp.member instanceof GuildMember)) return;
        const vc = risp.member.voice?.channel;
        if (vc && (!this.voiceChannel || this.voiceChannel.id == vc.id)) return this;
    }

    /** Retrieves the station metadata from its name - Closes the old chunk polling if any and sets the new currenstStation */
    private setCurrentStation = async (stationName: string): Promise<boolean> => {
        // Check whether the station exists or not
        stationName = stationName?.toLowerCase();
        if (!stationsPool.hasOwnProperty(stationName) || this.currentStation?.name.toLowerCase() === stationName) return;

        // If station exists, close the old stream and instance the new station
        if (this.currentStation?.type === RADIO_TYPES.STREAM) this.closeInterval();

        this.currentStation = stationsPool[stationName];
        this.logger.debug("CurrentStation successfully set to " + this.currentStation.name);
        return true;
    }

    /** From the currentStation metadata, creates the Readable stream used to create the audioResource */
    private createReadableStream = async (): Promise<Readable> => {
        // Se la stazione è di tipo SINGLE_LINK, rendo il link una Readable in modo che la libreria di Discord non si buggi:
        // Se faccio partire una Readable creata da me come sopra, i link normali non funzionano più - questo è un workaround
        if (this.currentStation.type === RADIO_TYPES.SINGLE_LINK) {
            this.stream = (await axios.get(this.currentStation.link, { responseType: "stream" })).data as Readable;
        }
        
        // Se la stazione è di tipo STREAM, creo una Readable stream e avvio un timer che recupera un chunk di info ogni tot ms
        else if (this.currentStation.type === RADIO_TYPES.STREAM) {
            // Retrieve the first chunk id from the latest m3u8 file
            this.chunkId = await axios.get(this.currentStation.link + this.currentStation.m3u8).then((res: AxiosResponse<any>) => res.data.split("#EXT-X-MEDIA-SEQUENCE:", 2)[1].split("\n", 1)[0]);
            
            // Initialize the Readable stream and implement the read method
            this.stream = new Readable({ read() { /** Do nothing */ } });

            // Alcune radio non partono subito, quindi c'è bisogno di caricare preventivamente n chunk tutti assieme, partendo dall'ultimo id - n
            let n = this.currentStation.padding;
            this.chunkId -= n;
            while(n-- > 0) await this.chunkPolling();

            // Imposta il timer per recuperare il prossimo chunk ogni {interval} millisecondi - cambia in base alla stazione
            this.intervalId = setInterval(this.chunkPolling, this.currentStation.interval);
        }

        return this.stream;
    }

    /** Retrieve a new chunk for the Readable stream from the station site */
    private chunkPolling = async () => {
        await axios.get(this.currentStation.link + this.currentStation.aac + this.chunkId + ".aac", { responseType: "arraybuffer" }).then(r => r.data).then(chunk => {
            // Push the retrieved chunk in the Readable stream and increment the counter
            this.stream.push(chunk);
            this.chunkId++;
            this.logger.debug(`Chunk ${this.chunkId} pushed`);
        }).catch(e => this.logger.error(`Error pushing chunk ${this.chunkId - 1}: ${e.message}`));
    }

    /** Kill the chunkPolling if the intervalId is not null and ends the Readable stream with a null push */
    private closeInterval = () => { 
        if (!this.intervalId) return;
        
        this.stream.push(null);
        clearInterval(this.intervalId);

        this.intervalId = null;
        this.stream = null;
    }

    /** Generates the embed with the radio name and thumbnail
      * TODO: mostrare il nome della canzone in riproduzione */
    private getCurrentRadioContent = (): any => {
        const paused: boolean = this.isPaused();

        const embed = new MessageEmbed()
            .setColor(process.env.embedColor as ColorResolvable)
            .setTitle("LeottaFM Radio Player")
            .setDescription(`You're listening to: **${this.currentStation.name}**`)
            .setImage(this.currentStation.thumbnail)

        const buttonComponent = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId((paused ? "resume" : "pause") + `-${this.UUID}`)
                    .setStyle("SECONDARY")
                    // .setEmoji(paused ? "▶️" : "⏸️"),
                    .setEmoji(paused ? "877853994305855508" : "877853994259730453"),

                new MessageButton()
                    .setCustomId(`stop-${this.UUID}`)
                    .setStyle("SECONDARY")
                    // .setEmoji("⏹️")
                    .setEmoji("877853994293280828"),
            );

        // Recupera tutte le stazioni che è possibile selezionare
        const t = Object.values(stationsPool).map(({ name }) => { return { label: name, value: `${name}-${this.UUID}` } });//.slice(0, 24);

        const menuComponent = new MessageActionRow()
            .addComponents(new MessageSelectMenu()
                .setCustomId("station")
                .setPlaceholder("Change station")
                .addOptions(t.slice(0, 24)));

        const menuComponent2 = new MessageActionRow()
            .addComponents(new MessageSelectMenu()
                .setCustomId("station2")
                .setPlaceholder("Other stations...")
                .addOptions(t.slice(25, 49)));

        return { embeds: [embed], components: [buttonComponent, menuComponent, menuComponent2] };
    }
}