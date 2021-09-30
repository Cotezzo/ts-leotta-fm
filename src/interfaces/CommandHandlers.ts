/* ==== Imports =========================================================================================================================== */
import { ButtonInteraction, CommandInteraction, Message } from "discord.js";

/* ==== Interfaces ======================================================================================================================== */
export interface ButtonInteractionHandlerMap {
    [command: string]: (interaction: ButtonInteraction, ...args: any[]) => any;
};

export interface CommandInteractionHandlerMap {
    [command: string]: (/* Leotta: LeottaFM, */interaction: CommandInteraction, cmdName: string, ...args: any) => any;
};

export interface MessageCommandHandlerMap {
    [command: string]: {
        testOnly?: boolean;
        fn(/*Leotta: LeottaFM, */msg: Message, cmdName: string, ...args: any): any;
    }
};