// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** Provides a iterable map interfaces for managing cookies server side.
 *
 * ### Examples
 *
 * To access the keys in a request and have any set keys available for creating
 * a response:
 *
 * ```ts
 * import {
 *   CookieMap,
 *   mergeHeaders
 * } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * const cookies = new CookieMap(request, { secure: true });
 * console.log(cookies.get("foo")); // logs "bar"
 * cookies.set("session", "1234567", { secure: true });
 *
 * const response = new Response("hello", {
 *   headers: mergeHeaders({
 *     "content-type": "text/plain",
 *   }, cookies),
 * });
 * ```
 *
 * To have automatic management of cryptographically signed cookies, you can use
 * the {@linkcode SecureCookieMap} instead of {@linkcode CookieMap}. The biggest
 * difference is that the methods operate async in order to be able to support
 * async signing and validation of cookies:
 *
 * ```ts
 * import {
 *   SecureCookieMap,
 *   mergeHeaders,
 *   type KeyRing,
 * } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * // The keys must implement the `KeyRing` interface.
 * declare const keys: KeyRing;
 *
 * const cookies = new SecureCookieMap(request, { keys, secure: true });
 * console.log(await cookies.get("foo")); // logs "bar"
 * // the cookie will be automatically signed using the supplied key ring.
 * await cookies.set("session", "1234567");
 *
 * const response = new Response("hello", {
 *   headers: mergeHeaders({
 *     "content-type": "text/plain",
 *   }, cookies),
 * });
 * ```
 *
 * In addition, if you have a {@linkcode Response} or {@linkcode Headers} for a
 * response at construction of the cookies object, they can be passed and any
 * set cookies will be added directly to those headers:
 *
 * ```ts
 * import { CookieMap } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * const response = new Response("hello", {
 *   headers: { "content-type": "text/plain" },
 * });
 *
 * const cookies = new CookieMap(request, { response });
 * console.log(cookies.get("foo")); // logs "bar"
 * cookies.set("session", "1234567");
 * ```
 *
 * @module
 */ // deno-lint-ignore no-control-regex
const FIELD_CONTENT_REGEXP = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
const KEY_REGEXP = /(?:^|;) *([^=]*)=[^;]*/g;
const SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;
const matchCache = {};
function getPattern(name) {
    if (name in matchCache) {
        return matchCache[name];
    }
    return matchCache[name] = new RegExp(`(?:^|;) *${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`);
}
function pushCookie(values, cookie) {
    if (cookie.overwrite) {
        for(let i = values.length - 1; i >= 0; i--){
            if (values[i].indexOf(`${cookie.name}=`) === 0) {
                values.splice(i, 1);
            }
        }
    }
    values.push(cookie.toHeaderValue());
}
function validateCookieProperty(key, value) {
    if (value && !FIELD_CONTENT_REGEXP.test(value)) {
        throw new TypeError(`The "${key}" of the cookie (${value}) is invalid.`);
    }
}
/** An internal abstraction to manage cookies. */ class Cookie {
    domain;
    expires;
    httpOnly = true;
    maxAge;
    name;
    overwrite = false;
    path = "/";
    sameSite = false;
    secure = false;
    signed;
    value;
    constructor(name, value, attributes){
        validateCookieProperty("name", name);
        this.name = name;
        validateCookieProperty("value", value);
        this.value = value ?? "";
        Object.assign(this, attributes);
        if (!this.value) {
            this.expires = new Date(0);
            this.maxAge = undefined;
        }
        validateCookieProperty("path", this.path);
        validateCookieProperty("domain", this.domain);
        if (this.sameSite && typeof this.sameSite === "string" && !SAME_SITE_REGEXP.test(this.sameSite)) {
            throw new TypeError(`The "sameSite" of the cookie ("${this.sameSite}") is invalid.`);
        }
    }
    toHeaderValue() {
        let value = this.toString();
        if (this.maxAge) {
            this.expires = new Date(Date.now() + this.maxAge * 1000);
        }
        if (this.path) {
            value += `; path=${this.path}`;
        }
        if (this.expires) {
            value += `; expires=${this.expires.toUTCString()}`;
        }
        if (this.domain) {
            value += `; domain=${this.domain}`;
        }
        if (this.sameSite) {
            value += `; samesite=${this.sameSite === true ? "strict" : this.sameSite.toLowerCase()}`;
        }
        if (this.secure) {
            value += "; secure";
        }
        if (this.httpOnly) {
            value += "; httponly";
        }
        return value;
    }
    toString() {
        return `${this.name}=${this.value}`;
    }
}
/** Symbol which is used in {@link mergeHeaders} to extract a
 * `[string | string][]` from an instance to generate the final set of
 * headers. */ export const cookieMapHeadersInitSymbol = Symbol.for("Deno.std.cookieMap.headersInit");
