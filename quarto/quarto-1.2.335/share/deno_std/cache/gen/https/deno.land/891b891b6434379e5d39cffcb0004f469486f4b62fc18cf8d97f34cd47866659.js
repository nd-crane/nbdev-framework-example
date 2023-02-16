// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new record with all entries of the given record except the ones that have a key that does not match the given predicate
 *
 * Example:
 *
 * ```ts
 * import { filterKeys } from "https://deno.land/std@$STD_VERSION/collections/filter_keys.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const menu = {
 *     'Salad': 11,
 *     'Soup': 8,
 *     'Pasta': 13,
 * }
 * const menuWithoutSalad = filterKeys(menu, it => it !== 'Salad')
 *
 * assertEquals(menuWithoutSalad, {
 *     'Soup': 8,
 *     'Pasta': 13,
 * })
 * ```
 */ export function filterKeys(record, predicate) {
    const ret = {};
    const keys = Object.keys(record);
    for (const key of keys){
        if (predicate(key)) {
            ret[key] = record[key];
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2ZpbHRlcl9rZXlzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyByZWNvcmQgd2l0aCBhbGwgZW50cmllcyBvZiB0aGUgZ2l2ZW4gcmVjb3JkIGV4Y2VwdCB0aGUgb25lcyB0aGF0IGhhdmUgYSBrZXkgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGUgZ2l2ZW4gcHJlZGljYXRlXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZmlsdGVyS2V5cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2ZpbHRlcl9rZXlzLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBtZW51ID0ge1xuICogICAgICdTYWxhZCc6IDExLFxuICogICAgICdTb3VwJzogOCxcbiAqICAgICAnUGFzdGEnOiAxMyxcbiAqIH1cbiAqIGNvbnN0IG1lbnVXaXRob3V0U2FsYWQgPSBmaWx0ZXJLZXlzKG1lbnUsIGl0ID0+IGl0ICE9PSAnU2FsYWQnKVxuICpcbiAqIGFzc2VydEVxdWFscyhtZW51V2l0aG91dFNhbGFkLCB7XG4gKiAgICAgJ1NvdXAnOiA4LFxuICogICAgICdQYXN0YSc6IDEzLFxuICogfSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyS2V5czxUPihcbiAgcmVjb3JkOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBUPj4sXG4gIHByZWRpY2F0ZTogKGtleTogc3RyaW5nKSA9PiBib29sZWFuLFxuKTogUmVjb3JkPHN0cmluZywgVD4ge1xuICBjb25zdCByZXQ6IFJlY29yZDxzdHJpbmcsIFQ+ID0ge307XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhyZWNvcmQpO1xuXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICBpZiAocHJlZGljYXRlKGtleSkpIHtcbiAgICAgIHJldFtrZXldID0gcmVjb3JkW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQkMsR0FDRCxPQUFPLFNBQVMsVUFBVSxDQUN4QixNQUFtQyxFQUNuQyxTQUFtQyxFQUNoQjtJQUNuQixNQUFNLEdBQUcsR0FBc0IsRUFBRSxBQUFDO0lBQ2xDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEFBQUM7SUFFakMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUU7UUFDdEIsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9