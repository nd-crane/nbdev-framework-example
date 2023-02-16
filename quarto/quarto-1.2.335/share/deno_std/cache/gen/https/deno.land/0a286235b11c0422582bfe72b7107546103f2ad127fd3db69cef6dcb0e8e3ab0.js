// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new record with all entries of the given record except the ones that do not match the given predicate
 *
 * Example:
 *
 * ```ts
 * import { filterEntries } from "https://deno.land/std@$STD_VERSION/collections/filter_entries.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const menu = {
 *     'Salad': 11,
 *     'Soup': 8,
 *     'Pasta': 13,
 * } as const;
 * const myOptions = filterEntries(menu,
 *     ([ item, price ]) => item !== 'Pasta' && price < 10,
 * )
 *
 * assertEquals(myOptions, {
 *     'Soup': 8,
 * })
 * ```
 */ export function filterEntries(record, predicate) {
    const ret = {};
    const entries = Object.entries(record);
    for (const [key, value] of entries){
        if (predicate([
            key,
            value
        ])) {
            ret[key] = value;
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2ZpbHRlcl9lbnRyaWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyByZWNvcmQgd2l0aCBhbGwgZW50cmllcyBvZiB0aGUgZ2l2ZW4gcmVjb3JkIGV4Y2VwdCB0aGUgb25lcyB0aGF0IGRvIG5vdCBtYXRjaCB0aGUgZ2l2ZW4gcHJlZGljYXRlXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZmlsdGVyRW50cmllcyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2ZpbHRlcl9lbnRyaWVzLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBtZW51ID0ge1xuICogICAgICdTYWxhZCc6IDExLFxuICogICAgICdTb3VwJzogOCxcbiAqICAgICAnUGFzdGEnOiAxMyxcbiAqIH0gYXMgY29uc3Q7XG4gKiBjb25zdCBteU9wdGlvbnMgPSBmaWx0ZXJFbnRyaWVzKG1lbnUsXG4gKiAgICAgKFsgaXRlbSwgcHJpY2UgXSkgPT4gaXRlbSAhPT0gJ1Bhc3RhJyAmJiBwcmljZSA8IDEwLFxuICogKVxuICpcbiAqIGFzc2VydEVxdWFscyhteU9wdGlvbnMsIHtcbiAqICAgICAnU291cCc6IDgsXG4gKiB9KVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJFbnRyaWVzPFQ+KFxuICByZWNvcmQ6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIFQ+PixcbiAgcHJlZGljYXRlOiAoZW50cnk6IFtzdHJpbmcsIFRdKSA9PiBib29sZWFuLFxuKTogUmVjb3JkPHN0cmluZywgVD4ge1xuICBjb25zdCByZXQ6IFJlY29yZDxzdHJpbmcsIFQ+ID0ge307XG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhyZWNvcmQpO1xuXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGVudHJpZXMpIHtcbiAgICBpZiAocHJlZGljYXRlKFtrZXksIHZhbHVlXSkpIHtcbiAgICAgIHJldFtrZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0JDLEdBQ0QsT0FBTyxTQUFTLGFBQWEsQ0FDM0IsTUFBbUMsRUFDbkMsU0FBMEMsRUFDdkI7SUFDbkIsTUFBTSxHQUFHLEdBQXNCLEVBQUUsQUFBQztJQUNsQyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxBQUFDO0lBRXZDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUU7UUFDbEMsSUFBSSxTQUFTLENBQUM7WUFBQyxHQUFHO1lBQUUsS0FBSztTQUFDLENBQUMsRUFBRTtZQUMzQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ25CLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIn0=