function isMergeable(value) {
    return value != null && typeof value === "object" && cookieMapHeadersInitSymbol in value;
}
/** Allows merging of various sources of headers into a final set of headers
 * which can be used in a {@linkcode Response}.
 *
 * Note, that unlike when passing a `Response` or {@linkcode Headers} used in a
 * response to {@linkcode CookieMap} or {@linkcode SecureCookieMap}, merging
 * will not ensure that there are no other `Set-Cookie` headers from other
 * sources, it will simply append the various headers together. */ export function mergeHeaders(...sources) {
    const headers = new Headers();
    for (const source of sources){
        let entries;
        if (source instanceof Headers) {
            entries = source;
        } else if ("headers" in source && source.headers instanceof Headers) {
            entries = source.headers;
        } else if (isMergeable(source)) {
            entries = source[cookieMapHeadersInitSymbol]();
        } else if (Array.isArray(source)) {
            entries = source;
        } else {
            entries = Object.entries(source);
        }
        for (const [key, value] of entries){
            headers.append(key, value);
        }
    }
    return headers;
}
const keys = Symbol("#keys");
const requestHeaders = Symbol("#requestHeaders");
const responseHeaders = Symbol("#responseHeaders");
const isSecure = Symbol("#secure");
const requestKeys = Symbol("#requestKeys");
/** An internal abstract class which provides common functionality for
 * {@link CookieMap} and {@link SecureCookieMap}. */ class CookieMapBase {
    [keys];
    [requestHeaders];
    [responseHeaders];
    [isSecure];
    [requestKeys]() {
        if (this[keys]) {
            return this[keys];
        }
        const result = this[keys] = [];
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return result;
        }
        let matches;
        while(matches = KEY_REGEXP.exec(header)){
            const [, key] = matches;
            result.push(key);
        }
        return result;
    }
    constructor(request, options){
        this[requestHeaders] = "headers" in request ? request.headers : request;
        const { secure =false , response =new Headers()  } = options;
        this[responseHeaders] = "headers" in response ? response.headers : response;
        this[isSecure] = secure;
    }
    /** A method used by {@linkcode mergeHeaders} to be able to merge
   * headers from various sources when forming a {@linkcode Response}. */ [cookieMapHeadersInitSymbol]() {
        const init = [];
        for (const [key, value] of this[responseHeaders]){
            if (key === "set-cookie") {
                init.push([
                    key,
                    value
                ]);
            }
        }
        return init;
    }
    [Symbol.for("Deno.customInspect")]() {
        return `${this.constructor.name} []`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, // deno-lint-ignore no-explicit-any
    options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1
        });
        return `${options.stylize(this.constructor.name, "special")} ${inspect([], newOptions)}`;
    }
}
/** Provides an way to manage cookies in a request and response on the server
 * as a single iterable collection.
 *
 * The methods and properties align to {@linkcode Map}. When constructing a
 * {@linkcode Request} or {@linkcode Headers} from the request need to be
 * provided, as well as optionally the {@linkcode Response} or `Headers` for the
 * response can be provided. Alternatively the {@linkcode mergeHeaders}
 * function can be used to generate a final set of headers for sending in the
 * response. */ export class CookieMap extends CookieMapBase {
    /** Contains the number of valid cookies in the request headers. */ get size() {
        return [
            ...this
        ].length;
    }
    constructor(request, options = {}){
        super(request, options);
    }
    /** Deletes all the cookies from the {@linkcode Request} in the response. */ clear(options = {}) {
        for (const key of this.keys()){
            this.set(key, null, options);
        }
    }
    /** Set a cookie to be deleted in the response.
   *
   * This is a convenience function for `set(key, null, options?)`.
   */ delete(key, options = {}) {
        this.set(key, null, options);
        return true;
    }
    /** Return the value of a matching key present in the {@linkcode Request}. If
   * the key is not present `undefined` is returned. */ get(key) {
        const headerValue = this[requestHeaders].get("cookie");
        if (!headerValue) {
            return undefined;
        }
        const match = headerValue.match(getPattern(key));
        if (!match) {
            return undefined;
        }
        const [, value] = match;
        return value;
    }
    /** Returns `true` if the matching key is present in the {@linkcode Request},
   * otherwise `false`. */ has(key) {
        const headerValue = this[requestHeaders].get("cookie");
        if (!headerValue) {
            return false;
        }
        return getPattern(key).test(headerValue);
    }
    /** Set a named cookie in the response. The optional
   * {@linkcode CookieMapSetDeleteOptions} are applied to the cookie being set.
   */ set(key, value, options = {}) {
        const resHeaders = this[responseHeaders];
        const values = [];
        for (const [key1, value1] of resHeaders){
            if (key1 === "set-cookie") {
                values.push(value1);
            }
        }
        const secure = this[isSecure];
        if (!secure && options.secure && !options.ignoreInsecure) {
            throw new TypeError("Cannot send secure cookie over unencrypted connection.");
        }
        const cookie = new Cookie(key, value, options);
        cookie.secure = options.secure ?? secure;
        pushCookie(values, cookie);
        resHeaders.delete("set-cookie");
        for (const value2 of values){
            resHeaders.append("set-cookie", value2);
        }
        return this;
    }
    /** Iterate over the cookie keys and values that are present in the
   * {@linkcode Request}. This is an alias of the `[Symbol.iterator]` method
   * present on the class. */ entries() {
        return this[Symbol.iterator]();
    }
    /** Iterate over the cookie keys that are present in the
   * {@linkcode Request}. */ *keys() {
        for (const [key] of this){
            yield key;
        }
    }
    /** Iterate over the cookie values that are present in the
   * {@linkcode Request}. */ *values() {
        for (const [, value] of this){
            yield value;
        }
    }
    /** Iterate over the cookie keys and values that are present in the
   * {@linkcode Request}. */ *[Symbol.iterator]() {
        const keys = this[requestKeys]();
        for (const key of keys){
            const value = this.get(key);
            if (value) {
                yield [
                    key,
                    value
                ];
            }
        }
    }
}
/** Provides an way to manage cookies in a request and response on the server
 * as a single iterable collection, as well as the ability to sign and verify
 * cookies to prevent tampering.
 *
 * The methods and properties align to {@linkcode Map}, but due to the need to
 * support asynchronous cryptographic keys, all the APIs operate async. When
 * constructing a {@linkcode Request} or {@linkcode Headers} from the request
 * need to be provided, as well as optionally the {@linkcode Response} or
 * `Headers` for the response can be provided. Alternatively the
 * {@linkcode mergeHeaders} function can be used to generate a final set
 * of headers for sending in the response.
 *
 * On construction, the optional set of keys implementing the
 * {@linkcode KeyRing} interface. While it is optional, if you don't plan to use
 * keys, you might want to consider using just the {@linkcode CookieMap}. */ export class SecureCookieMap extends CookieMapBase {
    #keyRing;
    /** Is set to a promise which resolves with the number of cookies in the
   * {@linkcode Request}. */ get size() {
        return (async ()=>{
            let size = 0;
            for await (const _ of this){
                size++;
            }
            return size;
        })();
    }
    constructor(request, options = {}){
        super(request, options);
        const { keys  } = options;
        this.#keyRing = keys;
    }
    /** Sets all cookies in the {@linkcode Request} to be deleted in the
   * response. */ async clear(options) {
        for await (const key of this.keys()){
            await this.set(key, null, options);
        }
    }
    /** Set a cookie to be deleted in the response.
   *
   * This is a convenience function for `set(key, null, options?)`. */ async delete(key, options = {}) {
        await this.set(key, null, options);
        return true;
    }
    /** Get the value of a cookie from the {@linkcode Request}.
   *
   * If the cookie is signed, and the signature is invalid, `undefined` will be
   * returned and the cookie will be set to be deleted in the response. If the
   * cookie is using an "old" key from the keyring, the cookie will be re-signed
   * with the current key and be added to the response to be updated. */ async get(key, options = {}) {
        const signed = options.signed ?? !!this.#keyRing;
        const nameSig = `${key}.sig`;
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return;
        }
        const match = header.match(getPattern(key));
        if (!match) {
            return;
        }
        const [, value] = match;
        if (!signed) {
            return value;
        }
        const digest = await this.get(nameSig, {
            signed: false
        });
        if (!digest) {
            return;
        }
        const data = `${key}=${value}`;
        if (!this.#keyRing) {
            throw new TypeError("key ring required for signed cookies");
        }
        const index = await this.#keyRing.indexOf(data, digest);
        if (index < 0) {
            await this.delete(nameSig, {
                path: "/",
                signed: false
            });
        } else {
            if (index) {
                await this.set(nameSig, await this.#keyRing.sign(data), {
                    signed: false
                });
            }
            return value;
        }
    }
    /** Returns `true` if the key is in the {@linkcode Request}.
   *
   * If the cookie is signed, and the signature is invalid, `false` will be
   * returned and the cookie will be set to be deleted in the response. If the
   * cookie is using an "old" key from the keyring, the cookie will be re-signed
   * with the current key and be added to the response to be updated. */ async has(key, options = {}) {
        const signed = options.signed ?? !!this.#keyRing;
        const nameSig = `${key}.sig`;
        const header = this[requestHeaders].get("cookie");
        if (!header) {
            return false;
        }
        const match = header.match(getPattern(key));
        if (!match) {
            return false;
        }
        if (!signed) {
            return true;
        }
        const digest = await this.get(nameSig, {
            signed: false
        });
        if (!digest) {
            return false;
        }
        const [, value] = match;
        const data = `${key}=${value}`;
        if (!this.#keyRing) {
            throw new TypeError("key ring required for signed cookies");
        }
        const index = await this.#keyRing.indexOf(data, digest);
        if (index < 0) {
            await this.delete(nameSig, {
                path: "/",
                signed: false
            });
            return false;
        } else {
            if (index) {
                await this.set(nameSig, await this.#keyRing.sign(data), {
                    signed: false
                });
            }
            return true;
        }
    }
    /** Set a cookie in the response headers.
   *
   * If there was a keyring set, cookies will be automatically signed, unless
   * overridden by the passed options. Cookies can be deleted by setting the
   * value to `null`. */ async set(key, value, options = {}) {
        const resHeaders = this[responseHeaders];
        const headers = [];
        for (const [key1, value1] of resHeaders.entries()){
            if (key1 === "set-cookie") {
                headers.push(value1);
            }
        }
        const secure = this[isSecure];
        const signed = options.signed ?? !!this.#keyRing;
        if (!secure && options.secure && !options.ignoreInsecure) {
            throw new TypeError("Cannot send secure cookie over unencrypted connection.");
        }
        const cookie = new Cookie(key, value, options);
        cookie.secure = options.secure ?? secure;
        pushCookie(headers, cookie);
        if (signed) {
            if (!this.#keyRing) {
                throw new TypeError("keys required for signed cookies.");
            }
            cookie.value = await this.#keyRing.sign(cookie.toString());
            cookie.name += ".sig";
            pushCookie(headers, cookie);
        }
        resHeaders.delete("set-cookie");
        for (const header of headers){
            resHeaders.append("set-cookie", header);
        }
        return this;
    }
    /** Iterate over the {@linkcode Request} cookies, yielding up a tuple
   * containing the key and value of each cookie.
   *
   * If a key ring was provided, only properly signed cookie keys and values are
   * returned. */ entries() {
        return this[Symbol.asyncIterator]();
    }
    /** Iterate over the request's cookies, yielding up the key of each cookie.
   *
   * If a keyring was provided, only properly signed cookie keys are
   * returned. */ async *keys() {
        for await (const [key] of this){
            yield key;
        }
    }
    /** Iterate over the request's cookies, yielding up the value of each cookie.
   *
   * If a keyring was provided, only properly signed cookie values are
   * returned. */ async *values() {
        for await (const [, value] of this){
            yield value;
        }
    }
    /** Iterate over the {@linkcode Request} cookies, yielding up a tuple
   * containing the key and value of each cookie.
   *
   * If a key ring was provided, only properly signed cookie keys and values are
   * returned. */ async *[Symbol.asyncIterator]() {
        const keys = this[requestKeys]();
        for (const key of keys){
            const value = await this.get(key);
            if (value) {
                yield [
                    key,
                    value
                ];
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2h0dHAvY29va2llX21hcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKiogUHJvdmlkZXMgYSBpdGVyYWJsZSBtYXAgaW50ZXJmYWNlcyBmb3IgbWFuYWdpbmcgY29va2llcyBzZXJ2ZXIgc2lkZS5cbiAqXG4gKiAjIyMgRXhhbXBsZXNcbiAqXG4gKiBUbyBhY2Nlc3MgdGhlIGtleXMgaW4gYSByZXF1ZXN0IGFuZCBoYXZlIGFueSBzZXQga2V5cyBhdmFpbGFibGUgZm9yIGNyZWF0aW5nXG4gKiBhIHJlc3BvbnNlOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQge1xuICogICBDb29raWVNYXAsXG4gKiAgIG1lcmdlSGVhZGVyc1xuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL2Nvb2tpZV9tYXAudHNcIjtcbiAqXG4gKiBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoXCJodHRwczovL2xvY2FsaG9zdC9cIiwge1xuICogICBoZWFkZXJzOiB7IFwiY29va2llXCI6IFwiZm9vPWJhcjsgYmFyPWJhejtcIn1cbiAqIH0pO1xuICpcbiAqIGNvbnN0IGNvb2tpZXMgPSBuZXcgQ29va2llTWFwKHJlcXVlc3QsIHsgc2VjdXJlOiB0cnVlIH0pO1xuICogY29uc29sZS5sb2coY29va2llcy5nZXQoXCJmb29cIikpOyAvLyBsb2dzIFwiYmFyXCJcbiAqIGNvb2tpZXMuc2V0KFwic2Vzc2lvblwiLCBcIjEyMzQ1NjdcIiwgeyBzZWN1cmU6IHRydWUgfSk7XG4gKlxuICogY29uc3QgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoXCJoZWxsb1wiLCB7XG4gKiAgIGhlYWRlcnM6IG1lcmdlSGVhZGVycyh7XG4gKiAgICAgXCJjb250ZW50LXR5cGVcIjogXCJ0ZXh0L3BsYWluXCIsXG4gKiAgIH0sIGNvb2tpZXMpLFxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBUbyBoYXZlIGF1dG9tYXRpYyBtYW5hZ2VtZW50IG9mIGNyeXB0b2dyYXBoaWNhbGx5IHNpZ25lZCBjb29raWVzLCB5b3UgY2FuIHVzZVxuICogdGhlIHtAbGlua2NvZGUgU2VjdXJlQ29va2llTWFwfSBpbnN0ZWFkIG9mIHtAbGlua2NvZGUgQ29va2llTWFwfS4gVGhlIGJpZ2dlc3RcbiAqIGRpZmZlcmVuY2UgaXMgdGhhdCB0aGUgbWV0aG9kcyBvcGVyYXRlIGFzeW5jIGluIG9yZGVyIHRvIGJlIGFibGUgdG8gc3VwcG9ydFxuICogYXN5bmMgc2lnbmluZyBhbmQgdmFsaWRhdGlvbiBvZiBjb29raWVzOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQge1xuICogICBTZWN1cmVDb29raWVNYXAsXG4gKiAgIG1lcmdlSGVhZGVycyxcbiAqICAgdHlwZSBLZXlSaW5nLFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odHRwL2Nvb2tpZV9tYXAudHNcIjtcbiAqXG4gKiBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoXCJodHRwczovL2xvY2FsaG9zdC9cIiwge1xuICogICBoZWFkZXJzOiB7IFwiY29va2llXCI6IFwiZm9vPWJhcjsgYmFyPWJhejtcIn1cbiAqIH0pO1xuICpcbiAqIC8vIFRoZSBrZXlzIG11c3QgaW1wbGVtZW50IHRoZSBgS2V5UmluZ2AgaW50ZXJmYWNlLlxuICogZGVjbGFyZSBjb25zdCBrZXlzOiBLZXlSaW5nO1xuICpcbiAqIGNvbnN0IGNvb2tpZXMgPSBuZXcgU2VjdXJlQ29va2llTWFwKHJlcXVlc3QsIHsga2V5cywgc2VjdXJlOiB0cnVlIH0pO1xuICogY29uc29sZS5sb2coYXdhaXQgY29va2llcy5nZXQoXCJmb29cIikpOyAvLyBsb2dzIFwiYmFyXCJcbiAqIC8vIHRoZSBjb29raWUgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHNpZ25lZCB1c2luZyB0aGUgc3VwcGxpZWQga2V5IHJpbmcuXG4gKiBhd2FpdCBjb29raWVzLnNldChcInNlc3Npb25cIiwgXCIxMjM0NTY3XCIpO1xuICpcbiAqIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKFwiaGVsbG9cIiwge1xuICogICBoZWFkZXJzOiBtZXJnZUhlYWRlcnMoe1xuICogICAgIFwiY29udGVudC10eXBlXCI6IFwidGV4dC9wbGFpblwiLFxuICogICB9LCBjb29raWVzKSxcbiAqIH0pO1xuICogYGBgXG4gKlxuICogSW4gYWRkaXRpb24sIGlmIHlvdSBoYXZlIGEge0BsaW5rY29kZSBSZXNwb25zZX0gb3Ige0BsaW5rY29kZSBIZWFkZXJzfSBmb3IgYVxuICogcmVzcG9uc2UgYXQgY29uc3RydWN0aW9uIG9mIHRoZSBjb29raWVzIG9iamVjdCwgdGhleSBjYW4gYmUgcGFzc2VkIGFuZCBhbnlcbiAqIHNldCBjb29raWVzIHdpbGwgYmUgYWRkZWQgZGlyZWN0bHkgdG8gdGhvc2UgaGVhZGVyczpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQ29va2llTWFwIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9jb29raWVfbWFwLnRzXCI7XG4gKlxuICogY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KFwiaHR0cHM6Ly9sb2NhbGhvc3QvXCIsIHtcbiAqICAgaGVhZGVyczogeyBcImNvb2tpZVwiOiBcImZvbz1iYXI7IGJhcj1iYXo7XCJ9XG4gKiB9KTtcbiAqXG4gKiBjb25zdCByZXNwb25zZSA9IG5ldyBSZXNwb25zZShcImhlbGxvXCIsIHtcbiAqICAgaGVhZGVyczogeyBcImNvbnRlbnQtdHlwZVwiOiBcInRleHQvcGxhaW5cIiB9LFxuICogfSk7XG4gKlxuICogY29uc3QgY29va2llcyA9IG5ldyBDb29raWVNYXAocmVxdWVzdCwgeyByZXNwb25zZSB9KTtcbiAqIGNvbnNvbGUubG9nKGNvb2tpZXMuZ2V0KFwiZm9vXCIpKTsgLy8gbG9ncyBcImJhclwiXG4gKiBjb29raWVzLnNldChcInNlc3Npb25cIiwgXCIxMjM0NTY3XCIpO1xuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29va2llTWFwT3B0aW9ucyB7XG4gIC8qKiBUaGUge0BsaW5rY29kZSBSZXNwb25zZX0gb3IgdGhlIGhlYWRlcnMgdGhhdCB3aWxsIGJlIHVzZWQgd2l0aCB0aGVcbiAgICogcmVzcG9uc2UuIFdoZW4gcHJvdmlkZWQsIGBTZXQtQ29va2llYCBoZWFkZXJzIHdpbGwgYmUgc2V0IGluIHRoZSBoZWFkZXJzXG4gICAqIHdoZW4gY29va2llcyBhcmUgc2V0IG9yIGRlbGV0ZWQgaW4gdGhlIG1hcC5cbiAgICpcbiAgICogQW4gYWx0ZXJuYXRpdmUgd2F5IHRvIGV4dHJhY3QgdGhlIGhlYWRlcnMgaXMgdG8gcGFzcyB0aGUgY29va2llIG1hcCB0byB0aGVcbiAgICoge0BsaW5rY29kZSBtZXJnZUhlYWRlcnN9IGZ1bmN0aW9uIHRvIG1lcmdlIHZhcmlvdXMgc291cmNlcyBvZiB0aGVcbiAgICogaGVhZGVycyB0byBiZSBwcm92aWRlZCB3aGVuIGNyZWF0aW5nIG9yIHVwZGF0aW5nIGEgcmVzcG9uc2UuXG4gICAqL1xuICByZXNwb25zZT86IEhlYWRlcmVkIHwgSGVhZGVycztcbiAgLyoqIEEgZmxhZyB0aGF0IGluZGljYXRlcyBpZiB0aGUgcmVxdWVzdCBhbmQgcmVzcG9uc2UgYXJlIGJlaW5nIGhhbmRsZWQgb3ZlclxuICAgKiBhIHNlY3VyZSAoZS5nLiBIVFRQUy9UTFMpIGNvbm5lY3Rpb24uIERlZmF1bHRzIHRvIGBmYWxzZWAuICovXG4gIHNlY3VyZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyB7XG4gIC8qKiBUaGUgZG9tYWluIHRvIHNjb3BlIHRoZSBjb29raWUgZm9yLiAqL1xuICBkb21haW4/OiBzdHJpbmc7XG4gIC8qKiBXaGVuIHRoZSBjb29raWUgZXhwaXJlcy4gKi9cbiAgZXhwaXJlcz86IERhdGU7XG4gIC8qKiBBIGZsYWcgdGhhdCBpbmRpY2F0ZXMgaWYgdGhlIGNvb2tpZSBpcyB2YWxpZCBvdmVyIEhUVFAgb25seS4gKi9cbiAgaHR0cE9ubHk/OiBib29sZWFuO1xuICAvKiogRG8gbm90IGVycm9yIHdoZW4gc2lnbmluZyBhbmQgdmFsaWRhdGluZyBjb29raWVzIG92ZXIgYW4gaW5zZWN1cmVcbiAgICogY29ubmVjdGlvbi4gKi9cbiAgaWdub3JlSW5zZWN1cmU/OiBib29sZWFuO1xuICAvKiogT3ZlcndyaXRlIGFuIGV4aXN0aW5nIHZhbHVlLiAqL1xuICBvdmVyd3JpdGU/OiBib29sZWFuO1xuICAvKiogVGhlIHBhdGggdGhlIGNvb2tpZSBpcyB2YWxpZCBmb3IuICovXG4gIHBhdGg/OiBzdHJpbmc7XG4gIC8qKiBPdmVycmlkZSB0aGUgZmxhZyB0aGF0IHdhcyBzZXQgd2hlbiB0aGUgaW5zdGFuY2Ugd2FzIGNyZWF0ZWQuICovXG4gIHNlY3VyZT86IGJvb2xlYW47XG4gIC8qKiBTZXQgdGhlIHNhbWUtc2l0ZSBpbmRpY2F0b3IgZm9yIGEgY29va2llLiAqL1xuICBzYW1lU2l0ZT86IFwic3RyaWN0XCIgfCBcImxheFwiIHwgXCJub25lXCIgfCBib29sZWFuO1xufVxuXG4vKiogQW4gb2JqZWN0IHdoaWNoIGNvbnRhaW5zIGEgYGhlYWRlcnNgIHByb3BlcnR5IHdoaWNoIGhhcyBhIHZhbHVlIG9mIGFuXG4gKiBpbnN0YW5jZSBvZiB7QGxpbmtjb2RlIEhlYWRlcnN9LCBsaWtlIHtAbGlua2NvZGUgUmVxdWVzdH0gYW5kXG4gKiB7QGxpbmtjb2RlIFJlc3BvbnNlfS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSGVhZGVyZWQge1xuICBoZWFkZXJzOiBIZWFkZXJzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lcmdlYWJsZSB7XG4gIFtjb29raWVNYXBIZWFkZXJzSW5pdFN5bWJvbF0oKTogW3N0cmluZywgc3RyaW5nXVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyZUNvb2tpZU1hcE9wdGlvbnMge1xuICAvKiogS2V5cyB3aGljaCB3aWxsIGJlIHVzZWQgdG8gdmFsaWRhdGUgYW5kIHNpZ24gY29va2llcy4gVGhlIGtleSByaW5nIHNob3VsZFxuICAgKiBpbXBsZW1lbnQgdGhlIHtAbGlua2NvZGUgS2V5UmluZ30gaW50ZXJmYWNlLiAqL1xuICBrZXlzPzogS2V5UmluZztcblxuICAvKiogVGhlIHtAbGlua2NvZGUgUmVzcG9uc2V9IG9yIHRoZSBoZWFkZXJzIHRoYXQgd2lsbCBiZSB1c2VkIHdpdGggdGhlXG4gICAqIHJlc3BvbnNlLiBXaGVuIHByb3ZpZGVkLCBgU2V0LUNvb2tpZWAgaGVhZGVycyB3aWxsIGJlIHNldCBpbiB0aGUgaGVhZGVyc1xuICAgKiB3aGVuIGNvb2tpZXMgYXJlIHNldCBvciBkZWxldGVkIGluIHRoZSBtYXAuXG4gICAqXG4gICAqIEFuIGFsdGVybmF0aXZlIHdheSB0byBleHRyYWN0IHRoZSBoZWFkZXJzIGlzIHRvIHBhc3MgdGhlIGNvb2tpZSBtYXAgdG8gdGhlXG4gICAqIHtAbGlua2NvZGUgbWVyZ2VIZWFkZXJzfSBmdW5jdGlvbiB0byBtZXJnZSB2YXJpb3VzIHNvdXJjZXMgb2YgdGhlXG4gICAqIGhlYWRlcnMgdG8gYmUgcHJvdmlkZWQgd2hlbiBjcmVhdGluZyBvciB1cGRhdGluZyBhIHJlc3BvbnNlLlxuICAgKi9cbiAgcmVzcG9uc2U/OiBIZWFkZXJlZCB8IEhlYWRlcnM7XG5cbiAgLyoqIEEgZmxhZyB0aGF0IGluZGljYXRlcyBpZiB0aGUgcmVxdWVzdCBhbmQgcmVzcG9uc2UgYXJlIGJlaW5nIGhhbmRsZWQgb3ZlclxuICAgKiBhIHNlY3VyZSAoZS5nLiBIVFRQUy9UTFMpIGNvbm5lY3Rpb24uIERlZmF1bHRzIHRvIGBmYWxzZWAuICovXG4gIHNlY3VyZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJlQ29va2llTWFwR2V0T3B0aW9ucyB7XG4gIC8qKiBPdmVycmlkZXMgdGhlIGZsYWcgdGhhdCB3YXMgc2V0IHdoZW4gdGhlIGluc3RhbmNlIHdhcyBjcmVhdGVkLiAqL1xuICBzaWduZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyZUNvb2tpZU1hcFNldERlbGV0ZU9wdGlvbnMge1xuICAvKiogVGhlIGRvbWFpbiB0byBzY29wZSB0aGUgY29va2llIGZvci4gKi9cbiAgZG9tYWluPzogc3RyaW5nO1xuICAvKiogV2hlbiB0aGUgY29va2llIGV4cGlyZXMuICovXG4gIGV4cGlyZXM/OiBEYXRlO1xuICAvKiogQSBmbGFnIHRoYXQgaW5kaWNhdGVzIGlmIHRoZSBjb29raWUgaXMgdmFsaWQgb3ZlciBIVFRQIG9ubHkuICovXG4gIGh0dHBPbmx5PzogYm9vbGVhbjtcbiAgLyoqIERvIG5vdCBlcnJvciB3aGVuIHNpZ25pbmcgYW5kIHZhbGlkYXRpbmcgY29va2llcyBvdmVyIGFuIGluc2VjdXJlXG4gICAqIGNvbm5lY3Rpb24uICovXG4gIGlnbm9yZUluc2VjdXJlPzogYm9vbGVhbjtcbiAgLyoqIE92ZXJ3cml0ZSBhbiBleGlzdGluZyB2YWx1ZS4gKi9cbiAgb3ZlcndyaXRlPzogYm9vbGVhbjtcbiAgLyoqIFRoZSBwYXRoIHRoZSBjb29raWUgaXMgdmFsaWQgZm9yLiAqL1xuICBwYXRoPzogc3RyaW5nO1xuICAvKiogT3ZlcnJpZGUgdGhlIGZsYWcgdGhhdCB3YXMgc2V0IHdoZW4gdGhlIGluc3RhbmNlIHdhcyBjcmVhdGVkLiAqL1xuICBzZWN1cmU/OiBib29sZWFuO1xuICAvKiogU2V0IHRoZSBzYW1lLXNpdGUgaW5kaWNhdG9yIGZvciBhIGNvb2tpZS4gKi9cbiAgc2FtZVNpdGU/OiBcInN0cmljdFwiIHwgXCJsYXhcIiB8IFwibm9uZVwiIHwgYm9vbGVhbjtcbiAgLyoqIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGJlaGF2aW9yIG9mIHNpZ25pbmcgdGhlIGNvb2tpZS4gKi9cbiAgc2lnbmVkPzogYm9vbGVhbjtcbn1cblxudHlwZSBDb29raWVBdHRyaWJ1dGVzID0gU2VjdXJlQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucztcblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1jb250cm9sLXJlZ2V4XG5jb25zdCBGSUVMRF9DT05URU5UX1JFR0VYUCA9IC9eW1xcdTAwMDlcXHUwMDIwLVxcdTAwN2VcXHUwMDgwLVxcdTAwZmZdKyQvO1xuY29uc3QgS0VZX1JFR0VYUCA9IC8oPzpefDspICooW149XSopPVteO10qL2c7XG5jb25zdCBTQU1FX1NJVEVfUkVHRVhQID0gL14oPzpsYXh8bm9uZXxzdHJpY3QpJC9pO1xuXG5jb25zdCBtYXRjaENhY2hlOiBSZWNvcmQ8c3RyaW5nLCBSZWdFeHA+ID0ge307XG5mdW5jdGlvbiBnZXRQYXR0ZXJuKG5hbWU6IHN0cmluZyk6IFJlZ0V4cCB7XG4gIGlmIChuYW1lIGluIG1hdGNoQ2FjaGUpIHtcbiAgICByZXR1cm4gbWF0Y2hDYWNoZVtuYW1lXTtcbiAgfVxuXG4gIHJldHVybiBtYXRjaENhY2hlW25hbWVdID0gbmV3IFJlZ0V4cChcbiAgICBgKD86Xnw7KSAqJHtuYW1lLnJlcGxhY2UoL1stW1xcXXt9KCkqKz8uLFxcXFxeJHwjXFxzXS9nLCBcIlxcXFwkJlwiKX09KFteO10qKWAsXG4gICk7XG59XG5cbmZ1bmN0aW9uIHB1c2hDb29raWUodmFsdWVzOiBzdHJpbmdbXSwgY29va2llOiBDb29raWUpIHtcbiAgaWYgKGNvb2tpZS5vdmVyd3JpdGUpIHtcbiAgICBmb3IgKGxldCBpID0gdmFsdWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAodmFsdWVzW2ldLmluZGV4T2YoYCR7Y29va2llLm5hbWV9PWApID09PSAwKSB7XG4gICAgICAgIHZhbHVlcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhbHVlcy5wdXNoKGNvb2tpZS50b0hlYWRlclZhbHVlKCkpO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUNvb2tpZVByb3BlcnR5KFxuICBrZXk6IHN0cmluZyxcbiAgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwsXG4pIHtcbiAgaWYgKHZhbHVlICYmICFGSUVMRF9DT05URU5UX1JFR0VYUC50ZXN0KHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFRoZSBcIiR7a2V5fVwiIG9mIHRoZSBjb29raWUgKCR7dmFsdWV9KSBpcyBpbnZhbGlkLmApO1xuICB9XG59XG5cbi8qKiBBbiBpbnRlcm5hbCBhYnN0cmFjdGlvbiB0byBtYW5hZ2UgY29va2llcy4gKi9cbmNsYXNzIENvb2tpZSBpbXBsZW1lbnRzIENvb2tpZUF0dHJpYnV0ZXMge1xuICBkb21haW4/OiBzdHJpbmc7XG4gIGV4cGlyZXM/OiBEYXRlO1xuICBodHRwT25seSA9IHRydWU7XG4gIG1heEFnZT86IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBvdmVyd3JpdGUgPSBmYWxzZTtcbiAgcGF0aCA9IFwiL1wiO1xuICBzYW1lU2l0ZTogXCJzdHJpY3RcIiB8IFwibGF4XCIgfCBcIm5vbmVcIiB8IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2VjdXJlID0gZmFsc2U7XG4gIHNpZ25lZD86IGJvb2xlYW47XG4gIHZhbHVlOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJpYnV0ZXM6IENvb2tpZUF0dHJpYnV0ZXMsXG4gICkge1xuICAgIHZhbGlkYXRlQ29va2llUHJvcGVydHkoXCJuYW1lXCIsIG5hbWUpO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdmFsaWRhdGVDb29raWVQcm9wZXJ0eShcInZhbHVlXCIsIHZhbHVlKTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWUgPz8gXCJcIjtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIGF0dHJpYnV0ZXMpO1xuICAgIGlmICghdGhpcy52YWx1ZSkge1xuICAgICAgdGhpcy5leHBpcmVzID0gbmV3IERhdGUoMCk7XG4gICAgICB0aGlzLm1heEFnZSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB2YWxpZGF0ZUNvb2tpZVByb3BlcnR5KFwicGF0aFwiLCB0aGlzLnBhdGgpO1xuICAgIHZhbGlkYXRlQ29va2llUHJvcGVydHkoXCJkb21haW5cIiwgdGhpcy5kb21haW4pO1xuICAgIGlmIChcbiAgICAgIHRoaXMuc2FtZVNpdGUgJiYgdHlwZW9mIHRoaXMuc2FtZVNpdGUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICFTQU1FX1NJVEVfUkVHRVhQLnRlc3QodGhpcy5zYW1lU2l0ZSlcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBUaGUgXCJzYW1lU2l0ZVwiIG9mIHRoZSBjb29raWUgKFwiJHt0aGlzLnNhbWVTaXRlfVwiKSBpcyBpbnZhbGlkLmAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHRvSGVhZGVyVmFsdWUoKTogc3RyaW5nIHtcbiAgICBsZXQgdmFsdWUgPSB0aGlzLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMubWF4QWdlKSB7XG4gICAgICB0aGlzLmV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgKHRoaXMubWF4QWdlICogMTAwMCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5wYXRoKSB7XG4gICAgICB2YWx1ZSArPSBgOyBwYXRoPSR7dGhpcy5wYXRofWA7XG4gICAgfVxuICAgIGlmICh0aGlzLmV4cGlyZXMpIHtcbiAgICAgIHZhbHVlICs9IGA7IGV4cGlyZXM9JHt0aGlzLmV4cGlyZXMudG9VVENTdHJpbmcoKX1gO1xuICAgIH1cbiAgICBpZiAodGhpcy5kb21haW4pIHtcbiAgICAgIHZhbHVlICs9IGA7IGRvbWFpbj0ke3RoaXMuZG9tYWlufWA7XG4gICAgfVxuICAgIGlmICh0aGlzLnNhbWVTaXRlKSB7XG4gICAgICB2YWx1ZSArPSBgOyBzYW1lc2l0ZT0ke1xuICAgICAgICB0aGlzLnNhbWVTaXRlID09PSB0cnVlID8gXCJzdHJpY3RcIiA6IHRoaXMuc2FtZVNpdGUudG9Mb3dlckNhc2UoKVxuICAgICAgfWA7XG4gICAgfVxuICAgIGlmICh0aGlzLnNlY3VyZSkge1xuICAgICAgdmFsdWUgKz0gXCI7IHNlY3VyZVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5odHRwT25seSkge1xuICAgICAgdmFsdWUgKz0gXCI7IGh0dHBvbmx5XCI7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX09JHt0aGlzLnZhbHVlfWA7XG4gIH1cbn1cblxuLyoqIFN5bWJvbCB3aGljaCBpcyB1c2VkIGluIHtAbGluayBtZXJnZUhlYWRlcnN9IHRvIGV4dHJhY3QgYVxuICogYFtzdHJpbmcgfCBzdHJpbmddW11gIGZyb20gYW4gaW5zdGFuY2UgdG8gZ2VuZXJhdGUgdGhlIGZpbmFsIHNldCBvZlxuICogaGVhZGVycy4gKi9cbmV4cG9ydCBjb25zdCBjb29raWVNYXBIZWFkZXJzSW5pdFN5bWJvbCA9IFN5bWJvbC5mb3IoXG4gIFwiRGVuby5zdGQuY29va2llTWFwLmhlYWRlcnNJbml0XCIsXG4pO1xuXG5mdW5jdGlvbiBpc01lcmdlYWJsZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIE1lcmdlYWJsZSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgIGNvb2tpZU1hcEhlYWRlcnNJbml0U3ltYm9sIGluIHZhbHVlO1xufVxuXG4vKiogQWxsb3dzIG1lcmdpbmcgb2YgdmFyaW91cyBzb3VyY2VzIG9mIGhlYWRlcnMgaW50byBhIGZpbmFsIHNldCBvZiBoZWFkZXJzXG4gKiB3aGljaCBjYW4gYmUgdXNlZCBpbiBhIHtAbGlua2NvZGUgUmVzcG9uc2V9LlxuICpcbiAqIE5vdGUsIHRoYXQgdW5saWtlIHdoZW4gcGFzc2luZyBhIGBSZXNwb25zZWAgb3Ige0BsaW5rY29kZSBIZWFkZXJzfSB1c2VkIGluIGFcbiAqIHJlc3BvbnNlIHRvIHtAbGlua2NvZGUgQ29va2llTWFwfSBvciB7QGxpbmtjb2RlIFNlY3VyZUNvb2tpZU1hcH0sIG1lcmdpbmdcbiAqIHdpbGwgbm90IGVuc3VyZSB0aGF0IHRoZXJlIGFyZSBubyBvdGhlciBgU2V0LUNvb2tpZWAgaGVhZGVycyBmcm9tIG90aGVyXG4gKiBzb3VyY2VzLCBpdCB3aWxsIHNpbXBseSBhcHBlbmQgdGhlIHZhcmlvdXMgaGVhZGVycyB0b2dldGhlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUhlYWRlcnMoXG4gIC4uLnNvdXJjZXM6IChIZWFkZXJlZCB8IEhlYWRlcnNJbml0IHwgTWVyZ2VhYmxlKVtdXG4pOiBIZWFkZXJzIHtcbiAgY29uc3QgaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG4gIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICBsZXQgZW50cmllczogSXRlcmFibGU8W3N0cmluZywgc3RyaW5nXT47XG4gICAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGVudHJpZXMgPSBzb3VyY2U7XG4gICAgfSBlbHNlIGlmIChcImhlYWRlcnNcIiBpbiBzb3VyY2UgJiYgc291cmNlLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBlbnRyaWVzID0gc291cmNlLmhlYWRlcnM7XG4gICAgfSBlbHNlIGlmIChpc01lcmdlYWJsZShzb3VyY2UpKSB7XG4gICAgICBlbnRyaWVzID0gc291cmNlW2Nvb2tpZU1hcEhlYWRlcnNJbml0U3ltYm9sXSgpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICBlbnRyaWVzID0gc291cmNlIGFzIFtzdHJpbmcsIHN0cmluZ11bXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHNvdXJjZSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGVudHJpZXMpIHtcbiAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaGVhZGVycztcbn1cblxuY29uc3Qga2V5cyA9IFN5bWJvbChcIiNrZXlzXCIpO1xuY29uc3QgcmVxdWVzdEhlYWRlcnMgPSBTeW1ib2woXCIjcmVxdWVzdEhlYWRlcnNcIik7XG5jb25zdCByZXNwb25zZUhlYWRlcnMgPSBTeW1ib2woXCIjcmVzcG9uc2VIZWFkZXJzXCIpO1xuY29uc3QgaXNTZWN1cmUgPSBTeW1ib2woXCIjc2VjdXJlXCIpO1xuY29uc3QgcmVxdWVzdEtleXMgPSBTeW1ib2woXCIjcmVxdWVzdEtleXNcIik7XG5cbi8qKiBBbiBpbnRlcm5hbCBhYnN0cmFjdCBjbGFzcyB3aGljaCBwcm92aWRlcyBjb21tb24gZnVuY3Rpb25hbGl0eSBmb3JcbiAqIHtAbGluayBDb29raWVNYXB9IGFuZCB7QGxpbmsgU2VjdXJlQ29va2llTWFwfS4gKi9cbmFic3RyYWN0IGNsYXNzIENvb2tpZU1hcEJhc2UgaW1wbGVtZW50cyBNZXJnZWFibGUge1xuICBba2V5c10/OiBzdHJpbmdbXTtcbiAgW3JlcXVlc3RIZWFkZXJzXTogSGVhZGVycztcbiAgW3Jlc3BvbnNlSGVhZGVyc106IEhlYWRlcnM7XG4gIFtpc1NlY3VyZV06IGJvb2xlYW47XG5cbiAgW3JlcXVlc3RLZXlzXSgpOiBzdHJpbmdbXSB7XG4gICAgaWYgKHRoaXNba2V5c10pIHtcbiAgICAgIHJldHVybiB0aGlzW2tleXNdO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzW2tleXNdID0gW10gYXMgc3RyaW5nW107XG4gICAgY29uc3QgaGVhZGVyID0gdGhpc1tyZXF1ZXN0SGVhZGVyc10uZ2V0KFwiY29va2llXCIpO1xuICAgIGlmICghaGVhZGVyKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBsZXQgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICB3aGlsZSAoKG1hdGNoZXMgPSBLRVlfUkVHRVhQLmV4ZWMoaGVhZGVyKSkpIHtcbiAgICAgIGNvbnN0IFssIGtleV0gPSBtYXRjaGVzO1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHJlcXVlc3Q6IEhlYWRlcnMgfCBIZWFkZXJlZCwgb3B0aW9uczogQ29va2llTWFwT3B0aW9ucykge1xuICAgIHRoaXNbcmVxdWVzdEhlYWRlcnNdID0gXCJoZWFkZXJzXCIgaW4gcmVxdWVzdCA/IHJlcXVlc3QuaGVhZGVycyA6IHJlcXVlc3Q7XG4gICAgY29uc3QgeyBzZWN1cmUgPSBmYWxzZSwgcmVzcG9uc2UgPSBuZXcgSGVhZGVycygpIH0gPSBvcHRpb25zO1xuICAgIHRoaXNbcmVzcG9uc2VIZWFkZXJzXSA9IFwiaGVhZGVyc1wiIGluIHJlc3BvbnNlID8gcmVzcG9uc2UuaGVhZGVycyA6IHJlc3BvbnNlO1xuICAgIHRoaXNbaXNTZWN1cmVdID0gc2VjdXJlO1xuICB9XG5cbiAgLyoqIEEgbWV0aG9kIHVzZWQgYnkge0BsaW5rY29kZSBtZXJnZUhlYWRlcnN9IHRvIGJlIGFibGUgdG8gbWVyZ2VcbiAgICogaGVhZGVycyBmcm9tIHZhcmlvdXMgc291cmNlcyB3aGVuIGZvcm1pbmcgYSB7QGxpbmtjb2RlIFJlc3BvbnNlfS4gKi9cbiAgW2Nvb2tpZU1hcEhlYWRlcnNJbml0U3ltYm9sXSgpOiBbc3RyaW5nLCBzdHJpbmddW10ge1xuICAgIGNvbnN0IGluaXQ6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHRoaXNbcmVzcG9uc2VIZWFkZXJzXSkge1xuICAgICAgaWYgKGtleSA9PT0gXCJzZXQtY29va2llXCIpIHtcbiAgICAgICAgaW5pdC5wdXNoKFtrZXksIHZhbHVlXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbml0O1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJEZW5vLmN1c3RvbUluc3BlY3RcIildKCkge1xuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IFtdYDtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwuaW5zcGVjdC5jdXN0b21cIildKFxuICAgIGRlcHRoOiBudW1iZXIsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBvcHRpb25zOiBhbnksXG4gICAgaW5zcGVjdDogKHZhbHVlOiB1bmtub3duLCBvcHRpb25zPzogdW5rbm93bikgPT4gc3RyaW5nLFxuICApIHtcbiAgICBpZiAoZGVwdGggPCAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKGBbJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9XWAsIFwic3BlY2lhbFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgZGVwdGg6IG9wdGlvbnMuZGVwdGggPT09IG51bGwgPyBudWxsIDogb3B0aW9ucy5kZXB0aCAtIDEsXG4gICAgfSk7XG4gICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZSh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIFwic3BlY2lhbFwiKX0gJHtcbiAgICAgIGluc3BlY3QoW10sIG5ld09wdGlvbnMpXG4gICAgfWA7XG4gIH1cbn1cblxuLyoqIFByb3ZpZGVzIGFuIHdheSB0byBtYW5hZ2UgY29va2llcyBpbiBhIHJlcXVlc3QgYW5kIHJlc3BvbnNlIG9uIHRoZSBzZXJ2ZXJcbiAqIGFzIGEgc2luZ2xlIGl0ZXJhYmxlIGNvbGxlY3Rpb24uXG4gKlxuICogVGhlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYWxpZ24gdG8ge0BsaW5rY29kZSBNYXB9LiBXaGVuIGNvbnN0cnVjdGluZyBhXG4gKiB7QGxpbmtjb2RlIFJlcXVlc3R9IG9yIHtAbGlua2NvZGUgSGVhZGVyc30gZnJvbSB0aGUgcmVxdWVzdCBuZWVkIHRvIGJlXG4gKiBwcm92aWRlZCwgYXMgd2VsbCBhcyBvcHRpb25hbGx5IHRoZSB7QGxpbmtjb2RlIFJlc3BvbnNlfSBvciBgSGVhZGVyc2AgZm9yIHRoZVxuICogcmVzcG9uc2UgY2FuIGJlIHByb3ZpZGVkLiBBbHRlcm5hdGl2ZWx5IHRoZSB7QGxpbmtjb2RlIG1lcmdlSGVhZGVyc31cbiAqIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgZmluYWwgc2V0IG9mIGhlYWRlcnMgZm9yIHNlbmRpbmcgaW4gdGhlXG4gKiByZXNwb25zZS4gKi9cbmV4cG9ydCBjbGFzcyBDb29raWVNYXAgZXh0ZW5kcyBDb29raWVNYXBCYXNlIHtcbiAgLyoqIENvbnRhaW5zIHRoZSBudW1iZXIgb2YgdmFsaWQgY29va2llcyBpbiB0aGUgcmVxdWVzdCBoZWFkZXJzLiAqL1xuICBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiBbLi4udGhpc10ubGVuZ3RoO1xuICB9XG5cbiAgY29uc3RydWN0b3IocmVxdWVzdDogSGVhZGVycyB8IEhlYWRlcmVkLCBvcHRpb25zOiBDb29raWVNYXBPcHRpb25zID0ge30pIHtcbiAgICBzdXBlcihyZXF1ZXN0LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBEZWxldGVzIGFsbCB0aGUgY29va2llcyBmcm9tIHRoZSB7QGxpbmtjb2RlIFJlcXVlc3R9IGluIHRoZSByZXNwb25zZS4gKi9cbiAgY2xlYXIob3B0aW9uczogQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyA9IHt9KSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgdGhpcy5rZXlzKCkpIHtcbiAgICAgIHRoaXMuc2V0KGtleSwgbnVsbCwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldCBhIGNvb2tpZSB0byBiZSBkZWxldGVkIGluIHRoZSByZXNwb25zZS5cbiAgICpcbiAgICogVGhpcyBpcyBhIGNvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBgc2V0KGtleSwgbnVsbCwgb3B0aW9ucz8pYC5cbiAgICovXG4gIGRlbGV0ZShrZXk6IHN0cmluZywgb3B0aW9uczogQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyA9IHt9KTogYm9vbGVhbiB7XG4gICAgdGhpcy5zZXQoa2V5LCBudWxsLCBvcHRpb25zKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gdGhlIHZhbHVlIG9mIGEgbWF0Y2hpbmcga2V5IHByZXNlbnQgaW4gdGhlIHtAbGlua2NvZGUgUmVxdWVzdH0uIElmXG4gICAqIHRoZSBrZXkgaXMgbm90IHByZXNlbnQgYHVuZGVmaW5lZGAgaXMgcmV0dXJuZWQuICovXG4gIGdldChrZXk6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgaGVhZGVyVmFsdWUgPSB0aGlzW3JlcXVlc3RIZWFkZXJzXS5nZXQoXCJjb29raWVcIik7XG4gICAgaWYgKCFoZWFkZXJWYWx1ZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkZXJWYWx1ZS5tYXRjaChnZXRQYXR0ZXJuKGtleSkpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IFssIHZhbHVlXSA9IG1hdGNoO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWF0Y2hpbmcga2V5IGlzIHByZXNlbnQgaW4gdGhlIHtAbGlua2NvZGUgUmVxdWVzdH0sXG4gICAqIG90aGVyd2lzZSBgZmFsc2VgLiAqL1xuICBoYXMoa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBoZWFkZXJWYWx1ZSA9IHRoaXNbcmVxdWVzdEhlYWRlcnNdLmdldChcImNvb2tpZVwiKTtcbiAgICBpZiAoIWhlYWRlclZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBnZXRQYXR0ZXJuKGtleSkudGVzdChoZWFkZXJWYWx1ZSk7XG4gIH1cblxuICAvKiogU2V0IGEgbmFtZWQgY29va2llIGluIHRoZSByZXNwb25zZS4gVGhlIG9wdGlvbmFsXG4gICAqIHtAbGlua2NvZGUgQ29va2llTWFwU2V0RGVsZXRlT3B0aW9uc30gYXJlIGFwcGxpZWQgdG8gdGhlIGNvb2tpZSBiZWluZyBzZXQuXG4gICAqL1xuICBzZXQoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgb3B0aW9uczogQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyA9IHt9LFxuICApOiB0aGlzIHtcbiAgICBjb25zdCByZXNIZWFkZXJzID0gdGhpc1tyZXNwb25zZUhlYWRlcnNdO1xuICAgIGNvbnN0IHZhbHVlczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiByZXNIZWFkZXJzKSB7XG4gICAgICBpZiAoa2V5ID09PSBcInNldC1jb29raWVcIikge1xuICAgICAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHNlY3VyZSA9IHRoaXNbaXNTZWN1cmVdO1xuXG4gICAgaWYgKCFzZWN1cmUgJiYgb3B0aW9ucy5zZWN1cmUgJiYgIW9wdGlvbnMuaWdub3JlSW5zZWN1cmUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IHNlbmQgc2VjdXJlIGNvb2tpZSBvdmVyIHVuZW5jcnlwdGVkIGNvbm5lY3Rpb24uXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGNvb2tpZSA9IG5ldyBDb29raWUoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgY29va2llLnNlY3VyZSA9IG9wdGlvbnMuc2VjdXJlID8/IHNlY3VyZTtcbiAgICBwdXNoQ29va2llKHZhbHVlcywgY29va2llKTtcblxuICAgIHJlc0hlYWRlcnMuZGVsZXRlKFwic2V0LWNvb2tpZVwiKTtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykge1xuICAgICAgcmVzSGVhZGVycy5hcHBlbmQoXCJzZXQtY29va2llXCIsIHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSBjb29raWUga2V5cyBhbmQgdmFsdWVzIHRoYXQgYXJlIHByZXNlbnQgaW4gdGhlXG4gICAqIHtAbGlua2NvZGUgUmVxdWVzdH0uIFRoaXMgaXMgYW4gYWxpYXMgb2YgdGhlIGBbU3ltYm9sLml0ZXJhdG9yXWAgbWV0aG9kXG4gICAqIHByZXNlbnQgb24gdGhlIGNsYXNzLiAqL1xuICBlbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgc3RyaW5nXT4ge1xuICAgIHJldHVybiB0aGlzW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgfVxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgdGhlIGNvb2tpZSBrZXlzIHRoYXQgYXJlIHByZXNlbnQgaW4gdGhlXG4gICAqIHtAbGlua2NvZGUgUmVxdWVzdH0uICovXG4gICprZXlzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgZm9yIChjb25zdCBba2V5XSBvZiB0aGlzKSB7XG4gICAgICB5aWVsZCBrZXk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgY29va2llIHZhbHVlcyB0aGF0IGFyZSBwcmVzZW50IGluIHRoZVxuICAgKiB7QGxpbmtjb2RlIFJlcXVlc3R9LiAqL1xuICAqdmFsdWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgZm9yIChjb25zdCBbLCB2YWx1ZV0gb2YgdGhpcykge1xuICAgICAgeWllbGQgdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgY29va2llIGtleXMgYW5kIHZhbHVlcyB0aGF0IGFyZSBwcmVzZW50IGluIHRoZVxuICAgKiB7QGxpbmtjb2RlIFJlcXVlc3R9LiAqL1xuICAqW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxbc3RyaW5nLCBzdHJpbmddPiB7XG4gICAgY29uc3Qga2V5cyA9IHRoaXNbcmVxdWVzdEtleXNdKCk7XG4gICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmdldChrZXkpO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHlpZWxkIFtrZXksIHZhbHVlXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqIFR5cGVzIG9mIGRhdGEgdGhhdCBjYW4gYmUgc2lnbmVkIGNyeXB0b2dyYXBoaWNhbGx5LiAqL1xuZXhwb3J0IHR5cGUgRGF0YSA9IHN0cmluZyB8IG51bWJlcltdIHwgQXJyYXlCdWZmZXIgfCBVaW50OEFycmF5O1xuXG4vKiogQW4gaW50ZXJmYWNlIHdoaWNoIGRlc2NyaWJlcyB0aGUgbWV0aG9kcyB0aGF0IHtAbGlua2NvZGUgU2VjdXJlQ29va2llTWFwfVxuICogdXNlcyB0byBzaWduIGFuZCB2ZXJpZnkgY29va2llcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5UmluZyB7XG4gIC8qKiBHaXZlbiBhIHNldCBvZiBkYXRhIGFuZCBhIGRpZ2VzdCwgcmV0dXJuIHRoZSBrZXkgaW5kZXggb2YgdGhlIGtleSB1c2VkXG4gICAqIHRvIHNpZ24gdGhlIGRhdGEuIFRoZSBpbmRleCBpcyAwIGJhc2VkLiBBIG5vbi1uZWdhdGl2ZSBudW1iZXIgaW5kaWNlcyB0aGVcbiAgICogZGlnZXN0IGlzIHZhbGlkIGFuZCBhIGtleSB3YXMgZm91bmQuICovXG4gIGluZGV4T2YoZGF0YTogRGF0YSwgZGlnZXN0OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4gfCBudW1iZXI7XG4gIC8qKiBTaWduIHRoZSBkYXRhLCByZXR1cm5pbmcgYSBzdHJpbmcgYmFzZWQgZGlnZXN0IG9mIHRoZSBkYXRhLiAqL1xuICBzaWduKGRhdGE6IERhdGEpOiBQcm9taXNlPHN0cmluZz4gfCBzdHJpbmc7XG4gIC8qKiBWZXJpZmllcyB0aGUgZGlnZXN0IG1hdGNoZXMgdGhlIHByb3ZpZGVkIGRhdGEsIGluZGljYXRpbmcgdGhlIGRhdGEgd2FzXG4gICAqIHNpZ25lZCBieSB0aGUga2V5cmluZyBhbmQgaGFzIG5vdCBiZWVuIHRhbXBlcmVkIHdpdGguICovXG4gIHZlcmlmeShkYXRhOiBEYXRhLCBkaWdlc3Q6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4gfCBib29sZWFuO1xufVxuXG4vKiogUHJvdmlkZXMgYW4gd2F5IHRvIG1hbmFnZSBjb29raWVzIGluIGEgcmVxdWVzdCBhbmQgcmVzcG9uc2Ugb24gdGhlIHNlcnZlclxuICogYXMgYSBzaW5nbGUgaXRlcmFibGUgY29sbGVjdGlvbiwgYXMgd2VsbCBhcyB0aGUgYWJpbGl0eSB0byBzaWduIGFuZCB2ZXJpZnlcbiAqIGNvb2tpZXMgdG8gcHJldmVudCB0YW1wZXJpbmcuXG4gKlxuICogVGhlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYWxpZ24gdG8ge0BsaW5rY29kZSBNYXB9LCBidXQgZHVlIHRvIHRoZSBuZWVkIHRvXG4gKiBzdXBwb3J0IGFzeW5jaHJvbm91cyBjcnlwdG9ncmFwaGljIGtleXMsIGFsbCB0aGUgQVBJcyBvcGVyYXRlIGFzeW5jLiBXaGVuXG4gKiBjb25zdHJ1Y3RpbmcgYSB7QGxpbmtjb2RlIFJlcXVlc3R9IG9yIHtAbGlua2NvZGUgSGVhZGVyc30gZnJvbSB0aGUgcmVxdWVzdFxuICogbmVlZCB0byBiZSBwcm92aWRlZCwgYXMgd2VsbCBhcyBvcHRpb25hbGx5IHRoZSB7QGxpbmtjb2RlIFJlc3BvbnNlfSBvclxuICogYEhlYWRlcnNgIGZvciB0aGUgcmVzcG9uc2UgY2FuIGJlIHByb3ZpZGVkLiBBbHRlcm5hdGl2ZWx5IHRoZVxuICoge0BsaW5rY29kZSBtZXJnZUhlYWRlcnN9IGZ1bmN0aW9uIGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGEgZmluYWwgc2V0XG4gKiBvZiBoZWFkZXJzIGZvciBzZW5kaW5nIGluIHRoZSByZXNwb25zZS5cbiAqXG4gKiBPbiBjb25zdHJ1Y3Rpb24sIHRoZSBvcHRpb25hbCBzZXQgb2Yga2V5cyBpbXBsZW1lbnRpbmcgdGhlXG4gKiB7QGxpbmtjb2RlIEtleVJpbmd9IGludGVyZmFjZS4gV2hpbGUgaXQgaXMgb3B0aW9uYWwsIGlmIHlvdSBkb24ndCBwbGFuIHRvIHVzZVxuICoga2V5cywgeW91IG1pZ2h0IHdhbnQgdG8gY29uc2lkZXIgdXNpbmcganVzdCB0aGUge0BsaW5rY29kZSBDb29raWVNYXB9LiAqL1xuZXhwb3J0IGNsYXNzIFNlY3VyZUNvb2tpZU1hcCBleHRlbmRzIENvb2tpZU1hcEJhc2Uge1xuICAja2V5UmluZz86IEtleVJpbmc7XG5cbiAgLyoqIElzIHNldCB0byBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCB0aGUgbnVtYmVyIG9mIGNvb2tpZXMgaW4gdGhlXG4gICAqIHtAbGlua2NvZGUgUmVxdWVzdH0uICovXG4gIGdldCBzaXplKCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgc2l6ZSA9IDA7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IF8gb2YgdGhpcykge1xuICAgICAgICBzaXplKys7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2l6ZTtcbiAgICB9KSgpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVxdWVzdDogSGVhZGVycyB8IEhlYWRlcmVkLFxuICAgIG9wdGlvbnM6IFNlY3VyZUNvb2tpZU1hcE9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgc3VwZXIocmVxdWVzdCwgb3B0aW9ucyk7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBvcHRpb25zO1xuICAgIHRoaXMuI2tleVJpbmcgPSBrZXlzO1xuICB9XG5cbiAgLyoqIFNldHMgYWxsIGNvb2tpZXMgaW4gdGhlIHtAbGlua2NvZGUgUmVxdWVzdH0gdG8gYmUgZGVsZXRlZCBpbiB0aGVcbiAgICogcmVzcG9uc2UuICovXG4gIGFzeW5jIGNsZWFyKG9wdGlvbnM6IFNlY3VyZUNvb2tpZU1hcFNldERlbGV0ZU9wdGlvbnMpIHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGtleSBvZiB0aGlzLmtleXMoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXQoa2V5LCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0IGEgY29va2llIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHJlc3BvbnNlLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGBzZXQoa2V5LCBudWxsLCBvcHRpb25zPylgLiAqL1xuICBhc3luYyBkZWxldGUoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogU2VjdXJlQ29va2llTWFwU2V0RGVsZXRlT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBhd2FpdCB0aGlzLnNldChrZXksIG51bGwsIG9wdGlvbnMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgdmFsdWUgb2YgYSBjb29raWUgZnJvbSB0aGUge0BsaW5rY29kZSBSZXF1ZXN0fS5cbiAgICpcbiAgICogSWYgdGhlIGNvb2tpZSBpcyBzaWduZWQsIGFuZCB0aGUgc2lnbmF0dXJlIGlzIGludmFsaWQsIGB1bmRlZmluZWRgIHdpbGwgYmVcbiAgICogcmV0dXJuZWQgYW5kIHRoZSBjb29raWUgd2lsbCBiZSBzZXQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcmVzcG9uc2UuIElmIHRoZVxuICAgKiBjb29raWUgaXMgdXNpbmcgYW4gXCJvbGRcIiBrZXkgZnJvbSB0aGUga2V5cmluZywgdGhlIGNvb2tpZSB3aWxsIGJlIHJlLXNpZ25lZFxuICAgKiB3aXRoIHRoZSBjdXJyZW50IGtleSBhbmQgYmUgYWRkZWQgdG8gdGhlIHJlc3BvbnNlIHRvIGJlIHVwZGF0ZWQuICovXG4gIGFzeW5jIGdldChcbiAgICBrZXk6IHN0cmluZyxcbiAgICBvcHRpb25zOiBTZWN1cmVDb29raWVNYXBHZXRPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3Qgc2lnbmVkID0gb3B0aW9ucy5zaWduZWQgPz8gISF0aGlzLiNrZXlSaW5nO1xuICAgIGNvbnN0IG5hbWVTaWcgPSBgJHtrZXl9LnNpZ2A7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzW3JlcXVlc3RIZWFkZXJzXS5nZXQoXCJjb29raWVcIik7XG4gICAgaWYgKCFoZWFkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkZXIubWF0Y2goZ2V0UGF0dGVybihrZXkpKTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IFssIHZhbHVlXSA9IG1hdGNoO1xuICAgIGlmICghc2lnbmVkKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGRpZ2VzdCA9IGF3YWl0IHRoaXMuZ2V0KG5hbWVTaWcsIHsgc2lnbmVkOiBmYWxzZSB9KTtcbiAgICBpZiAoIWRpZ2VzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gYCR7a2V5fT0ke3ZhbHVlfWA7XG4gICAgaWYgKCF0aGlzLiNrZXlSaW5nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5IHJpbmcgcmVxdWlyZWQgZm9yIHNpZ25lZCBjb29raWVzXCIpO1xuICAgIH1cbiAgICBjb25zdCBpbmRleCA9IGF3YWl0IHRoaXMuI2tleVJpbmcuaW5kZXhPZihkYXRhLCBkaWdlc3QpO1xuXG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgYXdhaXQgdGhpcy5kZWxldGUobmFtZVNpZywgeyBwYXRoOiBcIi9cIiwgc2lnbmVkOiBmYWxzZSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0KG5hbWVTaWcsIGF3YWl0IHRoaXMuI2tleVJpbmcuc2lnbihkYXRhKSwge1xuICAgICAgICAgIHNpZ25lZDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUga2V5IGlzIGluIHRoZSB7QGxpbmtjb2RlIFJlcXVlc3R9LlxuICAgKlxuICAgKiBJZiB0aGUgY29va2llIGlzIHNpZ25lZCwgYW5kIHRoZSBzaWduYXR1cmUgaXMgaW52YWxpZCwgYGZhbHNlYCB3aWxsIGJlXG4gICAqIHJldHVybmVkIGFuZCB0aGUgY29va2llIHdpbGwgYmUgc2V0IHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHJlc3BvbnNlLiBJZiB0aGVcbiAgICogY29va2llIGlzIHVzaW5nIGFuIFwib2xkXCIga2V5IGZyb20gdGhlIGtleXJpbmcsIHRoZSBjb29raWUgd2lsbCBiZSByZS1zaWduZWRcbiAgICogd2l0aCB0aGUgY3VycmVudCBrZXkgYW5kIGJlIGFkZGVkIHRvIHRoZSByZXNwb25zZSB0byBiZSB1cGRhdGVkLiAqL1xuICBhc3luYyBoYXMoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogU2VjdXJlQ29va2llTWFwR2V0T3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzaWduZWQgPSBvcHRpb25zLnNpZ25lZCA/PyAhIXRoaXMuI2tleVJpbmc7XG4gICAgY29uc3QgbmFtZVNpZyA9IGAke2tleX0uc2lnYDtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXNbcmVxdWVzdEhlYWRlcnNdLmdldChcImNvb2tpZVwiKTtcbiAgICBpZiAoIWhlYWRlcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtYXRjaCA9IGhlYWRlci5tYXRjaChnZXRQYXR0ZXJuKGtleSkpO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFzaWduZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBkaWdlc3QgPSBhd2FpdCB0aGlzLmdldChuYW1lU2lnLCB7IHNpZ25lZDogZmFsc2UgfSk7XG4gICAgaWYgKCFkaWdlc3QpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgWywgdmFsdWVdID0gbWF0Y2g7XG4gICAgY29uc3QgZGF0YSA9IGAke2tleX09JHt2YWx1ZX1gO1xuICAgIGlmICghdGhpcy4ja2V5UmluZykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleSByaW5nIHJlcXVpcmVkIGZvciBzaWduZWQgY29va2llc1wiKTtcbiAgICB9XG4gICAgY29uc3QgaW5kZXggPSBhd2FpdCB0aGlzLiNrZXlSaW5nLmluZGV4T2YoZGF0YSwgZGlnZXN0KTtcblxuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgIGF3YWl0IHRoaXMuZGVsZXRlKG5hbWVTaWcsIHsgcGF0aDogXCIvXCIsIHNpZ25lZDogZmFsc2UgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICBhd2FpdCB0aGlzLnNldChuYW1lU2lnLCBhd2FpdCB0aGlzLiNrZXlSaW5nLnNpZ24oZGF0YSksIHtcbiAgICAgICAgICBzaWduZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXQgYSBjb29raWUgaW4gdGhlIHJlc3BvbnNlIGhlYWRlcnMuXG4gICAqXG4gICAqIElmIHRoZXJlIHdhcyBhIGtleXJpbmcgc2V0LCBjb29raWVzIHdpbGwgYmUgYXV0b21hdGljYWxseSBzaWduZWQsIHVubGVzc1xuICAgKiBvdmVycmlkZGVuIGJ5IHRoZSBwYXNzZWQgb3B0aW9ucy4gQ29va2llcyBjYW4gYmUgZGVsZXRlZCBieSBzZXR0aW5nIHRoZVxuICAgKiB2YWx1ZSB0byBgbnVsbGAuICovXG4gIGFzeW5jIHNldChcbiAgICBrZXk6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICBvcHRpb25zOiBTZWN1cmVDb29raWVNYXBTZXREZWxldGVPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8dGhpcz4ge1xuICAgIGNvbnN0IHJlc0hlYWRlcnMgPSB0aGlzW3Jlc3BvbnNlSGVhZGVyc107XG4gICAgY29uc3QgaGVhZGVyczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiByZXNIZWFkZXJzLmVudHJpZXMoKSkge1xuICAgICAgaWYgKGtleSA9PT0gXCJzZXQtY29va2llXCIpIHtcbiAgICAgICAgaGVhZGVycy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc2VjdXJlID0gdGhpc1tpc1NlY3VyZV07XG4gICAgY29uc3Qgc2lnbmVkID0gb3B0aW9ucy5zaWduZWQgPz8gISF0aGlzLiNrZXlSaW5nO1xuXG4gICAgaWYgKCFzZWN1cmUgJiYgb3B0aW9ucy5zZWN1cmUgJiYgIW9wdGlvbnMuaWdub3JlSW5zZWN1cmUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiQ2Fubm90IHNlbmQgc2VjdXJlIGNvb2tpZSBvdmVyIHVuZW5jcnlwdGVkIGNvbm5lY3Rpb24uXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGNvb2tpZSA9IG5ldyBDb29raWUoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgY29va2llLnNlY3VyZSA9IG9wdGlvbnMuc2VjdXJlID8/IHNlY3VyZTtcbiAgICBwdXNoQ29va2llKGhlYWRlcnMsIGNvb2tpZSk7XG5cbiAgICBpZiAoc2lnbmVkKSB7XG4gICAgICBpZiAoIXRoaXMuI2tleVJpbmcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleXMgcmVxdWlyZWQgZm9yIHNpZ25lZCBjb29raWVzLlwiKTtcbiAgICAgIH1cbiAgICAgIGNvb2tpZS52YWx1ZSA9IGF3YWl0IHRoaXMuI2tleVJpbmcuc2lnbihjb29raWUudG9TdHJpbmcoKSk7XG4gICAgICBjb29raWUubmFtZSArPSBcIi5zaWdcIjtcbiAgICAgIHB1c2hDb29raWUoaGVhZGVycywgY29va2llKTtcbiAgICB9XG5cbiAgICByZXNIZWFkZXJzLmRlbGV0ZShcInNldC1jb29raWVcIik7XG4gICAgZm9yIChjb25zdCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgICAgcmVzSGVhZGVycy5hcHBlbmQoXCJzZXQtY29va2llXCIsIGhlYWRlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUge0BsaW5rY29kZSBSZXF1ZXN0fSBjb29raWVzLCB5aWVsZGluZyB1cCBhIHR1cGxlXG4gICAqIGNvbnRhaW5pbmcgdGhlIGtleSBhbmQgdmFsdWUgb2YgZWFjaCBjb29raWUuXG4gICAqXG4gICAqIElmIGEga2V5IHJpbmcgd2FzIHByb3ZpZGVkLCBvbmx5IHByb3Blcmx5IHNpZ25lZCBjb29raWUga2V5cyBhbmQgdmFsdWVzIGFyZVxuICAgKiByZXR1cm5lZC4gKi9cbiAgZW50cmllcygpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgc3RyaW5nXT4ge1xuICAgIHJldHVybiB0aGlzW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgcmVxdWVzdCdzIGNvb2tpZXMsIHlpZWxkaW5nIHVwIHRoZSBrZXkgb2YgZWFjaCBjb29raWUuXG4gICAqXG4gICAqIElmIGEga2V5cmluZyB3YXMgcHJvdmlkZWQsIG9ubHkgcHJvcGVybHkgc2lnbmVkIGNvb2tpZSBrZXlzIGFyZVxuICAgKiByZXR1cm5lZC4gKi9cbiAgYXN5bmMgKmtleXMoKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICAgIGZvciBhd2FpdCAoY29uc3QgW2tleV0gb2YgdGhpcykge1xuICAgICAgeWllbGQga2V5O1xuICAgIH1cbiAgfVxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgdGhlIHJlcXVlc3QncyBjb29raWVzLCB5aWVsZGluZyB1cCB0aGUgdmFsdWUgb2YgZWFjaCBjb29raWUuXG4gICAqXG4gICAqIElmIGEga2V5cmluZyB3YXMgcHJvdmlkZWQsIG9ubHkgcHJvcGVybHkgc2lnbmVkIGNvb2tpZSB2YWx1ZXMgYXJlXG4gICAqIHJldHVybmVkLiAqL1xuICBhc3luYyAqdmFsdWVzKCk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IFssIHZhbHVlXSBvZiB0aGlzKSB7XG4gICAgICB5aWVsZCB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSB7QGxpbmtjb2RlIFJlcXVlc3R9IGNvb2tpZXMsIHlpZWxkaW5nIHVwIGEgdHVwbGVcbiAgICogY29udGFpbmluZyB0aGUga2V5IGFuZCB2YWx1ZSBvZiBlYWNoIGNvb2tpZS5cbiAgICpcbiAgICogSWYgYSBrZXkgcmluZyB3YXMgcHJvdmlkZWQsIG9ubHkgcHJvcGVybHkgc2lnbmVkIGNvb2tpZSBrZXlzIGFuZCB2YWx1ZXMgYXJlXG4gICAqIHJldHVybmVkLiAqL1xuICBhc3luYyAqW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgc3RyaW5nXT4ge1xuICAgIGNvbnN0IGtleXMgPSB0aGlzW3JlcXVlc3RLZXlzXSgpO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgdGhpcy5nZXQoa2V5KTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB5aWVsZCBba2V5LCB2YWx1ZV07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWdGQyxHQUVELEFBK0ZBLG9DQUFvQztBQUNwQyxNQUFNLG9CQUFvQiwwQ0FBMEMsQUFBQztBQUNyRSxNQUFNLFVBQVUsNEJBQTRCLEFBQUM7QUFDN0MsTUFBTSxnQkFBZ0IsMkJBQTJCLEFBQUM7QUFFbEQsTUFBTSxVQUFVLEdBQTJCLEVBQUUsQUFBQztBQUM5QyxTQUFTLFVBQVUsQ0FBQyxJQUFZLEVBQVU7SUFDeEMsSUFBSSxJQUFJLElBQUksVUFBVSxFQUFFO1FBQ3RCLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FDbEMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sNkJBQTZCLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUN2RSxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLE1BQWdCLEVBQUUsTUFBYyxFQUFFO0lBQ3BELElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNwQixJQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUU7WUFDM0MsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM5QyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUM3QixHQUFXLEVBQ1gsS0FBZ0MsRUFDaEM7SUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUM5QyxNQUFNLElBQUksU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0FBQ0gsQ0FBQztBQUVELCtDQUErQyxHQUMvQyxNQUFNLE1BQU07SUFDVixNQUFNLENBQVU7SUFDaEIsT0FBTyxDQUFRO0lBQ2YsUUFBUSxHQUFHLElBQUksQ0FBQztJQUNoQixNQUFNLENBQVU7SUFDaEIsSUFBSSxDQUFTO0lBQ2IsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUNsQixJQUFJLEdBQUcsR0FBRyxDQUFDO0lBQ1gsUUFBUSxHQUF3QyxLQUFLLENBQUM7SUFDdEQsTUFBTSxHQUFHLEtBQUssQ0FBQztJQUNmLE1BQU0sQ0FBVztJQUNqQixLQUFLLENBQVM7SUFFZCxZQUNFLElBQVksRUFDWixLQUFvQixFQUNwQixVQUE0QixDQUM1QjtRQUNBLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztRQUMxQixDQUFDO1FBRUQsc0JBQXNCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLElBQ0UsSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUNsRCxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQ3JDO1lBQ0EsTUFBTSxJQUFJLFNBQVMsQ0FDakIsQ0FBQywrQkFBK0IsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUNoRSxDQUFDO1FBQ0osQ0FBQztJQUNIO0lBRUEsYUFBYSxHQUFXO1FBQ3RCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQUFBQztRQUM1QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQUFBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUNiLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2YsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUNuQixJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FDaEUsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLEtBQUssSUFBSSxVQUFVLENBQUM7UUFDdEIsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixLQUFLLElBQUksWUFBWSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmO0lBRUEsUUFBUSxHQUFXO1FBQ2pCLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3RDO0NBQ0Q7QUFFRDs7WUFFWSxHQUNaLE9BQU8sTUFBTSwwQkFBMEIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUNsRCxnQ0FBZ0MsQ0FDakMsQ0FBQztBQUVGLFNBQVMsV0FBVyxDQUFDLEtBQWMsRUFBc0I7SUFDdkQsT0FBTyxLQUFLLElBQUksSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFDL0MsMEJBQTBCLElBQUksS0FBSyxDQUFDO0FBQ3hDLENBQUM7QUFFRDs7Ozs7O2dFQU1nRSxHQUNoRSxPQUFPLFNBQVMsWUFBWSxDQUMxQixHQUFHLE9BQU8sQUFBd0MsRUFDekM7SUFDVCxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxBQUFDO0lBQzlCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxDQUFFO1FBQzVCLElBQUksT0FBTyxBQUE0QixBQUFDO1FBQ3hDLElBQUksTUFBTSxZQUFZLE9BQU8sRUFBRTtZQUM3QixPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ25CLE9BQU8sSUFBSSxTQUFTLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLFlBQVksT0FBTyxFQUFFO1lBQ25FLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQzNCLE9BQU8sSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDOUIsT0FBTyxHQUFHLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLENBQUM7UUFDakQsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDaEMsT0FBTyxHQUFHLE1BQU0sQUFBc0IsQ0FBQztRQUN6QyxPQUFPO1lBQ0wsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUU7WUFDbEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxBQUFDO0FBQzdCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxBQUFDO0FBQ2pELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxBQUFDO0FBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQUFBQztBQUNuQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEFBQUM7QUFFM0M7a0RBQ2tELEdBQ2xELE1BQWUsYUFBYTtJQUMxQixDQUFDLElBQUksQ0FBQyxDQUFZO0lBQ2xCLENBQUMsY0FBYyxDQUFDLENBQVU7SUFDMUIsQ0FBQyxlQUFlLENBQUMsQ0FBVTtJQUMzQixDQUFDLFFBQVEsQ0FBQyxDQUFVO0lBRXBCLENBQUMsV0FBVyxDQUFDLEdBQWE7UUFDeEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQUFBWSxBQUFDO1FBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEFBQUM7UUFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFDRCxJQUFJLE9BQU8sQUFBd0IsQUFBQztRQUNwQyxNQUFRLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFHO1lBQzFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxPQUFPLEFBQUM7WUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEI7SUFFQSxZQUFZLE9BQTJCLEVBQUUsT0FBeUIsQ0FBRTtRQUNsRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsU0FBUyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN4RSxNQUFNLEVBQUUsTUFBTSxFQUFHLEtBQUssQ0FBQSxFQUFFLFFBQVEsRUFBRyxJQUFJLE9BQU8sRUFBRSxDQUFBLEVBQUUsR0FBRyxPQUFPLEFBQUM7UUFDN0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLFNBQVMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7UUFDNUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQztJQUMxQjtJQUVBO3VFQUNxRSxHQUNyRSxDQUFDLDBCQUEwQixDQUFDLEdBQXVCO1FBQ2pELE1BQU0sSUFBSSxHQUF1QixFQUFFLEFBQUM7UUFDcEMsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBRTtZQUNoRCxJQUFJLEdBQUcsS0FBSyxZQUFZLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQUMsR0FBRztvQkFBRSxLQUFLO2lCQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2Q7SUFFQSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxHQUFHO1FBQ25DLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZDO0lBRUEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FDeEMsS0FBYSxFQUNiLG1DQUFtQztJQUNuQyxPQUFZLEVBQ1osT0FBc0QsRUFDdEQ7UUFDQSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRTtZQUM1QyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQztTQUN6RCxDQUFDLEFBQUM7UUFDSCxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFDM0QsT0FBTyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FDeEIsQ0FBQyxDQUFDO0lBQ0w7Q0FDRDtBQUVEOzs7Ozs7OzthQVFhLEdBQ2IsT0FBTyxNQUFNLFNBQVMsU0FBUyxhQUFhO0lBQzFDLGlFQUFpRSxPQUM3RCxJQUFJLEdBQVc7UUFDakIsT0FBTztlQUFJLElBQUk7U0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMxQjtJQUVBLFlBQVksT0FBMkIsRUFBRSxPQUF5QixHQUFHLEVBQUUsQ0FBRTtRQUN2RSxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFCO0lBRUEsMEVBQTBFLEdBQzFFLEtBQUssQ0FBQyxPQUFrQyxHQUFHLEVBQUUsRUFBRTtRQUM3QyxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBRTtZQUM3QixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0IsQ0FBQztJQUNIO0lBRUE7OztHQUdDLEdBQ0QsTUFBTSxDQUFDLEdBQVcsRUFBRSxPQUFrQyxHQUFHLEVBQUUsRUFBVztRQUNwRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUM7SUFDZDtJQUVBO3FEQUNtRCxHQUNuRCxHQUFHLENBQUMsR0FBVyxFQUFzQjtRQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxBQUFDO1FBQ3ZELElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDaEIsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEFBQUM7UUFDakQsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7UUFDRCxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxBQUFDO1FBQ3hCLE9BQU8sS0FBSyxDQUFDO0lBQ2Y7SUFFQTt3QkFDc0IsR0FDdEIsR0FBRyxDQUFDLEdBQVcsRUFBVztRQUN4QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxBQUFDO1FBQ3ZELElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDaEIsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO1FBQ0QsT0FBTyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNDO0lBRUE7O0dBRUMsR0FDRCxHQUFHLENBQ0QsR0FBVyxFQUNYLEtBQW9CLEVBQ3BCLE9BQWtDLEdBQUcsRUFBRSxFQUNqQztRQUNOLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQUFBQztRQUN6QyxNQUFNLE1BQU0sR0FBYSxFQUFFLEFBQUM7UUFDNUIsS0FBSyxNQUFNLENBQUMsSUFBRyxFQUFFLE1BQUssQ0FBQyxJQUFJLFVBQVUsQ0FBRTtZQUNyQyxJQUFJLElBQUcsS0FBSyxZQUFZLEVBQUU7Z0JBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBSyxDQUFDLENBQUM7WUFDckIsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEFBQUM7UUFFOUIsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRTtZQUN4RCxNQUFNLElBQUksU0FBUyxDQUNqQix3REFBd0QsQ0FDekQsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxBQUFDO1FBQy9DLE1BQU0sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUM7UUFDekMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUUzQixVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hDLEtBQUssTUFBTSxNQUFLLElBQUksTUFBTSxDQUFFO1lBQzFCLFVBQVUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLE1BQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkO0lBRUE7OzJCQUV5QixHQUN6QixPQUFPLEdBQXVDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO0lBQ2pDO0lBRUE7MEJBQ3dCLElBQ3ZCLElBQUksR0FBNkI7UUFDaEMsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFFO1lBQ3hCLE1BQU0sR0FBRyxDQUFDO1FBQ1osQ0FBQztJQUNIO0lBRUE7MEJBQ3dCLElBQ3ZCLE1BQU0sR0FBNkI7UUFDbEMsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFFO1lBQzVCLE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNIO0lBRUE7MEJBQ3dCLElBQ3ZCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUF1QztRQUN2RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQUFBQztRQUNqQyxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBRTtZQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxBQUFDO1lBQzVCLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU07b0JBQUMsR0FBRztvQkFBRSxLQUFLO2lCQUFDLENBQUM7WUFDckIsQ0FBQztRQUNILENBQUM7SUFDSDtDQUNEO0FBbUJEOzs7Ozs7Ozs7Ozs7OzswRUFjMEUsR0FDMUUsT0FBTyxNQUFNLGVBQWUsU0FBUyxhQUFhO0lBQ2hELENBQUMsT0FBTyxDQUFXO0lBRW5COzBCQUN3QixPQUNwQixJQUFJLEdBQW9CO1FBQzFCLE9BQU8sQ0FBQyxVQUFZO1lBQ2xCLElBQUksSUFBSSxHQUFHLENBQUMsQUFBQztZQUNiLFdBQVcsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFFO2dCQUMxQixJQUFJLEVBQUUsQ0FBQztZQUNULENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDUDtJQUVBLFlBQ0UsT0FBMkIsRUFDM0IsT0FBK0IsR0FBRyxFQUFFLENBQ3BDO1FBQ0EsS0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4QixNQUFNLEVBQUUsSUFBSSxDQUFBLEVBQUUsR0FBRyxPQUFPLEFBQUM7UUFDekIsSUFBSSxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztJQUN2QjtJQUVBO2VBQ2EsU0FDUCxLQUFLLENBQUMsT0FBd0MsRUFBRTtRQUNwRCxXQUFXLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBRTtZQUNuQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyQyxDQUFDO0lBQ0g7SUFFQTs7b0VBRWtFLFNBQzVELE1BQU0sQ0FDVixHQUFXLEVBQ1gsT0FBd0MsR0FBRyxFQUFFLEVBQzNCO1FBQ2xCLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLE9BQU8sSUFBSSxDQUFDO0lBQ2Q7SUFFQTs7Ozs7c0VBS29FLFNBQzlELEdBQUcsQ0FDUCxHQUFXLEVBQ1gsT0FBa0MsR0FBRyxFQUFFLEVBQ1Y7UUFDN0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxBQUFDO1FBQ2pELE1BQU0sT0FBTyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEFBQUM7UUFFN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQUFBQztRQUNsRCxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTztRQUNULENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxBQUFDO1FBQzVDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixPQUFPO1FBQ1QsQ0FBQztRQUNELE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLEFBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUU7WUFBRSxNQUFNLEVBQUUsS0FBSztTQUFFLENBQUMsQUFBQztRQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTztRQUNULENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxBQUFDO1FBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDbEIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxBQUFDO1FBRXhELElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtZQUNiLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7Z0JBQUUsSUFBSSxFQUFFLEdBQUc7Z0JBQUUsTUFBTSxFQUFFLEtBQUs7YUFBRSxDQUFDLENBQUM7UUFDM0QsT0FBTztZQUNMLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN0RCxNQUFNLEVBQUUsS0FBSztpQkFDZCxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0lBQ0g7SUFFQTs7Ozs7c0VBS29FLFNBQzlELEdBQUcsQ0FDUCxHQUFXLEVBQ1gsT0FBa0MsR0FBRyxFQUFFLEVBQ3JCO1FBQ2xCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQUFBQztRQUNqRCxNQUFNLE9BQU8sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxBQUFDO1FBRTdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEFBQUM7UUFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEFBQUM7UUFDNUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUNELElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFO1lBQUUsTUFBTSxFQUFFLEtBQUs7U0FBRSxDQUFDLEFBQUM7UUFDMUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUNELE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLEFBQUM7UUFDeEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQUFBQztRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxTQUFTLENBQUMsc0NBQXNDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQUFBQztRQUV4RCxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDYixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUFFLElBQUksRUFBRSxHQUFHO2dCQUFFLE1BQU0sRUFBRSxLQUFLO2FBQUUsQ0FBQyxDQUFDO1lBQ3pELE9BQU8sS0FBSyxDQUFDO1FBQ2YsT0FBTztZQUNMLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN0RCxNQUFNLEVBQUUsS0FBSztpQkFDZCxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO0lBQ0g7SUFFQTs7OztzQkFJb0IsU0FDZCxHQUFHLENBQ1AsR0FBVyxFQUNYLEtBQW9CLEVBQ3BCLE9BQXdDLEdBQUcsRUFBRSxFQUM5QjtRQUNmLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQUFBQztRQUN6QyxNQUFNLE9BQU8sR0FBYSxFQUFFLEFBQUM7UUFDN0IsS0FBSyxNQUFNLENBQUMsSUFBRyxFQUFFLE1BQUssQ0FBQyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBRTtZQUMvQyxJQUFJLElBQUcsS0FBSyxZQUFZLEVBQUU7Z0JBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBSyxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEFBQUM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxBQUFDO1FBRWpELElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDeEQsTUFBTSxJQUFJLFNBQVMsQ0FDakIsd0RBQXdELENBQ3pELENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQUFBQztRQUMvQyxNQUFNLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDO1FBQ3pDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFNUIsSUFBSSxNQUFNLEVBQUU7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFO2dCQUNsQixNQUFNLElBQUksU0FBUyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUNELE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDO1lBQ3RCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELFVBQVUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDaEMsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLENBQUU7WUFDNUIsVUFBVSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2Q7SUFFQTs7OztlQUlhLEdBQ2IsT0FBTyxHQUE0QztRQUNqRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztJQUN0QztJQUVBOzs7ZUFHYSxVQUNOLElBQUksR0FBa0M7UUFDM0MsV0FBVyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFFO1lBQzlCLE1BQU0sR0FBRyxDQUFDO1FBQ1osQ0FBQztJQUNIO0lBRUE7OztlQUdhLFVBQ04sTUFBTSxHQUFrQztRQUM3QyxXQUFXLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUU7WUFDbEMsTUFBTSxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0g7SUFFQTs7OztlQUlhLFVBQ04sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQTRDO1FBQ3ZFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxBQUFDO1FBQ2pDLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFFO1lBQ3RCLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQUFBQztZQUNsQyxJQUFJLEtBQUssRUFBRTtnQkFDVCxNQUFNO29CQUFDLEdBQUc7b0JBQUUsS0FBSztpQkFBQyxDQUFDO1lBQ3JCLENBQUM7UUFDSCxDQUFDO0lBQ0g7Q0FDRCJ9