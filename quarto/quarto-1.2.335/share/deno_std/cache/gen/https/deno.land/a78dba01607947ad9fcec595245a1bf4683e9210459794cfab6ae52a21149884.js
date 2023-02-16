// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { copy as copyBytes } from "../bytes/mod.ts";
import { assert } from "../testing/asserts.ts";
const DEFAULT_BUFFER_SIZE = 32 * 1024;
/**
 * Read a range of bytes from a file or other resource that is readable and
 * seekable.  The range start and end are inclusive of the bytes within that
 * range.
 *
 * ```ts
 * import { assertEquals } from "../testing/asserts.ts";
 * import { readRange } from "./files.ts";
 *
 * // Read the first 10 bytes of a file
 * const file = await Deno.open("example.txt", { read: true });
 * const bytes = await readRange(file, { start: 0, end: 9 });
 * assertEquals(bytes.length, 10);
 * ```
 */ export async function readRange(r, range) {
    // byte ranges are inclusive, so we have to add one to the end
    let length = range.end - range.start + 1;
    assert(length > 0, "Invalid byte range was passed.");
    await r.seek(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = await r.read(p);
        assert(nread !== null, "Unexpected EOF reach while reading a range.");
        assert(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copyBytes(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
/**
 * Read a range of bytes synchronously from a file or other resource that is
 * readable and seekable.  The range start and end are inclusive of the bytes
 * within that range.
 *
 * ```ts
 * import { assertEquals } from "../testing/asserts.ts";
 * import { readRangeSync } from "./files.ts";
 *
 * // Read the first 10 bytes of a file
 * const file = Deno.openSync("example.txt", { read: true });
 * const bytes = readRangeSync(file, { start: 0, end: 9 });
 * assertEquals(bytes.length, 10);
 * ```
 */ export function readRangeSync(r, range) {
    // byte ranges are inclusive, so we have to add one to the end
    let length = range.end - range.start + 1;
    assert(length > 0, "Invalid byte range was passed.");
    r.seekSync(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = r.readSync(p);
        assert(nread !== null, "Unexpected EOF reach while reading a range.");
        assert(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copyBytes(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2lvL2ZpbGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IGNvcHkgYXMgY29weUJ5dGVzIH0gZnJvbSBcIi4uL2J5dGVzL21vZC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuXG5jb25zdCBERUZBVUxUX0JVRkZFUl9TSVpFID0gMzIgKiAxMDI0O1xuXG5leHBvcnQgaW50ZXJmYWNlIEJ5dGVSYW5nZSB7XG4gIC8qKiBUaGUgMCBiYXNlZCBpbmRleCBvZiB0aGUgc3RhcnQgYnl0ZSBmb3IgYSByYW5nZS4gKi9cbiAgc3RhcnQ6IG51bWJlcjtcblxuICAvKiogVGhlIDAgYmFzZWQgaW5kZXggb2YgdGhlIGVuZCBieXRlIGZvciBhIHJhbmdlLCB3aGljaCBpcyBpbmNsdXNpdmUuICovXG4gIGVuZDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlYWQgYSByYW5nZSBvZiBieXRlcyBmcm9tIGEgZmlsZSBvciBvdGhlciByZXNvdXJjZSB0aGF0IGlzIHJlYWRhYmxlIGFuZFxuICogc2Vla2FibGUuICBUaGUgcmFuZ2Ugc3RhcnQgYW5kIGVuZCBhcmUgaW5jbHVzaXZlIG9mIHRoZSBieXRlcyB3aXRoaW4gdGhhdFxuICogcmFuZ2UuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCIuLi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRSYW5nZSB9IGZyb20gXCIuL2ZpbGVzLnRzXCI7XG4gKlxuICogLy8gUmVhZCB0aGUgZmlyc3QgMTAgYnl0ZXMgb2YgYSBmaWxlXG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwiZXhhbXBsZS50eHRcIiwgeyByZWFkOiB0cnVlIH0pO1xuICogY29uc3QgYnl0ZXMgPSBhd2FpdCByZWFkUmFuZ2UoZmlsZSwgeyBzdGFydDogMCwgZW5kOiA5IH0pO1xuICogYXNzZXJ0RXF1YWxzKGJ5dGVzLmxlbmd0aCwgMTApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmFuZ2UoXG4gIHI6IERlbm8uUmVhZGVyICYgRGVuby5TZWVrZXIsXG4gIHJhbmdlOiBCeXRlUmFuZ2UsXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgLy8gYnl0ZSByYW5nZXMgYXJlIGluY2x1c2l2ZSwgc28gd2UgaGF2ZSB0byBhZGQgb25lIHRvIHRoZSBlbmRcbiAgbGV0IGxlbmd0aCA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0ICsgMTtcbiAgYXNzZXJ0KGxlbmd0aCA+IDAsIFwiSW52YWxpZCBieXRlIHJhbmdlIHdhcyBwYXNzZWQuXCIpO1xuICBhd2FpdCByLnNlZWsocmFuZ2Uuc3RhcnQsIERlbm8uU2Vla01vZGUuU3RhcnQpO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICBsZXQgb2ZmID0gMDtcbiAgd2hpbGUgKGxlbmd0aCkge1xuICAgIGNvbnN0IHAgPSBuZXcgVWludDhBcnJheShNYXRoLm1pbihsZW5ndGgsIERFRkFVTFRfQlVGRkVSX1NJWkUpKTtcbiAgICBjb25zdCBucmVhZCA9IGF3YWl0IHIucmVhZChwKTtcbiAgICBhc3NlcnQobnJlYWQgIT09IG51bGwsIFwiVW5leHBlY3RlZCBFT0YgcmVhY2ggd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBhc3NlcnQobnJlYWQgPiAwLCBcIlVuZXhwZWN0ZWQgcmVhZCBvZiAwIGJ5dGVzIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgY29weUJ5dGVzKHAsIHJlc3VsdCwgb2ZmKTtcbiAgICBvZmYgKz0gbnJlYWQ7XG4gICAgbGVuZ3RoIC09IG5yZWFkO1xuICAgIGFzc2VydChsZW5ndGggPj0gMCwgXCJVbmV4cGVjdGVkIGxlbmd0aCByZW1haW5pbmcgYWZ0ZXIgcmVhZGluZyByYW5nZS5cIik7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWFkIGEgcmFuZ2Ugb2YgYnl0ZXMgc3luY2hyb25vdXNseSBmcm9tIGEgZmlsZSBvciBvdGhlciByZXNvdXJjZSB0aGF0IGlzXG4gKiByZWFkYWJsZSBhbmQgc2Vla2FibGUuICBUaGUgcmFuZ2Ugc3RhcnQgYW5kIGVuZCBhcmUgaW5jbHVzaXZlIG9mIHRoZSBieXRlc1xuICogd2l0aGluIHRoYXQgcmFuZ2UuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCIuLi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRSYW5nZVN5bmMgfSBmcm9tIFwiLi9maWxlcy50c1wiO1xuICpcbiAqIC8vIFJlYWQgdGhlIGZpcnN0IDEwIGJ5dGVzIG9mIGEgZmlsZVxuICogY29uc3QgZmlsZSA9IERlbm8ub3BlblN5bmMoXCJleGFtcGxlLnR4dFwiLCB7IHJlYWQ6IHRydWUgfSk7XG4gKiBjb25zdCBieXRlcyA9IHJlYWRSYW5nZVN5bmMoZmlsZSwgeyBzdGFydDogMCwgZW5kOiA5IH0pO1xuICogYXNzZXJ0RXF1YWxzKGJ5dGVzLmxlbmd0aCwgMTApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUmFuZ2VTeW5jKFxuICByOiBEZW5vLlJlYWRlclN5bmMgJiBEZW5vLlNlZWtlclN5bmMsXG4gIHJhbmdlOiBCeXRlUmFuZ2UsXG4pOiBVaW50OEFycmF5IHtcbiAgLy8gYnl0ZSByYW5nZXMgYXJlIGluY2x1c2l2ZSwgc28gd2UgaGF2ZSB0byBhZGQgb25lIHRvIHRoZSBlbmRcbiAgbGV0IGxlbmd0aCA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0ICsgMTtcbiAgYXNzZXJ0KGxlbmd0aCA+IDAsIFwiSW52YWxpZCBieXRlIHJhbmdlIHdhcyBwYXNzZWQuXCIpO1xuICByLnNlZWtTeW5jKHJhbmdlLnN0YXJ0LCBEZW5vLlNlZWtNb2RlLlN0YXJ0KTtcbiAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgbGV0IG9mZiA9IDA7XG4gIHdoaWxlIChsZW5ndGgpIHtcbiAgICBjb25zdCBwID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5taW4obGVuZ3RoLCBERUZBVUxUX0JVRkZFUl9TSVpFKSk7XG4gICAgY29uc3QgbnJlYWQgPSByLnJlYWRTeW5jKHApO1xuICAgIGFzc2VydChucmVhZCAhPT0gbnVsbCwgXCJVbmV4cGVjdGVkIEVPRiByZWFjaCB3aGlsZSByZWFkaW5nIGEgcmFuZ2UuXCIpO1xuICAgIGFzc2VydChucmVhZCA+IDAsIFwiVW5leHBlY3RlZCByZWFkIG9mIDAgYnl0ZXMgd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBjb3B5Qnl0ZXMocCwgcmVzdWx0LCBvZmYpO1xuICAgIG9mZiArPSBucmVhZDtcbiAgICBsZW5ndGggLT0gbnJlYWQ7XG4gICAgYXNzZXJ0KGxlbmd0aCA+PSAwLCBcIlVuZXhwZWN0ZWQgbGVuZ3RoIHJlbWFpbmluZyBhZnRlciByZWFkaW5nIHJhbmdlLlwiKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLElBQUksSUFBSSxTQUFTLFFBQVEsaUJBQWlCLENBQUM7QUFDcEQsU0FBUyxNQUFNLFFBQVEsdUJBQXVCLENBQUM7QUFFL0MsTUFBTSxtQkFBbUIsR0FBRyxFQUFFLEdBQUcsSUFBSSxBQUFDO0FBVXRDOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxlQUFlLFNBQVMsQ0FDN0IsQ0FBNEIsRUFDNUIsS0FBZ0IsRUFDSztJQUNyQiw4REFBOEQ7SUFDOUQsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQUFBQztJQUN6QyxNQUFNLENB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