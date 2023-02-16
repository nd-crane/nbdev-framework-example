// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns all distinct elements in the given array, preserving order by first occurrence
 *
 * Example:
 *
 * ```ts
 * import { distinct } from "https://deno.land/std@$STD_VERSION/collections/distinct.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 3, 2, 5, 2, 5 ]
 * const distinctNumbers = distinct(numbers)
 *
 * assertEquals(distinctNumbers, [ 3, 2, 5 ])
 * ```
 */ export function distinct(array) {
    const set = new Set(array);
    return Array.from(set);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2Rpc3RpbmN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhbGwgZGlzdGluY3QgZWxlbWVudHMgaW4gdGhlIGdpdmVuIGFycmF5LCBwcmVzZXJ2aW5nIG9yZGVyIGJ5IGZpcnN0IG9jY3VycmVuY2VcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkaXN0aW5jdCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2Rpc3RpbmN0LnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBudW1iZXJzID0gWyAzLCAyLCA1LCAyLCA1IF1cbiAqIGNvbnN0IGRpc3RpbmN0TnVtYmVycyA9IGRpc3RpbmN0KG51bWJlcnMpXG4gKlxuICogYXNzZXJ0RXF1YWxzKGRpc3RpbmN0TnVtYmVycywgWyAzLCAyLCA1IF0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3RpbmN0PFQ+KGFycmF5OiByZWFkb25seSBUW10pOiBUW10ge1xuICBjb25zdCBzZXQgPSBuZXcgU2V0KGFycmF5KTtcblxuICByZXR1cm4gQXJyYXkuZnJvbShzZXQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsUUFBUSxDQUFJLEtBQW1CLEVBQU87SUFDcEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEFBQUM7SUFFM0IsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUMifQ==