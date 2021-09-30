/* ==== Imports =========================================================================================================================== */
import { ColorResolvable, MessageEmbed } from "discord.js";
import { LeottaFMIstance } from "../../";

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
        name: "help", category: "Information", description: "Shows the list of all commands. ",
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
    /*
    // Music
    "p, play": {
        name: "play", category: "Music", description: "Plays a song in your voice channel, loading the url or searching on YouTube. ", aliases: "p",
        fn: (risp: Message | CommandInteraction, url: string) => play(risp, url)
    },
    "clear, stop, leave": {
        name: "clear", category: "Music", description: "Cleares the music queue and kicks the bot from the voice channel. ",
        fn: (risp: Message | CommandInteraction) => clear(risp)
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