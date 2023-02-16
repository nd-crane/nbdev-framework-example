// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns all elements in the given array after the last element that does not
 * match the given predicate.
 *
 * Example:
 * ```ts
 * import { takeLastWhile } from "https://deno.land/std@$STD_VERSION/collections/take_last_while.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const arr = [1, 2, 3, 4, 5, 6];
 *
 * assertEquals(
 *   takeLastWhile(arr, (i) => i > 4),
 *   [5, 6],
 * );
 * ```
 */ export function takeLastWhile(array, predicate) {
    let offset = array.length;
    while(0 < offset && predicate(array[offset - 1]))offset--;
    return array.slice(offset, array.length);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3Rha2VfbGFzdF93aGlsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFJldHVybnMgYWxsIGVsZW1lbnRzIGluIHRoZSBnaXZlbiBhcnJheSBhZnRlciB0aGUgbGFzdCBlbGVtZW50IHRoYXQgZG9lcyBub3RcbiAqIG1hdGNoIHRoZSBnaXZlbiBwcmVkaWNhdGUuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0YWtlTGFzdFdoaWxlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY29sbGVjdGlvbnMvdGFrZV9sYXN0X3doaWxlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBhcnIgPSBbMSwgMiwgMywgNCwgNSwgNl07XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICB0YWtlTGFzdFdoaWxlKGFyciwgKGkpID0+IGkgPiA0KSxcbiAqICAgWzUsIDZdLFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGFrZUxhc3RXaGlsZTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgcHJlZGljYXRlOiAoZWw6IFQpID0+IGJvb2xlYW4sXG4pOiBUW10ge1xuICBsZXQgb2Zmc2V0ID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAoMCA8IG9mZnNldCAmJiBwcmVkaWNhdGUoYXJyYXlbb2Zmc2V0IC0gMV0pKSBvZmZzZXQtLTtcblxuICByZXR1cm4gYXJyYXkuc2xpY2Uob2Zmc2V0LCBhcnJheS5sZW5ndGgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsYUFBYSxDQUMzQixLQUFtQixFQUNuQixTQUE2QixFQUN4QjtJQUNMLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLEFBQUM7SUFDMUIsTUFBTyxDQUFDLEdBQUcsTUFBTSxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsTUFBTSxFQUFFLENBQUM7SUFFNUQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsQ0FBQyJ9