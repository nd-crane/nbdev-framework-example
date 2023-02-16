// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new array that drops all elements in the given collection until the
 * last element that does not match the given predicate
 *
 * Example:
 * ```ts
 * import { dropLastWhile } from "https://deno.land/std@$STD_VERSION/collections/drop_last_while.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [22, 30, 44];
 *
 * const notFortyFour = dropLastWhile(numbers, i => i != 44);
 *
 * assertEquals(
 *   notFortyFour,
 *   [22, 30]
 * );
 * ```
 */ export function dropLastWhile(array, predicate) {
    let offset = array.length;
    while(0 < offset && predicate(array[offset - 1]))offset--;
    return array.slice(0, offset);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2Ryb3BfbGFzdF93aGlsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgYXJyYXkgdGhhdCBkcm9wcyBhbGwgZWxlbWVudHMgaW4gdGhlIGdpdmVuIGNvbGxlY3Rpb24gdW50aWwgdGhlXG4gKiBsYXN0IGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGUgZ2l2ZW4gcHJlZGljYXRlXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkcm9wTGFzdFdoaWxlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY29sbGVjdGlvbnMvZHJvcF9sYXN0X3doaWxlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBudW1iZXJzID0gWzIyLCAzMCwgNDRdO1xuICpcbiAqIGNvbnN0IG5vdEZvcnR5Rm91ciA9IGRyb3BMYXN0V2hpbGUobnVtYmVycywgaSA9PiBpICE9IDQ0KTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIG5vdEZvcnR5Rm91cixcbiAqICAgWzIyLCAzMF1cbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRyb3BMYXN0V2hpbGU8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHByZWRpY2F0ZTogKGVsOiBUKSA9PiBib29sZWFuLFxuKTogVFtdIHtcbiAgbGV0IG9mZnNldCA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKDAgPCBvZmZzZXQgJiYgcHJlZGljYXRlKGFycmF5W29mZnNldCAtIDFdKSkgb2Zmc2V0LS07XG5cbiAgcmV0dXJuIGFycmF5LnNsaWNlKDAsIG9mZnNldCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBa0JDLEdBQ0QsT0FBTyxTQUFTLGFBQWEsQ0FDM0IsS0FBbUIsRUFDbkIsU0FBNkIsRUFDeEI7SUFDTCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxBQUFDO0lBQzFCLE1BQU8sQ0FBQyxHQUFHLE1BQU0sSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFLE1BQU0sRUFBRSxDQUFDO0lBRTVELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDaEMsQ0FBQyJ9