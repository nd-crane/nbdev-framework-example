// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns all elements in the given array that produce a distinct value using the given selector, preserving order by first occurrence
 *
 * Example:
 *
 * ```ts
 * import { distinctBy } from "https://deno.land/std@$STD_VERSION/collections/distinct_by.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const names = [ 'Anna', 'Kim', 'Arnold', 'Kate' ]
 * const exampleNamesByFirstLetter = distinctBy(names, it => it.charAt(0))
 *
 * assertEquals(exampleNamesByFirstLetter, [ 'Anna', 'Kim' ])
 * ```
 */ export function distinctBy(array, selector) {
    const selectedValues = new Set();
    const ret = [];
    for (const element of array){
        const currentSelectedValue = selector(element);
        if (!selectedValues.has(currentSelectedValue)) {
            selectedValues.add(currentSelectedValue);
            ret.push(element);
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2Rpc3RpbmN0X2J5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhbGwgZWxlbWVudHMgaW4gdGhlIGdpdmVuIGFycmF5IHRoYXQgcHJvZHVjZSBhIGRpc3RpbmN0IHZhbHVlIHVzaW5nIHRoZSBnaXZlbiBzZWxlY3RvciwgcHJlc2VydmluZyBvcmRlciBieSBmaXJzdCBvY2N1cnJlbmNlXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGlzdGluY3RCeSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2Rpc3RpbmN0X2J5LnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBuYW1lcyA9IFsgJ0FubmEnLCAnS2ltJywgJ0Fybm9sZCcsICdLYXRlJyBdXG4gKiBjb25zdCBleGFtcGxlTmFtZXNCeUZpcnN0TGV0dGVyID0gZGlzdGluY3RCeShuYW1lcywgaXQgPT4gaXQuY2hhckF0KDApKVxuICpcbiAqIGFzc2VydEVxdWFscyhleGFtcGxlTmFtZXNCeUZpcnN0TGV0dGVyLCBbICdBbm5hJywgJ0tpbScgXSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzdGluY3RCeTxULCBEPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gRCxcbik6IFRbXSB7XG4gIGNvbnN0IHNlbGVjdGVkVmFsdWVzID0gbmV3IFNldDxEPigpO1xuICBjb25zdCByZXQ6IFRbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZWxlbWVudCBvZiBhcnJheSkge1xuICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RlZFZhbHVlID0gc2VsZWN0b3IoZWxlbWVudCk7XG5cbiAgICBpZiAoIXNlbGVjdGVkVmFsdWVzLmhhcyhjdXJyZW50U2VsZWN0ZWRWYWx1ZSkpIHtcbiAgICAgIHNlbGVjdGVkVmFsdWVzLmFkZChjdXJyZW50U2VsZWN0ZWRWYWx1ZSk7XG4gICAgICByZXQucHVzaChlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxDQUN4QixLQUFtQixFQUNuQixRQUFzQixFQUNqQjtJQUNMLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFLLEFBQUM7SUFDcEMsTUFBTSxHQUFHLEdBQVEsRUFBRSxBQUFDO0lBRXBCLEtBQUssTUFBTSxPQUFPLElBQUksS0FBSyxDQUFFO1FBQzNCLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxBQUFDO1FBRS9DLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEVBQUU7WUFDN0MsY0FBYyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==