// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Applies the given selector to all elements in the given collection and calculates the sum of the results
 *
 * Example:
 *
 * ```ts
 * import { sumOf } from "https://deno.land/std@$STD_VERSION/collections/sum_of.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ]
 * const totalAge = sumOf(people, i => i.age)
 *
 * assertEquals(totalAge, 99)
 * ```
 */ export function sumOf(array, selector) {
    let sum = 0;
    for (const i of array){
        sum += selector(i);
    }
    return sum;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3N1bV9vZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGdpdmVuIHNlbGVjdG9yIHRvIGFsbCBlbGVtZW50cyBpbiB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBhbmQgY2FsY3VsYXRlcyB0aGUgc3VtIG9mIHRoZSByZXN1bHRzXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc3VtT2YgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9zdW1fb2YudHNcIlxuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCJcbiAqXG4gKiBjb25zdCBwZW9wbGUgPSBbXG4gKiAgICAgeyBuYW1lOiAnQW5uYScsIGFnZTogMzQgfSxcbiAqICAgICB7IG5hbWU6ICdLaW0nLCBhZ2U6IDQyIH0sXG4gKiAgICAgeyBuYW1lOiAnSm9obicsIGFnZTogMjMgfSxcbiAqIF1cbiAqIGNvbnN0IHRvdGFsQWdlID0gc3VtT2YocGVvcGxlLCBpID0+IGkuYWdlKVxuICpcbiAqIGFzc2VydEVxdWFscyh0b3RhbEFnZSwgOTkpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1bU9mPFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBsZXQgc3VtID0gMDtcblxuICBmb3IgKGNvbnN0IGkgb2YgYXJyYXkpIHtcbiAgICBzdW0gKz0gc2VsZWN0b3IoaSk7XG4gIH1cblxuICByZXR1cm4gc3VtO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCQyxHQUNELE9BQU8sU0FBUyxLQUFLLENBQ25CLEtBQW1CLEVBQ25CLFFBQTJCLEVBQ25CO0lBQ1IsSUFBSSxHQUFHLEdBQUcsQ0FBQyxBQUFDO0lBRVosS0FBSyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUU7UUFDckIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIn0=