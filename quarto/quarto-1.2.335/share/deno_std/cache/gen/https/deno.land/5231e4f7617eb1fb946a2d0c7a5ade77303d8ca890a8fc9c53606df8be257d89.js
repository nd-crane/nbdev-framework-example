// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Validate that the passed UUID is an RFC4122 v4 UUID.
 *
 * ```ts
 * import { validate } from "./v4.ts";
 * import { generate as generateV1 } from "./v1.ts";
 *
 * validate(crypto.randomUUID()); // true
 * validate(generateV1() as string); // false
 * validate("this-is-not-a-uuid"); // false
 * ```
 */ export function validate(id) {
    return UUID_RE.test(id);
}
/**
 * @deprecated v4 UUID generation is deprecated and will be removed in a future
 * std/uuid release. Use the web standard `globalThis.crypto.randomUUID()`
 * function instead.
 *
 * Generate a RFC4122 v4 UUID (pseudo-random).
 */ export function generate() {
    return crypto.randomUUID();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3V1aWQvdjQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuY29uc3QgVVVJRF9SRSA9XG4gIC9eWzAtOWEtZl17OH0tWzAtOWEtZl17NH0tNFswLTlhLWZdezN9LVs4OWFiXVswLTlhLWZdezN9LVswLTlhLWZdezEyfSQvaTtcblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGF0IHRoZSBwYXNzZWQgVVVJRCBpcyBhbiBSRkM0MTIyIHY0IFVVSUQuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHZhbGlkYXRlIH0gZnJvbSBcIi4vdjQudHNcIjtcbiAqIGltcG9ydCB7IGdlbmVyYXRlIGFzIGdlbmVyYXRlVjEgfSBmcm9tIFwiLi92MS50c1wiO1xuICpcbiAqIHZhbGlkYXRlKGNyeXB0by5yYW5kb21VVUlEKCkpOyAvLyB0cnVlXG4gKiB2YWxpZGF0ZShnZW5lcmF0ZVYxKCkgYXMgc3RyaW5nKTsgLy8gZmFsc2VcbiAqIHZhbGlkYXRlKFwidGhpcy1pcy1ub3QtYS11dWlkXCIpOyAvLyBmYWxzZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZShpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBVVUlEX1JFLnRlc3QoaWQpO1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHY0IFVVSUQgZ2VuZXJhdGlvbiBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmVcbiAqIHN0ZC91dWlkIHJlbGVhc2UuIFVzZSB0aGUgd2ViIHN0YW5kYXJkIGBnbG9iYWxUaGlzLmNyeXB0by5yYW5kb21VVUlEKClgXG4gKiBmdW5jdGlvbiBpbnN0ZWFkLlxuICpcbiAqIEdlbmVyYXRlIGEgUkZDNDEyMiB2NCBVVUlEIChwc2V1ZG8tcmFuZG9tKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlKCk6IHN0cmluZyB7XG4gIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsTUFBTSxPQUFPLDJFQUM2RCxBQUFDO0FBRTNFOzs7Ozs7Ozs7OztDQVdDLEdBQ0QsT0FBTyxTQUFTLFFBQVEsQ0FBQyxFQUFVLEVBQVc7SUFDNUMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRDs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsUUFBUSxHQUFXO0lBQ2pDLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzdCLENBQUMifQ==