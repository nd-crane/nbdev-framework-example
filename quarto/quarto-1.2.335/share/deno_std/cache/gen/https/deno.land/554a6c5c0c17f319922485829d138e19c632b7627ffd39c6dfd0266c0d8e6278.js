// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assert } from "../_util/assert.ts";
import { copy } from "../bytes/mod.ts";
const MAX_SIZE = 2 ** 32 - 2;
const DEFAULT_CHUNK_SIZE = 16_640;
/** A variable-sized buffer of bytes with `read()` and `write()` methods.
 *
 * Buffer is almost always used with some I/O like files and sockets. It allows
 * one to buffer up a download from a socket. Buffer grows and shrinks as
 * necessary.
 *
 * Buffer is NOT the same thing as Node's Buffer. Node's Buffer was created in
 * 2009 before JavaScript had the concept of ArrayBuffers. It's simply a
 * non-standard ArrayBuffer.
 *
 * ArrayBuffer is a fixed memory allocation. Buffer is implemented on top of
 * ArrayBuffer.
 *
 * Based on [Go Buffer](https://golang.org/pkg/bytes/#Buffer). */ export class Buffer {
    #buf;
    #off = 0;
    #readable = new ReadableStream({
        type: "bytes",
        pull: (controller)=>{
            const view = new Uint8Array(controller.byobRequest.view.buffer);
            if (this.empty()) {
                // Buffer is empty, reset to recover space.
                this.reset();
                controller.close();
                controller.byobRequest.respond(0);
                return;
            }
            const nread = copy(this.#buf.subarray(this.#off), view);
            this.#off += nread;
            controller.byobRequest.respond(nread);
        },
        autoAllocateChunkSize: DEFAULT_CHUNK_SIZE
    });
    get readable() {
        return this.#readable;
    }
    #writable = new WritableStream({
        write: (chunk)=>{
            const m = this.#grow(chunk.byteLength);
            copy(chunk, this.#buf, m);
        }
    });
    get writable() {
        return this.#writable;
    }
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    /** Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method like `read()`, `write()`,
   * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
   * least until the next buffer modification, so immediate changes to the
   * slice will affect the result of future reads.
   * @param options Defaults to `{ copy: true }`
   */ bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    /** Returns whether the unread portion of the buffer is empty. */ empty() {
        return this.#buf.byteLength <= this.#off;
    }
    /** A read only number of bytes of the unread portion of the buffer. */ get length() {
        return this.#buf.byteLength - this.#off;
    }
    /** The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data. */ get capacity() {
        return this.#buf.buffer.byteLength;
    }
    /** Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer. */ truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
    #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
    #reslice(len) {
        assert(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
    #grow(n1) {
        const m = this.length;
        // If buffer is empty, reset to recover space.
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        // Fast: Try to grow by means of a reslice.
        const i = this.#tryGrowByReslice(n1);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n1 <= Math.floor(c / 2) - m) {
            // We can slide things down instead of allocating a new
            // ArrayBuffer. We only need m+n <= c to slide, but
            // we instead let capacity get twice as large so we
            // don't spend all our time copying.
            copy(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n1 > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            // Not enough space anywhere, we need to allocate.
            const buf = new Uint8Array(Math.min(2 * c + n1, MAX_SIZE));
            copy(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        // Restore this.#off and len(this.#buf).
        this.#off = 0;
        this.#reslice(Math.min(m + n1, MAX_SIZE));
        return m;
    }
    /** Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.Grow](https://golang.org/pkg/bytes/#Buffer.Grow). */ grow(n) {
        if (n < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n);
        this.#reslice(m);
    }
}
/** A TransformStream that will only read & enqueue `size` amount of bytes.
 * This operation is chunk based and not BYOB based,
 * and as such will read more than needed.
 *
 * if options.error is set, then instead of terminating the stream,
 * an error will be thrown.
 *
 * ```ts
 * import { LimitedBytesTransformStream } from "./buffer.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!
 *   .pipeThrough(new LimitedBytesTransformStream(512 * 1024));
 * ```
 */ export class LimitedBytesTransformStream extends TransformStream {
    #read = 0;
    constructor(size, options = {}){
        super({
            transform: (chunk, controller)=>{
                if (this.#read + chunk.byteLength > size) {
                    if (options.error) {
                        throw new RangeError(`Exceeded byte size limit of '${size}'`);
                    } else {
                        controller.terminate();
                    }
                } else {
                    this.#read += chunk.byteLength;
                    controller.enqueue(chunk);
                }
            }
        });
    }
}
/** A TransformStream that will only read & enqueue `size` amount of chunks.
 *
 * if options.error is set, then instead of terminating the stream,
 * an error will be thrown.
 *
 * ```ts
 * import { LimitedTransformStream } from "./buffer.ts";
 * const res = await fetch("https://example.com");
 * const parts = res.body!.pipeThrough(new LimitedTransformStream(50));
 * ```
 */ export class LimitedTransformStream extends TransformStream {
    #read = 0;
    constructor(size, options = {}){
        super({
            transform: (chunk, controller)=>{
                if (this.#read + 1 > size) {
                    if (options.error) {
                        throw new RangeError(`Exceeded chunk limit of '${size}'`);
                    } else {
                        controller.terminate();
                    }
                } else {
                    this.#read++;
                    controller.enqueue(chunk);
                }
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3N0cmVhbXMvYnVmZmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBjb3B5IH0gZnJvbSBcIi4uL2J5dGVzL21vZC50c1wiO1xuXG5jb25zdCBNQVhfU0laRSA9IDIgKiogMzIgLSAyO1xuY29uc3QgREVGQVVMVF9DSFVOS19TSVpFID0gMTZfNjQwO1xuXG4vKiogQSB2YXJpYWJsZS1zaXplZCBidWZmZXIgb2YgYnl0ZXMgd2l0aCBgcmVhZCgpYCBhbmQgYHdyaXRlKClgIG1ldGhvZHMuXG4gKlxuICogQnVmZmVyIGlzIGFsbW9zdCBhbHdheXMgdXNlZCB3aXRoIHNvbWUgSS9PIGxpa2UgZmlsZXMgYW5kIHNvY2tldHMuIEl0IGFsbG93c1xuICogb25lIHRvIGJ1ZmZlciB1cCBhIGRvd25sb2FkIGZyb20gYSBzb2NrZXQuIEJ1ZmZlciBncm93cyBhbmQgc2hyaW5rcyBhc1xuICogbmVjZXNzYXJ5LlxuICpcbiAqIEJ1ZmZlciBpcyBOT1QgdGhlIHNhbWUgdGhpbmcgYXMgTm9kZSdzIEJ1ZmZlci4gTm9kZSdzIEJ1ZmZlciB3YXMgY3JlYXRlZCBpblxuICogMjAwOSBiZWZvcmUgSmF2YVNjcmlwdCBoYWQgdGhlIGNvbmNlcHQgb2YgQXJyYXlCdWZmZXJzLiBJdCdzIHNpbXBseSBhXG4gKiBub24tc3RhbmRhcmQgQXJyYXlCdWZmZXIuXG4gKlxuICogQXJyYXlCdWZmZXIgaXMgYSBmaXhlZCBtZW1vcnkgYWxsb2NhdGlvbi4gQnVmZmVyIGlzIGltcGxlbWVudGVkIG9uIHRvcCBvZlxuICogQXJyYXlCdWZmZXIuXG4gKlxuICogQmFzZWQgb24gW0dvIEJ1ZmZlcl0oaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyKS4gKi9cbmV4cG9ydCBjbGFzcyBCdWZmZXIge1xuICAjYnVmOiBVaW50OEFycmF5OyAvLyBjb250ZW50cyBhcmUgdGhlIGJ5dGVzIGJ1ZltvZmYgOiBsZW4oYnVmKV1cbiAgI29mZiA9IDA7IC8vIHJlYWQgYXQgYnVmW29mZl0sIHdyaXRlIGF0IGJ1ZltidWYuYnl0ZUxlbmd0aF1cbiAgI3JlYWRhYmxlOiBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PiA9IG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgdHlwZTogXCJieXRlc1wiLFxuICAgIHB1bGw6IChjb250cm9sbGVyKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoY29udHJvbGxlci5ieW9iUmVxdWVzdCEudmlldyEuYnVmZmVyKTtcbiAgICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgICAgLy8gQnVmZmVyIGlzIGVtcHR5LCByZXNldCB0byByZWNvdmVyIHNwYWNlLlxuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgY29udHJvbGxlci5ieW9iUmVxdWVzdCEucmVzcG9uZCgwKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbnJlYWQgPSBjb3B5KHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpLCB2aWV3KTtcbiAgICAgIHRoaXMuI29mZiArPSBucmVhZDtcbiAgICAgIGNvbnRyb2xsZXIuYnlvYlJlcXVlc3QhLnJlc3BvbmQobnJlYWQpO1xuICAgIH0sXG4gICAgYXV0b0FsbG9jYXRlQ2h1bmtTaXplOiBERUZBVUxUX0NIVU5LX1NJWkUsXG4gIH0pO1xuICBnZXQgcmVhZGFibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3JlYWRhYmxlO1xuICB9XG4gICN3cml0YWJsZSA9IG5ldyBXcml0YWJsZVN0cmVhbTxVaW50OEFycmF5Pih7XG4gICAgd3JpdGU6IChjaHVuaykgPT4ge1xuICAgICAgY29uc3QgbSA9IHRoaXMuI2dyb3coY2h1bmsuYnl0ZUxlbmd0aCk7XG4gICAgICBjb3B5KGNodW5rLCB0aGlzLiNidWYsIG0pO1xuICAgIH0sXG4gIH0pO1xuICBnZXQgd3JpdGFibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3dyaXRhYmxlO1xuICB9XG5cbiAgY29uc3RydWN0b3IoYWI/OiBBcnJheUJ1ZmZlckxpa2UgfCBBcnJheUxpa2U8bnVtYmVyPikge1xuICAgIHRoaXMuI2J1ZiA9IGFiID09PSB1bmRlZmluZWQgPyBuZXcgVWludDhBcnJheSgwKSA6IG5ldyBVaW50OEFycmF5KGFiKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgc2xpY2UgaG9sZGluZyB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogVGhlIHNsaWNlIGlzIHZhbGlkIGZvciB1c2Ugb25seSB1bnRpbCB0aGUgbmV4dCBidWZmZXIgbW9kaWZpY2F0aW9uICh0aGF0XG4gICAqIGlzLCBvbmx5IHVudGlsIHRoZSBuZXh0IGNhbGwgdG8gYSBtZXRob2QgbGlrZSBgcmVhZCgpYCwgYHdyaXRlKClgLFxuICAgKiBgcmVzZXQoKWAsIG9yIGB0cnVuY2F0ZSgpYCkuIElmIGBvcHRpb25zLmNvcHlgIGlzIGZhbHNlIHRoZSBzbGljZSBhbGlhc2VzIHRoZSBidWZmZXIgY29udGVudCBhdFxuICAgKiBsZWFzdCB1bnRpbCB0aGUgbmV4dCBidWZmZXIgbW9kaWZpY2F0aW9uLCBzbyBpbW1lZGlhdGUgY2hhbmdlcyB0byB0aGVcbiAgICogc2xpY2Ugd2lsbCBhZmZlY3QgdGhlIHJlc3VsdCBvZiBmdXR1cmUgcmVhZHMuXG4gICAqIEBwYXJhbSBvcHRpb25zIERlZmF1bHRzIHRvIGB7IGNvcHk6IHRydWUgfWBcbiAgICovXG4gIGJ5dGVzKG9wdGlvbnMgPSB7IGNvcHk6IHRydWUgfSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmIChvcHRpb25zLmNvcHkgPT09IGZhbHNlKSByZXR1cm4gdGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZik7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5zbGljZSh0aGlzLiNvZmYpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgd2hldGhlciB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlciBpcyBlbXB0eS4gKi9cbiAgZW1wdHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5ieXRlTGVuZ3RoIDw9IHRoaXMuI29mZjtcbiAgfVxuXG4gIC8qKiBBIHJlYWQgb25seSBudW1iZXIgb2YgYnl0ZXMgb2YgdGhlIHVucmVhZCBwb3J0aW9uIG9mIHRoZSBidWZmZXIuICovXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ5dGVMZW5ndGggLSB0aGlzLiNvZmY7XG4gIH1cblxuICAvKiogVGhlIHJlYWQgb25seSBjYXBhY2l0eSBvZiB0aGUgYnVmZmVyJ3MgdW5kZXJseWluZyBieXRlIHNsaWNlLCB0aGF0IGlzLFxuICAgKiB0aGUgdG90YWwgc3BhY2UgYWxsb2NhdGVkIGZvciB0aGUgYnVmZmVyJ3MgZGF0YS4gKi9cbiAgZ2V0IGNhcGFjaXR5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5idWZmZXIuYnl0ZUxlbmd0aDtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbGwgYnV0IHRoZSBmaXJzdCBgbmAgdW5yZWFkIGJ5dGVzIGZyb20gdGhlIGJ1ZmZlciBidXRcbiAgICogY29udGludWVzIHRvIHVzZSB0aGUgc2FtZSBhbGxvY2F0ZWQgc3RvcmFnZS4gSXQgdGhyb3dzIGlmIGBuYCBpc1xuICAgKiBuZWdhdGl2ZSBvciBncmVhdGVyIHRoYW4gdGhlIGxlbmd0aCBvZiB0aGUgYnVmZmVyLiAqL1xuICB0cnVuY2F0ZShuOiBudW1iZXIpIHtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobiA8IDAgfHwgbiA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcihcImJ5dGVzLkJ1ZmZlcjogdHJ1bmNhdGlvbiBvdXQgb2YgcmFuZ2VcIik7XG4gICAgfVxuICAgIHRoaXMuI3Jlc2xpY2UodGhpcy4jb2ZmICsgbik7XG4gIH1cblxuICByZXNldCgpIHtcbiAgICB0aGlzLiNyZXNsaWNlKDApO1xuICAgIHRoaXMuI29mZiA9IDA7XG4gIH1cblxuICAjdHJ5R3Jvd0J5UmVzbGljZShuOiBudW1iZXIpIHtcbiAgICBjb25zdCBsID0gdGhpcy4jYnVmLmJ5dGVMZW5ndGg7XG4gICAgaWYgKG4gPD0gdGhpcy5jYXBhY2l0eSAtIGwpIHtcbiAgICAgIHRoaXMuI3Jlc2xpY2UobCArIG4pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gICNyZXNsaWNlKGxlbjogbnVtYmVyKSB7XG4gICAgYXNzZXJ0KGxlbiA8PSB0aGlzLiNidWYuYnVmZmVyLmJ5dGVMZW5ndGgpO1xuICAgIHRoaXMuI2J1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuI2J1Zi5idWZmZXIsIDAsIGxlbik7XG4gIH1cblxuICAjZ3JvdyhuOiBudW1iZXIpIHtcbiAgICBjb25zdCBtID0gdGhpcy5sZW5ndGg7XG4gICAgLy8gSWYgYnVmZmVyIGlzIGVtcHR5LCByZXNldCB0byByZWNvdmVyIHNwYWNlLlxuICAgIGlmIChtID09PSAwICYmIHRoaXMuI29mZiAhPT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgICAvLyBGYXN0OiBUcnkgdG8gZ3JvdyBieSBtZWFucyBvZiBhIHJlc2xpY2UuXG4gICAgY29uc3QgaSA9IHRoaXMuI3RyeUdyb3dCeVJlc2xpY2Uobik7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0aGlzLmNhcGFjaXR5O1xuICAgIGlmIChuIDw9IE1hdGguZmxvb3IoYyAvIDIpIC0gbSkge1xuICAgICAgLy8gV2UgY2FuIHNsaWRlIHRoaW5ncyBkb3duIGluc3RlYWQgb2YgYWxsb2NhdGluZyBhIG5ld1xuICAgICAgLy8gQXJyYXlCdWZmZXIuIFdlIG9ubHkgbmVlZCBtK24gPD0gYyB0byBzbGlkZSwgYnV0XG4gICAgICAvLyB3ZSBpbnN0ZWFkIGxldCBjYXBhY2l0eSBnZXQgdHdpY2UgYXMgbGFyZ2Ugc28gd2VcbiAgICAgIC8vIGRvbid0IHNwZW5kIGFsbCBvdXIgdGltZSBjb3B5aW5nLlxuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgdGhpcy4jYnVmKTtcbiAgICB9IGVsc2UgaWYgKGMgKyBuID4gTUFYX1NJWkUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBidWZmZXIgY2Fubm90IGJlIGdyb3duIGJleW9uZCB0aGUgbWF4aW11bSBzaXplLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm90IGVub3VnaCBzcGFjZSBhbnl3aGVyZSwgd2UgbmVlZCB0byBhbGxvY2F0ZS5cbiAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OEFycmF5KE1hdGgubWluKDIgKiBjICsgbiwgTUFYX1NJWkUpKTtcbiAgICAgIGNvcHkodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZiksIGJ1Zik7XG4gICAgICB0aGlzLiNidWYgPSBidWY7XG4gICAgfVxuICAgIC8vIFJlc3RvcmUgdGhpcy4jb2ZmIGFuZCBsZW4odGhpcy4jYnVmKS5cbiAgICB0aGlzLiNvZmYgPSAwO1xuICAgIHRoaXMuI3Jlc2xpY2UoTWF0aC5taW4obSArIG4sIE1BWF9TSVpFKSk7XG4gICAgcmV0dXJuIG07XG4gIH1cblxuICAvKiogR3Jvd3MgdGhlIGJ1ZmZlcidzIGNhcGFjaXR5LCBpZiBuZWNlc3NhcnksIHRvIGd1YXJhbnRlZSBzcGFjZSBmb3JcbiAgICogYW5vdGhlciBgbmAgYnl0ZXMuIEFmdGVyIGAuZ3JvdyhuKWAsIGF0IGxlYXN0IGBuYCBieXRlcyBjYW4gYmUgd3JpdHRlbiB0b1xuICAgKiB0aGUgYnVmZmVyIHdpdGhvdXQgYW5vdGhlciBhbGxvY2F0aW9uLiBJZiBgbmAgaXMgbmVnYXRpdmUsIGAuZ3JvdygpYCB3aWxsXG4gICAqIHRocm93LiBJZiB0aGUgYnVmZmVyIGNhbid0IGdyb3cgaXQgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIFtCdWZmZXIuR3Jvd10oaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyLkdyb3cpLiAqL1xuICBncm93KG46IG51bWJlcikge1xuICAgIGlmIChuIDwgMCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJCdWZmZXIuZ3JvdzogbmVnYXRpdmUgY291bnRcIik7XG4gICAgfVxuICAgIGNvbnN0IG0gPSB0aGlzLiNncm93KG4pO1xuICAgIHRoaXMuI3Jlc2xpY2UobSk7XG4gIH1cbn1cblxuLyoqIEEgVHJhbnNmb3JtU3RyZWFtIHRoYXQgd2lsbCBvbmx5IHJlYWQgJiBlbnF1ZXVlIGBzaXplYCBhbW91bnQgb2YgYnl0ZXMuXG4gKiBUaGlzIG9wZXJhdGlvbiBpcyBjaHVuayBiYXNlZCBhbmQgbm90IEJZT0IgYmFzZWQsXG4gKiBhbmQgYXMgc3VjaCB3aWxsIHJlYWQgbW9yZSB0aGFuIG5lZWRlZC5cbiAqXG4gKiBpZiBvcHRpb25zLmVycm9yIGlzIHNldCwgdGhlbiBpbnN0ZWFkIG9mIHRlcm1pbmF0aW5nIHRoZSBzdHJlYW0sXG4gKiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgTGltaXRlZEJ5dGVzVHJhbnNmb3JtU3RyZWFtIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCBwYXJ0cyA9IHJlcy5ib2R5IVxuICogICAucGlwZVRocm91Z2gobmV3IExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbSg1MTIgKiAxMDI0KSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbVxuICBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxVaW50OEFycmF5LCBVaW50OEFycmF5PiB7XG4gICNyZWFkID0gMDtcbiAgY29uc3RydWN0b3Ioc2l6ZTogbnVtYmVyLCBvcHRpb25zOiB7IGVycm9yPzogYm9vbGVhbiB9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICB0cmFuc2Zvcm06IChjaHVuaywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICBpZiAoKHRoaXMuI3JlYWQgKyBjaHVuay5ieXRlTGVuZ3RoKSA+IHNpemUpIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYEV4Y2VlZGVkIGJ5dGUgc2l6ZSBsaW1pdCBvZiAnJHtzaXplfSdgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udHJvbGxlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jcmVhZCArPSBjaHVuay5ieXRlTGVuZ3RoO1xuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuayk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqIEEgVHJhbnNmb3JtU3RyZWFtIHRoYXQgd2lsbCBvbmx5IHJlYWQgJiBlbnF1ZXVlIGBzaXplYCBhbW91bnQgb2YgY2h1bmtzLlxuICpcbiAqIGlmIG9wdGlvbnMuZXJyb3IgaXMgc2V0LCB0aGVuIGluc3RlYWQgb2YgdGVybWluYXRpbmcgdGhlIHN0cmVhbSxcbiAqIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBMaW1pdGVkVHJhbnNmb3JtU3RyZWFtIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCBwYXJ0cyA9IHJlcy5ib2R5IS5waXBlVGhyb3VnaChuZXcgTGltaXRlZFRyYW5zZm9ybVN0cmVhbSg1MCkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBMaW1pdGVkVHJhbnNmb3JtU3RyZWFtPFQ+IGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPFQsIFQ+IHtcbiAgI3JlYWQgPSAwO1xuICBjb25zdHJ1Y3RvcihzaXplOiBudW1iZXIsIG9wdGlvbnM6IHsgZXJyb3I/OiBib29sZWFuIH0gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIHRyYW5zZm9ybTogKGNodW5rLCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIGlmICgodGhpcy4jcmVhZCArIDEpID4gc2l6ZSkge1xuICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgRXhjZWVkZWQgY2h1bmsgbGltaXQgb2YgJyR7c2l6ZX0nYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuI3JlYWQrKztcbiAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmspO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMsTUFBTSxRQUFRLG9CQUFvQixDQUFDO0FBQzVDLFNBQVMsSUFBSSxRQUFRLGlCQUFpQixDQUFDO0FBRXZDLE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxBQUFDO0FBQzdCLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxBQUFDO0FBRWxDOzs7Ozs7Ozs7Ozs7OytEQWErRCxHQUMvRCxPQUFPLE1BQU0sTUFBTTtJQUNqQixDQUFDLEdBQUcs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