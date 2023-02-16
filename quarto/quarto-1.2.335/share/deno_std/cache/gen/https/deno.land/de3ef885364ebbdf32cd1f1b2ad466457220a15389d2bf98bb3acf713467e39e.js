// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { randomInteger } from "./_utils.ts";
/**
 * Returns a random element from the given array.
 *
 * Example:
 *
 * ```ts
 * import { sample } from "https://deno.land/std@$STD_VERSION/collections/sample.ts"
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [1, 2, 3, 4];
 * const random = sample(numbers);
 *
 * assert(numbers.includes(random as number));
 * ```
 */ export function sample(array) {
    const length = array.length;
    return length ? array[randomInteger(0, length - 1)] : undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3NhbXBsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyByYW5kb21JbnRlZ2VyIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5cbi8qKlxuICogUmV0dXJucyBhIHJhbmRvbSBlbGVtZW50IGZyb20gdGhlIGdpdmVuIGFycmF5LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHNhbXBsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL3NhbXBsZS50c1wiXG4gKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBudW1iZXJzID0gWzEsIDIsIDMsIDRdO1xuICogY29uc3QgcmFuZG9tID0gc2FtcGxlKG51bWJlcnMpO1xuICpcbiAqIGFzc2VydChudW1iZXJzLmluY2x1ZGVzKHJhbmRvbSBhcyBudW1iZXIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlPFQ+KGFycmF5OiByZWFkb25seSBUW10pOiBUIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICByZXR1cm4gbGVuZ3RoID8gYXJyYXlbcmFuZG9tSW50ZWdlcigwLCBsZW5ndGggLSAxKV0gOiB1bmRlZmluZWQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLGFBQWEsUUFBUSxhQUFhLENBQUM7QUFFNUM7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxDQUFJLEtBQW1CLEVBQWlCO0lBQzVELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLEFBQUM7SUFDNUIsT0FBTyxNQUFNLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ2xFLENBQUMifQ==