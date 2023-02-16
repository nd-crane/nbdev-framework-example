// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns all distinct elements that appear in any of the given arrays
 *
 * Example:
 *
 * ```ts
 * import { union } from "https://deno.land/std@$STD_VERSION/collections/union.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const soupIngredients = [ 'Pepper', 'Carrots', 'Leek' ]
 * const saladIngredients = [ 'Carrots', 'Radicchio', 'Pepper' ]
 * const shoppingList = union(soupIngredients, saladIngredients)
 *
 * assertEquals(shoppingList, [ 'Pepper', 'Carrots', 'Leek', 'Radicchio' ])
 * ```
 */ export function union(...arrays) {
    const set = new Set();
    for (const array of arrays){
        for (const element of array){
            set.add(element);
        }
    }
    return Array.from(set);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3VuaW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhbGwgZGlzdGluY3QgZWxlbWVudHMgdGhhdCBhcHBlYXIgaW4gYW55IG9mIHRoZSBnaXZlbiBhcnJheXNcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB1bmlvbiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL3VuaW9uLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBzb3VwSW5ncmVkaWVudHMgPSBbICdQZXBwZXInLCAnQ2Fycm90cycsICdMZWVrJyBdXG4gKiBjb25zdCBzYWxhZEluZ3JlZGllbnRzID0gWyAnQ2Fycm90cycsICdSYWRpY2NoaW8nLCAnUGVwcGVyJyBdXG4gKiBjb25zdCBzaG9wcGluZ0xpc3QgPSB1bmlvbihzb3VwSW5ncmVkaWVudHMsIHNhbGFkSW5ncmVkaWVudHMpXG4gKlxuICogYXNzZXJ0RXF1YWxzKHNob3BwaW5nTGlzdCwgWyAnUGVwcGVyJywgJ0NhcnJvdHMnLCAnTGVlaycsICdSYWRpY2NoaW8nIF0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuaW9uPFQ+KC4uLmFycmF5czogKHJlYWRvbmx5IFRbXSlbXSk6IFRbXSB7XG4gIGNvbnN0IHNldCA9IG5ldyBTZXQ8VD4oKTtcblxuICBmb3IgKGNvbnN0IGFycmF5IG9mIGFycmF5cykge1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBhcnJheSkge1xuICAgICAgc2V0LmFkZChlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQXJyYXkuZnJvbShzZXQpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLEtBQUssQ0FBSSxHQUFHLE1BQU0sQUFBa0IsRUFBTztJQUN6RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBSyxBQUFDO0lBRXpCLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxDQUFFO1FBQzFCLEtBQUssTUFBTSxPQUFPLElBQUksS0FBSyxDQUFFO1lBQzNCLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsQ0FBQyJ9