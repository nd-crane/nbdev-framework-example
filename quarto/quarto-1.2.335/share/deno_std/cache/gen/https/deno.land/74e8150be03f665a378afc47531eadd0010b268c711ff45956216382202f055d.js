// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../io/buffer.ts";
const DEFAULT_CHUNK_SIZE = 16_640;
const DEFAULT_BUFFER_SIZE = 32 * 1024;
function isCloser(value) {
    return typeof value === "object" && value != null && "close" in value && // deno-lint-ignore no-explicit-any
    typeof value["close"] === "function";
}
/** Create a `Deno.Reader` from an iterable of `Uint8Array`s.
 *
 * ```ts
 *      import { readerFromIterable, copy } from "./conversion.ts";
 *
 *      const file = await Deno.open("metrics.txt", { write: true });
 *      const reader = readerFromIterable((async function* () {
 *        while (true) {
 *          await new Promise((r) => setTimeout(r, 1000));
 *          const message = `data: ${JSON.stringify(Deno.metrics())}\n\n`;
 *          yield new TextEncoder().encode(message);
 *        }
 *      })());
 *      await copy(reader, file);
 * ```
 */ export function readerFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
    const buffer = new Buffer();
    return {
        async read (p) {
            if (buffer.length == 0) {
                const result = await iterator.next();
                if (result.done) {
                    return null;
                } else {
                    if (result.value.byteLength <= p.byteLength) {
                        p.set(result.value);
                        return result.value.byteLength;
                    }
                    p.set(result.value.subarray(0, p.byteLength));
                    await writeAll(buffer, result.value.subarray(p.byteLength));
                    return p.byteLength;
                }
            } else {
                const n = await buffer.read(p);
                if (n == null) {
                    return this.read(p);
                }
                return n;
            }
        }
    };
}
/** Create a `Writer` from a `WritableStreamDefaultWriter`. */ export function writerFromStreamWriter(streamWriter) {
    return {
        async write (p) {
            await streamWriter.ready;
            await streamWriter.write(p);
            return p.length;
        }
    };
}
/** Create a `Reader` from a `ReadableStreamDefaultReader`. */ export function readerFromStreamReader(streamReader) {
    const buffer = new Buffer();
    return {
        async read (p) {
            if (buffer.empty()) {
                const res = await streamReader.read();
                if (res.done) {
                    return null; // EOF
                }
                await writeAll(buffer, res.value);
            }
            return buffer.read(p);
        }
    };
}
/** Create a `WritableStream` from a `Writer`. */ export function writableStreamFromWriter(writer, options = {}) {
    const { autoClose =true  } = options;
    return new WritableStream({
        async write (chunk, controller) {
            try {
                await writeAll(writer, chunk);
            } catch (e) {
                controller.error(e);
                if (isCloser(writer) && autoClose) {
                    writer.close();
                }
            }
        },
        close () {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        },
        abort () {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        }
    });
}
/** Create a `ReadableStream` from any kind of iterable.
 *
 * ```ts
 *      import { readableStreamFromIterable } from "./conversion.ts";
 *
 *      const r1 = readableStreamFromIterable(["foo, bar, baz"]);
 *      const r2 = readableStreamFromIterable(async function* () {
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "foo";
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "bar";
 *        await new Promise(((r) => setTimeout(r, 1000)));
 *        yield "baz";
 *      }());
 * ```
 *
 * If the produced iterator (`iterable[Symbol.asyncIterator]()` or
 * `iterable[Symbol.iterator]()`) is a generator, or more specifically is found
 * to have a `.throw()` method on it, that will be called upon
 * `readableStream.cancel()`. This is the case for the second input type above:
 *
 * ```ts
 * import { readableStreamFromIterable } from "./conversion.ts";
 *
 * const r3 = readableStreamFromIterable(async function* () {
 *   try {
 *     yield "foo";
 *   } catch (error) {
 *     console.log(error); // Error: Cancelled by consumer.
 *   }
 * }());
 * const reader = r3.getReader();
 * console.log(await reader.read()); // { value: "foo", done: false }
 * await reader.cancel(new Error("Cancelled by consumer."));
 * ```
 */ export function readableStreamFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
    return new ReadableStream({
        async pull (controller) {
            const { value , done  } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        },
        async cancel (reason) {
            if (typeof iterator.throw == "function") {
                try {
                    await iterator.throw(reason);
                } catch  {}
            }
        }
    });
}
/**
 * Convert the generator function into a TransformStream.
 *
 * ```ts
 * import { readableStreamFromIterable, toTransformStream } from "./conversion.ts";
 *
 * const readable = readableStreamFromIterable([0, 1, 2])
 *   .pipeThrough(toTransformStream(async function* (src) {
 *     for await (const chunk of src) {
 *       yield chunk * 100;
 *     }
 *   }));
 *
 * for await (const chunk of readable) {
 *   console.log(chunk);
 * }
 * // output: 0, 100, 200
 * ```
 *
 * @param transformer A function to transform.
 * @param writableStrategy An object that optionally defines a queuing strategy for the stream.
 * @param readableStrategy An object that optionally defines a queuing strategy for the stream.
 */ export function toTransformStream(transformer, writableStrategy, readableStrategy) {
    const { writable , readable ,  } = new TransformStream(undefined, writableStrategy);
    const iterable = transformer(readable);
    const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
    return {
        writable,
        readable: new ReadableStream({
            async pull (controller) {
                let result;
                try {
                    result = await iterator.next();
                } catch (error) {
                    // Propagate error to stream from iterator
                    // If the stream status is "errored", it will be thrown, but ignore.
                    await readable.cancel(error).catch(()=>{});
                    controller.error(error);
                    return;
                }
                if (result.done) {
                    controller.close();
                    return;
                }
                controller.enqueue(result.value);
            },
            async cancel (reason) {
                // Propagate cancellation to readable and iterator
                if (typeof iterator.throw == "function") {
                    try {
                        await iterator.throw(reason);
                    } catch  {
                    /* `iterator.throw()` always throws on site. We catch it. */ }
                }
                await readable.cancel(reason);
            }
        }, readableStrategy)
    };
}
/**
 * Create a `ReadableStream<Uint8Array>` from from a `Deno.Reader`.
 *
 * When the pull algorithm is called on the stream, a chunk from the reader
 * will be read.  When `null` is returned from the reader, the stream will be
 * closed along with the reader (if it is also a `Deno.Closer`).
 *
 * An example converting a `Deno.FsFile` into a readable stream:
 *
 * ```ts
 * import { readableStreamFromReader } from "./mod.ts";
 *
 * const file = await Deno.open("./file.txt", { read: true });
 * const fileStream = readableStreamFromReader(file);
 * ```
 */ export function readableStreamFromReader(reader, options = {}) {
    const { autoClose =true , chunkSize =DEFAULT_CHUNK_SIZE , strategy ,  } = options;
    return new ReadableStream({
        async pull (controller) {
            const chunk = new Uint8Array(chunkSize);
            try {
                const read = await reader.read(chunk);
                if (read === null) {
                    if (isCloser(reader) && autoClose) {
                        reader.close();
                    }
                    controller.close();
                    return;
                }
                controller.enqueue(chunk.subarray(0, read));
            } catch (e) {
                controller.error(e);
                if (isCloser(reader)) {
                    reader.close();
                }
            }
        },
        cancel () {
            if (isCloser(reader) && autoClose) {
                reader.close();
            }
        }
    }, strategy);
}
/** Read Reader `r` until EOF (`null`) and resolve to the content as
 * Uint8Array`.
 *
 * ```ts
 * import { Buffer } from "../io/buffer.ts";
 * import { readAll } from "./conversion.ts";
 *
 * // Example from stdin
 * const stdinContent = await readAll(Deno.stdin);
 *
 * // Example from file
 * const file = await Deno.open("my_file.txt", {read: true});
 * const myFileContent = await readAll(file);
 * Deno.close(file.rid);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer);
 * const bufferContent = await readAll(reader);
 * ```
 */ export async function readAll(r) {
    const buf = new Buffer();
    await buf.readFrom(r);
    return buf.bytes();
}
/** Synchronously reads Reader `r` until EOF (`null`) and returns the content
 * as `Uint8Array`.
 *
 * ```ts
 * import { Buffer } from "../io/buffer.ts";
 * import { readAllSync } from "./conversion.ts";
 *
 * // Example from stdin
 * const stdinContent = readAllSync(Deno.stdin);
 *
 * // Example from file
 * const file = Deno.openSync("my_file.txt", {read: true});
 * const myFileContent = readAllSync(file);
 * Deno.close(file.rid);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer);
 * const bufferContent = readAllSync(reader);
 * ```
 */ export function readAllSync(r) {
    const buf = new Buffer();
    buf.readFromSync(r);
    return buf.bytes();
}
/** Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * ```ts
 * import { Buffer } from "../io/buffer.ts";
 * import { writeAll } from "./conversion.ts";

 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * const file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * await writeAll(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */ export async function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += await w.write(arr.subarray(nwritten));
    }
}
/** Synchronously write all the content of the array buffer (`arr`) to the
 * writer (`w`).
 *
 * ```ts
 * import { Buffer } from "../io/buffer.ts";
 * import { writeAllSync } from "./conversion.ts";
 *
 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * const file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * writeAllSync(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */ export function writeAllSync(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.writeSync(arr.subarray(nwritten));
    }
}
/** Turns a Reader, `r`, into an async iterator.
 *
 * ```ts
 * import { iterateReader } from "./conversion.ts";
 *
 * let f = await Deno.open("/etc/passwd");
 * for await (const chunk of iterateReader(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * import { iterateReader } from "./conversion.ts";
 *
 * let f = await Deno.open("/etc/passwd");
 * const it = iterateReader(f, {
 *   bufSize: 1024 * 1024
 * });
 * for await (const chunk of it) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */ export async function* iterateReader(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = await r.read(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
/** Turns a ReaderSync, `r`, into an iterator.
 *
 * ```ts
 * import { iterateReaderSync } from "./conversion.ts";
 *
 * let f = Deno.openSync("/etc/passwd");
 * for (const chunk of iterateReaderSync(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * import { iterateReaderSync } from "./conversion.ts";

 * let f = await Deno.open("/etc/passwd");
 * const iter = iterateReaderSync(f, {
 *   bufSize: 1024 * 1024
 * });
 * for (const chunk of iter) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */ export function* iterateReaderSync(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = r.readSync(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
/** Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
 * an error occurs. It resolves to the number of bytes copied or rejects with
 * the first error encountered while copying.
 *
 * ```ts
 * import { copy } from "./conversion.ts";
 *
 * const source = await Deno.open("my_file.txt");
 * const bytesCopied1 = await copy(source, Deno.stdout);
 * const destination = await Deno.create("my_file_2.txt");
 * const bytesCopied2 = await copy(source, destination);
 * ```
 *
 * @param src The source to copy from
 * @param dst The destination to copy to
 * @param options Can be used to tune size of the buffer. Default size is 32kB
 */ export async function copy(src, dst, options) {
    let n = 0;
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    let gotEOF = false;
    while(gotEOF === false){
        const result = await src.read(b);
        if (result === null) {
            gotEOF = true;
        } else {
            let nwritten = 0;
            while(nwritten < result){
                nwritten += await dst.write(b.subarray(nwritten, result));
            }
            n += nwritten;
        }
    }
    return n;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3N0cmVhbXMvY29udmVyc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi4vaW8vYnVmZmVyLnRzXCI7XG5cbmNvbnN0IERFRkFVTFRfQ0hVTktfU0laRSA9IDE2XzY0MDtcbmNvbnN0IERFRkFVTFRfQlVGRkVSX1NJWkUgPSAzMiAqIDEwMjQ7XG5cbmZ1bmN0aW9uIGlzQ2xvc2VyKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgRGVuby5DbG9zZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9IG51bGwgJiYgXCJjbG9zZVwiIGluIHZhbHVlICYmXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB0eXBlb2YgKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pW1wiY2xvc2VcIl0gPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuLyoqIENyZWF0ZSBhIGBEZW5vLlJlYWRlcmAgZnJvbSBhbiBpdGVyYWJsZSBvZiBgVWludDhBcnJheWBzLlxuICpcbiAqIGBgYHRzXG4gKiAgICAgIGltcG9ydCB7IHJlYWRlckZyb21JdGVyYWJsZSwgY29weSB9IGZyb20gXCIuL2NvbnZlcnNpb24udHNcIjtcbiAqXG4gKiAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCJtZXRyaWNzLnR4dFwiLCB7IHdyaXRlOiB0cnVlIH0pO1xuICogICAgICBjb25zdCByZWFkZXIgPSByZWFkZXJGcm9tSXRlcmFibGUoKGFzeW5jIGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAqICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcbiAqICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgZGF0YTogJHtKU09OLnN0cmluZ2lmeShEZW5vLm1ldHJpY3MoKSl9XFxuXFxuYDtcbiAqICAgICAgICAgIHlpZWxkIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShtZXNzYWdlKTtcbiAqICAgICAgICB9XG4gKiAgICAgIH0pKCkpO1xuICogICAgICBhd2FpdCBjb3B5KHJlYWRlciwgZmlsZSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRlckZyb21JdGVyYWJsZShcbiAgaXRlcmFibGU6IEl0ZXJhYmxlPFVpbnQ4QXJyYXk+IHwgQXN5bmNJdGVyYWJsZTxVaW50OEFycmF5Pixcbik6IERlbm8uUmVhZGVyIHtcbiAgY29uc3QgaXRlcmF0b3I6IEl0ZXJhdG9yPFVpbnQ4QXJyYXk+IHwgQXN5bmNJdGVyYXRvcjxVaW50OEFycmF5PiA9XG4gICAgKGl0ZXJhYmxlIGFzIEFzeW5jSXRlcmFibGU8VWludDhBcnJheT4pW1N5bWJvbC5hc3luY0l0ZXJhdG9yXT8uKCkgPz9cbiAgICAgIChpdGVyYWJsZSBhcyBJdGVyYWJsZTxVaW50OEFycmF5PilbU3ltYm9sLml0ZXJhdG9yXT8uKCk7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBCdWZmZXIoKTtcbiAgcmV0dXJuIHtcbiAgICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAgIGlmIChidWZmZXIubGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlLmJ5dGVMZW5ndGggPD0gcC5ieXRlTGVuZ3RoKSB7XG4gICAgICAgICAgICBwLnNldChyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC52YWx1ZS5ieXRlTGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwLnNldChyZXN1bHQudmFsdWUuc3ViYXJyYXkoMCwgcC5ieXRlTGVuZ3RoKSk7XG4gICAgICAgICAgYXdhaXQgd3JpdGVBbGwoYnVmZmVyLCByZXN1bHQudmFsdWUuc3ViYXJyYXkocC5ieXRlTGVuZ3RoKSk7XG4gICAgICAgICAgcmV0dXJuIHAuYnl0ZUxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbiA9IGF3YWl0IGJ1ZmZlci5yZWFkKHApO1xuICAgICAgICBpZiAobiA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVhZChwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbjtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuXG4vKiogQ3JlYXRlIGEgYFdyaXRlcmAgZnJvbSBhIGBXcml0YWJsZVN0cmVhbURlZmF1bHRXcml0ZXJgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlckZyb21TdHJlYW1Xcml0ZXIoXG4gIHN0cmVhbVdyaXRlcjogV3JpdGFibGVTdHJlYW1EZWZhdWx0V3JpdGVyPFVpbnQ4QXJyYXk+LFxuKTogRGVuby5Xcml0ZXIge1xuICByZXR1cm4ge1xuICAgIGFzeW5jIHdyaXRlKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgYXdhaXQgc3RyZWFtV3JpdGVyLnJlYWR5O1xuICAgICAgYXdhaXQgc3RyZWFtV3JpdGVyLndyaXRlKHApO1xuICAgICAgcmV0dXJuIHAubGVuZ3RoO1xuICAgIH0sXG4gIH07XG59XG5cbi8qKiBDcmVhdGUgYSBgUmVhZGVyYCBmcm9tIGEgYFJlYWRhYmxlU3RyZWFtRGVmYXVsdFJlYWRlcmAuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGVyRnJvbVN0cmVhbVJlYWRlcihcbiAgc3RyZWFtUmVhZGVyOiBSZWFkYWJsZVN0cmVhbURlZmF1bHRSZWFkZXI8VWludDhBcnJheT4sXG4pOiBEZW5vLlJlYWRlciB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBCdWZmZXIoKTtcblxuICByZXR1cm4ge1xuICAgIGFzeW5jIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgICAgaWYgKGJ1ZmZlci5lbXB0eSgpKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHN0cmVhbVJlYWRlci5yZWFkKCk7XG4gICAgICAgIGlmIChyZXMuZG9uZSkge1xuICAgICAgICAgIHJldHVybiBudWxsOyAvLyBFT0ZcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHdyaXRlQWxsKGJ1ZmZlciwgcmVzLnZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJ1ZmZlci5yZWFkKHApO1xuICAgIH0sXG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JpdGFibGVTdHJlYW1Gcm9tV3JpdGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBJZiB0aGUgYHdyaXRlcmAgaXMgYWxzbyBhIGBEZW5vLkNsb3NlcmAsIGF1dG9tYXRpY2FsbHkgY2xvc2UgdGhlIGB3cml0ZXJgXG4gICAqIHdoZW4gdGhlIHN0cmVhbSBpcyBjbG9zZWQsIGFib3J0ZWQsIG9yIGEgd3JpdGUgZXJyb3Igb2NjdXJzLlxuICAgKlxuICAgKiBEZWZhdWx0cyB0byBgdHJ1ZWAuICovXG4gIGF1dG9DbG9zZT86IGJvb2xlYW47XG59XG5cbi8qKiBDcmVhdGUgYSBgV3JpdGFibGVTdHJlYW1gIGZyb20gYSBgV3JpdGVyYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0YWJsZVN0cmVhbUZyb21Xcml0ZXIoXG4gIHdyaXRlcjogRGVuby5Xcml0ZXIsXG4gIG9wdGlvbnM6IFdyaXRhYmxlU3RyZWFtRnJvbVdyaXRlck9wdGlvbnMgPSB7fSxcbik6IFdyaXRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgeyBhdXRvQ2xvc2UgPSB0cnVlIH0gPSBvcHRpb25zO1xuXG4gIHJldHVybiBuZXcgV3JpdGFibGVTdHJlYW0oe1xuICAgIGFzeW5jIHdyaXRlKGNodW5rLCBjb250cm9sbGVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB3cml0ZUFsbCh3cml0ZXIsIGNodW5rKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29udHJvbGxlci5lcnJvcihlKTtcbiAgICAgICAgaWYgKGlzQ2xvc2VyKHdyaXRlcikgJiYgYXV0b0Nsb3NlKSB7XG4gICAgICAgICAgd3JpdGVyLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlKCkge1xuICAgICAgaWYgKGlzQ2xvc2VyKHdyaXRlcikgJiYgYXV0b0Nsb3NlKSB7XG4gICAgICAgIHdyaXRlci5jbG9zZSgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYWJvcnQoKSB7XG4gICAgICBpZiAoaXNDbG9zZXIod3JpdGVyKSAmJiBhdXRvQ2xvc2UpIHtcbiAgICAgICAgd3JpdGVyLmNsb3NlKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG5cbi8qKiBDcmVhdGUgYSBgUmVhZGFibGVTdHJlYW1gIGZyb20gYW55IGtpbmQgb2YgaXRlcmFibGUuXG4gKlxuICogYGBgdHNcbiAqICAgICAgaW1wb3J0IHsgcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUgfSBmcm9tIFwiLi9jb252ZXJzaW9uLnRzXCI7XG4gKlxuICogICAgICBjb25zdCByMSA9IHJlYWRhYmxlU3RyZWFtRnJvbUl0ZXJhYmxlKFtcImZvbywgYmFyLCBiYXpcIl0pO1xuICogICAgICBjb25zdCByMiA9IHJlYWRhYmxlU3RyZWFtRnJvbUl0ZXJhYmxlKGFzeW5jIGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKChyKSA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKSk7XG4gKiAgICAgICAgeWllbGQgXCJmb29cIjtcbiAqICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgoKHIpID0+IHNldFRpbWVvdXQociwgMTAwMCkpKTtcbiAqICAgICAgICB5aWVsZCBcImJhclwiO1xuICogICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKCgocikgPT4gc2V0VGltZW91dChyLCAxMDAwKSkpO1xuICogICAgICAgIHlpZWxkIFwiYmF6XCI7XG4gKiAgICAgIH0oKSk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvZHVjZWQgaXRlcmF0b3IgKGBpdGVyYWJsZVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKWAgb3JcbiAqIGBpdGVyYWJsZVtTeW1ib2wuaXRlcmF0b3JdKClgKSBpcyBhIGdlbmVyYXRvciwgb3IgbW9yZSBzcGVjaWZpY2FsbHkgaXMgZm91bmRcbiAqIHRvIGhhdmUgYSBgLnRocm93KClgIG1ldGhvZCBvbiBpdCwgdGhhdCB3aWxsIGJlIGNhbGxlZCB1cG9uXG4gKiBgcmVhZGFibGVTdHJlYW0uY2FuY2VsKClgLiBUaGlzIGlzIHRoZSBjYXNlIGZvciB0aGUgc2Vjb25kIGlucHV0IHR5cGUgYWJvdmU6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHJlYWRhYmxlU3RyZWFtRnJvbUl0ZXJhYmxlIH0gZnJvbSBcIi4vY29udmVyc2lvbi50c1wiO1xuICpcbiAqIGNvbnN0IHIzID0gcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUoYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAqICAgdHJ5IHtcbiAqICAgICB5aWVsZCBcImZvb1wiO1xuICogICB9IGNhdGNoIChlcnJvcikge1xuICogICAgIGNvbnNvbGUubG9nKGVycm9yKTsgLy8gRXJyb3I6IENhbmNlbGxlZCBieSBjb25zdW1lci5cbiAqICAgfVxuICogfSgpKTtcbiAqIGNvbnN0IHJlYWRlciA9IHIzLmdldFJlYWRlcigpO1xuICogY29uc29sZS5sb2coYXdhaXQgcmVhZGVyLnJlYWQoKSk7IC8vIHsgdmFsdWU6IFwiZm9vXCIsIGRvbmU6IGZhbHNlIH1cbiAqIGF3YWl0IHJlYWRlci5jYW5jZWwobmV3IEVycm9yKFwiQ2FuY2VsbGVkIGJ5IGNvbnN1bWVyLlwiKSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRhYmxlU3RyZWFtRnJvbUl0ZXJhYmxlPFQ+KFxuICBpdGVyYWJsZTogSXRlcmFibGU8VD4gfCBBc3luY0l0ZXJhYmxlPFQ+LFxuKTogUmVhZGFibGVTdHJlYW08VD4ge1xuICBjb25zdCBpdGVyYXRvcjogSXRlcmF0b3I8VD4gfCBBc3luY0l0ZXJhdG9yPFQ+ID1cbiAgICAoaXRlcmFibGUgYXMgQXN5bmNJdGVyYWJsZTxUPilbU3ltYm9sLmFzeW5jSXRlcmF0b3JdPy4oKSA/P1xuICAgICAgKGl0ZXJhYmxlIGFzIEl0ZXJhYmxlPFQ+KVtTeW1ib2wuaXRlcmF0b3JdPy4oKTtcbiAgcmV0dXJuIG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICBjb25zdCB7IHZhbHVlLCBkb25lIH0gPSBhd2FpdCBpdGVyYXRvci5uZXh0KCk7XG4gICAgICBpZiAoZG9uZSkge1xuICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250cm9sbGVyLmVucXVldWUodmFsdWUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgY2FuY2VsKHJlYXNvbikge1xuICAgICAgaWYgKHR5cGVvZiBpdGVyYXRvci50aHJvdyA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBpdGVyYXRvci50aHJvdyhyZWFzb24pO1xuICAgICAgICB9IGNhdGNoIHsgLyogYGl0ZXJhdG9yLnRocm93KClgIGFsd2F5cyB0aHJvd3Mgb24gc2l0ZS4gV2UgY2F0Y2ggaXQuICovIH1cbiAgICAgIH1cbiAgICB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gaW50byBhIFRyYW5zZm9ybVN0cmVhbS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUsIHRvVHJhbnNmb3JtU3RyZWFtIH0gZnJvbSBcIi4vY29udmVyc2lvbi50c1wiO1xuICpcbiAqIGNvbnN0IHJlYWRhYmxlID0gcmVhZGFibGVTdHJlYW1Gcm9tSXRlcmFibGUoWzAsIDEsIDJdKVxuICogICAucGlwZVRocm91Z2godG9UcmFuc2Zvcm1TdHJlYW0oYXN5bmMgZnVuY3Rpb24qIChzcmMpIHtcbiAqICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHNyYykge1xuICogICAgICAgeWllbGQgY2h1bmsgKiAxMDA7XG4gKiAgICAgfVxuICogICB9KSk7XG4gKlxuICogZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZWFkYWJsZSkge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiAvLyBvdXRwdXQ6IDAsIDEwMCwgMjAwXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gdHJhbnNmb3JtZXIgQSBmdW5jdGlvbiB0byB0cmFuc2Zvcm0uXG4gKiBAcGFyYW0gd3JpdGFibGVTdHJhdGVneSBBbiBvYmplY3QgdGhhdCBvcHRpb25hbGx5IGRlZmluZXMgYSBxdWV1aW5nIHN0cmF0ZWd5IGZvciB0aGUgc3RyZWFtLlxuICogQHBhcmFtIHJlYWRhYmxlU3RyYXRlZ3kgQW4gb2JqZWN0IHRoYXQgb3B0aW9uYWxseSBkZWZpbmVzIGEgcXVldWluZyBzdHJhdGVneSBmb3IgdGhlIHN0cmVhbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvVHJhbnNmb3JtU3RyZWFtPEksIE8+KFxuICB0cmFuc2Zvcm1lcjogKHNyYzogUmVhZGFibGVTdHJlYW08ST4pID0+IEl0ZXJhYmxlPE8+IHwgQXN5bmNJdGVyYWJsZTxPPixcbiAgd3JpdGFibGVTdHJhdGVneT86IFF1ZXVpbmdTdHJhdGVneTxJPixcbiAgcmVhZGFibGVTdHJhdGVneT86IFF1ZXVpbmdTdHJhdGVneTxPPixcbik6IFRyYW5zZm9ybVN0cmVhbTxJLCBPPiB7XG4gIGNvbnN0IHtcbiAgICB3cml0YWJsZSxcbiAgICByZWFkYWJsZSxcbiAgfSA9IG5ldyBUcmFuc2Zvcm1TdHJlYW08SSwgST4odW5kZWZpbmVkLCB3cml0YWJsZVN0cmF0ZWd5KTtcblxuICBjb25zdCBpdGVyYWJsZSA9IHRyYW5zZm9ybWVyKHJlYWRhYmxlKTtcbiAgY29uc3QgaXRlcmF0b3I6IEl0ZXJhdG9yPE8+IHwgQXN5bmNJdGVyYXRvcjxPPiA9XG4gICAgKGl0ZXJhYmxlIGFzIEFzeW5jSXRlcmFibGU8Tz4pW1N5bWJvbC5hc3luY0l0ZXJhdG9yXT8uKCkgPz9cbiAgICAgIChpdGVyYWJsZSBhcyBJdGVyYWJsZTxPPilbU3ltYm9sLml0ZXJhdG9yXT8uKCk7XG4gIHJldHVybiB7XG4gICAgd3JpdGFibGUsXG4gICAgcmVhZGFibGU6IG5ldyBSZWFkYWJsZVN0cmVhbTxPPih7XG4gICAgICBhc3luYyBwdWxsKGNvbnRyb2xsZXIpIHtcbiAgICAgICAgbGV0IHJlc3VsdDogSXRlcmF0b3JSZXN1bHQ8Tz47XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIC8vIFByb3BhZ2F0ZSBlcnJvciB0byBzdHJlYW0gZnJvbSBpdGVyYXRvclxuICAgICAgICAgIC8vIElmIHRoZSBzdHJlYW0gc3RhdHVzIGlzIFwiZXJyb3JlZFwiLCBpdCB3aWxsIGJlIHRocm93biwgYnV0IGlnbm9yZS5cbiAgICAgICAgICBhd2FpdCByZWFkYWJsZS5jYW5jZWwoZXJyb3IpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICBjb250cm9sbGVyLmVycm9yKGVycm9yKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb250cm9sbGVyLmVucXVldWUocmVzdWx0LnZhbHVlKTtcbiAgICAgIH0sXG4gICAgICBhc3luYyBjYW5jZWwocmVhc29uKSB7XG4gICAgICAgIC8vIFByb3BhZ2F0ZSBjYW5jZWxsYXRpb24gdG8gcmVhZGFibGUgYW5kIGl0ZXJhdG9yXG4gICAgICAgIGlmICh0eXBlb2YgaXRlcmF0b3IudGhyb3cgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGl0ZXJhdG9yLnRocm93KHJlYXNvbik7XG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvKiBgaXRlcmF0b3IudGhyb3coKWAgYWx3YXlzIHRocm93cyBvbiBzaXRlLiBXZSBjYXRjaCBpdC4gKi9cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgcmVhZGFibGUuY2FuY2VsKHJlYXNvbik7XG4gICAgICB9LFxuICAgIH0sIHJlYWRhYmxlU3RyYXRlZ3kpLFxuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRhYmxlU3RyZWFtRnJvbVJlYWRlck9wdGlvbnMge1xuICAvKiogSWYgdGhlIGByZWFkZXJgIGlzIGFsc28gYSBgRGVuby5DbG9zZXJgLCBhdXRvbWF0aWNhbGx5IGNsb3NlIHRoZSBgcmVhZGVyYFxuICAgKiB3aGVuIGBFT0ZgIGlzIGVuY291bnRlcmVkLCBvciBhIHJlYWQgZXJyb3Igb2NjdXJzLlxuICAgKlxuICAgKiBEZWZhdWx0cyB0byBgdHJ1ZWAuICovXG4gIGF1dG9DbG9zZT86IGJvb2xlYW47XG5cbiAgLyoqIFRoZSBzaXplIG9mIGNodW5rcyB0byBhbGxvY2F0ZSB0byByZWFkLCB0aGUgZGVmYXVsdCBpcyB+MTZLaUIsIHdoaWNoIGlzXG4gICAqIHRoZSBtYXhpbXVtIHNpemUgdGhhdCBEZW5vIG9wZXJhdGlvbnMgY2FuIGN1cnJlbnRseSBzdXBwb3J0LiAqL1xuICBjaHVua1NpemU/OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBxdWV1aW5nIHN0cmF0ZWd5IHRvIGNyZWF0ZSB0aGUgYFJlYWRhYmxlU3RyZWFtYCB3aXRoLiAqL1xuICBzdHJhdGVneT86IHsgaGlnaFdhdGVyTWFyaz86IG51bWJlciB8IHVuZGVmaW5lZDsgc2l6ZT86IHVuZGVmaW5lZCB9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PmAgZnJvbSBmcm9tIGEgYERlbm8uUmVhZGVyYC5cbiAqXG4gKiBXaGVuIHRoZSBwdWxsIGFsZ29yaXRobSBpcyBjYWxsZWQgb24gdGhlIHN0cmVhbSwgYSBjaHVuayBmcm9tIHRoZSByZWFkZXJcbiAqIHdpbGwgYmUgcmVhZC4gIFdoZW4gYG51bGxgIGlzIHJldHVybmVkIGZyb20gdGhlIHJlYWRlciwgdGhlIHN0cmVhbSB3aWxsIGJlXG4gKiBjbG9zZWQgYWxvbmcgd2l0aCB0aGUgcmVhZGVyIChpZiBpdCBpcyBhbHNvIGEgYERlbm8uQ2xvc2VyYCkuXG4gKlxuICogQW4gZXhhbXBsZSBjb252ZXJ0aW5nIGEgYERlbm8uRnNGaWxlYCBpbnRvIGEgcmVhZGFibGUgc3RyZWFtOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyByZWFkYWJsZVN0cmVhbUZyb21SZWFkZXIgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwiLi9maWxlLnR4dFwiLCB7IHJlYWQ6IHRydWUgfSk7XG4gKiBjb25zdCBmaWxlU3RyZWFtID0gcmVhZGFibGVTdHJlYW1Gcm9tUmVhZGVyKGZpbGUpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkYWJsZVN0cmVhbUZyb21SZWFkZXIoXG4gIHJlYWRlcjogRGVuby5SZWFkZXIgfCAoRGVuby5SZWFkZXIgJiBEZW5vLkNsb3NlciksXG4gIG9wdGlvbnM6IFJlYWRhYmxlU3RyZWFtRnJvbVJlYWRlck9wdGlvbnMgPSB7fSxcbik6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3Qge1xuICAgIGF1dG9DbG9zZSA9IHRydWUsXG4gICAgY2h1bmtTaXplID0gREVGQVVMVF9DSFVOS19TSVpFLFxuICAgIHN0cmF0ZWd5LFxuICB9ID0gb3B0aW9ucztcblxuICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtKHtcbiAgICBhc3luYyBwdWxsKGNvbnRyb2xsZXIpIHtcbiAgICAgIGNvbnN0IGNodW5rID0gbmV3IFVpbnQ4QXJyYXkoY2h1bmtTaXplKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlYWQgPSBhd2FpdCByZWFkZXIucmVhZChjaHVuayk7XG4gICAgICAgIGlmIChyZWFkID09PSBudWxsKSB7XG4gICAgICAgICAgaWYgKGlzQ2xvc2VyKHJlYWRlcikgJiYgYXV0b0Nsb3NlKSB7XG4gICAgICAgICAgICByZWFkZXIuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmsuc3ViYXJyYXkoMCwgcmVhZCkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb250cm9sbGVyLmVycm9yKGUpO1xuICAgICAgICBpZiAoaXNDbG9zZXIocmVhZGVyKSkge1xuICAgICAgICAgIHJlYWRlci5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjYW5jZWwoKSB7XG4gICAgICBpZiAoaXNDbG9zZXIocmVhZGVyKSAmJiBhdXRvQ2xvc2UpIHtcbiAgICAgICAgcmVhZGVyLmNsb3NlKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfSwgc3RyYXRlZ3kpO1xufVxuXG4vKiogUmVhZCBSZWFkZXIgYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgcmVzb2x2ZSB0byB0aGUgY29udGVudCBhc1xuICogVWludDhBcnJheWAuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuLi9pby9idWZmZXIudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRBbGwgfSBmcm9tIFwiLi9jb252ZXJzaW9uLnRzXCI7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIHN0ZGluXG4gKiBjb25zdCBzdGRpbkNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKERlbm8uc3RkaW4pO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBmaWxlXG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwibXlfZmlsZS50eHRcIiwge3JlYWQ6IHRydWV9KTtcbiAqIGNvbnN0IG15RmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKGZpbGUpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGJ1ZmZlclxuICogY29uc3QgbXlEYXRhID0gbmV3IFVpbnQ4QXJyYXkoMTAwKTtcbiAqIC8vIC4uLiBmaWxsIG15RGF0YSBhcnJheSB3aXRoIGRhdGFcbiAqIGNvbnN0IHJlYWRlciA9IG5ldyBCdWZmZXIobXlEYXRhLmJ1ZmZlcik7XG4gKiBjb25zdCBidWZmZXJDb250ZW50ID0gYXdhaXQgcmVhZEFsbChyZWFkZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQWxsKHI6IERlbm8uUmVhZGVyKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgYXdhaXQgYnVmLnJlYWRGcm9tKHIpO1xuICByZXR1cm4gYnVmLmJ5dGVzKCk7XG59XG5cbi8qKiBTeW5jaHJvbm91c2x5IHJlYWRzIFJlYWRlciBgcmAgdW50aWwgRU9GIChgbnVsbGApIGFuZCByZXR1cm5zIHRoZSBjb250ZW50XG4gKiBhcyBgVWludDhBcnJheWAuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuLi9pby9idWZmZXIudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRBbGxTeW5jIH0gZnJvbSBcIi4vY29udmVyc2lvbi50c1wiO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBzdGRpblxuICogY29uc3Qgc3RkaW5Db250ZW50ID0gcmVhZEFsbFN5bmMoRGVuby5zdGRpbik7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBEZW5vLm9wZW5TeW5jKFwibXlfZmlsZS50eHRcIiwge3JlYWQ6IHRydWV9KTtcbiAqIGNvbnN0IG15RmlsZUNvbnRlbnQgPSByZWFkQWxsU3luYyhmaWxlKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBidWZmZXJcbiAqIGNvbnN0IG15RGF0YSA9IG5ldyBVaW50OEFycmF5KDEwMCk7XG4gKiAvLyAuLi4gZmlsbCBteURhdGEgYXJyYXkgd2l0aCBkYXRhXG4gKiBjb25zdCByZWFkZXIgPSBuZXcgQnVmZmVyKG15RGF0YS5idWZmZXIpO1xuICogY29uc3QgYnVmZmVyQ29udGVudCA9IHJlYWRBbGxTeW5jKHJlYWRlcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBbGxTeW5jKHI6IERlbm8uUmVhZGVyU3luYyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gIGJ1Zi5yZWFkRnJvbVN5bmMocik7XG4gIHJldHVybiBidWYuYnl0ZXMoKTtcbn1cblxuLyoqIFdyaXRlIGFsbCB0aGUgY29udGVudCBvZiB0aGUgYXJyYXkgYnVmZmVyIChgYXJyYCkgdG8gdGhlIHdyaXRlciAoYHdgKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4uL2lvL2J1ZmZlci50c1wiO1xuICogaW1wb3J0IHsgd3JpdGVBbGwgfSBmcm9tIFwiLi9jb252ZXJzaW9uLnRzXCI7XG5cbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBzdGRvdXRcbiAqIGxldCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGF3YWl0IHdyaXRlQWxsKERlbm8uc3Rkb3V0LCBjb250ZW50Qnl0ZXMpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBmaWxlXG4gKiBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oJ3Rlc3QuZmlsZScsIHt3cml0ZTogdHJ1ZX0pO1xuICogYXdhaXQgd3JpdGVBbGwoZmlsZSwgY29udGVudEJ5dGVzKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBidWZmZXJcbiAqIGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3Qgd3JpdGVyID0gbmV3IEJ1ZmZlcigpO1xuICogYXdhaXQgd3JpdGVBbGwod3JpdGVyLCBjb250ZW50Qnl0ZXMpO1xuICogY29uc29sZS5sb2cod3JpdGVyLmJ5dGVzKCkubGVuZ3RoKTsgIC8vIDExXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlQWxsKHc6IERlbm8uV3JpdGVyLCBhcnI6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgYXJyLmxlbmd0aCkge1xuICAgIG53cml0dGVuICs9IGF3YWl0IHcud3JpdGUoYXJyLnN1YmFycmF5KG53cml0dGVuKSk7XG4gIH1cbn1cblxuLyoqIFN5bmNocm9ub3VzbHkgd3JpdGUgYWxsIHRoZSBjb250ZW50IG9mIHRoZSBhcnJheSBidWZmZXIgKGBhcnJgKSB0byB0aGVcbiAqIHdyaXRlciAoYHdgKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4uL2lvL2J1ZmZlci50c1wiO1xuICogaW1wb3J0IHsgd3JpdGVBbGxTeW5jIH0gZnJvbSBcIi4vY29udmVyc2lvbi50c1wiO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBzdGRvdXRcbiAqIGxldCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIHdyaXRlQWxsU3luYyhEZW5vLnN0ZG91dCwgY29udGVudEJ5dGVzKTtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gZmlsZVxuICogY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBjb25zdCBmaWxlID0gRGVuby5vcGVuU3luYygndGVzdC5maWxlJywge3dyaXRlOiB0cnVlfSk7XG4gKiB3cml0ZUFsbFN5bmMoZmlsZSwgY29udGVudEJ5dGVzKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBidWZmZXJcbiAqIGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3Qgd3JpdGVyID0gbmV3IEJ1ZmZlcigpO1xuICogd3JpdGVBbGxTeW5jKHdyaXRlciwgY29udGVudEJ5dGVzKTtcbiAqIGNvbnNvbGUubG9nKHdyaXRlci5ieXRlcygpLmxlbmd0aCk7ICAvLyAxMVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUFsbFN5bmModzogRGVuby5Xcml0ZXJTeW5jLCBhcnI6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgYXJyLmxlbmd0aCkge1xuICAgIG53cml0dGVuICs9IHcud3JpdGVTeW5jKGFyci5zdWJhcnJheShud3JpdHRlbikpO1xuICB9XG59XG5cbi8qKiBUdXJucyBhIFJlYWRlciwgYHJgLCBpbnRvIGFuIGFzeW5jIGl0ZXJhdG9yLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBpdGVyYXRlUmVhZGVyIH0gZnJvbSBcIi4vY29udmVyc2lvbi50c1wiO1xuICpcbiAqIGxldCBmID0gYXdhaXQgRGVuby5vcGVuKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGl0ZXJhdGVSZWFkZXIoZikpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogU2Vjb25kIGFyZ3VtZW50IGNhbiBiZSB1c2VkIHRvIHR1bmUgc2l6ZSBvZiBhIGJ1ZmZlci5cbiAqIERlZmF1bHQgc2l6ZSBvZiB0aGUgYnVmZmVyIGlzIDMya0IuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGl0ZXJhdGVSZWFkZXIgfSBmcm9tIFwiLi9jb252ZXJzaW9uLnRzXCI7XG4gKlxuICogbGV0IGYgPSBhd2FpdCBEZW5vLm9wZW4oXCIvZXRjL3Bhc3N3ZFwiKTtcbiAqIGNvbnN0IGl0ID0gaXRlcmF0ZVJlYWRlcihmLCB7XG4gKiAgIGJ1ZlNpemU6IDEwMjQgKiAxMDI0XG4gKiB9KTtcbiAqIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgaXQpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogSXRlcmF0b3IgdXNlcyBhbiBpbnRlcm5hbCBidWZmZXIgb2YgZml4ZWQgc2l6ZSBmb3IgZWZmaWNpZW5jeTsgaXQgcmV0dXJuc1xuICogYSB2aWV3IG9uIHRoYXQgYnVmZmVyIG9uIGVhY2ggaXRlcmF0aW9uLiBJdCBpcyB0aGVyZWZvcmUgY2FsbGVyJ3NcbiAqIHJlc3BvbnNpYmlsaXR5IHRvIGNvcHkgY29udGVudHMgb2YgdGhlIGJ1ZmZlciBpZiBuZWVkZWQ7IG90aGVyd2lzZSB0aGVcbiAqIG5leHQgaXRlcmF0aW9uIHdpbGwgb3ZlcndyaXRlIGNvbnRlbnRzIG9mIHByZXZpb3VzbHkgcmV0dXJuZWQgY2h1bmsuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogaXRlcmF0ZVJlYWRlcihcbiAgcjogRGVuby5SZWFkZXIsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZlNpemUgPSBvcHRpb25zPy5idWZTaXplID8/IERFRkFVTFRfQlVGRkVSX1NJWkU7XG4gIGNvbnN0IGIgPSBuZXcgVWludDhBcnJheShidWZTaXplKTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByLnJlYWQoYik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgeWllbGQgYi5zdWJhcnJheSgwLCByZXN1bHQpO1xuICB9XG59XG5cbi8qKiBUdXJucyBhIFJlYWRlclN5bmMsIGByYCwgaW50byBhbiBpdGVyYXRvci5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXRlcmF0ZVJlYWRlclN5bmMgfSBmcm9tIFwiLi9jb252ZXJzaW9uLnRzXCI7XG4gKlxuICogbGV0IGYgPSBEZW5vLm9wZW5TeW5jKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBmb3IgKGNvbnN0IGNodW5rIG9mIGl0ZXJhdGVSZWFkZXJTeW5jKGYpKSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFNlY29uZCBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byB0dW5lIHNpemUgb2YgYSBidWZmZXIuXG4gKiBEZWZhdWx0IHNpemUgb2YgdGhlIGJ1ZmZlciBpcyAzMmtCLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBpdGVyYXRlUmVhZGVyU3luYyB9IGZyb20gXCIuL2NvbnZlcnNpb24udHNcIjtcblxuICogbGV0IGYgPSBhd2FpdCBEZW5vLm9wZW4oXCIvZXRjL3Bhc3N3ZFwiKTtcbiAqIGNvbnN0IGl0ZXIgPSBpdGVyYXRlUmVhZGVyU3luYyhmLCB7XG4gKiAgIGJ1ZlNpemU6IDEwMjQgKiAxMDI0XG4gKiB9KTtcbiAqIGZvciAoY29uc3QgY2h1bmsgb2YgaXRlcikge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBmLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBJdGVyYXRvciB1c2VzIGFuIGludGVybmFsIGJ1ZmZlciBvZiBmaXhlZCBzaXplIGZvciBlZmZpY2llbmN5OyBpdCByZXR1cm5zXG4gKiBhIHZpZXcgb24gdGhhdCBidWZmZXIgb24gZWFjaCBpdGVyYXRpb24uIEl0IGlzIHRoZXJlZm9yZSBjYWxsZXInc1xuICogcmVzcG9uc2liaWxpdHkgdG8gY29weSBjb250ZW50cyBvZiB0aGUgYnVmZmVyIGlmIG5lZWRlZDsgb3RoZXJ3aXNlIHRoZVxuICogbmV4dCBpdGVyYXRpb24gd2lsbCBvdmVyd3JpdGUgY29udGVudHMgb2YgcHJldmlvdXNseSByZXR1cm5lZCBjaHVuay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uKiBpdGVyYXRlUmVhZGVyU3luYyhcbiAgcjogRGVuby5SZWFkZXJTeW5jLFxuICBvcHRpb25zPzoge1xuICAgIGJ1ZlNpemU/OiBudW1iZXI7XG4gIH0sXG4pOiBJdGVyYWJsZUl0ZXJhdG9yPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgYnVmU2l6ZSA9IG9wdGlvbnM/LmJ1ZlNpemUgPz8gREVGQVVMVF9CVUZGRVJfU0laRTtcbiAgY29uc3QgYiA9IG5ldyBVaW50OEFycmF5KGJ1ZlNpemUpO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHIucmVhZFN5bmMoYik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgeWllbGQgYi5zdWJhcnJheSgwLCByZXN1bHQpO1xuICB9XG59XG5cbi8qKiBDb3BpZXMgZnJvbSBgc3JjYCB0byBgZHN0YCB1bnRpbCBlaXRoZXIgRU9GIChgbnVsbGApIGlzIHJlYWQgZnJvbSBgc3JjYCBvclxuICogYW4gZXJyb3Igb2NjdXJzLiBJdCByZXNvbHZlcyB0byB0aGUgbnVtYmVyIG9mIGJ5dGVzIGNvcGllZCBvciByZWplY3RzIHdpdGhcbiAqIHRoZSBmaXJzdCBlcnJvciBlbmNvdW50ZXJlZCB3aGlsZSBjb3B5aW5nLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIi4vY29udmVyc2lvbi50c1wiO1xuICpcbiAqIGNvbnN0IHNvdXJjZSA9IGF3YWl0IERlbm8ub3BlbihcIm15X2ZpbGUudHh0XCIpO1xuICogY29uc3QgYnl0ZXNDb3BpZWQxID0gYXdhaXQgY29weShzb3VyY2UsIERlbm8uc3Rkb3V0KTtcbiAqIGNvbnN0IGRlc3RpbmF0aW9uID0gYXdhaXQgRGVuby5jcmVhdGUoXCJteV9maWxlXzIudHh0XCIpO1xuICogY29uc3QgYnl0ZXNDb3BpZWQyID0gYXdhaXQgY29weShzb3VyY2UsIGRlc3RpbmF0aW9uKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBzcmMgVGhlIHNvdXJjZSB0byBjb3B5IGZyb21cbiAqIEBwYXJhbSBkc3QgVGhlIGRlc3RpbmF0aW9uIHRvIGNvcHkgdG9cbiAqIEBwYXJhbSBvcHRpb25zIENhbiBiZSB1c2VkIHRvIHR1bmUgc2l6ZSBvZiB0aGUgYnVmZmVyLiBEZWZhdWx0IHNpemUgaXMgMzJrQlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weShcbiAgc3JjOiBEZW5vLlJlYWRlcixcbiAgZHN0OiBEZW5vLldyaXRlcixcbiAgb3B0aW9ucz86IHtcbiAgICBidWZTaXplPzogbnVtYmVyO1xuICB9LFxuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgbGV0IG4gPSAwO1xuICBjb25zdCBidWZTaXplID0gb3B0aW9ucz8uYnVmU2l6ZSA/PyBERUZBVUxUX0JVRkZFUl9TSVpFO1xuICBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gIGxldCBnb3RFT0YgPSBmYWxzZTtcbiAgd2hpbGUgKGdvdEVPRiA9PT0gZmFsc2UpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzcmMucmVhZChiKTtcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICBnb3RFT0YgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbndyaXR0ZW4gPSAwO1xuICAgICAgd2hpbGUgKG53cml0dGVuIDwgcmVzdWx0KSB7XG4gICAgICAgIG53cml0dGVuICs9IGF3YWl0IGRzdC53cml0ZShiLnN1YmFycmF5KG53cml0dGVuLCByZXN1bHQpKTtcbiAgICAgIH1cbiAgICAgIG4gKz0gbndyaXR0ZW47XG4gICAgfVxuICB9XG4gIHJldHVybiBuO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLE1BQU0sUUFBUSxpQkFBaUIsQ0FBQztBQUV6QyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQUFBQztBQUNsQyxNQUFNLG1CQUFtQixHQUFHLEVBQUUsR0FBRyxJQUFJLEFBQUM7QUFFdEMsU0FBUyxRQUFRLENBQUMsS0FBYyxFQUF3QjtJQUN0RCxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLElBQ25FLG1DQUFtQztJQUNuQyxPQUFPLEFBQUMsS0FBSyxBQUF3QixDQUFDLE9BQU8sQ0FBQyxLQUFLLFVBQVUsQ0FBQztBQUNsRSxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLGtCQUFrQixDQUNoQyxRQUEwRCxFQUM3QztJQUNiLE1BQU0sUUFBUSxHQUNaLEFBQUMsUUFBUSxBQUE4QixDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsUUFDM0QsQUFBQyxRQUFRLEFBQXlCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEFBQUM7SUFDNUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQUFBQztJQUM1QixPQUFPO1FBQ0wsTUFBTSxJQUFJLEVBQUMsQ0FBYSxFQUEwQjtZQUNoRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO2dCQUN0QixNQUFNLE1BQU0sR0FBRyxNQUFNLFFB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