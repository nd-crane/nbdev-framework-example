// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * If the given value is part of the given object it returns true, otherwise it
 * returns false.
 * Doesn't work with non-primitive values: includesValue({x: {}}, {}) returns false.
 *
 * Example:
 * ```ts
 * import { includesValue } from "https://deno.land/std@$STD_VERSION/collections/includes_value.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const input = {
 *   first: 33,
 *   second: 34,
 * };
 *
 * assertEquals(includesValue(input, 34), true);
 * ```
 */ export function includesValue(record, value) {
    for(const i in record){
        if (Object.hasOwn(record, i) && (record[i] === value || Number.isNaN(value) && Number.isNaN(record[i]))) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2luY2x1ZGVzX3ZhbHVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogSWYgdGhlIGdpdmVuIHZhbHVlIGlzIHBhcnQgb2YgdGhlIGdpdmVuIG9iamVjdCBpdCByZXR1cm5zIHRydWUsIG90aGVyd2lzZSBpdFxuICogcmV0dXJucyBmYWxzZS5cbiAqIERvZXNuJ3Qgd29yayB3aXRoIG5vbi1wcmltaXRpdmUgdmFsdWVzOiBpbmNsdWRlc1ZhbHVlKHt4OiB7fX0sIHt9KSByZXR1cm5zIGZhbHNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaW5jbHVkZXNWYWx1ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL2luY2x1ZGVzX3ZhbHVlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBpbnB1dCA9IHtcbiAqICAgZmlyc3Q6IDMzLFxuICogICBzZWNvbmQ6IDM0LFxuICogfTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoaW5jbHVkZXNWYWx1ZShpbnB1dCwgMzQpLCB0cnVlKTtcbiAqIGBgYFxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNsdWRlc1ZhbHVlPFQ+KFxuICByZWNvcmQ6IFJlYWRvbmx5PFJlY29yZDxzdHJpbmcsIFQ+PixcbiAgdmFsdWU6IFQsXG4pOiBib29sZWFuIHtcbiAgZm9yIChjb25zdCBpIGluIHJlY29yZCkge1xuICAgIGlmIChcbiAgICAgIE9iamVjdC5oYXNPd24ocmVjb3JkLCBpKSAmJlxuICAgICAgKHJlY29yZFtpXSA9PT0gdmFsdWUgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNOYU4ocmVjb3JkW2ldKSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUVELE9BQU8sU0FBUyxhQUFhLENBQzNCLE1BQW1DLEVBQ25DLEtBQVEsRUFDQztJQUNULElBQUssTUFBTSxDQUFDLElBQUksTUFBTSxDQUFFO1FBQ3RCLElBQ0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQ3hCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDdkU7WUFDQSxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIn0=