/* ==== Imports =========================================================================================================================== */
import { Station } from "../interfaces/Station";
import { RADIO_TYPES } from "./RadioTypes";

/* ==== Exports =========================================================================================================================== */
interface StationsPool<Station> { [stationName: string]: Station };

// Hard-coded radios
export const stationsPool: StationsPool<Station> = {
    // STREAM STATIONS
    rtl: {              name: "RTL 102.5",          type: RADIO_TYPES.STREAM,   padding: 11,    interval: 3000, m3u8: "chunklist_b128000.m3u8", aac: "media-uidahpith_b128000_",    link: "https://streamcdnb8-dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/audiostream/S97044836/tbbP8T1ZRPBL/",     thumbnail: "https://upload.wikimedia.org/wikipedia/it/thumb/2/25/RTL_102_5_logo.svg/1200px-RTL_102_5_logo.svg.png" },
    discoradio: {       name: "DiscoRadio",         type: RADIO_TYPES.STREAM,   padding: 1,     interval: 8000, m3u8: "chunklist.m3u8",         aac: "media_",                      link: "https://stream.discoradio.radio/audio/disco.stream_aac64/",                                              thumbnail: "https://d3ft9t2yx44rgc.cloudfront.net/wp-content/uploads/2018/10/logoDR%402x.png" },
    freccia: {          name: "Freccia",            type: RADIO_TYPES.STREAM,   padding: 1,     interval: 2750, m3u8: "chunklist_b128000.m3u8", aac: "media-u1nu3maeq_b128000_",    link: "https://streamcdnm23-dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S3160845/0tuSetc8UFkF/",            thumbnail: "https://pbs.twimg.com/profile_images/791580901260001280/CDH3kQ_N.jpg" },
    
    // SINGLE_LINK STATIONS
    rainwave: {         name: "RainWave",           type: RADIO_TYPES.SINGLE_LINK,  link: "https://relay.rainwave.cc/all.ogg?1:IvW9vCRcHv",         thumbnail: "https://www.radio.it/images/broadcasts/f3/ff/114012/1/c300.png" },
    rwgameosts: {       name: "RWGameOSTs",         type: RADIO_TYPES.SINGLE_LINK,  link: "https://relay.rainwave.cc/game.ogg?1:IvW9vCRcHv",        thumbnail: "https://www.radio.it/images/broadcasts/f3/ff/114012/1/c300.png" },
    rwchiptune: {       name: "RWChiptune",         type: RADIO_TYPES.SINGLE_LINK,  link: "https://relay.rainwave.cc/chiptune.ogg?1:IvW9vCRcHv",    thumbnail: "https://www.radio.it/images/broadcasts/f3/ff/114012/1/c300.png" },
    rwgameremixes: {    name: "RWGameRemixes",      type: RADIO_TYPES.SINGLE_LINK,  link: "https://relay.rainwave.cc/ocremix.ogg?1:IvW9vCRcHv",     thumbnail: "https://www.radio.it/images/broadcasts/f3/ff/114012/1/c300.png" },
    rwgamecovers: {     name: "RWGameCovers",       type: RADIO_TYPES.SINGLE_LINK,  link: "https://relay.rainwave.cc/covers.ogg?1:IvW9vCRcHv",      thumbnail: "https://www.radio.it/images/broadcasts/f3/ff/114012/1/c300.png" },
    
    retro: {            name: "Retro",              type: RADIO_TYPES.SINGLE_LINK,  link: "http://gyusyabu.ddo.jp:8000/;",                          thumbnail: "https://images.unsplash.com/photo-1587582140428-38110de9f434?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1171&q=80" },
    kanazawa: {         name: "Kanazawa",           type: RADIO_TYPES.SINGLE_LINK,  link: "https://musicbird.leanstream.co/JCB061-MP3",             thumbnail: "http://cdn-radiotime-logos.tunein.com/s10567q.png" },
    uji: {              name: "Uji",                type: RADIO_TYPES.SINGLE_LINK,  link: "https://musicbird.leanstream.co/JCB065-MP3",             thumbnail: "https://liveonlineradio.net/wp-content/uploads/2019/10/fm-uji.jpg" },

    trx: {              name: "TRX",                type: RADIO_TYPES.SINGLE_LINK,  link: "https://trx.fluidstream.eu/trx.mp3",                     thumbnail: "https://www.dailyonline.it/application/files/6715/7583/8347/TRX_Radio.png" },

    virgin: {           name: "Virgin",             type: RADIO_TYPES.SINGLE_LINK,  link: "https://icy.unitedradio.it/Virgin.mp3",                  thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-VirginRadioOnAir-1588257500754.png--.png" },
    classicrock: {      name: "ClassicRock",        type: RADIO_TYPES.SINGLE_LINK,  link: "https://icy.unitedradio.it/VirginRockClassics.mp3",      thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-ClassicRock-1588062884404.png--.png" },
    rockhits: {         name: "RockHits",           type: RADIO_TYPES.SINGLE_LINK,  link: "https://icy.unitedradio.it/VirginRockHits.mp3",          thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-RockHits-1588062672845.png--.png" },
    rockballads: {      name: "RockBallads",        type: RADIO_TYPES.SINGLE_LINK,  link: "https://icy.unitedradio.it/Virgin_06.mp3",               thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-RockBallads-1588062347185.png--.png" },
    virgin70s: {        name: "Virgin70s",          type: RADIO_TYPES.SINGLE_LINK,  link: "https://icy.unitedradio.it/VirginRock70.mp3",            thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-Rock70-1588062930899.png--.png" },
    virgin80s: {        name: "Virgin80s",          type: RADIO_TYPES.SINGLE_LINK,  link: "https://icy.unitedradio.it/VirginRock80.mp3",            thumbnail: "https://www.virginradio.it/resizer/-1/-1/true/Webradio-Virgin-2020-Rock80-1588062718835.png--.png" },

    doomed: {           name: "Doomed",             type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/specials-128-mp3",                thumbnail: "https://somafm.com/img3/specials-400.jpg" },
    dronezone: {        name: "Dronezone",          type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/dronezone-128-mp3",               thumbnail: "https://somafm.com/img3/dronezone-400.jpg" },
    deepspaceone: {     name: "Deepspaceone",       type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/deepspaceone-128-mp3",            thumbnail: "https://somafm.com/img3/deepspaceone-400.jpg" },
    spacestation: {     name: "Spacestation",       type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/spacestation-128-mp3",            thumbnail: "https://somafm.com/img3/spacestation-400.jpg" },
    vaporwaves: {       name: "Vaporwaves",         type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/vaporwaves-128-mp3",              thumbnail: "https://somafm.com/img3/vaporwaves-400.jpg" },
    defcon: {           name: "Defcon",             type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/defcon-128-mp3",                  thumbnail: "https://somafm.com/img3/defcon-400.jpg" },
    lush: {             name: "Lush",               type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/lush-128-mp3",                    thumbnail: "https://somafm.com/img3/lush-400.jpg" },
    fluid: {            name: "Fluid",              type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/fluid-128-mp3",                   thumbnail: "https://somafm.com/img3/fluid-400.jpg" },
    poptron: {          name: "Poptron",            type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/poptron-128-mp3",                 thumbnail: "https://somafm.com/img3/poptron-400.jpg" },
    suburbsofgoa: {     name: "Suburbsofgoa",       type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/suburbsofgoa-128-mp3",            thumbnail: "https://somafm.com/img3/suburbsofgoa-400.jpg" },
    groovesalad: {      name: "Groovesalad",        type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/groovesalad-128-mp3",             thumbnail: "https://somafm.com/img3/groovesalad-400.jpg" },
    n5md: {             name: "N5md",               type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/n5md-128-mp3",                    thumbnail: "https://somafm.com/img3/n5md-400.png" },
    beatblender: {      name: "Beatblender",        type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/beatblender-128-mp3",             thumbnail: "https://somafm.com/img3/beatblender-400.jpg" },
    bootliquor: {       name: "Bootliquor",         type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/bootliquor-128-mp3",              thumbnail: "https://somafm.com/img3/bootliquor-400.jpg" },
    illstreet: {        name: "Illstreet",          type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/illstreet-128-mp3",               thumbnail: "https://somafm.com/img3/illstreet-400.jpg" },
    thistle: {          name: "Thistle",            type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/thistle-128-mp3",                 thumbnail: "https://somafm.com/img3/thistle-400.jpg" },
    covers: {           name: "Covers",             type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/covers-128-mp3",                  thumbnail: "https://somafm.com/img3/covers-400.jpg" },
    dubstep: {          name: "Dubstep",            type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/dubstep-128-mp3",                 thumbnail: "https://somafm.com/img3/dubstep-400.jpg" },
    "7soul": {          name: "7soul",              type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/7soul-128-mp3",                   thumbnail: "https://somafm.com/img3/7soul-400.jpg" },
    seventies: {        name: "Seventies",          type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/seventies-128-mp3",               thumbnail: "https://somafm.com/img3/seventies400.jpg" },
    u80s: {             name: "U80s",               type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/u80s-128-mp3",                    thumbnail: "https://somafm.com/img3/u80s-400.png" },
    secretagent: {      name: "Secretagent",        type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/secretagent-128-mp3",             thumbnail: "https://somafm.com/img3/secretagent-400.jpg" },
    thetrip: {          name: "Thetrip",            type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/thetrip-128-mp3",                 thumbnail: "https://somafm.com/img3/thetrip-400.jpg" },
    sonicuniverse: {    name: "Sonicuniverse",      type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/sonicuniverse-128-mp3",           thumbnail: "https://somafm.com/img3/sonicuniverse-400.jpg" },
    indiepop: {         name: "Indiepop",           type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/indiepop-128-mp3",                thumbnail: "https://somafm.com/img3/indiepop-400.jpg" },
    digitalis: {        name: "Digitalis",          type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/digitalis-128-mp3",               thumbnail: "https://somafm.com/img3/digitalis-400.jpg" },
    folkfwd: {          name: "Folkfwd",            type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/folkfwd-128-mp3",                 thumbnail: "https://somafm.com/img3/folkfwd-400.jpg" },
    brfm: {             name: "Brfm",               type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/brfm-128-mp3",                    thumbnail: "https://somafm.com/img3/brfm-400.jpg" },
    missioncontrol: {   name: "Missioncontrol",     type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/missioncontrol-128-mp3",          thumbnail: "https://somafm.com/img3/missioncontrol-400.jpg" },
    sf1033: {           name: "Sf1033",             type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/sf1033-128-mp3",                  thumbnail: "https://somafm.com/img3/sf1033-400.jpg" },
    scanner: {          name: "Scanner",            type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/scanner-128-mp3",                 thumbnail: "https://somafm.com/img3/scanner-400.jpg" },
    bagel: {            name: "Bagel",              type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/bagel-128-mp3",                   thumbnail: "https://somafm.com/img3/bagel-400.jpg" },
    live: {             name: "Live",               type: RADIO_TYPES.SINGLE_LINK,  link: "http://ice4.somafm.com/live-128-mp3",                    thumbnail: "https://somafm.com/img3/live-400.jpg" }
};

/* ==== Post Processing =================================================================================================================== */
export const populateStationsPool = async (): Promise<void> => {
    /* ==== PER ORA TUTTO HARD-CODED - per evitare richieste ad ogni riavvio ==== *
    Logger.info("Populating stationsPool...");
    await axios.get("https://somafm.com/").then(res => res.data).then(data => data.split("holiday", 1)[0]).then(data => {
        for (const stationRaw of data.match(/<a href="\/.+\/" >\n.*<img src="\/img\/.*" alt/g)) {
            const name: string = stationRaw.split(/\//g, 2)[1];
            const   type: RADIO_TYPES.SINGLE_LINK,          thumbnail: string = "https://somafm.com/" + stationRaw.split("\"", 4)[3];
            stationsPool[name] = { name: capitalizeFirstLetter(name),   thumbnail, ;
        }
    });
    /* ========================================================================== */
}