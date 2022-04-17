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
import { LeottaFMIstance } from "..";
const wait = promisify(setTimeout);

const logger: ClassLogger = new ClassLogger("RadioPlayer");

/* ==== Class ============================================================================================================================= */
export class RadioPlayer {
    private UUID: number;                                               // Unique indentifier user to identify ButtonInteractions
    private volume: number;                                             // Float
    private currentStation: Station;

    /* ==== Audio ============== */
    // TODO: on voice channel changed, update this.voiceChannel
    private voiceChannel: VoiceChannel | StageChannel;                  // The current voiceChannel the bot is in
    private connection: VoiceConnection;                                // Voice connection events handler
    private player: AudioPlayer;                                        // Music player
    private resource: AudioResource<null>;                              // Resource - stream that is being played
    private subscription: PlayerSubscription;

    private intervalId: NodeJS.Timer;

    /* ==== DynamicMessages ==== */
    private textChannel: TextBasedChannel;                             // Where to log / send all the messages
    private currentRadioDynamicMessage: DynamicMessage;                 // main player message handler

    /* ==== Public functions ======== */
    public constructor() {
        this.UUID = Date.now();                                         // Initialize UUID for this session
        this.volume = 1;

        this.player = createAudioPlayer();                              // Brand new AudioPlayer

        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);// Create navigator interface with the new UUID

        this.player.on("stateChange", (_, newState) =>
            logger.info("AudioPlayer state changed to " + newState.status));

        this.player.on("error", (e) =>
            logger.error("AudioPlayer error: " + e.message));
        // TODO: if error, try to reconnect

