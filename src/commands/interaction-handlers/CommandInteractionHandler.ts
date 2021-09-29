/* ==== Imports =========================================================================================================================== */
import { CommandInteraction } from "discord.js";

import { LeottaFMIstance } from "../..";

import { Logger } from "../../classes/Logger";

import { CommandInteractionHandlerMap } from "../../interfaces/CommandHandlers";
import { logicHandler } from "../LogicHandler";

import { applyAlias } from "../../utils/applyAlias";

/* ==== Handler [Core] ==================================================================================================================== */
export const CommandInteractionHandler = async (interaction: CommandInteraction) => {
    const cmdName: string = interaction.commandName;

    const params = {};
    for (const option of interaction.options.data)                                                                                                  // Get all the options from the interaction
        params[option.name] = option.user ?? option.value;                                                                                            // Assign them to the params object

    commandHandlerMap[cmdName](interaction, cmdName, params);
    
    Logger.log(`${interaction.guild?.name} - ${interaction.user.username}: ${cmdName} ${JSON.stringify(params)}`);
}

/* ==== Command Handlers ================================================================================================================== */
const commandHandlerMap: CommandInteractionHandlerMap = {
    "invite, info, changelog, config, ping": (interaction, cmdName) => interaction.reply(logicHandler[cmdName].fn(LeottaFMIstance)),

    // Music
    // play: (interaction, cmdName, { url }: { url: string }) => play(interaction, url)
}

/* ==== Post Processing =================================================================================================================== */
applyAlias(commandHandlerMap);