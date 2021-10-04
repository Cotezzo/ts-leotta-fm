/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, ColorResolvable, CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, StageChannel, TextBasedChannels, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionStatus } from "@discordjs/voice";

import { Station } from "../interfaces/Station";

import { Readable } from 'stream'
import ss from 'stream-stream';

import { DynamicMessage } from "./DynamicMessage";
import { ClassLogger } from "./Logger";

import { RADIO_TYPES } from "../globals/RadioTypes";
import { stationsPool } from "../globals/StationsPool";

import axios from "axios";

import { promisify } from "util";
import { concatStreams, merge } from "../utils/UtilityFunctions";

const wait = promisify(setTimeout);

const logger = new ClassLogger("RadioPlayer");

/* ==== Class ============================================================================================================================= */
export class RadioPlayer {
    UUID: number;                                           // Unique indentifier user to identify ButtonInteractions
    volume: number;                                         // Float

    currentStation: Station;


    asd: Buffer;


    /* ==== Audio ============== */
    // TODO: on voice channel changed, update this.voiceChannel
    voiceChannel: VoiceChannel | StageChannel;              // The current voiceChannel the bot is in
    connection: VoiceConnection;                            // Voice connection events handler
    player: AudioPlayer;                                    // Music player
    resource: AudioResource<null>;                          // Resource - stream that is being played

    intervalId: NodeJS.Timer;
    intervalParams: any;

    // intervalId = setInterval(fname, 10000);
    // clearInterval(intervalId);

    /* ==== DynamicMessages ==== */
    textChannel: TextBasedChannels;                         // Where to log / send all the messages
    currentRadioDynamicMessage: DynamicMessage;             // main player message handler

    /* ==== Public functions ======== */
    public constructor() {
        this.intervalParams = {};
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

        if (!this.checkVoice(risp)) return this.isPlaying();                    // If there's something playing, don't delete the RadioPlayer

        if (!this.textChannel) this.updateTextChannel(risp.channel);            // Update textChannel
        if (!(risp.member instanceof GuildMember)) return this.isPlaying();     // To avoid errors in the next line
        if (!this.voiceChannel) this.voiceChannel = risp.member.voice?.channel; // If nothing is playing, set the voiceChannel to the new one
        // if (!this.voiceChannel/* || (this.sub?.connection && this.sub?.connection.state.status != "destroyed")*/) return;

        const tempStation: Station = await this.getStation(stationName);        // Get selected station
        if (!tempStation) {
            logger.warn("Invalid station selected");
            return this.isPlaying();                                            // If there's something playing, don't delete the RadioPlayer
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
            this.resource = createAudioResource(/*Readable.from*/(this.currentStation.stream), { inlineVolume: true, inputType: StreamType.Arbitrary });
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
        stationName = stationName?.toLowerCase();
        const station: Station = stationsPool[stationName];
        if (!station) return;

        if (station.type === RADIO_TYPES.TEST) {
            try {
                const urlRoot = "https://streamcdnm23-dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S3160845/0tuSetc8UFkF/";

                let startNumber = await axios.get(urlRoot + "chunklist_b128000.m3u8").then(res => res.data.split("#EXT-X-MEDIA-SEQUENCE:", 2)[1].split("\n", 1)[0]);
                station.stream = ss();
                // station.stream = CombinedStream.create({pauseStreams: false});

                const url = `${urlRoot}media-u1nu3maeq_b128000_${startNumber}.aac`;

                await axios.get(url, { responseType: "stream" }).then(r => {
                    logger.debug("stream esiste");
                    station.stream.write(r.data);
                    startNumber++;
                }).catch(e => console.log(e));

                // through the data event
                station.stream.on('data', (chunk) => {
                    console.log("Chunk received");
                });

                // station.stream.on('end', () => {
                //     console.log("Stream ended");
                // });

                // Remove old interval fn (if any)
                if (this.intervalId) clearInterval(this.intervalId);

                this.intervalId = setInterval(async () => {
                    logger.debug(startNumber);

                    const url = `${urlRoot}media-u1nu3maeq_b128000_${startNumber}.aac`;

                    await axios.get(url, { responseType: "stream" }).then(r => {
                        logger.debug("stream esiste");
                        station.stream.write(r.data);
                        // station.stream.end();
                        startNumber++;
                    }).catch(e => logger.error("Stream error: " + e.message));

                }, 1500);


            } catch (e) {
                logger.error("getStation TEST error: " + e.message);
                return;
            }
        } else if (station.type !== RADIO_TYPES.SOMAFM && station.type !== RADIO_TYPES.TRX && station.type !== RADIO_TYPES.VIRGIN) return;

        return station;

        /*
        try {

            if (station.type === RADIO_TYPES.SOMAFM) {
                // SomaFM radios are now hardcoded, too

                // const res = await axios.get(`https://somafm.com/${stationName}`, { "headers": { "cache-control": "no-cache", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36" }});
                // const trueStationName = res.request.path.slice(1, -1);
                
                // station.thumbnail = "https://somafm.com" + res.data.split("img src", 2)[1].split("\"", 2)[1];
                // station.stream = `http://ice4.somafm.com/${trueStationName}-128-mp3`;
            } else if (station.type === RADIO_TYPES.TRX || station.type === RADIO_TYPES.VIRGIN) {
                // Stream already in the object... If condition is there so the fn doesn't return undefined
                // station.stream = "https://trx.fluidstream.eu/trx.mp3";
            } else return;
        } catch (e) {
            logger.error("getStation error: " + e.message);
            return;
        }

        return station;
        */
    }

    public reset = () => {
        this.player.stop();
        this.connection?.destroy();
        // this.sub?.connection?.destroy();
        this.currentRadioDynamicMessage?.delete();

        this.intervalParams = {};
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