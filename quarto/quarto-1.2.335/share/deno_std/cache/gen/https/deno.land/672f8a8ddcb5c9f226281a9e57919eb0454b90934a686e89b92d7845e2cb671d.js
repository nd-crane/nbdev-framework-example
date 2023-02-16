// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a tuple of two arrays with the first one containing all elements in the given array that match the given predicate
 * and the second one containing all that do not
 *
 * Example:
 *
 * ```ts
 * import { partition } from "https://deno.land/std@$STD_VERSION/collections/partition.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 5, 6, 7, 8, 9 ]
 * const [ even, odd ] = partition(numbers, it => it % 2 == 0)
 *
 * assertEquals(even, [ 6, 8 ])
 * assertEquals(odd, [ 5, 7, 9 ])
 * ```
 */ export function partition(array, predicate) {
    const matches = [];
    const rest = [];
    for (const element of array){
        if (predicate(element)) {
            matches.push(element);
        } else {
            rest.push(element);
        }
    }
    return [
        matches,
        rest
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3BhcnRpdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFJldHVybnMgYSB0dXBsZSBvZiB0d28gYXJyYXlzIHdpdGggdGhlIGZpcnN0IG9uZSBjb250YWluaW5nIGFsbCBlbGVtZW50cyBpbiB0aGUgZ2l2ZW4gYXJyYXkgdGhhdCBtYXRjaCB0aGUgZ2l2ZW4gcHJlZGljYXRlXG4gKiBhbmQgdGhlIHNlY29uZCBvbmUgY29udGFpbmluZyBhbGwgdGhhdCBkbyBub3RcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJ0aXRpb24gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9wYXJ0aXRpb24udHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGNvbnN0IG51bWJlcnMgPSBbIDUsIDYsIDcsIDgsIDkgXVxuICogY29uc3QgWyBldmVuLCBvZGQgXSA9IHBhcnRpdGlvbihudW1iZXJzLCBpdCA9PiBpdCAlIDIgPT0gMClcbiAqXG4gKiBhc3NlcnRFcXVhbHMoZXZlbiwgWyA2LCA4IF0pXG4gKiBhc3NlcnRFcXVhbHMob2RkLCBbIDUsIDcsIDkgXSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uPFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBwcmVkaWNhdGU6IChlbDogVCkgPT4gYm9vbGVhbixcbik6IFtUW10sIFRbXV0ge1xuICBjb25zdCBtYXRjaGVzOiBBcnJheTxUPiA9IFtdO1xuICBjb25zdCByZXN0OiBBcnJheTxUPiA9IFtdO1xuXG4gIGZvciAoY29uc3QgZWxlbWVudCBvZiBhcnJheSkge1xuICAgIGlmIChwcmVkaWNhdGUoZWxlbWVudCkpIHtcbiAgICAgIG1hdGNoZXMucHVzaChlbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdC5wdXNoKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbbWF0Y2hlcywgcmVzdF07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7OztDQWdCQyxHQUNELE9BQU8sU0FBUyxTQUFTLENBQ3ZCLEtBQW1CLEVBQ25CLFNBQTZCLEVBQ2pCO0lBQ1osTUFBTSxPQUFPLEdBQWEsRUFBRSxBQUFDO0lBQzdCLE1BQU0sSUFBSSxHQUFhLEVBQUUsQUFBQztJQUUxQixLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBRTtRQUMzQixJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN0QixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hCLE9BQU87WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JCLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTztRQUFDLE9BQU87UUFBRSxJQUFJO0tBQUMsQ0FBQztBQUN6QixDQUFDIn0=