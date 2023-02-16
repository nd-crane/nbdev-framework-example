// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given selector to all elements of the given collection and
 * returns the min value of all elements. If an empty array is provided the
 * function will return undefined
 *
 * Example:
 *
 * ```ts
 * import { minOf } from "https://deno.land/std@$STD_VERSION/collections/min_of.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const inventory = [
 *      { name: "mustard", count: 2 },
 *      { name: "soy", count: 4 },
 *      { name: "tomato", count: 32 },
 * ];
 * const minCount = minOf(inventory, (i) => i.count);
 *
 * assertEquals(minCount, 2);
 * ```
 */ export function minOf(array, selector) {
    let minimumValue = undefined;
    for (const i of array){
        const currentValue = selector(i);
        if (minimumValue === undefined || currentValue < minimumValue) {
            minimumValue = currentValue;
            continue;
        }
        if (Number.isNaN(currentValue)) {
            return currentValue;
        }
    }
    return minimumValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21pbl9vZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGdpdmVuIHNlbGVjdG9yIHRvIGFsbCBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBhbmRcbiAqIHJldHVybnMgdGhlIG1pbiB2YWx1ZSBvZiBhbGwgZWxlbWVudHMuIElmIGFuIGVtcHR5IGFycmF5IGlzIHByb3ZpZGVkIHRoZVxuICogZnVuY3Rpb24gd2lsbCByZXR1cm4gdW5kZWZpbmVkXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgbWluT2YgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9taW5fb2YudHNcIlxuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCJcbiAqXG4gKiBjb25zdCBpbnZlbnRvcnkgPSBbXG4gKiAgICAgIHsgbmFtZTogXCJtdXN0YXJkXCIsIGNvdW50OiAyIH0sXG4gKiAgICAgIHsgbmFtZTogXCJzb3lcIiwgY291bnQ6IDQgfSxcbiAqICAgICAgeyBuYW1lOiBcInRvbWF0b1wiLCBjb3VudDogMzIgfSxcbiAqIF07XG4gKiBjb25zdCBtaW5Db3VudCA9IG1pbk9mKGludmVudG9yeSwgKGkpID0+IGkuY291bnQpO1xuICpcbiAqIGFzc2VydEVxdWFscyhtaW5Db3VudCwgMik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pbk9mPFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBudW1iZXIsXG4pOiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaW5PZjxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gYmlnaW50LFxuKTogYmlnaW50IHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gbWluT2Y8VCwgUyBleHRlbmRzICgoZWw6IFQpID0+IG51bWJlcikgfCAoKGVsOiBUKSA9PiBiaWdpbnQpPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IFMsXG4pOiBSZXR1cm5UeXBlPFM+IHwgdW5kZWZpbmVkIHtcbiAgbGV0IG1pbmltdW1WYWx1ZTogUmV0dXJuVHlwZTxTPiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICBmb3IgKGNvbnN0IGkgb2YgYXJyYXkpIHtcbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBzZWxlY3RvcihpKSBhcyBSZXR1cm5UeXBlPFM+O1xuXG4gICAgaWYgKG1pbmltdW1WYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGN1cnJlbnRWYWx1ZSA8IG1pbmltdW1WYWx1ZSkge1xuICAgICAgbWluaW11bVZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKE51bWJlci5pc05hTihjdXJyZW50VmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3VycmVudFZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtaW5pbXVtVmFsdWU7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQkMsR0FDRCxBQVVBLE9BQU8sU0FBUyxLQUFLLENBQ25CLEtBQW1CLEVBQ25CLFFBQVcsRUFDZ0I7SUFDM0IsSUFBSSxZQUFZLEdBQThCLFNBQVMsQUFBQztJQUV4RCxLQUFLLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBRTtRQUNyQixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEFBQWlCLEFBQUM7UUFFbEQsSUFBSSxZQUFZLEtBQUssU0FBUyxJQUFJLFlBQVksR0FBRyxZQUFZLEVBQUU7WUFDN0QsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUM1QixTQUFTO1FBQ1gsQ0FBQztRQUVELElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUM5QixPQUFPLFlBQVksQ0FBQztRQUN0QixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMifQ==