// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { filterInPlace } from "./_utils.ts";
/**
 * Returns all distinct elements that appear at least once in each of the given arrays
 *
 * Example:
 *
 * ```ts
 * import { intersect } from "https://deno.land/std@$STD_VERSION/collections/intersect.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const lisaInterests = [ 'Cooking', 'Music', 'Hiking' ]
 * const kimInterests = [ 'Music', 'Tennis', 'Cooking' ]
 * const commonInterests = intersect(lisaInterests, kimInterests)
 *
 * assertEquals(commonInterests, [ 'Cooking', 'Music' ])
 * ```
 */ export function intersect(...arrays) {
    const [originalHead, ...tail] = arrays;
    const head = [
        ...new Set(originalHead)
    ];
    const tailSets = tail.map((it)=>new Set(it));
    for (const set of tailSets){
        filterInPlace(head, (it)=>set.has(it));
        if (head.length === 0) return head;
    }
    return head;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2ludGVyc2VjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBmaWx0ZXJJblBsYWNlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5cbi8qKlxuICogUmV0dXJucyBhbGwgZGlzdGluY3QgZWxlbWVudHMgdGhhdCBhcHBlYXIgYXQgbGVhc3Qgb25jZSBpbiBlYWNoIG9mIHRoZSBnaXZlbiBhcnJheXNcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBpbnRlcnNlY3QgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9pbnRlcnNlY3QudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGNvbnN0IGxpc2FJbnRlcmVzdHMgPSBbICdDb29raW5nJywgJ011c2ljJywgJ0hpa2luZycgXVxuICogY29uc3Qga2ltSW50ZXJlc3RzID0gWyAnTXVzaWMnLCAnVGVubmlzJywgJ0Nvb2tpbmcnIF1cbiAqIGNvbnN0IGNvbW1vbkludGVyZXN0cyA9IGludGVyc2VjdChsaXNhSW50ZXJlc3RzLCBraW1JbnRlcmVzdHMpXG4gKlxuICogYXNzZXJ0RXF1YWxzKGNvbW1vbkludGVyZXN0cywgWyAnQ29va2luZycsICdNdXNpYycgXSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJzZWN0PFQ+KC4uLmFycmF5czogKHJlYWRvbmx5IFRbXSlbXSk6IFRbXSB7XG4gIGNvbnN0IFtvcmlnaW5hbEhlYWQsIC4uLnRhaWxdID0gYXJyYXlzO1xuICBjb25zdCBoZWFkID0gWy4uLm5ldyBTZXQob3JpZ2luYWxIZWFkKV07XG4gIGNvbnN0IHRhaWxTZXRzID0gdGFpbC5tYXAoKGl0KSA9PiBuZXcgU2V0KGl0KSk7XG5cbiAgZm9yIChjb25zdCBzZXQgb2YgdGFpbFNldHMpIHtcbiAgICBmaWx0ZXJJblBsYWNlKGhlYWQsIChpdCkgPT4gc2V0LmhhcyhpdCkpO1xuICAgIGlmIChoZWFkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGhlYWQ7XG4gIH1cblxuICByZXR1cm4gaGVhZDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsYUFBYSxRQUFRLGFBQWEsQ0FBQztBQUU1Qzs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsU0FBUyxDQUFJLEdBQUcsTUFBTSxBQUFrQixFQUFPO0lBQzdELE1BQU0sQ0FBQyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxNQUFNLEFBQUM7SUFDdkMsTUFBTSxJQUFJLEdBQUc7V0FBSSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUM7S0FBQyxBQUFDO0lBQ3hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUssSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQUFBQztJQUUvQyxLQUFLLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBRTtRQUMxQixhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMifQ==