import { entersState, VoiceConnection, VoiceConnectionDisconnectReason, VoiceConnectionStatus } from "@discordjs/voice";
import { promisify } from 'util';
import { ClassLogger } from "./Logger";
const wait = promisify(setTimeout);

const logger = new ClassLogger("Sub");

export class Sub {
    connection: VoiceConnection;

    constructor(connection: VoiceConnection){
        this.connection = connection;


        this.connection.on("error", () => {
            logger.warn("Connection error");
        })

        this.connection.on("stateChange", async (_, newState) => {
            
            // Handle disconnection
            if (newState.status === VoiceConnectionStatus.Disconnected) {
				if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
					/*
						If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
						but there is a chance the connection will recover itself if the reason of the disconnect was due to
						switching voice channels. This is also the same code for the bot being kicked from the voice channel,
						so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
						the voice connection.
					*/
					try {
						await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);    // Probably moved voice channel
					} catch {
						this.connection.destroy();                                                      // Probably removed from voice channel
					}
				} else if (this.connection.rejoinAttempts < 5) {    		                            // Disconnect is recoverable, and we have <5 repeated attempts so we will reconnect.
					await wait((this.connection.rejoinAttempts + 1) * 5_000);
					this.connection.rejoin();
				} else this.connection.destroy();                                                       // Disconnect may be recoverable, but we have no more remaining attempts - destroy.			
            } else if (newState.status === VoiceConnectionStatus.Destroyed) logger.warn("Connection destroyed");   // Once destroyed, stop the subscription
        });
    }
}