        logger.info("New instance created and listening on AudioPlayer events");
    }

    /**
     * CORE FUNCTION - When called, checks and instances all the instance variables, then join the voice
     * channel, playing the station selected. If the bot is already in a voice channel, the bot will ignore
     * the request. If the user is not in a voice channel, the bot will ignore the request.
     * @param risp 
     * @param stationName 
     * @returns 
     */
    public playStation = async (risp: Message | CommandInteraction | ButtonInteraction, stationName: string): Promise<boolean> => {
        logger.info("Calling playStation");
        if (!this.checkVoice(risp)) return this.isPlaying();                    // If there's something playing, don't delete the RadioPlayer

        if (!this.textChannel) this.updateTextChannel(risp.channel);            // Update textChannel
        if (!(risp.member instanceof GuildMember)) return this.isPlaying();     // To avoid errors in the next line
        if (!this.voiceChannel) this.voiceChannel = risp.member.voice?.channel; // If nothing is playing, set the voiceChannel to the new one
        // if (!this.voiceChannel/* || (this.sub?.connection && this.sub?.connection.state.status != "destroyed")*/) return;

        if (!await this.setCurrentStation(stationName)) {
            logger.warn("Invalid station selected");
            return this.isPlaying();                                            // If there's something playing, don't delete the RadioPlayer
        }

        if (!this.connection || this.connection.state.status == "destroyed") {
            this.connection = joinVoiceChannel({ channelId: this.voiceChannel.id, guildId: this.voiceChannel.guildId, adapterCreator: this.voiceChannel.guild.voiceAdapterCreator });
            this.subscription = this.connection.subscribe(this.player);     // Join together the connection and the player... More connections can subscribe to one audioPlayer

            // Listeners
            this.connection.on("error", () => logger.warn("Connection error"))
            logger.info("Listening on connection event 'error'");

            this.connection.on("stateChange", async (_, newState) => {
                logger.info("Connection state changed to " + newState.status);
                // Handle disconnection
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                        /*
                            If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                            but there is a chance the connection will recover itself if the reason of the disconnect was due to
                            switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                            so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                            the voice connection.
                        */
                        try {
                            await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);    // Probably moved voice channel
                        } catch {
                            this.connection.destroy();                                                      // Probably removed from voice channel
                        }
                    } else if (this.connection.rejoinAttempts < 5) {    		                            // Disconnect is recoverable, and we have <5 repeated attempts so we will reconnect.
                        await wait((this.connection.rejoinAttempts + 1) * 5_000);
                        this.connection.rejoin();
                    } else this.connection.destroy();                                                       // Disconnect may be recoverable, but we have no more remaining attempts - destroy.			
                } else if (newState.status === VoiceConnectionStatus.Destroyed) logger.warn("Connection destroyed");   // Once destroyed, stop the subscription
            });
            logger.info("Listening on connection event 'stateChange'");
        }

        try {// Create AudioResource with url/stream retrieved
            if(this.currentStation.type !== RADIO_TYPES.STREAM) this.currentStation.stream = (await axios.get(this.currentStation.link, { responseType: "stream" })).data;
            this.resource = createAudioResource(this.currentStation.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });
            this.setVolume();                                           // Set the volume of the new stream
            if (this.isPlaying()) this.player.stop();                   // Stop currently playing station, if any
            this.player.play(this.resource);                            // Actually start the new stream on the player
        } catch (e) {
            logger.error("Failed to create and play AudioResource: " + e.message);
            this.reset();
            return;
        }

        try {
            await this.textChannel.messages.fetch({ limit: 1 }).then(fetchedMessages => {
                (fetchedMessages.first().id != this.currentRadioDynamicMessage.message?.id)
                    ? this.resendCurrentRadioDynamicMessage()           // If the last message is another one, resend currentRadio
                    : this.editCurrentRadioDynamicMessage();            // Else, update it                                                                 // Else, edit it
            });
        } catch (e) {
            logger.error("Last message check and update error: " + e.message);
        }

        logger.info("Station changed successfully");
        return true;
    }

    /**
     * Binds the bot log messages to a new textChannel, sending again the dynamic messages.
     * @param {TextBasedChannel} textChannel
     */
    public updateTextChannel = (textChannel: TextBasedChannel): void => {
        this.textChannel = textChannel;
        this.currentRadioDynamicMessage.updateTextChannel(textChannel).resend();
    }

    /**
     * Applies the AudioResource volume, or set a new one (from input parameter)
     * @param volume
     */
    public setVolume = (volume: number = this.volume) => {
        this.volume = volume;                           // Set new volume value
        this.resource?.volume.setVolume(this.volume);   // If there's a resource, apply the volume
    }

    public pause = (): void => {
        if (this.isPaused()) return;
        this.player.pause();
        this.editCurrentRadioDynamicMessage();
    }

    public resume = (): void => {
        if (this.isPlaying()) return;
        this.player.unpause();
        this.editCurrentRadioDynamicMessage();
    }

    public reset = () => {
        this.closeInterval();
        this.player?.stop();
        this.connection?.destroy();

        this.player = createAudioPlayer();
        this.connection = undefined;
        // this.sub?.connection?.destroy();
        this.currentRadioDynamicMessage?.delete();

        this.volume = 1;
        this.UUID = Date.now();
        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);

        this.resource = undefined;
        this.textChannel = undefined;
        this.voiceChannel = undefined;
    }

    /**
     * Validates a request, used for ButtonInteractions.
     */
    public checkUUID = (UUID: number): RadioPlayer => (!UUID || this.UUID == UUID) ? this : undefined;

    public checkPresence = (risp: Message | CommandInteraction | ButtonInteraction) => {
        // TODO
    }

    public editCurrentRadioDynamicMessage = async (): Promise<Message> => this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).edit();
    public resendCurrentRadioDynamicMessage = async (): Promise<Message> => this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).resend();


    /* ==== Private functions ======= */
    private closeInterval = () => { 
        if (!this.intervalId) return;
        
        this.currentStation.stream.push(null);
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    private startNumber: number;
    private pusher = async () => {
        await axios.get(this.currentStation.link + this.currentStation.aac + this.startNumber + ".aac", { responseType: "arraybuffer" }).then(r => r.data).then(chunk => {
            logger.debug("Sending chunk " + this.startNumber++);
            this.currentStation.stream.push(chunk);
        }).catch(e => logger.error(`Stream error on chunk ${this.startNumber - 1}: ${e.message}`));
    }

    private setCurrentStation = async (stationName: string): Promise<boolean> => {
        // Check whether the station exists or not
        stationName = stationName?.toLowerCase();
        if (!stationsPool.hasOwnProperty(stationName) || this.currentStation?.name.toLowerCase() === stationName) return;

        // If station exists, close the old stream and instance the new station
        if (this.currentStation?.type === RADIO_TYPES.STREAM) this.closeInterval();

        this.currentStation = stationsPool[stationName];

        if (this.currentStation.type === RADIO_TYPES.STREAM) {
            // Get start number, create readable stream, initiate chunk pushing with an interval of 2.75s
            this.startNumber = await axios.get(this.currentStation.link + this.currentStation.m3u8).then((res: AxiosResponse<any>) => res.data.split("#EXT-X-MEDIA-SEQUENCE:", 2)[1].split("\n", 1)[0]);
            this.currentStation.stream = new Readable({ read() { } });
            this.startNumber -= this.currentStation.padding;
            while(this.currentStation.padding-- > 0) await this.pusher();
            this.intervalId = setInterval(this.pusher, this.currentStation.interval);
        } else if (this.currentStation.type !== RADIO_TYPES.SINGLE_LINK) return;
        return true;
    }

    /**
     * Checks if the AudioPlayer is playing or not.
     * @returns {boolean}
     */
    private isPlaying = (): boolean => this.player.state.status === "playing";
    private isPaused = (): boolean => this.player.state.status === "paused";

    /**
    * Checks if the user is in a voice channel and the bot is either in that channel or in none.
    */
    private checkVoice = (risp: Message | CommandInteraction | ButtonInteraction): RadioPlayer => {
        if (!(risp.member instanceof GuildMember)) return;
        const vc = risp.member.voice?.channel;
        if (vc && (!this.voiceChannel || this.voiceChannel.id == vc.id)) return this;
    }

    /**
     * Generates the embed with the radio name and thumbnail
     * TODO: mostrare il nome della canzone in riproduzione
     * @returns
     */
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

        const t = Object.values(stationsPool).map(({ name }) => { return { label: name, value: `${name}-${this.UUID}` } });//.slice(0, 24);

        const menuComponent = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
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