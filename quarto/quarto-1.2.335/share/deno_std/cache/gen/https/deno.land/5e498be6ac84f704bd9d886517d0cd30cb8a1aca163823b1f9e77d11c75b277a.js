// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new array that drops all elements in the given collection until the
 * first element that does not match the given predicate
 *
 * Example:
 *
 * ```ts
 * import { dropWhile } from "https://deno.land/std@$STD_VERSION/collections/drop_while.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 3, 2, 5, 2, 5 ]
 * const dropWhileNumbers = dropWhile(numbers, i => i !== 2)
 *
 * assertEquals(dropWhileNumbers, [2, 5, 2, 5 ])
 * ```
 */ export function dropWhile(array, predicate) {
    let offset = 0;
    const length = array.length;
    while(length > offset && predicate(array[offset])){
        offset++;
    }
    return array.slice(offset, length);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2Ryb3Bfd2hpbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGFycmF5IHRoYXQgZHJvcHMgYWxsIGVsZW1lbnRzIGluIHRoZSBnaXZlbiBjb2xsZWN0aW9uIHVudGlsIHRoZVxuICogZmlyc3QgZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZSBnaXZlbiBwcmVkaWNhdGVcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBkcm9wV2hpbGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9kcm9wX3doaWxlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBudW1iZXJzID0gWyAzLCAyLCA1LCAyLCA1IF1cbiAqIGNvbnN0IGRyb3BXaGlsZU51bWJlcnMgPSBkcm9wV2hpbGUobnVtYmVycywgaSA9PiBpICE9PSAyKVxuICpcbiAqIGFzc2VydEVxdWFscyhkcm9wV2hpbGVOdW1iZXJzLCBbMiwgNSwgMiwgNSBdKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkcm9wV2hpbGU8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHByZWRpY2F0ZTogKGVsOiBUKSA9PiBib29sZWFuLFxuKTogVFtdIHtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGNvbnN0IGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAobGVuZ3RoID4gb2Zmc2V0ICYmIHByZWRpY2F0ZShhcnJheVtvZmZzZXRdKSkge1xuICAgIG9mZnNldCsrO1xuICB9XG5cbiAgcmV0dXJuIGFycmF5LnNsaWNlKG9mZnNldCwgbGVuZ3RoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxTQUFTLENBQ3ZCLEtBQW1CLEVBQ25CLFNBQTZCLEVBQ3hCO0lBQ0wsSUFBSSxNQUFNLEdBQUcsQ0FBQyxBQUFDO0lBQ2YsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQUFBQztJQUU1QixNQUFPLE1BQU0sR0FBRyxNQUFNLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFFO1FBQ2xELE1BQU0sRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUVELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDckMsQ0FBQyJ9