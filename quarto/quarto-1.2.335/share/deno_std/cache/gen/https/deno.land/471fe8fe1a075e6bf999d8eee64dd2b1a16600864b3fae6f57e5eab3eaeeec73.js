// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given transformer to all keys in the given record's entries and returns a new record containing the
 * transformed entries.
 *
 * If the transformed entries contain the same key multiple times, only the last one will appear in the returned record.
 *
 * Example:
 *
 * ```ts
 * import { mapKeys } from "https://deno.land/std@$STD_VERSION/collections/map_keys.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const counts = { a: 5, b: 3, c: 8 }
 *
 * assertEquals(mapKeys(counts, it => it.toUpperCase()), {
 *     A: 5,
 *     B: 3,
 *     C: 8,
 * })
 * ```
 */ export function mapKeys(record, transformer) {
    const ret = {};
    const keys = Object.keys(record);
    for (const key of keys){
        const mappedKey = transformer(key);
        ret[mappedKey] = record[key];
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21hcF9rZXlzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gdHJhbnNmb3JtZXIgdG8gYWxsIGtleXMgaW4gdGhlIGdpdmVuIHJlY29yZCdzIGVudHJpZXMgYW5kIHJldHVybnMgYSBuZXcgcmVjb3JkIGNvbnRhaW5pbmcgdGhlXG4gKiB0cmFuc2Zvcm1lZCBlbnRyaWVzLlxuICpcbiAqIElmIHRoZSB0cmFuc2Zvcm1lZCBlbnRyaWVzIGNvbnRhaW4gdGhlIHNhbWUga2V5IG11bHRpcGxlIHRpbWVzLCBvbmx5IHRoZSBsYXN0IG9uZSB3aWxsIGFwcGVhciBpbiB0aGUgcmV0dXJuZWQgcmVjb3JkLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IG1hcEtleXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9tYXBfa2V5cy50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgY291bnRzID0geyBhOiA1LCBiOiAzLCBjOiA4IH1cbiAqXG4gKiBhc3NlcnRFcXVhbHMobWFwS2V5cyhjb3VudHMsIGl0ID0+IGl0LnRvVXBwZXJDYXNlKCkpLCB7XG4gKiAgICAgQTogNSxcbiAqICAgICBCOiAzLFxuICogICAgIEM6IDgsXG4gKiB9KVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXBLZXlzPFQ+KFxuICByZWNvcmQ6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIFQ+PixcbiAgdHJhbnNmb3JtZXI6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nLFxuKTogUmVjb3JkPHN0cmluZywgVD4ge1xuICBjb25zdCByZXQ6IFJlY29yZDxzdHJpbmcsIFQ+ID0ge307XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhyZWNvcmQpO1xuXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICBjb25zdCBtYXBwZWRLZXkgPSB0cmFuc2Zvcm1lcihrZXkpO1xuXG4gICAgcmV0W21hcHBlZEtleV0gPSByZWNvcmRba2V5XTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQkMsR0FDRCxPQUFPLFNBQVMsT0FBTyxDQUNyQixNQUFtQyxFQUNuQyxXQUFvQyxFQUNqQjtJQUNuQixNQUFNLEdBQUcsR0FBc0IsRUFBRSxBQUFDO0lBQ2xDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEFBQUM7SUFFakMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUU7UUFDdEIsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxBQUFDO1FBRW5DLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9