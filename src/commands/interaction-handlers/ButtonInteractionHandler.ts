/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction } from "discord.js";

import { Logger } from "../../classes/Logger";

import { ButtonInteractionHandlerMap } from "../../interfaces/CommandHandlers";
// import { logicHandler } from "../LogicHandler";

import { applyAlias } from "../../utils/applyAlias";

/* ==== Handler [Core] ==================================================================================================================== */
export const ButtonInteractionHandler = async (interaction: ButtonInteraction) => {
    const cmdParams: string[] = interaction.customId.split("-");    // For communication and to prevent false calls, some buttons have more informations in the id.
    const cmdName: string = cmdParams.shift();                      // The first one is always the cmdName

    const fn = commandHandlerMap[cmdName];                          // Retrieve command handler
    if(fn) fn(interaction, ...cmdParams);                           // And call it with the other parameters (generally, UUID)

    Logger.log(`${interaction.guild.name} - ${interaction.user.username}: [BUTTON: ${interaction.customId}]`);
}

/* ==== Command Handlers ================================================================================================================== */
const commandHandlerMap: ButtonInteractionHandlerMap = {
    
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);