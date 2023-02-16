// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Options for joinToString
 */ /**
 * Transforms the elements in the given array to strings using the given selector.
 * Joins the produced strings into one using the given `separator` and applying the given `prefix` and `suffix` to the whole string afterwards.
 * If the array could be huge, you can specify a non-negative value of `limit`, in which case only the first `limit` elements will be appended, followed by the `truncated` string.
 * Returns the resulting string.
 *
 * Example:
 *
 * ```ts
 * import { joinToString } from "https://deno.land/std@$STD_VERSION/collections/join_to_string.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const users = [
 *   { name: "Kim" },
 *   { name: "Anna" },
 *   { name: "Tim" },
 * ];
 *
 *  const message = joinToString(users, (it) => it.name, {
 *   suffix: " are winners",
 *   prefix: "result: ",
 *   separator: " and ",
 *   limit: 1,
 *   truncated: "others",
 * });
 *
 * assertEquals(message, "result: Kim and others are winners");
 * ```
 */ export function joinToString(array, selector, { separator ="," , prefix ="" , suffix ="" , limit =-1 , truncated ="..."  } = {}) {
    let result = "";
    let index = -1;
    while(++index < array.length){
        const el = array[index];
        if (index > 0) {
            result += separator;
        }
        if (limit > -1 && index >= limit) {
            result += truncated;
            break;
        }
        result += selector(el);
    }
    result = prefix + result + suffix;
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2pvaW5fdG9fc3RyaW5nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogT3B0aW9ucyBmb3Igam9pblRvU3RyaW5nXG4gKi9cbmV4cG9ydCB0eXBlIEpvaW5Ub1N0cmluZ09wdGlvbnMgPSB7XG4gIHNlcGFyYXRvcj86IHN0cmluZztcbiAgcHJlZml4Pzogc3RyaW5nO1xuICBzdWZmaXg/OiBzdHJpbmc7XG4gIGxpbWl0PzogbnVtYmVyO1xuICB0cnVuY2F0ZWQ/OiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIGVsZW1lbnRzIGluIHRoZSBnaXZlbiBhcnJheSB0byBzdHJpbmdzIHVzaW5nIHRoZSBnaXZlbiBzZWxlY3Rvci5cbiAqIEpvaW5zIHRoZSBwcm9kdWNlZCBzdHJpbmdzIGludG8gb25lIHVzaW5nIHRoZSBnaXZlbiBgc2VwYXJhdG9yYCBhbmQgYXBwbHlpbmcgdGhlIGdpdmVuIGBwcmVmaXhgIGFuZCBgc3VmZml4YCB0byB0aGUgd2hvbGUgc3RyaW5nIGFmdGVyd2FyZHMuXG4gKiBJZiB0aGUgYXJyYXkgY291bGQgYmUgaHVnZSwgeW91IGNhbiBzcGVjaWZ5IGEgbm9uLW5lZ2F0aXZlIHZhbHVlIG9mIGBsaW1pdGAsIGluIHdoaWNoIGNhc2Ugb25seSB0aGUgZmlyc3QgYGxpbWl0YCBlbGVtZW50cyB3aWxsIGJlIGFwcGVuZGVkLCBmb2xsb3dlZCBieSB0aGUgYHRydW5jYXRlZGAgc3RyaW5nLlxuICogUmV0dXJucyB0aGUgcmVzdWx0aW5nIHN0cmluZy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBqb2luVG9TdHJpbmcgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9qb2luX3RvX3N0cmluZy50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgdXNlcnMgPSBbXG4gKiAgIHsgbmFtZTogXCJLaW1cIiB9LFxuICogICB7IG5hbWU6IFwiQW5uYVwiIH0sXG4gKiAgIHsgbmFtZTogXCJUaW1cIiB9LFxuICogXTtcbiAqXG4gKiAgY29uc3QgbWVzc2FnZSA9IGpvaW5Ub1N0cmluZyh1c2VycywgKGl0KSA9PiBpdC5uYW1lLCB7XG4gKiAgIHN1ZmZpeDogXCIgYXJlIHdpbm5lcnNcIixcbiAqICAgcHJlZml4OiBcInJlc3VsdDogXCIsXG4gKiAgIHNlcGFyYXRvcjogXCIgYW5kIFwiLFxuICogICBsaW1pdDogMSxcbiAqICAgdHJ1bmNhdGVkOiBcIm90aGVyc1wiLFxuICogfSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKG1lc3NhZ2UsIFwicmVzdWx0OiBLaW0gYW5kIG90aGVycyBhcmUgd2lubmVyc1wiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gam9pblRvU3RyaW5nPFQ+KFxuICBhcnJheTogcmVhZG9ubHkgVFtdLFxuICBzZWxlY3RvcjogKGVsOiBUKSA9PiBzdHJpbmcsXG4gIHtcbiAgICBzZXBhcmF0b3IgPSBcIixcIixcbiAgICBwcmVmaXggPSBcIlwiLFxuICAgIHN1ZmZpeCA9IFwiXCIsXG4gICAgbGltaXQgPSAtMSxcbiAgICB0cnVuY2F0ZWQgPSBcIi4uLlwiLFxuICB9OiBSZWFkb25seTxKb2luVG9TdHJpbmdPcHRpb25zPiA9IHt9LFxuKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IFwiXCI7XG5cbiAgbGV0IGluZGV4ID0gLTE7XG4gIHdoaWxlICgrK2luZGV4IDwgYXJyYXkubGVuZ3RoKSB7XG4gICAgY29uc3QgZWwgPSBhcnJheVtpbmRleF07XG5cbiAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICByZXN1bHQgKz0gc2VwYXJhdG9yO1xuICAgIH1cblxuICAgIGlmIChsaW1pdCA+IC0xICYmIGluZGV4ID49IGxpbWl0KSB7XG4gICAgICByZXN1bHQgKz0gdHJ1bmNhdGVkO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IHNlbGVjdG9yKGVsKTtcbiAgfVxuXG4gIHJlc3VsdCA9IHByZWZpeCArIHJlc3VsdCArIHN1ZmZpeDtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7O0NBRUMsR0FDRCxBQVFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEJDLEdBQ0QsT0FBTyxTQUFTLFlBQVksQ0FDMUIsS0FBbUIsRUFDbkIsUUFBMkIsRUFDM0IsRUFDRSxTQUFTLEVBQUcsR0FBRyxDQUFBLEVBQ2YsTUFBTSxFQUFHLEVBQUUsQ0FBQSxFQUNYLE1BQU0sRUFBRyxFQUFFLENBQUEsRUFDWCxLQUFLLEVBQUcsQ0FBQyxDQUFDLENBQUEsRUFDVixTQUFTLEVBQUcsS0FBSyxDQUFBLEVBQ2EsR0FBRyxFQUFFLEVBQzdCO0lBQ1IsSUFBSSxNQUFNLEdBQUcsRUFBRSxBQUFDO0lBRWhCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxBQUFDO0lBQ2YsTUFBTyxFQUFFLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFFO1FBQzdCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQUFBQztRQUV4QixJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDYixNQUFNLElBQUksU0FBUyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksS0FBSyxFQUFFO1lBQ2hDLE1BQU0sSUFBSSxTQUFTLENBQUM7WUFDcEIsTUFBTTtRQUNSLENBQUM7UUFFRCxNQUFNLElBQUksUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRCxNQUFNLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFFbEMsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyJ9