import { ButtonInteraction, CommandInteraction, Message } from "discord.js";

export interface InteractionCommandButtonsHandler {
    [command: string]: (interaction: ButtonInteraction, ...args: any[]) => any;     // command = Command name
};

export interface InteractionCommandHandler {
    [command: string]: (interaction: CommandInteraction, ...args: any[]) => any;    // command = Command name
};

export interface TextCommandHandler {
    [command: string]: (message: Message, ...args: any[]) => any;                   // command = Command name
};