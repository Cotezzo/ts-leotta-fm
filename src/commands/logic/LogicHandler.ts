/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, ColorResolvable, CommandInteraction, Message, MessageEmbed } from "discord.js";
import { LeottaFMIstance } from "../../";
import { Logger } from "../../classes/Logger";
import { RadioPlayer, stationsPool } from "../../classes/RadioPlayer";

import { Command, Commands } from "../../interfaces/CommandLogic";

import { applyAlias } from "../../utils/applyAlias";

/* ==== Logic Handlers ==================================================================================================================== */
const logicHandler: Commands<Command> = {
    /* ==== INFORMATION ==== */
    ping: {
        name: "ping", category: "Information", description: "WebSocket ping in milliseconds",
        fn: () => `Pong! (${LeottaFMIstance.ws.ping}ms)`
    },
    invite: {
        name: "invite", category: "Information", description: "Sends the invite link of the bot",
        fn: () => "Bot invitation link: https://discord.com/api/oauth2/authorize?client_id=892861023177031701&permissions=415105404481&scope=bot%20applications.commands"
    },
    info: {
        name: "info", category: "Information", description: "Lets the bot speak a bit about himself",
        fn: () => { return { embeds: [new MessageEmbed()
            .setColor("DARK_VIVID_PINK")
            .setTitle("LeottaFM informations")
            .addField("First name", "Leotta", true)
            .addField("Middle name", "Hernandez", true)
            .addField("Surname", "FM", true)
            .addField("Birthday", "September 28th, ‎2021", true)
            .addField("Version", process.env.VERSION, true)
            .setFooter(`Created by Boquobbo#5645            Special Thanks to Depa`)
            .setThumbnail(LeottaFMIstance.user.avatarURL())
            // .setThumbnail(`https://cdn.discordapp.com/attachments/638334134388785172/807421835946754048/fumocirno3d.gif`)
        ] } }
    },
    help: {
        name: "help", category: "Information", description: "Shows the list of all commands",
        fn: (cmdName: string) => {
            const embed = new MessageEmbed().setColor(process.env.embedColor as ColorResolvable);

            if(!cmdName || !logicHandler.hasOwnProperty(cmdName))
                return { embeds: [ embed.setTitle("Haram Leotta Commands")
                    .addFields( Object.entries(categories).map( ( [key, value]) => { return { name: `${key} Commands`, value: `\`${value.join(`\`, \``)}\``} } ) ) ] };

            const { name, description, category, aliases, usage } = logicHandler[cmdName];
            embed.setTitle(`Command '${name}' help`)
                .addFields([{ name: "Category", value: category },
                            { name: "Description", value: description },
                            { name: "Usage", value: usage || "Quando ho voglia li metto" },
                            { name: "Aliases", value: aliases || "none" }])
                .setFooter("<> => required argument - [] => optional argument - | => OR")

            return { embeds: [embed] }
        }
    },

    /* ==== RADIO ========== */
    "l, list, stations": {
        name: "stations", category: "Radio", description: "Lists all the available stations that can be played with the command 'station'", aliases: "l, list",
        fn: () => {
            const stations = Object.keys(stationsPool);
            
            let text = "```swift\n"
            for(let i = 0; i < stations.length; i+= 3)
                text += fill15(stations[i] ?? "") + " " + fill15(stations[i+1] ?? "") + " " + fill15(stations[i+2] ?? "") + "\n";
            return text + "```";
        }
    },

    "s, station": {
        name: "station", category: "Radio", description: "LeottaFM will enter your voice channel and play your favourite radio station", aliases: "s",
        fn: (risp: Message | CommandInteraction | ButtonInteraction, stationName: string, UUID?: number): any =>
            getOrCreateRadioPlayer(risp.guildId)?.checkUUID(UUID)?.playStation(risp, stationName)
    },
    "fuckoff, clear, stop, l, leave": {
        name: "stop", category: "Radio", description: "Kicks the bot out from the voice channel",
        fn: (risp: Message | CommandInteraction | ButtonInteraction, UUID?: number): any => {
            getRadioPlayer(risp.guildId)?.checkUUID(UUID)?.reset();
            delete radioPlayersMap[risp.guildId];
        }
    },

    bind: {
        name: "bind", category: "Radio", description: "Binds the bot to the current text channel",
        fn: (risp: Message | CommandInteraction): any =>
            getRadioPlayer(risp.guildId)?.updateTextChannel(risp.channel)
    },
    "np, nowplaying": {
        name: "nowplaying", category: "Radio", description: "Shows informations about the current station", aliases: "np",
        fn: (risp: Message | CommandInteraction): any =>
            getRadioPlayer(risp.guildId)?.resendCurrentRadioDynamicMessage()
    },
    "v, volume": {
        name: "volume", category: "Radio", description: "Changes the volume of the radio [Default: 1]", aliases: "v",
        fn: (risp: Message | CommandInteraction | ButtonInteraction, volume: string): any => {
            if(!/[0-9]{0,2}(\.[0-9])?/.test(volume)) return;
            getRadioPlayer(risp.guildId)?.setVolume(parseFloat(volume));
        }
    }
};

// Utility for fm stations
const fill15 = (str: string): string => str + " ".repeat(15 - str.length)

/* ==== Music Logic ======================================================================================================================= */
interface RadioPlayersMap<RadioPlayer> { [serverId: string]: RadioPlayer; }
const radioPlayersMap: RadioPlayersMap<RadioPlayer> = {};

const getRadioPlayer = (guildId: string): RadioPlayer => radioPlayersMap[guildId];

const getOrCreateRadioPlayer = (guildId: string): RadioPlayer => {
    if(!radioPlayersMap[guildId])
        radioPlayersMap[guildId] = new RadioPlayer();

    return radioPlayersMap[guildId];
}


/* ==== Post Processing =================================================================================================================== */
interface categories { [index: string]: string[] }
const categories: categories = {};

for(const { name, category } of Object.values(logicHandler)){
    if(category)
        if(categories[category]) categories[category].push(name);
        else categories[category] = [name];
}

applyAlias(logicHandler);
export { logicHandler };