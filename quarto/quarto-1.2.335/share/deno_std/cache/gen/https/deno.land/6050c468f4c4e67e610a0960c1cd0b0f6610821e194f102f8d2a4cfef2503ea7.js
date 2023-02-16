// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given selector to all elements of the given collection and
 * returns the max value of all elements. If an empty array is provided the
 * function will return undefined
 *
 * Example:
 *
 * ```ts
 * import { maxOf } from "https://deno.land/std@$STD_VERSION/collections/max_of.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const inventory = [
 *      { name: "mustard", count: 2 },
 *      { name: "soy", count: 4 },
 *      { name: "tomato", count: 32 },
 * ];
 * const maxCount = maxOf(inventory, (i) => i.count);
 *
 * assertEquals(maxCount, 32);
 * ```
 */ export function maxOf(array, selector) {
    let maximumValue = undefined;
    for (const i of array){
        const currentValue = selector(i);
        if (maximumValue === undefined || currentValue > maximumValue) {
            maximumValue = currentValue;
            continue;
        }
        if (Number.isNaN(currentValue)) {
            return currentValue;
        }
    }
    return maximumValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21heF9vZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGdpdmVuIHNlbGVjdG9yIHRvIGFsbCBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBhbmRcbiAqIHJldHVybnMgdGhlIG1heCB2YWx1ZSBvZiBhbGwgZWxlbWVudHMuIElmIGFuIGVtcHR5IGFycmF5IGlzIHByb3ZpZGVkIHRoZVxuICogZnVuY3Rpb24gd2lsbCByZXR1cm4gdW5kZWZpbmVkXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgbWF4T2YgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9tYXhfb2YudHNcIlxuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCJcbiAqXG4gKiBjb25zdCBpbnZlbnRvcnkgPSBbXG4gKiAgICAgIHsgbmFtZTogXCJtdXN0YXJkXCIsIGNvdW50OiAyIH0sXG4gKiAgICAgIHsgbmFtZTogXCJzb3lcIiwgY291bnQ6IDQgfSxcbiAqICAgICAgeyBuYW1lOiBcInRvbWF0b1wiLCBjb3VudDogMzIgfSxcbiAqIF07XG4gKiBjb25zdCBtYXhDb3VudCA9IG1heE9mKGludmVudG9yeSwgKGkpID0+IGkuY291bnQpO1xuICpcbiAqIGFzc2VydEVxdWFscyhtYXhDb3VudCwgMzIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXhPZjxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gbnVtYmVyLFxuKTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gbWF4T2Y8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoZWw6IFQpID0+IGJpZ2ludCxcbik6IGJpZ2ludCB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIG1heE9mPFQsIFMgZXh0ZW5kcyAoKGVsOiBUKSA9PiBudW1iZXIpIHwgKChlbDogVCkgPT4gYmlnaW50KT4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiBTLFxuKTogUmV0dXJuVHlwZTxTPiB8IHVuZGVmaW5lZCB7XG4gIGxldCBtYXhpbXVtVmFsdWU6IFJldHVyblR5cGU8Uz4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgZm9yIChjb25zdCBpIG9mIGFycmF5KSB7XG4gICAgY29uc3QgY3VycmVudFZhbHVlID0gc2VsZWN0b3IoaSkgYXMgUmV0dXJuVHlwZTxTPjtcblxuICAgIGlmIChtYXhpbXVtVmFsdWUgPT09IHVuZGVmaW5lZCB8fCBjdXJyZW50VmFsdWUgPiBtYXhpbXVtVmFsdWUpIHtcbiAgICAgIG1heGltdW1WYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChOdW1iZXIuaXNOYU4oY3VycmVudFZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWF4aW11bVZhbHVlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0JDLEdBQ0QsQUFVQSxPQUFPLFNBQVMsS0FBSyxDQUNuQixLQUFtQixFQUNuQixRQUFXLEVBQ2dCO0lBQzNCLElBQUksWUFBWSxHQUE4QixTQUFTLEFBQUM7SUFFeEQsS0FBSyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUU7UUFDckIsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxBQUFpQixBQUFDO1FBRWxELElBQUksWUFBWSxLQUFLLFNBQVMsSUFBSSxZQUFZLEdBQUcsWUFBWSxFQUFFO1lBQzdELFlBQVksR0FBRyxZQUFZLENBQUM7WUFDNUIsU0FBUztRQUNYLENBQUM7UUFFRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDOUIsT0FBTyxZQUFZLENBQUM7UUFDdEIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDIn0=