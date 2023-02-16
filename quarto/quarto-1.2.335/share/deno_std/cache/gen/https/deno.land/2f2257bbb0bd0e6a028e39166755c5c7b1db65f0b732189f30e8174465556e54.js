// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns an element if and only if that element is the only one matching the given condition. Returns `undefined` otherwise.
 *
 * Example:
 *
 * ```ts
 * import { findSingle } from "https://deno.land/std@$STD_VERSION/collections/find_single.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const bookings = [
 *     { month: 'January', active: false },
 *     { month: 'March', active: false },
 *     { month: 'June', active: true },
 * ];
 * const activeBooking = findSingle(bookings, (it) => it.active);
 * const inactiveBooking = findSingle(bookings, (it) => !it.active);
 *
 * assertEquals(activeBooking, { month: "June", active: true });
 * assertEquals(inactiveBooking, undefined); // there are two applicable items
 * ```
 */ export function findSingle(array, predicate) {
    let match = undefined;
    let found = false;
    for (const element of array){
        if (predicate(element)) {
            if (found) {
                return undefined;
            }
            found = true;
            match = element;
        }
    }
    return match;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2ZpbmRfc2luZ2xlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhbiBlbGVtZW50IGlmIGFuZCBvbmx5IGlmIHRoYXQgZWxlbWVudCBpcyB0aGUgb25seSBvbmUgbWF0Y2hpbmcgdGhlIGdpdmVuIGNvbmRpdGlvbi4gUmV0dXJucyBgdW5kZWZpbmVkYCBvdGhlcndpc2UuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZmluZFNpbmdsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2ZpbmRfc2luZ2xlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBib29raW5ncyA9IFtcbiAqICAgICB7IG1vbnRoOiAnSmFudWFyeScsIGFjdGl2ZTogZmFsc2UgfSxcbiAqICAgICB7IG1vbnRoOiAnTWFyY2gnLCBhY3RpdmU6IGZhbHNlIH0sXG4gKiAgICAgeyBtb250aDogJ0p1bmUnLCBhY3RpdmU6IHRydWUgfSxcbiAqIF07XG4gKiBjb25zdCBhY3RpdmVCb29raW5nID0gZmluZFNpbmdsZShib29raW5ncywgKGl0KSA9PiBpdC5hY3RpdmUpO1xuICogY29uc3QgaW5hY3RpdmVCb29raW5nID0gZmluZFNpbmdsZShib29raW5ncywgKGl0KSA9PiAhaXQuYWN0aXZlKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoYWN0aXZlQm9va2luZywgeyBtb250aDogXCJKdW5lXCIsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAqIGFzc2VydEVxdWFscyhpbmFjdGl2ZUJvb2tpbmcsIHVuZGVmaW5lZCk7IC8vIHRoZXJlIGFyZSB0d28gYXBwbGljYWJsZSBpdGVtc1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kU2luZ2xlPFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBwcmVkaWNhdGU6IChlbDogVCkgPT4gYm9vbGVhbixcbik6IFQgfCB1bmRlZmluZWQge1xuICBsZXQgbWF0Y2g6IFQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgYXJyYXkpIHtcbiAgICBpZiAocHJlZGljYXRlKGVsZW1lbnQpKSB7XG4gICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIG1hdGNoID0gZWxlbWVudDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWF0Y2g7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvQkMsR0FDRCxPQUFPLFNBQVMsVUFBVSxDQUN4QixLQUFtQixFQUNuQixTQUE2QixFQUNkO0lBQ2YsSUFBSSxLQUFLLEdBQWtCLFNBQVMsQUFBQztJQUNyQyxJQUFJLEtBQUssR0FBRyxLQUFLLEFBQUM7SUFDbEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUU7UUFDM0IsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDdEIsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsT0FBTyxTQUFTLENBQUM7WUFDbkIsQ0FBQztZQUNELEtBQUssR0FBRyxJQUFJLENBQUM7WUFDYixLQUFLLEdBQUcsT0FBTyxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIn0=