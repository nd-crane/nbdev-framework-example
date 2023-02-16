// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns an array excluding all given values.
 *
 * Example:
 *
 * ```ts
 * import { withoutAll } from "https://deno.land/std@$STD_VERSION/collections/without_all.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);
 *
 * assertEquals(withoutList, [3]);
 * ```
 */ export function withoutAll(array, values) {
    const toExclude = new Set(values);
    return array.filter((it)=>!toExclude.has(it));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3dpdGhvdXRfYWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBleGNsdWRpbmcgYWxsIGdpdmVuIHZhbHVlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB3aXRob3V0QWxsIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY29sbGVjdGlvbnMvd2l0aG91dF9hbGwudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGNvbnN0IHdpdGhvdXRMaXN0ID0gd2l0aG91dEFsbChbMiwgMSwgMiwgM10sIFsxLCAyXSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKHdpdGhvdXRMaXN0LCBbM10pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRob3V0QWxsPFQ+KGFycmF5OiByZWFkb25seSBUW10sIHZhbHVlczogcmVhZG9ubHkgVFtdKTogVFtdIHtcbiAgY29uc3QgdG9FeGNsdWRlID0gbmV3IFNldCh2YWx1ZXMpO1xuICByZXR1cm4gYXJyYXkuZmlsdGVyKChpdCkgPT4gIXRvRXhjbHVkZS5oYXMoaXQpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLFNBQVMsVUFBVSxDQUFJLEtBQW1CLEVBQUUsTUFBb0IsRUFBTztJQUM1RSxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQUFBQztJQUNsQyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQyJ9