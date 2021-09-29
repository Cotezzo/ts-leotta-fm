import { CommandInteraction, User } from "discord.js";

import { Leotta } from "../core/Leotta.class";
import { sortby, sendPost } from "../services/redditService";
import { internalCommands } from "./InternalCommands";
import { applyAlias } from "../utils/applyAlias";
import { urlRegex } from "../utils/regex";
import { play } from "../services/musicService";

export const interactionCommandsHandler = async (Leotta: Leotta, interaction: CommandInteraction) => {
    const cmdName: string = interaction.commandName;

    const params = {};
    for (const option of interaction.options.data)                                                                                                  // Get all the options from the interaction
        params[option.name] = option.user??option.value;                                                                                            // Assign them to the params object

    interactionCommandsHandlers[cmdName](Leotta, interaction, cmdName, params);
    
    console.log(`${new Date().toLocaleString()} - ${interaction.guild?.name} - ${interaction.user.username}: ${cmdName} ${JSON.stringify(params)}`);
}

interface InteractionCommandHandlers {
    [index: string]: (Leotta: Leotta, interaction: CommandInteraction, cmdName: string, ...args: any) => any;                                       // Index = Command name
};

const interactionCommandsHandlers: InteractionCommandHandlers = {
    reddit: async (Leotta, interaction, cmdName, { subreddit, sortby = "hot" }: { subreddit: string, sortby: sortby }) => {
        try {
            subreddit = subreddit.replace(/ /g, "");
            if(!/^\w+$/.test(subreddit)) throw undefined;                                                                                           // Check if the string is valid
            await sendPost(await internalCommands[cmdName].fn(interaction.channelId, subreddit, sortby), interaction);                              // Try to get and send post
        } catch (e) {
            interaction.reply({ content: "Invalid subreddit. ", ephemeral: true });                                                                 // On error, reject
        }
    },
    "invite, pacco, sus, coinflip, info, changelog, config, ping": (Leotta, interaction, cmdName) => interaction.reply(internalCommands[cmdName].fn(Leotta)),
    echo: (Leotta, interaction, cmdName, { text }: { text: string }) => interaction.reply(text),
    clap: (Leotta, interaction, cmdName, { text }: { text: string }) => interaction.reply(internalCommands[cmdName].fn(text.split(" "))),
    help: (Leotta, interaction, cmdName, { command = "" }: { command: string }) => interaction.reply(internalCommands[cmdName].fn(command)),
    wiki: (Leotta, interaction, cmdName, { topic, language="en" }: { topic: string, language: string }) => interaction.reply(internalCommands[cmdName].fn(topic, language)),
    weather: async (Leotta, interaction, cmdName, { city }: { city: string }) => interaction.reply(await internalCommands[cmdName].fn(city)),
    prefix: (Leotta, interaction, cmdName, { prefix }: { prefix: string }) => internalCommands[cmdName].fn(interaction, interaction.member.user.id, prefix),
    "translate, giggino": async (Leotta, interaction, cmdName, { text, language="it" }: { text: string, language: string }) => {
        try {
            interaction.reply(await internalCommands[cmdName].fn(text, language))
        } catch (e) {
            // console.log(e)
            interaction.reply({ content: "Invalid language. ", ephemeral: true })
        }
    },
    "pic, drip, lessgo": async (Leotta, interaction, cmdName, { user }: { user: User | undefined }) => interaction.reply(await internalCommands[cmdName].fn(user||interaction.user)),
    genpic: (Leotta, interaction, cmdName, { query }: { query: string }) => internalCommands[cmdName].fn(query).then(embed => interaction.reply(embed)),
    "up, anime, colorize, dream, caption": (Leotta, interaction, cmdName, { image_url }: { image_url: string }) => {
        if(!urlRegex.test(image_url)) return interaction.reply({ content: "Invalid url. ", ephemeral: true });
        interaction.deferReply();
        internalCommands[cmdName].fn(image_url).then(embed => interaction.editReply(embed))
    },

    // Music
    play: (Leotta, interaction, cmdName, { url }: { url: string }) => play(interaction, url)
}

applyAlias(interactionCommandsHandlers);