/* ==== Imports =========================================================================================================================== */
import { LeottaFMIstance } from "..";

import { Command, Commands } from "../interfaces/CommandLogic";

import { applyAlias } from "../utils/applyAlias";

/* ==== Logic Handlers ==================================================================================================================== */
const logicHandler: Commands<Command> = {
    invite: {
        name: "invite", category: "Information", description: "Sends the invite link of the bot. ",
        fn: () => LeottaFMIstance.generateInvite()  // https://discord.com/api/oauth2/authorize?client_id=892861023177031701&permissions=415105404481&scope=bot%20applications.commands
    },
    ping: {
        name: "ping", category: "Information", description: "WebSocket ping in milliseconds. ",
        fn: () => `Pong! (${LeottaFMIstance.ws.ping}ms)`
    },
    /*
    info: {
        name: "info", category: "Information", description: "Lets the bot speak a bit about himself. ",
        fn: () => { return { embeds: [new MessageEmbed()
            .setColor(process.env.embedColor)
            .setTitle("ChatBot informations")
            .addField("First name", "Haram", true)
            .addField("Middle name", "Ibra", true)
            .addField("Surname", "Leotta", true)
            .addField("Birthday", "December 17st, ‎2020", true)
            .addField("Version", process.env.version, true)
            .setFooter(`Created by Boquobbo#5645            Special Thanks to Depa`)
            //.setThumbnail((clientBot.user).avatarURL())
            .setThumbnail(`https://cdn.discordapp.com/attachments/638334134388785172/807421835946754048/fumocirno3d.gif`) ] } }
    },
    changelog: {
        name: "changelog", category: "Information", description: "News and notes about the bot code and functionalities. ",
        fn: () => { return { embeds: [new MessageEmbed()
            .setColor(process.env.embedColor)
            .setTitle("Changelog: ")
            .addField("Code rework", "Due to Node.js and Discord updates, I'm coding the bot from 0 (yes, again). It still is in WIP, so some functionalities may be unavailable at the moment. ")
            .addField("Slash Commands", "Slash commands are in development and are coming soon! ")
            .addField("SoundCloud support", "Ham play now supports SoundCloud song urls!")
            .setFooter("For any suggestion or bug report feel free to DM me - Boquobbo#5645")] } }
    },
    config: {
        name: "config", category: "Information", description: "Shows the current configuration of the bot. ",
        fn: () => { return { embeds: [new MessageEmbed()
            .setColor(process.env.embedColor)
            .setTitle(`Server settings`)
            .addField(`Version`, process.env.version, true)
            .addField(`Default prefix`, process.env.defaultPrefix, true)
            .addField(`Color`, process.env.embedColor.toString(), true)
            .addField(`Reddit cache size`, process.env.redditMaxSubs.toString(), true)
            .addField(`Music history size`, process.env.musicMaxHistory.toString(), true)
            //.addField(`Admins`, process.env.admins.map(elem => `<@${elem}>`), true)
        ] } }
    },
    help: {
        name: "help", category: "Information", description: "Shows the list of all commands. ",
        fn: (cmdName: string = "") => {
            const embed = new MessageEmbed().setColor(process.env.embedColor)
            if(!cmdName || !internalCommands.hasOwnProperty(cmdName))
                return { embeds: [ embed.setTitle("Haram Leotta Commands")
                    .addFields( Object.entries(categories).map( ( [key, value]) => { return { name: `${key} Commands`, value: `\`${value.join(`\`, \``)}\``} } ) ) ] };

            const { name, description, category, aliases, usage } = internalCommands[cmdName];
            embed.setTitle(`Command '${name}' help`)
                .addFields([{ name: "Description", value: description },
                            { name: "Usage", value: usage || "Quando ho voglia li metto" },
                            { name: "Aliases", value: aliases || "none" }])
                .setFooter("<> => required argument - [] => optional argument - | => OR")

            return { embeds: [embed] }
        }
    },

    // Music
    "p, play": {
        name: "play", category: "Music", description: "Plays a song in your voice channel, loading the url or searching on YouTube. ", aliases: "p",
        fn: (risp: Message | CommandInteraction, url: string) => play(risp, url)
    },
    "ps, pause": {
        name: "pause", category: "Music", description: "Pauses the currently playing song. ", aliases: "ps",
        fn: (risp: Message | CommandInteraction) => pause(risp)
    },
    "rs, resume": {
        name: "resume", category: "Music", description: "Resumes the currently paused song. ", aliases: "rs",
        fn: (risp: Message | CommandInteraction) => resume(risp)
    },
    "clear, stop": {
        name: "clear", category: "Music", description: "Cleares the music queue and kicks the bot from the voice channel. ",
        fn: (risp: Message | CommandInteraction) => clear(risp)
    },
    "l, leave": {
        name: "leave", category: "Music", description: "Kicks the bot out from the voice channel, but doesn't clear the current queue and other informations. ", aliases: "l",
        fn: (risp: Message | CommandInteraction) => leave(risp)
    },
    bind: {
        name: "bind", category: "Music", description: "Binds the music bot to the current channel. ",
        fn: (risp: Message | CommandInteraction) => bind(risp)
    },
    "np, nowplaying": {
        name: "nowplaying", category: "Music", description: "Shows informations about the current song. ", aliases: "np",
        fn: (risp: Message | CommandInteraction) => nowplaying(risp)
    },
    "v, volume": {
        name: "volume", category: "Music", description: "Changes the volume of the music. Default: 1. ", aliases: "v",
        fn: (risp: Message | CommandInteraction, volum: string) => {
            if(!/[0-9]{0,2}(\.[0-9])?/.test(volum)) return;
            volume(risp, parseFloat(volum))
        }
    }
    */
};

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