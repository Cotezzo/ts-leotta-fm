/* ==== Interfaces ======================================================================================================================== */
export interface Station {
    // Parametri comuni a tutte le stazioni
    name: string;
    thumbnail: string;
    type: number;

    // Parametri impostati solo per le stazioni di tipo STREAM
    interval?: number;
    link?: string;
    m3u8?: string;
    aac?: string;
    padding?: number;
}