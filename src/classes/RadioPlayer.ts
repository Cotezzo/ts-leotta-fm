/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, ColorResolvable, CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, StageChannel, TextBasedChannels, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionStatus } from "@discordjs/voice";

import { Station } from "../interfaces/Station";

import { DynamicMessage } from "./DynamicMessage";
import { ClassLogger } from "./Logger";

import { RADIO_TYPES } from "../utils/RadioTypes";

import axios from "axios";

import { promisify } from 'util';
const wait = promisify(setTimeout);

const logger = new ClassLogger("RadioPlayer");

/* ==== Class ============================================================================================================================= */
interface StationsPool<Station> { [stationName: string]: Station };
export const stationsPool: StationsPool<Station> = {
    // Hard-coded radios
    trx: { name: "trx", thumbnail: "https://www.dailyonline.it/application/files/6715/7583/8347/TRX_Radio.png", type: RADIO_TYPES.TRX, stream: "https://trx.fluidstream.eu/trx.mp3" }
};

export const populateStationsPool = async (): Promise<void> => {
    logger.info("Populating stationsPool...");
    await axios.get("https://somafm.com/").then(res => res.data).then(data => {
        for (const stationRaw of data.match(/<a href="\/.+\/" >\n.*<img src="\/img\/.*" alt/g)) {
            const name = stationRaw.split(/\//g, 2)[1];
            const thumbnail = "https://somafm.com/" + stationRaw.split("\"", 4)[3];
            stationsPool[name] = { name, thumbnail, type: RADIO_TYPES.SOMAFM };
        }
    })

}

export class RadioPlayer {
    UUID: number;                                           // Unique indentifier user to identify ButtonInteractions
    volume: number;                                         // Float

    currentStation: Station;

    /* ==== Audio ============== */
    // TODO: on voice channel changed, update this.voiceChannel
    voiceChannel: VoiceChannel | StageChannel;              // The current voiceChannel the bot is in
    // sub: Sub;                                               // Voice connection events handler
    connection: VoiceConnection;
    player: AudioPlayer;                                    // Music player
    resource: AudioResource<null>;                          // Resource - stream that is being played

    /* ==== DynamicMessages ==== */
    textChannel: TextBasedChannels;                         // Where to log / send all the messages
    currentRadioDynamicMessage: DynamicMessage;             // main player message handler

    /* ==== Public functions ======== */
    public constructor() {
        this.UUID = Date.now();                                         // Initialize UUID for this session
        this.volume = 1;

        this.player = createAudioPlayer();                              // Brand new AudioPlayer

        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);// Create navigator interface with the new UUID

        this.player.on("stateChange", (_, newState) =>
            logger.info("AudioPlayer state changed to " + newState.status));

        this.player.on("error", (e) =>
            logger.warn("AudioPlayer error: " + e.message));
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

        if (!this.checkVoice(risp)) return true;

        if (!this.textChannel) this.updateTextChannel(risp.channel);        // Update textChannel
        if (!(risp.member instanceof GuildMember)) return true;             // To avoid errors in the next line
        if (!this.voiceChannel) this.voiceChannel = risp.member.voice?.channel; // If nothing is playing, set the voiceChannel to the new one
        // if (!this.voiceChannel/* || (this.sub?.connection && this.sub?.connection.state.status != "destroyed")*/) return;

        const tempStation: Station = await this.getStation(stationName);    // Get selected station
        if (!tempStation) {
            logger.warn("Invalid station selected");
            return true;
        }
        this.currentStation = tempStation;

        
        if (!this.connection || this.connection.state.status == "destroyed") {
            this.connection = joinVoiceChannel({ channelId: this.voiceChannel.id, guildId: this.voiceChannel.guildId, adapterCreator: this.voiceChannel.guild.voiceAdapterCreator });
            
            // Listeners
            this.connection.on("error", () => {
                logger.warn("Connection error");
            })
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
            this.resource = createAudioResource(this.currentStation.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });
            this.setVolume();                                       // Set the volume of the new stream
            if (this.isPlaying()) this.player.stop();               // Stop currently playing station, if any
            this.player.play(this.resource);                        // Actually start the new stream on the player
            this.connection.subscribe(this.player);                 // Apply the player to the connection (??)
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
     * @param {TextBasedChannels} textChannel
     */
    public updateTextChannel = (textChannel: TextBasedChannels): void => {
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

    /**
     * Validates a request, used for ButtonInteractions.
     */
    public checkUUID = (UUID: number): RadioPlayer => (!UUID || this.UUID == UUID) ? this : undefined;

    public checkPresence = (risp: Message | CommandInteraction | ButtonInteraction) => {

    }

    public editCurrentRadioDynamicMessage = async (): Promise<Message> => await this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).edit();
    public resendCurrentRadioDynamicMessage = async (): Promise<Message> => await this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).resend();


    /* ==== Private functions ======= */
    private getStation = async (stationName: string): Promise<Station> => {
        const station: Station = stationsPool[stationName];
        if (!station) return;

        // TODO: different stream for different Radio_Type

        // somafm
        if (station.type === RADIO_TYPES.SOMAFM) {
            const trueStationName = (await axios.get(`https://somafm.com/${station.name}`)).request.path.slice(1, -1);
            station.stream = `http://ice4.somafm.com/${trueStationName}-128-mp3`;
        } else if (station.type === RADIO_TYPES.TRX) {
            // Stream already in the object... If condition is there so the fn doesn't return undefined
            // station.stream = "https://trx.fluidstream.eu/trx.mp3";
        } else return;

        return station;
    }

    public reset = () => {
        this.player.stop();
        this.connection?.destroy();
        // this.sub?.connection?.destroy();
        this.currentRadioDynamicMessage?.delete();

        this.volume = 1;
        this.UUID = Date.now();
        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);

        this.resource = undefined;
        // TODO: reset this.sub
        this.textChannel = undefined;
        this.voiceChannel = undefined;
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

        const menuComponent = new MessageActionRow()
            .addComponents(
                /* TODO: interaction to send chooseRadio */
                new MessageSelectMenu()
                    .setCustomId('station')
                    .setPlaceholder(this.currentStation.name)
                    .addOptions(Object.keys(stationsPool).map(el => { return { label: el, value: `${el}-${this.UUID}` } }).slice(0, 24)));

        return { embeds: [embed], components: [buttonComponent, menuComponent] };
    }
}