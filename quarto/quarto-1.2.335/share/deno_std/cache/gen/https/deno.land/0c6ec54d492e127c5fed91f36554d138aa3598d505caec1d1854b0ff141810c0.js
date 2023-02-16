// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/*!
 * Ported and modified from: https://github.com/beatgammit/tar-js and
 * licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2011 T. Jameson Little
 * Copyright (c) 2019 Jun Kato
 * Copyright (c) 2018-2022 the Deno authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */ /**
 * Provides a `Tar` and `Untar` classes for compressing and decompressing
 * arbitrary data.
 *
 * ## Examples
 *
 * ### Tar
 *
 * ```ts
 * import { Tar } from "https://deno.land/std@$STD_VERSION/archive/tar.ts";
 * import { Buffer } from "https://deno.land/std@$STD_VERSION/io/buffer.ts";
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
 *
 * const tar = new Tar();
 * const content = new TextEncoder().encode("Deno.land");
 * await tar.append("deno.txt", {
 *   reader: new Buffer(content),
 *   contentSize: content.byteLength,
 * });
 *
 * // Or specifying a filePath.
 * await tar.append("land.txt", {
 *   filePath: "./land.txt",
 * });
 *
 * // use tar.getReader() to read the contents.
 *
 * const writer = await Deno.open("./out.tar", { write: true, create: true });
 * await copy(tar.getReader(), writer);
 * writer.close();
 * ```
 *
 * ### Untar
 *
 * ```ts
 * import { Untar } from "https://deno.land/std@$STD_VERSION/archive/tar.ts";
 * import { ensureFile } from "https://deno.land/std@$STD_VERSION/fs/ensure_file.ts";
 * import { ensureDir } from "https://deno.land/std@$STD_VERSION/fs/ensure_dir.ts";
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/conversion.ts";
 *
 * const reader = await Deno.open("./out.tar", { read: true });
 * const untar = new Untar(reader);
 *
 * for await (const entry of untar) {
 *   console.log(entry); // metadata
 *
 *   if (entry.type === "directory") {
 *     await ensureDir(entry.fileName);
 *     continue;
 *   }
 *
 *   await ensureFile(entry.fileName);
 *   const file = await Deno.open(entry.fileName, { write: true });
 *   // <entry> is a reader.
 *   await copy(entry, file);
 * }
 * reader.close();
 * ```
 *
 * @module
 */ import { MultiReader } from "../io/readers.ts";
