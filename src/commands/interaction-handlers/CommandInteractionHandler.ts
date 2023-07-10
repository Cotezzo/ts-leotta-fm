/* ==== Imports =========================================================================================================================== */
import { CommandInteraction } from "discord.js";

import { LeottaFMIstance } from "../..";

import { ClassLogger } from "../../classes/Logger";

import { CommandInteractionHandlerMap } from "../../interfaces/CommandHandlers";
import { logicHandler } from "../logic/LogicHandler";

import { applyAlias } from "../../utils/applyAlias";

const logger = new ClassLogger("CommandInteractionHandler");

/* ==== Handler [Core] ==================================================================================================================== */
export const CommandInteractionHandler = async (interaction: CommandInteraction): Promise<void> => {
    const cmdName: string = interaction.commandName;

    const fn = commandHandlerMap[cmdName];
    if(!fn) return;

    const params = {};
    for (const option of interaction.options.data)          // Get all the options from the interaction
        params[option.name] = option.user ?? option.value;  // Assign them to the params object

    logger.log(`${interaction.guild?.name} - ${interaction.user.username}: ${cmdName} ${JSON.stringify(params)}`);
    
    try{
        await fn(interaction, cmdName, params);
    }catch(e){
        logger.error(`Error during the execution of ${cmdName}: ` + e.message);
    }
}

/* ==== Command Handlers ================================================================================================================== */
const commandHandlerMap: CommandInteractionHandlerMap = {
    "ping, invite, info, help": (interaction, cmdName) => interaction.reply(logicHandler[cmdName].fn(LeottaFMIstance)),

    // Music
    // play: (interaction, cmdName, { url }: { url: string }) => play(interaction, url)
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);