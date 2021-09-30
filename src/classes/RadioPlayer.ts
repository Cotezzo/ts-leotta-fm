/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, ColorResolvable, CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, StageChannel, TextBasedChannels, VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType } from "@discordjs/voice";

import { Station } from "../interfaces/Station";

import { DynamicMessage } from "./DynamicMessage";
import { ClassLogger } from "./Logger";
import { Sub } from "./Sub";

// import ytdl from "ytdl-core";
// import ytdl from "ytdl-core-discord";

import axios from "axios";

// const youtubePlaylist = /^https:\/\/(www.)?youtube.com\/playlist\?list=([0-9a-zA-Z_-]{18,34})$/;  //18
// const youtubeVideo = /^https:\/\/((www.youtube.com\/watch\?v=)|(youtu.be\/))+.*/;

const logger = new ClassLogger("RadioPlayer");

/* ==== Class ============================================================================================================================= */
interface StationsPool<Station> { [stationName: string]: Station };
export const stationsPool: StationsPool<Station> = {};
export const populateStationsPool = async (): Promise<void> => {
    logger.info("Populating stationsPool...");
    await axios.get("https://somafm.com/").then(res => res.data).then(data => {

        for(const stationRaw of data.match(/<a href="\/.+\/" >\n.*<img src="\/img\/.*" alt/g)){
            const name = stationRaw.split(/\//g, 2)[1];
            const thumbnail = "https://somafm.com/" + stationRaw.split("\"", 4)[3];
            stationsPool[name] = { name, thumbnail, stream: `http://ice4.somafm.com/${name}-128-mp3` };
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
    sub: Sub;                                               // Voice connection events handler
    player: AudioPlayer;                                    // Music player
    resource: AudioResource<null>;                          // Resource - stream that is being played

    /* ==== DynamicMessages ==== */
    textChannel: TextBasedChannels;                         // Where to log / send all the messages
    chooseRadioPage: number;                                // -queue navigator page
    chooseRadioDynamicMessage: DynamicMessage;              // -queue navigator message handler
    currentRadioDynamicMessage: DynamicMessage;             // main player message handler

    /* ==== Public functions ======== */
    public constructor() {
        this.UUID = Date.now();                                         // Initialize UUID for this session
        this.volume = 1;

        this.player = createAudioPlayer();                              // Brand new AudioPlayer

        this.chooseRadioDynamicMessage = new DynamicMessage(this.UUID); // Create main player interface with the new UUID
        this.currentRadioDynamicMessage = new DynamicMessage(this.UUID);// Create navigator interface with the new UUID

        this.player.on("stateChange", (_, newState) =>
            logger.info("AudioPlayer state changed to " + newState.status));

        this.player.on("error", (e) =>
            logger.warn("AudioPlayer error: " + e.message));

        this.player.on(AudioPlayerStatus.Idle, () => {  // On player finish (unexpected, since radio should be continous)
            // TODO: if the stream crashed, play again. If user kicked the bot, don't.
            // this.play();
        })

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
    public playStation = async (risp: Message | CommandInteraction | ButtonInteraction, stationName: string): Promise<void> => {
        if (!this.checkVoice(risp)) return;

        if (this.isPlaying()) this.player.stop();                               // Stop currently playing station, if any

        if (!this.textChannel) this.updateTextChannel(risp.channel);            // Update textChannel
        if (!(risp.member instanceof GuildMember)) return;                      // To avoid errors in the next line
        if (!this.voiceChannel) this.voiceChannel = risp.member.voice?.channel; // If nothing is playing, set the voiceChannel to the new one
        // if (!this.voiceChannel/* || (this.sub?.connection && this.sub?.connection.state.status != "destroyed")*/) return;

        this.currentStation = await this.getStation(stationName);            // Get selected station
        if (!this.currentStation) {
            logger.warn("Invalid station selected");
            // reset();
            return;
        }

        this.sub = new Sub(joinVoiceChannel({ channelId: this.voiceChannel.id, guildId: this.voiceChannel.guildId, adapterCreator: this.voiceChannel.guild.voiceAdapterCreator }));

        try {// Create AudioResource with url/stream retrieved
            this.resource = createAudioResource(this.currentStation.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });
            this.setVolume();                                       // Set the volume of the new stream
            this.player.play(this.resource);                        // Actually start the new stream on the player
            this.sub.connection.subscribe(this.player);             // Apply the player to the connection (??)
        } catch (e) {
            logger.error("Failed to create and play AudioResource: " + e.message);
            // reset();
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
            // reset();
            // return;
        }

        logger.info("Station changed successfully");
    }

    /**
     * Binds the bot log messages to a new textChannel, sending again the dynamic messages.
     * @param {TextBasedChannels} textChannel
     */
    public updateTextChannel = (textChannel: TextBasedChannels): void => {
        this.textChannel = textChannel;
        this.chooseRadioDynamicMessage.updateTextChannel(textChannel).resend();
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

    /**
     * Validates a request, used for ButtonInteractions.
     */
    public checkUUID = (UUID: number): RadioPlayer => (!UUID || this.UUID == UUID) ? this : undefined;

    public editCurrentRadioDynamicMessage = async (): Promise<Message> => await this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).edit();
    public resendCurrentRadioDynamicMessage = async (): Promise<Message> => await this.currentRadioDynamicMessage.updateContent(this.getCurrentRadioContent()).resend();


    /* ==== Private functions ======= */
    private getStation = async (stationName: string): Promise<Station> => {
        // TODO
        return null;
    }

    public reset = () => {
        this.player.stop();
        // this.player = createAudioPlayer();
        this.currentRadioDynamicMessage.delete();

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

    // Queue
    private getCurrentRadioContent = (): any => {
        const paused: boolean = this.isPaused();

        const embed = new MessageEmbed()
            .setColor(process.env.embedColor as ColorResolvable)
            .setTitle("LeottaFM Radio Player")
            .setDescription(`You're listening to: **${this.currentStation.name}**`)
            .setImage(this.currentStation.thumbnail)

        const component = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId((paused ? "resume" : "pause") + `-${this.UUID}`)
                    .setStyle("SECONDARY")
                    // .setEmoji(paused ? "▶️" : "⏸️"),
                    .setEmoji(paused ? "877853994305855508" : "877853994259730453"),

                new MessageButton()
                    .setCustomId(`clear-${this.UUID}`)
                    .setStyle("SECONDARY")
                    // .setEmoji("⏹️")
                    .setEmoji("877853994293280828"),

                /*
                TODO: interaction to send chooseRadio
                new MessageButton()
                    .setCustomId(`clear-${this.UUID}`)
                    .setStyle("SECONDARY")
                    // .setEmoji("⏹️")
                    .setEmoji("877853994293280828")
                */

            );

        return { embeds: [embed], components: [component] };
    }
}