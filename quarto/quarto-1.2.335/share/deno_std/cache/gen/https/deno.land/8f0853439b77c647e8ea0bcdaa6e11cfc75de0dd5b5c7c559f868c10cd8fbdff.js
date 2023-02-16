// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns the first element that is the largest value of the given function or undefined if there are no elements.
 *
 * Example:
 *
 * ```ts
 * import { maxBy } from "https://deno.land/std@$STD_VERSION/collections/max_by.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ];
 *
 * const personWithMaxAge = maxBy(people, i => i.age);
 *
 * assertEquals(personWithMaxAge, { name: 'Kim', age: 42 });
 * ```
 */ export function maxBy(array, selector) {
    let max = undefined;
    let maxValue = undefined;
    for (const current of array){
        const currentValue = selector(current);
        if (maxValue === undefined || currentValue > maxValue) {
            max = current;
            maxValue = currentValue;
        }
    }
    return max;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL21heF9ieS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IGVsZW1lbnQgdGhhdCBpcyB0aGUgbGFyZ2VzdCB2YWx1ZSBvZiB0aGUgZ2l2ZW4gZnVuY3Rpb24gb3IgdW5kZWZpbmVkIGlmIHRoZXJlIGFyZSBubyBlbGVtZW50cy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBtYXhCeSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL21heF9ieS50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgcGVvcGxlID0gW1xuICogICAgIHsgbmFtZTogJ0FubmEnLCBhZ2U6IDM0IH0sXG4gKiAgICAgeyBuYW1lOiAnS2ltJywgYWdlOiA0MiB9LFxuICogICAgIHsgbmFtZTogJ0pvaG4nLCBhZ2U6IDIzIH0sXG4gKiBdO1xuICpcbiAqIGNvbnN0IHBlcnNvbldpdGhNYXhBZ2UgPSBtYXhCeShwZW9wbGUsIGkgPT4gaS5hZ2UpO1xuICpcbiAqIGFzc2VydEVxdWFscyhwZXJzb25XaXRoTWF4QWdlLCB7IG5hbWU6ICdLaW0nLCBhZ2U6IDQyIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXhCeTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gbnVtYmVyLFxuKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBtYXhCeTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gc3RyaW5nLFxuKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBtYXhCeTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gYmlnaW50LFxuKTogVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBtYXhCeTxUPihcbiAgYXJyYXk6IHJlYWRvbmx5IFRbXSxcbiAgc2VsZWN0b3I6IChlbDogVCkgPT4gRGF0ZSxcbik6IFQgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gbWF4Qnk8VD4oXG4gIGFycmF5OiByZWFkb25seSBUW10sXG4gIHNlbGVjdG9yOlxuICAgIHwgKChlbDogVCkgPT4gbnVtYmVyKVxuICAgIHwgKChlbDogVCkgPT4gc3RyaW5nKVxuICAgIHwgKChlbDogVCkgPT4gYmlnaW50KVxuICAgIHwgKChlbDogVCkgPT4gRGF0ZSksXG4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgbGV0IG1heDogVCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IG1heFZhbHVlOiBSZXR1cm5UeXBlPHR5cGVvZiBzZWxlY3Rvcj4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgZm9yIChjb25zdCBjdXJyZW50IG9mIGFycmF5KSB7XG4gICAgY29uc3QgY3VycmVudFZhbHVlID0gc2VsZWN0b3IoY3VycmVudCk7XG5cbiAgICBpZiAobWF4VmFsdWUgPT09IHVuZGVmaW5lZCB8fCBjdXJyZW50VmFsdWUgPiBtYXhWYWx1ZSkge1xuICAgICAgbWF4ID0gY3VycmVudDtcbiAgICAgIG1heFZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXg7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELEFBZ0JBLE9BQU8sU0FBUyxLQUFLLENBQ25CLEtBQW1CLEVBQ25CLFFBSXFCLEVBQ047SUFDZixJQUFJLEdBQUcsR0FBa0IsU0FBUyxBQUFDO0lBQ25DLElBQUksUUFBUSxHQUE0QyxTQUFTLEFBQUM7SUFFbEUsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUU7UUFDM0IsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxBQUFDO1FBRXZDLElBQUksUUFBUSxLQUFLLFNBQVMsSUFBSSxZQUFZLEdBQUcsUUFBUSxFQUFFO1lBQ3JELEdBQUcsR0FBRyxPQUFPLENBQUM7WUFDZCxRQUFRLEdBQUcsWUFBWSxDQUFDO1FBQzFCLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIn0=