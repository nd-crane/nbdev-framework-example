// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new record with all entries of the given record except the ones that have a value that does not match the given predicate
 *
 * Example:
 *
 * ```ts
 * import { filterValues } from "https://deno.land/std@$STD_VERSION/collections/filter_values.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * type Person = { age: number };
 *
 * const people: Record<string, Person> = {
 *     'Arnold': { age: 37 },
 *     'Sarah': { age: 7 },
 *     'Kim': { age: 23 },
 * };
 * const adults = filterValues(people, it => it.age >= 18)
 *
 * assertEquals(adults, {
 *     'Arnold': { age: 37 },
 *     'Kim': { age: 23 },
 * })
 * ```
 */ export function filterValues(record, predicate) {
    const ret = {};
    const entries = Object.entries(record);
    for (const [key, value] of entries){
        if (predicate(value)) {
            ret[key] = value;
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2ZpbHRlcl92YWx1ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHJlY29yZCB3aXRoIGFsbCBlbnRyaWVzIG9mIHRoZSBnaXZlbiByZWNvcmQgZXhjZXB0IHRoZSBvbmVzIHRoYXQgaGF2ZSBhIHZhbHVlIHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlIGdpdmVuIHByZWRpY2F0ZVxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGZpbHRlclZhbHVlcyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2ZpbHRlcl92YWx1ZXMudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIHR5cGUgUGVyc29uID0geyBhZ2U6IG51bWJlciB9O1xuICpcbiAqIGNvbnN0IHBlb3BsZTogUmVjb3JkPHN0cmluZywgUGVyc29uPiA9IHtcbiAqICAgICAnQXJub2xkJzogeyBhZ2U6IDM3IH0sXG4gKiAgICAgJ1NhcmFoJzogeyBhZ2U6IDcgfSxcbiAqICAgICAnS2ltJzogeyBhZ2U6IDIzIH0sXG4gKiB9O1xuICogY29uc3QgYWR1bHRzID0gZmlsdGVyVmFsdWVzKHBlb3BsZSwgaXQgPT4gaXQuYWdlID49IDE4KVxuICpcbiAqIGFzc2VydEVxdWFscyhhZHVsdHMsIHtcbiAqICAgICAnQXJub2xkJzogeyBhZ2U6IDM3IH0sXG4gKiAgICAgJ0tpbSc6IHsgYWdlOiAyMyB9LFxuICogfSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyVmFsdWVzPFQ+KFxuICByZWNvcmQ6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIFQ+PixcbiAgcHJlZGljYXRlOiAodmFsdWU6IFQpID0+IGJvb2xlYW4sXG4pOiBSZWNvcmQ8c3RyaW5nLCBUPiB7XG4gIGNvbnN0IHJldDogUmVjb3JkPHN0cmluZywgVD4gPSB7fTtcbiAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHJlY29yZCk7XG5cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZW50cmllcykge1xuICAgIGlmIChwcmVkaWNhdGUodmFsdWUpKSB7XG4gICAgICByZXRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkMsR0FDRCxPQUFPLFNBQVMsWUFBWSxDQUMxQixNQUFtQyxFQUNuQyxTQUFnQyxFQUNiO0lBQ25CLE1BQU0sR0FBRyxHQUFzQixFQUFFLEFBQUM7SUFDbEMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQUFBQztJQUV2QyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFFO1FBQ2xDLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDbkIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==