import { ClientEvents } from "discord.js";
import { LeottaFM } from "../classes/LeottaFM";

export interface Event {
    name: string;
    fn: (LeottaFM: LeottaFM, ...args: any[]) => void;
}