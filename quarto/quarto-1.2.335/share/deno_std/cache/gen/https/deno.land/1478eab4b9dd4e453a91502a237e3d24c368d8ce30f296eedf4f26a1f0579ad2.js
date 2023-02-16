// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { mapValues } from "./map_values.ts";
/**
 * Applies the given reducer to each group in the given Grouping, returning the results together with the respective group keys
 *
 * ```ts
 * import { reduceGroups } from "https://deno.land/std@$STD_VERSION/collections/reduce_groups.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const votes = {
 *     'Woody': [ 2, 3, 1, 4 ],
 *     'Buzz': [ 5, 9 ],
 * }
 * const totalVotes = reduceGroups(votes, (sum, it) => sum + it, 0)
 *
 * assertEquals(totalVotes, {
 *     'Woody': 10,
 *     'Buzz': 14,
 * })
 * ```
 */ export function reduceGroups(record, reducer, initialValue) {
    return mapValues(record, (it)=>it.reduce(reducer, initialValue));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3JlZHVjZV9ncm91cHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgbWFwVmFsdWVzIH0gZnJvbSBcIi4vbWFwX3ZhbHVlcy50c1wiO1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGdpdmVuIHJlZHVjZXIgdG8gZWFjaCBncm91cCBpbiB0aGUgZ2l2ZW4gR3JvdXBpbmcsIHJldHVybmluZyB0aGUgcmVzdWx0cyB0b2dldGhlciB3aXRoIHRoZSByZXNwZWN0aXZlIGdyb3VwIGtleXNcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcmVkdWNlR3JvdXBzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY29sbGVjdGlvbnMvcmVkdWNlX2dyb3Vwcy50c1wiXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCB2b3RlcyA9IHtcbiAqICAgICAnV29vZHknOiBbIDIsIDMsIDEsIDQgXSxcbiAqICAgICAnQnV6eic6IFsgNSwgOSBdLFxuICogfVxuICogY29uc3QgdG90YWxWb3RlcyA9IHJlZHVjZUdyb3Vwcyh2b3RlcywgKHN1bSwgaXQpID0+IHN1bSArIGl0LCAwKVxuICpcbiAqIGFzc2VydEVxdWFscyh0b3RhbFZvdGVzLCB7XG4gKiAgICAgJ1dvb2R5JzogMTAsXG4gKiAgICAgJ0J1enonOiAxNCxcbiAqIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZUdyb3VwczxULCBBPihcbiAgcmVjb3JkOiBSZWFkb25seTxSZWNvcmQ8c3RyaW5nLCBBcnJheTxUPj4+LFxuICByZWR1Y2VyOiAoYWNjdW11bGF0b3I6IEEsIGN1cnJlbnQ6IFQpID0+IEEsXG4gIGluaXRpYWxWYWx1ZTogQSxcbik6IFJlY29yZDxzdHJpbmcsIEE+IHtcbiAgcmV0dXJuIG1hcFZhbHVlcyhyZWNvcmQsIChpdCkgPT4gaXQucmVkdWNlKHJlZHVjZXIsIGluaXRpYWxWYWx1ZSkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxTQUFTLFFBQVEsaUJBQWlCLENBQUM7QUFFNUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCQyxHQUNELE9BQU8sU0FBUyxZQUFZLENBQzFCLE1BQTBDLEVBQzFDLE9BQTBDLEVBQzFDLFlBQWUsRUFDSTtJQUNuQixPQUFPLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztBQUNyRSxDQUFDIn0=