// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Generates sliding views of the given array of the given size and returns a new
 * array containing all of them.
 *
 * If step is set, each window will start that many elements after the last
 * window's start. (Default: 1)
 *
 * If partial is set, windows will be generated for the last elements of the
 * collection, resulting in some undefined values if size is greater than 1.
 * (Default: false)
 *
 * Example:
 *
 * ```ts
 * import { slidingWindows } from "https://deno.land/std@$STD_VERSION/collections/sliding_windows.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 * const numbers = [1, 2, 3, 4, 5];
 *
 * const windows = slidingWindows(numbers, 3);
 * assertEquals(windows, [
 *   [1, 2, 3],
 *   [2, 3, 4],
 *   [3, 4, 5],
 * ]);
 *
 * const windowsWithStep = slidingWindows(numbers, 3, { step: 2 });
 * assertEquals(windowsWithStep, [
 *   [1, 2, 3],
 *   [3, 4, 5],
 * ]);
 *
 * const windowsWithPartial = slidingWindows(numbers, 3, { partial: true });
 * assertEquals(windowsWithPartial, [
 *   [1, 2, 3],
 *   [2, 3, 4],
 *   [3, 4, 5],
 *   [4, 5],
 *   [5],
 * ]);
 * ```
 */ export function slidingWindows(array, size, { step =1 , partial =false  } = {}) {
    if (!Number.isInteger(size) || !Number.isInteger(step) || size <= 0 || step <= 0) {
        throw new RangeError("Both size and step must be positive integer.");
    }
    /** length of the return array */ const length = Math.floor((array.length - (partial ? 1 : size)) / step + 1);
    const result = [];
    for(let i = 0; i < length; i++){
        result.push(array.slice(i * step, i * step + size));
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3NsaWRpbmdfd2luZG93cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEdlbmVyYXRlcyBzbGlkaW5nIHZpZXdzIG9mIHRoZSBnaXZlbiBhcnJheSBvZiB0aGUgZ2l2ZW4gc2l6ZSBhbmQgcmV0dXJucyBhIG5ld1xuICogYXJyYXkgY29udGFpbmluZyBhbGwgb2YgdGhlbS5cbiAqXG4gKiBJZiBzdGVwIGlzIHNldCwgZWFjaCB3aW5kb3cgd2lsbCBzdGFydCB0aGF0IG1hbnkgZWxlbWVudHMgYWZ0ZXIgdGhlIGxhc3RcbiAqIHdpbmRvdydzIHN0YXJ0LiAoRGVmYXVsdDogMSlcbiAqXG4gKiBJZiBwYXJ0aWFsIGlzIHNldCwgd2luZG93cyB3aWxsIGJlIGdlbmVyYXRlZCBmb3IgdGhlIGxhc3QgZWxlbWVudHMgb2YgdGhlXG4gKiBjb2xsZWN0aW9uLCByZXN1bHRpbmcgaW4gc29tZSB1bmRlZmluZWQgdmFsdWVzIGlmIHNpemUgaXMgZ3JlYXRlciB0aGFuIDEuXG4gKiAoRGVmYXVsdDogZmFsc2UpXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc2xpZGluZ1dpbmRvd3MgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9zbGlkaW5nX3dpbmRvd3MudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICogY29uc3QgbnVtYmVycyA9IFsxLCAyLCAzLCA0LCA1XTtcbiAqXG4gKiBjb25zdCB3aW5kb3dzID0gc2xpZGluZ1dpbmRvd3MobnVtYmVycywgMyk7XG4gKiBhc3NlcnRFcXVhbHMod2luZG93cywgW1xuICogICBbMSwgMiwgM10sXG4gKiAgIFsyLCAzLCA0XSxcbiAqICAgWzMsIDQsIDVdLFxuICogXSk7XG4gKlxuICogY29uc3Qgd2luZG93c1dpdGhTdGVwID0gc2xpZGluZ1dpbmRvd3MobnVtYmVycywgMywgeyBzdGVwOiAyIH0pO1xuICogYXNzZXJ0RXF1YWxzKHdpbmRvd3NXaXRoU3RlcCwgW1xuICogICBbMSwgMiwgM10sXG4gKiAgIFszLCA0LCA1XSxcbiAqIF0pO1xuICpcbiAqIGNvbnN0IHdpbmRvd3NXaXRoUGFydGlhbCA9IHNsaWRpbmdXaW5kb3dzKG51bWJlcnMsIDMsIHsgcGFydGlhbDogdHJ1ZSB9KTtcbiAqIGFzc2VydEVxdWFscyh3aW5kb3dzV2l0aFBhcnRpYWwsIFtcbiAqICAgWzEsIDIsIDNdLFxuICogICBbMiwgMywgNF0sXG4gKiAgIFszLCA0LCA1XSxcbiAqICAgWzQsIDVdLFxuICogICBbNV0sXG4gKiBdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2xpZGluZ1dpbmRvd3M8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNpemU6IG51bWJlcixcbiAgeyBzdGVwID0gMSwgcGFydGlhbCA9IGZhbHNlIH06IHtcbiAgICAvKipcbiAgICAgKiBJZiBzdGVwIGlzIHNldCwgZWFjaCB3aW5kb3cgd2lsbCBzdGFydCB0aGF0IG1hbnkgZWxlbWVudHMgYWZ0ZXIgdGhlIGxhc3RcbiAgICAgKiB3aW5kb3cncyBzdGFydC4gKERlZmF1bHQ6IDEpXG4gICAgICovXG4gICAgc3RlcD86IG51bWJlcjtcbiAgICAvKipcbiAgICAgKiBJZiBwYXJ0aWFsIGlzIHNldCwgd2luZG93cyB3aWxsIGJlIGdlbmVyYXRlZCBmb3IgdGhlIGxhc3QgZWxlbWVudHMgb2YgdGhlXG4gICAgICogY29sbGVjdGlvbiwgcmVzdWx0aW5nIGluIHNvbWUgdW5kZWZpbmVkIHZhbHVlcyBpZiBzaXplIGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAqIChEZWZhdWx0OiBmYWxzZSlcbiAgICAgKi9cbiAgICBwYXJ0aWFsPzogYm9vbGVhbjtcbiAgfSA9IHt9LFxuKTogVFtdW10ge1xuICBpZiAoXG4gICAgIU51bWJlci5pc0ludGVnZXIoc2l6ZSkgfHwgIU51bWJlci5pc0ludGVnZXIoc3RlcCkgfHwgc2l6ZSA8PSAwIHx8IHN0ZXAgPD0gMFxuICApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkJvdGggc2l6ZSBhbmQgc3RlcCBtdXN0IGJlIHBvc2l0aXZlIGludGVnZXIuXCIpO1xuICB9XG5cbiAgLyoqIGxlbmd0aCBvZiB0aGUgcmV0dXJuIGFycmF5ICovXG4gIGNvbnN0IGxlbmd0aCA9IE1hdGguZmxvb3IoKGFycmF5Lmxlbmd0aCAtIChwYXJ0aWFsID8gMSA6IHNpemUpKSAvIHN0ZXAgKyAxKTtcblxuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHJlc3VsdC5wdXNoKGFycmF5LnNsaWNlKGkgKiBzdGVwLCBpICogc3RlcCArIHNpemUpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3Q0MsR0FDRCxPQUFPLFNBQVMsY0FBYyxDQUM1QixLQUFtQixFQUNuQixJQUFZLEVBQ1osRUFBRSxJQUFJLEVBQUcsQ0FBQyxDQUFBLEVBQUUsT0FBTyxFQUFHLEtBQUssQ0FBQSxFQVkxQixHQUFHLEVBQUUsRUFDQztJQUNQLElBQ0UsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQzVFO1FBQ0EsTUFBTSxJQUFJLFVBQVUsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCwrQkFBK0IsR0FDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxBQUFDO0lBRTVFLE1BQU0sTUFBTSxHQUFHLEVBQUUsQUFBQztJQUNsQixJQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFFO1FBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyJ9