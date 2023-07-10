/* ==== Imports =========================================================================================================================== */
import { Client } from 'discord.js';

import { loginEvent } from '../events/LoginEvent';
import { toListenEvents } from '../events/ToListenEvents';
import { ClassLogger, Logger } from './Logger';

/* ==== Class ============================================================================================================================= */
// Main class that rapresents the bot itself. On init, logs in the bot into Discord and starts to listen on all the events.
export class LeottaFM extends Client {
    public init = () => {
        // Local logger, used for two logs and garbage collected
        const logger = new ClassLogger("LeottaFM");

        // In base all'ambiente, logga e fa login col token opportuno
        const isProd = process.env.ENVIROMENT == "P" ? true : false;
        Logger.info(`==== Deploy started on enviroment ${isProd ? "PRODUCTION" : "TEST"} ====`);
        this.login(isProd ? process.env.productionToken : process.env.testToken);   // Bot login
        
        // On bot login event, execute only once  
        this.once(loginEvent.name, loginEvent.fn.bind(null, this));     
        logger.info(`Listening on event '${loginEvent.name}'`);

        // Event Listeners (loop through each event and start listening)
        for(const event of toListenEvents) {
            this.on(event.name, event.fn.bind(null, this));
            logger.info(`Listening on event '${event.name}'`);
        }
    }
}