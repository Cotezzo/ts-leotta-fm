/* ==== Imports =========================================================================================================================== */
import { LeottaFM } from './classes/LeottaFM';

import dotenv from "dotenv";    // Configure process.env globally
dotenv.config();

/* ==== Core ============================================================================================================================== */
export const LeottaFMIstance: LeottaFM = new LeottaFM({ intents: [ 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING', 'GUILDS', 'GUILD_EMOJIS_AND_STICKERS', 'GUILD_INTEGRATIONS', 'GUILD_INVITES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'GUILD_VOICE_STATES', 'GUILD_WEBHOOKS' ] });
LeottaFMIstance.init();