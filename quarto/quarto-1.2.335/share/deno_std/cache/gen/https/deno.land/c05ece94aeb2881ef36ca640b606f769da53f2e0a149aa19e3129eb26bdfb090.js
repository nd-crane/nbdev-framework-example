// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns the first element having the largest value according to the provided
 * comparator or undefined if there are no elements.
 *
 * The comparator is expected to work exactly like one passed to `Array.sort`, which means
 * that `comparator(a, b)` should return a negative number if `a < b`, a positive number if `a > b`
 * and `0` if `a == b`.
 *
 * Example:
 *
 * ```ts
 * import { maxWith } from "https://deno.land/std@$STD_VERSION/collections/max_with.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = ["Kim", "Anna", "John", "Arthur"];
 * const largestName = maxWith(people, (a, b) => a.length - b.length);
 *
 * assertEquals(largestName, "Arthur");
 * ```
 */ export function maxWith(array, comparator) {
    let max = undefined;
    let isFirst = true;
    for (const current of array){
        if (isFirst || comparator(current, max) > 0) {
            max = current;
            isFirst = false;
        }
    }
    return max;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21heF93aXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgZWxlbWVudCBoYXZpbmcgdGhlIGxhcmdlc3QgdmFsdWUgYWNjb3JkaW5nIHRvIHRoZSBwcm92aWRlZFxuICogY29tcGFyYXRvciBvciB1bmRlZmluZWQgaWYgdGhlcmUgYXJlIG5vIGVsZW1lbnRzLlxuICpcbiAqIFRoZSBjb21wYXJhdG9yIGlzIGV4cGVjdGVkIHRvIHdvcmsgZXhhY3RseSBsaWtlIG9uZSBwYXNzZWQgdG8gYEFycmF5LnNvcnRgLCB3aGljaCBtZWFuc1xuICogdGhhdCBgY29tcGFyYXRvcihhLCBiKWAgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciBpZiBgYSA8IGJgLCBhIHBvc2l0aXZlIG51bWJlciBpZiBgYSA+IGJgXG4gKiBhbmQgYDBgIGlmIGBhID09IGJgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IG1heFdpdGggfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9tYXhfd2l0aC50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgcGVvcGxlID0gW1wiS2ltXCIsIFwiQW5uYVwiLCBcIkpvaG5cIiwgXCJBcnRodXJcIl07XG4gKiBjb25zdCBsYXJnZXN0TmFtZSA9IG1heFdpdGgocGVvcGxlLCAoYSwgYikgPT4gYS5sZW5ndGggLSBiLmxlbmd0aCk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGxhcmdlc3ROYW1lLCBcIkFydGh1clwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF4V2l0aDxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgY29tcGFyYXRvcjogKGE6IFQsIGI6IFQpID0+IG51bWJlcixcbik6IFQgfCB1bmRlZmluZWQge1xuICBsZXQgbWF4OiBUIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgaXNGaXJzdCA9IHRydWU7XG5cbiAgZm9yIChjb25zdCBjdXJyZW50IG9mIGFycmF5KSB7XG4gICAgaWYgKGlzRmlyc3QgfHwgY29tcGFyYXRvcihjdXJyZW50LCA8VD4gbWF4KSA+IDApIHtcbiAgICAgIG1heCA9IGN1cnJlbnQ7XG4gICAgICBpc0ZpcnN0ID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1heDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sQ0FDckIsS0FBbUIsRUFDbkIsVUFBa0MsRUFDbkI7SUFDZixJQUFJLEdBQUcsR0FBa0IsU0FBUyxBQUFDO0lBQ25DLElBQUksT0FBTyxHQUFHLElBQUksQUFBQztJQUVuQixLQUFLLE1BQU0sT0FBTyxJQUFJLEtBQUssQ0FBRTtRQUMzQixJQUFJLE9BQU8sSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMvQyxHQUFHLEdBQUcsT0FBTyxDQUFDO1lBQ2QsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNsQixDQUFDO0lBQ0gsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9