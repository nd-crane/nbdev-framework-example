// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns all elements in the given collection, sorted stably by their result using the given selector. The selector function is called only once for each element.
 *
 * Example:
 *
 * ```ts
 * import { sortBy } from "https://deno.land/std@$STD_VERSION/collections/sort_by.ts"
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ]
 * const sortedByAge = sortBy(people, it => it.age)
 *
 * assertEquals(sortedByAge, [
 *     { name: 'John', age: 23 },
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 * ])
 * ```
 */ export function sortBy(array, selector) {
    const len = array.length;
    const indexes = new Array(len);
    const selectors = new Array(len);
    for(let i = 0; i < len; i++){
        indexes[i] = i;
        const s = selector(array[i]);
        selectors[i] = Number.isNaN(s) ? null : s;
    }
    indexes.sort((ai, bi)=>{
        const a = selectors[ai];
        const b = selectors[bi];
        if (a === null) return 1;
        if (b === null) return -1;
        return a > b ? 1 : a < b ? -1 : 0;
    });
    for(let i1 = 0; i1 < len; i1++){
        indexes[i1] = array[indexes[i1]];
    }
    return indexes;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3NvcnRfYnkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBSZXR1cm5zIGFsbCBlbGVtZW50cyBpbiB0aGUgZ2l2ZW4gY29sbGVjdGlvbiwgc29ydGVkIHN0YWJseSBieSB0aGVpciByZXN1bHQgdXNpbmcgdGhlIGdpdmVuIHNlbGVjdG9yLiBUaGUgc2VsZWN0b3IgZnVuY3Rpb24gaXMgY2FsbGVkIG9ubHkgb25jZSBmb3IgZWFjaCBlbGVtZW50LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHNvcnRCeSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL3NvcnRfYnkudHNcIlxuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgcGVvcGxlID0gW1xuICogICAgIHsgbmFtZTogJ0FubmEnLCBhZ2U6IDM0IH0sXG4gKiAgICAgeyBuYW1lOiAnS2ltJywgYWdlOiA0MiB9LFxuICogICAgIHsgbmFtZTogJ0pvaG4nLCBhZ2U6IDIzIH0sXG4gKiBdXG4gKiBjb25zdCBzb3J0ZWRCeUFnZSA9IHNvcnRCeShwZW9wbGUsIGl0ID0+IGl0LmFnZSlcbiAqXG4gKiBhc3NlcnRFcXVhbHMoc29ydGVkQnlBZ2UsIFtcbiAqICAgICB7IG5hbWU6ICdKb2huJywgYWdlOiAyMyB9LFxuICogICAgIHsgbmFtZTogJ0FubmEnLCBhZ2U6IDM0IH0sXG4gKiAgICAgeyBuYW1lOiAnS2ltJywgYWdlOiA0MiB9LFxuICogXSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc29ydEJ5PFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBudW1iZXIsXG4pOiBUW107XG5leHBvcnQgZnVuY3Rpb24gc29ydEJ5PFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBzdHJpbmcsXG4pOiBUW107XG5leHBvcnQgZnVuY3Rpb24gc29ydEJ5PFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBiaWdpbnQsXG4pOiBUW107XG5leHBvcnQgZnVuY3Rpb24gc29ydEJ5PFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBEYXRlLFxuKTogVFtdO1xuZXhwb3J0IGZ1bmN0aW9uIHNvcnRCeTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6XG4gICAgfCAoKGVsOiBUKSA9PiBudW1iZXIpXG4gICAgfCAoKGVsOiBUKSA9PiBzdHJpbmcpXG4gICAgfCAoKGVsOiBUKSA9PiBiaWdpbnQpXG4gICAgfCAoKGVsOiBUKSA9PiBEYXRlKSxcbik6IFRbXSB7XG4gIGNvbnN0IGxlbiA9IGFycmF5Lmxlbmd0aDtcbiAgY29uc3QgaW5kZXhlcyA9IG5ldyBBcnJheTxudW1iZXI+KGxlbik7XG4gIGNvbnN0IHNlbGVjdG9ycyA9IG5ldyBBcnJheTxSZXR1cm5UeXBlPHR5cGVvZiBzZWxlY3Rvcj4gfCBudWxsPihsZW4pO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpbmRleGVzW2ldID0gaTtcbiAgICBjb25zdCBzID0gc2VsZWN0b3IoYXJyYXlbaV0pO1xuICAgIHNlbGVjdG9yc1tpXSA9IE51bWJlci5pc05hTihzKSA/IG51bGwgOiBzO1xuICB9XG5cbiAgaW5kZXhlcy5zb3J0KChhaSwgYmkpID0+IHtcbiAgICBjb25zdCBhID0gc2VsZWN0b3JzW2FpXTtcbiAgICBjb25zdCBiID0gc2VsZWN0b3JzW2JpXTtcbiAgICBpZiAoYSA9PT0gbnVsbCkgcmV0dXJuIDE7XG4gICAgaWYgKGIgPT09IG51bGwpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYSA+IGIgPyAxIDogYSA8IGIgPyAtMSA6IDA7XG4gIH0pO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAoaW5kZXhlcyBhcyB1bmtub3duIGFzIFRbXSlbaV0gPSBhcnJheVtpbmRleGVzW2ldXTtcbiAgfVxuXG4gIHJldHVybiBpbmRleGVzIGFzIHVua25vd24gYXMgVFtdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FzQkMsR0FDRCxBQWdCQSxPQUFPLFNBQVMsTUFBTSxDQUNwQixLQUFtQixFQUNuQixRQUlxQixFQUNoQjtJQUNMLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEFBQUM7SUFDekIsTUFBTSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQVMsR0FBRyxDQUFDLEFBQUM7SUFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQXFDLEdBQUcsQ0FBQyxBQUFDO0lBRXJFLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUU7UUFDNUIsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQztRQUM3QixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBSztRQUN2QixNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEFBQUM7UUFDeEIsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxBQUFDO1FBQ3hCLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSyxJQUFJLEVBQUMsR0FBRyxDQUFDLEVBQUUsRUFBQyxHQUFHLEdBQUcsRUFBRSxFQUFDLEVBQUUsQ0FBRTtRQUM1QixBQUFDLE9BQU8sQUFBbUIsQ0FBQyxFQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELE9BQU8sT0FBTyxDQUFtQjtBQUNuQyxDQUFDIn0=