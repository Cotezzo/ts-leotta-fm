/* ==== Imports =========================================================================================================================== */
import { LeottaFMIstance } from "..";

import { Logger } from "../classes/Logger";

import { Event } from "../interfaces/Event"

/* ==== Events ============================================================================================================================ */
export const loginEvent: Event = {
    name: "ready",
    fn: () => {
        LeottaFMIstance.user.setPresence({ activities: [{ name: "LeottaFM", type: "LISTENING" }], status: 'idle' });
        Logger.log(`=== Bot successfully deployed on version ${process.env.VERSION} ===`);
    }
}