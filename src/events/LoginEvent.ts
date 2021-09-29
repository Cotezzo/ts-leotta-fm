import { Event } from "../interfaces/Event"

export const loginEvent: Event = {
    name: "ready",
    fn: (LeottaFM) => {
        LeottaFM.user.setPresence({ activities: [{ name: "LeottaFM", type: "LISTENING" }], status: 'idle' });
        console.log("Bot successfully started and listening. ");
    }
}