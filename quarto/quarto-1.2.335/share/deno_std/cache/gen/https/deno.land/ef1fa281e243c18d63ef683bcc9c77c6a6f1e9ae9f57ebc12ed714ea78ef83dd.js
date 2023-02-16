// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
/**
 * A reader for dealing with low level text based protocols.
 *
 * Based on
 * [net/textproto](https://github.com/golang/go/tree/master/src/net/textproto).
 *
 * @module
 */ import { concat } from "../bytes/mod.ts";
// Constants created for DRY
const CHAR_SPACE = " ".charCodeAt(0);
const CHAR_TAB = "\t".charCodeAt(0);
const CHAR_COLON = ":".charCodeAt(0);
const WHITESPACES = [
    CHAR_SPACE,
    CHAR_TAB
];
const decoder = new TextDecoder();
// FROM https://github.com/denoland/deno/blob/b34628a26ab0187a827aa4ebe256e23178e25d39/cli/js/web/headers.ts#L9
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/g;
function str(buf) {
    return !buf ? "" : decoder.decode(buf);
}
export class TextProtoReader {
    constructor(r){
        this.r = r;
    }
    /** readLine() reads a single line from the TextProtoReader,
   * eliding the final \n or \r\n from the returned string.
   */ async readLine() {
        const s = await this.readLineSlice();
        return s === null ? null : str(s);
    }
    /** ReadMIMEHeader reads a MIME-style header from r.
   * The header is a sequence of possibly continued Key: Value lines
   * ending in a blank line.
   * The returned map m maps CanonicalMIMEHeaderKey(key) to a
   * sequence of values in the same order encountered in the input.
   *
   * For example, consider this input:
   *
   * 	My-Key: Value 1
   * 	Long-Key: Even
   * 	       Longer Value
   * 	My-Key: Value 2
   *
   * Given that input, ReadMIMEHeader returns the map:
   *
   * 	map[string][]string{
   * 		"My-Key": {"Value 1", "Value 2"},
   * 		"Long-Key": {"Even Longer Value"},
   * 	}
   */ async readMIMEHeader() {
        const m = new Headers();
        let line;
        // The first line cannot start with a leading space.
        let buf = await this.r.peek(1);
        if (buf === null) {
            return null;
        } else if (WHITESPACES.includes(buf[0])) {
            line = await this.readLineSlice();
        }
        buf = await this.r.peek(1);
        if (buf === null) {
            throw new Deno.errors.UnexpectedEof();
        } else if (WHITESPACES.includes(buf[0])) {
            throw new Deno.errors.InvalidData(`malformed MIME header initial line: ${str(line)}`);
        }
        while(true){
            const kv = await this.readLineSlice(); // readContinuedLineSlice
            if (kv === null) throw new Deno.errors.UnexpectedEof();
            if (kv.byteLength === 0) return m;
            // Key ends at first colon
            let i = kv.indexOf(CHAR_COLON);
            if (i < 0) {
                throw new Deno.errors.InvalidData(`malformed MIME header line: ${str(kv)}`);
            }
            //let key = canonicalMIMEHeaderKey(kv.subarray(0, endKey));
            const key = str(kv.subarray(0, i));
            // As per RFC 7230 field-name is a token,
            // tokens consist of one or more chars.
            // We could throw `Deno.errors.InvalidData` here,
            // but better to be liberal in what we
            // accept, so if we get an empty key, skip it.
            if (key == "") {
                continue;
            }
            // Skip initial spaces in value.
            i++; // skip colon
            while(i < kv.byteLength && WHITESPACES.includes(kv[i])){
                i++;
            }
            const value = str(kv.subarray(i)).replace(invalidHeaderCharRegex, encodeURI);
            // In case of invalid header we swallow the error
            // example: "Audio Mode" => invalid due to space in the key
            try {
                m.append(key, value);
            } catch  {
            // Pass
            }
        }
    }
    async readLineSlice() {
        let line = new Uint8Array(0);
        let r = null;
        do {
            r = await this.r.readLine();
            // TODO(ry):
            // This skipSpace() is definitely misplaced, but I don't know where it
            // comes from nor how to fix it.
            //TODO(SmashingQuasar): Kept skipSpace to preserve behavior but it should be looked into to check if it makes sense when this is used.
            if (r !== null && this.skipSpace(r.line) !== 0) {
                line = concat(line, r.line);
            }
        }while (r !== null && r.more)
        return r === null ? null : line;
    }
    skipSpace(l) {
        let n = 0;
        for (const val of l){
            if (!WHITESPACES.includes(val)) {
                n++;
            }
        }
        return n;
    }
    r;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3RleHRwcm90by9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDA5IFRoZSBHbyBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGVcbi8vIGxpY2Vuc2UgdGhhdCBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cblxuLyoqXG4gKiBBIHJlYWRlciBmb3IgZGVhbGluZyB3aXRoIGxvdyBsZXZlbCB0ZXh0IGJhc2VkIHByb3RvY29scy5cbiAqXG4gKiBCYXNlZCBvblxuICogW25ldC90ZXh0cHJvdG9dKGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vdHJlZS9tYXN0ZXIvc3JjL25ldC90ZXh0cHJvdG8pLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEJ1ZlJlYWRlciwgUmVhZExpbmVSZXN1bHQgfSBmcm9tIFwiLi4vaW8vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyBjb25jYXQgfSBmcm9tIFwiLi4vYnl0ZXMvbW9kLnRzXCI7XG5cbi8vIENvbnN0YW50cyBjcmVhdGVkIGZvciBEUllcbmNvbnN0IENIQVJfU1BBQ0U6IG51bWJlciA9IFwiIFwiLmNoYXJDb2RlQXQoMCk7XG5jb25zdCBDSEFSX1RBQjogbnVtYmVyID0gXCJcXHRcIi5jaGFyQ29kZUF0KDApO1xuY29uc3QgQ0hBUl9DT0xPTjogbnVtYmVyID0gXCI6XCIuY2hhckNvZGVBdCgwKTtcblxuY29uc3QgV0hJVEVTUEFDRVM6IEFycmF5PG51bWJlcj4gPSBbQ0hBUl9TUEFDRSwgQ0hBUl9UQUJdO1xuXG5jb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbi8vIEZST00gaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vYmxvYi9iMzQ2MjhhMjZhYjAxODdhODI3YWE0ZWJlMjU2ZTIzMTc4ZTI1ZDM5L2NsaS9qcy93ZWIvaGVhZGVycy50cyNMOVxuY29uc3QgaW52YWxpZEhlYWRlckNoYXJSZWdleCA9IC9bXlxcdFxceDIwLVxceDdlXFx4ODAtXFx4ZmZdL2c7XG5cbmZ1bmN0aW9uIHN0cihidWY6IFVpbnQ4QXJyYXkgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuICFidWYgPyBcIlwiIDogZGVjb2Rlci5kZWNvZGUoYnVmKTtcbn1cblxuZXhwb3J0IGNsYXNzIFRleHRQcm90b1JlYWRlciB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHI6IEJ1ZlJlYWRlcikge31cblxuICAvKiogcmVhZExpbmUoKSByZWFkcyBhIHNpbmdsZSBsaW5lIGZyb20gdGhlIFRleHRQcm90b1JlYWRlcixcbiAgICogZWxpZGluZyB0aGUgZmluYWwgXFxuIG9yIFxcclxcbiBmcm9tIHRoZSByZXR1cm5lZCBzdHJpbmcuXG4gICAqL1xuICBhc3luYyByZWFkTGluZSgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICBjb25zdCBzID0gYXdhaXQgdGhpcy5yZWFkTGluZVNsaWNlKCk7XG4gICAgcmV0dXJuIHMgPT09IG51bGwgPyBudWxsIDogc3RyKHMpO1xuICB9XG5cbiAgLyoqIFJlYWRNSU1FSGVhZGVyIHJlYWRzIGEgTUlNRS1zdHlsZSBoZWFkZXIgZnJvbSByLlxuICAgKiBUaGUgaGVhZGVyIGlzIGEgc2VxdWVuY2Ugb2YgcG9zc2libHkgY29udGludWVkIEtleTogVmFsdWUgbGluZXNcbiAgICogZW5kaW5nIGluIGEgYmxhbmsgbGluZS5cbiAgICogVGhlIHJldHVybmVkIG1hcCBtIG1hcHMgQ2Fub25pY2FsTUlNRUhlYWRlcktleShrZXkpIHRvIGFcbiAgICogc2VxdWVuY2Ugb2YgdmFsdWVzIGluIHRoZSBzYW1lIG9yZGVyIGVuY291bnRlcmVkIGluIHRoZSBpbnB1dC5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGNvbnNpZGVyIHRoaXMgaW5wdXQ6XG4gICAqXG4gICAqIFx0TXktS2V5OiBWYWx1ZSAxXG4gICAqIFx0TG9uZy1LZXk6IEV2ZW5cbiAgICogXHQgICAgICAgTG9uZ2VyIFZhbHVlXG4gICAqIFx0TXktS2V5OiBWYWx1ZSAyXG4gICAqXG4gICAqIEdpdmVuIHRoYXQgaW5wdXQsIFJlYWRNSU1FSGVhZGVyIHJldHVybnMgdGhlIG1hcDpcbiAgICpcbiAgICogXHRtYXBbc3RyaW5nXVtdc3RyaW5ne1xuICAgKiBcdFx0XCJNeS1LZXlcIjoge1wiVmFsdWUgMVwiLCBcIlZhbHVlIDJcIn0sXG4gICAqIFx0XHRcIkxvbmctS2V5XCI6IHtcIkV2ZW4gTG9uZ2VyIFZhbHVlXCJ9LFxuICAgKiBcdH1cbiAgICovXG4gIGFzeW5jIHJlYWRNSU1FSGVhZGVyKCk6IFByb21pc2U8SGVhZGVycyB8IG51bGw+IHtcbiAgICBjb25zdCBtID0gbmV3IEhlYWRlcnMoKTtcbiAgICBsZXQgbGluZTogVWludDhBcnJheSB8IHVuZGVmaW5lZDtcblxuICAgIC8vIFRoZSBmaXJzdCBsaW5lIGNhbm5vdCBzdGFydCB3aXRoIGEgbGVhZGluZyBzcGFjZS5cbiAgICBsZXQgYnVmID0gYXdhaXQgdGhpcy5yLnBlZWsoMSk7XG4gICAgaWYgKGJ1ZiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChXSElURVNQQUNFUy5pbmNsdWRlcyhidWZbMF0pKSB7XG4gICAgICBsaW5lID0gKGF3YWl0IHRoaXMucmVhZExpbmVTbGljZSgpKSBhcyBVaW50OEFycmF5O1xuICAgIH1cblxuICAgIGJ1ZiA9IGF3YWl0IHRoaXMuci5wZWVrKDEpO1xuICAgIGlmIChidWYgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gICAgfSBlbHNlIGlmIChXSElURVNQQUNFUy5pbmNsdWRlcyhidWZbMF0pKSB7XG4gICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICAgIGBtYWxmb3JtZWQgTUlNRSBoZWFkZXIgaW5pdGlhbCBsaW5lOiAke3N0cihsaW5lKX1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3Qga3YgPSBhd2FpdCB0aGlzLnJlYWRMaW5lU2xpY2UoKTsgLy8gcmVhZENvbnRpbnVlZExpbmVTbGljZVxuICAgICAgaWYgKGt2ID09PSBudWxsKSB0aHJvdyBuZXcgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZigpO1xuICAgICAgaWYgKGt2LmJ5dGVMZW5ndGggPT09IDApIHJldHVybiBtO1xuXG4gICAgICAvLyBLZXkgZW5kcyBhdCBmaXJzdCBjb2xvblxuICAgICAgbGV0IGkgPSBrdi5pbmRleE9mKENIQVJfQ09MT04pO1xuICAgICAgaWYgKGkgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcbiAgICAgICAgICBgbWFsZm9ybWVkIE1JTUUgaGVhZGVyIGxpbmU6ICR7c3RyKGt2KX1gLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICAvL2xldCBrZXkgPSBjYW5vbmljYWxNSU1FSGVhZGVyS2V5KGt2LnN1YmFycmF5KDAsIGVuZEtleSkpO1xuICAgICAgY29uc3Qga2V5ID0gc3RyKGt2LnN1YmFycmF5KDAsIGkpKTtcblxuICAgICAgLy8gQXMgcGVyIFJGQyA3MjMwIGZpZWxkLW5hbWUgaXMgYSB0b2tlbixcbiAgICAgIC8vIHRva2VucyBjb25zaXN0IG9mIG9uZSBvciBtb3JlIGNoYXJzLlxuICAgICAgLy8gV2UgY291bGQgdGhyb3cgYERlbm8uZXJyb3JzLkludmFsaWREYXRhYCBoZXJlLFxuICAgICAgLy8gYnV0IGJldHRlciB0byBiZSBsaWJlcmFsIGluIHdoYXQgd2VcbiAgICAgIC8vIGFjY2VwdCwgc28gaWYgd2UgZ2V0IGFuIGVtcHR5IGtleSwgc2tpcCBpdC5cbiAgICAgIGlmIChrZXkgPT0gXCJcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2tpcCBpbml0aWFsIHNwYWNlcyBpbiB2YWx1ZS5cbiAgICAgIGkrKzsgLy8gc2tpcCBjb2xvblxuICAgICAgd2hpbGUgKFxuICAgICAgICBpIDwga3YuYnl0ZUxlbmd0aCAmJlxuICAgICAgICAoV0hJVEVTUEFDRVMuaW5jbHVkZXMoa3ZbaV0pKVxuICAgICAgKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlID0gc3RyKGt2LnN1YmFycmF5KGkpKS5yZXBsYWNlKFxuICAgICAgICBpbnZhbGlkSGVhZGVyQ2hhclJlZ2V4LFxuICAgICAgICBlbmNvZGVVUkksXG4gICAgICApO1xuXG4gICAgICAvLyBJbiBjYXNlIG9mIGludmFsaWQgaGVhZGVyIHdlIHN3YWxsb3cgdGhlIGVycm9yXG4gICAgICAvLyBleGFtcGxlOiBcIkF1ZGlvIE1vZGVcIiA9PiBpbnZhbGlkIGR1ZSB0byBzcGFjZSBpbiB0aGUga2V5XG4gICAgICB0cnkge1xuICAgICAgICBtLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBQYXNzXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVhZExpbmVTbGljZSgpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgbGV0IGxpbmUgPSBuZXcgVWludDhBcnJheSgwKTtcbiAgICBsZXQgcjogUmVhZExpbmVSZXN1bHQgfCBudWxsID0gbnVsbDtcblxuICAgIGRvIHtcbiAgICAgIHIgPSBhd2FpdCB0aGlzLnIucmVhZExpbmUoKTtcbiAgICAgIC8vIFRPRE8ocnkpOlxuICAgICAgLy8gVGhpcyBza2lwU3BhY2UoKSBpcyBkZWZpbml0ZWx5IG1pc3BsYWNlZCwgYnV0IEkgZG9uJ3Qga25vdyB3aGVyZSBpdFxuICAgICAgLy8gY29tZXMgZnJvbSBub3IgaG93IHRvIGZpeCBpdC5cblxuICAgICAgLy9UT0RPKFNtYXNoaW5nUXVhc2FyKTogS2VwdCBza2lwU3BhY2UgdG8gcHJlc2VydmUgYmVoYXZpb3IgYnV0IGl0IHNob3VsZCBiZSBsb29rZWQgaW50byB0byBjaGVjayBpZiBpdCBtYWtlcyBzZW5zZSB3aGVuIHRoaXMgaXMgdXNlZC5cblxuICAgICAgaWYgKHIgIT09IG51bGwgJiYgdGhpcy5za2lwU3BhY2Uoci5saW5lKSAhPT0gMCkge1xuICAgICAgICBsaW5lID0gY29uY2F0KGxpbmUsIHIubGluZSk7XG4gICAgICB9XG4gICAgfSB3aGlsZSAociAhPT0gbnVsbCAmJiByLm1vcmUpO1xuXG4gICAgcmV0dXJuIHIgPT09IG51bGwgPyBudWxsIDogbGluZTtcbiAgfVxuXG4gIHNraXBTcGFjZShsOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICBsZXQgbiA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IHZhbCBvZiBsKSB7XG4gICAgICBpZiAoIVdISVRFU1BBQ0VTLmluY2x1ZGVzKHZhbCkpIHtcbiAgICAgICAgbisrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHNEQUFzRDtBQUN0RCxxREFBcUQ7QUFDckQsaURBQWlEO0FBRWpEOzs7Ozs7O0NBT0MsR0FFRCxBQUNBLFNBQVMsTUFBTSxRQUFRLGlCQUFpQixDQUFDO0FBRXpDLDRCQUE0QjtBQUM1QixNQUFNLFVBQVUsR0FBVyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxBQUFDO0FBQzdDLE1BQU0sUUFBUSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEFBQUM7QUFDNUMsTUFBTSxVQUFVLEdBQVcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQUFBQztBQUU3QyxNQUFNLFdBQVcsR0FBa0I7SUFBQyxVQUFVO0lBQUUsUUFBUTtDQUFDLEFBQUM7QUFFMUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQUFBQztBQUVsQywrR0FBK0c7QUFDL0csTUFBTSxzQkFBc0IsNkJBQTZCLEFBQUM7QUFFMUQsU0FBUyxHQUFHLENBQUMsR0FBa0MsRUFBVTtJQUN2RCxPQUFPLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFFRCxPQUFPLE1BQU0sZUFBZTtJQUMxQixZQUFxQixDQUFZLENBQUU7UUFBZCxTQUFBLENBQVksQ0FBQTtJQUFHO0lBRXBDOztHQUVDLFNBQ0ssUUFBUSxHQUEyQjtRQUN2QyxNQUFNLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQUFBQztRQUNyQyxPQUFPLENBQUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQztJQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJDLFNBQ0ssY0FBYyxHQUE0QjtRQUM5QyxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBRSxBQUFDO1FBQ3hCLElBQUksSUFBSSxBQUF3QixBQUFDO1FBRWpDLG9EQUFvRDtRQUNwRCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxBQUFDO1FBQy9CLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNoQixPQUFPLElBQUksQ0FBQztRQUNkLE9BQU8sSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3ZDLElBQUksR0FBSSxNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQUFBZSxDQUFDO1FBQ3BELENBQUM7UUFFRCxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDeEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUMvQixDQUFDLG9DQUFvQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQ25ELENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTyxJQUFJLENBQUU7WUFDWCxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQUFBQyxFQUFDLHlCQUF5QjtZQUNoRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdkQsSUFBSSxFQUFFLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVsQywwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQUFBQztZQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ1QsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUMvQixDQUFDLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQ3pDLENBQUM7WUFDSixDQUFDO1lBRUQsMkRBQTJEO1lBQzNELE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxBQUFDO1lBRW5DLHlDQUF5QztZQUN6Qyx1Q0FBdUM7WUFDdkMsaURBQWlEO1lBQ2pELHNDQUFzQztZQUN0Qyw4Q0FBOEM7WUFDOUMsSUFBSSxHQUFHLElBQUksRUFBRSxFQUFFO2dCQUNiLFNBQVM7WUFDWCxDQUFDO1lBRUQsZ0NBQWdDO1lBQ2hDLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYTtZQUNsQixNQUNFLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxJQUNoQixXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDLENBQzdCO2dCQUNBLENBQUMsRUFBRSxDQUFDO1lBQ04sQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUN2QyxzQkFBc0IsRUFDdEIsU0FBUyxDQUNWLEFBQUM7WUFFRixpREFBaUQ7WUFDakQsMkRBQTJEO1lBQzNELElBQUk7Z0JBQ0YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkIsRUFBRSxPQUFNO1lBQ04sT0FBTztZQUNULENBQUM7UUFDSCxDQUFDO0lBQ0g7VUFFTSxhQUFhLEdBQStCO1FBQ2hELElBQUksSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxBQUFDO1FBQzdCLElBQUksQ0FBQyxHQUEwQixJQUFJLEFBQUM7UUFFcEMsR0FBRztZQUNELENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUIsWUFBWTtZQUNaLHNFQUFzRTtZQUN0RSxnQ0FBZ0M7WUFFaEMsc0lBQXNJO1lBRXRJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzlDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1FBQ0gsUUFBUyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUU7UUFFL0IsT0FBTyxDQUFDLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbEM7SUFFQSxTQUFTLENBQUMsQ0FBYSxFQUFVO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsQUFBQztRQUVWLEtBQUssTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFFO1lBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM5QixDQUFDLEVBQUUsQ0FBQztZQUNOLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDWDtJQWpJcUIsQ0FBWTtDQWtJbEMifQ==