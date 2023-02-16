// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Utility functions for media types (MIME types).
 *
 * This API is inspired by the GoLang [`mime`](https://pkg.go.dev/mime) package
 * and [jshttp/mime-types](https://github.com/jshttp/mime-types).
 *
 * @module
 */ import db from "./vendor/mime-db.v1.52.0.ts";
import { consumeMediaParam, decode2331Encoding, isIterator, isToken, needsEncoding } from "./_util.ts";
/** A map of extensions for a given media type. */ export const extensions = new Map();
/** A map of the media type for a given extension */ export const types = new Map();
/** Internal function to populate the maps based on the Mime DB. */ (function populateMaps() {
    const preference = [
        "nginx",
        "apache",
        undefined,
        "iana"
    ];
    for (const type of Object.keys(db)){
        const mime = db[type];
        const exts = mime.extensions;
        if (!exts || !exts.length) {
            continue;
        }
        // @ts-ignore work around denoland/dnt#148
        extensions.set(type, exts);
        for (const ext of exts){
            const current = types.get(ext);
            if (current) {
                const from = preference.indexOf(db[current].source);
                const to = preference.indexOf(mime.source);
                if (current !== "application/octet-stream" && (from > to || // @ts-ignore work around denoland/dnt#148
                (from === to && current.startsWith("application/")))) {
                    continue;
                }
            }
            types.set(ext, type);
        }
    }
})();
/** Given an extension or media type, return a full `Content-Type` or
 * `Content-Disposition` header value.
 *
 * The function will treat the `extensionOrType` as a media type when it
 * contains a `/`, otherwise it will process it as an extension, with or without
 * the leading `.`.
 *
 * Returns `undefined` if unable to resolve the media type.
 *
 * ### Examples
 *
 * ```ts
 * import { contentType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 *
 * contentType(".json"); // `application/json; charset=UTF-8`
 * contentType("text/html"); // `text/html; charset=UTF-8`
 * contentType("text/html; charset=UTF-8"); // `text/html; charset=UTF-8`
 * contentType("txt"); // `text/plain; charset=UTF-8`
 * contentType("foo"); // undefined
 * contentType("file.json"); // undefined
 * ```
 */ export function contentType(extensionOrType) {
    try {
        const [mediaType, params = {}] = extensionOrType.includes("/") ? parseMediaType(extensionOrType) : [
            typeByExtension(extensionOrType),
            undefined
        ];
        if (!mediaType) {
            return undefined;
        }
        if (!("charset" in params)) {
            const charset = getCharset(mediaType);
            if (charset) {
                params.charset = charset;
            }
        }
        return formatMediaType(mediaType, params);
    } catch  {
    // just swallow returning undefined
    }
    return undefined;
}
/** For a given media type, return the most relevant extension, or `undefined`
 * if no extension can be found.
 *
 * Extensions are returned without a leading `.`.
 *
 * ### Examples
 *
 * ```ts
 * import { extension } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 *
 * extension("text/plain"); // `txt`
 * extension("application/json"); // `json`
 * extension("text/html; charset=UTF-8"); // `html`
 * extension("application/foo"); // undefined
 * ```
 */ export function extension(type) {
    const exts = extensionsByType(type);
    if (exts) {
        return exts[0];
    }
    return undefined;
}
/** Returns the extensions known to be associated with the media type `type`.
 * The returned extensions will each begin with a leading dot, as in `.html`.
 *
 * When `type` has no associated extensions, the function returns `undefined`.
 *
 * Extensions are returned without a leading `.`.
 *
 * ### Examples
 *
 * ```ts
 * import { extensionsByType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 *
 * extensionsByType("application/json"); // ["js", "mjs"]
 * extensionsByType("text/html; charset=UTF-8"); // ["html", "htm", "shtml"]
 * extensionsByType("application/foo"); // undefined
 * ```
 */ export function extensionsByType(type) {
    try {
        const [mediaType] = parseMediaType(type);
        return extensions.get(mediaType);
    } catch  {
    // just swallow errors, returning undefined
    }
}
/** Serializes the media type and the optional parameters as a media type
 * conforming to RFC 2045 and RFC 2616.
 *
 * The type and parameter names are written in lower-case.
 *
 * When any of the arguments results in a standard violation then the return
 * value will be an empty string (`""`).
 *
 * ### Example
 *
 * ```ts
 * import { formatMediaType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 *
 * formatMediaType("text/plain", { charset: "UTF-8" }); // `text/plain; charset=UTF-8`
 * ```
 */ export function formatMediaType(type, param) {
    let b = "";
    const [major, sub] = type.split("/");
    if (!sub) {
        if (!isToken(type)) {
            return "";
        }
        b += type.toLowerCase();
    } else {
        if (!isToken(major) || !isToken(sub)) {
            return "";
        }
        b += `${major.toLowerCase()}/${sub.toLowerCase()}`;
    }
    if (param) {
        param = isIterator(param) ? Object.fromEntries(param) : param;
        const attrs = Object.keys(param);
        attrs.sort();
        for (const attribute of attrs){
            if (!isToken(attribute)) {
                return "";
            }
            const value = param[attribute];
            b += `; ${attribute.toLowerCase()}`;
            const needEnc = needsEncoding(value);
            if (needEnc) {
                b += "*";
            }
            b += "=";
            if (needEnc) {
                b += `utf-8''${encodeURIComponent(value)}`;
                continue;
            }
            if (isToken(value)) {
                b += value;
                continue;
            }
            b += `"${value.replace(/["\\]/gi, (m)=>`\\${m}`)}"`;
        }
    }
    return b;
}
/** Given a media type or header value, identify the encoding charset. If the
 * charset cannot be determined, the function returns `undefined`.
 *
 * ### Examples
 *
 * ```ts
 * import { getCharset } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 *
 * getCharset("text/plain"); // `UTF-8`
 * getCharset("application/foo"); // undefined
 * getCharset("application/news-checkgroups"); // `US-ASCII`
 * getCharset("application/news-checkgroups; charset=UTF-8"); // `UTF-8`
 * ```
 */ export function getCharset(type) {
    try {
        const [mediaType, params] = parseMediaType(type);
        if (params && params["charset"]) {
            return params["charset"];
        }
        const entry = db[mediaType];
        if (entry && entry.charset) {
            return entry.charset;
        }
        if (mediaType.startsWith("text/")) {
            return "UTF-8";
        }
    } catch  {
    // just swallow errors, returning undefined
    }
    return undefined;
}
/** Parses the media type and any optional parameters, per
 * [RFC 1521](https://datatracker.ietf.org/doc/html/rfc1521). Media types are
 * the values in `Content-Type` and `Content-Disposition` headers. On success
 * the function returns a tuple where the first element is the media type and
 * the second element is the optional parameters or `undefined` if there are
 * none.
 *
 * The function will throw if the parsed value is invalid.
 *
 * The returned media type will be normalized to be lower case, and returned
 * params keys will be normalized to lower case, but preserves the casing of
 * the value.
 *
 * ### Examples
 *
 * ```ts
 * import { parseMediaType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(
 *   parseMediaType("application/JSON"),
 *   [
 *     "application/json",
 *     undefined
 *   ]
 * );
 *
 * assertEquals(
 *   parseMediaType("text/html; charset=UTF-8"),
 *   [
 *     "application/json",
 *     { charset: "UTF-8" },
 *   ]
 * );
 * ```
 */ export function parseMediaType(v) {
    const [base] = v.split(";");
    const mediaType = base.toLowerCase().trim();
    const params = {};
    // Map of base parameter name -> parameter name -> value
    // for parameters containing a '*' character.
    const continuation = new Map();
    v = v.slice(base.length);
    while(v.length){
        v = v.trimStart();
        if (v.length === 0) {
            break;
        }
        const [key, value, rest] = consumeMediaParam(v);
        if (!key) {
            if (rest.trim() === ";") {
                break;
            }
            throw new TypeError("Invalid media parameter.");
        }
        let pmap = params;
        const [baseName, rest2] = key.split("*");
        if (baseName && rest2 != null) {
            if (!continuation.has(baseName)) {
                continuation.set(baseName, {});
            }
            pmap = continuation.get(baseName);
        }
        if (key in pmap) {
            throw new TypeError("Duplicate key parsed.");
        }
        pmap[key] = value;
        v = rest;
    }
    // Stitch together any continuations or things with stars
    // (i.e. RFC 2231 things with stars: "foo*0" or "foo*")
    let str = "";
    for (const [key1, pieceMap] of continuation){
        const singlePartKey = `${key1}*`;
        const v1 = pieceMap[singlePartKey];
        if (v1) {
            const decv = decode2331Encoding(v1);
            if (decv) {
                params[key1] = decv;
            }
            continue;
        }
        str = "";
        let valid = false;
        for(let n = 0;; n++){
            const simplePart = `${key1}*${n}`;
            let v2 = pieceMap[simplePart];
            if (v2) {
                valid = true;
                str += v2;
                continue;
            }
            const encodedPart = `${simplePart}*`;
            v2 = pieceMap[encodedPart];
            if (!v2) {
                break;
            }
            valid = true;
            if (n === 0) {
                const decv1 = decode2331Encoding(v2);
                if (decv1) {
                    str += decv1;
                }
            } else {
                const decv2 = decodeURI(v2);
                str += decv2;
            }
        }
        if (valid) {
            params[key1] = str;
        }
    }
    return Object.keys(params).length ? [
        mediaType,
        params
    ] : [
        mediaType,
        undefined
    ];
}
/** Returns the media type associated with the file extension. Values are
 * normalized to lower case and matched irrespective of a leading `.`.
 *
 * When `extension` has no associated type, the function returns `undefined`.
 *
 * ### Examples
 *
 * ```ts
 * import { typeByExtension } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
 *
 * typeByExtension("js"); // `application/json`
 * typeByExtension(".HTML"); // `text/html`
 * typeByExtension("foo"); // undefined
 * typeByExtension("file.json"); // undefined
 * ```
 */ export function typeByExtension(extension) {
    extension = extension.startsWith(".") ? extension.slice(1) : extension;
    // @ts-ignore workaround around denoland/dnt#148
    return types.get(extension.toLowerCase());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL21lZGlhX3R5cGVzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIG1lZGlhIHR5cGVzIChNSU1FIHR5cGVzKS5cbiAqXG4gKiBUaGlzIEFQSSBpcyBpbnNwaXJlZCBieSB0aGUgR29MYW5nIFtgbWltZWBdKGh0dHBzOi8vcGtnLmdvLmRldi9taW1lKSBwYWNrYWdlXG4gKiBhbmQgW2pzaHR0cC9taW1lLXR5cGVzXShodHRwczovL2dpdGh1Yi5jb20vanNodHRwL21pbWUtdHlwZXMpLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgZGIgZnJvbSBcIi4vdmVuZG9yL21pbWUtZGIudjEuNTIuMC50c1wiO1xuaW1wb3J0IHtcbiAgY29uc3VtZU1lZGlhUGFyYW0sXG4gIGRlY29kZTIzMzFFbmNvZGluZyxcbiAgaXNJdGVyYXRvcixcbiAgaXNUb2tlbixcbiAgbmVlZHNFbmNvZGluZyxcbn0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxudHlwZSBEQiA9IHR5cGVvZiBkYjtcbnR5cGUgQ29udGVudFR5cGVUb0V4dGVuc2lvbiA9IHtcbiAgW0sgaW4ga2V5b2YgREJdOiBEQltLXSBleHRlbmRzIHsgXCJleHRlbnNpb25zXCI6IHJlYWRvbmx5IHN0cmluZ1tdIH1cbiAgICA/IERCW0tdW1wiZXh0ZW5zaW9uc1wiXVtudW1iZXJdXG4gICAgOiBuZXZlcjtcbn07XG50eXBlIEtub3duRXh0ZW5zaW9uT3JUeXBlID1cbiAgfCBrZXlvZiBDb250ZW50VHlwZVRvRXh0ZW5zaW9uXG4gIHwgQ29udGVudFR5cGVUb0V4dGVuc2lvbltrZXlvZiBDb250ZW50VHlwZVRvRXh0ZW5zaW9uXVxuICB8IGAuJHtDb250ZW50VHlwZVRvRXh0ZW5zaW9uW2tleW9mIENvbnRlbnRUeXBlVG9FeHRlbnNpb25dfWA7XG5cbmludGVyZmFjZSBEQkVudHJ5IHtcbiAgc291cmNlOiBzdHJpbmc7XG4gIGNvbXByZXNzaWJsZT86IGJvb2xlYW47XG4gIGNoYXJzZXQ/OiBzdHJpbmc7XG4gIGV4dGVuc2lvbnM/OiBzdHJpbmdbXTtcbn1cblxudHlwZSBLZXlPZkRiID0ga2V5b2YgdHlwZW9mIGRiO1xuXG4vKiogQSBtYXAgb2YgZXh0ZW5zaW9ucyBmb3IgYSBnaXZlbiBtZWRpYSB0eXBlLiAqL1xuZXhwb3J0IGNvbnN0IGV4dGVuc2lvbnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nW10+KCk7XG5cbi8qKiBBIG1hcCBvZiB0aGUgbWVkaWEgdHlwZSBmb3IgYSBnaXZlbiBleHRlbnNpb24gKi9cbmV4cG9ydCBjb25zdCB0eXBlcyA9IG5ldyBNYXA8c3RyaW5nLCBLZXlPZkRiPigpO1xuXG4vKiogSW50ZXJuYWwgZnVuY3Rpb24gdG8gcG9wdWxhdGUgdGhlIG1hcHMgYmFzZWQgb24gdGhlIE1pbWUgREIuICovXG4oZnVuY3Rpb24gcG9wdWxhdGVNYXBzKCkge1xuICBjb25zdCBwcmVmZXJlbmNlID0gW1wibmdpbnhcIiwgXCJhcGFjaGVcIiwgdW5kZWZpbmVkLCBcImlhbmFcIl07XG5cbiAgZm9yIChjb25zdCB0eXBlIG9mIE9iamVjdC5rZXlzKGRiKSBhcyBLZXlPZkRiW10pIHtcbiAgICBjb25zdCBtaW1lID0gZGJbdHlwZV0gYXMgREJFbnRyeTtcbiAgICBjb25zdCBleHRzID0gbWltZS5leHRlbnNpb25zO1xuXG4gICAgaWYgKCFleHRzIHx8ICFleHRzLmxlbmd0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZSB3b3JrIGFyb3VuZCBkZW5vbGFuZC9kbnQjMTQ4XG4gICAgZXh0ZW5zaW9ucy5zZXQodHlwZSwgZXh0cyk7XG5cbiAgICBmb3IgKGNvbnN0IGV4dCBvZiBleHRzKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gdHlwZXMuZ2V0KGV4dCk7XG4gICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICBjb25zdCBmcm9tID0gcHJlZmVyZW5jZS5pbmRleE9mKChkYltjdXJyZW50XSBhcyBEQkVudHJ5KS5zb3VyY2UpO1xuICAgICAgICBjb25zdCB0byA9IHByZWZlcmVuY2UuaW5kZXhPZihtaW1lLnNvdXJjZSk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGN1cnJlbnQgIT09IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIgJiZcbiAgICAgICAgICAoZnJvbSA+IHRvIHx8XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHdvcmsgYXJvdW5kIGRlbm9sYW5kL2RudCMxNDhcbiAgICAgICAgICAgIChmcm9tID09PSB0byAmJiBjdXJyZW50LnN0YXJ0c1dpdGgoXCJhcHBsaWNhdGlvbi9cIikpKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eXBlcy5zZXQoZXh0LCB0eXBlKTtcbiAgICB9XG4gIH1cbn0pKCk7XG5cbi8qKiBHaXZlbiBhbiBleHRlbnNpb24gb3IgbWVkaWEgdHlwZSwgcmV0dXJuIGEgZnVsbCBgQ29udGVudC1UeXBlYCBvclxuICogYENvbnRlbnQtRGlzcG9zaXRpb25gIGhlYWRlciB2YWx1ZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCB0cmVhdCB0aGUgYGV4dGVuc2lvbk9yVHlwZWAgYXMgYSBtZWRpYSB0eXBlIHdoZW4gaXRcbiAqIGNvbnRhaW5zIGEgYC9gLCBvdGhlcndpc2UgaXQgd2lsbCBwcm9jZXNzIGl0IGFzIGFuIGV4dGVuc2lvbiwgd2l0aCBvciB3aXRob3V0XG4gKiB0aGUgbGVhZGluZyBgLmAuXG4gKlxuICogUmV0dXJucyBgdW5kZWZpbmVkYCBpZiB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgbWVkaWEgdHlwZS5cbiAqXG4gKiAjIyMgRXhhbXBsZXNcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY29udGVudFR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9tb2QudHNcIjtcbiAqXG4gKiBjb250ZW50VHlwZShcIi5qc29uXCIpOyAvLyBgYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD1VVEYtOGBcbiAqIGNvbnRlbnRUeXBlKFwidGV4dC9odG1sXCIpOyAvLyBgdGV4dC9odG1sOyBjaGFyc2V0PVVURi04YFxuICogY29udGVudFR5cGUoXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIik7IC8vIGB0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThgXG4gKiBjb250ZW50VHlwZShcInR4dFwiKTsgLy8gYHRleHQvcGxhaW47IGNoYXJzZXQ9VVRGLThgXG4gKiBjb250ZW50VHlwZShcImZvb1wiKTsgLy8gdW5kZWZpbmVkXG4gKiBjb250ZW50VHlwZShcImZpbGUuanNvblwiKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRlbnRUeXBlPFxuICAvLyBXb3JrYXJvdW5kIHRvIGF1dG9jb21wbGV0ZSBmb3IgcGFyYW1ldGVyczogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8yOTcyOSNpc3N1ZWNvbW1lbnQtNTY3ODcxOTM5XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG4gIFQgZXh0ZW5kcyAoc3RyaW5nICYge30pIHwgS25vd25FeHRlbnNpb25PclR5cGUsXG4+KFxuICBleHRlbnNpb25PclR5cGU6IFQsXG4pOiBMb3dlcmNhc2U8VD4gZXh0ZW5kcyBLbm93bkV4dGVuc2lvbk9yVHlwZSA/IHN0cmluZyA6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgY29uc3QgW21lZGlhVHlwZSwgcGFyYW1zID0ge31dID0gZXh0ZW5zaW9uT3JUeXBlLmluY2x1ZGVzKFwiL1wiKVxuICAgICAgPyBwYXJzZU1lZGlhVHlwZShleHRlbnNpb25PclR5cGUpXG4gICAgICA6IFt0eXBlQnlFeHRlbnNpb24oZXh0ZW5zaW9uT3JUeXBlKSwgdW5kZWZpbmVkXTtcbiAgICBpZiAoIW1lZGlhVHlwZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZCBhcyBMb3dlcmNhc2U8VD4gZXh0ZW5kcyBLbm93bkV4dGVuc2lvbk9yVHlwZSA/IHN0cmluZ1xuICAgICAgICA6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCEoXCJjaGFyc2V0XCIgaW4gcGFyYW1zKSkge1xuICAgICAgY29uc3QgY2hhcnNldCA9IGdldENoYXJzZXQobWVkaWFUeXBlKTtcbiAgICAgIGlmIChjaGFyc2V0KSB7XG4gICAgICAgIHBhcmFtcy5jaGFyc2V0ID0gY2hhcnNldDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdE1lZGlhVHlwZShtZWRpYVR5cGUsIHBhcmFtcyk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGp1c3Qgc3dhbGxvdyByZXR1cm5pbmcgdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZCBhcyBMb3dlcmNhc2U8VD4gZXh0ZW5kcyBLbm93bkV4dGVuc2lvbk9yVHlwZSA/IHN0cmluZ1xuICAgIDogc3RyaW5nIHwgdW5kZWZpbmVkO1xufVxuXG4vKiogRm9yIGEgZ2l2ZW4gbWVkaWEgdHlwZSwgcmV0dXJuIHRoZSBtb3N0IHJlbGV2YW50IGV4dGVuc2lvbiwgb3IgYHVuZGVmaW5lZGBcbiAqIGlmIG5vIGV4dGVuc2lvbiBjYW4gYmUgZm91bmQuXG4gKlxuICogRXh0ZW5zaW9ucyBhcmUgcmV0dXJuZWQgd2l0aG91dCBhIGxlYWRpbmcgYC5gLlxuICpcbiAqICMjIyBFeGFtcGxlc1xuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleHRlbnNpb24gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9tb2QudHNcIjtcbiAqXG4gKiBleHRlbnNpb24oXCJ0ZXh0L3BsYWluXCIpOyAvLyBgdHh0YFxuICogZXh0ZW5zaW9uKFwiYXBwbGljYXRpb24vanNvblwiKTsgLy8gYGpzb25gXG4gKiBleHRlbnNpb24oXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIik7IC8vIGBodG1sYFxuICogZXh0ZW5zaW9uKFwiYXBwbGljYXRpb24vZm9vXCIpOyAvLyB1bmRlZmluZWRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5zaW9uKHR5cGU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGV4dHMgPSBleHRlbnNpb25zQnlUeXBlKHR5cGUpO1xuICBpZiAoZXh0cykge1xuICAgIHJldHVybiBleHRzWzBdO1xuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKiBSZXR1cm5zIHRoZSBleHRlbnNpb25zIGtub3duIHRvIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgbWVkaWEgdHlwZSBgdHlwZWAuXG4gKiBUaGUgcmV0dXJuZWQgZXh0ZW5zaW9ucyB3aWxsIGVhY2ggYmVnaW4gd2l0aCBhIGxlYWRpbmcgZG90LCBhcyBpbiBgLmh0bWxgLlxuICpcbiAqIFdoZW4gYHR5cGVgIGhhcyBubyBhc3NvY2lhdGVkIGV4dGVuc2lvbnMsIHRoZSBmdW5jdGlvbiByZXR1cm5zIGB1bmRlZmluZWRgLlxuICpcbiAqIEV4dGVuc2lvbnMgYXJlIHJldHVybmVkIHdpdGhvdXQgYSBsZWFkaW5nIGAuYC5cbiAqXG4gKiAjIyMgRXhhbXBsZXNcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXh0ZW5zaW9uc0J5VHlwZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL21lZGlhX3R5cGVzL21vZC50c1wiO1xuICpcbiAqIGV4dGVuc2lvbnNCeVR5cGUoXCJhcHBsaWNhdGlvbi9qc29uXCIpOyAvLyBbXCJqc1wiLCBcIm1qc1wiXVxuICogZXh0ZW5zaW9uc0J5VHlwZShcInRleHQvaHRtbDsgY2hhcnNldD1VVEYtOFwiKTsgLy8gW1wiaHRtbFwiLCBcImh0bVwiLCBcInNodG1sXCJdXG4gKiBleHRlbnNpb25zQnlUeXBlKFwiYXBwbGljYXRpb24vZm9vXCIpOyAvLyB1bmRlZmluZWRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5zaW9uc0J5VHlwZSh0eXBlOiBzdHJpbmcpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgY29uc3QgW21lZGlhVHlwZV0gPSBwYXJzZU1lZGlhVHlwZSh0eXBlKTtcbiAgICByZXR1cm4gZXh0ZW5zaW9ucy5nZXQobWVkaWFUeXBlKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8ganVzdCBzd2FsbG93IGVycm9ycywgcmV0dXJuaW5nIHVuZGVmaW5lZFxuICB9XG59XG5cbi8qKiBTZXJpYWxpemVzIHRoZSBtZWRpYSB0eXBlIGFuZCB0aGUgb3B0aW9uYWwgcGFyYW1ldGVycyBhcyBhIG1lZGlhIHR5cGVcbiAqIGNvbmZvcm1pbmcgdG8gUkZDIDIwNDUgYW5kIFJGQyAyNjE2LlxuICpcbiAqIFRoZSB0eXBlIGFuZCBwYXJhbWV0ZXIgbmFtZXMgYXJlIHdyaXR0ZW4gaW4gbG93ZXItY2FzZS5cbiAqXG4gKiBXaGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIHJlc3VsdHMgaW4gYSBzdGFuZGFyZCB2aW9sYXRpb24gdGhlbiB0aGUgcmV0dXJuXG4gKiB2YWx1ZSB3aWxsIGJlIGFuIGVtcHR5IHN0cmluZyAoYFwiXCJgKS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmb3JtYXRNZWRpYVR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9tb2QudHNcIjtcbiAqXG4gKiBmb3JtYXRNZWRpYVR5cGUoXCJ0ZXh0L3BsYWluXCIsIHsgY2hhcnNldDogXCJVVEYtOFwiIH0pOyAvLyBgdGV4dC9wbGFpbjsgY2hhcnNldD1VVEYtOGBcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TWVkaWFUeXBlKFxuICB0eXBlOiBzdHJpbmcsXG4gIHBhcmFtPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IEl0ZXJhYmxlPFtzdHJpbmcsIHN0cmluZ10+LFxuKTogc3RyaW5nIHtcbiAgbGV0IGIgPSBcIlwiO1xuICBjb25zdCBbbWFqb3IsIHN1Yl0gPSB0eXBlLnNwbGl0KFwiL1wiKTtcbiAgaWYgKCFzdWIpIHtcbiAgICBpZiAoIWlzVG9rZW4odHlwZSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBiICs9IHR5cGUudG9Mb3dlckNhc2UoKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzVG9rZW4obWFqb3IpIHx8ICFpc1Rva2VuKHN1YikpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBiICs9IGAke21ham9yLnRvTG93ZXJDYXNlKCl9LyR7c3ViLnRvTG93ZXJDYXNlKCl9YDtcbiAgfVxuXG4gIGlmIChwYXJhbSkge1xuICAgIHBhcmFtID0gaXNJdGVyYXRvcihwYXJhbSkgPyBPYmplY3QuZnJvbUVudHJpZXMocGFyYW0pIDogcGFyYW07XG4gICAgY29uc3QgYXR0cnMgPSBPYmplY3Qua2V5cyhwYXJhbSk7XG4gICAgYXR0cnMuc29ydCgpO1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cnMpIHtcbiAgICAgIGlmICghaXNUb2tlbihhdHRyaWJ1dGUpKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWUgPSBwYXJhbVthdHRyaWJ1dGVdO1xuICAgICAgYiArPSBgOyAke2F0dHJpYnV0ZS50b0xvd2VyQ2FzZSgpfWA7XG5cbiAgICAgIGNvbnN0IG5lZWRFbmMgPSBuZWVkc0VuY29kaW5nKHZhbHVlKTtcbiAgICAgIGlmIChuZWVkRW5jKSB7XG4gICAgICAgIGIgKz0gXCIqXCI7XG4gICAgICB9XG4gICAgICBiICs9IFwiPVwiO1xuXG4gICAgICBpZiAobmVlZEVuYykge1xuICAgICAgICBiICs9IGB1dGYtOCcnJHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWA7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNUb2tlbih2YWx1ZSkpIHtcbiAgICAgICAgYiArPSB2YWx1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBiICs9IGBcIiR7dmFsdWUucmVwbGFjZSgvW1wiXFxcXF0vZ2ksIChtKSA9PiBgXFxcXCR7bX1gKX1cImA7XG4gICAgfVxuICB9XG4gIHJldHVybiBiO1xufVxuXG4vKiogR2l2ZW4gYSBtZWRpYSB0eXBlIG9yIGhlYWRlciB2YWx1ZSwgaWRlbnRpZnkgdGhlIGVuY29kaW5nIGNoYXJzZXQuIElmIHRoZVxuICogY2hhcnNldCBjYW5ub3QgYmUgZGV0ZXJtaW5lZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gKlxuICogIyMjIEV4YW1wbGVzXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGdldENoYXJzZXQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9tb2QudHNcIjtcbiAqXG4gKiBnZXRDaGFyc2V0KFwidGV4dC9wbGFpblwiKTsgLy8gYFVURi04YFxuICogZ2V0Q2hhcnNldChcImFwcGxpY2F0aW9uL2Zvb1wiKTsgLy8gdW5kZWZpbmVkXG4gKiBnZXRDaGFyc2V0KFwiYXBwbGljYXRpb24vbmV3cy1jaGVja2dyb3Vwc1wiKTsgLy8gYFVTLUFTQ0lJYFxuICogZ2V0Q2hhcnNldChcImFwcGxpY2F0aW9uL25ld3MtY2hlY2tncm91cHM7IGNoYXJzZXQ9VVRGLThcIik7IC8vIGBVVEYtOGBcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hhcnNldCh0eXBlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICB0cnkge1xuICAgIGNvbnN0IFttZWRpYVR5cGUsIHBhcmFtc10gPSBwYXJzZU1lZGlhVHlwZSh0eXBlKTtcbiAgICBpZiAocGFyYW1zICYmIHBhcmFtc1tcImNoYXJzZXRcIl0pIHtcbiAgICAgIHJldHVybiBwYXJhbXNbXCJjaGFyc2V0XCJdO1xuICAgIH1cbiAgICBjb25zdCBlbnRyeSA9IGRiW21lZGlhVHlwZSBhcyBLZXlPZkRiXSBhcyBEQkVudHJ5O1xuICAgIGlmIChlbnRyeSAmJiBlbnRyeS5jaGFyc2V0KSB7XG4gICAgICByZXR1cm4gZW50cnkuY2hhcnNldDtcbiAgICB9XG4gICAgaWYgKG1lZGlhVHlwZS5zdGFydHNXaXRoKFwidGV4dC9cIikpIHtcbiAgICAgIHJldHVybiBcIlVURi04XCI7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBqdXN0IHN3YWxsb3cgZXJyb3JzLCByZXR1cm5pbmcgdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqIFBhcnNlcyB0aGUgbWVkaWEgdHlwZSBhbmQgYW55IG9wdGlvbmFsIHBhcmFtZXRlcnMsIHBlclxuICogW1JGQyAxNTIxXShodHRwczovL2RhdGF0cmFja2VyLmlldGYub3JnL2RvYy9odG1sL3JmYzE1MjEpLiBNZWRpYSB0eXBlcyBhcmVcbiAqIHRoZSB2YWx1ZXMgaW4gYENvbnRlbnQtVHlwZWAgYW5kIGBDb250ZW50LURpc3Bvc2l0aW9uYCBoZWFkZXJzLiBPbiBzdWNjZXNzXG4gKiB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHR1cGxlIHdoZXJlIHRoZSBmaXJzdCBlbGVtZW50IGlzIHRoZSBtZWRpYSB0eXBlIGFuZFxuICogdGhlIHNlY29uZCBlbGVtZW50IGlzIHRoZSBvcHRpb25hbCBwYXJhbWV0ZXJzIG9yIGB1bmRlZmluZWRgIGlmIHRoZXJlIGFyZVxuICogbm9uZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCB0aHJvdyBpZiB0aGUgcGFyc2VkIHZhbHVlIGlzIGludmFsaWQuXG4gKlxuICogVGhlIHJldHVybmVkIG1lZGlhIHR5cGUgd2lsbCBiZSBub3JtYWxpemVkIHRvIGJlIGxvd2VyIGNhc2UsIGFuZCByZXR1cm5lZFxuICogcGFyYW1zIGtleXMgd2lsbCBiZSBub3JtYWxpemVkIHRvIGxvd2VyIGNhc2UsIGJ1dCBwcmVzZXJ2ZXMgdGhlIGNhc2luZyBvZlxuICogdGhlIHZhbHVlLlxuICpcbiAqICMjIyBFeGFtcGxlc1xuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZU1lZGlhVHlwZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL21lZGlhX3R5cGVzL21vZC50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBwYXJzZU1lZGlhVHlwZShcImFwcGxpY2F0aW9uL0pTT05cIiksXG4gKiAgIFtcbiAqICAgICBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAqICAgICB1bmRlZmluZWRcbiAqICAgXVxuICogKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIHBhcnNlTWVkaWFUeXBlKFwidGV4dC9odG1sOyBjaGFyc2V0PVVURi04XCIpLFxuICogICBbXG4gKiAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gKiAgICAgeyBjaGFyc2V0OiBcIlVURi04XCIgfSxcbiAqICAgXVxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNZWRpYVR5cGUoXG4gIHY6IHN0cmluZyxcbik6IFttZWRpYVR5cGU6IHN0cmluZywgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkXSB7XG4gIGNvbnN0IFtiYXNlXSA9IHYuc3BsaXQoXCI7XCIpO1xuICBjb25zdCBtZWRpYVR5cGUgPSBiYXNlLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gIGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAvLyBNYXAgb2YgYmFzZSBwYXJhbWV0ZXIgbmFtZSAtPiBwYXJhbWV0ZXIgbmFtZSAtPiB2YWx1ZVxuICAvLyBmb3IgcGFyYW1ldGVycyBjb250YWluaW5nIGEgJyonIGNoYXJhY3Rlci5cbiAgY29uc3QgY29udGludWF0aW9uID0gbmV3IE1hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZz4+KCk7XG5cbiAgdiA9IHYuc2xpY2UoYmFzZS5sZW5ndGgpO1xuICB3aGlsZSAodi5sZW5ndGgpIHtcbiAgICB2ID0gdi50cmltU3RhcnQoKTtcbiAgICBpZiAodi5sZW5ndGggPT09IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCBba2V5LCB2YWx1ZSwgcmVzdF0gPSBjb25zdW1lTWVkaWFQYXJhbSh2KTtcbiAgICBpZiAoIWtleSkge1xuICAgICAgaWYgKHJlc3QudHJpbSgpID09PSBcIjtcIikge1xuICAgICAgICAvLyBpZ25vcmUgdHJhaWxpbmcgc2VtaWNvbG9uc1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIG1lZGlhIHBhcmFtZXRlci5cIik7XG4gICAgfVxuXG4gICAgbGV0IHBtYXAgPSBwYXJhbXM7XG4gICAgY29uc3QgW2Jhc2VOYW1lLCByZXN0Ml0gPSBrZXkuc3BsaXQoXCIqXCIpO1xuICAgIGlmIChiYXNlTmFtZSAmJiByZXN0MiAhPSBudWxsKSB7XG4gICAgICBpZiAoIWNvbnRpbnVhdGlvbi5oYXMoYmFzZU5hbWUpKSB7XG4gICAgICAgIGNvbnRpbnVhdGlvbi5zZXQoYmFzZU5hbWUsIHt9KTtcbiAgICAgIH1cbiAgICAgIHBtYXAgPSBjb250aW51YXRpb24uZ2V0KGJhc2VOYW1lKSE7XG4gICAgfVxuICAgIGlmIChrZXkgaW4gcG1hcCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkR1cGxpY2F0ZSBrZXkgcGFyc2VkLlwiKTtcbiAgICB9XG4gICAgcG1hcFtrZXldID0gdmFsdWU7XG4gICAgdiA9IHJlc3Q7XG4gIH1cblxuICAvLyBTdGl0Y2ggdG9nZXRoZXIgYW55IGNvbnRpbnVhdGlvbnMgb3IgdGhpbmdzIHdpdGggc3RhcnNcbiAgLy8gKGkuZS4gUkZDIDIyMzEgdGhpbmdzIHdpdGggc3RhcnM6IFwiZm9vKjBcIiBvciBcImZvbypcIilcbiAgbGV0IHN0ciA9IFwiXCI7XG4gIGZvciAoY29uc3QgW2tleSwgcGllY2VNYXBdIG9mIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnN0IHNpbmdsZVBhcnRLZXkgPSBgJHtrZXl9KmA7XG4gICAgY29uc3QgdiA9IHBpZWNlTWFwW3NpbmdsZVBhcnRLZXldO1xuICAgIGlmICh2KSB7XG4gICAgICBjb25zdCBkZWN2ID0gZGVjb2RlMjMzMUVuY29kaW5nKHYpO1xuICAgICAgaWYgKGRlY3YpIHtcbiAgICAgICAgcGFyYW1zW2tleV0gPSBkZWN2O1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgc3RyID0gXCJcIjtcbiAgICBsZXQgdmFsaWQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBuID0gMDs7IG4rKykge1xuICAgICAgY29uc3Qgc2ltcGxlUGFydCA9IGAke2tleX0qJHtufWA7XG4gICAgICBsZXQgdiA9IHBpZWNlTWFwW3NpbXBsZVBhcnRdO1xuICAgICAgaWYgKHYpIHtcbiAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgICBzdHIgKz0gdjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBlbmNvZGVkUGFydCA9IGAke3NpbXBsZVBhcnR9KmA7XG4gICAgICB2ID0gcGllY2VNYXBbZW5jb2RlZFBhcnRdO1xuICAgICAgaWYgKCF2KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgY29uc3QgZGVjdiA9IGRlY29kZTIzMzFFbmNvZGluZyh2KTtcbiAgICAgICAgaWYgKGRlY3YpIHtcbiAgICAgICAgICBzdHIgKz0gZGVjdjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZGVjdiA9IGRlY29kZVVSSSh2KTtcbiAgICAgICAgc3RyICs9IGRlY3Y7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh2YWxpZCkge1xuICAgICAgcGFyYW1zW2tleV0gPSBzdHI7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKHBhcmFtcykubGVuZ3RoXG4gICAgPyBbbWVkaWFUeXBlLCBwYXJhbXNdXG4gICAgOiBbbWVkaWFUeXBlLCB1bmRlZmluZWRdO1xufVxuXG4vKiogUmV0dXJucyB0aGUgbWVkaWEgdHlwZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZpbGUgZXh0ZW5zaW9uLiBWYWx1ZXMgYXJlXG4gKiBub3JtYWxpemVkIHRvIGxvd2VyIGNhc2UgYW5kIG1hdGNoZWQgaXJyZXNwZWN0aXZlIG9mIGEgbGVhZGluZyBgLmAuXG4gKlxuICogV2hlbiBgZXh0ZW5zaW9uYCBoYXMgbm8gYXNzb2NpYXRlZCB0eXBlLCB0aGUgZnVuY3Rpb24gcmV0dXJucyBgdW5kZWZpbmVkYC5cbiAqXG4gKiAjIyMgRXhhbXBsZXNcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdHlwZUJ5RXh0ZW5zaW9uIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbWVkaWFfdHlwZXMvbW9kLnRzXCI7XG4gKlxuICogdHlwZUJ5RXh0ZW5zaW9uKFwianNcIik7IC8vIGBhcHBsaWNhdGlvbi9qc29uYFxuICogdHlwZUJ5RXh0ZW5zaW9uKFwiLkhUTUxcIik7IC8vIGB0ZXh0L2h0bWxgXG4gKiB0eXBlQnlFeHRlbnNpb24oXCJmb29cIik7IC8vIHVuZGVmaW5lZFxuICogdHlwZUJ5RXh0ZW5zaW9uKFwiZmlsZS5qc29uXCIpOyAvLyB1bmRlZmluZWRcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdHlwZUJ5RXh0ZW5zaW9uKGV4dGVuc2lvbjogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uLnN0YXJ0c1dpdGgoXCIuXCIpID8gZXh0ZW5zaW9uLnNsaWNlKDEpIDogZXh0ZW5zaW9uO1xuICAvLyBAdHMtaWdub3JlIHdvcmthcm91bmQgYXJvdW5kIGRlbm9sYW5kL2RudCMxNDhcbiAgcmV0dXJuIHR5cGVzLmdldChleHRlbnNpb24udG9Mb3dlckNhc2UoKSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7O0NBTUMsR0FFRCxPQUFPLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM3QyxTQUNFLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsVUFBVSxFQUNWLE9BQU8sRUFDUCxhQUFhLFFBQ1IsWUFBWSxDQUFDO0FBc0JwQixnREFBZ0QsR0FDaEQsT0FBTyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztBQUV0RCxrREFBa0QsR0FDbEQsT0FBTyxNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztBQUVoRCxpRUFBaUUsR0FDakUsQ0FBQyxTQUFTLFlBQVksR0FBRztJQUN2QixNQUFNLFVBQVUsR0FBRztRQUFDLE9BQU87UUFBRSxRQUFRO1FBQUUsU0FBUztRQUFFLE1BQU07S0FBQyxBQUFDO0lBRTFELEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBZTtRQUMvQyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEFBQVcsQUFBQztRQUNqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxBQUFDO1FBRTdCLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3pCLFNBQVM7UUFDWCxDQUFDO1FBRUQsMENBQTBDO1FBQzFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElB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