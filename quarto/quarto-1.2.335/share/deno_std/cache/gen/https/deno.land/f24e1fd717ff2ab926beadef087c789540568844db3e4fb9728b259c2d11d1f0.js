// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given selector to elements in the given array until a value is produced that is neither `null` nor `undefined` and returns that value
 * Returns `undefined` if no such value is produced
 *
 * Example:
 *
 * ```ts
 * import { firstNotNullishOf } from "https://deno.land/std@$STD_VERSION/collections/first_not_nullish_of.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const tables = [
 *     { number: 11, order: null },
 *     { number: 12, order: 'Soup' },
 *     { number: 13, order: 'Salad' },
 * ]
 * const nextOrder = firstNotNullishOf(tables, it => it.order)
 *
 * assertEquals(nextOrder, 'Soup')
 * ```
 */ export function firstNotNullishOf(array, selector) {
    for (const current of array){
        const selected = selector(current);
        if (selected !== null && selected !== undefined) {
            return selected;
        }
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2ZpcnN0X25vdF9udWxsaXNoX29mLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gc2VsZWN0b3IgdG8gZWxlbWVudHMgaW4gdGhlIGdpdmVuIGFycmF5IHVudGlsIGEgdmFsdWUgaXMgcHJvZHVjZWQgdGhhdCBpcyBuZWl0aGVyIGBudWxsYCBub3IgYHVuZGVmaW5lZGAgYW5kIHJldHVybnMgdGhhdCB2YWx1ZVxuICogUmV0dXJucyBgdW5kZWZpbmVkYCBpZiBubyBzdWNoIHZhbHVlIGlzIHByb2R1Y2VkXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZmlyc3ROb3ROdWxsaXNoT2YgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9maXJzdF9ub3RfbnVsbGlzaF9vZi50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgdGFibGVzID0gW1xuICogICAgIHsgbnVtYmVyOiAxMSwgb3JkZXI6IG51bGwgfSxcbiAqICAgICB7IG51bWJlcjogMTIsIG9yZGVyOiAnU291cCcgfSxcbiAqICAgICB7IG51bWJlcjogMTMsIG9yZGVyOiAnU2FsYWQnIH0sXG4gKiBdXG4gKiBjb25zdCBuZXh0T3JkZXIgPSBmaXJzdE5vdE51bGxpc2hPZih0YWJsZXMsIGl0ID0+IGl0Lm9yZGVyKVxuICpcbiAqIGFzc2VydEVxdWFscyhuZXh0T3JkZXIsICdTb3VwJylcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlyc3ROb3ROdWxsaXNoT2Y8VCwgTz4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoaXRlbTogVCkgPT4gTyB8IHVuZGVmaW5lZCB8IG51bGwsXG4pOiBOb25OdWxsYWJsZTxPPiB8IHVuZGVmaW5lZCB7XG4gIGZvciAoY29uc3QgY3VycmVudCBvZiBhcnJheSkge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gc2VsZWN0b3IoY3VycmVudCk7XG5cbiAgICBpZiAoc2VsZWN0ZWQgIT09IG51bGwgJiYgc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHNlbGVjdGVkIGFzIE5vbk51bGxhYmxlPE8+O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sU0FBUyxpQkFBaUIsQ0FDL0IsS0FBbUIsRUFDbkIsUUFBMkMsRUFDZjtJQUM1QixLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBRTtRQUMzQixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEFBQUM7UUFFbkMsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDL0MsT0FBTyxRQUFRLENBQW1CO1FBQ3BDLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyJ9