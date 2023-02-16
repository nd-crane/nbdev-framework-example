// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Builds all possible orders of all elements in the given array
 * Ignores equality of elements, meaning this will always return the same
 * number of permutations for a given length of input.
 *
 * Example:
 *
 * ```ts
 * import { permutations } from "https://deno.land/std@$STD_VERSION/collections/permutations.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [ 1, 2 ]
 * const windows = permutations(numbers)
 *
 * assertEquals(windows, [
 *     [ 1, 2 ],
 *     [ 2, 1 ],
 * ])
 * ```
 */ export function permutations(inputArray) {
    const ret = [];
    const k = inputArray.length;
    if (k === 0) {
        return ret;
    }
    // Heap's Algorithm
    const array = [
        ...inputArray
    ];
    const c = new Array(k).fill(0);
    ret.push([
        ...array
    ]);
    let i = 1;
    while(i < k){
        if (c[i] < i) {
            if (i % 2 === 0) {
                [array[0], array[i]] = [
                    array[i],
                    array[0]
                ];
            } else {
                [array[c[i]], array[i]] = [
                    array[i],
                    array[c[i]]
                ];
            }
            ret.push([
                ...array
            ]);
            c[i] += 1;
            i = 1;
        } else {
            c[i] = 0;
            i += 1;
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3Blcm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEJ1aWxkcyBhbGwgcG9zc2libGUgb3JkZXJzIG9mIGFsbCBlbGVtZW50cyBpbiB0aGUgZ2l2ZW4gYXJyYXlcbiAqIElnbm9yZXMgZXF1YWxpdHkgb2YgZWxlbWVudHMsIG1lYW5pbmcgdGhpcyB3aWxsIGFsd2F5cyByZXR1cm4gdGhlIHNhbWVcbiAqIG51bWJlciBvZiBwZXJtdXRhdGlvbnMgZm9yIGEgZ2l2ZW4gbGVuZ3RoIG9mIGlucHV0LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBlcm11dGF0aW9ucyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NvbGxlY3Rpb25zL3Blcm11dGF0aW9ucy50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgbnVtYmVycyA9IFsgMSwgMiBdXG4gKiBjb25zdCB3aW5kb3dzID0gcGVybXV0YXRpb25zKG51bWJlcnMpXG4gKlxuICogYXNzZXJ0RXF1YWxzKHdpbmRvd3MsIFtcbiAqICAgICBbIDEsIDIgXSxcbiAqICAgICBbIDIsIDEgXSxcbiAqIF0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBlcm11dGF0aW9uczxUPihpbnB1dEFycmF5OiByZWFkb25seSBUW10pOiBUW11bXSB7XG4gIGNvbnN0IHJldDogVFtdW10gPSBbXTtcbiAgY29uc3QgayA9IGlucHV0QXJyYXkubGVuZ3RoO1xuXG4gIGlmIChrID09PSAwKSB7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIEhlYXAncyBBbGdvcml0aG1cbiAgY29uc3QgYXJyYXkgPSBbLi4uaW5wdXRBcnJheV07XG4gIGNvbnN0IGMgPSBuZXcgQXJyYXk8bnVtYmVyPihrKS5maWxsKDApO1xuXG4gIHJldC5wdXNoKFsuLi5hcnJheV0pO1xuXG4gIGxldCBpID0gMTtcblxuICB3aGlsZSAoaSA8IGspIHtcbiAgICBpZiAoY1tpXSA8IGkpIHtcbiAgICAgIGlmIChpICUgMiA9PT0gMCkge1xuICAgICAgICBbYXJyYXlbMF0sIGFycmF5W2ldXSA9IFthcnJheVtpXSwgYXJyYXlbMF1dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgW2FycmF5W2NbaV1dLCBhcnJheVtpXV0gPSBbYXJyYXlbaV0sIGFycmF5W2NbaV1dXTtcbiAgICAgIH1cblxuICAgICAgcmV0LnB1c2goWy4uLmFycmF5XSk7XG5cbiAgICAgIGNbaV0gKz0gMTtcbiAgICAgIGkgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjW2ldID0gMDtcbiAgICAgIGkgKz0gMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkMsR0FDRCxPQUFPLFNBQVMsWUFBWSxDQUFJLFVBQXdCLEVBQVM7SUFDL0QsTUFBTSxHQUFHLEdBQVUsRUFBRSxBQUFDO0lBQ3RCLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEFBQUM7SUFFNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ1gsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQsbUJBQW1CO0lBQ25CLE1BQU0sS0FBSyxHQUFHO1dBQUksVUFBVTtLQUFDLEFBQUM7SUFDOUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxBQUFDO0lBRXZDLEdBQUcsQ0FBQyxJQUFJLENBQUM7V0FBSSxLQUFLO0tBQUMsQ0FBQyxDQUFDO0lBRXJCLElBQUksQ0FBQyxHQUFHLENBQUMsQUFBQztJQUVWLE1BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBRTtRQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNaLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2YsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7b0JBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUFDLENBQUM7WUFDOUMsT0FBTztnQkFDTCxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRztvQkFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUMsQ0FBQztZQUNwRCxDQUFDO1lBRUQsR0FBRyxDQUFDLElBQUksQ0FBQzttQkFBSSxLQUFLO2FBQUMsQ0FBQyxDQUFDO1lBRXJCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDVixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1IsT0FBTztZQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVCxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1QsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMifQ==