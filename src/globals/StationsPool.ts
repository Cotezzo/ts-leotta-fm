/* ==== Imports =========================================================================================================================== */
import axios from "axios";
import { Logger } from "../classes/Logger";
import { Station } from "../interfaces/Station";
import { capitalizeFirstLetter } from "../utils/UtilityFunctions";
import { RADIO_TYPES } from "./RadioTypes";

/* ==== Exports =========================================================================================================================== */
interface StationsPool<Station> { [stationName: string]: Station };

export const stationsPool: StationsPool<Station> = {
    // Hard-coded radios
    test: { name: "test", thumbnail: "", type: RADIO_TYPES.TEST, link: "https://streamcdnm23-dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S3160845/0tuSetc8UFkF/media-u1nu3maeq_b128000_118118216.aac" },

    trx: { name: "TRX", thumbnail: "https://www.dailyonline.it/application/files/6715/7583/8347/TRX_Radio.png", type: RADIO_TYPES.TRX, stream: "https://trx.fluidstream.eu/trx.mp3" },

    virgin: { name: "Virgin", thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-VirginRadioOnAir-1588257500754.png--.png", type: RADIO_TYPES.VIRGIN, stream: "https://icy.unitedradio.it/Virgin.mp3" },
    classicrock: { name: "ClassicRock", thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-ClassicRock-1588062884404.png--.png", type: RADIO_TYPES.VIRGIN, stream: "https://icy.unitedradio.it/VirginRockClassics.mp3" },
    rockhits: { name: "RockHits", thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-RockHits-1588062672845.png--.png", type: RADIO_TYPES.VIRGIN, stream: "https://icy.unitedradio.it/VirginRockHits.mp3" },
    rockballads: { name: "RockBallads", thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-RockBallads-1588062347185.png--.png", type: RADIO_TYPES.VIRGIN, stream: "https://icy.unitedradio.it/Virgin_06.mp3" },
    virgin70s: { name: "Virgin70s", thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-Rock70-1588062930899.png--.png", type: RADIO_TYPES.VIRGIN, stream: "https://icy.unitedradio.it/VirginRock70.mp3" },
    virgin80s: { name: "Virgin80s", thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-Rock80-1588062718835.png--.png", type: RADIO_TYPES.VIRGIN, stream: "https://icy.unitedradio.it/VirginRock80.mp3" },

    doomed: { name: 'Doomed', thumbnail: 'https://somafm.com/img3/specials-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/specials-128-mp3' },
    dronezone: { name: 'Dronezone', thumbnail: 'https://somafm.com/img3/dronezone-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/dronezone-128-mp3' },
    deepspaceone: { name: 'Deepspaceone', thumbnail: 'https://somafm.com/img3/deepspaceone-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/deepspaceone-128-mp3' },
    spacestation: { name: 'Spacestation', thumbnail: 'https://somafm.com/img3/spacestation-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/spacestation-128-mp3' },
    vaporwaves: { name: 'Vaporwaves', thumbnail: 'https://somafm.com/img3/vaporwaves-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/vaporwaves-128-mp3' },
    defcon: { name: 'Defcon', thumbnail: 'https://somafm.com/img3/defcon-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/defcon-128-mp3' },
    lush: { name: 'Lush', thumbnail: 'https://somafm.com/img3/lush-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/lush-128-mp3' },
    fluid: { name: 'Fluid', thumbnail: 'https://somafm.com/img3/fluid-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/fluid-128-mp3' },
    poptron: { name: 'Poptron', thumbnail: 'https://somafm.com/img3/poptron-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/poptron-128-mp3' },
    suburbsofgoa: { name: 'Suburbsofgoa', thumbnail: 'https://somafm.com/img3/suburbsofgoa-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/suburbsofgoa-128-mp3' },
    groovesalad: { name: 'Groovesalad', thumbnail: 'https://somafm.com/img3/groovesalad-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/groovesalad-128-mp3' },
    n5md: { name: 'N5md', thumbnail: 'https://somafm.com/img3/n5md-400.png', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/n5md-128-mp3' },
    beatblender: { name: 'Beatblender', thumbnail: 'https://somafm.com/img3/beatblender-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/beatblender-128-mp3' },
    bootliquor: { name: 'Bootliquor', thumbnail: 'https://somafm.com/img3/bootliquor-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/bootliquor-128-mp3' },
    illstreet: { name: 'Illstreet', thumbnail: 'https://somafm.com/img3/illstreet-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/illstreet-128-mp3' },
    thistle: { name: 'Thistle', thumbnail: 'https://somafm.com/img3/thistle-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/thistle-128-mp3' },
    covers: { name: 'Covers', thumbnail: 'https://somafm.com/img3/covers-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/covers-128-mp3' },
    dubstep: { name: 'Dubstep', thumbnail: 'https://somafm.com/img3/dubstep-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/dubstep-128-mp3' },
    "7soul": { name: '7soul', thumbnail: 'https://somafm.com/img3/7soul-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/7soul-128-mp3' },
    seventies: { name: 'Seventies', thumbnail: 'https://somafm.com/img3/seventies400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/seventies-128-mp3' },
    u80s: { name: 'U80s', thumbnail: 'https://somafm.com/img3/u80s-400.png', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/u80s-128-mp3' },
    secretagent: { name: 'Secretagent', thumbnail: 'https://somafm.com/img3/secretagent-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/secretagent-128-mp3' },
    thetrip: { name: 'Thetrip', thumbnail: 'https://somafm.com/img3/thetrip-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/thetrip-128-mp3' },
    sonicuniverse: { name: 'Sonicuniverse', thumbnail: 'https://somafm.com/img3/sonicuniverse-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/sonicuniverse-128-mp3' },
    indiepop: { name: 'Indiepop', thumbnail: 'https://somafm.com/img3/indiepop-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/indiepop-128-mp3' },
    digitalis: { name: 'Digitalis', thumbnail: 'https://somafm.com/img3/digitalis-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/digitalis-128-mp3' },
    folkfwd: { name: 'Folkfwd', thumbnail: 'https://somafm.com/img3/folkfwd-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/folkfwd-128-mp3' },
    brfm: { name: 'Brfm', thumbnail: 'https://somafm.com/img3/brfm-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/brfm-128-mp3' },
    missioncontrol: { name: 'Missioncontrol', thumbnail: 'https://somafm.com/img3/missioncontrol-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/missioncontrol-128-mp3' },
    sf1033: { name: 'Sf1033', thumbnail: 'https://somafm.com/img3/sf1033-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/sf1033-128-mp3' },
    scanner: { name: 'Scanner', thumbnail: 'https://somafm.com/img3/scanner-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/scanner-128-mp3' },
    bagel: { name: 'Bagel', thumbnail: 'https://somafm.com/img3/bagel-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/bagel-128-mp3' },
    live: { name: 'Live', thumbnail: 'https://somafm.com/img3/live-400.jpg', type: RADIO_TYPES.SOMAFM, stream: 'http://ice4.somafm.com/live-128-mp3' }
};

/* ==== Post Processing =================================================================================================================== */
export const populateStationsPool = async (): Promise<void> => {
    return;

    Logger.info("Populating stationsPool...");
    await axios.get("https://somafm.com/").then(res => res.data).then(data => data.split("holiday", 1)[0]).then(data => {
        for (const stationRaw of data.match(/<a href="\/.+\/" >\n.*<img src="\/img\/.*" alt/g)) {
            const name: string = stationRaw.split(/\//g, 2)[1];
            const thumbnail: string = "https://somafm.com/" + stationRaw.split("\"", 4)[3];
            stationsPool[name] = { name: capitalizeFirstLetter(name), thumbnail, type: RADIO_TYPES.SOMAFM };
        }
    });
}