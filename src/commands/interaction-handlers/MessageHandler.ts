/* ==== Imports =========================================================================================================================== */
import { Message } from "discord.js";

import { LeottaFMIstance } from "../..";

import { Logger } from "../../classes/Logger";

import { MessageCommandHandlerMap } from "../../interfaces/CommandHandlers";
import { logicHandler } from "../LogicHandler";

import { applyAlias } from "../../utils/applyAlias";

/* ==== Handler [Core] ==================================================================================================================== */
export const MessageHandler = (msg: Message) => {
    const args = msg.content.split(/[\n ]+/);                                                                   // Command arguments without prefix
    if (!args[0]) return msg.reply("Cazzo vuoi?");                                                              // Prefix only: reject

    const cmdName = args.shift().toLowerCase();
    const commandHandler = commandHandlerMap[cmdName];                                                          // Get commandHandler
    if (!commandHandler || (commandHandler.testOnly && process.env.ENVIROMENT == "P")) return;                  // Command doesn't exist or not allowed in production enviroment
    commandHandler.fn(msg, cmdName, ...args);                                                                   // Call internal command with parameters given directly by users

    Logger.log(`${msg.guild.name} - ${msg.author.username}: ${msg.content}`);                                   // Log command
}

/* ==== Command Handlers ================================================================================================================== */
const commandHandlerMap: MessageCommandHandlerMap = {
    // Admin-only-commands
    test: {
        testOnly: false,
        fn: () => console.log("Test")
    },

    // All text-commands
    "invite, info, changelog, config, ping": { fn: (msg, cmdName) => msg.reply(logicHandler[cmdName].fn(LeottaFMIstance)) }

    // Music Commands
    // "p, play": {
    //     fn: (LeottaFM, msg, cmdName, ...args: string[]) => internalCommands[cmdName].fn(msg, args.join(" "))
    // },
    // "bind, s, skip, b, back, rm, remove, clear, stop, l, leave, j, join, lp, loop, sh, shuffle, ps, pause, rs, resume, np, nowplaying, q, queue": {
    //     fn: (LeottaFM, msg, cmdName, indexORhowMany: string, howMany: string) => {
    //         const _indexORhowMany = parseInt(indexORhowMany);
    //         const _howMany = parseInt(howMany);
    //         if ((indexORhowMany && isNaN(_indexORhowMany)) || (howMany && isNaN(_howMany))) return;

    //         internalCommands[cmdName].fn(msg, indexORhowMany, howMany);
    //     }
    // },
    // "v, volume": {
    //     fn: (LeottaFM, msg, cmdName, volume: string) => internalCommands[cmdName].fn(msg, volume)
    // }
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);