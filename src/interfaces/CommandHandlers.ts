/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, CommandInteraction, Message } from "discord.js";

/* ==== Interfaces ======================================================================================================================== */
export interface ButtonInteractionHandlerMap {
    [command: string]: (interaction: ButtonInteraction, ...args: any[]) => any;                                     // command = Command name
};

export interface CommandInteractionHandlerMap {
    [command: string]: (/* Leotta: LeottaFM, */interaction: CommandInteraction, cmdName: string, ...args: any) => any;   // command = Command name
};

export interface MessageCommandHandlerMap {
    [command: string]: {
        testOnly?: boolean;
        fn(/*Leotta: LeottaFM, */msg: Message, cmdName: string, ...args: any): any;                                     // command = Command name
    }
};