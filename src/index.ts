/* ==== Imports =========================================================================================================================== */
import { LeottaFM } from './classes/LeottaFM';

// Configuro il dotenv per tutto il progetto (lo faccio come prima chiamata)
import dotenv from "dotenv";
import { Options } from 'discord.js';
dotenv.config();

/* ==== Core ============================================================================================================================== */
// Configurazione di tutti i permessi richiesti dal bot, faccio in modo che la cache abbia solo l'essenziale in modo da risparmiare memoria
export const LeottaFMIstance: LeottaFM = new LeottaFM({
    intents: [ 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING', 'GUILDS', 'GUILD_EMOJIS_AND_STICKERS', 'GUILD_INTEGRATIONS', 'GUILD_INVITES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'GUILD_VOICE_STATES', 'GUILD_WEBHOOKS' ],
    makeCache: Options.cacheWithLimits({ MessageManager: 0, GuildBanManager: 0, BaseGuildEmojiManager: 0, GuildEmojiManager: 0, GuildInviteManager: 0, GuildStickerManager: 0, ReactionManager: 0, ReactionUserManager: 0, ApplicationCommandManager: 0, PresenceManager: 0, StageInstanceManager: 0 })
});

// Istanza vera e propria del bot, con la quale inizia il listening a tutti gli eventi
LeottaFMIstance.init();