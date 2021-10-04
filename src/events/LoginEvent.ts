/* ==== Imports =========================================================================================================================== */
import { LeottaFMIstance } from "..";

// import { populateStationsPool } from "../globals/StationsPool";
import { Logger } from "../classes/Logger";

import { Event } from "../interfaces/Event"

/* ==== Events ============================================================================================================================ */
export const loginEvent: Event = {
    name: "ready",
    fn: async () => {
        LeottaFMIstance.user.setPresence({ activities: [{ name: "LeottaFM", type: "LISTENING" }], status: 'idle' });
        // await populateStationsPool();
        Logger.info(`========= Bot deployed on version ${process.env.VERSION} =========`);
    }
}