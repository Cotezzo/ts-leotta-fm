/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction } from "discord.js";

import { ClassLogger } from "../../classes/Logger";

import { ButtonInteractionHandlerMap } from "../../interfaces/CommandHandlers";
import { logicHandler } from "../logic/LogicHandler";

import { applyAlias } from "../../utils/applyAlias";

const logger = new ClassLogger("ButtonInteractionHandler");

/* ==== Handler [Core] ==================================================================================================================== */
export const ButtonInteractionHandler = async (interaction: ButtonInteraction): Promise<void> => {
    const cmdParams: string[] = interaction.customId.split("-");    // For communication and to prevent false calls, some buttons have more informations in the id.
    const cmdName: string = cmdParams[0];                           // The first one is always the cmdName

    const fn = commandHandlerMap[cmdName];                          // Retrieve command handler
    if(!fn) return;
    
    logger.log(`${interaction.guild.name} - ${interaction.user.username}: [BUTTON: ${interaction.customId}]`);

    try{
        await fn(interaction, ...cmdParams);                        // And call it with the other parameters (generally, UUID)
    }catch(e){
        logger.error(`Error during the execution of ${cmdName}: ` + e.message);
    }
}

/* ==== Command Handlers ================================================================================================================== */
const commandHandlerMap: ButtonInteractionHandlerMap = {
    "stop, pause, resume, stop": (interaction, cmdName, UUID: number): void => {
        logicHandler[cmdName].fn(interaction, UUID);
        interaction.deferUpdate();
    },
    station: (interaction, cmdName, UUID: number, stationName: string): void => {
        logicHandler[cmdName].fn(interaction, stationName, UUID);
        interaction.deferUpdate();
    },
    stations: (interaction, cmdName): void => {
        interaction.reply(logicHandler[cmdName].fn());
    }
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);