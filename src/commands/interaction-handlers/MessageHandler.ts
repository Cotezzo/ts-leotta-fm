/* ==== Imports =========================================================================================================================== */
import { Message } from "discord.js";

import { ClassLogger } from "../../classes/Logger";

import { MessageCommandHandlerMap } from "../../interfaces/CommandHandlers";
import { logicHandler } from "../logic/LogicHandler";

import { applyAlias } from "../../utils/applyAlias";


const logger = new ClassLogger("MessageHandler");

/* ==== Handler [Core] ==================================================================================================================== */
export const MessageHandler = async (msg: Message): Promise<any> => {
    const args = msg.content.split(/[\n ]+/);                                                   // Command arguments without prefix
    if (!args[0]) return msg.reply("Cazzo vuoi?");                                              // Prefix only: reject

    const cmdName = args.shift().toLowerCase();
    const commandHandler = commandHandlerMap[cmdName];                                          // Get commandHandler
    if (!commandHandler || (commandHandler.testOnly && process.env.ENVIROMENT == "P")) return;  // Command doesn't exist or not allowed in production enviroment

    logger.log(`${msg.guild.name} - ${msg.author.username}: ${msg.content}`);                   // Log command

    try{
        await commandHandler.fn(msg, cmdName, ...args);                                               // Call internal command with parameters given directly by users
    }catch(e){
        logger.error(`Error during the execution of ${cmdName}: ` + e.message);
    }
}

/* ==== Command Handlers ================================================================================================================== */
const commandHandlerMap: MessageCommandHandlerMap = {
    test: {
        testOnly: true,
        fn: msg => msg.reply("Test")
    },

    "ping, invite, info, help": { fn: (msg, cmdName) => msg.reply(logicHandler[cmdName].fn(cmdName)) }

    // Music Commands
    // "p, play": {
    //     fn: (LeottaFM, msg, cmdName, ...args: string[]) => internalCommands[cmdName].fn(msg, args.join(" "))
    // },
    // "v, volume": {
    //     fn: (LeottaFM, msg, cmdName, volume: string) => internalCommands[cmdName].fn(msg, volume)
    // }
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);