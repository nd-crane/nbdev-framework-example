// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore no-explicit-any
export function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
}
export function isArray(value) {
    return Array.isArray(value);
}
export function isBoolean(value) {
    return typeof value === "boolean" || value instanceof Boolean;
}
export function isNull(value) {
    return value === null;
}
export function isNumber(value) {
    return typeof value === "number" || value instanceof Number;
}
export function isString(value) {
    return typeof value === "string" || value instanceof String;
}
export function isSymbol(value) {
    return typeof value === "symbol";
}
export function isUndefined(value) {
    return value === undefined;
}
export function isObject(value) {
    return value !== null && typeof value === "object";
}
export function isError(e) {
    return e instanceof Error;
}
export function isFunction(value) {
    return typeof value === "function";
}
export function isRegExp(value) {
    return value instanceof RegExp;
}
export function toArray(sequence) {
    if (isArray(sequence)) return sequence;
    if (isNothing(sequence)) return [];
    return [
        sequence
    ];
}
export function repeat(str, count) {
    let result = "";
    for(let cycle = 0; cycle < count; cycle++){
        result += str;
    }
    return result;
}
export function isNegativeZero(i) {
    return i === 0 && Number.NEGATIVE_INFINITY === 1 / i;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2VuY29kaW5nL195YW1sL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIGpzLXlhbWwgdjMuMTMuMTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvanMteWFtbC9jb21taXQvNjY1YWFkZGE0MjM0OWRjYWU4NjlmMTIwNDBkOWIxMGVmMThkMTJkYVxuLy8gQ29weXJpZ2h0IDIwMTEtMjAxNSBieSBWaXRhbHkgUHV6cmluLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5leHBvcnQgdHlwZSBBbnkgPSBhbnk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vdGhpbmcoc3ViamVjdDogdW5rbm93bik6IHN1YmplY3QgaXMgbmV2ZXIge1xuICByZXR1cm4gdHlwZW9mIHN1YmplY3QgPT09IFwidW5kZWZpbmVkXCIgfHwgc3ViamVjdCA9PT0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQXJyYXkodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBBbnlbXSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9vbGVhbih2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiB8fCB2YWx1ZSBpbnN0YW5jZW9mIEJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc051bGwodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBudWxsIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1iZXIodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBudW1iZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiIHx8IHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmcodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTeW1ib2wodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBzeW1ib2wge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN5bWJvbFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNVbmRlZmluZWQodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyB1bmRlZmluZWQge1xuICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFcnJvcihlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiBlIGluc3RhbmNlb2YgRXJyb3I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgKCkgPT4gdm9pZCB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVnRXhwKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVnRXhwIHtcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheTxUPihzZXF1ZW5jZTogVCk6IFQgfCBbXSB8IFtUXSB7XG4gIGlmIChpc0FycmF5KHNlcXVlbmNlKSkgcmV0dXJuIHNlcXVlbmNlO1xuICBpZiAoaXNOb3RoaW5nKHNlcXVlbmNlKSkgcmV0dXJuIFtdO1xuXG4gIHJldHVybiBbc2VxdWVuY2VdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVwZWF0KHN0cjogc3RyaW5nLCBjb3VudDogbnVtYmVyKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IFwiXCI7XG5cbiAgZm9yIChsZXQgY3ljbGUgPSAwOyBjeWNsZSA8IGNvdW50OyBjeWNsZSsrKSB7XG4gICAgcmVzdWx0ICs9IHN0cjtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05lZ2F0aXZlWmVybyhpOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGkgPT09IDAgJiYgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZID09PSAxIC8gaTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcnJheU9iamVjdDxUID0gQW55PiB7XG4gIFtQOiBzdHJpbmddOiBUO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLCtCQUErQjtBQUMvQixvRkFBb0Y7QUFDcEYsMEVBQTBFO0FBQzFFLDBFQUEwRTtBQUUxRSxtQ0FBbUM7QUFHbkMsT0FBTyxTQUFTLFNBQVMsQ0FBQyxPQUFnQixFQUFvQjtJQUM1RCxPQUFPLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDO0FBQzVELENBQUM7QUFFRCxPQUFPLFNBQVMsT0FBTyxDQUFDLEtBQWMsRUFBa0I7SUFDdEQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFFRCxPQUFPLFNBQVMsU0FBUyxDQUFDLEtBQWMsRUFBb0I7SUFDMUQsT0FBTyxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxZQUFZLE9BQU8sQ0FBQztBQUNoRSxDQUFDO0FBRUQsT0FBTyxTQUFTLE1BQU0sQ0FBQyxLQUFjLEVBQWlCO0lBQ3BELE9BQU8sS0FBSyxLQUFLLElBQUksQ0FBQztBQUN4QixDQUFDO0FBRUQsT0FBTyxTQUFTLFFBQVEsQ0FBQyxLQUFjLEVBQW1CO0lBQ3hELE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssWUFBWSxNQUFNLENBQUM7QUFDOUQsQ0FBQztBQUVELE9BQU8sU0FBUyxRQUFRLENBQUMsS0FBYyxFQUFtQjtJQUN4RCxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLFlBQVksTUFBTSxDQUFDO0FBQzlELENBQUM7QUFFRCxPQUFPLFNBQVMsUUFBUSxDQUFDLEtBQWMsRUFBbUI7SUFDeEQsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUM7QUFDbkMsQ0FBQztBQUVELE9BQU8sU0FBUyxXQUFXLENBQUMsS0FBYyxFQUFzQjtJQUM5RCxPQUFPLEtBQUssS0FBSyxTQUFTLENBQUM7QUFDN0IsQ0FBQztBQUVELE9BQU8sU0FBUyxRQUFRLENBQUMsS0FBYyxFQUFvQztJQUN6RSxPQUFPLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDO0FBQ3JELENBQUM7QUFFRCxPQUFPLFNBQVMsT0FBTyxDQUFDLENBQVUsRUFBVztJQUMzQyxPQUFPLENBQUMsWUFBWSxLQUFLLENBQUM7QUFDNUIsQ0FBQztBQUVELE9BQU8sU0FBUyxVQUFVLENBQUMsS0FBYyxFQUF1QjtJQUM5RCxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsT0FBTyxTQUFTLFFBQVEsQ0FBQyxLQUFjLEVBQW1CO0lBQ3hELE9BQU8sS0FBSyxZQUFZLE1BQU0sQ0FBQztBQUNqQyxDQUFDO0FBRUQsT0FBTyxTQUFTLE9BQU8sQ0FBSSxRQUFXLEVBQWdCO0lBQ3BELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sUUFBUSxDQUFDO0lBQ3ZDLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBRW5DLE9BQU87UUFBQyxRQUFRO0tBQUMsQ0FBQztBQUNwQixDQUFDO0FBRUQsT0FBTyxTQUFTLE1BQU0sQ0FBQyxHQUFXLEVBQUUsS0FBYSxFQUFVO0lBQ3pELElBQUksTUFBTSxHQUFHLEVBQUUsQUFBQztJQUVoQixJQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFFO1FBQzFDLE1BQU0sSUFBSSxHQUFHLENBQUM7SUFDaEIsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxPQUFPLFNBQVMsY0FBYyxDQUFDLENBQVMsRUFBVztJQUNqRCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLGlCQUFpQixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkQsQ0FBQyJ9