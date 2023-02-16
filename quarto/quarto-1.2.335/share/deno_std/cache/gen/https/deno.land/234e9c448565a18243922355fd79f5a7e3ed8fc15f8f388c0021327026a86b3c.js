// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Builds a new Record using the given array as keys and choosing a value for each
 * key using the given selector. If any of two pairs would have the same value
 * the latest on will be used (overriding the ones before it).
 *
 * Example:
 *
 * ```ts
 * import { associateWith } from "https://deno.land/std@$STD_VERSION/collections/associate_with.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const names = [ 'Kim', 'Lara', 'Jonathan' ]
 * const namesToLength = associateWith(names, it => it.length)
 *
 * assertEquals(namesToLength, {
 *   'Kim': 3,
 *   'Lara': 4,
 *   'Jonathan': 8,
 * })
 * ```
 */ export function associateWith(array, selector) {
    const ret = {};
    for (const element of array){
        const selectedValue = selector(element);
        ret[element] = selectedValue;
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2Fzc29jaWF0ZV93aXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQnVpbGRzIGEgbmV3IFJlY29yZCB1c2luZyB0aGUgZ2l2ZW4gYXJyYXkgYXMga2V5cyBhbmQgY2hvb3NpbmcgYSB2YWx1ZSBmb3IgZWFjaFxuICoga2V5IHVzaW5nIHRoZSBnaXZlbiBzZWxlY3Rvci4gSWYgYW55IG9mIHR3byBwYWlycyB3b3VsZCBoYXZlIHRoZSBzYW1lIHZhbHVlXG4gKiB0aGUgbGF0ZXN0IG9uIHdpbGwgYmUgdXNlZCAob3ZlcnJpZGluZyB0aGUgb25lcyBiZWZvcmUgaXQpLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc29jaWF0ZVdpdGggfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9hc3NvY2lhdGVfd2l0aC50c1wiXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBuYW1lcyA9IFsgJ0tpbScsICdMYXJhJywgJ0pvbmF0aGFuJyBdXG4gKiBjb25zdCBuYW1lc1RvTGVuZ3RoID0gYXNzb2NpYXRlV2l0aChuYW1lcywgaXQgPT4gaXQubGVuZ3RoKVxuICpcbiAqIGFzc2VydEVxdWFscyhuYW1lc1RvTGVuZ3RoLCB7XG4gKiAgICdLaW0nOiAzLFxuICogICAnTGFyYSc6IDQsXG4gKiAgICdKb25hdGhhbic6IDgsXG4gKiB9KVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NvY2lhdGVXaXRoPFQ+KFxuICBhcnJheTogcmVhZG9ubHkgc3RyaW5nW10sXG4gIHNlbGVjdG9yOiAoa2V5OiBzdHJpbmcpID0+IFQsXG4pOiBSZWNvcmQ8c3RyaW5nLCBUPiB7XG4gIGNvbnN0IHJldDogUmVjb3JkPHN0cmluZywgVD4gPSB7fTtcblxuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgYXJyYXkpIHtcbiAgICBjb25zdCBzZWxlY3RlZFZhbHVlID0gc2VsZWN0b3IoZWxlbWVudCk7XG5cbiAgICByZXRbZWxlbWVudF0gPSBzZWxlY3RlZFZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxhQUFhLENBQzNCLEtBQXdCLEVBQ3hCLFFBQTRCLEVBQ1Q7SUFDbkIsTUFBTSxHQUFHLEdBQXNCLEVBQUUsQUFBQztJQUVsQyxLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBRTtRQUMzQixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEFBQUM7UUFFeEMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBQztJQUMvQixDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIn0=