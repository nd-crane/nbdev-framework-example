// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Based on https://github.com/golang/go/blob/0452f9460f50f0f0aba18df43dc2b31906fb66cc/src/io/io.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
import { Buffer } from "./buffer.ts";
/** Reader utility for strings */ export class StringReader extends Buffer {
    constructor(s){
        super(new TextEncoder().encode(s).buffer);
    }
}
/** Reader utility for combining multiple readers */ export class MultiReader {
    #readers;
    #currentIndex = 0;
    constructor(readers){
        this.#readers = [
            ...readers
        ];
    }
    async read(p) {
        const r = this.#readers[this.#currentIndex];
        if (!r) return null;
        const result = await r.read(p);
        if (result === null) {
            this.#currentIndex++;
            return 0;
        }
        return result;
    }
}
/**
 * A `LimitedReader` reads from `reader` but limits the amount of data returned to just `limit` bytes.
 * Each call to `read` updates `limit` to reflect the new amount remaining.
 * `read` returns `null` when `limit` <= `0` or
 * when the underlying `reader` returns `null`.
 */ export class LimitedReader {
    constructor(reader, limit){
        this.reader = reader;
        this.limit = limit;
    }
    async read(p) {
        if (this.limit <= 0) {
            return null;
        }
        if (p.length > this.limit) {
            p = p.subarray(0, this.limit);
        }
        const n = await this.reader.read(p);
        if (n == null) {
            return null;
        }
        this.limit -= n;
        return n;
    }
    reader;
    limit;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2lvL3JlYWRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi8wNDUyZjk0NjBmNTBmMGYwYWJhMThkZjQzZGMyYjMxOTA2ZmI2NmNjL3NyYy9pby9pby5nb1xuLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZVxuLy8gbGljZW5zZSB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXIudHNcIjtcblxuLyoqIFJlYWRlciB1dGlsaXR5IGZvciBzdHJpbmdzICovXG5leHBvcnQgY2xhc3MgU3RyaW5nUmVhZGVyIGV4dGVuZHMgQnVmZmVyIHtcbiAgY29uc3RydWN0b3Ioczogc3RyaW5nKSB7XG4gICAgc3VwZXIobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpLmJ1ZmZlcik7XG4gIH1cbn1cblxuLyoqIFJlYWRlciB1dGlsaXR5IGZvciBjb21iaW5pbmcgbXVsdGlwbGUgcmVhZGVycyAqL1xuZXhwb3J0IGNsYXNzIE11bHRpUmVhZGVyIGltcGxlbWVudHMgRGVuby5SZWFkZXIge1xuICByZWFkb25seSAjcmVhZGVyczogRGVuby5SZWFkZXJbXTtcbiAgI2N1cnJlbnRJbmRleCA9IDA7XG5cbiAgY29uc3RydWN0b3IocmVhZGVyczogRGVuby5SZWFkZXJbXSkge1xuICAgIHRoaXMuI3JlYWRlcnMgPSBbLi4ucmVhZGVyc107XG4gIH1cblxuICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBjb25zdCByID0gdGhpcy4jcmVhZGVyc1t0aGlzLiNjdXJyZW50SW5kZXhdO1xuICAgIGlmICghcikgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgci5yZWFkKHApO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuI2N1cnJlbnRJbmRleCsrO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGBMaW1pdGVkUmVhZGVyYCByZWFkcyBmcm9tIGByZWFkZXJgIGJ1dCBsaW1pdHMgdGhlIGFtb3VudCBvZiBkYXRhIHJldHVybmVkIHRvIGp1c3QgYGxpbWl0YCBieXRlcy5cbiAqIEVhY2ggY2FsbCB0byBgcmVhZGAgdXBkYXRlcyBgbGltaXRgIHRvIHJlZmxlY3QgdGhlIG5ldyBhbW91bnQgcmVtYWluaW5nLlxuICogYHJlYWRgIHJldHVybnMgYG51bGxgIHdoZW4gYGxpbWl0YCA8PSBgMGAgb3JcbiAqIHdoZW4gdGhlIHVuZGVybHlpbmcgYHJlYWRlcmAgcmV0dXJucyBgbnVsbGAuXG4gKi9cbmV4cG9ydCBjbGFzcyBMaW1pdGVkUmVhZGVyIGltcGxlbWVudHMgRGVuby5SZWFkZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZGVyOiBEZW5vLlJlYWRlciwgcHVibGljIGxpbWl0OiBudW1iZXIpIHt9XG5cbiAgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgaWYgKHRoaXMubGltaXQgPD0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHAubGVuZ3RoID4gdGhpcy5saW1pdCkge1xuICAgICAgcCA9IHAuc3ViYXJyYXkoMCwgdGhpcy5saW1pdCk7XG4gICAgfVxuICAgIGNvbnN0IG4gPSBhd2FpdCB0aGlzLnJlYWRlci5yZWFkKHApO1xuICAgIGlmIChuID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMubGltaXQgLT0gbjtcbiAgICByZXR1cm4gbjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxtR0FBbUc7QUFDbkcsc0RBQXNEO0FBQ3RELHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFFakQsU0FBUyxNQUFNLFFBQVEsYUFBYSxDQUFDO0FBRXJDLCtCQUErQixHQUMvQixPQUFPLE1BQU0sWUFBWSxTQUFTLE1BQU07SUFDdEMsWUFBWSxDQUFTLENBQUU7UUFDckIsS0FBSyxDQUFDLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVDO0NBQ0Q7QUFFRCxrREFBa0QsR0FDbEQsT0FBTyxNQUFNLFdBQVc7SUFDYixDQUFDLE9BQU8sQ0FBZ0I7SUFDakMsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLFlBQVksT0FBc0IsQ0FBRTtRQUNsQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEdBQUc7ZUFBSSxPQUFPO1NBQUMsQ0FBQztJQUMvQjtVQUVNLElBQUksQ0FBQyxDQUFhLEVBQTBCO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsQUFBQztRQUM1QyxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQUFBQztRQUMvQixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7WUFDbkIsSUFBSSxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckIsT0FBTyxDQUFDLENBQUM7UUFDWCxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEI7Q0FDRDtBQUVEOzs7OztDQUtDLEdBQ0QsT0FBTyxNQUFNLGFBQWE7SUFDeEIsWUFBbUIsTUFBbUIsRUFBUyxLQUFhLENBQUU7UUFBM0MsY0FBQSxNQUFtQixDQUFBO1FBQVMsYUFBQSxLQUFhLENBQUE7SUFBRztVQUV6RCxJQUFJLENBQUMsQ0FBYSxFQUEwQjtRQUNoRCxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFO1lBQ25CLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ3pCLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUNELE1BQU0sQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEFBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO1lBQ2IsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7UUFDaEIsT0FBTyxDQUFDLENBQUM7SUFDWDtJQWpCbUIsTUFBbUI7SUFBUyxLQUFhO0NBa0I3RCJ9