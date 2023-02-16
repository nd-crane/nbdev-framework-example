// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { mapEntries } from "./map_entries.ts";
/**
 * Applies the given aggregator to each group in the given Grouping, returning the results together with the respective group keys
 *
 * ```ts
 * import { aggregateGroups } from "https://deno.land/std@$STD_VERSION/collections/aggregate_groups.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const foodProperties = {
 *     'Curry': [ 'spicy', 'vegan' ],
 *     'Omelette': [ 'creamy', 'vegetarian' ],
 * }
 * const descriptions = aggregateGroups(foodProperties,
 *     (current, key, first, acc) => {
 *         if (first)
 *             return `${key} is ${current}`
 *
 *         return `${acc} and ${current}`
 *     },
 * )
 *
 * assertEquals(descriptions, {
 *     'Curry': 'Curry is spicy and vegan',
 *     'Omelette': 'Omelette is creamy and vegetarian',
 * })
 * ```
 */ export function aggregateGroups(record, aggregator) {
    return mapEntries(record, ([key, values])=>[
            key,
            // Need the type assertions here because the reduce type does not support the type transition we need
            values.reduce((accumulator, current, currentIndex)=>aggregator(current, key, currentIndex === 0, accumulator), undefined), 
        ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2FnZ3JlZ2F0ZV9ncm91cHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgbWFwRW50cmllcyB9IGZyb20gXCIuL21hcF9lbnRyaWVzLnRzXCI7XG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gYWdncmVnYXRvciB0byBlYWNoIGdyb3VwIGluIHRoZSBnaXZlbiBHcm91cGluZywgcmV0dXJuaW5nIHRoZSByZXN1bHRzIHRvZ2V0aGVyIHdpdGggdGhlIHJlc3BlY3RpdmUgZ3JvdXAga2V5c1xuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhZ2dyZWdhdGVHcm91cHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9hZ2dyZWdhdGVfZ3JvdXBzLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBmb29kUHJvcGVydGllcyA9IHtcbiAqICAgICAnQ3VycnknOiBbICdzcGljeScsICd2ZWdhbicgXSxcbiAqICAgICAnT21lbGV0dGUnOiBbICdjcmVhbXknLCAndmVnZXRhcmlhbicgXSxcbiAqIH1cbiAqIGNvbnN0IGRlc2NyaXB0aW9ucyA9IGFnZ3JlZ2F0ZUdyb3Vwcyhmb29kUHJvcGVydGllcyxcbiAqICAgICAoY3VycmVudCwga2V5LCBmaXJzdCwgYWNjKSA9PiB7XG4gKiAgICAgICAgIGlmIChmaXJzdClcbiAqICAgICAgICAgICAgIHJldHVybiBgJHtrZXl9IGlzICR7Y3VycmVudH1gXG4gKlxuICogICAgICAgICByZXR1cm4gYCR7YWNjfSBhbmQgJHtjdXJyZW50fWBcbiAqICAgICB9LFxuICogKVxuICpcbiAqIGFzc2VydEVxdWFscyhkZXNjcmlwdGlvbnMsIHtcbiAqICAgICAnQ3VycnknOiAnQ3VycnkgaXMgc3BpY3kgYW5kIHZlZ2FuJyxcbiAqICAgICAnT21lbGV0dGUnOiAnT21lbGV0dGUgaXMgY3JlYW15IGFuZCB2ZWdldGFyaWFuJyxcbiAqIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFnZ3JlZ2F0ZUdyb3VwczxULCBBPihcbiAgcmVjb3JkOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBBcnJheTxUPj4+LFxuICBhZ2dyZWdhdG9yOiAoY3VycmVudDogVCwga2V5OiBzdHJpbmcsIGZpcnN0OiBib29sZWFuLCBhY2N1bXVsYXRvcj86IEEpID0+IEEsXG4pOiBSZWNvcmQ8c3RyaW5nLCBBPiB7XG4gIHJldHVybiBtYXBFbnRyaWVzKFxuICAgIHJlY29yZCxcbiAgICAoW2tleSwgdmFsdWVzXSkgPT4gW1xuICAgICAga2V5LFxuICAgICAgLy8gTmVlZCB0aGUgdHlwZSBhc3NlcnRpb25zIGhlcmUgYmVjYXVzZSB0aGUgcmVkdWNlIHR5cGUgZG9lcyBub3Qgc3VwcG9ydCB0aGUgdHlwZSB0cmFuc2l0aW9uIHdlIG5lZWRcbiAgICAgIHZhbHVlcy5yZWR1Y2UoXG4gICAgICAgIChhY2N1bXVsYXRvciwgY3VycmVudCwgY3VycmVudEluZGV4KSA9PlxuICAgICAgICAgIGFnZ3JlZ2F0b3IoY3VycmVudCwga2V5LCBjdXJyZW50SW5kZXggPT09IDAsIGFjY3VtdWxhdG9yKSxcbiAgICAgICAgdW5kZWZpbmVkIGFzIEEgfCB1bmRlZmluZWQsXG4gICAgICApIGFzIEEsXG4gICAgXSxcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsVUFBVSxRQUFRLGtCQUFrQixDQUFDO0FBRTlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUJDLEdBQ0QsT0FBTyxTQUFTLGVBQWUsQ0FDN0IsTUFBMEMsRUFDMUMsVUFBMkUsRUFDeEQ7SUFDbkIsT0FBTyxVQUFVLENBQ2YsTUFBTSxFQUNOLENBQUMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUs7WUFDakIsR0FBRztZQUNILHFHQUFxRztZQUNyRyxNQUFNLENBQUMsTUFBTSxDQUNYLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxZQUFZLEdBQ2pDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLFlBQVksS0FBSyxDQUFDLEVBQUUsV0FBVyxDQUFDLEVBQzNELFNBQVMsQ0FDVjtTQUNGLENBQ0YsQ0FBQztBQUNKLENBQUMifQ==