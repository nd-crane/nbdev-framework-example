// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given selector to each element in the given array, returning a Record containing the results as keys
 * and all values that produced that key as values.
 *
 * Example:
 *
 * ```ts
 * import { groupBy } from "https://deno.land/std@$STD_VERSION/collections/group_by.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * type Person = {
 *   name: string;
 * };
 *
 * const people: Person[] = [
 *     { name: 'Anna' },
 *     { name: 'Arnold' },
 *     { name: 'Kim' },
 * ];
 * const peopleByFirstLetter = groupBy(people, it => it.name.charAt(0))
 *
 * assertEquals(peopleByFirstLetter, {
 *     'A': [ { name: 'Anna' }, { name: 'Arnold' } ],
 *     'K': [ { name: 'Kim' } ],
 * })
 * ```
 */ export function groupBy(array, selector) {
    const ret = {};
    for (const element of array){
        const key = selector(element);
        const arr = ret[key] ??= [];
        arr.push(element);
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2dyb3VwX2J5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gc2VsZWN0b3IgdG8gZWFjaCBlbGVtZW50IGluIHRoZSBnaXZlbiBhcnJheSwgcmV0dXJuaW5nIGEgUmVjb3JkIGNvbnRhaW5pbmcgdGhlIHJlc3VsdHMgYXMga2V5c1xuICogYW5kIGFsbCB2YWx1ZXMgdGhhdCBwcm9kdWNlZCB0aGF0IGtleSBhcyB2YWx1ZXMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZ3JvdXBCeSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2dyb3VwX2J5LnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiB0eXBlIFBlcnNvbiA9IHtcbiAqICAgbmFtZTogc3RyaW5nO1xuICogfTtcbiAqXG4gKiBjb25zdCBwZW9wbGU6IFBlcnNvbltdID0gW1xuICogICAgIHsgbmFtZTogJ0FubmEnIH0sXG4gKiAgICAgeyBuYW1lOiAnQXJub2xkJyB9LFxuICogICAgIHsgbmFtZTogJ0tpbScgfSxcbiAqIF07XG4gKiBjb25zdCBwZW9wbGVCeUZpcnN0TGV0dGVyID0gZ3JvdXBCeShwZW9wbGUsIGl0ID0+IGl0Lm5hbWUuY2hhckF0KDApKVxuICpcbiAqIGFzc2VydEVxdWFscyhwZW9wbGVCeUZpcnN0TGV0dGVyLCB7XG4gKiAgICAgJ0EnOiBbIHsgbmFtZTogJ0FubmEnIH0sIHsgbmFtZTogJ0Fybm9sZCcgfSBdLFxuICogICAgICdLJzogWyB7IG5hbWU6ICdLaW0nIH0gXSxcbiAqIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyb3VwQnk8VCwgSyBleHRlbmRzIHN0cmluZz4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoZWw6IFQpID0+IEssXG4pOiBQYXJ0aWFsPFJlY29yZDxLLCBUW10+PiB7XG4gIGNvbnN0IHJldDogUGFydGlhbDxSZWNvcmQ8SywgVFtdPj4gPSB7fTtcblxuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgYXJyYXkpIHtcbiAgICBjb25zdCBrZXkgPSBzZWxlY3RvcihlbGVtZW50KTtcbiAgICBjb25zdCBhcnIgPSByZXRba2V5XSA/Pz0gW10gYXMgVFtdO1xuICAgIGFyci5wdXNoKGVsZW1lbnQpO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBCQyxHQUNELE9BQU8sU0FBUyxPQUFPLENBQ3JCLEtBQW1CLEVBQ25CLFFBQXNCLEVBQ0c7SUFDekIsTUFBTSxHQUFHLEdBQTRCLEVBQUUsQUFBQztJQUV4QyxLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBRTtRQUMzQixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEFBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQUFBTyxBQUFDO1FBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9