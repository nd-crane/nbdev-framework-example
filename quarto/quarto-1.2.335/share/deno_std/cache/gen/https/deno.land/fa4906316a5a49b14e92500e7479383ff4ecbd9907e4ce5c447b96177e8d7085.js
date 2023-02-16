// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { instantiate } from "./lib/deno_hash.generated.mjs";
import * as hex from "../../encoding/hex.ts";
import * as base64 from "../../encoding/base64.ts";
export class Hash {
    #hash;
    #digested;
    constructor(algorithm){
        this.#hash = instantiate().create_hash(algorithm);
        this.#digested = false;
    }
    update(message) {
        let view;
        if (message instanceof Uint8Array) {
            view = message;
        } else if (typeof message === "string") {
            view = new TextEncoder().encode(message);
        } else if (ArrayBuffer.isView(message)) {
            view = new Uint8Array(message.buffer, message.byteOffset, message.byteLength);
        } else if (message instanceof ArrayBuffer) {
            view = new Uint8Array(message);
        } else {
            throw new Error("hash: `data` is invalid type");
        }
        // Messages will be split into chunks of this size to avoid unnecessarily
        // increasing the size of the Wasm heap.
        const chunkSize = 65_536;
        const updateHash = instantiate().update_hash;
        for(let offset = 0; offset < view.byteLength; offset += chunkSize){
            updateHash(this.#hash, new Uint8Array(view.buffer, view.byteOffset + offset, Math.min(chunkSize, view.byteLength - offset)));
        }
        return this;
    }
    /** Returns final hash */ digest() {
        if (this.#digested) throw new Error("hash: already digested");
        this.#digested = true;
        return instantiate().digest_hash(this.#hash);
    }
    /**
   * Returns hash as a string of given format
   * @param format format of output string (hex or base64). Default is hex
   */ toString(format = "hex") {
        const finalized = new Uint8Array(this.digest());
        switch(format){
            case "hex":
                return new TextDecoder().decode(hex.encode(finalized));
            case "base64":
                return base64.encode(finalized);
            default:
                throw new Error("hash: invalid format");
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2hhc2gvX3dhc20vaGFzaC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBEZW5vSGFzaCwgaW5zdGFudGlhdGUgfSBmcm9tIFwiLi9saWIvZGVub19oYXNoLmdlbmVyYXRlZC5tanNcIjtcblxuaW1wb3J0ICogYXMgaGV4IGZyb20gXCIuLi8uLi9lbmNvZGluZy9oZXgudHNcIjtcbmltcG9ydCAqIGFzIGJhc2U2NCBmcm9tIFwiLi4vLi4vZW5jb2RpbmcvYmFzZTY0LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEhhc2hlciwgTWVzc2FnZSwgT3V0cHV0Rm9ybWF0IH0gZnJvbSBcIi4uL2hhc2hlci50c1wiO1xuXG5leHBvcnQgY2xhc3MgSGFzaCBpbXBsZW1lbnRzIEhhc2hlciB7XG4gICNoYXNoOiBEZW5vSGFzaDtcbiAgI2RpZ2VzdGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKGFsZ29yaXRobTogc3RyaW5nKSB7XG4gICAgdGhpcy4jaGFzaCA9IGluc3RhbnRpYXRlKCkuY3JlYXRlX2hhc2goYWxnb3JpdGhtKTtcbiAgICB0aGlzLiNkaWdlc3RlZCA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlKG1lc3NhZ2U6IE1lc3NhZ2UpOiB0aGlzIHtcbiAgICBsZXQgdmlldzogVWludDhBcnJheTtcblxuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgdmlldyA9IG1lc3NhZ2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdmlldyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShtZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhtZXNzYWdlKSkge1xuICAgICAgdmlldyA9IG5ldyBVaW50OEFycmF5KFxuICAgICAgICBtZXNzYWdlLmJ1ZmZlcixcbiAgICAgICAgbWVzc2FnZS5ieXRlT2Zmc2V0LFxuICAgICAgICBtZXNzYWdlLmJ5dGVMZW5ndGgsXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImhhc2g6IGBkYXRhYCBpcyBpbnZhbGlkIHR5cGVcIik7XG4gICAgfVxuXG4gICAgLy8gTWVzc2FnZXMgd2lsbCBiZSBzcGxpdCBpbnRvIGNodW5rcyBvZiB0aGlzIHNpemUgdG8gYXZvaWQgdW5uZWNlc3NhcmlseVxuICAgIC8vIGluY3JlYXNpbmcgdGhlIHNpemUgb2YgdGhlIFdhc20gaGVhcC5cblxuICAgIGNvbnN0IGNodW5rU2l6ZSA9IDY1XzUzNjtcbiAgICBjb25zdCB1cGRhdGVIYXNoID0gaW5zdGFudGlhdGUoKS51cGRhdGVfaGFzaDtcblxuICAgIGZvciAoXG4gICAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICAgIG9mZnNldCA8IHZpZXcuYnl0ZUxlbmd0aDtcbiAgICAgIG9mZnNldCArPSBjaHVua1NpemVcbiAgICApIHtcbiAgICAgIHVwZGF0ZUhhc2goXG4gICAgICAgIHRoaXMuI2hhc2gsXG4gICAgICAgIG5ldyBVaW50OEFycmF5KFxuICAgICAgICAgIHZpZXcuYnVmZmVyLFxuICAgICAgICAgIHZpZXcuYnl0ZU9mZnNldCArIG9mZnNldCxcbiAgICAgICAgICBNYXRoLm1pbihjaHVua1NpemUsIHZpZXcuYnl0ZUxlbmd0aCAtIG9mZnNldCksXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgZmluYWwgaGFzaCAqL1xuICBkaWdlc3QoKTogQXJyYXlCdWZmZXIge1xuICAgIGlmICh0aGlzLiNkaWdlc3RlZCkgdGhyb3cgbmV3IEVycm9yKFwiaGFzaDogYWxyZWFkeSBkaWdlc3RlZFwiKTtcblxuICAgIHRoaXMuI2RpZ2VzdGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gaW5zdGFudGlhdGUoKS5kaWdlc3RfaGFzaCh0aGlzLiNoYXNoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGhhc2ggYXMgYSBzdHJpbmcgb2YgZ2l2ZW4gZm9ybWF0XG4gICAqIEBwYXJhbSBmb3JtYXQgZm9ybWF0IG9mIG91dHB1dCBzdHJpbmcgKGhleCBvciBiYXNlNjQpLiBEZWZhdWx0IGlzIGhleFxuICAgKi9cbiAgdG9TdHJpbmcoZm9ybWF0OiBPdXRwdXRGb3JtYXQgPSBcImhleFwiKTogc3RyaW5nIHtcbiAgICBjb25zdCBmaW5hbGl6ZWQgPSBuZXcgVWludDhBcnJheSh0aGlzLmRpZ2VzdCgpKTtcblxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICBjYXNlIFwiaGV4XCI6XG4gICAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoaGV4LmVuY29kZShmaW5hbGl6ZWQpKTtcbiAgICAgIGNhc2UgXCJiYXNlNjRcIjpcbiAgICAgICAgcmV0dXJuIGJhc2U2NC5lbmNvZGUoZmluYWxpemVkKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImhhc2g6IGludmFsaWQgZm9ybWF0XCIpO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBbUIsV0FBVyxRQUFRLCtCQUErQixDQUFDO0FBRXRFLFlBQVksR0FBRyxNQUFNLHVCQUF1QixDQUFDO0FBQzdDLFlBQVksTUFBTSxNQUFNLDBCQUEwQixDQUFDO0FBR25ELE9BQU8sTUFBTSxJQUFJO0lBQ2YsQ0FBQyxJ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