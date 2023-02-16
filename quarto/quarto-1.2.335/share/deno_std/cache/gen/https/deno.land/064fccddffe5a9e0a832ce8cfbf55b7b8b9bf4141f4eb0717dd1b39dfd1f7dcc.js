// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given transformer to all values in the given record and returns a new record containing the resulting keys
 * associated to the last value that produced them.
 *
 * Example:
 *
 * ```ts
 * import { mapValues } from "https://deno.land/std@$STD_VERSION/collections/map_values.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const usersById = {
 *     'a5ec': { name: 'Mischa' },
 *     'de4f': { name: 'Kim' },
 * }
 * const namesById = mapValues(usersById, it => it.name)
 *
 * assertEquals(namesById, {
 *     'a5ec': 'Mischa',
 *     'de4f': 'Kim',
 * });
 * ```
 */ export function mapValues(record, transformer) {
    const ret = {};
    const entries = Object.entries(record);
    for (const [key, value] of entries){
        const mappedValue = transformer(value);
        ret[key] = mappedValue;
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21hcF92YWx1ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBnaXZlbiB0cmFuc2Zvcm1lciB0byBhbGwgdmFsdWVzIGluIHRoZSBnaXZlbiByZWNvcmQgYW5kIHJldHVybnMgYSBuZXcgcmVjb3JkIGNvbnRhaW5pbmcgdGhlIHJlc3VsdGluZyBrZXlzXG4gKiBhc3NvY2lhdGVkIHRvIHRoZSBsYXN0IHZhbHVlIHRoYXQgcHJvZHVjZWQgdGhlbS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBtYXBWYWx1ZXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9tYXBfdmFsdWVzLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCB1c2Vyc0J5SWQgPSB7XG4gKiAgICAgJ2E1ZWMnOiB7IG5hbWU6ICdNaXNjaGEnIH0sXG4gKiAgICAgJ2RlNGYnOiB7IG5hbWU6ICdLaW0nIH0sXG4gKiB9XG4gKiBjb25zdCBuYW1lc0J5SWQgPSBtYXBWYWx1ZXModXNlcnNCeUlkLCBpdCA9PiBpdC5uYW1lKVxuICpcbiAqIGFzc2VydEVxdWFscyhuYW1lc0J5SWQsIHtcbiAqICAgICAnYTVlYyc6ICdNaXNjaGEnLFxuICogICAgICdkZTRmJzogJ0tpbScsXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwVmFsdWVzPFQsIE8+KFxuICByZWNvcmQ6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIFQ+PixcbiAgdHJhbnNmb3JtZXI6ICh2YWx1ZTogVCkgPT4gTyxcbik6IFJlY29yZDxzdHJpbmcsIE8+IHtcbiAgY29uc3QgcmV0OiBSZWNvcmQ8c3RyaW5nLCBPPiA9IHt9O1xuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMocmVjb3JkKTtcblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBlbnRyaWVzKSB7XG4gICAgY29uc3QgbWFwcGVkVmFsdWUgPSB0cmFuc2Zvcm1lcih2YWx1ZSk7XG5cbiAgICByZXRba2V5XSA9IG1hcHBlZFZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQkMsR0FDRCxPQUFPLFNBQVMsU0FBUyxDQUN2QixNQUFtQyxFQUNuQyxXQUE0QixFQUNUO0lBQ25CLE1BQU0sR0FBRyxHQUFzQixFQUFFLEFBQUM7SUFDbEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQUFBQztJQUV2QyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFFO1FBQ2xDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQUFBQztRQUV2QyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==