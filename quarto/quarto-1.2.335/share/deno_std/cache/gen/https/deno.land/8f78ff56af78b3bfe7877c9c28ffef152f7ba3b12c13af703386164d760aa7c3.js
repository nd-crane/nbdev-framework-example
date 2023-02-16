// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Generators and validators for UUIDs for versions v1, v4 and v5.
 *
 * Consider using the web platform
 * [`crypto.randomUUID`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
 * for v4 UUIDs instead.
 *
 * Based on https://github.com/kelektiv/node-uuid -> https://www.ietf.org/rfc/rfc4122.txt
 *
 * Support for RFC4122 version 1, 4, and 5 UUIDs
 *
 * This module is browser compatible.
 *
 * @module
 */ import * as v1 from "./v1.ts";
import * as v4 from "./v4.ts";
import * as v5 from "./v5.ts";
export const NIL_UUID = "00000000-0000-0000-0000-000000000000";
/**
 * Check if the passed UUID is the nil UUID.
 *
 * ```js
 * import { isNil } from "./mod.ts";
 *
 * isNil("00000000-0000-0000-0000-000000000000") // true
 * isNil(crypto.randomUUID()) // false
 * ```
 */ export function isNil(id) {
    return id === NIL_UUID;
}
/**
 * Test a string to see if it is a valid UUID.
 *
 * ```js
 * import { validate } from "./mod.ts"
 *
 * validate("not a UUID") // false
 * validate("6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b") // true
 * ```
 */ export function validate(uuid) {
    return /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i.test(uuid);
}
/**
 * Detect RFC version of a UUID.
 *
 * ```js
 * import { version } from "./mod.ts"
 *
 * version("d9428888-122b-11e1-b85c-61cd3cbb3210") // 1
 * version("109156be-c4fb-41ea-b1b4-efe1671c5836") // 4
 * ```
 */ export function version(uuid) {
    if (!validate(uuid)) {
        throw TypeError("Invalid UUID");
    }
    return parseInt(uuid[14], 16);
}
export { v1, v4, v5 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3V1aWQvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKlxuICogR2VuZXJhdG9ycyBhbmQgdmFsaWRhdG9ycyBmb3IgVVVJRHMgZm9yIHZlcnNpb25zIHYxLCB2NCBhbmQgdjUuXG4gKlxuICogQ29uc2lkZXIgdXNpbmcgdGhlIHdlYiBwbGF0Zm9ybVxuICogW2BjcnlwdG8ucmFuZG9tVVVJRGBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DcnlwdG8vcmFuZG9tVVVJRClcbiAqIGZvciB2NCBVVUlEcyBpbnN0ZWFkLlxuICpcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9rZWxla3Rpdi9ub2RlLXV1aWQgLT4gaHR0cHM6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XG4gKlxuICogU3VwcG9ydCBmb3IgUkZDNDEyMiB2ZXJzaW9uIDEsIDQsIGFuZCA1IFVVSURzXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgKiBhcyB2MSBmcm9tIFwiLi92MS50c1wiO1xuaW1wb3J0ICogYXMgdjQgZnJvbSBcIi4vdjQudHNcIjtcbmltcG9ydCAqIGFzIHY1IGZyb20gXCIuL3Y1LnRzXCI7XG5cbmV4cG9ydCBjb25zdCBOSUxfVVVJRCA9IFwiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwXCI7XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHBhc3NlZCBVVUlEIGlzIHRoZSBuaWwgVVVJRC5cbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHsgaXNOaWwgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqXG4gKiBpc05pbChcIjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMFwiKSAvLyB0cnVlXG4gKiBpc05pbChjcnlwdG8ucmFuZG9tVVVJRCgpKSAvLyBmYWxzZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05pbChpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBpZCA9PT0gTklMX1VVSUQ7XG59XG5cbi8qKlxuICogVGVzdCBhIHN0cmluZyB0byBzZWUgaWYgaXQgaXMgYSB2YWxpZCBVVUlELlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgeyB2YWxpZGF0ZSB9IGZyb20gXCIuL21vZC50c1wiXG4gKlxuICogdmFsaWRhdGUoXCJub3QgYSBVVUlEXCIpIC8vIGZhbHNlXG4gKiB2YWxpZGF0ZShcIjZlYzBiZDdmLTExYzAtNDNkYS05NzVlLTJhOGFkOWViYWUwYlwiKSAvLyB0cnVlXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlKHV1aWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gL14oPzpbMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMS01XVswLTlhLWZdezN9LVs4OWFiXVswLTlhLWZdezN9LVswLTlhLWZdezEyfXwwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDApJC9pXG4gICAgLnRlc3QoXG4gICAgICB1dWlkLFxuICAgICk7XG59XG5cbi8qKlxuICogRGV0ZWN0IFJGQyB2ZXJzaW9uIG9mIGEgVVVJRC5cbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHsgdmVyc2lvbiB9IGZyb20gXCIuL21vZC50c1wiXG4gKlxuICogdmVyc2lvbihcImQ5NDI4ODg4LTEyMmItMTFlMS1iODVjLTYxY2QzY2JiMzIxMFwiKSAvLyAxXG4gKiB2ZXJzaW9uKFwiMTA5MTU2YmUtYzRmYi00MWVhLWIxYjQtZWZlMTY3MWM1ODM2XCIpIC8vIDRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmVyc2lvbih1dWlkOiBzdHJpbmcpOiBudW1iZXIge1xuICBpZiAoIXZhbGlkYXRlKHV1aWQpKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFwiSW52YWxpZCBVVUlEXCIpO1xuICB9XG5cbiAgcmV0dXJuIHBhcnNlSW50KHV1aWRbMTRdLCAxNik7XG59XG5cbmV4cG9ydCB7IHYxLCB2NCwgdjUgfTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUU7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FFRCxZQUFZLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDOUIsWUFBWSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzlCLFlBQVksRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUU5QixPQUFPLE1BQU0sUUFBUSxHQUFHLHNDQUFzQyxDQUFDO0FBRS9EOzs7Ozs7Ozs7Q0FTQyxHQUNELE9BQU8sU0FBUyxLQUFLLENBQUMsRUFBVSxFQUFXO0lBQ3pDLE9BQU8sRUFBRSxLQUFLLFFBQVEsQ0FBQztBQUN6QixDQUFDO0FBRUQ7Ozs7Ozs7OztDQVNDLEdBQ0QsT0FBTyxTQUFTLFFBQVEsQ0FBQyxJQUFZLEVBQVc7SUFDOUMsT0FBTyxzSEFDSixJQUFJLENBQ0gsSUFBSSxDQUNMLENBQUM7QUFDTixDQUFDO0FBRUQ7Ozs7Ozs7OztDQVNDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sQ0FBQyxJQUFZLEVBQVU7SUFDNUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQixNQUFNLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFFRCxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHIn0=