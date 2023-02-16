// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns the first element having the smallest value according to the provided comparator or undefined if there are no elements
 *
 * Example:
 *
 * ```ts
 * import { minWith } from "https://deno.land/std@$STD_VERSION/collections/min_with.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = ["Kim", "Anna", "John"];
 * const smallestName = minWith(people, (a, b) => a.length - b.length);
 *
 * assertEquals(smallestName, "Kim");
 * ```
 */ export function minWith(array, comparator) {
    let min = undefined;
    let isFirst = true;
    for (const current of array){
        if (isFirst || comparator(current, min) < 0) {
            min = current;
            isFirst = false;
        }
    }
    return min;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21pbl93aXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgZWxlbWVudCBoYXZpbmcgdGhlIHNtYWxsZXN0IHZhbHVlIGFjY29yZGluZyB0byB0aGUgcHJvdmlkZWQgY29tcGFyYXRvciBvciB1bmRlZmluZWQgaWYgdGhlcmUgYXJlIG5vIGVsZW1lbnRzXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgbWluV2l0aCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL21pbl93aXRoLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBwZW9wbGUgPSBbXCJLaW1cIiwgXCJBbm5hXCIsIFwiSm9oblwiXTtcbiAqIGNvbnN0IHNtYWxsZXN0TmFtZSA9IG1pbldpdGgocGVvcGxlLCAoYSwgYikgPT4gYS5sZW5ndGggLSBiLmxlbmd0aCk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKHNtYWxsZXN0TmFtZSwgXCJLaW1cIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pbldpdGg8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIGNvbXBhcmF0b3I6IChhOiBULCBiOiBUKSA9PiBudW1iZXIsXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgbGV0IG1pbjogVCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IGlzRmlyc3QgPSB0cnVlO1xuXG4gIGZvciAoY29uc3QgY3VycmVudCBvZiBhcnJheSkge1xuICAgIGlmIChpc0ZpcnN0IHx8IGNvbXBhcmF0b3IoY3VycmVudCwgPFQ+IG1pbikgPCAwKSB7XG4gICAgICBtaW4gPSBjdXJyZW50O1xuICAgICAgaXNGaXJzdCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtaW47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Q0FjQyxHQUNELE9BQU8sU0FBUyxPQUFPLENBQ3JCLEtBQW1CLEVBQ25CLFVBQWtDLEVBQ25CO0lBQ2YsSUFBSSxHQUFHLEdBQWtCLFNBQVMsQUFBQztJQUNuQyxJQUFJLE9BQU8sR0FBRyxJQUFJLEFBQUM7SUFFbkIsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUU7UUFDM0IsSUFBSSxPQUFPLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDL0MsR0FBRyxHQUFHLE9BQU8sQ0FBQztZQUNkLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDbEIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==