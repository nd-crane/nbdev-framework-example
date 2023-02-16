// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Builds N-tuples of elements from the given N arrays with matching indices, stopping when the smallest array's end is reached
 * Example:
 *
 * ```ts
 * import { zip } from "https://deno.land/std@$STD_VERSION/collections/zip.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 1, 2, 3, 4 ];
 * const letters = [ 'a', 'b', 'c', 'd' ];
 * const pairs = zip(numbers, letters);
 *
 * assertEquals(pairs, [
 *     [ 1, 'a' ],
 *     [ 2, 'b' ],
 *     [ 3, 'c' ],
 *     [ 4, 'd' ],
 * ]);
 * ```
 */ import { minOf } from "./min_of.ts";
export function zip(...arrays) {
    let minLength = minOf(arrays, (it)=>it.length);
    if (minLength === undefined) minLength = 0;
    const ret = new Array(minLength);
    for(let i = 0; i < minLength; i += 1){
        const arr = arrays.map((it)=>it[i]);
        ret[i] = arr;
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3ppcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEJ1aWxkcyBOLXR1cGxlcyBvZiBlbGVtZW50cyBmcm9tIHRoZSBnaXZlbiBOIGFycmF5cyB3aXRoIG1hdGNoaW5nIGluZGljZXMsIHN0b3BwaW5nIHdoZW4gdGhlIHNtYWxsZXN0IGFycmF5J3MgZW5kIGlzIHJlYWNoZWRcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHppcCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL3ppcC50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgbnVtYmVycyA9IFsgMSwgMiwgMywgNCBdO1xuICogY29uc3QgbGV0dGVycyA9IFsgJ2EnLCAnYicsICdjJywgJ2QnIF07XG4gKiBjb25zdCBwYWlycyA9IHppcChudW1iZXJzLCBsZXR0ZXJzKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMocGFpcnMsIFtcbiAqICAgICBbIDEsICdhJyBdLFxuICogICAgIFsgMiwgJ2InIF0sXG4gKiAgICAgWyAzLCAnYycgXSxcbiAqICAgICBbIDQsICdkJyBdLFxuICogXSk7XG4gKiBgYGBcbiAqL1xuXG5pbXBvcnQgeyBtaW5PZiB9IGZyb20gXCIuL21pbl9vZi50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gemlwPFQgZXh0ZW5kcyB1bmtub3duW10+KFxuICAuLi5hcnJheXM6IHsgW0sgaW4ga2V5b2YgVF06IFRbS11bXSB9XG4pOiBUW10ge1xuICBsZXQgbWluTGVuZ3RoID0gbWluT2YoYXJyYXlzLCAoaXQpID0+IGl0Lmxlbmd0aCk7XG4gIGlmIChtaW5MZW5ndGggPT09IHVuZGVmaW5lZCkgbWluTGVuZ3RoID0gMDtcblxuICBjb25zdCByZXQ6IFRbXSA9IG5ldyBBcnJheShtaW5MZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWluTGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjb25zdCBhcnIgPSBhcnJheXMubWFwKChpdCkgPT4gaXRbaV0pO1xuICAgIHJldFtpXSA9IGFyciBhcyBUO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJDLEdBRUQsU0FBUyxLQUFLLFFBQVEsYUFBYSxDQUFDO0FBRXBDLE9BQU8sU0FBUyxHQUFHLENBQ2pCLEdBQUcsTUFBTSxBQUE0QixFQUNoQztJQUNMLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxBQUFDO0lBQ2pELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRTNDLE1BQU0sR0FBRyxHQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxBQUFDO0lBRXRDLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBRTtRQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDO1FBQ3RDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEFBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIn0=