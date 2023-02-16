// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// deno-lint-ignore-file ban-types
import { filterInPlace } from "./_utils.ts";
const { hasOwn  } = Object;
export function deepMerge(record, other, options) {
    return deepMergeInternal(record, other, new Set(), options);
}
function deepMergeInternal(record, other, seen, options) {
    const result = {};
    const keys = new Set([
        ...getKeys(record),
        ...getKeys(other), 
    ]);
    // Iterate through each key of other object and use correct merging strategy
    for (const key of keys){
        // Skip to prevent Object.prototype.__proto__ accessor property calls on non-Deno platforms
        if (key === "__proto__") {
            continue;
        }
        const a = record[key];
        if (!hasOwn(other, key)) {
            result[key] = a;
            continue;
        }
        const b = other[key];
        if (isNonNullObject(a) && isNonNullObject(b) && !seen.has(a) && !seen.has(b)) {
            seen.add(a);
            seen.add(b);
            result[key] = mergeObjects(a, b, seen, options);
            continue;
        }
        // Override value
        result[key] = b;
    }
    return result;
}
function mergeObjects(left, right, seen, options = {
    arrays: "merge",
    sets: "merge",
    maps: "merge"
}) {
    // Recursively merge mergeable objects
    if (isMergeable(left) && isMergeable(right)) {
        return deepMergeInternal(left, right, seen);
    }
    if (isIterable(left) && isIterable(right)) {
        // Handle arrays
        if (Array.isArray(left) && Array.isArray(right)) {
            if (options.arrays === "merge") {
                return left.concat(right);
            }
            return right;
        }
        // Handle maps
        if (left instanceof Map && right instanceof Map) {
            if (options.maps === "merge") {
                return new Map([
                    ...left,
                    ...right, 
                ]);
            }
            return right;
        }
        // Handle sets
        if (left instanceof Set && right instanceof Set) {
            if (options.sets === "merge") {
                return new Set([
                    ...left,
                    ...right, 
                ]);
            }
            return right;
        }
    }
    return right;
}
/**
 * Test whether a value is mergeable or not
 * Builtins that look like objects, null and user defined classes
 * are not considered mergeable (it means that reference will be copied)
 */ function isMergeable(value) {
    return Object.getPrototypeOf(value) === Object.prototype;
}
function isIterable(value) {
    return typeof value[Symbol.iterator] === "function";
}
function isNonNullObject(value) {
    return value !== null && typeof value === "object";
}
function getKeys(record) {
    const ret = Object.getOwnPropertySymbols(record);
    filterInPlace(ret, (key)=>Object.prototype.propertyIsEnumerable.call(record, key));
    ret.push(...Object.keys(record));
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL2RlZXBfbWVyZ2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLy8gZGVuby1saW50LWlnbm9yZS1maWxlIGJhbi10eXBlc1xuXG5pbXBvcnQgeyBmaWx0ZXJJblBsYWNlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5cbmNvbnN0IHsgaGFzT3duIH0gPSBPYmplY3Q7XG5cbi8qKlxuICogTWVyZ2VzIHRoZSB0d28gZ2l2ZW4gUmVjb3JkcywgcmVjdXJzaXZlbHkgbWVyZ2luZyBhbnkgbmVzdGVkIFJlY29yZHMgd2l0aFxuICogdGhlIHNlY29uZCBjb2xsZWN0aW9uIG92ZXJyaWRpbmcgdGhlIGZpcnN0IGluIGNhc2Ugb2YgY29uZmxpY3RcbiAqXG4gKiBGb3IgYXJyYXlzLCBtYXBzIGFuZCBzZXRzLCBhIG1lcmdpbmcgc3RyYXRlZ3kgY2FuIGJlIHNwZWNpZmllZCB0byBlaXRoZXJcbiAqIFwicmVwbGFjZVwiIHZhbHVlcywgb3IgXCJtZXJnZVwiIHRoZW0gaW5zdGVhZC5cbiAqIFVzZSBcImluY2x1ZGVOb25FbnVtZXJhYmxlXCIgb3B0aW9uIHRvIGluY2x1ZGUgbm9uIGVudW1lcmFibGUgcHJvcGVydGllcyB0b28uXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY29sbGVjdGlvbnMvZGVlcF9tZXJnZS50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgYSA9IHtmb286IHRydWV9XG4gKiBjb25zdCBiID0ge2Zvbzoge2JhcjogdHJ1ZX19XG4gKlxuICogYXNzZXJ0RXF1YWxzKGRlZXBNZXJnZShhLCBiKSwge2Zvbzoge2JhcjogdHJ1ZX19KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVlcE1lcmdlPFxuICBUIGV4dGVuZHMgUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPixcbj4oXG4gIHJlY29yZDogUGFydGlhbDxSZWFkb25seTxUPj4sXG4gIG90aGVyOiBQYXJ0aWFsPFJlYWRvbmx5PFQ+PixcbiAgb3B0aW9ucz86IFJlYWRvbmx5PERlZXBNZXJnZU9wdGlvbnM+LFxuKTogVDtcblxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBNZXJnZTxcbiAgVCBleHRlbmRzIFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4sXG4gIFUgZXh0ZW5kcyBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+LFxuICBPcHRpb25zIGV4dGVuZHMgRGVlcE1lcmdlT3B0aW9ucyxcbj4oXG4gIHJlY29yZDogUmVhZG9ubHk8VD4sXG4gIG90aGVyOiBSZWFkb25seTxVPixcbiAgb3B0aW9ucz86IFJlYWRvbmx5PE9wdGlvbnM+LFxuKTogRGVlcE1lcmdlPFQsIFUsIE9wdGlvbnM+O1xuXG5leHBvcnQgZnVuY3Rpb24gZGVlcE1lcmdlPFxuICBUIGV4dGVuZHMgUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPixcbiAgVSBleHRlbmRzIFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4sXG4gIE9wdGlvbnMgZXh0ZW5kcyBEZWVwTWVyZ2VPcHRpb25zID0ge1xuICAgIGFycmF5czogXCJtZXJnZVwiO1xuICAgIHNldHM6IFwibWVyZ2VcIjtcbiAgICBtYXBzOiBcIm1lcmdlXCI7XG4gIH0sXG4+KFxuICByZWNvcmQ6IFJlYWRvbmx5PFQ+LFxuICBvdGhlcjogUmVhZG9ubHk8VT4sXG4gIG9wdGlvbnM/OiBSZWFkb25seTxPcHRpb25zPixcbik6IERlZXBNZXJnZTxULCBVLCBPcHRpb25zPiB7XG4gIHJldHVybiBkZWVwTWVyZ2VJbnRlcm5hbChyZWNvcmQsIG90aGVyLCBuZXcgU2V0KCksIG9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBkZWVwTWVyZ2VJbnRlcm5hbDxcbiAgVCBleHRlbmRzIFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4sXG4gIFUgZXh0ZW5kcyBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+LFxuICBPcHRpb25zIGV4dGVuZHMgRGVlcE1lcmdlT3B0aW9ucyA9IHtcbiAgICBhcnJheXM6IFwibWVyZ2VcIjtcbiAgICBzZXRzOiBcIm1lcmdlXCI7XG4gICAgbWFwczogXCJtZXJnZVwiO1xuICB9LFxuPihcbiAgcmVjb3JkOiBSZWFkb25seTxUPixcbiAgb3RoZXI6IFJlYWRvbmx5PFU+LFxuICBzZWVuOiBTZXQ8Tm9uTnVsbGFibGU8b2JqZWN0Pj4sXG4gIG9wdGlvbnM/OiBSZWFkb25seTxPcHRpb25zPixcbikge1xuICAvLyBFeHRyYWN0IG9wdGlvbnNcbiAgLy8gQ2xvbmUgbGVmdCBvcGVyYW5kIHRvIGF2b2lkIHBlcmZvcm1pbmcgbXV0YXRpb25zIGluLXBsYWNlXG4gIHR5cGUgUmVzdWx0ID0gRGVlcE1lcmdlPFQsIFUsIE9wdGlvbnM+O1xuICBjb25zdCByZXN1bHQ6IFBhcnRpYWw8UmVzdWx0PiA9IHt9O1xuXG4gIGNvbnN0IGtleXMgPSBuZXcgU2V0KFtcbiAgICAuLi5nZXRLZXlzKHJlY29yZCksXG4gICAgLi4uZ2V0S2V5cyhvdGhlciksXG4gIF0pIGFzIFNldDxrZXlvZiBSZXN1bHQ+O1xuXG4gIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIGtleSBvZiBvdGhlciBvYmplY3QgYW5kIHVzZSBjb3JyZWN0IG1lcmdpbmcgc3RyYXRlZ3lcbiAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgIC8vIFNraXAgdG8gcHJldmVudCBPYmplY3QucHJvdG90eXBlLl9fcHJvdG9fXyBhY2Nlc3NvciBwcm9wZXJ0eSBjYWxscyBvbiBub24tRGVubyBwbGF0Zm9ybXNcbiAgICBpZiAoa2V5ID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB0eXBlIFJlc3VsdE1lbWJlciA9IFJlc3VsdFt0eXBlb2Yga2V5XTtcblxuICAgIGNvbnN0IGEgPSByZWNvcmRba2V5XSBhcyBSZXN1bHRNZW1iZXI7XG5cbiAgICBpZiAoIWhhc093bihvdGhlciwga2V5KSkge1xuICAgICAgcmVzdWx0W2tleV0gPSBhO1xuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBiID0gb3RoZXJba2V5XSBhcyBSZXN1bHRNZW1iZXI7XG5cbiAgICBpZiAoXG4gICAgICBpc05vbk51bGxPYmplY3QoYSkgJiYgaXNOb25OdWxsT2JqZWN0KGIpICYmICFzZWVuLmhhcyhhKSAmJiAhc2Vlbi5oYXMoYilcbiAgICApIHtcbiAgICAgIHNlZW4uYWRkKGEpO1xuICAgICAgc2Vlbi5hZGQoYik7XG4gICAgICByZXN1bHRba2V5XSA9IG1lcmdlT2JqZWN0cyhhLCBiLCBzZWVuLCBvcHRpb25zKSBhcyBSZXN1bHRNZW1iZXI7XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIE92ZXJyaWRlIHZhbHVlXG4gICAgcmVzdWx0W2tleV0gPSBiO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdCBhcyBSZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIG1lcmdlT2JqZWN0cyhcbiAgbGVmdDogUmVhZG9ubHk8Tm9uTnVsbGFibGU8b2JqZWN0Pj4sXG4gIHJpZ2h0OiBSZWFkb25seTxOb25OdWxsYWJsZTxvYmplY3Q+PixcbiAgc2VlbjogU2V0PE5vbk51bGxhYmxlPG9iamVjdD4+LFxuICBvcHRpb25zOiBSZWFkb25seTxEZWVwTWVyZ2VPcHRpb25zPiA9IHtcbiAgICBhcnJheXM6IFwibWVyZ2VcIixcbiAgICBzZXRzOiBcIm1lcmdlXCIsXG4gICAgbWFwczogXCJtZXJnZVwiLFxuICB9LFxuKTogUmVhZG9ubHk8Tm9uTnVsbGFibGU8b2JqZWN0Pj4ge1xuICAvLyBSZWN1cnNpdmVseSBtZXJnZSBtZXJnZWFibGUgb2JqZWN0c1xuICBpZiAoaXNNZXJnZWFibGUobGVmdCkgJiYgaXNNZXJnZWFibGUocmlnaHQpKSB7XG4gICAgcmV0dXJuIGRlZXBNZXJnZUludGVybmFsKGxlZnQsIHJpZ2h0LCBzZWVuKTtcbiAgfVxuXG4gIGlmIChpc0l0ZXJhYmxlKGxlZnQpICYmIGlzSXRlcmFibGUocmlnaHQpKSB7XG4gICAgLy8gSGFuZGxlIGFycmF5c1xuICAgIGlmICgoQXJyYXkuaXNBcnJheShsZWZ0KSkgJiYgKEFycmF5LmlzQXJyYXkocmlnaHQpKSkge1xuICAgICAgaWYgKG9wdGlvbnMuYXJyYXlzID09PSBcIm1lcmdlXCIpIHtcbiAgICAgICAgcmV0dXJuIGxlZnQuY29uY2F0KHJpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJpZ2h0O1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBtYXBzXG4gICAgaWYgKChsZWZ0IGluc3RhbmNlb2YgTWFwKSAmJiAocmlnaHQgaW5zdGFuY2VvZiBNYXApKSB7XG4gICAgICBpZiAob3B0aW9ucy5tYXBzID09PSBcIm1lcmdlXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXAoW1xuICAgICAgICAgIC4uLmxlZnQsXG4gICAgICAgICAgLi4ucmlnaHQsXG4gICAgICAgIF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmlnaHQ7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNldHNcbiAgICBpZiAoKGxlZnQgaW5zdGFuY2VvZiBTZXQpICYmIChyaWdodCBpbnN0YW5jZW9mIFNldCkpIHtcbiAgICAgIGlmIChvcHRpb25zLnNldHMgPT09IFwibWVyZ2VcIikge1xuICAgICAgICByZXR1cm4gbmV3IFNldChbXG4gICAgICAgICAgLi4ubGVmdCxcbiAgICAgICAgICAuLi5yaWdodCxcbiAgICAgICAgXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByaWdodDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmlnaHQ7XG59XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIGEgdmFsdWUgaXMgbWVyZ2VhYmxlIG9yIG5vdFxuICogQnVpbHRpbnMgdGhhdCBsb29rIGxpa2Ugb2JqZWN0cywgbnVsbCBhbmQgdXNlciBkZWZpbmVkIGNsYXNzZXNcbiAqIGFyZSBub3QgY29uc2lkZXJlZCBtZXJnZWFibGUgKGl0IG1lYW5zIHRoYXQgcmVmZXJlbmNlIHdpbGwgYmUgY29waWVkKVxuICovXG5mdW5jdGlvbiBpc01lcmdlYWJsZShcbiAgdmFsdWU6IE5vbk51bGxhYmxlPG9iamVjdD4sXG4pOiB2YWx1ZSBpcyBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSkgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbmZ1bmN0aW9uIGlzSXRlcmFibGUoXG4gIHZhbHVlOiBOb25OdWxsYWJsZTxvYmplY3Q+LFxuKTogdmFsdWUgaXMgSXRlcmFibGU8dW5rbm93bj4ge1xuICByZXR1cm4gdHlwZW9mICh2YWx1ZSBhcyBJdGVyYWJsZTx1bmtub3duPilbU3ltYm9sLml0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG5mdW5jdGlvbiBpc05vbk51bGxPYmplY3QodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBOb25OdWxsYWJsZTxvYmplY3Q+IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIjtcbn1cblxuZnVuY3Rpb24gZ2V0S2V5czxUIGV4dGVuZHMgb2JqZWN0PihyZWNvcmQ6IFQpOiBBcnJheTxrZXlvZiBUPiB7XG4gIGNvbnN0IHJldCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocmVjb3JkKSBhcyBBcnJheTxrZXlvZiBUPjtcbiAgZmlsdGVySW5QbGFjZShcbiAgICByZXQsXG4gICAgKGtleSkgPT4gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHJlY29yZCwga2V5KSxcbiAgKTtcbiAgcmV0LnB1c2goLi4uKE9iamVjdC5rZXlzKHJlY29yZCkgYXMgQXJyYXk8a2V5b2YgVD4pKTtcblxuICByZXR1cm4gcmV0O1xufVxuXG4vKiogTWVyZ2luZyBzdHJhdGVneSAqL1xuZXhwb3J0IHR5cGUgTWVyZ2luZ1N0cmF0ZWd5ID0gXCJyZXBsYWNlXCIgfCBcIm1lcmdlXCI7XG5cbi8qKiBEZWVwIG1lcmdlIG9wdGlvbnMgKi9cbmV4cG9ydCB0eXBlIERlZXBNZXJnZU9wdGlvbnMgPSB7XG4gIC8qKiBNZXJnaW5nIHN0cmF0ZWd5IGZvciBhcnJheXMgKi9cbiAgYXJyYXlzPzogTWVyZ2luZ1N0cmF0ZWd5O1xuICAvKiogTWVyZ2luZyBzdHJhdGVneSBmb3IgTWFwcyAqL1xuICBtYXBzPzogTWVyZ2luZ1N0cmF0ZWd5O1xuICAvKiogTWVyZ2luZyBzdHJhdGVneSBmb3IgU2V0cyAqL1xuICBzZXRzPzogTWVyZ2luZ1N0cmF0ZWd5O1xufTtcblxuLyoqXG4gKiBIb3cgZG9lcyByZWN1cnNpdmUgdHlwaW5nIHdvcmtzID9cbiAqXG4gKiBEZWVwIG1lcmdpbmcgcHJvY2VzcyBpcyBoYW5kbGVkIHRocm91Z2ggYERlZXBNZXJnZTxULCBVLCBPcHRpb25zPmAgdHlwZS5cbiAqIElmIGJvdGggVCBhbmQgVSBhcmUgUmVjb3Jkcywgd2UgcmVjdXJzaXZlbHkgbWVyZ2UgdGhlbSxcbiAqIGVsc2Ugd2UgdHJlYXQgdGhlbSBhcyBwcmltaXRpdmVzLlxuICpcbiAqIE1lcmdpbmcgcHJvY2VzcyBpcyBoYW5kbGVkIHRocm91Z2ggYE1lcmdlPFQsIFU+YCB0eXBlLCBpbiB3aGljaFxuICogd2UgcmVtb3ZlIGFsbCBtYXBzLCBzZXRzLCBhcnJheXMgYW5kIHJlY29yZHMgc28gd2UgY2FuIGhhbmRsZSB0aGVtXG4gKiBzZXBhcmF0ZWx5IGRlcGVuZGluZyBvbiBtZXJnaW5nIHN0cmF0ZWd5OlxuICpcbiAqICAgIE1lcmdlPFxuICogICAgICB7Zm9vOiBzdHJpbmd9LFxuICogICAgICB7YmFyOiBzdHJpbmcsIGJhejogU2V0PHVua25vd24+fSxcbiAqICAgID4gLy8gXCJmb29cIiBhbmQgXCJiYXJcIiB3aWxsIGJlIGhhbmRsZWQgd2l0aCBgTWVyZ2VSaWdodE9taXRDb21wbGV4ZXNgXG4gKiAgICAgIC8vIFwiYmF6XCIgd2lsbCBiZSBoYW5kbGVkIHdpdGggYE1lcmdlQWxsKmAgdHlwZVxuICpcbiAqIGBNZXJnZVJpZ2h0T21pdENvbXBsZXhlczxULCBVPmAgd2lsbCBkbyB0aGUgYWJvdmU6IGFsbCBUJ3NcbiAqIGV4Y2x1c2l2ZSBrZXlzIHdpbGwgYmUga2VwdCwgdGhvdWdoIGNvbW1vbiBvbmVzIHdpdGggVSB3aWxsIGhhdmUgdGhlaXJcbiAqIHR5cGluZyBvdmVycmlkZGVuIGluc3RlYWQ6XG4gKlxuICogICAgTWVyZ2VSaWdodE9taXRDb21wbGV4ZXM8XG4gKiAgICAgIHtmb286IHN0cmluZywgYmF6OiBudW1iZXJ9LFxuICogICAgICB7Zm9vOiBib29sZWFuLCBiYXI6IHN0cmluZ31cbiAqICAgID4gLy8ge2JhejogbnVtYmVyLCBmb286IGJvb2xlYW4sIGJhcjogc3RyaW5nfVxuICogICAgICAvLyBcImJhelwiIHdhcyBrZXB0IGZyb20gVFxuICogICAgICAvLyBcImZvb1wiIHdhcyBvdmVycmlkZGVuIGJ5IFUncyB0eXBpbmdcbiAqICAgICAgLy8gXCJiYXJcIiB3YXMgYWRkZWQgZnJvbSBVXG4gKlxuICogRm9yIE1hcHMsIEFycmF5cywgU2V0cyBhbmQgUmVjb3Jkcywgd2UgdXNlIGBNZXJnZUFsbCo8VCwgVT5gIHV0aWxpdHlcbiAqIHR5cGVzLiBUaGV5IHdpbGwgZXh0cmFjdCByZWxldmFudCBkYXRhIHN0cnVjdHVyZSBmcm9tIGJvdGggVCBhbmQgVVxuICogKHByb3ZpZGluZyB0aGF0IGJvdGggaGF2ZSBzYW1lIGRhdGEgZGF0YSBzdHJ1Y3R1cmUsIGV4Y2VwdCBmb3IgdHlwaW5nKS5cbiAqXG4gKiBGcm9tIHRoZXNlLCBgKlZhbHVlVHlwZTxUPmAgd2lsbCBleHRyYWN0IHZhbHVlcyAoYW5kIGtleXMpIHR5cGVzIHRvIGJlXG4gKiBhYmxlIHRvIGNyZWF0ZSBhIG5ldyBkYXRhIHN0cnVjdHVyZSB3aXRoIGFuIHVuaW9uIHR5cGluZyBmcm9tIGJvdGhcbiAqIGRhdGEgc3RydWN0dXJlIG9mIFQgYW5kIFU6XG4gKlxuICogICAgTWVyZ2VBbGxTZXRzPFxuICogICAgICB7Zm9vOiBTZXQ8bnVtYmVyPn0sXG4gKiAgICAgIHtmb286IFNldDxzdHJpbmc+fVxuICogICAgPiAvLyBgU2V0VmFsdWVUeXBlYCB3aWxsIGV4dHJhY3QgXCJudW1iZXJcIiBmb3IgVFxuICogICAgICAvLyBgU2V0VmFsdWVUeXBlYCB3aWxsIGV4dHJhY3QgXCJzdHJpbmdcIiBmb3IgVVxuICogICAgICAvLyBgTWVyZ2VBbGxTZXRzYCB3aWxsIGluZmVyIHR5cGUgYXMgU2V0PG51bWJlcnxzdHJpbmc+XG4gKiAgICAgIC8vIFByb2Nlc3MgaXMgc2ltaWxhciBmb3IgTWFwcywgQXJyYXlzLCBhbmQgU2V0c1xuICpcbiAqIGBEZWVwTWVyZ2U8VCwgVSwgT3B0aW9ucz5gIGlzIHRha2luZyBhIHRoaXJkIGFyZ3VtZW50IHRvIGJlIGhhbmRsZSB0b1xuICogaW5mZXIgZmluYWwgdHlwaW5nIGRlcGVuZGluZyBvbiBtZXJnaW5nIHN0cmF0ZWd5OlxuICpcbiAqICAgICYgKE9wdGlvbnMgZXh0ZW5kcyB7IHNldHM6IFwicmVwbGFjZVwiIH0gPyBQYXJ0aWFsQnlUeXBlPFUsIFNldDx1bmtub3duPj5cbiAqICAgICAgOiBNZXJnZUFsbFNldHM8VCwgVT4pXG4gKlxuICogSW4gdGhlIGFib3ZlIGxpbmUsIGlmIFwiT3B0aW9uc1wiIGhhdmUgaXRzIG1lcmdpbmcgc3RyYXRlZ3kgZm9yIFNldHMgc2V0IHRvXG4gKiBcInJlcGxhY2VcIiwgaW5zdGVhZCBvZiBwZXJmb3JtaW5nIG1lcmdpbmcgb2YgU2V0cyB0eXBlLCBpdCB3aWxsIHRha2UgdGhlXG4gKiB0eXBpbmcgZnJvbSByaWdodCBvcGVyYW5kIChVKSBpbnN0ZWFkLCBlZmZlY3RpdmVseSByZXBsYWNpbmcgdGhlIHR5cGluZy5cbiAqXG4gKiBBbiBhZGRpdGlvbmFsIG5vdGUsIHdlIHVzZSBgRXhwYW5kUmVjdXJzaXZlbHk8VD5gIHV0aWxpdHkgdHlwZSB0byBleHBhbmRcbiAqIHRoZSByZXN1bHRpbmcgdHlwaW5nIGFuZCBoaWRlIGFsbCB0aGUgdHlwaW5nIGxvZ2ljIG9mIGRlZXAgbWVyZ2luZyBzbyBpdCBpc1xuICogbW9yZSB1c2VyIGZyaWVuZGx5LlxuICovXG5cbi8qKiBGb3JjZSBpbnRlbGxpc2Vuc2UgdG8gZXhwYW5kIHRoZSB0eXBpbmcgdG8gaGlkZSBtZXJnaW5nIHR5cGluZ3MgKi9cbnR5cGUgRXhwYW5kUmVjdXJzaXZlbHk8VD4gPSBUIGV4dGVuZHMgUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPlxuICA/IFQgZXh0ZW5kcyBpbmZlciBPID8geyBbSyBpbiBrZXlvZiBPXTogRXhwYW5kUmVjdXJzaXZlbHk8T1tLXT4gfSA6IG5ldmVyXG4gIDogVDtcblxuLyoqIEZpbHRlciBvZiBrZXlzIG1hdGNoaW5nIGEgZ2l2ZW4gdHlwZSAqL1xudHlwZSBQYXJ0aWFsQnlUeXBlPFQsIFU+ID0ge1xuICBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBVID8gSyA6IG5ldmVyXTogVFtLXTtcbn07XG5cbi8qKiBHZXQgc2V0IHZhbHVlcyB0eXBlICovXG50eXBlIFNldFZhbHVlVHlwZTxUPiA9IFQgZXh0ZW5kcyBTZXQ8aW5mZXIgVj4gPyBWIDogbmV2ZXI7XG5cbi8qKiBNZXJnZSBhbGwgc2V0cyB0eXBlcyBkZWZpbml0aW9ucyBmcm9tIGtleXMgcHJlc2VudCBpbiBib3RoIG9iamVjdHMgKi9cbnR5cGUgTWVyZ2VBbGxTZXRzPFxuICBULFxuICBVLFxuICBYID0gUGFydGlhbEJ5VHlwZTxULCBTZXQ8dW5rbm93bj4+LFxuICBZID0gUGFydGlhbEJ5VHlwZTxVLCBTZXQ8dW5rbm93bj4+LFxuICBaID0ge1xuICAgIFtLIGluIGtleW9mIFggJiBrZXlvZiBZXTogU2V0PFNldFZhbHVlVHlwZTxYW0tdPiB8IFNldFZhbHVlVHlwZTxZW0tdPj47XG4gIH0sXG4+ID0gWjtcblxuLyoqIEdldCBhcnJheSB2YWx1ZXMgdHlwZSAqL1xudHlwZSBBcnJheVZhbHVlVHlwZTxUPiA9IFQgZXh0ZW5kcyBBcnJheTxpbmZlciBWPiA/IFYgOiBuZXZlcjtcblxuLyoqIE1lcmdlIGFsbCBzZXRzIHR5cGVzIGRlZmluaXRpb25zIGZyb20ga2V5cyBwcmVzZW50IGluIGJvdGggb2JqZWN0cyAqL1xudHlwZSBNZXJnZUFsbEFycmF5czxcbiAgVCxcbiAgVSxcbiAgWCA9IFBhcnRpYWxCeVR5cGU8VCwgQXJyYXk8dW5rbm93bj4+LFxuICBZID0gUGFydGlhbEJ5VHlwZTxVLCBBcnJheTx1bmtub3duPj4sXG4gIFogPSB7XG4gICAgW0sgaW4ga2V5b2YgWCAmIGtleW9mIFldOiBBcnJheTxcbiAgICAgIEFycmF5VmFsdWVUeXBlPFhbS10+IHwgQXJyYXlWYWx1ZVR5cGU8WVtLXT5cbiAgICA+O1xuICB9LFxuPiA9IFo7XG5cbi8qKiBHZXQgbWFwIHZhbHVlcyB0eXBlcyAqL1xudHlwZSBNYXBLZXlUeXBlPFQ+ID0gVCBleHRlbmRzIE1hcDxpbmZlciBLLCB1bmtub3duPiA/IEsgOiBuZXZlcjtcblxuLyoqIEdldCBtYXAgdmFsdWVzIHR5cGVzICovXG50eXBlIE1hcFZhbHVlVHlwZTxUPiA9IFQgZXh0ZW5kcyBNYXA8dW5rbm93biwgaW5mZXIgVj4gPyBWIDogbmV2ZXI7XG5cbi8qKiBNZXJnZSBhbGwgc2V0cyB0eXBlcyBkZWZpbml0aW9ucyBmcm9tIGtleXMgcHJlc2VudCBpbiBib3RoIG9iamVjdHMgKi9cbnR5cGUgTWVyZ2VBbGxNYXBzPFxuICBULFxuICBVLFxuICBYID0gUGFydGlhbEJ5VHlwZTxULCBNYXA8dW5rbm93biwgdW5rbm93bj4+LFxuICBZID0gUGFydGlhbEJ5VHlwZTxVLCBNYXA8dW5rbm93biwgdW5rbm93bj4+LFxuICBaID0ge1xuICAgIFtLIGluIGtleW9mIFggJiBrZXlvZiBZXTogTWFwPFxuICAgICAgTWFwS2V5VHlwZTxYW0tdPiB8IE1hcEtleVR5cGU8WVtLXT4sXG4gICAgICBNYXBWYWx1ZVR5cGU8WFtLXT4gfCBNYXBWYWx1ZVR5cGU8WVtLXT5cbiAgICA+O1xuICB9LFxuPiA9IFo7XG5cbi8qKiBNZXJnZSBhbGwgcmVjb3JkcyB0eXBlcyBkZWZpbml0aW9ucyBmcm9tIGtleXMgcHJlc2VudCBpbiBib3RoIG9iamVjdHMgKi9cbnR5cGUgTWVyZ2VBbGxSZWNvcmRzPFxuICBULFxuICBVLFxuICBPcHRpb25zLFxuICBYID0gUGFydGlhbEJ5VHlwZTxULCBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+PixcbiAgWSA9IFBhcnRpYWxCeVR5cGU8VSwgUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPj4sXG4gIFogPSB7XG4gICAgW0sgaW4ga2V5b2YgWCAmIGtleW9mIFldOiBEZWVwTWVyZ2U8WFtLXSwgWVtLXSwgT3B0aW9ucz47XG4gIH0sXG4+ID0gWjtcblxuLyoqIEV4Y2x1ZGUgbWFwLCBzZXRzIGFuZCBhcnJheSBmcm9tIHR5cGUgKi9cbnR5cGUgT21pdENvbXBsZXhlczxUPiA9IE9taXQ8XG4gIFQsXG4gIGtleW9mIFBhcnRpYWxCeVR5cGU8XG4gICAgVCxcbiAgICB8IE1hcDx1bmtub3duLCB1bmtub3duPlxuICAgIHwgU2V0PHVua25vd24+XG4gICAgfCBBcnJheTx1bmtub3duPlxuICAgIHwgUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPlxuICA+XG4+O1xuXG4vKiogT2JqZWN0IHdpdGgga2V5cyBpbiBlaXRoZXIgVCBvciBVIGJ1dCBub3QgaW4gYm90aCAqL1xudHlwZSBPYmplY3RYb3JLZXlzPFxuICBULFxuICBVLFxuICBYID0gT21pdDxULCBrZXlvZiBVPiAmIE9taXQ8VSwga2V5b2YgVD4sXG4gIFkgPSB7IFtLIGluIGtleW9mIFhdOiBYW0tdIH0sXG4+ID0gWTtcblxuLyoqIE1lcmdlIHR3byBvYmplY3RzLCB3aXRoIGxlZnQgcHJlY2VkZW5jZSAqL1xudHlwZSBNZXJnZVJpZ2h0T21pdENvbXBsZXhlczxcbiAgVCxcbiAgVSxcbiAgWCA9IE9iamVjdFhvcktleXM8VCwgVT4gJiBPbWl0Q29tcGxleGVzPHsgW0sgaW4ga2V5b2YgVV06IFVbS10gfT4sXG4+ID0gWDtcblxuLyoqIE1lcmdlIHR3byBvYmplY3RzICovXG50eXBlIE1lcmdlPFxuICBULFxuICBVLFxuICBPcHRpb25zLFxuICBYID1cbiAgICAmIE1lcmdlUmlnaHRPbWl0Q29tcGxleGVzPFQsIFU+XG4gICAgJiBNZXJnZUFsbFJlY29yZHM8VCwgVSwgT3B0aW9ucz5cbiAgICAmIChPcHRpb25zIGV4dGVuZHMgeyBzZXRzOiBcInJlcGxhY2VcIiB9ID8gUGFydGlhbEJ5VHlwZTxVLCBTZXQ8dW5rbm93bj4+XG4gICAgICA6IE1lcmdlQWxsU2V0czxULCBVPilcbiAgICAmIChPcHRpb25zIGV4dGVuZHMgeyBhcnJheXM6IFwicmVwbGFjZVwiIH0gPyBQYXJ0aWFsQnlUeXBlPFUsIEFycmF5PHVua25vd24+PlxuICAgICAgOiBNZXJnZUFsbEFycmF5czxULCBVPilcbiAgICAmIChPcHRpb25zIGV4dGVuZHMgeyBtYXBzOiBcInJlcGxhY2VcIiB9XG4gICAgICA/IFBhcnRpYWxCeVR5cGU8VSwgTWFwPHVua25vd24sIHVua25vd24+PlxuICAgICAgOiBNZXJnZUFsbE1hcHM8VCwgVT4pLFxuPiA9IEV4cGFuZFJlY3Vyc2l2ZWx5PFg+O1xuXG4vKiogTWVyZ2UgZGVlcGx5IHR3byBvYmplY3RzICovXG5leHBvcnQgdHlwZSBEZWVwTWVyZ2U8XG4gIFQsXG4gIFUsXG4gIE9wdGlvbnMgPSBSZWNvcmQ8c3RyaW5nLCBNZXJnaW5nU3RyYXRlZ3k+LFxuPiA9XG4gIC8vIEhhbmRsZSBvYmplY3RzXG4gIFtULCBVXSBleHRlbmRzIFtSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+LCBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+XVxuICAgID8gTWVyZ2U8VCwgVSwgT3B0aW9ucz5cbiAgICA6IC8vIEhhbmRsZSBwcmltaXRpdmVzXG4gICAgVCB8IFU7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxrQ0FBa0M7QUFFbEMsU0FBUyxhQUFhLFFBQVEsYUFBYSxDQUFDO0FBRTVDLE1BQU0sRUFBRSxNQUFNLENBQUEsRUFBRSxHQUFHLE1BQU0sQUFBQztBQXdDMUIsT0FBTyxTQUFTLFNBQVMsQ0FTdkIsTUFBbUIsRUFDbkIsS0FBa0IsRUFDbEIsT0FBMkIsRUFDRDtJQUMxQixPQUFPLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FTeEIsTUFBbUIsRUFDbkIsS0FBa0IsRUFDbEIsSUFBOEIsRUFDOUIsT0FBMkIsRUFDM0I7SUFJQSxNQUFNLE1BQU0sR0FBb0IsRUFBRSxBQUFDO0lBRW5DLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDO1dBQ2hCLE9BQU8sQ0FBQyxNQUFNLENBQUM7V0FDZixPQUFPLENBQUMsS0FBSyxDQUFDO0tBQ2xCLENBQUMsQUFBcUIsQUFBQztJQUV4Qiw0RUFBNEU7SUFDNUUsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUU7UUFDdEIsMkZBQTJGO1FBQzNGLElBQUksR0FBRyxLQUFLLFdBQVcsRUFBRTtZQUN2QixTQUFTO1FBQ1gsQ0FBQztRQUlELE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQUFBZ0IsQUFBQztRQUV0QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUN2QixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRWhCLFNBQVM7UUFDWCxDQUFDO1FBRUQs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