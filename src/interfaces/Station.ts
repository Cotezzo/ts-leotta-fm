/* ==== Interfaces ======================================================================================================================== */
export interface Station {
    name: string;
    thumbnail: string;
    type: number;

    // STREAM Stations
    interval?: number;
    link?: string;
    m3u8?: string;
    aac?: string;
    padding?: number;

    // Not configured
    stream?: any;
}