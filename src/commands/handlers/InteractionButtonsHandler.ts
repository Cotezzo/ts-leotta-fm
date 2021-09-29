import { LeottaFM } from "../../classes/LeottaFM";
import { ButtonInteraction } from "discord.js";
import { InteractionCommandButtonsHandler } from "../../interfaces/CommandHandlers";
import { Logger } from "../../classes/Logger";

export const interactionButtonsHandler = async (LeottaFM: LeottaFM, interaction: ButtonInteraction) => {
    // const cmdName: string = interaction.customId;
    const cmdParams: string[] = interaction.customId.split("-");    // For communication and to prevent false calls, some buttons have more informations in the id.
    const cmdName: string = cmdParams.shift();                      // The first one is always the cmdName

    const fn = interactionCommandButtonsHandler[cmdName];           // Retrieve command handler
    if(fn) fn(interaction, ...cmdParams);                           // And call it with the other parameters (generally, UUID)

    Logger.log();
    console.log(`${new Date().toLocaleString()} - ${interaction.guild.name} - ${interaction.user.username}: [BUTTON: ${interaction.customId}]`);
}

const interactionCommandButtonsHandler: InteractionCommandButtonsHandler = {
    reset: (interaction, UUID: string) => reset(interaction, +UUID),
    next: (interaction, UUID: string) => next(interaction, +UUID),
    prev: (interaction, UUID: string) => prev(interaction, +UUID),
}