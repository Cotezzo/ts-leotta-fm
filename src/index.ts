/* ==== Imports =========================================================================================================================== */
import { LeottaFM } from './classes/LeottaFM';

import dotenv from "dotenv";    // Configure process.env globally
import { Options } from 'discord.js';
dotenv.config();

/* ==== Core ============================================================================================================================== */
export const LeottaFMIstance: LeottaFM = new LeottaFM({
    intents: [ 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING', 'GUILDS', 'GUILD_EMOJIS_AND_STICKERS', 'GUILD_INTEGRATIONS', 'GUILD_INVITES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'GUILD_VOICE_STATES', 'GUILD_WEBHOOKS' ],
    makeCache: Options.cacheWithLimits({ MessageManager: 0, GuildBanManager: 0, BaseGuildEmojiManager: 0, GuildEmojiManager: 0, GuildInviteManager: 0, GuildStickerManager: 0, ReactionManager: 0, ReactionUserManager: 0, ApplicationCommandManager: 0, PresenceManager: 0, StageInstanceManager: 0 })
});
LeottaFMIstance.init();