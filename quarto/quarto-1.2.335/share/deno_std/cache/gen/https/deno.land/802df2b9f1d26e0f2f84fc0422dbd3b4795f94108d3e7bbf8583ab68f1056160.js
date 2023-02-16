// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Builds two separate arrays from the given array of 2-tuples, with the first returned array holding all first
 * tuple elements and the second one holding all the second elements
 *
 * Example:
 *
 * ```ts
 * import { unzip } from "https://deno.land/std@$STD_VERSION/collections/unzip.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const parents = [
 *     [ 'Maria', 'Jeff' ],
 *     [ 'Anna', 'Kim' ],
 *     [ 'John', 'Leroy' ],
 * ] as [string, string][];
 *
 * const [ moms, dads ] = unzip(parents);
 *
 * assertEquals(moms, [ 'Maria', 'Anna', 'John' ]);
 * assertEquals(dads, [ 'Jeff', 'Kim', 'Leroy' ]);
 * ```
 */ export function unzip(pairs) {
    const { length  } = pairs;
    const ret = [
        Array.from({
            length
        }),
        Array.from({
            length
        }), 
    ];
    pairs.forEach(([first, second], index)=>{
        ret[0][index] = first;
        ret[1][index] = second;
    });
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3VuemlwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQnVpbGRzIHR3byBzZXBhcmF0ZSBhcnJheXMgZnJvbSB0aGUgZ2l2ZW4gYXJyYXkgb2YgMi10dXBsZXMsIHdpdGggdGhlIGZpcnN0IHJldHVybmVkIGFycmF5IGhvbGRpbmcgYWxsIGZpcnN0XG4gKiB0dXBsZSBlbGVtZW50cyBhbmQgdGhlIHNlY29uZCBvbmUgaG9sZGluZyBhbGwgdGhlIHNlY29uZCBlbGVtZW50c1xuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHVuemlwIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY29sbGVjdGlvbnMvdW56aXAudHNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGNvbnN0IHBhcmVudHMgPSBbXG4gKiAgICAgWyAnTWFyaWEnLCAnSmVmZicgXSxcbiAqICAgICBbICdBbm5hJywgJ0tpbScgXSxcbiAqICAgICBbICdKb2huJywgJ0xlcm95JyBdLFxuICogXSBhcyBbc3RyaW5nLCBzdHJpbmddW107XG4gKlxuICogY29uc3QgWyBtb21zLCBkYWRzIF0gPSB1bnppcChwYXJlbnRzKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMobW9tcywgWyAnTWFyaWEnLCAnQW5uYScsICdKb2huJyBdKTtcbiAqIGFzc2VydEVxdWFscyhkYWRzLCBbICdKZWZmJywgJ0tpbScsICdMZXJveScgXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuemlwPFQsIFU+KHBhaXJzOiByZWFkb25seSBbVCwgVV1bXSk6IFtUW10sIFVbXV0ge1xuICBjb25zdCB7IGxlbmd0aCB9ID0gcGFpcnM7XG4gIGNvbnN0IHJldDogW1RbXSwgVVtdXSA9IFtcbiAgICBBcnJheS5mcm9tKHsgbGVuZ3RoIH0pLFxuICAgIEFycmF5LmZyb20oeyBsZW5ndGggfSksXG4gIF07XG5cbiAgcGFpcnMuZm9yRWFjaCgoW2ZpcnN0LCBzZWNvbmRdLCBpbmRleCkgPT4ge1xuICAgIHJldFswXVtpbmRleF0gPSBmaXJzdDtcbiAgICByZXRbMV1baW5kZXhdID0gc2Vjb25kO1xuICB9KTtcblxuICByZXR1cm4gcmV0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCQyxHQUNELE9BQU8sU0FBUyxLQUFLLENBQU8sS0FBd0IsRUFBYztJQUNoRSxNQUFNLEVBQUUsTUFBTSxDQUFBLEVBQUUsR0FBRyxLQUFLLEFBQUM7SUFDekIsTUFBTSxHQUFHLEdBQWU7UUFDdEIsS0FBSyxDQUFDLElBQUksQ0FBQztZQUFFLE1BQU07U0FBRSxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFBRSxNQUFNO1NBQUUsQ0FBQztLQUN2QixBQUFDO0lBRUYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssR0FBSztRQUN4QyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==