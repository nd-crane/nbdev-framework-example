// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Extensions to the
 * [Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
 * supporting additional encryption APIs.
 *
 * Provides additional digest algorithms that are not part of the WebCrypto
 * standard as well as a `subtle.digest` and `subtle.digestSync` methods. It
 * also provide a `subtle.timingSafeEqual()` method to compare array buffers
 * or data views in a way that isn't prone to timing based attacks.
 *
 * The "polyfill" delegates to `WebCrypto` where possible.
 *
 * The {@linkcode KeyStack} export implements the {@linkcode KeyRing} interface
 * for managing rotatable keys for signing data to prevent tampering, like with
 * HTTP cookies.
 *
 * @module
 */ import { digestAlgorithms as wasmDigestAlgorithms, instantiateWasm } from "../_wasm_crypto/mod.ts";
import { timingSafeEqual } from "./timing_safe_equal.ts";
import { fnv } from "./_fnv/index.ts";
export { KeyStack } from "./keystack.ts";
/**
 * A copy of the global WebCrypto interface, with methods bound so they're
 * safe to re-export.
 */ const webCrypto = ((crypto)=>({
        getRandomValues: crypto.getRandomValues?.bind(crypto),
        randomUUID: crypto.randomUUID?.bind(crypto),
        subtle: {
            decrypt: crypto.subtle?.decrypt?.bind(crypto.subtle),
            deriveBits: crypto.subtle?.deriveBits?.bind(crypto.subtle),
            deriveKey: crypto.subtle?.deriveKey?.bind(crypto.subtle),
            digest: crypto.subtle?.digest?.bind(crypto.subtle),
            encrypt: crypto.subtle?.encrypt?.bind(crypto.subtle),
            exportKey: crypto.subtle?.exportKey?.bind(crypto.subtle),
            generateKey: crypto.subtle?.generateKey?.bind(crypto.subtle),
            importKey: crypto.subtle?.importKey?.bind(crypto.subtle),
            sign: crypto.subtle?.sign?.bind(crypto.subtle),
            unwrapKey: crypto.subtle?.unwrapKey?.bind(crypto.subtle),
            verify: crypto.subtle?.verify?.bind(crypto.subtle),
            wrapKey: crypto.subtle?.wrapKey?.bind(crypto.subtle)
        }
    }))(globalThis.crypto);
const bufferSourceBytes = (data)=>{
    let bytes;
    if (data instanceof Uint8Array) {
        bytes = data;
    } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    }
    return bytes;
};
/**
 * An wrapper for WebCrypto adding support for additional non-standard
 * algorithms, but delegating to the runtime WebCrypto implementation whenever
 * possible.
 */ const stdCrypto = ((x)=>x)({
    ...webCrypto,
    subtle: {
        ...webCrypto.subtle,
        async digest (algorithm, data) {
            const { name , length  } = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(name)) {
                return fnv(name, bytes);
            }
            // We delegate to WebCrypto whenever possible,
            if (// if the algorithm is supported by the WebCrypto standard,
            (webCryptoDigestAlgorithms).includes(name) && // and the data is a single buffer,
            bytes) {
                return webCrypto.subtle.digest(algorithm, bytes);
            } else if (wasmDigestAlgorithms.includes(name)) {
                if (bytes) {
                    // Otherwise, we use our bundled Wasm implementation via digestSync
                    // if it supports the algorithm.
                    return stdCrypto.subtle.digestSync(algorithm, bytes);
                } else if (data[Symbol.iterator]) {
                    return stdCrypto.subtle.digestSync(algorithm, data);
                } else if (data[Symbol.asyncIterator]) {
                    const wasmCrypto = instantiateWasm();
                    const context = new wasmCrypto.DigestContext(name);
                    for await (const chunk of data){
                        const chunkBytes = bufferSourceBytes(chunk);
                        if (!chunkBytes) {
                            throw new TypeError("data contained chunk of the wrong type");
                        }
                        context.update(chunkBytes);
                    }
                    return context.digestAndDrop(length).buffer;
                } else {
                    throw new TypeError("data must be a BufferSource or [Async]Iterable<BufferSource>");
                }
            } else if (webCrypto.subtle?.digest) {
                // (TypeScript type definitions prohibit this case.) If they're trying
                // to call an algorithm we don't recognize, pass it along to WebCrypto
                // in case it's a non-standard algorithm supported by the the runtime
                // they're using.
                return webCrypto.subtle.digest(algorithm, data);
            } else {
                throw new TypeError(`unsupported digest algorithm: ${algorithm}`);
            }
        },
        digestSync (algorithm, data) {
            algorithm = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(algorithm.name)) {
                return fnv(algorithm.name, bytes);
            }
            const wasmCrypto = instantiateWasm();
            if (bytes) {
                return wasmCrypto.digest(algorithm.name, bytes, algorithm.length).buffer;
            } else if (data[Symbol.iterator]) {
                const context = new wasmCrypto.DigestContext(algorithm.name);
                for (const chunk of data){
                    const chunkBytes = bufferSourceBytes(chunk);
                    if (!chunkBytes) {
                        throw new TypeError("data contained chunk of the wrong type");
                    }
                    context.update(chunkBytes);
                }
                return context.digestAndDrop(algorithm.length).buffer;
            } else {
                throw new TypeError("data must be a BufferSource or Iterable<BufferSource>");
            }
        },
        // TODO(@kitsonk): rework when https://github.com/w3c/webcrypto/issues/270 resolved
        timingSafeEqual
    }
});
const FNVAlgorithms = [
    "FNV32",
    "FNV32A",
    "FNV64",
    "FNV64A"
];
/** Digest algorithms supported by WebCrypto. */ const webCryptoDigestAlgorithms = [
    "SHA-384",
    "SHA-256",
    "SHA-512",
    // insecure (length-extendable and collidable):
    "SHA-1", 
];
const normalizeAlgorithm = (algorithm)=>typeof algorithm === "string" ? {
        name: algorithm.toUpperCase()
    } : {
        ...algorithm,
        name: algorithm.name.toUpperCase()
    };
export { stdCrypto as crypto };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NyeXB0by9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBFeHRlbnNpb25zIHRvIHRoZVxuICogW1dlYiBDcnlwdG9dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJfQ3J5cHRvX0FQSSlcbiAqIHN1cHBvcnRpbmcgYWRkaXRpb25hbCBlbmNyeXB0aW9uIEFQSXMuXG4gKlxuICogUHJvdmlkZXMgYWRkaXRpb25hbCBkaWdlc3QgYWxnb3JpdGhtcyB0aGF0IGFyZSBub3QgcGFydCBvZiB0aGUgV2ViQ3J5cHRvXG4gKiBzdGFuZGFyZCBhcyB3ZWxsIGFzIGEgYHN1YnRsZS5kaWdlc3RgIGFuZCBgc3VidGxlLmRpZ2VzdFN5bmNgIG1ldGhvZHMuIEl0XG4gKiBhbHNvIHByb3ZpZGUgYSBgc3VidGxlLnRpbWluZ1NhZmVFcXVhbCgpYCBtZXRob2QgdG8gY29tcGFyZSBhcnJheSBidWZmZXJzXG4gKiBvciBkYXRhIHZpZXdzIGluIGEgd2F5IHRoYXQgaXNuJ3QgcHJvbmUgdG8gdGltaW5nIGJhc2VkIGF0dGFja3MuXG4gKlxuICogVGhlIFwicG9seWZpbGxcIiBkZWxlZ2F0ZXMgdG8gYFdlYkNyeXB0b2Agd2hlcmUgcG9zc2libGUuXG4gKlxuICogVGhlIHtAbGlua2NvZGUgS2V5U3RhY2t9IGV4cG9ydCBpbXBsZW1lbnRzIHRoZSB7QGxpbmtjb2RlIEtleVJpbmd9IGludGVyZmFjZVxuICogZm9yIG1hbmFnaW5nIHJvdGF0YWJsZSBrZXlzIGZvciBzaWduaW5nIGRhdGEgdG8gcHJldmVudCB0YW1wZXJpbmcsIGxpa2Ugd2l0aFxuICogSFRUUCBjb29raWVzLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQge1xuICBEaWdlc3RBbGdvcml0aG0gYXMgV2FzbURpZ2VzdEFsZ29yaXRobSxcbiAgZGlnZXN0QWxnb3JpdGhtcyBhcyB3YXNtRGlnZXN0QWxnb3JpdGhtcyxcbiAgaW5zdGFudGlhdGVXYXNtLFxufSBmcm9tIFwiLi4vX3dhc21fY3J5cHRvL21vZC50c1wiO1xuaW1wb3J0IHsgdGltaW5nU2FmZUVxdWFsIH0gZnJvbSBcIi4vdGltaW5nX3NhZmVfZXF1YWwudHNcIjtcbmltcG9ydCB7IGZudiB9IGZyb20gXCIuL19mbnYvaW5kZXgudHNcIjtcblxuZXhwb3J0IHsgdHlwZSBEYXRhLCB0eXBlIEtleSwgS2V5U3RhY2sgfSBmcm9tIFwiLi9rZXlzdGFjay50c1wiO1xuXG4vKipcbiAqIEEgY29weSBvZiB0aGUgZ2xvYmFsIFdlYkNyeXB0byBpbnRlcmZhY2UsIHdpdGggbWV0aG9kcyBib3VuZCBzbyB0aGV5J3JlXG4gKiBzYWZlIHRvIHJlLWV4cG9ydC5cbiAqL1xuY29uc3Qgd2ViQ3J5cHRvID0gKChjcnlwdG8pID0+ICh7XG4gIGdldFJhbmRvbVZhbHVlczogY3J5cHRvLmdldFJhbmRvbVZhbHVlcz8uYmluZChjcnlwdG8pLFxuICByYW5kb21VVUlEOiBjcnlwdG8ucmFuZG9tVVVJRD8uYmluZChjcnlwdG8pLFxuICBzdWJ0bGU6IHtcbiAgICBkZWNyeXB0OiBjcnlwdG8uc3VidGxlPy5kZWNyeXB0Py5iaW5kKGNyeXB0by5zdWJ0bGUpLFxuICAgIGRlcml2ZUJpdHM6IGNyeXB0by5zdWJ0bGU/LmRlcml2ZUJpdHM/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZGVyaXZlS2V5OiBjcnlwdG8uc3VidGxlPy5kZXJpdmVLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZGlnZXN0OiBjcnlwdG8uc3VidGxlPy5kaWdlc3Q/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZW5jcnlwdDogY3J5cHRvLnN1YnRsZT8uZW5jcnlwdD8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICBleHBvcnRLZXk6IGNyeXB0by5zdWJ0bGU/LmV4cG9ydEtleT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICBnZW5lcmF0ZUtleTogY3J5cHRvLnN1YnRsZT8uZ2VuZXJhdGVLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgaW1wb3J0S2V5OiBjcnlwdG8uc3VidGxlPy5pbXBvcnRLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgc2lnbjogY3J5cHRvLnN1YnRsZT8uc2lnbj8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB1bndyYXBLZXk6IGNyeXB0by5zdWJ0bGU/LnVud3JhcEtleT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB2ZXJpZnk6IGNyeXB0by5zdWJ0bGU/LnZlcmlmeT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB3cmFwS2V5OiBjcnlwdG8uc3VidGxlPy53cmFwS2V5Py5iaW5kKGNyeXB0by5zdWJ0bGUpLFxuICB9LFxufSkpKGdsb2JhbFRoaXMuY3J5cHRvKTtcblxuY29uc3QgYnVmZmVyU291cmNlQnl0ZXMgPSAoZGF0YTogQnVmZmVyU291cmNlIHwgdW5rbm93bikgPT4ge1xuICBsZXQgYnl0ZXM6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIGJ5dGVzID0gZGF0YTtcbiAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG4gIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgYnl0ZXMgPSBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59O1xuXG4vKiogRXh0ZW5zaW9ucyB0byB0aGUgd2ViIHN0YW5kYXJkIGBTdWJ0bGVDcnlwdG9gIGludGVyZmFjZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RkU3VidGxlQ3J5cHRvIGV4dGVuZHMgU3VidGxlQ3J5cHRvIHtcbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgYFByb21pc2VgIG9iamVjdCB0aGF0IHdpbGwgZGlnZXN0IGBkYXRhYCB1c2luZyB0aGUgc3BlY2lmaWVkXG4gICAqIGBBbGdvcml0aG1JZGVudGlmaWVyYC5cbiAgICovXG4gIGRpZ2VzdChcbiAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBBc3luY0l0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4gfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICApOiBQcm9taXNlPEFycmF5QnVmZmVyPjtcblxuICAvKipcbiAgICogUmV0dXJucyBhIEFycmF5QnVmZmVyIHdpdGggdGhlIHJlc3VsdCBvZiBkaWdlc3RpbmcgYGRhdGFgIHVzaW5nIHRoZVxuICAgKiBzcGVjaWZpZWQgYEFsZ29yaXRobUlkZW50aWZpZXJgLlxuICAgKi9cbiAgZGlnZXN0U3luYyhcbiAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICApOiBBcnJheUJ1ZmZlcjtcblxuICAvKiogQ29tcGFyZSB0byBhcnJheSBidWZmZXJzIG9yIGRhdGEgdmlld3MgaW4gYSB3YXkgdGhhdCB0aW1pbmcgYmFzZWQgYXR0YWNrc1xuICAgKiBjYW5ub3QgZ2FpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgcGxhdGZvcm0uICovXG4gIHRpbWluZ1NhZmVFcXVhbChcbiAgICBhOiBBcnJheUJ1ZmZlckxpa2UgfCBEYXRhVmlldyxcbiAgICBiOiBBcnJheUJ1ZmZlckxpa2UgfCBEYXRhVmlldyxcbiAgKTogYm9vbGVhbjtcbn1cblxuLyoqIEV4dGVuc2lvbnMgdG8gdGhlIFdlYiB7QGxpbmtjb2RlIENyeXB0b30gaW50ZXJmYWNlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdGRDcnlwdG8gZXh0ZW5kcyBDcnlwdG8ge1xuICByZWFkb25seSBzdWJ0bGU6IFN0ZFN1YnRsZUNyeXB0bztcbn1cblxuLyoqXG4gKiBBbiB3cmFwcGVyIGZvciBXZWJDcnlwdG8gYWRkaW5nIHN1cHBvcnQgZm9yIGFkZGl0aW9uYWwgbm9uLXN0YW5kYXJkXG4gKiBhbGdvcml0aG1zLCBidXQgZGVsZWdhdGluZyB0byB0aGUgcnVudGltZSBXZWJDcnlwdG8gaW1wbGVtZW50YXRpb24gd2hlbmV2ZXJcbiAqIHBvc3NpYmxlLlxuICovXG5jb25zdCBzdGRDcnlwdG86IFN0ZENyeXB0byA9ICgoeCkgPT4geCkoe1xuICAuLi53ZWJDcnlwdG8sXG4gIHN1YnRsZToge1xuICAgIC4uLndlYkNyeXB0by5zdWJ0bGUsXG5cbiAgICBhc3luYyBkaWdlc3QoXG4gICAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICAgIGRhdGE6IEJ1ZmZlclNvdXJjZSB8IEFzeW5jSXRlcmFibGU8QnVmZmVyU291cmNlPiB8IEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4sXG4gICAgKTogUHJvbWlzZTxBcnJheUJ1ZmZlcj4ge1xuICAgICAgY29uc3QgeyBuYW1lLCBsZW5ndGggfSA9IG5vcm1hbGl6ZUFsZ29yaXRobShhbGdvcml0aG0pO1xuICAgICAgY29uc3QgYnl0ZXMgPSBidWZmZXJTb3VyY2VCeXRlcyhkYXRhKTtcblxuICAgICAgaWYgKEZOVkFsZ29yaXRobXMuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIGZudihuYW1lLCBieXRlcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGRlbGVnYXRlIHRvIFdlYkNyeXB0byB3aGVuZXZlciBwb3NzaWJsZSxcbiAgICAgIGlmIChcbiAgICAgICAgLy8gaWYgdGhlIGFsZ29yaXRobSBpcyBzdXBwb3J0ZWQgYnkgdGhlIFdlYkNyeXB0byBzdGFuZGFyZCxcbiAgICAgICAgKHdlYkNyeXB0b0RpZ2VzdEFsZ29yaXRobXMgYXMgcmVhZG9ubHkgc3RyaW5nW10pLmluY2x1ZGVzKG5hbWUpICYmXG4gICAgICAgIC8vIGFuZCB0aGUgZGF0YSBpcyBhIHNpbmdsZSBidWZmZXIsXG4gICAgICAgIGJ5dGVzXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHdlYkNyeXB0by5zdWJ0bGUuZGlnZXN0KGFsZ29yaXRobSwgYnl0ZXMpO1xuICAgICAgfSBlbHNlIGlmICh3YXNtRGlnZXN0QWxnb3JpdGhtcy5pbmNsdWRlcyhuYW1lIGFzIFdhc21EaWdlc3RBbGdvcml0aG0pKSB7XG4gICAgICAgIGlmIChieXRlcykge1xuICAgICAgICAgIC8vIE90aGVyd2lzZSwgd2UgdXNlIG91ciBidW5kbGVkIFdhc20gaW1wbGVtZW50YXRpb24gdmlhIGRpZ2VzdFN5bmNcbiAgICAgICAgICAvLyBpZiBpdCBzdXBwb3J0cyB0aGUgYWxnb3JpdGhtLlxuICAgICAgICAgIHJldHVybiBzdGRDcnlwdG8uc3VidGxlLmRpZ2VzdFN5bmMoYWxnb3JpdGhtLCBieXRlcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoKGRhdGEgYXMgSXRlcmFibGU8QnVmZmVyU291cmNlPilbU3ltYm9sLml0ZXJhdG9yXSkge1xuICAgICAgICAgIHJldHVybiBzdGRDcnlwdG8uc3VidGxlLmRpZ2VzdFN5bmMoXG4gICAgICAgICAgICBhbGdvcml0aG0sXG4gICAgICAgICAgICBkYXRhIGFzIEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAoZGF0YSBhcyBBc3luY0l0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4pW1N5bWJvbC5hc3luY0l0ZXJhdG9yXVxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zdCB3YXNtQ3J5cHRvID0gaW5zdGFudGlhdGVXYXNtKCk7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyB3YXNtQ3J5cHRvLkRpZ2VzdENvbnRleHQobmFtZSk7XG4gICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBkYXRhIGFzIEFzeW5jSXRlcmFibGU8QnVmZmVyU291cmNlPikge1xuICAgICAgICAgICAgY29uc3QgY2h1bmtCeXRlcyA9IGJ1ZmZlclNvdXJjZUJ5dGVzKGNodW5rKTtcbiAgICAgICAgICAgIGlmICghY2h1bmtCeXRlcykge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZGF0YSBjb250YWluZWQgY2h1bmsgb2YgdGhlIHdyb25nIHR5cGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0LnVwZGF0ZShjaHVua0J5dGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGlnZXN0QW5kRHJvcChsZW5ndGgpLmJ1ZmZlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJkYXRhIG11c3QgYmUgYSBCdWZmZXJTb3VyY2Ugb3IgW0FzeW5jXUl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT5cIixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHdlYkNyeXB0by5zdWJ0bGU/LmRpZ2VzdCkge1xuICAgICAgICAvLyAoVHlwZVNjcmlwdCB0eXBlIGRlZmluaXRpb25zIHByb2hpYml0IHRoaXMgY2FzZS4pIElmIHRoZXkncmUgdHJ5aW5nXG4gICAgICAgIC8vIHRvIGNhbGwgYW4gYWxnb3JpdGhtIHdlIGRvbid0IHJlY29nbml6ZSwgcGFzcyBpdCBhbG9uZyB0byBXZWJDcnlwdG9cbiAgICAgICAgLy8gaW4gY2FzZSBpdCdzIGEgbm9uLXN0YW5kYXJkIGFsZ29yaXRobSBzdXBwb3J0ZWQgYnkgdGhlIHRoZSBydW50aW1lXG4gICAgICAgIC8vIHRoZXkncmUgdXNpbmcuXG4gICAgICAgIHJldHVybiB3ZWJDcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAgICAgICAgICBhbGdvcml0aG0sXG4gICAgICAgICAgKGRhdGEgYXMgdW5rbm93bikgYXMgVWludDhBcnJheSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYHVuc3VwcG9ydGVkIGRpZ2VzdCBhbGdvcml0aG06ICR7YWxnb3JpdGhtfWApO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBkaWdlc3RTeW5jKFxuICAgICAgYWxnb3JpdGhtOiBEaWdlc3RBbGdvcml0aG0sXG4gICAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICAgICk6IEFycmF5QnVmZmVyIHtcbiAgICAgIGFsZ29yaXRobSA9IG5vcm1hbGl6ZUFsZ29yaXRobShhbGdvcml0aG0pO1xuXG4gICAgICBjb25zdCBieXRlcyA9IGJ1ZmZlclNvdXJjZUJ5dGVzKGRhdGEpO1xuXG4gICAgICBpZiAoRk5WQWxnb3JpdGhtcy5pbmNsdWRlcyhhbGdvcml0aG0ubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIGZudihhbGdvcml0aG0ubmFtZSwgYnl0ZXMpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB3YXNtQ3J5cHRvID0gaW5zdGFudGlhdGVXYXNtKCk7XG4gICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgcmV0dXJuIHdhc21DcnlwdG8uZGlnZXN0KGFsZ29yaXRobS5uYW1lLCBieXRlcywgYWxnb3JpdGhtLmxlbmd0aClcbiAgICAgICAgICAuYnVmZmVyO1xuICAgICAgfSBlbHNlIGlmICgoZGF0YSBhcyBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+KVtTeW1ib2wuaXRlcmF0b3JdKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgd2FzbUNyeXB0by5EaWdlc3RDb250ZXh0KGFsZ29yaXRobS5uYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBjaHVuayBvZiBkYXRhIGFzIEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4pIHtcbiAgICAgICAgICBjb25zdCBjaHVua0J5dGVzID0gYnVmZmVyU291cmNlQnl0ZXMoY2h1bmspO1xuICAgICAgICAgIGlmICghY2h1bmtCeXRlcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImRhdGEgY29udGFpbmVkIGNodW5rIG9mIHRoZSB3cm9uZyB0eXBlXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250ZXh0LnVwZGF0ZShjaHVua0J5dGVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29udGV4dC5kaWdlc3RBbmREcm9wKGFsZ29yaXRobS5sZW5ndGgpLmJ1ZmZlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgXCJkYXRhIG11c3QgYmUgYSBCdWZmZXJTb3VyY2Ugb3IgSXRlcmFibGU8QnVmZmVyU291cmNlPlwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBUT0RPKEBraXRzb25rKTogcmV3b3JrIHdoZW4gaHR0cHM6Ly9naXRodWIuY29tL3czYy93ZWJjcnlwdG8vaXNzdWVzLzI3MCByZXNvbHZlZFxuICAgIHRpbWluZ1NhZmVFcXVhbCxcbiAgfSxcbn0pO1xuXG5jb25zdCBGTlZBbGdvcml0aG1zID0gW1wiRk5WMzJcIiwgXCJGTlYzMkFcIiwgXCJGTlY2NFwiLCBcIkZOVjY0QVwiXTtcblxuLyoqIERpZ2VzdCBhbGdvcml0aG1zIHN1cHBvcnRlZCBieSBXZWJDcnlwdG8uICovXG5jb25zdCB3ZWJDcnlwdG9EaWdlc3RBbGdvcml0aG1zID0gW1xuICBcIlNIQS0zODRcIixcbiAgXCJTSEEtMjU2XCIsXG4gIFwiU0hBLTUxMlwiLFxuICAvLyBpbnNlY3VyZSAobGVuZ3RoLWV4dGVuZGFibGUgYW5kIGNvbGxpZGFibGUpOlxuICBcIlNIQS0xXCIsXG5dIGFzIGNvbnN0O1xuXG50eXBlIEZOVkFsZ29yaXRobXMgPSBcIkZOVjMyXCIgfCBcIkZOVjMyQVwiIHwgXCJGTlY2NFwiIHwgXCJGTlY2NEFcIjtcbnR5cGUgRGlnZXN0QWxnb3JpdGhtTmFtZSA9IFdhc21EaWdlc3RBbGdvcml0aG0gfCBGTlZBbGdvcml0aG1zO1xuXG50eXBlIERpZ2VzdEFsZ29yaXRobU9iamVjdCA9IHtcbiAgbmFtZTogRGlnZXN0QWxnb3JpdGhtTmFtZTtcbiAgbGVuZ3RoPzogbnVtYmVyO1xufTtcblxudHlwZSBEaWdlc3RBbGdvcml0aG0gPSBEaWdlc3RBbGdvcml0aG1OYW1lIHwgRGlnZXN0QWxnb3JpdGhtT2JqZWN0O1xuXG5jb25zdCBub3JtYWxpemVBbGdvcml0aG0gPSAoYWxnb3JpdGhtOiBEaWdlc3RBbGdvcml0aG0pID0+XG4gICgodHlwZW9mIGFsZ29yaXRobSA9PT0gXCJzdHJpbmdcIikgPyB7IG5hbWU6IGFsZ29yaXRobS50b1VwcGVyQ2FzZSgpIH0gOiB7XG4gICAgLi4uYWxnb3JpdGhtLFxuICAgIG5hbWU6IGFsZ29yaXRobS5uYW1lLnRvVXBwZXJDYXNlKCksXG4gIH0pIGFzIERpZ2VzdEFsZ29yaXRobU9iamVjdDtcblxuZXhwb3J0IHsgc3RkQ3J5cHRvIGFzIGNyeXB0byB9O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FFRCxTQUVFLGdCQUFnQixJQUFJLG9CQUFvQixFQUN4QyxlQUFlLFFBQ1Ysd0JBQXdCLENBQUM7QUFDaEMsU0FBUyxlQUFlLFFBQVEsd0JBQXdCLENBQUM7QUFDekQsU0FBUyxHQUFHLFFBQVEsaUJBQWlCLENBQUM7QUFFdEMsU0FBOEIsUUFBUSxRQUFRLGVBQWUsQ0FBQztBQUU5RDs7O0NBR0MsR0FDRCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFLLENBQUM7UUFDOUIsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNyRCxVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzNDLE1BQU0sRUFBRTtZQUNOLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNwRCxVQUFVLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDMUQsU0FBUyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ3hELE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNsRCxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDcEQsU0FBUyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ3hELFdBQVcsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM1RCxTQUFTLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDeEQsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzlDLFNBQVMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUN4RCxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1NBQ3JEO0tBQ0YsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1B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