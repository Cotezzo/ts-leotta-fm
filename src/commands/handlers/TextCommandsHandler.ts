import { Message, MessageEmbed, User } from "discord.js";

import { internalCommands } from "./InternalCommands";

import { Leotta } from "../core/Leotta.class";
import { config } from "../configs/Config";
import { getUserFromMention } from "../services/userService";
import { sendPost } from "../services/redditService";
import { applyAlias } from "../utils/applyAlias";
import { file, urlRegex } from "../utils/regex";
import { test } from "../services/testService";

export const textCommandsHandler = (Leotta: Leotta, msg: Message) => {
    const args = msg.content.split(/[\n ]+/);                                                                       // Command arguments without prefix
    if (!args[0]) return;                                                                                           // Prefix only: reject

    const cmdName = args.shift().toLowerCase();
    const commandHandler = textCommandsHandlers[cmdName];                                                           // Get command object

    if (!commandHandler || (commandHandler.adminOnly && !config.admins.includes(msg.author.id))) return;            // Command doesn't exist or not allowed: reject

    commandHandler.fn(Leotta, msg, cmdName, ...args);

    // command.fn(Leotta, msg, ...args);                                                                            // Call internal command with parameters given directly by users

    console.log(`${new Date().toLocaleString()} - ${msg.guild.name} - ${msg.author.username}: ${msg.content}`);     // Log command
}

interface textCommandHandlers {
    [index: string]: {
        adminOnly?: boolean;
        fn(Leotta: Leotta, msg: Message, cmdName: string, ...args: any): any;                                       // Index = Command name
    }
};

const textCommandsHandlers: textCommandHandlers = {
    // Admin-only-commands
    test: {
        adminOnly: true,
        fn: (Leotta, msg, cmdName, ...args) => test(msg)
    },
    clean: {
        adminOnly: true,
        fn: async (Leotta, msg: any, cmdName, numb: string, user: string) => {
            var num: number = parseInt(numb);                                                        //Prende il numero messo come parametro
            if (isNaN(num)) return;
            // num = num > 100 ? 100 : num;
            if (user) {
                var filter: User | string = (await getUserFromMention(Leotta, msg, user));
                if (!filter) return;
                filter = filter.id;
                msg.channel.messages.fetch({ limit: 100 })
                    .then(msgs => msgs.filter(msg => msg.author.id === filter))
                    .then(msgs => msg.channel.bulkDelete(msgs.first(num > 100 ? 100 : num))).catch(e => console.log());      // ! Property 'bulkDelete' does not exist on type 'PartialDMChannel'
            } else
                msg.channel.bulkDelete(num > 100 ? 100 : num).catch(e => console.log());                                     // ! Property 'bulkDelete' does not exist on type 'PartialDMChannel'
        }
    },

    // All text-commands
    "invite, pacco, sus, coinflip, info, changelog, config, ping": { fn: (Leotta, msg, cmdName) => msg.reply(internalCommands[cmdName].fn(Leotta)) },
    echo: { fn: (Leotta, msg) => msg.reply(msg.content.substr(5)) },
    clap: { fn: (Leotta, msg, cmdName, ...args: string[]) => msg.reply(internalCommands[cmdName].fn(args)) },
    help: { fn: (Leotta, msg, cmdName, command: string = "") => msg.reply(internalCommands[cmdName].fn(command)) },
    "pic, drip, lessgo": {
        fn: async (Leotta, msg, cmdName, userName: string | undefined) => {
            const user = userName ? (file.test(userName) ? userName : await getUserFromMention(Leotta, msg, userName)) : msg.author; // Get user for "username" if exists, or get author
            if (!user) return;                                                                      // If username is invalid, reject
            msg.reply(await internalCommands[cmdName].fn(user));
        }
    },
    prefix: {
        fn: (Leotta, msg, cmdName, newPrefix: string) => {
            if (!newPrefix) return;                                                                 // Check if the param is valid
            internalCommands[cmdName].fn(msg, msg.author.id, newPrefix);                                 // Update user prefix
        }
    },
    wiki: {
        fn: (Leotta, msg, cmdName, topic: string, language: string) => msg.reply(internalCommands[cmdName].fn(topic, language))
    },
    weather: {
        fn: async (Leotta, msg, cmdName, ...args: string[]) => {
            const city = args.join(" ");
            if (city) msg.reply(await internalCommands[cmdName].fn(city));
        }
    },
    "tl, translate": {
        fn: async (Leotta, msg, cmdName, toLang, ...args: string[]) => {
            const text = args.join(" ");
            if (text) msg.reply(await internalCommands[cmdName].fn(text, toLang));
        }
    },
    giggino: {
        fn: async (Leotta, msg, cmdName, ...args: string[]) => {
            const text = args.join(" ");
            if (text) msg.reply(await internalCommands[cmdName].fn(text));
        }
    },

    "r, r/, reddit": {
        fn: async (Leotta, msg, cmdName, subreddit: string) => {
            if (!/^\w+$/.test(subreddit)) return msg.reply("Invalid subreddit. ");                   // Check if the string is valid
            try {
                sendPost(await internalCommands[cmdName].fn(msg.channelId, subreddit), msg);  // Get and send actual post
            } catch (e) {
                msg.reply("Invalid subreddit. ");
            }
        }
    },
    genpic: {
        fn: async (Leotta, msg, cmdName, ...args: string[]) => {
            const query = args.join(" ");                                                                   // Create string with all the args
            msg.reply(await internalCommands[cmdName].fn(query));                                    // Get and send image
        }
    },
    "up, anime, colorize, dream, caption": {
        fn: async (Leotta, msg, cmdName, url: string) => {
            if (!urlRegex.test(url)) return;
            msg.reply(await internalCommands[cmdName].fn(url))
        }
    },

    // Music Commands
    "p, play": {
        fn: (Leotta, msg, cmdName, ...args: string[]) => {
            internalCommands[cmdName].fn(msg, args.join(" "))
        }
    },
    "bind, s, skip, b, back, rm, remove, clear, stop, l, leave, j, join, lp, loop, sh, shuffle, ps, pause, rs, resume, np, nowplaying, q, queue": {
        fn: (Leotta, msg, cmdName, indexORhowMany: string, howMany: string) => {
            const _indexORhowMany = parseInt(indexORhowMany);
            const _howMany = parseInt(howMany);
            if ((indexORhowMany && isNaN(_indexORhowMany)) || (howMany && isNaN(_howMany))) return;

            internalCommands[cmdName].fn(msg, indexORhowMany, howMany);
        }
    },
    "v, volume": {
        fn: (Leotta, msg, cmdName, volume: string) => internalCommands[cmdName].fn(msg, volume)
    },
    "f, favs, favourites": {
        fn: (Leotta, msg, cmdName, subCommand: string, indexORhowMany: string, howMany: string) => {
            const _indexORhowMany = parseInt(indexORhowMany);
            const _howMany = parseInt(howMany);
            if ((indexORhowMany && isNaN(_indexORhowMany)) || (howMany && isNaN(_howMany))) return;

            internalCommands[cmdName].fn(msg, subCommand, indexORhowMany, howMany);
        }
    }
}

applyAlias(textCommandsHandlers);