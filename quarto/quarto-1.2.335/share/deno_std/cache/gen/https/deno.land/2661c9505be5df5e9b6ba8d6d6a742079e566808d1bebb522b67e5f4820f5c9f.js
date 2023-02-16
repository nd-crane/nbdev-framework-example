// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns the first element that is the smallest value of the given function or undefined if there are no elements.
 *
 * Example:
 *
 * ```ts
 * import { minBy } from "https://deno.land/std@$STD_VERSION/collections/min_by.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts"
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ];
 *
 * const personWithMinAge = minBy(people, i => i.age);
 *
 * assertEquals(personWithMinAge, { name: 'John', age: 23 });
 * ```
 */ export function minBy(array, selector) {
    let min = undefined;
    let minValue = undefined;
    for (const current of array){
        const currentValue = selector(current);
        if (minValue === undefined || currentValue < minValue) {
            min = current;
            minValue = currentValue;
        }
    }
    return min;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21pbl9ieS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IGVsZW1lbnQgdGhhdCBpcyB0aGUgc21hbGxlc3QgdmFsdWUgb2YgdGhlIGdpdmVuIGZ1bmN0aW9uIG9yIHVuZGVmaW5lZCBpZiB0aGVyZSBhcmUgbm8gZWxlbWVudHMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgbWluQnkgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9taW5fYnkudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiXG4gKlxuICogY29uc3QgcGVvcGxlID0gW1xuICogICAgIHsgbmFtZTogJ0FubmEnLCBhZ2U6IDM0IH0sXG4gKiAgICAgeyBuYW1lOiAnS2ltJywgYWdlOiA0MiB9LFxuICogICAgIHsgbmFtZTogJ0pvaG4nLCBhZ2U6IDIzIH0sXG4gKiBdO1xuICpcbiAqIGNvbnN0IHBlcnNvbldpdGhNaW5BZ2UgPSBtaW5CeShwZW9wbGUsIGkgPT4gaS5hZ2UpO1xuICpcbiAqIGFzc2VydEVxdWFscyhwZXJzb25XaXRoTWluQWdlLCB7IG5hbWU6ICdKb2huJywgYWdlOiAyMyB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWluQnk8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoZWw6IFQpID0+IG51bWJlcixcbik6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gbWluQnk8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoZWw6IFQpID0+IHN0cmluZyxcbik6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gbWluQnk8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoZWw6IFQpID0+IGJpZ2ludCxcbik6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gbWluQnk8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOiAoZWw6IFQpID0+IERhdGUsXG4pOiBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIG1pbkJ5PFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjpcbiAgICB8ICgoZWw6IFQpID0+IG51bWJlcilcbiAgICB8ICgoZWw6IFQpID0+IHN0cmluZylcbiAgICB8ICgoZWw6IFQpID0+IGJpZ2ludClcbiAgICB8ICgoZWw6IFQpID0+IERhdGUpLFxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIGxldCBtaW46IFQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGxldCBtaW5WYWx1ZTogUmV0dXJuVHlwZTx0eXBlb2Ygc2VsZWN0b3I+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGZvciAoY29uc3QgY3VycmVudCBvZiBhcnJheSkge1xuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IHNlbGVjdG9yKGN1cnJlbnQpO1xuXG4gICAgaWYgKG1pblZhbHVlID09PSB1bmRlZmluZWQgfHwgY3VycmVudFZhbHVlIDwgbWluVmFsdWUpIHtcbiAgICAgIG1pbiA9IGN1cnJlbnQ7XG4gICAgICBtaW5WYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWluO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FDRCxBQWdCQSxPQUFPLFNBQVMsS0FBSyxDQUNuQixLQUFtQixFQUNuQixRQUlxQixFQUNOO0lBQ2YsSUFBSSxHQUFHLEdBQWtCLFNBQVMsQUFBQztJQUNuQyxJQUFJLFFBQVEsR0FBNEMsU0FBUyxBQUFDO0lBRWxFLEtBQUssTUFBTSxPQUFPLElBQUksS0FBSyxDQUFFO1FBQzNCLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsQUFBQztRQUV2QyxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksWUFBWSxHQUFHLFFBQVEsRUFBRTtZQUNyRCxHQUFHLEdBQUcsT0FBTyxDQUFDO1lBQ2QsUUFBUSxHQUFHLFlBQVksQ0FBQztRQUMxQixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9