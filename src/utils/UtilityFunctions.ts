import { PassThrough } from 'stream'

export const concatStreams = (streamArray, streamCounter = streamArray.length) => streamArray
  .reduce((mergedStream, stream) => {
    // pipe each stream of the array into the merged stream
    // prevent the automated 'end' event from firing
    mergedStream = stream.pipe(mergedStream, { end: false });
    // rewrite the 'end' event handler
    // Every time one of the stream ends, the counter is decremented.
    // Once the counter reaches 0, the mergedstream can emit its 'end' event.
    stream.once('end', () => --streamCounter === 0 && mergedStream.emit('end'));
    return mergedStream;
  }, new PassThrough());

export const merge = (...streams) => {
    let pass = new PassThrough()
    let waiting = streams.length
    for (let stream of streams) {
        pass = stream.pipe(pass, {end: false})
        stream.once('end', () => --waiting === 0 && pass.emit('end'))
    }
    return pass
}


export const capitalizeFirstLetter = (string: string): string => string.charAt(0).toUpperCase() + string.slice(1)

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}