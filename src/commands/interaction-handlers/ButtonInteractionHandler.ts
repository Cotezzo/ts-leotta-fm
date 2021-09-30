/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction } from "discord.js";

import { ClassLogger, Logger } from "../../classes/Logger";

import { ButtonInteractionHandlerMap } from "../../interfaces/CommandHandlers";
// import { logicHandler } from "../LogicHandler";

import { applyAlias } from "../../utils/applyAlias";

const logger = new ClassLogger("ButtonInteractionHandler");

/* ==== Handler [Core] ==================================================================================================================== */
export const ButtonInteractionHandler = async (interaction: ButtonInteraction): Promise<void> => {
    const cmdParams: string[] = interaction.customId.split("-");    // For communication and to prevent false calls, some buttons have more informations in the id.
    const cmdName: string = cmdParams.shift();                      // The first one is always the cmdName

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
    
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);