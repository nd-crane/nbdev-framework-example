// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.
import { CHAR_DOT, CHAR_FORWARD_SLASH } from "./_constants.ts";
import { _format, assertPath, encodeWhitespace, isPosixPathSeparator, normalizeString } from "./_util.ts";
export const sep = "/";
export const delimiter = ":";
// path.resolve([from ...], to)
/**
 * Resolves `pathSegments` into an absolute path.
 * @param pathSegments an array of path segments
 */ export function resolve(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            // deno-lint-ignore no-explicit-any
            const { Deno  } = globalThis;
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno.cwd();
        }
        assertPath(path);
        // Skip empty entries
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    // Normalize the path
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * @param path to be normalized
 */ export function normalize(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    const trailingSeparator = path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;
    // Normalize the path
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */ export function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === CHAR_FORWARD_SLASH;
}
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */ export function join(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize(joined);
}
/**
 * Return the relative path from `from` to `to` based on current working directory.
 * @param from path in current working directory
 * @param to path in current working directory
 */ export function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve(from);
    to = resolve(to);
    if (from === to) return "";
    // Trim any leading backslashes
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== CHAR_FORWARD_SLASH) break;
    }
    const fromLen = fromEnd - fromStart;
    // Trim any leading backslashes
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== CHAR_FORWARD_SLASH) break;
    }
    const toLen = toEnd - toStart;
    // Compare paths to find the longest common path from root
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === CHAR_FORWARD_SLASH) {
                    // We get here if `from` is the exact base path for `to`.
                    // For example: from='/foo/bar'; to='/foo/bar/baz'
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    // We get here if `from` is the root
                    // For example: from='/'; to='/foo'
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === CHAR_FORWARD_SLASH) {
                    // We get here if `to` is the exact base path for `from`.
                    // For example: from='/foo/bar/baz'; to='/foo/bar'
                    lastCommonSep = i;
                } else if (i === 0) {
                    // We get here if `to` is the root.
                    // For example: from='/foo'; to='/'
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === CHAR_FORWARD_SLASH) lastCommonSep = i;
    }
    let out = "";
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === CHAR_FORWARD_SLASH) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === CHAR_FORWARD_SLASH) ++toStart;
        return to.slice(toStart);
    }
}
/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */ export function toNamespacedPath(path) {
    // Non-op on posix systems
    return path;
}
/**
 * Return the directory path of a `path`.
 * @param path to determine the directory path for
 */ export function dirname(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            // We saw the first non-path separator
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
/**
 * Return the last portion of a `path`. Trailing directory separators are ignored.
 * @param path to process
 * @param ext of path directory
 */ export function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === CHAR_FORWARD_SLASH) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    // We saw the first non-path separator, remember this index in case
                    // we need it if the extension ends up not matching
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    // Try to match the explicit extension
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            // We matched the extension, so mark this as the end of our path
                            // component
                            end = i;
                        }
                    } else {
                        // Extension does not match, so our result is the entire path
                        // component
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // path component
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
/**
 * Return the extension of the `path` with leading period.
 * @param path with extension
 * @returns extension (ex. for `file.ts` returns `.ts`)
 */ export function extname(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === CHAR_FORWARD_SLASH) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // extension
            matchedSlash = false;
            end = i + 1;
        }
        if (code === CHAR_DOT) {
            // If this is our first dot, mark it as the start of our extension
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            // We saw a non-dot and non-path separator before our dot, so we should
            // have a good chance at having a non-empty extension
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
        return "";
    }
    return path.slice(startDot, end);
}
/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */ export function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */ export function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    let preDotState = 0;
    // Get non-dir info
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === CHAR_FORWARD_SLASH) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // extension
            matchedSlash = false;
            end = i + 1;
        }
        if (code === CHAR_DOT) {
            // If this is our first dot, mark it as the start of our extension
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            // We saw a non-dot and non-path separator before our dot, so we should
            // have a good chance at having a non-empty extension
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
/**
 * Converts a file URL to a path string.
 *
 * ```ts
 *      import { fromFileUrl } from "./posix.ts";
 *      fromFileUrl("file:///home/foo"); // "/home/foo"
 * ```
 * @param url of a file URL
 */ export function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
/**
 * Converts a path string to a file URL.
 *
 * ```ts
 *      import { toFileUrl } from "./posix.ts";
 *      toFileUrl("/home/foo"); // new URL("file:///home/foo")
 * ```
 * @param path to convert to file URL
 */ export function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3BhdGgvcG9zaXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCB0aGUgQnJvd3NlcmlmeSBhdXRob3JzLiBNSVQgTGljZW5zZS5cbi8vIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93c2VyaWZ5L3BhdGgtYnJvd3NlcmlmeS9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBGb3JtYXRJbnB1dFBhdGhPYmplY3QsIFBhcnNlZFBhdGggfSBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5pbXBvcnQgeyBDSEFSX0RPVCwgQ0hBUl9GT1JXQVJEX1NMQVNIIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG5pbXBvcnQge1xuICBfZm9ybWF0LFxuICBhc3NlcnRQYXRoLFxuICBlbmNvZGVXaGl0ZXNwYWNlLFxuICBpc1Bvc2l4UGF0aFNlcGFyYXRvcixcbiAgbm9ybWFsaXplU3RyaW5nLFxufSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG5leHBvcnQgY29uc3Qgc2VwID0gXCIvXCI7XG5leHBvcnQgY29uc3QgZGVsaW1pdGVyID0gXCI6XCI7XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8qKlxuICogUmVzb2x2ZXMgYHBhdGhTZWdtZW50c2AgaW50byBhbiBhYnNvbHV0ZSBwYXRoLlxuICogQHBhcmFtIHBhdGhTZWdtZW50cyBhbiBhcnJheSBvZiBwYXRoIHNlZ21lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlKC4uLnBhdGhTZWdtZW50czogc3RyaW5nW10pOiBzdHJpbmcge1xuICBsZXQgcmVzb2x2ZWRQYXRoID0gXCJcIjtcbiAgbGV0IHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gcGF0aFNlZ21lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIGxldCBwYXRoOiBzdHJpbmc7XG5cbiAgICBpZiAoaSA+PSAwKSBwYXRoID0gcGF0aFNlZ21lbnRzW2ldO1xuICAgIGVsc2Uge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIGNvbnN0IHsgRGVubyB9ID0gZ2xvYmFsVGhpcyBhcyBhbnk7XG4gICAgICBpZiAodHlwZW9mIERlbm8/LmN3ZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSZXNvbHZlZCBhIHJlbGF0aXZlIHBhdGggd2l0aG91dCBhIENXRC5cIik7XG4gICAgICB9XG4gICAgICBwYXRoID0gRGVuby5jd2QoKTtcbiAgICB9XG5cbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBlbnRyaWVzXG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBgJHtwYXRofS8ke3Jlc29sdmVkUGF0aH1gO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IENIQVJfRk9SV0FSRF9TTEFTSDtcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZVN0cmluZyhcbiAgICByZXNvbHZlZFBhdGgsXG4gICAgIXJlc29sdmVkQWJzb2x1dGUsXG4gICAgXCIvXCIsXG4gICAgaXNQb3NpeFBhdGhTZXBhcmF0b3IsXG4gICk7XG5cbiAgaWYgKHJlc29sdmVkQWJzb2x1dGUpIHtcbiAgICBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApIHJldHVybiBgLyR7cmVzb2x2ZWRQYXRofWA7XG4gICAgZWxzZSByZXR1cm4gXCIvXCI7XG4gIH0gZWxzZSBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApIHJldHVybiByZXNvbHZlZFBhdGg7XG4gIGVsc2UgcmV0dXJuIFwiLlwiO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgYHBhdGhgLCByZXNvbHZpbmcgYCcuLidgIGFuZCBgJy4nYCBzZWdtZW50cy5cbiAqIEBwYXJhbSBwYXRoIHRvIGJlIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuXG4gIGNvbnN0IGlzQWJzb2x1dGUgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IENIQVJfRk9SV0FSRF9TTEFTSDtcbiAgY29uc3QgdHJhaWxpbmdTZXBhcmF0b3IgPVxuICAgIHBhdGguY2hhckNvZGVBdChwYXRoLmxlbmd0aCAtIDEpID09PSBDSEFSX0ZPUldBUkRfU0xBU0g7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVTdHJpbmcocGF0aCwgIWlzQWJzb2x1dGUsIFwiL1wiLCBpc1Bvc2l4UGF0aFNlcGFyYXRvcik7XG5cbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwICYmICFpc0Fic29sdXRlKSBwYXRoID0gXCIuXCI7XG4gIGlmIChwYXRoLmxlbmd0aCA+IDAgJiYgdHJhaWxpbmdTZXBhcmF0b3IpIHBhdGggKz0gXCIvXCI7XG5cbiAgaWYgKGlzQWJzb2x1dGUpIHJldHVybiBgLyR7cGF0aH1gO1xuICByZXR1cm4gcGF0aDtcbn1cblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIHByb3ZpZGVkIHBhdGggaXMgYWJzb2x1dGVcbiAqIEBwYXJhbSBwYXRoIHRvIGJlIHZlcmlmaWVkIGFzIGFic29sdXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICByZXR1cm4gcGF0aC5sZW5ndGggPiAwICYmIHBhdGguY2hhckNvZGVBdCgwKSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xufVxuXG4vKipcbiAqIEpvaW4gYWxsIGdpdmVuIGEgc2VxdWVuY2Ugb2YgYHBhdGhzYCx0aGVuIG5vcm1hbGl6ZXMgdGhlIHJlc3VsdGluZyBwYXRoLlxuICogQHBhcmFtIHBhdGhzIHRvIGJlIGpvaW5lZCBhbmQgbm9ybWFsaXplZFxuICovXG5leHBvcnQgZnVuY3Rpb24gam9pbiguLi5wYXRoczogc3RyaW5nW10pOiBzdHJpbmcge1xuICBpZiAocGF0aHMubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGhzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgY29uc3QgcGF0aCA9IHBhdGhzW2ldO1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFqb2luZWQpIGpvaW5lZCA9IHBhdGg7XG4gICAgICBlbHNlIGpvaW5lZCArPSBgLyR7cGF0aH1gO1xuICAgIH1cbiAgfVxuICBpZiAoIWpvaW5lZCkgcmV0dXJuIFwiLlwiO1xuICByZXR1cm4gbm9ybWFsaXplKGpvaW5lZCk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSByZWxhdGl2ZSBwYXRoIGZyb20gYGZyb21gIHRvIGB0b2AgYmFzZWQgb24gY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cbiAqIEBwYXJhbSBmcm9tIHBhdGggaW4gY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeVxuICogQHBhcmFtIHRvIHBhdGggaW4gY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVsYXRpdmUoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0UGF0aChmcm9tKTtcbiAgYXNzZXJ0UGF0aCh0byk7XG5cbiAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gXCJcIjtcblxuICBmcm9tID0gcmVzb2x2ZShmcm9tKTtcbiAgdG8gPSByZXNvbHZlKHRvKTtcblxuICBpZiAoZnJvbSA9PT0gdG8pIHJldHVybiBcIlwiO1xuXG4gIC8vIFRyaW0gYW55IGxlYWRpbmcgYmFja3NsYXNoZXNcbiAgbGV0IGZyb21TdGFydCA9IDE7XG4gIGNvbnN0IGZyb21FbmQgPSBmcm9tLmxlbmd0aDtcbiAgZm9yICg7IGZyb21TdGFydCA8IGZyb21FbmQ7ICsrZnJvbVN0YXJ0KSB7XG4gICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSBDSEFSX0ZPUldBUkRfU0xBU0gpIGJyZWFrO1xuICB9XG4gIGNvbnN0IGZyb21MZW4gPSBmcm9tRW5kIC0gZnJvbVN0YXJ0O1xuXG4gIC8vIFRyaW0gYW55IGxlYWRpbmcgYmFja3NsYXNoZXNcbiAgbGV0IHRvU3RhcnQgPSAxO1xuICBjb25zdCB0b0VuZCA9IHRvLmxlbmd0aDtcbiAgZm9yICg7IHRvU3RhcnQgPCB0b0VuZDsgKyt0b1N0YXJ0KSB7XG4gICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCkgIT09IENIQVJfRk9SV0FSRF9TTEFTSCkgYnJlYWs7XG4gIH1cbiAgY29uc3QgdG9MZW4gPSB0b0VuZCAtIHRvU3RhcnQ7XG5cbiAgLy8gQ29tcGFyZSBwYXRocyB0byBmaW5kIHRoZSBsb25nZXN0IGNvbW1vbiBwYXRoIGZyb20gcm9vdFxuICBjb25zdCBsZW5ndGggPSBmcm9tTGVuIDwgdG9MZW4gPyBmcm9tTGVuIDogdG9MZW47XG4gIGxldCBsYXN0Q29tbW9uU2VwID0gLTE7XG4gIGxldCBpID0gMDtcbiAgZm9yICg7IGkgPD0gbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoaSA9PT0gbGVuZ3RoKSB7XG4gICAgICBpZiAodG9MZW4gPiBsZW5ndGgpIHtcbiAgICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpID09PSBDSEFSX0ZPUldBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYHRvYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvby9iYXInOyB0bz0nL2Zvby9iYXIvYmF6J1xuICAgICAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0ICsgaSArIDEpO1xuICAgICAgICB9IGVsc2UgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIHJvb3RcbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nLyc7IHRvPScvZm9vJ1xuICAgICAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0ICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZnJvbUxlbiA+IGxlbmd0aCkge1xuICAgICAgICBpZiAoZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpID09PSBDSEFSX0ZPUldBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvby9iYXIvYmF6JzsgdG89Jy9mb28vYmFyJ1xuICAgICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgICAgICB9IGVsc2UgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSByb290LlxuICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vJzsgdG89Jy8nXG4gICAgICAgICAgbGFzdENvbW1vblNlcCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCBmcm9tQ29kZSA9IGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQgKyBpKTtcbiAgICBjb25zdCB0b0NvZGUgPSB0by5jaGFyQ29kZUF0KHRvU3RhcnQgKyBpKTtcbiAgICBpZiAoZnJvbUNvZGUgIT09IHRvQ29kZSkgYnJlYWs7XG4gICAgZWxzZSBpZiAoZnJvbUNvZGUgPT09IENIQVJfRk9SV0FSRF9TTEFTSCkgbGFzdENvbW1vblNlcCA9IGk7XG4gIH1cblxuICBsZXQgb3V0ID0gXCJcIjtcbiAgLy8gR2VuZXJhdGUgdGhlIHJlbGF0aXZlIHBhdGggYmFzZWQgb24gdGhlIHBhdGggZGlmZmVyZW5jZSBiZXR3ZWVuIGB0b2BcbiAgLy8gYW5kIGBmcm9tYFxuICBmb3IgKGkgPSBmcm9tU3RhcnQgKyBsYXN0Q29tbW9uU2VwICsgMTsgaSA8PSBmcm9tRW5kOyArK2kpIHtcbiAgICBpZiAoaSA9PT0gZnJvbUVuZCB8fCBmcm9tLmNoYXJDb2RlQXQoaSkgPT09IENIQVJfRk9SV0FSRF9TTEFTSCkge1xuICAgICAgaWYgKG91dC5sZW5ndGggPT09IDApIG91dCArPSBcIi4uXCI7XG4gICAgICBlbHNlIG91dCArPSBcIi8uLlwiO1xuICAgIH1cbiAgfVxuXG4gIC8vIExhc3RseSwgYXBwZW5kIHRoZSByZXN0IG9mIHRoZSBkZXN0aW5hdGlvbiAoYHRvYCkgcGF0aCB0aGF0IGNvbWVzIGFmdGVyXG4gIC8vIHRoZSBjb21tb24gcGF0aCBwYXJ0c1xuICBpZiAob3V0Lmxlbmd0aCA+IDApIHJldHVybiBvdXQgKyB0by5zbGljZSh0b1N0YXJ0ICsgbGFzdENvbW1vblNlcCk7XG4gIGVsc2Uge1xuICAgIHRvU3RhcnQgKz0gbGFzdENvbW1vblNlcDtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIKSArK3RvU3RhcnQ7XG4gICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQpO1xuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZXMgcGF0aCB0byBhIG5hbWVzcGFjZSBwYXRoXG4gKiBAcGFyYW0gcGF0aCB0byByZXNvbHZlIHRvIG5hbWVzcGFjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9OYW1lc3BhY2VkUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBOb24tb3Agb24gcG9zaXggc3lzdGVtc1xuICByZXR1cm4gcGF0aDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGRpcmVjdG9yeSBwYXRoIG9mIGEgYHBhdGhgLlxuICogQHBhcmFtIHBhdGggdG8gZGV0ZXJtaW5lIHRoZSBkaXJlY3RvcnkgcGF0aCBmb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcm5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG4gIGNvbnN0IGhhc1Jvb3QgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IENIQVJfRk9SV0FSRF9TTEFTSDtcbiAgbGV0IGVuZCA9IC0xO1xuICBsZXQgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcbiAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSBDSEFSX0ZPUldBUkRfU0xBU0gpIHtcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIGVuZCA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiBoYXNSb290ID8gXCIvXCIgOiBcIi5cIjtcbiAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSByZXR1cm4gXCIvL1wiO1xuICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbGFzdCBwb3J0aW9uIG9mIGEgYHBhdGhgLiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZC5cbiAqIEBwYXJhbSBwYXRoIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBleHQgb2YgcGF0aCBkaXJlY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IHN0cmluZywgZXh0ID0gXCJcIik6IHN0cmluZyB7XG4gIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZXh0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJleHRcIiBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gIH1cbiAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICBsZXQgaTogbnVtYmVyO1xuXG4gIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiBleHQubGVuZ3RoID4gMCAmJiBleHQubGVuZ3RoIDw9IHBhdGgubGVuZ3RoKSB7XG4gICAgaWYgKGV4dC5sZW5ndGggPT09IHBhdGgubGVuZ3RoICYmIGV4dCA9PT0gcGF0aCkgcmV0dXJuIFwiXCI7XG4gICAgbGV0IGV4dElkeCA9IGV4dC5sZW5ndGggLSAxO1xuICAgIGxldCBmaXJzdE5vblNsYXNoRW5kID0gLTE7XG4gICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSBDSEFSX0ZPUldBUkRfU0xBU0gpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZpcnN0Tm9uU2xhc2hFbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgIC8vIHdlIG5lZWQgaXQgaWYgdGhlIGV4dGVuc2lvbiBlbmRzIHVwIG5vdCBtYXRjaGluZ1xuICAgICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0SWR4ID49IDApIHtcbiAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgIGlmIChjb2RlID09PSBleHQuY2hhckNvZGVBdChleHRJZHgpKSB7XG4gICAgICAgICAgICBpZiAoLS1leHRJZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgLy8gY29tcG9uZW50XG4gICAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEV4dGVuc2lvbiBkb2VzIG5vdCBtYXRjaCwgc28gb3VyIHJlc3VsdCBpcyB0aGUgZW50aXJlIHBhdGhcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgZXh0SWR4ID0gLTE7XG4gICAgICAgICAgICBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydCA9PT0gZW5kKSBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgIGVsc2UgaWYgKGVuZCA9PT0gLTEpIGVuZCA9IHBhdGgubGVuZ3RoO1xuICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoaSkgPT09IENIQVJfRk9SV0FSRF9TTEFTSCkge1xuICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgICAvLyBwYXRoIGNvbXBvbmVudFxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBleHRlbnNpb24gb2YgdGhlIGBwYXRoYCB3aXRoIGxlYWRpbmcgcGVyaW9kLlxuICogQHBhcmFtIHBhdGggd2l0aCBleHRlbnNpb25cbiAqIEByZXR1cm5zIGV4dGVuc2lvbiAoZXguIGZvciBgZmlsZS50c2AgcmV0dXJucyBgLnRzYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dG5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgbGV0IHN0YXJ0RG90ID0gLTE7XG4gIGxldCBzdGFydFBhcnQgPSAwO1xuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXG4gIGxldCBwcmVEb3RTdGF0ZSA9IDA7XG4gIGZvciAobGV0IGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIKSB7XG4gICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IENIQVJfRE9UKSB7XG4gICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpIHN0YXJ0RG90ID0gaTtcbiAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKSBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICB9XG4gIH1cblxuICBpZiAoXG4gICAgc3RhcnREb3QgPT09IC0xIHx8XG4gICAgZW5kID09PSAtMSB8fFxuICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgKHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKVxuICApIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHBhdGggZnJvbSBgRm9ybWF0SW5wdXRQYXRoT2JqZWN0YCBvYmplY3QuXG4gKiBAcGFyYW0gcGF0aE9iamVjdCB3aXRoIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0OiBGb3JtYXRJbnB1dFBhdGhPYmplY3QpOiBzdHJpbmcge1xuICBpZiAocGF0aE9iamVjdCA9PT0gbnVsbCB8fCB0eXBlb2YgcGF0aE9iamVjdCAhPT0gXCJvYmplY3RcIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICBgVGhlIFwicGF0aE9iamVjdFwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJHt0eXBlb2YgcGF0aE9iamVjdH1gLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIF9mb3JtYXQoXCIvXCIsIHBhdGhPYmplY3QpO1xufVxuXG4vKipcbiAqIFJldHVybiBhIGBQYXJzZWRQYXRoYCBvYmplY3Qgb2YgdGhlIGBwYXRoYC5cbiAqIEBwYXJhbSBwYXRoIHRvIHByb2Nlc3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHBhdGg6IHN0cmluZyk6IFBhcnNlZFBhdGgge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGNvbnN0IHJldDogUGFyc2VkUGF0aCA9IHsgcm9vdDogXCJcIiwgZGlyOiBcIlwiLCBiYXNlOiBcIlwiLCBleHQ6IFwiXCIsIG5hbWU6IFwiXCIgfTtcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gcmV0O1xuICBjb25zdCBpc0Fic29sdXRlID0gcGF0aC5jaGFyQ29kZUF0KDApID09PSBDSEFSX0ZPUldBUkRfU0xBU0g7XG4gIGxldCBzdGFydDogbnVtYmVyO1xuICBpZiAoaXNBYnNvbHV0ZSkge1xuICAgIHJldC5yb290ID0gXCIvXCI7XG4gICAgc3RhcnQgPSAxO1xuICB9IGVsc2Uge1xuICAgIHN0YXJ0ID0gMDtcbiAgfVxuICBsZXQgc3RhcnREb3QgPSAtMTtcbiAgbGV0IHN0YXJ0UGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGxldCBpID0gcGF0aC5sZW5ndGggLSAxO1xuXG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgbGV0IHByZURvdFN0YXRlID0gMDtcblxuICAvLyBHZXQgbm9uLWRpciBpbmZvXG4gIGZvciAoOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChjb2RlID09PSBDSEFSX0ZPUldBUkRfU0xBU0gpIHtcbiAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gQ0hBUl9ET1QpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpO1xuICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBzdGFydERvdCA9PT0gLTEgfHxcbiAgICBlbmQgPT09IC0xIHx8XG4gICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAocHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpXG4gICkge1xuICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICBpZiAoc3RhcnRQYXJ0ID09PSAwICYmIGlzQWJzb2x1dGUpIHtcbiAgICAgICAgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgZW5kKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHN0YXJ0UGFydCA9PT0gMCAmJiBpc0Fic29sdXRlKSB7XG4gICAgICByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgc3RhcnREb3QpO1xuICAgICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKDEsIGVuZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIHN0YXJ0RG90KTtcbiAgICAgIHJldC5iYXNlID0gcGF0aC5zbGljZShzdGFydFBhcnQsIGVuZCk7XG4gICAgfVxuICAgIHJldC5leHQgPSBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xuICB9XG5cbiAgaWYgKHN0YXJ0UGFydCA+IDApIHJldC5kaXIgPSBwYXRoLnNsaWNlKDAsIHN0YXJ0UGFydCAtIDEpO1xuICBlbHNlIGlmIChpc0Fic29sdXRlKSByZXQuZGlyID0gXCIvXCI7XG5cbiAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIGZpbGUgVVJMIHRvIGEgcGF0aCBzdHJpbmcuXG4gKlxuICogYGBgdHNcbiAqICAgICAgaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwiLi9wb3NpeC50c1wiO1xuICogICAgICBmcm9tRmlsZVVybChcImZpbGU6Ly8vaG9tZS9mb29cIik7IC8vIFwiL2hvbWUvZm9vXCJcbiAqIGBgYFxuICogQHBhcmFtIHVybCBvZiBhIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tRmlsZVVybCh1cmw6IHN0cmluZyB8IFVSTCk6IHN0cmluZyB7XG4gIHVybCA9IHVybCBpbnN0YW5jZW9mIFVSTCA/IHVybCA6IG5ldyBVUkwodXJsKTtcbiAgaWYgKHVybC5wcm90b2NvbCAhPSBcImZpbGU6XCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBhIGZpbGUgVVJMLlwiKTtcbiAgfVxuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KFxuICAgIHVybC5wYXRobmFtZS5yZXBsYWNlKC8lKD8hWzAtOUEtRmEtZl17Mn0pL2csIFwiJTI1XCIpLFxuICApO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgcGF0aCBzdHJpbmcgdG8gYSBmaWxlIFVSTC5cbiAqXG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyB0b0ZpbGVVcmwgfSBmcm9tIFwiLi9wb3NpeC50c1wiO1xuICogICAgICB0b0ZpbGVVcmwoXCIvaG9tZS9mb29cIik7IC8vIG5ldyBVUkwoXCJmaWxlOi8vL2hvbWUvZm9vXCIpXG4gKiBgYGBcbiAqIEBwYXJhbSBwYXRoIHRvIGNvbnZlcnQgdG8gZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRmlsZVVybChwYXRoOiBzdHJpbmcpOiBVUkwge1xuICBpZiAoIWlzQWJzb2x1dGUocGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBhbiBhYnNvbHV0ZSBwYXRoLlwiKTtcbiAgfVxuICBjb25zdCB1cmwgPSBuZXcgVVJMKFwiZmlsZTovLy9cIik7XG4gIHVybC5wYXRobmFtZSA9IGVuY29kZVdoaXRlc3BhY2UoXG4gICAgcGF0aC5yZXBsYWNlKC8lL2csIFwiJTI1XCIpLnJlcGxhY2UoL1xcXFwvZywgXCIlNUNcIiksXG4gICk7XG4gIHJldHVybiB1cmw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLGlEQUFpRDtBQUNqRCw2REFBNkQ7QUFDN0QscUNBQXFDO0FBR3JDLFNBQVMsUUFBUSxFQUFFLGtCQUFrQixRQUFRLGlCQUFpQixDQUFDO0FBRS9ELFNBQ0UsT0FBTyxFQUNQLFVBQVUsRUFDVixnQkFBZ0IsRUFDaEIsb0JBQW9CLEVBQ3BCLGVBQWUsUUFDVixZQUFZLENBQUM7QUFFcEIsT0FBTyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdkIsT0FBTyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFFN0IsK0JBQStCO0FBQy9COzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxPQUFPLENBQUMsR0FBRyxZQUFZLEFBQVUsRUFBVTtJQUN6RCxJQUFJLFlBQVksR0FBRyxFQUFFLEFBQUM7SUFDdEIsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLEFBQUM7SUFFN0IsSUFBSyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBRTtRQUN2RSxJQUFJLElBQUksQUFBUSxBQUFDO1FBRWpCLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzlCO1lBQ0gsbUNBQW1DO1lBQ25DLE1BQU0sRUFBRSxJQUFJLENBQUEsRUFBRSxHQUFHLFVBQVUsQUFBTyxBQUFDO1lBQ25DLElBQUksT0FBTyxJQUFJLEVBQUUsR0FBRyxLQUFLLFVBQVUsRUFBRTtnQkFDbkMsTUFBTSxJQUFJLFNBQVMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFakIscUJBQXFCO1FBQ3JCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDckIsU0FBUztRQUNYLENBQUM7UUFFRCxZQUFZLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN6QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixDQUFDO0lBQy9ELENBQUM7SUFFRCx5RUFBeUU7SUFDekUsMkVBQTJFO0lBRTNFLHFCQUFxQjtJQUNyQixZQUFZLEdBQUcsZUFBZSxDQUM1QixZQUFZLEVBQ1osQ0FBQyxnQkFBZ0IsRUFDakIsR0FBRyxFQUNILG9CQUFvQixDQUNyQixDQUFDO0lBRUYsSUFBSSxnQkFBZ0IsRUFBRTtRQUNwQixJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzthQUNsRCxPQUFPLEdBQUcsQ0FBQztJQUNsQixPQUFPLElBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsT0FBTyxZQUFZLENBQUM7U0FDbkQsT0FBTyxHQUFHLENBQUM7QUFDbEIsQ0FBQztBQUVEOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxTQUFTLENBQUMsSUFBWSxFQUFVO0lBQzlDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVqQixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0lBRWxDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEFBQUM7SUFDN0QsTUFBTSxpQkFBaUIsR0FDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixBQUFDO0lBRTFELHFCQUFxQjtJQUNyQixJQUFJLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUVyRSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksR0FBRyxHQUFHLENBQUM7SUFDakQsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxpQkFBaUIsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDO0lBRXRELElBQUksVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsQyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsVUFBVSxDQUFDLElBQVksRUFBVztJQUNoRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixDQUFDO0FBQ3RFLENBQUM7QUFFRDs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsSUFBSSxDQUFDLEdBQUcsS0FBSyxBQUFVLEVBQVU7SUFDL0MsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxPQUFPLEdBQUcsQ0FBQztJQUNuQyxJQUFJLE1BQU0sQUFBb0IsQUFBQztJQUMvQixJQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFFO1FBQ2hELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQUFBQztRQUN0QixVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNuQixJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUM7aUJBQ3RCLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUM7SUFDSCxDQUFDO0lBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEdBQUcsQ0FBQztJQUN4QixPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBRUQ7Ozs7Q0FJQyxHQUNELE9BQU8sU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLEVBQVUsRUFBVTtJQUN6RCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRWYsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBRTNCLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckIsRUFBRSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVqQixJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFFM0IsK0JBQStCO0lBQy9CLElBQUksU0FBUyxHQUFHLENBQUMsQUFBQztJQUNsQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxBQUFDO0lBQzVCLE1BQU8sU0FBUyxHQUFHLE9BQU8sRUFBRSxFQUFFLFNBQVMsQ0FBRTtRQUN2QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsTUFBTTtJQUMvRCxDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQUcsT0FBTyxHQUFHLFNBQVMsQUFBQztJQUVwQywrQkFBK0I7SUFDL0IsSUFBSSxPQUFPLEdBQUcsQ0FBQyxBQUFDO0lBQ2hCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEFBQUM7SUFDeEIsTUFBTyxPQUFPLEdBQUcsS0FBSyxFQUFFLEVBQUUsT0FBTyxDQUFFO1FBQ2pDLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxrQkFBa0IsRUFBRSxNQUFNO0lBQzNELENBQUM7SUFDRCxNQUFNLEtBQUssR0FBRyxLQUFLLEdBQUcsT0FBTyxBQUFDO0lBRTlCLDBEQUEwRDtJQUMxRCxNQUFNLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxHQUFHLE9BQU8sR0FBRyxLQUFLLEFBQUM7SUFDakQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLEFBQUM7SUFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxBQUFDO0lBQ1YsTUFBTyxDQUFDLElBQUksTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFFO1FBQ3ZCLElBQUksQ0FBQyxLQUFLLE1BQU0sRUFBRTtZQUNoQixJQUFJLEtBQUssR0FBRyxNQUFNLEVBQUU7Z0JBQ2xCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUU7b0JBQ3JELHlEQUF5RDtvQkFDekQsa0RBQWtEO29CQUNsRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ2xCLG9DQUFvQztvQkFDcEMsbUNBQW1DO29CQUNuQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0gsT0FBTyxJQUFJLE9BQU8sR0FBRyxNQUFNLEVBQUU7Z0JBQzNCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUU7b0JBQ3pELHlEQUF5RDtvQkFDekQsa0RBQWtEO29CQUNsRCxhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDbEIsbUNBQW1DO29CQUNuQyxtQ0FBbUM7b0JBQ25DLGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7WUFDSCxDQUFDO1lBQ0QsTUFBTTtRQUNSLENBQUM7UUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQUFBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQUFBQztRQUMxQyxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUUsTUFBTTthQUMxQixJQUFJLFFBQVEsS0FBSyxrQkFBa0IsRUFBRSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxJQUFJLEdBQUcsR0FBRyxFQUFFLEFBQUM7SUFDYix1RUFBdUU7SUFDdkUsYUFBYTtJQUNiLElBQUssQ0FBQyxHQUFHLFNBQVMsR0FBRyxhQUFhLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUU7UUFDekQsSUFBSSxDQUFDLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUU7WUFDOUQsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDO2lCQUM3QixHQUFHLElBQUksS0FBSyxDQUFDO1FBQ3BCLENBQUM7SUFDSCxDQUFDO0lBRUQsMEVBQTBFO0lBQzFFLHdCQUF3QjtJQUN4QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxDQUFDO1NBQzlEO1FBQ0gsT0FBTyxJQUFJLGFBQWEsQ0FBQztRQUN6QixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsRUFBRSxPQUFPLENBQUM7UUFDN0QsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNCLENBQUM7QUFDSCxDQUFDO0FBRUQ7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLGdCQUFnQixDQUFDLElBQVksRUFBVTtJQUNyRCwwQkFBMEI7SUFDMUIsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sQ0FBQyxJQUFZLEVBQVU7SUFDNUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxHQUFHLENBQUM7SUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxrQkFBa0IsQUFBQztJQUMxRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQUFBQztJQUNiLElBQUksWUFBWSxHQUFHLElBQUksQUFBQztJQUN4QixJQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUU7UUFDekMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixFQUFFO1lBQzdDLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ2pCLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ1IsTUFBTTtZQUNSLENBQUM7UUFDSCxPQUFPO1lBQ0wsc0NBQXNDO1lBQ3RDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDdkIsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLE9BQU8sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQzNDLElBQUksT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUM7SUFDdEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Q0FJQyxHQUNELE9BQU8sU0FBUyxRQUFRLENBQUMsSUFBWSxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQVU7SUFDdkQsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUNoRCxNQUFNLElBQUksU0FBUyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUNELFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVqQixJQUFJLEtBQUssR0FBRyxDQUFDLEFBQUM7SUFDZCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQUFBQztJQUNiLElBQUksWUFBWSxHQUFHLElBQUksQUFBQztJQUN4QixJQUFJLENBQUMsQUFBUSxBQUFDO0lBRWQsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNwRSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQzFELElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxBQUFDO1FBQzVCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLEFBQUM7UUFDMUIsSUFBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBRTtZQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxBQUFDO1lBQ2hDLElBQUksSUFBSSxLQUFLLGtCQUFrQixFQUFFO2dCQUMvQixvRUFBb0U7Z0JBQ3BFLGdEQUFnRDtnQkFDaEQsSUFBSSxDQUFDLFlBQVksRUFBRTtvQkFDakIsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2QsTUFBTTtnQkFDUixDQUFDO1lBQ0gsT0FBTztnQkFDTCxJQUFJLGdCQUFnQixLQUFLLENBQUMsQ0FBQyxFQUFFO29CQUMzQixtRUFBbUU7b0JBQ25FLG1EQUFtRDtvQkFDbkQsWUFBWSxHQUFHLEtBQUssQ0FBQztvQkFDckIsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztnQkFDRCxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQ2Ysc0NBQXNDO29CQUN0QyxJQUFJLElBQUksS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUNuQyxJQUFJLEVBQUUsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFOzRCQUNuQixnRUFBZ0U7NEJBQ2hFLFlBQVk7NEJBQ1osR0FBRyxHQUFHLENBQUMsQ0FBQzt3QkFDVixDQUFDO29CQUNILE9BQU87d0JBQ0wsNkRBQTZEO3dCQUM3RCxZQUFZO3dCQUNaLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDWixHQUFHLEdBQUcsZ0JBQWdCLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxLQUFLLEtBQUssR0FBRyxFQUFFLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQzthQUNyQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN2QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLE9BQU87UUFDTCxJQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFFO1lBQ3JDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxrQkFBa0IsRUFBRTtnQkFDN0Msb0VBQW9FO2dCQUNwRSxnREFBZ0Q7Z0JBQ2hELElBQUksQ0FBQyxZQUFZLEVBQUU7b0JBQ2pCLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNkLE1BQU07Z0JBQ1IsQ0FBQztZQUNILE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JCLG1FQUFtRTtnQkFDbkUsaUJBQWlCO2dCQUNqQixZQUFZLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsT0FBTyxDQUFDLElBQVksRUFBVTtJQUM1QyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLEFBQUM7SUFDbEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxBQUFDO0lBQ2xCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxBQUFDO0lBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxBQUFDO0lBQ3hCLHlFQUF5RTtJQUN6RSxtQ0FBbUM7SUFDbkMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxBQUFDO0lBQ3BCLElBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBRTtRQUN6QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxBQUFDO1FBQ2hDLElBQUksSUFBSSxLQUFLLGtCQUFrQixFQUFFO1lBQy9CLG9FQUFvRTtZQUNwRSxnREFBZ0Q7WUFDaEQsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDakIsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLE1BQU07WUFDUixDQUFDO1lBQ0QsU0FBUztRQUNYLENBQUM7UUFDRCxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNkLG1FQUFtRTtZQUNuRSxZQUFZO1lBQ1osWUFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNkLENBQUM7UUFDRCxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDckIsa0VBQWtFO1lBQ2xFLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUM7aUJBQzdCLElBQUksV0FBVyxLQUFLLENBQUMsRUFBRSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQzlDLE9BQU8sSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDMUIsdUVBQXVFO1lBQ3ZFLHFEQUFxRDtZQUNyRCxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkIsQ0FBQztJQUNILENBQUM7SUFFRCxJQUNFLFFBQVEsS0FBSyxDQUFDLENBQUMsSUFDZixHQUFHLEtBQUssQ0FBQyxDQUFDLElBQ1Ysd0RBQXdEO0lBQ3hELFdBQVcsS0FBSyxDQUFDLElBQ2pCLDBEQUEwRDtJQUMxRCxDQUFDLFdBQVcsS0FBSyxDQUFDLElBQUksUUFBUSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksUUFBUSxLQUFLLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFDekU7UUFDQSxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFFRDs7O0NBR0MsR0FDRCxPQUFPLFNBQVMsTUFBTSxDQUFDLFVBQWlDLEVBQVU7SUFDaEUsSUFBSSxVQUFVLEtBQUssSUFBSSxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUN6RCxNQUFNLElBQUksU0FBUyxDQUNqQixDQUFDLGdFQUFnRSxFQUFFLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FDdkYsQ0FBQztJQUNKLENBQUM7SUFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDbEMsQ0FBQztBQUVEOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxLQUFLLENBQUMsSUFBWSxFQUFjO0lBQzlDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVqQixNQUFNLEdBQUcsR0FBZTtRQUFFLElBQUksRUFBRSxFQUFFO1FBQUUsR0FBRyxFQUFFLEVBQUU7UUFBRSxJQUFJLEVBQUUsRUFBRTtRQUFFLEdBQUcsRUFBRSxFQUFFO1FBQUUsSUFBSSxFQUFFLEVBQUU7S0FBRSxBQUFDO0lBQzNFLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxHQUFHLENBQUM7SUFDbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxrQkFBa0IsQUFBQztJQUM3RCxJQUFJLEtBQUssQUFBUSxBQUFDO0lBQ2xCLElBQUksVUFBVSxFQUFFO1FBQ2QsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ1osT0FBTztRQUNMLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBQ0QsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLEFBQUM7SUFDbEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxBQUFDO0lBQ2xCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxBQUFDO0lBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxBQUFDO0lBQ3hCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxBQUFDO0lBRXhCLHlFQUF5RTtJQUN6RSxtQ0FBbUM7SUFDbkMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxBQUFDO0lBRXBCLG1CQUFtQjtJQUNuQixNQUFPLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUU7UUFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQUFBQztRQUNoQyxJQUFJLElBQUksS0FBSyxrQkFBa0IsRUFBRTtZQUMvQixvRUFBb0U7WUFDcEUsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ2pCLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixNQUFNO1lBQ1IsQ0FBQztZQUNELFNBQVM7UUFDWCxDQUFDO1FBQ0QsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDZCxtRUFBbUU7WUFDbkUsWUFBWTtZQUNaLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDckIsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3JCLGtFQUFrRTtZQUNsRSxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUMsRUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDO2lCQUM3QixJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUUsV0FBVyxHQUFHLENBQUMsQ0FBQztRQUM5QyxPQUFPLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQzFCLHVFQUF1RTtZQUN2RSxxREFBcUQ7WUFDckQsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25CLENBQUM7SUFDSCxDQUFDO0lBRUQsSUFDRSxRQUFRLEtBQUssQ0FBQyxDQUFDLElBQ2YsR0FBRyxLQUFLLENBQUMsQ0FBQyxJQUNWLHdEQUF3RDtJQUN4RCxXQUFXLEtBQUssQ0FBQyxJQUNqQiwwREFBMEQ7SUFDMUQsQ0FBQyxXQUFXLEtBQUssQ0FBQyxJQUFJLFFBQVEsS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQ3pFO1FBQ0EsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDZCxJQUFJLFNBQVMsS0FBSyxDQUFDLElBQUksVUFBVSxFQUFFO2dCQUNqQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDM0MsT0FBTztnQkFDTCxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNILENBQUM7SUFDSCxPQUFPO1FBQ0wsSUFBSSxTQUFTLEtBQUssQ0FBQyxJQUFJLFVBQVUsRUFBRTtZQUNqQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEMsT0FBTztZQUNMLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0MsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3JELElBQUksVUFBVSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBRW5DLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7Ozs7OztDQVFDLEdBQ0QsT0FBTyxTQUFTLFdBQVcsQ0FBQyxHQUFpQixFQUFVO0lBQ3JELEdBQUcsR0FBRyxHQUFHLFlBQVksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QyxJQUFJLEdBQUcsQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFFO1FBQzNCLE1BQU0sSUFBSSxTQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBQ0QsT0FBTyxrQkFBa0IsQ0FDdkIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLHlCQUF5QixLQUFLLENBQUMsQ0FDcEQsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7Ozs7Q0FRQyxHQUNELE9BQU8sU0FBUyxTQUFTLENBQUMsSUFBWSxFQUFPO0lBQzNDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDckIsTUFBTSxJQUFJLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsQUFBQztJQUNoQyxHQUFHLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUM3QixJQUFJLENBQUMsT0FBTyxPQUFPLEtBQUssQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLENBQUMsQ0FDaEQsQ0FBQztJQUNGLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyJ9