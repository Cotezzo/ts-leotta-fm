/* ==== Imports =========================================================================================================================== */
import { Interaction, Message } from "discord.js";

import { LeottaFM } from "../classes/LeottaFM";

import { ButtonInteractionHandler } from "../commands/interaction-handlers/ButtonInteractionHandler";
import { CommandInteractionHandler } from "../commands/interaction-handlers/CommandInteractionHandler";
import { MessageHandler } from "../commands/interaction-handlers/MessageHandler";

import { Event } from "../interfaces/Event"

/* ==== Events ============================================================================================================================ */
export const toListenEvents: Event[] = [
    {   // On server built-in commands interaction (first call)
        name: "interactionCreate",
        fn: async (_: LeottaFM, interaction: Interaction) => {
            if(interaction.isCommand()) return CommandInteractionHandler(interaction); // Handle command and output
            if(interaction.isButton()) return ButtonInteractionHandler(interaction);   // Handle buttons call (new reactions)
        }
    },
    {   // Event triggered on every text message
        name: "messageCreate",
        fn: async (_: LeottaFM, msg: Message) => {
            if(msg.author.bot) return;                                                  // Bot message: reject
            if (!msg.content.toLowerCase().startsWith(process.env.PREFIX)) return;      // No prefix: reject - Remove prefix from msg.content
            msg.content = msg.content.substring(process.env.PREFIX.length + (msg.content.charAt(process.env.PREFIX.length) == " " ? 1 : 0));

            MessageHandler(msg);                                                        // Handle command and output
        }
    }
];