// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns all elements in the given collection until the first element that does not match the given predicate.
 *
 * Example:
 * ```ts
 * import { takeWhile } from "https://deno.land/std@$STD_VERSION/collections/take_while.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const arr = [1, 2, 3, 4, 5, 6];
 *
 * assertEquals(
 *   takeWhile(arr, (i) => i !== 4),
 *   [1, 2, 3],
 * );
 * ```
 */ export function takeWhile(array, predicate) {
    let offset = 0;
    const length = array.length;
    while(length > offset && predicate(array[offset])){
        offset++;
    }
    return array.slice(0, offset);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3Rha2Vfd2hpbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBSZXR1cm5zIGFsbCBlbGVtZW50cyBpbiB0aGUgZ2l2ZW4gY29sbGVjdGlvbiB1bnRpbCB0aGUgZmlyc3QgZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZSBnaXZlbiBwcmVkaWNhdGUuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0YWtlV2hpbGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy90YWtlX3doaWxlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBhcnIgPSBbMSwgMiwgMywgNCwgNSwgNl07XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICB0YWtlV2hpbGUoYXJyLCAoaSkgPT4gaSAhPT0gNCksXG4gKiAgIFsxLCAyLCAzXSxcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRha2VXaGlsZTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgcHJlZGljYXRlOiAoZWw6IFQpID0+IGJvb2xlYW4sXG4pOiBUW10ge1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgY29uc3QgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlIChsZW5ndGggPiBvZmZzZXQgJiYgcHJlZGljYXRlKGFycmF5W29mZnNldF0pKSB7XG4gICAgb2Zmc2V0Kys7XG4gIH1cblxuICByZXR1cm4gYXJyYXkuc2xpY2UoMCwgb2Zmc2V0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxTQUFTLENBQ3ZCLEtBQW1CLEVBQ25CLFNBQTZCLEVBQ3hCO0lBQ0wsSUFBSSxNQUFNLEdBQUcsQ0FBQyxBQUFDO0lBQ2YsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQUFBQztJQUU1QixNQUFPLE1BQU0sR0FBRyxNQUFNLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFFO1FBQ2xELE1BQU0sRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUVELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDaEMsQ0FBQyJ9