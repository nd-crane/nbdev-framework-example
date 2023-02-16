// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Transforms the given array into a Record, extracting the key of each element using the given selector.
 * If the selector produces the same key for multiple elements, the latest one will be used (overriding the
 * ones before it).
 *
 * Example:
 *
 * ```ts
 * import { associateBy } from "https://deno.land/std@$STD_VERSION/collections/associate_by.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const users = [
 *     { id: 'a2e', userName: 'Anna' },
 *     { id: '5f8', userName: 'Arnold' },
 *     { id: 'd2c', userName: 'Kim' },
 * ]
 * const usersById = associateBy(users, it => it.id)
 *
 * assertEquals(usersById, {
 *     'a2e': { id: 'a2e', userName: 'Anna' },
 *     '5f8': { id: '5f8', userName: 'Arnold' },
 *     'd2c': { id: 'd2c', userName: 'Kim' },
 * })
 * ```
 */ export function associateBy(array, selector) {
    const ret = {};
    for (const element of array){
        const selectedValue = selector(element);
        ret[selectedValue] = element;
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2Fzc29jaWF0ZV9ieS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIGdpdmVuIGFycmF5IGludG8gYSBSZWNvcmQsIGV4dHJhY3RpbmcgdGhlIGtleSBvZiBlYWNoIGVsZW1lbnQgdXNpbmcgdGhlIGdpdmVuIHNlbGVjdG9yLlxuICogSWYgdGhlIHNlbGVjdG9yIHByb2R1Y2VzIHRoZSBzYW1lIGtleSBmb3IgbXVsdGlwbGUgZWxlbWVudHMsIHRoZSBsYXRlc3Qgb25lIHdpbGwgYmUgdXNlZCAob3ZlcnJpZGluZyB0aGVcbiAqIG9uZXMgYmVmb3JlIGl0KS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NvY2lhdGVCeSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2Fzc29jaWF0ZV9ieS50c1wiXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCB1c2VycyA9IFtcbiAqICAgICB7IGlkOiAnYTJlJywgdXNlck5hbWU6ICdBbm5hJyB9LFxuICogICAgIHsgaWQ6ICc1ZjgnLCB1c2VyTmFtZTogJ0Fybm9sZCcgfSxcbiAqICAgICB7IGlkOiAnZDJjJywgdXNlck5hbWU6ICdLaW0nIH0sXG4gKiBdXG4gKiBjb25zdCB1c2Vyc0J5SWQgPSBhc3NvY2lhdGVCeSh1c2VycywgaXQgPT4gaXQuaWQpXG4gKlxuICogYXNzZXJ0RXF1YWxzKHVzZXJzQnlJZCwge1xuICogICAgICdhMmUnOiB7IGlkOiAnYTJlJywgdXNlck5hbWU6ICdBbm5hJyB9LFxuICogICAgICc1ZjgnOiB7IGlkOiAnNWY4JywgdXNlck5hbWU6ICdBcm5vbGQnIH0sXG4gKiAgICAgJ2QyYyc6IHsgaWQ6ICdkMmMnLCB1c2VyTmFtZTogJ0tpbScgfSxcbiAqIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc29jaWF0ZUJ5PFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBzdHJpbmcsXG4pOiBSZWNvcmQ8c3RyaW5nLCBUPiB7XG4gIGNvbnN0IHJldDogUmVjb3JkPHN0cmluZywgVD4gPSB7fTtcblxuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgYXJyYXkpIHtcbiAgICBjb25zdCBzZWxlY3RlZFZhbHVlID0gc2VsZWN0b3IoZWxlbWVudCk7XG5cbiAgICByZXRbc2VsZWN0ZWRWYWx1ZV0gPSBlbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QkMsR0FDRCxPQUFPLFNBQVMsV0FBVyxDQUN6QixLQUFtQixFQUNuQixRQUEyQixFQUNSO0lBQ25CLE1BQU0sR0FBRyxHQUFzQixFQUFFLEFBQUM7SUFFbEMsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUU7UUFDM0IsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxBQUFDO1FBRXhDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxPQUFPLENBQUM7SUFDL0IsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9