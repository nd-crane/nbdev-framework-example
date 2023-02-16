// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Documentation and interface for walk were adapted from Go
// https://golang.org/pkg/path/filepath/#Walk
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
import { assert } from "../_util/assert.ts";
import { join, normalize } from "../path/mod.ts";
import { createWalkEntry, createWalkEntrySync } from "./_util.ts";
function include(path, exts, match, skip) {
    if (exts && !exts.some((ext)=>path.endsWith(ext))) {
        return false;
    }
    if (match && !match.some((pattern)=>!!path.match(pattern))) {
        return false;
    }
    if (skip && skip.some((pattern)=>!!path.match(pattern))) {
        return false;
    }
    return true;
}
function wrapErrorWithRootPath(err, root) {
    if (err instanceof Error && "root" in err) return err;
    const e = new Error();
    e.root = root;
    e.message = err instanceof Error ? `${err.message} for path "${root}"` : `[non-error thrown] for path "${root}"`;
    e.stack = err instanceof Error ? err.stack : undefined;
    e.cause = err instanceof Error ? err.cause : undefined;
    return e;
}
/** Walks the file tree rooted at root, yielding each file or directory in the
 * tree filtered according to the given options. The files are walked in lexical
 * order, which makes the output deterministic but means that for very large
 * directories walk() can be inefficient.
 *
 * Options:
 * - maxDepth?: number = Infinity;
 * - includeFiles?: boolean = true;
 * - includeDirs?: boolean = true;
 * - followSymlinks?: boolean = false;
 * - exts?: string[];
 * - match?: RegExp[];
 * - skip?: RegExp[];
 *
 * ```ts
 *       import { walk } from "./walk.ts";
 *       import { assert } from "../testing/asserts.ts";
 *
 *       for await (const entry of walk(".")) {
 *         console.log(entry.path);
 *         assert(entry.isFile);
 *       }
 * ```
 */ export async function* walk(root, { maxDepth =Infinity , includeFiles =true , includeDirs =true , followSymlinks =false , exts =undefined , match =undefined , skip =undefined  } = {}) {
    if (maxDepth < 0) {
        return;
    }
    if (includeDirs && include(root, exts, match, skip)) {
        yield await createWalkEntry(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    try {
        for await (const entry of Deno.readDir(root)){
            assert(entry.name != null);
            let path = join(root, entry.name);
            let { isSymlink , isDirectory  } = entry;
            if (isSymlink) {
                if (!followSymlinks) continue;
                path = await Deno.realPath(path);
                // Caveat emptor: don't assume |path| is not a symlink. realpath()
                // resolves symlinks but another process can replace the file system
                // entity with a different type of entity before we call lstat().
                ({ isSymlink , isDirectory  } = await Deno.lstat(path));
            }
            if (isSymlink || isDirectory) {
                yield* walk(path, {
                    maxDepth: maxDepth - 1,
                    includeFiles,
                    includeDirs,
                    followSymlinks,
                    exts,
                    match,
                    skip
                });
            } else if (includeFiles && include(path, exts, match, skip)) {
                yield {
                    path,
                    ...entry
                };
            }
        }
    } catch (err) {
        throw wrapErrorWithRootPath(err, normalize(root));
    }
}
/** Same as walk() but uses synchronous ops */ export function* walkSync(root, { maxDepth =Infinity , includeFiles =true , includeDirs =true , followSymlinks =false , exts =undefined , match =undefined , skip =undefined  } = {}) {
    if (maxDepth < 0) {
        return;
    }
    if (includeDirs && include(root, exts, match, skip)) {
        yield createWalkEntrySync(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    let entries;
    try {
        entries = Deno.readDirSync(root);
    } catch (err) {
        throw wrapErrorWithRootPath(err, normalize(root));
    }
    for (const entry of entries){
        assert(entry.name != null);
        let path = join(root, entry.name);
        let { isSymlink , isDirectory  } = entry;
        if (isSymlink) {
            if (!followSymlinks) continue;
            path = Deno.realPathSync(path);
            // Caveat emptor: don't assume |path| is not a symlink. realpath()
            // resolves symlinks but another process can replace the file system
            // entity with a different type of entity before we call lstat().
            ({ isSymlink , isDirectory  } = Deno.lstatSync(path));
        }
        if (isSymlink || isDirectory) {
            yield* walkSync(path, {
                maxDepth: maxDepth - 1,
                includeFiles,
                includeDirs,
                followSymlinks,
                exts,
                match,
                skip
            });
        } else if (includeFiles && include(path, exts, match, skip)) {
            yield {
                path,
                ...entry
            };
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2ZzL3dhbGsudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIERvY3VtZW50YXRpb24gYW5kIGludGVyZmFjZSBmb3Igd2FsayB3ZXJlIGFkYXB0ZWQgZnJvbSBHb1xuLy8gaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9wYXRoL2ZpbGVwYXRoLyNXYWxrXG4vLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gQlNEIGxpY2Vuc2UuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBqb2luLCBub3JtYWxpemUgfSBmcm9tIFwiLi4vcGF0aC9tb2QudHNcIjtcbmltcG9ydCB7IGNyZWF0ZVdhbGtFbnRyeSwgY3JlYXRlV2Fsa0VudHJ5U3luYywgV2Fsa0VudHJ5IH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuZnVuY3Rpb24gaW5jbHVkZShcbiAgcGF0aDogc3RyaW5nLFxuICBleHRzPzogc3RyaW5nW10sXG4gIG1hdGNoPzogUmVnRXhwW10sXG4gIHNraXA/OiBSZWdFeHBbXSxcbik6IGJvb2xlYW4ge1xuICBpZiAoZXh0cyAmJiAhZXh0cy5zb21lKChleHQpOiBib29sZWFuID0+IHBhdGguZW5kc1dpdGgoZXh0KSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKG1hdGNoICYmICFtYXRjaC5zb21lKChwYXR0ZXJuKTogYm9vbGVhbiA9PiAhIXBhdGgubWF0Y2gocGF0dGVybikpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChza2lwICYmIHNraXAuc29tZSgocGF0dGVybik6IGJvb2xlYW4gPT4gISFwYXRoLm1hdGNoKHBhdHRlcm4pKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gd3JhcEVycm9yV2l0aFJvb3RQYXRoKGVycjogdW5rbm93biwgcm9vdDogc3RyaW5nKSB7XG4gIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvciAmJiBcInJvb3RcIiBpbiBlcnIpIHJldHVybiBlcnI7XG4gIGNvbnN0IGUgPSBuZXcgRXJyb3IoKSBhcyBFcnJvciAmIHsgcm9vdDogc3RyaW5nIH07XG4gIGUucm9vdCA9IHJvb3Q7XG4gIGUubWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yXG4gICAgPyBgJHtlcnIubWVzc2FnZX0gZm9yIHBhdGggXCIke3Jvb3R9XCJgXG4gICAgOiBgW25vbi1lcnJvciB0aHJvd25dIGZvciBwYXRoIFwiJHtyb290fVwiYDtcbiAgZS5zdGFjayA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLnN0YWNrIDogdW5kZWZpbmVkO1xuICBlLmNhdXNlID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIuY2F1c2UgOiB1bmRlZmluZWQ7XG4gIHJldHVybiBlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGtPcHRpb25zIHtcbiAgbWF4RGVwdGg/OiBudW1iZXI7XG4gIGluY2x1ZGVGaWxlcz86IGJvb2xlYW47XG4gIGluY2x1ZGVEaXJzPzogYm9vbGVhbjtcbiAgZm9sbG93U3ltbGlua3M/OiBib29sZWFuO1xuICBleHRzPzogc3RyaW5nW107XG4gIG1hdGNoPzogUmVnRXhwW107XG4gIHNraXA/OiBSZWdFeHBbXTtcbn1cbmV4cG9ydCB0eXBlIHsgV2Fsa0VudHJ5IH07XG5cbi8qKiBXYWxrcyB0aGUgZmlsZSB0cmVlIHJvb3RlZCBhdCByb290LCB5aWVsZGluZyBlYWNoIGZpbGUgb3IgZGlyZWN0b3J5IGluIHRoZVxuICogdHJlZSBmaWx0ZXJlZCBhY2NvcmRpbmcgdG8gdGhlIGdpdmVuIG9wdGlvbnMuIFRoZSBmaWxlcyBhcmUgd2Fsa2VkIGluIGxleGljYWxcbiAqIG9yZGVyLCB3aGljaCBtYWtlcyB0aGUgb3V0cHV0IGRldGVybWluaXN0aWMgYnV0IG1lYW5zIHRoYXQgZm9yIHZlcnkgbGFyZ2VcbiAqIGRpcmVjdG9yaWVzIHdhbGsoKSBjYW4gYmUgaW5lZmZpY2llbnQuXG4gKlxuICogT3B0aW9uczpcbiAqIC0gbWF4RGVwdGg/OiBudW1iZXIgPSBJbmZpbml0eTtcbiAqIC0gaW5jbHVkZUZpbGVzPzogYm9vbGVhbiA9IHRydWU7XG4gKiAtIGluY2x1ZGVEaXJzPzogYm9vbGVhbiA9IHRydWU7XG4gKiAtIGZvbGxvd1N5bWxpbmtzPzogYm9vbGVhbiA9IGZhbHNlO1xuICogLSBleHRzPzogc3RyaW5nW107XG4gKiAtIG1hdGNoPzogUmVnRXhwW107XG4gKiAtIHNraXA/OiBSZWdFeHBbXTtcbiAqXG4gKiBgYGB0c1xuICogICAgICAgaW1wb3J0IHsgd2FsayB9IGZyb20gXCIuL3dhbGsudHNcIjtcbiAqICAgICAgIGltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGVudHJ5IG9mIHdhbGsoXCIuXCIpKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKGVudHJ5LnBhdGgpO1xuICogICAgICAgICBhc3NlcnQoZW50cnkuaXNGaWxlKTtcbiAqICAgICAgIH1cbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIHdhbGsoXG4gIHJvb3Q6IHN0cmluZyxcbiAge1xuICAgIG1heERlcHRoID0gSW5maW5pdHksXG4gICAgaW5jbHVkZUZpbGVzID0gdHJ1ZSxcbiAgICBpbmNsdWRlRGlycyA9IHRydWUsXG4gICAgZm9sbG93U3ltbGlua3MgPSBmYWxzZSxcbiAgICBleHRzID0gdW5kZWZpbmVkLFxuICAgIG1hdGNoID0gdW5kZWZpbmVkLFxuICAgIHNraXAgPSB1bmRlZmluZWQsXG4gIH06IFdhbGtPcHRpb25zID0ge30sXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gIGlmIChtYXhEZXB0aCA8IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGluY2x1ZGVEaXJzICYmIGluY2x1ZGUocm9vdCwgZXh0cywgbWF0Y2gsIHNraXApKSB7XG4gICAgeWllbGQgYXdhaXQgY3JlYXRlV2Fsa0VudHJ5KHJvb3QpO1xuICB9XG4gIGlmIChtYXhEZXB0aCA8IDEgfHwgIWluY2x1ZGUocm9vdCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHNraXApKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBEZW5vLnJlYWREaXIocm9vdCkpIHtcbiAgICAgIGFzc2VydChlbnRyeS5uYW1lICE9IG51bGwpO1xuICAgICAgbGV0IHBhdGggPSBqb2luKHJvb3QsIGVudHJ5Lm5hbWUpO1xuXG4gICAgICBsZXQgeyBpc1N5bWxpbmssIGlzRGlyZWN0b3J5IH0gPSBlbnRyeTtcblxuICAgICAgaWYgKGlzU3ltbGluaykge1xuICAgICAgICBpZiAoIWZvbGxvd1N5bWxpbmtzKSBjb250aW51ZTtcbiAgICAgICAgcGF0aCA9IGF3YWl0IERlbm8ucmVhbFBhdGgocGF0aCk7XG4gICAgICAgIC8vIENhdmVhdCBlbXB0b3I6IGRvbid0IGFzc3VtZSB8cGF0aHwgaXMgbm90IGEgc3ltbGluay4gcmVhbHBhdGgoKVxuICAgICAgICAvLyByZXNvbHZlcyBzeW1saW5rcyBidXQgYW5vdGhlciBwcm9jZXNzIGNhbiByZXBsYWNlIHRoZSBmaWxlIHN5c3RlbVxuICAgICAgICAvLyBlbnRpdHkgd2l0aCBhIGRpZmZlcmVudCB0eXBlIG9mIGVudGl0eSBiZWZvcmUgd2UgY2FsbCBsc3RhdCgpLlxuICAgICAgICAoeyBpc1N5bWxpbmssIGlzRGlyZWN0b3J5IH0gPSBhd2FpdCBEZW5vLmxzdGF0KHBhdGgpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzU3ltbGluayB8fCBpc0RpcmVjdG9yeSkge1xuICAgICAgICB5aWVsZCogd2FsayhwYXRoLCB7XG4gICAgICAgICAgbWF4RGVwdGg6IG1heERlcHRoIC0gMSxcbiAgICAgICAgICBpbmNsdWRlRmlsZXMsXG4gICAgICAgICAgaW5jbHVkZURpcnMsXG4gICAgICAgICAgZm9sbG93U3ltbGlua3MsXG4gICAgICAgICAgZXh0cyxcbiAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICBza2lwLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoaW5jbHVkZUZpbGVzICYmIGluY2x1ZGUocGF0aCwgZXh0cywgbWF0Y2gsIHNraXApKSB7XG4gICAgICAgIHlpZWxkIHsgcGF0aCwgLi4uZW50cnkgfTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IHdyYXBFcnJvcldpdGhSb290UGF0aChlcnIsIG5vcm1hbGl6ZShyb290KSk7XG4gIH1cbn1cblxuLyoqIFNhbWUgYXMgd2FsaygpIGJ1dCB1c2VzIHN5bmNocm9ub3VzIG9wcyAqL1xuZXhwb3J0IGZ1bmN0aW9uKiB3YWxrU3luYyhcbiAgcm9vdDogc3RyaW5nLFxuICB7XG4gICAgbWF4RGVwdGggPSBJbmZpbml0eSxcbiAgICBpbmNsdWRlRmlsZXMgPSB0cnVlLFxuICAgIGluY2x1ZGVEaXJzID0gdHJ1ZSxcbiAgICBmb2xsb3dTeW1saW5rcyA9IGZhbHNlLFxuICAgIGV4dHMgPSB1bmRlZmluZWQsXG4gICAgbWF0Y2ggPSB1bmRlZmluZWQsXG4gICAgc2tpcCA9IHVuZGVmaW5lZCxcbiAgfTogV2Fsa09wdGlvbnMgPSB7fSxcbik6IEl0ZXJhYmxlSXRlcmF0b3I8V2Fsa0VudHJ5PiB7XG4gIGlmIChtYXhEZXB0aCA8IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGluY2x1ZGVEaXJzICYmIGluY2x1ZGUocm9vdCwgZXh0cywgbWF0Y2gsIHNraXApKSB7XG4gICAgeWllbGQgY3JlYXRlV2Fsa0VudHJ5U3luYyhyb290KTtcbiAgfVxuICBpZiAobWF4RGVwdGggPCAxIHx8ICFpbmNsdWRlKHJvb3QsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBza2lwKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgZW50cmllcztcbiAgdHJ5IHtcbiAgICBlbnRyaWVzID0gRGVuby5yZWFkRGlyU3luYyhyb290KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgd3JhcEVycm9yV2l0aFJvb3RQYXRoKGVyciwgbm9ybWFsaXplKHJvb3QpKTtcbiAgfVxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICBhc3NlcnQoZW50cnkubmFtZSAhPSBudWxsKTtcbiAgICBsZXQgcGF0aCA9IGpvaW4ocm9vdCwgZW50cnkubmFtZSk7XG5cbiAgICBsZXQgeyBpc1N5bWxpbmssIGlzRGlyZWN0b3J5IH0gPSBlbnRyeTtcblxuICAgIGlmIChpc1N5bWxpbmspIHtcbiAgICAgIGlmICghZm9sbG93U3ltbGlua3MpIGNvbnRpbnVlO1xuICAgICAgcGF0aCA9IERlbm8ucmVhbFBhdGhTeW5jKHBhdGgpO1xuICAgICAgLy8gQ2F2ZWF0IGVtcHRvcjogZG9uJ3QgYXNzdW1lIHxwYXRofCBpcyBub3QgYSBzeW1saW5rLiByZWFscGF0aCgpXG4gICAgICAvLyByZXNvbHZlcyBzeW1saW5rcyBidXQgYW5vdGhlciBwcm9jZXNzIGNhbiByZXBsYWNlIHRoZSBmaWxlIHN5c3RlbVxuICAgICAgLy8gZW50aXR5IHdpdGggYSBkaWZmZXJlbnQgdHlwZSBvZiBlbnRpdHkgYmVmb3JlIHdlIGNhbGwgbHN0YXQoKS5cbiAgICAgICh7IGlzU3ltbGluaywgaXNEaXJlY3RvcnkgfSA9IERlbm8ubHN0YXRTeW5jKHBhdGgpKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTeW1saW5rIHx8IGlzRGlyZWN0b3J5KSB7XG4gICAgICB5aWVsZCogd2Fsa1N5bmMocGF0aCwge1xuICAgICAgICBtYXhEZXB0aDogbWF4RGVwdGggLSAxLFxuICAgICAgICBpbmNsdWRlRmlsZXMsXG4gICAgICAgIGluY2x1ZGVEaXJzLFxuICAgICAgICBmb2xsb3dTeW1saW5rcyxcbiAgICAgICAgZXh0cyxcbiAgICAgICAgbWF0Y2gsXG4gICAgICAgIHNraXAsXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGluY2x1ZGVGaWxlcyAmJiBpbmNsdWRlKHBhdGgsIGV4dHMsIG1hdGNoLCBza2lwKSkge1xuICAgICAgeWllbGQgeyBwYXRoLCAuLi5lbnRyeSB9O1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSw0REFBNEQ7QUFDNUQsNkNBQTZDO0FBQzdDLG1FQUFtRTtBQUNuRSxTQUFTLE1BQU0sUUFBUSxvQkFBb0IsQ0FBQztBQUM1QyxTQUFTLElBQUksRUFBRSxTQUFTLFFBQVEsZ0JBQWdCLENBQUM7QUFDakQsU0FBUyxlQUFlLEVBQUUsbUJBQW1CLFFBQW1CLFlBQVksQ0FBQztBQUU3RSxTQUFTLE9BQU8sQ0FDZCxJQUFZLEVBQ1osSUFBZSxFQUNmLEtBQWdCLEVBQ2hCLElBQWUsRUFDTjtJQUNULElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBYyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7UUFDNUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0QsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7UUFDckUsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0QsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sR0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFO1FBQ2xFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsR0FBWSxFQUFFLElBQVksRUFBRTtJQUN6RCxJQUFJLEdBQUcsWUFBWSxLQUFLLElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRSxPQUFPLEdBQUcsQ0FBQztJQUN0RCxNQUFNLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxBQUE0QixBQUFDO0lBQ2xELENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLE9BQU8sR0FBRyxHQUFHLFlBQVksS0FBSyxHQUM1QixDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUNuQyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsWUFBWSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7SUFDdkQsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLFlBQVksS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO0lBQ3ZELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQWFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUNELE9BQU8sZ0JBQWdCLElBQUksQ0FDekIsSUFBWSxFQUNaLEVBQ0UsUUFBUSxFQUFHLFFBQVEsQ0FBQSxFQUNuQixZQUFZLEVBQUcsSUFBSSxDQUFBLEVBQ25CLFdBQVcsRUFBRyxJQUFJLENBQUEsRUFDbEIsY0FBYyxFQUFHLEtBQUssQ0FBQSxFQUN0QixJQUFJLEVBQUcsU0FBUyxDQUFBLEVBQ2hCLEtBQUssRUFBRyxTQUFTLENBQUEsRUFDakIsSUFBSSxFQUFHLFNBQVMsQ0FBQSxFQUNKLEdBQUcsRUFBRSxFQUNlO0lBQ2xDLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRTtRQUNoQixPQUFPO0lBQ1QsQ0FBQztJQUNELElBQUksV0FBVyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNuRCxNQUFNLE1BQU0sZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRCxJQUFJLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDOUQsT0FBTztJQUNULENBQUM7SUFDRCxJQUFJO1FBQ0YsV0FBVyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFFO1lBQzVDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQzNCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxBQUFDO1lBRWxDLElBQUksRUFBRSxTQUFTLENBQUEsRUFBRSxXQUFXLENBQUEsRUFBRSxHQUFHLEtBQUssQUFBQztZQUV2QyxJQUFJLFNBQVMsRUFBRTtnQkFDYixJQUFJLENBQUMsY0FBYyxFQUFFLFNBQVM7Z0JBQzlCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLGtFQUFrRTtnQkFDbEUsb0VBQW9FO2dCQUNwRSxpRUFBaUU7Z0JBQ2pFLENBQUMsRUFBRSxTQUFTLENBQUEsRUFBRSxXQUFXLENBQUEsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxJQUFJLFNBQVMsSUFBSSxXQUFXLEVBQUU7Z0JBQzVCLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRTtvQkFDaEIsUUFBUSxFQUFFLFFBQVEsR0FBRyxDQUFDO29CQUN0QixZQUFZO29CQUNaLFdBQVc7b0JBQ1gsY0FBYztvQkFDZCxJQUFJO29CQUNKLEtBQUs7b0JBQ0wsSUFBSTtpQkFDTCxDQUFDLENBQUM7WUFDTCxPQUFPLElBQUksWUFBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDM0QsTUFBTTtvQkFBRSxJQUFJO29CQUFFLEdBQUcsS0FBSztpQkFBRSxDQUFDO1lBQzNCLENBQUM7UUFDSCxDQUFDO0lBQ0gsRUFBRSxPQUFPLEdBQUcsRUFBRTtRQUNaLE1BQU0scUJBQXFCLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7QUFDSCxDQUFDO0FBRUQsNENBQTRDLEdBQzVDLE9BQU8sVUFBVSxRQUFRLENBQ3ZCLElBQVksRUFDWixFQUNFLFFBQVEsRUFBRyxRQUFRLENBQUEsRUFDbkIsWUFBWSxFQUFHLElBQUksQ0FBQSxFQUNuQixXQUFXLEVBQUcsSUFBSSxDQUFBLEVBQ2xCLGNBQWMsRUFBRyxLQUFLLENBQUEsRUFDdEIsSUFBSSxFQUFHLFNBQVMsQ0FBQSxFQUNoQixLQUFLLEVBQUcsU0FBUyxDQUFBLEVBQ2pCLElBQUksRUFBRyxTQUFTLENBQUEsRUFDSixHQUFHLEVBQUUsRUFDVTtJQUM3QixJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUU7UUFDaEIsT0FBTztJQUNULENBQUM7SUFDRCxJQUFJLFdBQVcsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDbkQsTUFBTSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBQ0QsSUFBSSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQzlELE9BQU87SUFDVCxDQUFDO0lBQ0QsSUFBSSxPQUFPLEFBQUM7SUFDWixJQUFJO1FBQ0YsT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsRUFBRSxPQUFPLEdBQUcsRUFBRTtRQUNaLE1BQU0scUJBQXFCLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFDRCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBRTtRQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQztRQUMzQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQUFBQztRQUVsQyxJQUFJLEVBQUUsU0FBUyxDQUFBLEVBQUUsV0FBVyxDQUFBLEVBQUUsR0FBRyxLQUFLLEFBQUM7UUFFdkMsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLENBQUMsY0FBYyxFQUFFLFNBQVM7WUFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0Isa0VBQWtFO1lBQ2xFLG9FQUFvRTtZQUNwRSxpRUFBaUU7WUFDakUsQ0FBQyxFQUFFLFNBQVMsQ0FBQSxFQUFFLFdBQVcsQ0FBQSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxJQUFJLFNBQVMsSUFBSSxXQUFXLEVBQUU7WUFDNUIsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFO2dCQUNwQixRQUFRLEVBQUUsUUFBUSxHQUFHLENBQUM7Z0JBQ3RCLFlBQVk7Z0JBQ1osV0FBVztnQkFDWCxjQUFjO2dCQUNkLElBQUk7Z0JBQ0osS0FBSztnQkFDTCxJQUFJO2FBQ0wsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxJQUFJLFlBQVksSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDM0QsTUFBTTtnQkFBRSxJQUFJO2dCQUFFLEdBQUcsS0FBSzthQUFFLENBQUM7UUFDM0IsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDIn0=