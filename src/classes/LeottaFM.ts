import { Client } from 'discord.js';

import { config } from '../configs/Config';
import { loginEvent } from '../events/LoginEvent';
import { toListenEvents } from '../events/ToListenEvents';

/**
 * Main class that rapresents the bot itself.
 * On init, logs in the bot into Discord and starts to listen on all the events.
 */
export class LeottaFM extends Client {
    public init = () => {
        this.login(config.botToken);                        // Bot login
        
        this.once(loginEvent.name, loginEvent.fn.bind(null, this));    // On bot login event, execute only once        

        for(const event of toListenEvents)                          // Event Listeners (loop through each event and start listening)
            this.on(event.name, event.fn.bind(null, this));
    }
}