import { Buffer, PartialReadError } from "../io/buffer.ts";
import { assert } from "../_util/assert.ts";
import { readAll } from "../streams/conversion.ts";
const recordSize = 512;
const ustar = "ustar\u000000";
// https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_06
// eight checksum bytes taken to be ascii spaces (decimal value 32)
const initialChecksum = 8 * 32;
async function readBlock(reader, p) {
    let bytesRead = 0;
    while(bytesRead < p.length){
        const rr = await reader.read(p.subarray(bytesRead));
        if (rr === null) {
            if (bytesRead === 0) {
                return null;
            } else {
                throw new PartialReadError();
            }
        }
        bytesRead += rr;
    }
    return bytesRead;
}
/**
 * Simple file reader
 */ class FileReader {
    #file;
    constructor(filePath){
        this.filePath = filePath;
    }
    async read(p) {
        if (!this.#file) {
            this.#file = await Deno.open(this.filePath, {
                read: true
            });
        }
        const res = await Deno.read(this.#file.rid, p);
        if (res === null) {
            Deno.close(this.#file.rid);
            this.#file = undefined;
        }
        return res;
    }
    filePath;
}
/**
 * Remove the trailing null codes
 * @param buffer
 */ function trim(buffer) {
    const index = buffer.findIndex((v)=>v === 0);
    if (index < 0) return buffer;
    return buffer.subarray(0, index);
}
/**
 * Initialize Uint8Array of the specified length filled with 0
 * @param length
 */ function clean(length) {
    const buffer = new Uint8Array(length);
    buffer.fill(0, 0, length - 1);
    return buffer;
}
function pad(num, bytes, base = 8) {
    const numString = num.toString(base);
    return "000000000000".substr(numString.length + 12 - bytes) + numString;
}
var FileTypes;
(function(FileTypes) {
    FileTypes[FileTypes["file"] = 0] = "file";
    FileTypes[FileTypes["link"] = 1] = "link";
    FileTypes[FileTypes["symlink"] = 2] = "symlink";
    FileTypes[FileTypes["character-device"] = 3] = "character-device";
    FileTypes[FileTypes["block-device"] = 4] = "block-device";
    FileTypes[FileTypes["directory"] = 5] = "directory";
    FileTypes[FileTypes["fifo"] = 6] = "fifo";
    FileTypes[FileTypes["contiguous-file"] = 7] = "contiguous-file";
})(FileTypes || (FileTypes = {}));
/*
struct posix_header {           // byte offset
  char name[100];               //   0
  char mode[8];                 // 100
  char uid[8];                  // 108
  char gid[8];                  // 116
  char size[12];                // 124
  char mtime[12];               // 136
  char chksum[8];               // 148
  char typeflag;                // 156
  char linkname[100];           // 157
  char magic[6];                // 257
  char version[2];              // 263
  char uname[32];               // 265
  char gname[32];               // 297
  char devmajor[8];             // 329
  char devminor[8];             // 337
  char prefix[155];             // 345
                                // 500
};
*/ const ustarStructure = [
    {
        field: "fileName",
        length: 100
    },
    {
        field: "fileMode",
        length: 8
    },
    {
        field: "uid",
        length: 8
    },
    {
        field: "gid",
        length: 8
    },
    {
        field: "fileSize",
        length: 12
    },
    {
        field: "mtime",
        length: 12
    },
    {
        field: "checksum",
        length: 8
    },
    {
        field: "type",
        length: 1
    },
    {
        field: "linkName",
        length: 100
    },
    {
        field: "ustar",
        length: 8
    },
    {
        field: "owner",
        length: 32
    },
    {
        field: "group",
        length: 32
    },
    {
        field: "majorNumber",
        length: 8
    },
    {
        field: "minorNumber",
        length: 8
    },
    {
        field: "fileNamePrefix",
        length: 155
    },
    {
        field: "padding",
        length: 12
    }, 
];
/**
 * Create header for a file in a tar archive
 */ function formatHeader(data) {
    const encoder = new TextEncoder(), buffer = clean(512);
    let offset = 0;
    ustarStructure.forEach(function(value) {
        const entry = encoder.encode(data[value.field] || "");
        buffer.set(entry, offset);
        offset += value.length; // space it out with nulls
    });
    return buffer;
}
/**
 * Parse file header in a tar archive
 * @param length
 */ function parseHeader(buffer) {
    const data = {};
    let offset = 0;
    ustarStructure.forEach(function(value) {
        const arr = buffer.subarray(offset, offset + value.length);
        data[value.field] = arr;
        offset += value.length;
    });
    return data;
}
/**
 * A class to create a tar archive
 */ export class Tar {
    data;
    constructor(){
        this.data = [];
    }
    /**
   * Append a file to this tar archive
   * @param fn file name
   *                 e.g., test.txt; use slash for directory separators
   * @param opts options
   */ async append(fn, opts) {
        if (typeof fn !== "string") {
            throw new Error("file name not specified");
        }
        let fileName = fn;
        // separate file name into two parts if needed
        let fileNamePrefix;
        if (fileName.length > 100) {
            let i = fileName.length;
            while(i >= 0){
                i = fileName.lastIndexOf("/", i);
                if (i <= 155) {
                    fileNamePrefix = fileName.substr(0, i);
                    fileName = fileName.substr(i + 1);
                    break;
                }
                i--;
            }
            const errMsg = "ustar format does not allow a long file name (length of [file name" + "prefix] + / + [file name] must be shorter than 256 bytes)";
            if (i < 0 || fileName.length > 100) {
                throw new Error(errMsg);
            } else {
                assert(fileNamePrefix != null);
                if (fileNamePrefix.length > 155) {
                    throw new Error(errMsg);
                }
            }
        }
        opts = opts || {};
        // set meta data
        let info;
        if (opts.filePath) {
            info = await Deno.stat(opts.filePath);
            if (info.isDirectory) {
                info.size = 0;
                opts.reader = new Buffer();
            }
        }
        const mode = opts.fileMode || info && info.mode || parseInt("777", 8) & 0xfff, mtime = Math.floor(opts.mtime ?? (info?.mtime ?? new Date()).valueOf() / 1000), uid = opts.uid || 0, gid = opts.gid || 0;
        if (typeof opts.owner === "string" && opts.owner.length >= 32) {
            throw new Error("ustar format does not allow owner name length >= 32 bytes");
        }
        if (typeof opts.group === "string" && opts.group.length >= 32) {
            throw new Error("ustar format does not allow group name length >= 32 bytes");
        }
        const fileSize = info?.size ?? opts.contentSize;
        assert(fileSize != null, "fileSize must be set");
        const type = opts.type ? FileTypes[opts.type] : info?.isDirectory ? FileTypes.directory : FileTypes.file;
        const tarData = {
            fileName,
            fileNamePrefix,
            fileMode: pad(mode, 7),
            uid: pad(uid, 7),
            gid: pad(gid, 7),
            fileSize: pad(fileSize, 11),
            mtime: pad(mtime, 11),
            checksum: "        ",
            type: type.toString(),
            ustar,
            owner: opts.owner || "",
            group: opts.group || "",
            filePath: opts.filePath,
            reader: opts.reader
        };
        // calculate the checksum
        let checksum = 0;
        const encoder = new TextEncoder();
        Object.keys(tarData).filter((key)=>[
                "filePath",
                "reader"
            ].indexOf(key) < 0).forEach(function(key) {
            checksum += encoder.encode(tarData[key]).reduce((p, c)=>p + c, 0);
        });
        tarData.checksum = pad(checksum, 6) + "\u0000 ";
        this.data.push(tarData);
    }
    /**
   * Get a Reader instance for this tar data
   */ getReader() {
        const readers = [];
        this.data.forEach((tarData)=>{
            let { reader  } = tarData;
            const { filePath  } = tarData;
            const headerArr = formatHeader(tarData);
            readers.push(new Buffer(headerArr));
            if (!reader) {
                assert(filePath != null);
                reader = new FileReader(filePath);
            }
            readers.push(reader);
            // to the nearest multiple of recordSize
            assert(tarData.fileSize != null, "fileSize must be set");
            readers.push(new Buffer(clean(recordSize - (parseInt(tarData.fileSize, 8) % recordSize || recordSize))));
        });
        // append 2 empty records
        readers.push(new Buffer(clean(recordSize * 2)));
        return new MultiReader(readers);
    }
}
class TarEntry {
    #header;
    #reader;
    #size;
    #read = 0;
    #consumed = false;
    #entrySize;
    constructor(meta, header, reader){
        Object.assign(this, meta);
        this.#header = header;
        this.#reader = reader;
        // File Size
        this.#size = this.fileSize || 0;
        // Entry Size
        const blocks = Math.ceil(this.#size / recordSize);
        this.#entrySize = blocks * recordSize;
    }
    get consumed() {
        return this.#consumed;
    }
    async read(p) {
        // Bytes left for entry
        const entryBytesLeft = this.#entrySize - this.#read;
        const bufSize = Math.min(// bufSize can't be greater than p.length nor bytes left in the entry
        p.length, entryBytesLeft);
        if (entryBytesLeft <= 0) {
            this.#consumed = true;
            return null;
        }
        const block = new Uint8Array(bufSize);
        const n = await readBlock(this.#reader, block);
        const bytesLeft = this.#size - this.#read;
        this.#read += n || 0;
        if (n === null || bytesLeft <= 0) {
            if (n === null) this.#consumed = true;
            return null;
        }
        // Remove zero filled
        const offset = bytesLeft < n ? bytesLeft : n;
        p.set(block.subarray(0, offset), 0);
        return offset < 0 ? n - Math.abs(offset) : offset;
    }
    async discard() {
        // Discard current entry
        if (this.#consumed) return;
        this.#consumed = true;
        if (typeof this.#reader.seek === "function") {
            await this.#reader.seek(this.#entrySize - this.#read, Deno.SeekMode.Current);
            this.#read = this.#entrySize;
        } else {
            await readAll(this);
        }
    }
}
/**
 * A class to extract a tar archive
 */ export class Untar {
    reader;
    block;
    #entry;
    constructor(reader){
        this.reader = reader;
        this.block = new Uint8Array(recordSize);
    }
    #checksum(header) {
        let sum = initialChecksum;
        for(let i = 0; i < 512; i++){
            if (i >= 148 && i < 156) {
                continue;
            }
            sum += header[i];
        }
        return sum;
    }
    async #getHeader() {
        await readBlock(this.reader, this.block);
        const header1 = parseHeader(this.block);
        // calculate the checksum
        const decoder = new TextDecoder();
        const checksum = this.#checksum(this.block);
        if (parseInt(decoder.decode(header1.checksum), 8) !== checksum) {
            if (checksum === initialChecksum) {
                // EOF
                return null;
            }
            throw new Error("checksum error");
        }
        const magic = decoder.decode(header1.ustar);
        if (magic.indexOf("ustar")) {
            throw new Error(`unsupported archive format: ${magic}`);
        }
        return header1;
    }
    #getMetadata(header2) {
        const decoder1 = new TextDecoder();
        // get meta data
        const meta = {
            fileName: decoder1.decode(trim(header2.fileName))
        };
        const fileNamePrefix = trim(header2.fileNamePrefix);
        if (fileNamePrefix.byteLength > 0) {
            meta.fileName = decoder1.decode(fileNamePrefix) + "/" + meta.fileName;
        }
        [
            "fileMode",
            "mtime",
            "uid",
            "gid"
        ].forEach((key)=>{
            const arr = trim(header2[key]);
            if (arr.byteLength > 0) {
                meta[key] = parseInt(decoder1.decode(arr), 8);
            }
        });
        [
            "owner",
            "group",
            "type"
        ].forEach((key)=>{
            const arr = trim(header2[key]);
            if (arr.byteLength > 0) {
                meta[key] = decoder1.decode(arr);
            }
        });
        meta.fileSize = parseInt(decoder1.decode(header2.fileSize), 8);
        meta.type = FileTypes[parseInt(meta.type)] ?? meta.type;
        return meta;
    }
    async extract() {
        if (this.#entry && !this.#entry.consumed) {
            // If entry body was not read, discard the body
            // so we can read the next entry.
            await this.#entry.discard();
        }
        const header = await this.#getHeader();
        if (header === null) return null;
        const meta = this.#getMetadata(header);
        this.#entry = new TarEntry(meta, header, this.reader);
        return this.#entry;
    }
    async *[Symbol.asyncIterator]() {
        while(true){
            const entry = await this.extract();
            if (entry === null) return;
            yield entry;
        }
    }
}
export { TarEntry };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2FyY2hpdmUvdGFyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qIVxuICogUG9ydGVkIGFuZCBtb2RpZmllZCBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC90YXItanMgYW5kXG4gKiBsaWNlbnNlZCBhczpcbiAqXG4gKiAoVGhlIE1JVCBMaWNlbnNlKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMSBULiBKYW1lc29uIExpdHRsZVxuICogQ29weXJpZ2h0IChjKSAyMDE5IEp1biBLYXRvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgYFRhcmAgYW5kIGBVbnRhcmAgY2xhc3NlcyBmb3IgY29tcHJlc3NpbmcgYW5kIGRlY29tcHJlc3NpbmdcbiAqIGFyYml0cmFyeSBkYXRhLlxuICpcbiAqICMjIEV4YW1wbGVzXG4gKlxuICogIyMjIFRhclxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBUYXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9hcmNoaXZlL3Rhci50c1wiO1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaW8vYnVmZmVyLnRzXCI7XG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vc3RyZWFtcy9jb252ZXJzaW9uLnRzXCI7XG4gKlxuICogY29uc3QgdGFyID0gbmV3IFRhcigpO1xuICogY29uc3QgY29udGVudCA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkRlbm8ubGFuZFwiKTtcbiAqIGF3YWl0IHRhci5hcHBlbmQoXCJkZW5vLnR4dFwiLCB7XG4gKiAgIHJlYWRlcjogbmV3IEJ1ZmZlcihjb250ZW50KSxcbiAqICAgY29udGVudFNpemU6IGNvbnRlbnQuYnl0ZUxlbmd0aCxcbiAqIH0pO1xuICpcbiAqIC8vIE9yIHNwZWNpZnlpbmcgYSBmaWxlUGF0aC5cbiAqIGF3YWl0IHRhci5hcHBlbmQoXCJsYW5kLnR4dFwiLCB7XG4gKiAgIGZpbGVQYXRoOiBcIi4vbGFuZC50eHRcIixcbiAqIH0pO1xuICpcbiAqIC8vIHVzZSB0YXIuZ2V0UmVhZGVyKCkgdG8gcmVhZCB0aGUgY29udGVudHMuXG4gKlxuICogY29uc3Qgd3JpdGVyID0gYXdhaXQgRGVuby5vcGVuKFwiLi9vdXQudGFyXCIsIHsgd3JpdGU6IHRydWUsIGNyZWF0ZTogdHJ1ZSB9KTtcbiAqIGF3YWl0IGNvcHkodGFyLmdldFJlYWRlcigpLCB3cml0ZXIpO1xuICogd3JpdGVyLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiAjIyMgVW50YXJcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgVW50YXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9hcmNoaXZlL3Rhci50c1wiO1xuICogaW1wb3J0IHsgZW5zdXJlRmlsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2Vuc3VyZV9maWxlLnRzXCI7XG4gKiBpbXBvcnQgeyBlbnN1cmVEaXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9lbnN1cmVfZGlyLnRzXCI7XG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vc3RyZWFtcy9jb252ZXJzaW9uLnRzXCI7XG4gKlxuICogY29uc3QgcmVhZGVyID0gYXdhaXQgRGVuby5vcGVuKFwiLi9vdXQudGFyXCIsIHsgcmVhZDogdHJ1ZSB9KTtcbiAqIGNvbnN0IHVudGFyID0gbmV3IFVudGFyKHJlYWRlcik7XG4gKlxuICogZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiB1bnRhcikge1xuICogICBjb25zb2xlLmxvZyhlbnRyeSk7IC8vIG1ldGFkYXRhXG4gKlxuICogICBpZiAoZW50cnkudHlwZSA9PT0gXCJkaXJlY3RvcnlcIikge1xuICogICAgIGF3YWl0IGVuc3VyZURpcihlbnRyeS5maWxlTmFtZSk7XG4gKiAgICAgY29udGludWU7XG4gKiAgIH1cbiAqXG4gKiAgIGF3YWl0IGVuc3VyZUZpbGUoZW50cnkuZmlsZU5hbWUpO1xuICogICBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKGVudHJ5LmZpbGVOYW1lLCB7IHdyaXRlOiB0cnVlIH0pO1xuICogICAvLyA8ZW50cnk+IGlzIGEgcmVhZGVyLlxuICogICBhd2FpdCBjb3B5KGVudHJ5LCBmaWxlKTtcbiAqIH1cbiAqIHJlYWRlci5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IE11bHRpUmVhZGVyIH0gZnJvbSBcIi4uL2lvL3JlYWRlcnMudHNcIjtcbmltcG9ydCB7IEJ1ZmZlciwgUGFydGlhbFJlYWRFcnJvciB9IGZyb20gXCIuLi9pby9idWZmZXIudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcbmltcG9ydCB7IHJlYWRBbGwgfSBmcm9tIFwiLi4vc3RyZWFtcy9jb252ZXJzaW9uLnRzXCI7XG5cbnR5cGUgUmVhZGVyID0gRGVuby5SZWFkZXI7XG50eXBlIFNlZWtlciA9IERlbm8uU2Vla2VyO1xuXG5jb25zdCByZWNvcmRTaXplID0gNTEyO1xuY29uc3QgdXN0YXIgPSBcInVzdGFyXFx1MDAwMDAwXCI7XG5cbi8vIGh0dHBzOi8vcHVicy5vcGVuZ3JvdXAub3JnL29ubGluZXB1YnMvOTY5OTkxOTc5OS91dGlsaXRpZXMvcGF4Lmh0bWwjdGFnXzIwXzkyXzEzXzA2XG4vLyBlaWdodCBjaGVja3N1bSBieXRlcyB0YWtlbiB0byBiZSBhc2NpaSBzcGFjZXMgKGRlY2ltYWwgdmFsdWUgMzIpXG5jb25zdCBpbml0aWFsQ2hlY2tzdW0gPSA4ICogMzI7XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRCbG9jayhcbiAgcmVhZGVyOiBEZW5vLlJlYWRlcixcbiAgcDogVWludDhBcnJheSxcbik6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICBsZXQgYnl0ZXNSZWFkID0gMDtcbiAgd2hpbGUgKGJ5dGVzUmVhZCA8IHAubGVuZ3RoKSB7XG4gICAgY29uc3QgcnIgPSBhd2FpdCByZWFkZXIucmVhZChwLnN1YmFycmF5KGJ5dGVzUmVhZCkpO1xuICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgaWYgKGJ5dGVzUmVhZCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBQYXJ0aWFsUmVhZEVycm9yKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ5dGVzUmVhZCArPSBycjtcbiAgfVxuICByZXR1cm4gYnl0ZXNSZWFkO1xufVxuXG4vKipcbiAqIFNpbXBsZSBmaWxlIHJlYWRlclxuICovXG5jbGFzcyBGaWxlUmVhZGVyIGltcGxlbWVudHMgUmVhZGVyIHtcbiAgI2ZpbGU/OiBEZW5vLkZzRmlsZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGZpbGVQYXRoOiBzdHJpbmcpIHt9XG5cbiAgcHVibGljIGFzeW5jIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy4jZmlsZSkge1xuICAgICAgdGhpcy4jZmlsZSA9IGF3YWl0IERlbm8ub3Blbih0aGlzLmZpbGVQYXRoLCB7IHJlYWQ6IHRydWUgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IERlbm8ucmVhZCh0aGlzLiNmaWxlLnJpZCwgcCk7XG4gICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgRGVuby5jbG9zZSh0aGlzLiNmaWxlLnJpZCk7XG4gICAgICB0aGlzLiNmaWxlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSB0cmFpbGluZyBudWxsIGNvZGVzXG4gKiBAcGFyYW0gYnVmZmVyXG4gKi9cbmZ1bmN0aW9uIHRyaW0oYnVmZmVyOiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGluZGV4ID0gYnVmZmVyLmZpbmRJbmRleCgodik6IGJvb2xlYW4gPT4gdiA9PT0gMCk7XG4gIGlmIChpbmRleCA8IDApIHJldHVybiBidWZmZXI7XG4gIHJldHVybiBidWZmZXIuc3ViYXJyYXkoMCwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgVWludDhBcnJheSBvZiB0aGUgc3BlY2lmaWVkIGxlbmd0aCBmaWxsZWQgd2l0aCAwXG4gKiBAcGFyYW0gbGVuZ3RoXG4gKi9cbmZ1bmN0aW9uIGNsZWFuKGxlbmd0aDogbnVtYmVyKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGJ1ZmZlci5maWxsKDAsIDAsIGxlbmd0aCAtIDEpO1xuICByZXR1cm4gYnVmZmVyO1xufVxuXG5mdW5jdGlvbiBwYWQobnVtOiBudW1iZXIsIGJ5dGVzOiBudW1iZXIsIGJhc2UgPSA4KTogc3RyaW5nIHtcbiAgY29uc3QgbnVtU3RyaW5nID0gbnVtLnRvU3RyaW5nKGJhc2UpO1xuICByZXR1cm4gXCIwMDAwMDAwMDAwMDBcIi5zdWJzdHIobnVtU3RyaW5nLmxlbmd0aCArIDEyIC0gYnl0ZXMpICsgbnVtU3RyaW5nO1xufVxuXG5lbnVtIEZpbGVUeXBlcyB7XG4gIFwiZmlsZVwiID0gMCxcbiAgXCJsaW5rXCIgPSAxLFxuICBcInN5bWxpbmtcIiA9IDIsXG4gIFwiY2hhcmFjdGVyLWRldmljZVwiID0gMyxcbiAgXCJibG9jay1kZXZpY2VcIiA9IDQsXG4gIFwiZGlyZWN0b3J5XCIgPSA1LFxuICBcImZpZm9cIiA9IDYsXG4gIFwiY29udGlndW91cy1maWxlXCIgPSA3LFxufVxuXG4vKlxuc3RydWN0IHBvc2l4X2hlYWRlciB7ICAgICAgICAgICAvLyBieXRlIG9mZnNldFxuICBjaGFyIG5hbWVbMTAwXTsgICAgICAgICAgICAgICAvLyAgIDBcbiAgY2hhciBtb2RlWzhdOyAgICAgICAgICAgICAgICAgLy8gMTAwXG4gIGNoYXIgdWlkWzhdOyAgICAgICAgICAgICAgICAgIC8vIDEwOFxuICBjaGFyIGdpZFs4XTsgICAgICAgICAgICAgICAgICAvLyAxMTZcbiAgY2hhciBzaXplWzEyXTsgICAgICAgICAgICAgICAgLy8gMTI0XG4gIGNoYXIgbXRpbWVbMTJdOyAgICAgICAgICAgICAgIC8vIDEzNlxuICBjaGFyIGNoa3N1bVs4XTsgICAgICAgICAgICAgICAvLyAxNDhcbiAgY2hhciB0eXBlZmxhZzsgICAgICAgICAgICAgICAgLy8gMTU2XG4gIGNoYXIgbGlua25hbWVbMTAwXTsgICAgICAgICAgIC8vIDE1N1xuICBjaGFyIG1hZ2ljWzZdOyAgICAgICAgICAgICAgICAvLyAyNTdcbiAgY2hhciB2ZXJzaW9uWzJdOyAgICAgICAgICAgICAgLy8gMjYzXG4gIGNoYXIgdW5hbWVbMzJdOyAgICAgICAgICAgICAgIC8vIDI2NVxuICBjaGFyIGduYW1lWzMyXTsgICAgICAgICAgICAgICAvLyAyOTdcbiAgY2hhciBkZXZtYWpvcls4XTsgICAgICAgICAgICAgLy8gMzI5XG4gIGNoYXIgZGV2bWlub3JbOF07ICAgICAgICAgICAgIC8vIDMzN1xuICBjaGFyIHByZWZpeFsxNTVdOyAgICAgICAgICAgICAvLyAzNDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gNTAwXG59O1xuKi9cblxuY29uc3QgdXN0YXJTdHJ1Y3R1cmU6IEFycmF5PHsgZmllbGQ6IHN0cmluZzsgbGVuZ3RoOiBudW1iZXIgfT4gPSBbXG4gIHtcbiAgICBmaWVsZDogXCJmaWxlTmFtZVwiLFxuICAgIGxlbmd0aDogMTAwLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwiZmlsZU1vZGVcIixcbiAgICBsZW5ndGg6IDgsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJ1aWRcIixcbiAgICBsZW5ndGg6IDgsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJnaWRcIixcbiAgICBsZW5ndGg6IDgsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJmaWxlU2l6ZVwiLFxuICAgIGxlbmd0aDogMTIsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJtdGltZVwiLFxuICAgIGxlbmd0aDogMTIsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJjaGVja3N1bVwiLFxuICAgIGxlbmd0aDogOCxcbiAgfSxcbiAge1xuICAgIGZpZWxkOiBcInR5cGVcIixcbiAgICBsZW5ndGg6IDEsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJsaW5rTmFtZVwiLFxuICAgIGxlbmd0aDogMTAwLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwidXN0YXJcIixcbiAgICBsZW5ndGg6IDgsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJvd25lclwiLFxuICAgIGxlbmd0aDogMzIsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJncm91cFwiLFxuICAgIGxlbmd0aDogMzIsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJtYWpvck51bWJlclwiLFxuICAgIGxlbmd0aDogOCxcbiAgfSxcbiAge1xuICAgIGZpZWxkOiBcIm1pbm9yTnVtYmVyXCIsXG4gICAgbGVuZ3RoOiA4LFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwiZmlsZU5hbWVQcmVmaXhcIixcbiAgICBsZW5ndGg6IDE1NSxcbiAgfSxcbiAge1xuICAgIGZpZWxkOiBcInBhZGRpbmdcIixcbiAgICBsZW5ndGg6IDEyLFxuICB9LFxuXTtcblxuLyoqXG4gKiBDcmVhdGUgaGVhZGVyIGZvciBhIGZpbGUgaW4gYSB0YXIgYXJjaGl2ZVxuICovXG5mdW5jdGlvbiBmb3JtYXRIZWFkZXIoZGF0YTogVGFyRGF0YSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCksXG4gICAgYnVmZmVyID0gY2xlYW4oNTEyKTtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIHVzdGFyU3RydWN0dXJlLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgY29uc3QgZW50cnkgPSBlbmNvZGVyLmVuY29kZShkYXRhW3ZhbHVlLmZpZWxkIGFzIGtleW9mIFRhckRhdGFdIHx8IFwiXCIpO1xuICAgIGJ1ZmZlci5zZXQoZW50cnksIG9mZnNldCk7XG4gICAgb2Zmc2V0ICs9IHZhbHVlLmxlbmd0aDsgLy8gc3BhY2UgaXQgb3V0IHdpdGggbnVsbHNcbiAgfSk7XG4gIHJldHVybiBidWZmZXI7XG59XG5cbi8qKlxuICogUGFyc2UgZmlsZSBoZWFkZXIgaW4gYSB0YXIgYXJjaGl2ZVxuICogQHBhcmFtIGxlbmd0aFxuICovXG5mdW5jdGlvbiBwYXJzZUhlYWRlcihidWZmZXI6IFVpbnQ4QXJyYXkpOiB7IFtrZXk6IHN0cmluZ106IFVpbnQ4QXJyYXkgfSB7XG4gIGNvbnN0IGRhdGE6IHsgW2tleTogc3RyaW5nXTogVWludDhBcnJheSB9ID0ge307XG4gIGxldCBvZmZzZXQgPSAwO1xuICB1c3RhclN0cnVjdHVyZS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGNvbnN0IGFyciA9IGJ1ZmZlci5zdWJhcnJheShvZmZzZXQsIG9mZnNldCArIHZhbHVlLmxlbmd0aCk7XG4gICAgZGF0YVt2YWx1ZS5maWVsZF0gPSBhcnI7XG4gICAgb2Zmc2V0ICs9IHZhbHVlLmxlbmd0aDtcbiAgfSk7XG4gIHJldHVybiBkYXRhO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhckhlYWRlciB7XG4gIFtrZXk6IHN0cmluZ106IFVpbnQ4QXJyYXk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyRGF0YSB7XG4gIGZpbGVOYW1lPzogc3RyaW5nO1xuICBmaWxlTmFtZVByZWZpeD86IHN0cmluZztcbiAgZmlsZU1vZGU/OiBzdHJpbmc7XG4gIHVpZD86IHN0cmluZztcbiAgZ2lkPzogc3RyaW5nO1xuICBmaWxlU2l6ZT86IHN0cmluZztcbiAgbXRpbWU/OiBzdHJpbmc7XG4gIGNoZWNrc3VtPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICB1c3Rhcj86IHN0cmluZztcbiAgb3duZXI/OiBzdHJpbmc7XG4gIGdyb3VwPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhckRhdGFXaXRoU291cmNlIGV4dGVuZHMgVGFyRGF0YSB7XG4gIC8qKlxuICAgKiBmaWxlIHRvIHJlYWRcbiAgICovXG4gIGZpbGVQYXRoPzogc3RyaW5nO1xuICAvKipcbiAgICogYnVmZmVyIHRvIHJlYWRcbiAgICovXG4gIHJlYWRlcj86IFJlYWRlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXJJbmZvIHtcbiAgZmlsZU1vZGU/OiBudW1iZXI7XG4gIG10aW1lPzogbnVtYmVyO1xuICB1aWQ/OiBudW1iZXI7XG4gIGdpZD86IG51bWJlcjtcbiAgb3duZXI/OiBzdHJpbmc7XG4gIGdyb3VwPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhck9wdGlvbnMgZXh0ZW5kcyBUYXJJbmZvIHtcbiAgLyoqXG4gICAqIGFwcGVuZCBmaWxlXG4gICAqL1xuICBmaWxlUGF0aD86IHN0cmluZztcblxuICAvKipcbiAgICogYXBwZW5kIGFueSBhcmJpdHJhcnkgY29udGVudFxuICAgKi9cbiAgcmVhZGVyPzogUmVhZGVyO1xuXG4gIC8qKlxuICAgKiBzaXplIG9mIHRoZSBjb250ZW50IHRvIGJlIGFwcGVuZGVkXG4gICAqL1xuICBjb250ZW50U2l6ZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXJNZXRhIGV4dGVuZHMgVGFySW5mbyB7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGZpbGVTaXplPzogbnVtYmVyO1xufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWVtcHR5LWludGVyZmFjZVxuaW50ZXJmYWNlIFRhckVudHJ5IGV4dGVuZHMgVGFyTWV0YSB7fVxuXG4vKipcbiAqIEEgY2xhc3MgdG8gY3JlYXRlIGEgdGFyIGFyY2hpdmVcbiAqL1xuZXhwb3J0IGNsYXNzIFRhciB7XG4gIGRhdGE6IFRhckRhdGFXaXRoU291cmNlW107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5kYXRhID0gW107XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGEgZmlsZSB0byB0aGlzIHRhciBhcmNoaXZlXG4gICAqIEBwYXJhbSBmbiBmaWxlIG5hbWVcbiAgICogICAgICAgICAgICAgICAgIGUuZy4sIHRlc3QudHh0OyB1c2Ugc2xhc2ggZm9yIGRpcmVjdG9yeSBzZXBhcmF0b3JzXG4gICAqIEBwYXJhbSBvcHRzIG9wdGlvbnNcbiAgICovXG4gIGFzeW5jIGFwcGVuZChmbjogc3RyaW5nLCBvcHRzOiBUYXJPcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmlsZSBuYW1lIG5vdCBzcGVjaWZpZWRcIik7XG4gICAgfVxuICAgIGxldCBmaWxlTmFtZSA9IGZuO1xuICAgIC8vIHNlcGFyYXRlIGZpbGUgbmFtZSBpbnRvIHR3byBwYXJ0cyBpZiBuZWVkZWRcbiAgICBsZXQgZmlsZU5hbWVQcmVmaXg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZmlsZU5hbWUubGVuZ3RoID4gMTAwKSB7XG4gICAgICBsZXQgaSA9IGZpbGVOYW1lLmxlbmd0aDtcbiAgICAgIHdoaWxlIChpID49IDApIHtcbiAgICAgICAgaSA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKFwiL1wiLCBpKTtcbiAgICAgICAgaWYgKGkgPD0gMTU1KSB7XG4gICAgICAgICAgZmlsZU5hbWVQcmVmaXggPSBmaWxlTmFtZS5zdWJzdHIoMCwgaSk7XG4gICAgICAgICAgZmlsZU5hbWUgPSBmaWxlTmFtZS5zdWJzdHIoaSArIDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGktLTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVyck1zZyA9XG4gICAgICAgIFwidXN0YXIgZm9ybWF0IGRvZXMgbm90IGFsbG93IGEgbG9uZyBmaWxlIG5hbWUgKGxlbmd0aCBvZiBbZmlsZSBuYW1lXCIgK1xuICAgICAgICBcInByZWZpeF0gKyAvICsgW2ZpbGUgbmFtZV0gbXVzdCBiZSBzaG9ydGVyIHRoYW4gMjU2IGJ5dGVzKVwiO1xuICAgICAgaWYgKGkgPCAwIHx8IGZpbGVOYW1lLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzc2VydChmaWxlTmFtZVByZWZpeCAhPSBudWxsKTtcbiAgICAgICAgaWYgKGZpbGVOYW1lUHJlZml4Lmxlbmd0aCA+IDE1NSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAvLyBzZXQgbWV0YSBkYXRhXG4gICAgbGV0IGluZm86IERlbm8uRmlsZUluZm8gfCB1bmRlZmluZWQ7XG4gICAgaWYgKG9wdHMuZmlsZVBhdGgpIHtcbiAgICAgIGluZm8gPSBhd2FpdCBEZW5vLnN0YXQob3B0cy5maWxlUGF0aCk7XG4gICAgICBpZiAoaW5mby5pc0RpcmVjdG9yeSkge1xuICAgICAgICBpbmZvLnNpemUgPSAwO1xuICAgICAgICBvcHRzLnJlYWRlciA9IG5ldyBCdWZmZXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtb2RlID0gb3B0cy5maWxlTW9kZSB8fCAoaW5mbyAmJiBpbmZvLm1vZGUpIHx8XG4gICAgICAgIHBhcnNlSW50KFwiNzc3XCIsIDgpICYgMHhmZmYsXG4gICAgICBtdGltZSA9IE1hdGguZmxvb3IoXG4gICAgICAgIG9wdHMubXRpbWUgPz8gKGluZm8/Lm10aW1lID8/IG5ldyBEYXRlKCkpLnZhbHVlT2YoKSAvIDEwMDAsXG4gICAgICApLFxuICAgICAgdWlkID0gb3B0cy51aWQgfHwgMCxcbiAgICAgIGdpZCA9IG9wdHMuZ2lkIHx8IDA7XG4gICAgaWYgKHR5cGVvZiBvcHRzLm93bmVyID09PSBcInN0cmluZ1wiICYmIG9wdHMub3duZXIubGVuZ3RoID49IDMyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwidXN0YXIgZm9ybWF0IGRvZXMgbm90IGFsbG93IG93bmVyIG5hbWUgbGVuZ3RoID49IDMyIGJ5dGVzXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdHMuZ3JvdXAgPT09IFwic3RyaW5nXCIgJiYgb3B0cy5ncm91cC5sZW5ndGggPj0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJ1c3RhciBmb3JtYXQgZG9lcyBub3QgYWxsb3cgZ3JvdXAgbmFtZSBsZW5ndGggPj0gMzIgYnl0ZXNcIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZVNpemUgPSBpbmZvPy5zaXplID8/IG9wdHMuY29udGVudFNpemU7XG4gICAgYXNzZXJ0KGZpbGVTaXplICE9IG51bGwsIFwiZmlsZVNpemUgbXVzdCBiZSBzZXRcIik7XG5cbiAgICBjb25zdCB0eXBlID0gb3B0cy50eXBlXG4gICAgICA/IEZpbGVUeXBlc1tvcHRzLnR5cGUgYXMga2V5b2YgdHlwZW9mIEZpbGVUeXBlc11cbiAgICAgIDogKGluZm8/LmlzRGlyZWN0b3J5ID8gRmlsZVR5cGVzLmRpcmVjdG9yeSA6IEZpbGVUeXBlcy5maWxlKTtcbiAgICBjb25zdCB0YXJEYXRhOiBUYXJEYXRhV2l0aFNvdXJjZSA9IHtcbiAgICAgIGZpbGVOYW1lLFxuICAgICAgZmlsZU5hbWVQcmVmaXgsXG4gICAgICBmaWxlTW9kZTogcGFkKG1vZGUsIDcpLFxuICAgICAgdWlkOiBwYWQodWlkLCA3KSxcbiAgICAgIGdpZDogcGFkKGdpZCwgNyksXG4gICAgICBmaWxlU2l6ZTogcGFkKGZpbGVTaXplLCAxMSksXG4gICAgICBtdGltZTogcGFkKG10aW1lLCAxMSksXG4gICAgICBjaGVja3N1bTogXCIgICAgICAgIFwiLFxuICAgICAgdHlwZTogdHlwZS50b1N0cmluZygpLFxuICAgICAgdXN0YXIsXG4gICAgICBvd25lcjogb3B0cy5vd25lciB8fCBcIlwiLFxuICAgICAgZ3JvdXA6IG9wdHMuZ3JvdXAgfHwgXCJcIixcbiAgICAgIGZpbGVQYXRoOiBvcHRzLmZpbGVQYXRoLFxuICAgICAgcmVhZGVyOiBvcHRzLnJlYWRlcixcbiAgICB9O1xuXG4gICAgLy8gY2FsY3VsYXRlIHRoZSBjaGVja3N1bVxuICAgIGxldCBjaGVja3N1bSA9IDA7XG4gICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgIE9iamVjdC5rZXlzKHRhckRhdGEpXG4gICAgICAuZmlsdGVyKChrZXkpOiBib29sZWFuID0+IFtcImZpbGVQYXRoXCIsIFwicmVhZGVyXCJdLmluZGV4T2Yoa2V5KSA8IDApXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGNoZWNrc3VtICs9IGVuY29kZXJcbiAgICAgICAgICAuZW5jb2RlKHRhckRhdGFba2V5IGFzIGtleW9mIFRhckRhdGFdKVxuICAgICAgICAgIC5yZWR1Y2UoKHAsIGMpOiBudW1iZXIgPT4gcCArIGMsIDApO1xuICAgICAgfSk7XG5cbiAgICB0YXJEYXRhLmNoZWNrc3VtID0gcGFkKGNoZWNrc3VtLCA2KSArIFwiXFx1MDAwMCBcIjtcbiAgICB0aGlzLmRhdGEucHVzaCh0YXJEYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBSZWFkZXIgaW5zdGFuY2UgZm9yIHRoaXMgdGFyIGRhdGFcbiAgICovXG4gIGdldFJlYWRlcigpOiBSZWFkZXIge1xuICAgIGNvbnN0IHJlYWRlcnM6IFJlYWRlcltdID0gW107XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKHRhckRhdGEpID0+IHtcbiAgICAgIGxldCB7IHJlYWRlciB9ID0gdGFyRGF0YTtcbiAgICAgIGNvbnN0IHsgZmlsZVBhdGggfSA9IHRhckRhdGE7XG4gICAgICBjb25zdCBoZWFkZXJBcnIgPSBmb3JtYXRIZWFkZXIodGFyRGF0YSk7XG4gICAgICByZWFkZXJzLnB1c2gobmV3IEJ1ZmZlcihoZWFkZXJBcnIpKTtcbiAgICAgIGlmICghcmVhZGVyKSB7XG4gICAgICAgIGFzc2VydChmaWxlUGF0aCAhPSBudWxsKTtcbiAgICAgICAgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoZmlsZVBhdGgpO1xuICAgICAgfVxuICAgICAgcmVhZGVycy5wdXNoKHJlYWRlcik7XG5cbiAgICAgIC8vIHRvIHRoZSBuZWFyZXN0IG11bHRpcGxlIG9mIHJlY29yZFNpemVcbiAgICAgIGFzc2VydCh0YXJEYXRhLmZpbGVTaXplICE9IG51bGwsIFwiZmlsZVNpemUgbXVzdCBiZSBzZXRcIik7XG4gICAgICByZWFkZXJzLnB1c2goXG4gICAgICAgIG5ldyBCdWZmZXIoXG4gICAgICAgICAgY2xlYW4oXG4gICAgICAgICAgICByZWNvcmRTaXplIC1cbiAgICAgICAgICAgICAgKHBhcnNlSW50KHRhckRhdGEuZmlsZVNpemUsIDgpICUgcmVjb3JkU2l6ZSB8fCByZWNvcmRTaXplKSxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIGFwcGVuZCAyIGVtcHR5IHJlY29yZHNcbiAgICByZWFkZXJzLnB1c2gobmV3IEJ1ZmZlcihjbGVhbihyZWNvcmRTaXplICogMikpKTtcbiAgICByZXR1cm4gbmV3IE11bHRpUmVhZGVyKHJlYWRlcnMpO1xuICB9XG59XG5cbmNsYXNzIFRhckVudHJ5IGltcGxlbWVudHMgUmVhZGVyIHtcbiAgI2hlYWRlcjogVGFySGVhZGVyO1xuICAjcmVhZGVyOiBSZWFkZXIgfCAoUmVhZGVyICYgRGVuby5TZWVrZXIpO1xuICAjc2l6ZTogbnVtYmVyO1xuICAjcmVhZCA9IDA7XG4gICNjb25zdW1lZCA9IGZhbHNlO1xuICAjZW50cnlTaXplOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKFxuICAgIG1ldGE6IFRhck1ldGEsXG4gICAgaGVhZGVyOiBUYXJIZWFkZXIsXG4gICAgcmVhZGVyOiBSZWFkZXIgfCAoUmVhZGVyICYgRGVuby5TZWVrZXIpLFxuICApIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIG1ldGEpO1xuICAgIHRoaXMuI2hlYWRlciA9IGhlYWRlcjtcbiAgICB0aGlzLiNyZWFkZXIgPSByZWFkZXI7XG5cbiAgICAvLyBGaWxlIFNpemVcbiAgICB0aGlzLiNzaXplID0gdGhpcy5maWxlU2l6ZSB8fCAwO1xuICAgIC8vIEVudHJ5IFNpemVcbiAgICBjb25zdCBibG9ja3MgPSBNYXRoLmNlaWwodGhpcy4jc2l6ZSAvIHJlY29yZFNpemUpO1xuICAgIHRoaXMuI2VudHJ5U2l6ZSA9IGJsb2NrcyAqIHJlY29yZFNpemU7XG4gIH1cblxuICBnZXQgY29uc3VtZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI2NvbnN1bWVkO1xuICB9XG5cbiAgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgLy8gQnl0ZXMgbGVmdCBmb3IgZW50cnlcbiAgICBjb25zdCBlbnRyeUJ5dGVzTGVmdCA9IHRoaXMuI2VudHJ5U2l6ZSAtIHRoaXMuI3JlYWQ7XG4gICAgY29uc3QgYnVmU2l6ZSA9IE1hdGgubWluKFxuICAgICAgLy8gYnVmU2l6ZSBjYW4ndCBiZSBncmVhdGVyIHRoYW4gcC5sZW5ndGggbm9yIGJ5dGVzIGxlZnQgaW4gdGhlIGVudHJ5XG4gICAgICBwLmxlbmd0aCxcbiAgICAgIGVudHJ5Qnl0ZXNMZWZ0LFxuICAgICk7XG5cbiAgICBpZiAoZW50cnlCeXRlc0xlZnQgPD0gMCkge1xuICAgICAgdGhpcy4jY29uc3VtZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2sgPSBuZXcgVWludDhBcnJheShidWZTaXplKTtcbiAgICBjb25zdCBuID0gYXdhaXQgcmVhZEJsb2NrKHRoaXMuI3JlYWRlciwgYmxvY2spO1xuICAgIGNvbnN0IGJ5dGVzTGVmdCA9IHRoaXMuI3NpemUgLSB0aGlzLiNyZWFkO1xuXG4gICAgdGhpcy4jcmVhZCArPSBuIHx8IDA7XG4gICAgaWYgKG4gPT09IG51bGwgfHwgYnl0ZXNMZWZ0IDw9IDApIHtcbiAgICAgIGlmIChuID09PSBudWxsKSB0aGlzLiNjb25zdW1lZCA9IHRydWU7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgemVybyBmaWxsZWRcbiAgICBjb25zdCBvZmZzZXQgPSBieXRlc0xlZnQgPCBuID8gYnl0ZXNMZWZ0IDogbjtcbiAgICBwLnNldChibG9jay5zdWJhcnJheSgwLCBvZmZzZXQpLCAwKTtcblxuICAgIHJldHVybiBvZmZzZXQgPCAwID8gbiAtIE1hdGguYWJzKG9mZnNldCkgOiBvZmZzZXQ7XG4gIH1cblxuICBhc3luYyBkaXNjYXJkKCkge1xuICAgIC8vIERpc2NhcmQgY3VycmVudCBlbnRyeVxuICAgIGlmICh0aGlzLiNjb25zdW1lZCkgcmV0dXJuO1xuICAgIHRoaXMuI2NvbnN1bWVkID0gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgKHRoaXMuI3JlYWRlciBhcyBTZWVrZXIpLnNlZWsgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgYXdhaXQgKHRoaXMuI3JlYWRlciBhcyBTZWVrZXIpLnNlZWsoXG4gICAgICAgIHRoaXMuI2VudHJ5U2l6ZSAtIHRoaXMuI3JlYWQsXG4gICAgICAgIERlbm8uU2Vla01vZGUuQ3VycmVudCxcbiAgICAgICk7XG4gICAgICB0aGlzLiNyZWFkID0gdGhpcy4jZW50cnlTaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCByZWFkQWxsKHRoaXMpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEEgY2xhc3MgdG8gZXh0cmFjdCBhIHRhciBhcmNoaXZlXG4gKi9cbmV4cG9ydCBjbGFzcyBVbnRhciB7XG4gIHJlYWRlcjogUmVhZGVyO1xuICBibG9jazogVWludDhBcnJheTtcbiAgI2VudHJ5OiBUYXJFbnRyeSB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihyZWFkZXI6IFJlYWRlcikge1xuICAgIHRoaXMucmVhZGVyID0gcmVhZGVyO1xuICAgIHRoaXMuYmxvY2sgPSBuZXcgVWludDhBcnJheShyZWNvcmRTaXplKTtcbiAgfVxuXG4gICNjaGVja3N1bShoZWFkZXI6IFVpbnQ4QXJyYXkpOiBudW1iZXIge1xuICAgIGxldCBzdW0gPSBpbml0aWFsQ2hlY2tzdW07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1MTI7IGkrKykge1xuICAgICAgaWYgKGkgPj0gMTQ4ICYmIGkgPCAxNTYpIHtcbiAgICAgICAgLy8gSWdub3JlIGNoZWNrc3VtIGhlYWRlclxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHN1bSArPSBoZWFkZXJbaV07XG4gICAgfVxuICAgIHJldHVybiBzdW07XG4gIH1cblxuICBhc3luYyAjZ2V0SGVhZGVyKCk6IFByb21pc2U8VGFySGVhZGVyIHwgbnVsbD4ge1xuICAgIGF3YWl0IHJlYWRCbG9jayh0aGlzLnJlYWRlciwgdGhpcy5ibG9jayk7XG4gICAgY29uc3QgaGVhZGVyID0gcGFyc2VIZWFkZXIodGhpcy5ibG9jayk7XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNoZWNrc3VtXG4gICAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICAgIGNvbnN0IGNoZWNrc3VtID0gdGhpcy4jY2hlY2tzdW0odGhpcy5ibG9jayk7XG5cbiAgICBpZiAocGFyc2VJbnQoZGVjb2Rlci5kZWNvZGUoaGVhZGVyLmNoZWNrc3VtKSwgOCkgIT09IGNoZWNrc3VtKSB7XG4gICAgICBpZiAoY2hlY2tzdW0gPT09IGluaXRpYWxDaGVja3N1bSkge1xuICAgICAgICAvLyBFT0ZcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjaGVja3N1bSBlcnJvclwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYWdpYyA9IGRlY29kZXIuZGVjb2RlKGhlYWRlci51c3Rhcik7XG5cbiAgICBpZiAobWFnaWMuaW5kZXhPZihcInVzdGFyXCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIGFyY2hpdmUgZm9ybWF0OiAke21hZ2ljfWApO1xuICAgIH1cblxuICAgIHJldHVybiBoZWFkZXI7XG4gIH1cblxuICAjZ2V0TWV0YWRhdGEoaGVhZGVyOiBUYXJIZWFkZXIpOiBUYXJNZXRhIHtcbiAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gICAgLy8gZ2V0IG1ldGEgZGF0YVxuICAgIGNvbnN0IG1ldGE6IFRhck1ldGEgPSB7XG4gICAgICBmaWxlTmFtZTogZGVjb2Rlci5kZWNvZGUodHJpbShoZWFkZXIuZmlsZU5hbWUpKSxcbiAgICB9O1xuICAgIGNvbnN0IGZpbGVOYW1lUHJlZml4ID0gdHJpbShoZWFkZXIuZmlsZU5hbWVQcmVmaXgpO1xuICAgIGlmIChmaWxlTmFtZVByZWZpeC5ieXRlTGVuZ3RoID4gMCkge1xuICAgICAgbWV0YS5maWxlTmFtZSA9IGRlY29kZXIuZGVjb2RlKGZpbGVOYW1lUHJlZml4KSArIFwiL1wiICsgbWV0YS5maWxlTmFtZTtcbiAgICB9XG4gICAgKFtcImZpbGVNb2RlXCIsIFwibXRpbWVcIiwgXCJ1aWRcIiwgXCJnaWRcIl0gYXMgW1xuICAgICAgXCJmaWxlTW9kZVwiLFxuICAgICAgXCJtdGltZVwiLFxuICAgICAgXCJ1aWRcIixcbiAgICAgIFwiZ2lkXCIsXG4gICAgXSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBjb25zdCBhcnIgPSB0cmltKGhlYWRlcltrZXldKTtcbiAgICAgIGlmIChhcnIuYnl0ZUxlbmd0aCA+IDApIHtcbiAgICAgICAgbWV0YVtrZXldID0gcGFyc2VJbnQoZGVjb2Rlci5kZWNvZGUoYXJyKSwgOCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgKFtcIm93bmVyXCIsIFwiZ3JvdXBcIiwgXCJ0eXBlXCJdIGFzIFtcIm93bmVyXCIsIFwiZ3JvdXBcIiwgXCJ0eXBlXCJdKS5mb3JFYWNoKFxuICAgICAgKGtleSkgPT4ge1xuICAgICAgICBjb25zdCBhcnIgPSB0cmltKGhlYWRlcltrZXldKTtcbiAgICAgICAgaWYgKGFyci5ieXRlTGVuZ3RoID4gMCkge1xuICAgICAgICAgIG1ldGFba2V5XSA9IGRlY29kZXIuZGVjb2RlKGFycik7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcblxuICAgIG1ldGEuZmlsZVNpemUgPSBwYXJzZUludChkZWNvZGVyLmRlY29kZShoZWFkZXIuZmlsZVNpemUpLCA4KTtcbiAgICBtZXRhLnR5cGUgPSBGaWxlVHlwZXNbcGFyc2VJbnQobWV0YS50eXBlISldID8/IG1ldGEudHlwZTtcblxuICAgIHJldHVybiBtZXRhO1xuICB9XG5cbiAgYXN5bmMgZXh0cmFjdCgpOiBQcm9taXNlPFRhckVudHJ5IHwgbnVsbD4ge1xuICAgIGlmICh0aGlzLiNlbnRyeSAmJiAhdGhpcy4jZW50cnkuY29uc3VtZWQpIHtcbiAgICAgIC8vIElmIGVudHJ5IGJvZHkgd2FzIG5vdCByZWFkLCBkaXNjYXJkIHRoZSBib2R5XG4gICAgICAvLyBzbyB3ZSBjYW4gcmVhZCB0aGUgbmV4dCBlbnRyeS5cbiAgICAgIGF3YWl0IHRoaXMuI2VudHJ5LmRpc2NhcmQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXIgPSBhd2FpdCB0aGlzLiNnZXRIZWFkZXIoKTtcbiAgICBpZiAoaGVhZGVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IG1ldGEgPSB0aGlzLiNnZXRNZXRhZGF0YShoZWFkZXIpO1xuXG4gICAgdGhpcy4jZW50cnkgPSBuZXcgVGFyRW50cnkobWV0YSwgaGVhZGVyLCB0aGlzLnJlYWRlcik7XG5cbiAgICByZXR1cm4gdGhpcy4jZW50cnk7XG4gIH1cblxuICBhc3luYyAqW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VGFyRW50cnk+IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgZW50cnkgPSBhd2FpdCB0aGlzLmV4dHJhY3QoKTtcblxuICAgICAgaWYgKGVudHJ5ID09PSBudWxsKSByZXR1cm47XG5cbiAgICAgIHlpZWxkIGVudHJ5O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBUYXJFbnRyeSB9O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMkJDLEdBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTREQyxHQUVELFNBQVMsV0FBVyxRQUFRLGtCQUFrQixDQUFDO0FBQy9DLFNBQVMsTUFBTSxFQUFFLGdCQUFnQixRQUFRLGlCQUFpQixDQUFDO0FBQzNELFNBQVMsTUFBTSxRQUFRLG9CQUFvQixDQUFDO0FBQzVDLFNBQVMsT0FBTyxRQUFRLDBCQUEwQixDQUFDO0FBS25ELE1BQU0sVUFBVSxHQUFHLEdBQUcsQUFBQztBQUN2QixNQUFNLEtBQUssR0FBRyxlQUFlLEFBQUM7QUFFOUIsc0ZBQXNGO0FBQ3RGLG1FQUFtRTtBQUNuRSxNQUFNLGVBQWUsR0FBRyxDQUFDLEdBQUcsRUFBRSxBQUFDO0FBRS9CLGVBQWUsU0FBUyxDQUN0QixNQUFtQixFQUNuQixDQUFh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