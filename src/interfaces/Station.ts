/* ==== Interfaces ======================================================================================================================== */
export interface Station {
    name: string;
    thumbnail: string;
    type: number;

    link?: string;
    stream?: any;
}