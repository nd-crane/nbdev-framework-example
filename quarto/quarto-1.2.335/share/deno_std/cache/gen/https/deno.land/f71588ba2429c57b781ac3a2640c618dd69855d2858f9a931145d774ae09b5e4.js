// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new array, containing all elements in the given array transformed using the given transformer, except the ones
 * that were transformed to `null` or `undefined`
 *
 * Example:
 *
 * ```ts
 * import { mapNotNullish } from "https://deno.land/std@$STD_VERSION/collections/map_not_nullish.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = [
 *     { middleName: null },
 *     { middleName: 'William' },
 *     { middleName: undefined },
 *     { middleName: 'Martha' },
 * ]
 * const foundMiddleNames = mapNotNullish(people, it => it.middleName)
 *
 * assertEquals(foundMiddleNames, [ 'William', 'Martha' ])
 * ```
 */ export function mapNotNullish(array, transformer) {
    const ret = [];
    for (const element of array){
        const transformedElement = transformer(element);
        if (transformedElement !== undefined && transformedElement !== null) {
            ret.push(transformedElement);
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21hcF9ub3RfbnVsbGlzaC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgYXJyYXksIGNvbnRhaW5pbmcgYWxsIGVsZW1lbnRzIGluIHRoZSBnaXZlbiBhcnJheSB0cmFuc2Zvcm1lZCB1c2luZyB0aGUgZ2l2ZW4gdHJhbnNmb3JtZXIsIGV4Y2VwdCB0aGUgb25lc1xuICogdGhhdCB3ZXJlIHRyYW5zZm9ybWVkIHRvIGBudWxsYCBvciBgdW5kZWZpbmVkYFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IG1hcE5vdE51bGxpc2ggfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9tYXBfbm90X251bGxpc2gudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGNvbnN0IHBlb3BsZSA9IFtcbiAqICAgICB7IG1pZGRsZU5hbWU6IG51bGwgfSxcbiAqICAgICB7IG1pZGRsZU5hbWU6ICdXaWxsaWFtJyB9LFxuICogICAgIHsgbWlkZGxlTmFtZTogdW5kZWZpbmVkIH0sXG4gKiAgICAgeyBtaWRkbGVOYW1lOiAnTWFydGhhJyB9LFxuICogXVxuICogY29uc3QgZm91bmRNaWRkbGVOYW1lcyA9IG1hcE5vdE51bGxpc2gocGVvcGxlLCBpdCA9PiBpdC5taWRkbGVOYW1lKVxuICpcbiAqIGFzc2VydEVxdWFscyhmb3VuZE1pZGRsZU5hbWVzLCBbICdXaWxsaWFtJywgJ01hcnRoYScgXSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwTm90TnVsbGlzaDxULCBPPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgdHJhbnNmb3JtZXI6IChlbDogVCkgPT4gTyxcbik6IE5vbk51bGxhYmxlPE8+W10ge1xuICBjb25zdCByZXQ6IE5vbk51bGxhYmxlPE8+W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgYXJyYXkpIHtcbiAgICBjb25zdCB0cmFuc2Zvcm1lZEVsZW1lbnQgPSB0cmFuc2Zvcm1lcihlbGVtZW50KTtcblxuICAgIGlmICh0cmFuc2Zvcm1lZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiB0cmFuc2Zvcm1lZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgIHJldC5wdXNoKHRyYW5zZm9ybWVkRWxlbWVudCBhcyBOb25OdWxsYWJsZTxPPik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxhQUFhLENBQzNCLEtBQW1CLEVBQ25CLFdBQXlCLEVBQ1A7SUFDbEIsTUFBTSxHQUFHLEdBQXFCLEVBQUUsQUFBQztJQUVqQyxLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBRTtRQUMzQixNQUFNLGtCQUFrQixHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQUFBQztRQUVoRCxJQUFJLGtCQUFrQixLQUFLLFNBQVMsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7WUFDbkUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBbUIsQ0FBQztRQUNqRCxDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9