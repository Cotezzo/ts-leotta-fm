/* ==== Imports =========================================================================================================================== */
import { LeottaFMIstance } from "..";

import { Logger } from "../classes/Logger";
import { Event } from "../interfaces/Event"

/* ==== Events ============================================================================================================================ */
export const loginEvent: Event = {
    name: "ready",
    fn: async () => {
        // Una volta impostato lo stato del bot, questo è pronto per essere utilizzato
        LeottaFMIstance.user.setPresence({ activities: [{ name: "LeottaFM", type: "LISTENING" }], status: 'idle' });
        Logger.info(`========= Bot deployed on version ${process.env.VERSION} =========`);
    }
}