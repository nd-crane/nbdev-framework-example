// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Splits the given array into chunks of the given size and returns them
 *
 * Example:
 *
 * ```ts
 * import { chunk } from "https://deno.land/std@$STD_VERSION/collections/chunk.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const words = [ 'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consetetur', 'sadipscing' ]
 * const chunks = chunk(words, 3)
 *
 * assertEquals(chunks, [
 *     [ 'lorem', 'ipsum', 'dolor' ],
 *     [ 'sit', 'amet', 'consetetur' ],
 *     [ 'sadipscing' ],
 * ])
 * ```
 */ export function chunk(array, size) {
    if (size <= 0 || !Number.isInteger(size)) {
        throw new Error(`Expected size to be an integer greater than 0 but found ${size}`);
    }
    if (array.length === 0) {
        return [];
    }
    const ret = Array.from({
        length: Math.ceil(array.length / size)
    });
    let readIndex = 0;
    let writeIndex = 0;
    while(readIndex < array.length){
        ret[writeIndex] = array.slice(readIndex, readIndex + size);
        writeIndex += 1;
        readIndex += size;
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2NodW5rLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogU3BsaXRzIHRoZSBnaXZlbiBhcnJheSBpbnRvIGNodW5rcyBvZiB0aGUgZ2l2ZW4gc2l6ZSBhbmQgcmV0dXJucyB0aGVtXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY2h1bmsgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9jaHVuay50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3Qgd29yZHMgPSBbICdsb3JlbScsICdpcHN1bScsICdkb2xvcicsICdzaXQnLCAnYW1ldCcsICdjb25zZXRldHVyJywgJ3NhZGlwc2NpbmcnIF1cbiAqIGNvbnN0IGNodW5rcyA9IGNodW5rKHdvcmRzLCAzKVxuICpcbiAqIGFzc2VydEVxdWFscyhjaHVua3MsIFtcbiAqICAgICBbICdsb3JlbScsICdpcHN1bScsICdkb2xvcicgXSxcbiAqICAgICBbICdzaXQnLCAnYW1ldCcsICdjb25zZXRldHVyJyBdLFxuICogICAgIFsgJ3NhZGlwc2NpbmcnIF0sXG4gKiBdKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaHVuazxUPihhcnJheTogcmVhZG9ubHkgVFtdLCBzaXplOiBudW1iZXIpOiBUW11bXSB7XG4gIGlmIChzaXplIDw9IDAgfHwgIU51bWJlci5pc0ludGVnZXIoc2l6ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgc2l6ZSB0byBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwIGJ1dCBmb3VuZCAke3NpemV9YCxcbiAgICApO1xuICB9XG5cbiAgaWYgKGFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHJldCA9IEFycmF5LmZyb208VFtdPih7IGxlbmd0aDogTWF0aC5jZWlsKGFycmF5Lmxlbmd0aCAvIHNpemUpIH0pO1xuICBsZXQgcmVhZEluZGV4ID0gMDtcbiAgbGV0IHdyaXRlSW5kZXggPSAwO1xuXG4gIHdoaWxlIChyZWFkSW5kZXggPCBhcnJheS5sZW5ndGgpIHtcbiAgICByZXRbd3JpdGVJbmRleF0gPSBhcnJheS5zbGljZShyZWFkSW5kZXgsIHJlYWRJbmRleCArIHNpemUpO1xuXG4gICAgd3JpdGVJbmRleCArPSAxO1xuICAgIHJlYWRJbmRleCArPSBzaXplO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQkMsR0FDRCxPQUFPLFNBQVMsS0FBSyxDQUFJLEtBQW1CLEVBQUUsSUFBWSxFQUFTO0lBQ2pFLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FDYixDQUFDLHdEQUF3RCxFQUFFLElBQUksQ0FBQyxDQUFDLENBQ2xFLENBQUM7SUFDSixDQUFDO0lBRUQsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN0QixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFNO1FBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FBRSxDQUFDLEFBQUM7SUFDeEUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxBQUFDO0lBQ2xCLElBQUksVUFBVSxHQUFHLENBQUMsQUFBQztJQUVuQixNQUFPLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFFO1FBQy9CLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFFM0QsVUFBVSxJQUFJLENBQUMsQ0FBQztRQUNoQixTQUFTLElBQUksSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==