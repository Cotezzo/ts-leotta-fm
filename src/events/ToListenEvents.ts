import { Interaction, Message, MessageReaction, User } from "discord.js";

import { Event } from "../interfaces/Event"
import { config as env } from '../configs/Config';
import { textCommandsHandler } from "./TextCommandsHandler";
import { interactionCommandsHandler } from "./InteractionCommandsHandler";
import { interactionButtonsHandler } from "./InteractionButtonsHandler";

export const toListenEvents: Event[] = [
    {   // On server built-in commands interaction (first call)
        name: "interactionCreate",
        fn: async (LeottaFM, interaction: Interaction) => {
            if(interaction.isCommand()) return interactionCommandsHandler(LeottaFM, interaction);   // Handle command and output
            if(interaction.isButton()) return interactionButtonsHandler(LeottaFM, interaction);     // Handle buttons call (new reactions)
        }
    },
    {   // Event triggered on every text message
        name: "messageCreate",
        fn: async (LeottaFM, msg: Message) => {
            if(msg.author.bot) return;                                          // Bot message: reject

            if (!msg.content.toLowerCase().startsWith(env.DEF_PREFIX)) return;  // No prefix: reject - Remove prefix from msg.content
            msg.content = msg.content.substring(env.DEF_PREFIX.length + (msg.content.charAt(env.DEF_PREFIX.length) == " " ? 1 : 0));

            textCommandsHandler(LeottaFM, msg);                                 // Handle command and output
        }
    }
];