// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given transformer to all entries in the given record and returns a new record containing the results
 *
 * Example:
 *
 * ```ts
 * import { mapEntries } from "https://deno.land/std@$STD_VERSION/collections/map_entries.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const usersById = {
 *     'a2e': { name: 'Kim', age: 22 },
 *     'dfe': { name: 'Anna', age: 31 },
 *     '34b': { name: 'Tim', age: 58 },
 * } as const;
 *
 * const agesByNames = mapEntries(usersById,
 *     ([ id, { name, age } ]) => [ name, age ],
 * )
 *
 * assertEquals(agesByNames, {
 *     'Kim': 22,
 *     'Anna': 31,
 *     'Tim': 58,
 * })
 * ```
 */ export function mapEntries(record, transformer) {
    const ret = {};
    const entries = Object.entries(record);
    for (const entry of entries){
        const [mappedKey, mappedValue] = transformer(entry);
        ret[mappedKey] = mappedValue;
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21hcF9lbnRyaWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gdHJhbnNmb3JtZXIgdG8gYWxsIGVudHJpZXMgaW4gdGhlIGdpdmVuIHJlY29yZCBhbmQgcmV0dXJucyBhIG5ldyByZWNvcmQgY29udGFpbmluZyB0aGUgcmVzdWx0c1xuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IG1hcEVudHJpZXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9tYXBfZW50cmllcy50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgdXNlcnNCeUlkID0ge1xuICogICAgICdhMmUnOiB7IG5hbWU6ICdLaW0nLCBhZ2U6IDIyIH0sXG4gKiAgICAgJ2RmZSc6IHsgbmFtZTogJ0FubmEnLCBhZ2U6IDMxIH0sXG4gKiAgICAgJzM0Yic6IHsgbmFtZTogJ1RpbScsIGFnZTogNTggfSxcbiAqIH0gYXMgY29uc3Q7XG4gKlxuICogY29uc3QgYWdlc0J5TmFtZXMgPSBtYXBFbnRyaWVzKHVzZXJzQnlJZCxcbiAqICAgICAoWyBpZCwgeyBuYW1lLCBhZ2UgfSBdKSA9PiBbIG5hbWUsIGFnZSBdLFxuICogKVxuICpcbiAqIGFzc2VydEVxdWFscyhhZ2VzQnlOYW1lcywge1xuICogICAgICdLaW0nOiAyMixcbiAqICAgICAnQW5uYSc6IDMxLFxuICogICAgICdUaW0nOiA1OCxcbiAqIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcEVudHJpZXM8VCwgTz4oXG4gIHJlY29yZDogUmVhZG9ubHk8UmVjb3JkPHN0cmluZywgVD4+LFxuICB0cmFuc2Zvcm1lcjogKGVudHJ5OiBbc3RyaW5nLCBUXSkgPT4gW3N0cmluZywgT10sXG4pOiBSZWNvcmQ8c3RyaW5nLCBPPiB7XG4gIGNvbnN0IHJldDogUmVjb3JkPHN0cmluZywgTz4gPSB7fTtcbiAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHJlY29yZCk7XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgY29uc3QgW21hcHBlZEtleSwgbWFwcGVkVmFsdWVdID0gdHJhbnNmb3JtZXIoZW50cnkpO1xuXG4gICAgcmV0W21hcHBlZEtleV0gPSBtYXBwZWRWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXlCQyxHQUNELE9BQU8sU0FBUyxVQUFVLENBQ3hCLE1BQW1DLEVBQ25DLFdBQWdELEVBQzdCO0lBQ25CLE1BQU0sR0FBRyxHQUFzQixFQUFFLEFBQUM7SUFDbEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQUFBQztJQUV2QyxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBRTtRQUMzQixNQUFNLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQUFBQztRQUVwRCxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsV0FBVyxDQUFDO0lBQy9CLENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==