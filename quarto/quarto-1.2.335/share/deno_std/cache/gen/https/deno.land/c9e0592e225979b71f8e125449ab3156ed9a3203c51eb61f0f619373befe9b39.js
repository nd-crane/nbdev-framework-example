// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { deepAssign } from "../../_util/deep_assign.ts";
export class TOMLParseError extends Error {
}
export class Scanner {
    #whitespace;
    #position;
    constructor(source){
        this.source = source;
        this.#whitespace = /[ \t]/;
        this.#position = 0;
    }
    /**
   * Get current character
   * @param index - relative index from current position
   */ char(index = 0) {
        return this.source[this.#position + index] ?? "";
    }
    /**
   * Get sliced string
   * @param start - start position relative from current position
   * @param end - end position relative from current position
   */ slice(start, end) {
        return this.source.slice(this.#position + start, this.#position + end);
    }
    /**
   * Move position to next
   */ next(count) {
        if (typeof count === "number") {
            for(let i = 0; i < count; i++){
                this.#position++;
            }
        } else {
            this.#position++;
        }
    }
    /**
   * Move position until current char is not a whitespace, EOL, or comment.
   * @param options.inline - skip only whitespaces
   */ nextUntilChar(options = {
        comment: true
    }) {
        if (options.inline) {
            while(this.#whitespace.test(this.char()) && !this.eof()){
                this.next();
            }
        } else {
            while(!this.eof()){
                const char = this.char();
                if (this.#whitespace.test(char) || this.isCurrentCharEOL()) {
                    this.next();
                } else if (options.comment && this.char() === "#") {
                    // entering comment
                    while(!this.isCurrentCharEOL() && !this.eof()){
                        this.next();
                    }
                } else {
                    break;
                }
            }
        }
        // Invalid if current char is other kinds of whitespace
        if (!this.isCurrentCharEOL() && /\s/.test(this.char())) {
            const escaped = "\\u" + this.char().charCodeAt(0).toString(16);
            throw new TOMLParseError(`Contains invalid whitespaces: \`${escaped}\``);
        }
    }
    /**
   * Position reached EOF or not
   */ eof() {
        return this.position() >= this.source.length;
    }
    /**
   * Get current position
   */ position() {
        return this.#position;
    }
    isCurrentCharEOL() {
        return this.char() === "\n" || this.slice(0, 2) === "\r\n";
    }
    source;
}
// -----------------------
// Utilities
// -----------------------
function success(body) {
    return {
        ok: true,
        body
    };
}
function failure() {
    return {
        ok: false
    };
}
export const Utils = {
    unflat (keys, values = {}, cObj) {
        const out = {};
        if (keys.length === 0) {
            return cObj;
        } else {
            if (!cObj) {
                cObj = values;
            }
            const key = keys[keys.length - 1];
            if (typeof key === "string") {
                out[key] = cObj;
            }
            return this.unflat(keys.slice(0, -1), values, out);
        }
    },
    deepAssignWithTable (target, table) {
        if (table.key.length === 0) {
            throw new Error("Unexpected key length");
        }
        const value = target[table.key[0]];
        if (typeof value === "undefined") {
            Object.assign(target, this.unflat(table.key, table.type === "Table" ? table.value : [
                table.value
            ]));
        } else if (Array.isArray(value)) {
            if (table.type === "TableArray" && table.key.length === 1) {
                value.push(table.value);
            } else {
                const last = value[value.length - 1];
                Utils.deepAssignWithTable(last, {
                    type: table.type,
                    key: table.key.slice(1),
                    value: table.value
                });
            }
        } else if (typeof value === "object" && value !== null) {
            Utils.deepAssignWithTable(value, {
                type: table.type,
                key: table.key.slice(1),
                value: table.value
            });
        } else {
            throw new Error("Unexpected assign");
        }
    }
};
// ---------------------------------
// Parser combinators and generators
// ---------------------------------
function or(parsers) {
    return function Or(scanner) {
        for (const parse of parsers){
            const result = parse(scanner);
            if (result.ok) {
                return result;
            }
        }
        return failure();
    };
}
function join(parser, separator) {
    const Separator = character(separator);
    return function Join(scanner) {
        const first = parser(scanner);
        if (!first.ok) {
            return failure();
        }
        const out = [
            first.body
        ];
        while(!scanner.eof()){
            if (!Separator(scanner).ok) {
                break;
            }
            const result = parser(scanner);
            if (result.ok) {
                out.push(result.body);
            } else {
                throw new TOMLParseError(`Invalid token after "${separator}"`);
            }
        }
        return success(out);
    };
}
function kv(keyParser, separator, valueParser) {
    const Separator = character(separator);
    return function Kv(scanner) {
        const key = keyParser(scanner);
        if (!key.ok) {
            return failure();
        }
        const sep = Separator(scanner);
        if (!sep.ok) {
            throw new TOMLParseError(`key/value pair doesn't have "${separator}"`);
        }
        const value = valueParser(scanner);
        if (!value.ok) {
            throw new TOMLParseError(`Value of key/value pair is invalid data format`);
        }
        return success(Utils.unflat(key.body, value.body));
    };
}
function merge(parser) {
    return function Merge(scanner) {
        const result = parser(scanner);
        if (!result.ok) {
            return failure();
        }
        const body = {};
        for (const record of result.body){
            if (typeof body === "object" && body !== null) {
                deepAssign(body, record);
            }
        }
        return success(body);
    };
}
function repeat(parser) {
    return function Repeat(scanner) {
        const body = [];
        while(!scanner.eof()){
            const result = parser(scanner);
            if (result.ok) {
                body.push(result.body);
            } else {
                break;
            }
            scanner.nextUntilChar();
        }
        if (body.length === 0) {
            return failure();
        }
        return success(body);
    };
}
function surround(left, parser, right) {
    const Left = character(left);
    const Right = character(right);
    return function Surround(scanner) {
        if (!Left(scanner).ok) {
            return failure();
        }
        const result = parser(scanner);
        if (!result.ok) {
            throw new TOMLParseError(`Invalid token after "${left}"`);
        }
        if (!Right(scanner).ok) {
            throw new TOMLParseError(`Not closed by "${right}" after started with "${left}"`);
        }
        return success(result.body);
    };
}
function character(str) {
    return function character(scanner) {
        scanner.nextUntilChar({
            inline: true
        });
        if (scanner.slice(0, str.length) === str) {
            scanner.next(str.length);
        } else {
            return failure();
        }
        scanner.nextUntilChar({
            inline: true
        });
        return success(undefined);
    };
}
// -----------------------
// Parser components
// -----------------------
const Patterns = {
    BARE_KEY: /[A-Za-z0-9_-]/,
    FLOAT: /[0-9_\.e+\-]/i,
    END_OF_VALUE: /[ \t\r\n#,}]/
};
export function BareKey(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    if (!scanner.char() || !Patterns.BARE_KEY.test(scanner.char())) {
        return failure();
    }
    const acc = [];
    while(scanner.char() && Patterns.BARE_KEY.test(scanner.char())){
        acc.push(scanner.char());
        scanner.next();
    }
    const key = acc.join("");
    return success(key);
}
function EscapeSequence(scanner) {
    if (scanner.char() === "\\") {
        scanner.next();
        // See https://toml.io/en/v1.0.0-rc.3#string
        switch(scanner.char()){
            case "b":
                scanner.next();
                return success("\b");
            case "t":
                scanner.next();
                return success("\t");
            case "n":
                scanner.next();
                return success("\n");
            case "f":
                scanner.next();
                return success("\f");
            case "r":
                scanner.next();
                return success("\r");
            case "u":
            case "U":
                {
                    // Unicode character
                    const codePointLen = scanner.char() === "u" ? 4 : 6;
                    const codePoint = parseInt("0x" + scanner.slice(1, 1 + codePointLen), 16);
                    const str = String.fromCodePoint(codePoint);
                    scanner.next(codePointLen + 1);
                    return success(str);
                }
            case '"':
                scanner.next();
                return success('"');
            case "\\":
                scanner.next();
                return success("\\");
            default:
                scanner.next();
                return success(scanner.char());
        }
    } else {
        return failure();
    }
}
export function BasicString(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    if (scanner.char() === '"') {
        scanner.next();
    } else {
        return failure();
    }
    const acc = [];
    while(scanner.char() !== '"' && !scanner.eof()){
        if (scanner.char() === "\n") {
            throw new TOMLParseError("Single-line string cannot contain EOL");
        }
        const escapedChar = EscapeSequence(scanner);
        if (escapedChar.ok) {
            acc.push(escapedChar.body);
        } else {
            acc.push(scanner.char());
            scanner.next();
        }
    }
    if (scanner.eof()) {
        throw new TOMLParseError(`Single-line string is not closed:\n${acc.join("")}`);
    }
    scanner.next(); // skip last '""
    return success(acc.join(""));
}
export function LiteralString(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    if (scanner.char() === "'") {
        scanner.next();
    } else {
        return failure();
    }
    const acc = [];
    while(scanner.char() !== "'" && !scanner.eof()){
        if (scanner.char() === "\n") {
            throw new TOMLParseError("Single-line string cannot contain EOL");
        }
        acc.push(scanner.char());
        scanner.next();
    }
    if (scanner.eof()) {
        throw new TOMLParseError(`Single-line string is not closed:\n${acc.join("")}`);
    }
    scanner.next(); // skip last "'"
    return success(acc.join(""));
}
export function MultilineBasicString(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    if (scanner.slice(0, 3) === '"""') {
        scanner.next(3);
    } else {
        return failure();
    }
    if (scanner.char() === "\n") {
        // The first newline is trimmed
        scanner.next();
    }
    const acc = [];
    while(scanner.slice(0, 3) !== '"""' && !scanner.eof()){
        // line ending backslash
        if (scanner.slice(0, 2) === "\\\n") {
            scanner.next();
            scanner.nextUntilChar({
                comment: false
            });
            continue;
        }
        const escapedChar = EscapeSequence(scanner);
        if (escapedChar.ok) {
            acc.push(escapedChar.body);
        } else {
            acc.push(scanner.char());
            scanner.next();
        }
    }
    if (scanner.eof()) {
        throw new TOMLParseError(`Multi-line string is not closed:\n${acc.join("")}`);
    }
    // if ends with 4 `"`, push the fist `"` to string
    if (scanner.char(3) === '"') {
        acc.push('"');
        scanner.next();
    }
    scanner.next(3); // skip last '""""
    return success(acc.join(""));
}
export function MultilineLiteralString(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    if (scanner.slice(0, 3) === "'''") {
        scanner.next(3);
    } else {
        return failure();
    }
    if (scanner.char() === "\n") {
        // The first newline is trimmed
        scanner.next();
    }
    const acc = [];
    while(scanner.slice(0, 3) !== "'''" && !scanner.eof()){
        acc.push(scanner.char());
        scanner.next();
    }
    if (scanner.eof()) {
        throw new TOMLParseError(`Multi-line string is not closed:\n${acc.join("")}`);
    }
    // if ends with 4 `'`, push the fist `'` to string
    if (scanner.char(3) === "'") {
        acc.push("'");
        scanner.next();
    }
    scanner.next(3); // skip last "'''"
    return success(acc.join(""));
}
const symbolPairs = [
    [
        "true",
        true
    ],
    [
        "false",
        false
    ],
    [
        "inf",
        Infinity
    ],
    [
        "+inf",
        Infinity
    ],
    [
        "-inf",
        -Infinity
    ],
    [
        "nan",
        NaN
    ],
    [
        "+nan",
        NaN
    ],
    [
        "-nan",
        NaN
    ], 
];
export function Symbols(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    const found = symbolPairs.find(([str])=>scanner.slice(0, str.length) === str);
    if (!found) {
        return failure();
    }
    const [str, value] = found;
    scanner.next(str.length);
    return success(value);
}
export const DottedKey = join(or([
    BareKey,
    BasicString,
    LiteralString
]), ".");
export function Integer(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    // If binary / octal / hex
    const first2 = scanner.slice(0, 2);
    if (first2.length === 2 && /0(?:x|o|b)/i.test(first2)) {
        scanner.next(2);
        const acc = [
            first2
        ];
        while(/[0-9a-f_]/i.test(scanner.char()) && !scanner.eof()){
            acc.push(scanner.char());
            scanner.next();
        }
        if (acc.length === 1) {
            return failure();
        }
        return success(acc.join(""));
    }
    const acc1 = [];
    if (/[+-]/.test(scanner.char())) {
        acc1.push(scanner.char());
        scanner.next();
    }
    while(/[0-9_]/.test(scanner.char()) && !scanner.eof()){
        acc1.push(scanner.char());
        scanner.next();
    }
    if (acc1.length === 0 || acc1.length === 1 && /[+-]/.test(acc1[0])) {
        return failure();
    }
    const int = parseInt(acc1.filter((char)=>char !== "_").join(""));
    return success(int);
}
export function Float(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    // lookahead validation is needed for integer value is similar to float
    let position = 0;
    while(scanner.char(position) && !Patterns.END_OF_VALUE.test(scanner.char(position))){
        if (!Patterns.FLOAT.test(scanner.char(position))) {
            return failure();
        }
        position++;
    }
    const acc = [];
    if (/[+-]/.test(scanner.char())) {
        acc.push(scanner.char());
        scanner.next();
    }
    while(Patterns.FLOAT.test(scanner.char()) && !scanner.eof()){
        acc.push(scanner.char());
        scanner.next();
    }
    if (acc.length === 0) {
        return failure();
    }
    const float = parseFloat(acc.filter((char)=>char !== "_").join(""));
    if (isNaN(float)) {
        return failure();
    }
    return success(float);
}
export function DateTime(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    let dateStr = scanner.slice(0, 10);
    // example: 1979-05-27
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        scanner.next(10);
    } else {
        return failure();
    }
    const acc = [];
    // example: 1979-05-27T00:32:00Z
    while(/[ 0-9TZ.:-]/.test(scanner.char()) && !scanner.eof()){
        acc.push(scanner.char());
        scanner.next();
    }
    dateStr += acc.join("");
    const date = new Date(dateStr.trim());
    // invalid date
    if (isNaN(date.getTime())) {
        throw new TOMLParseError(`Invalid date string "${dateStr}"`);
    }
    return success(date);
}
export function LocalTime(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    let timeStr = scanner.slice(0, 8);
    if (/^(\d{2}):(\d{2}):(\d{2})/.test(timeStr)) {
        scanner.next(8);
    } else {
        return failure();
    }
    const acc = [];
    if (scanner.char() === ".") {
        acc.push(scanner.char());
        scanner.next();
    } else {
        return success(timeStr);
    }
    while(/[0-9]/.test(scanner.char()) && !scanner.eof()){
        acc.push(scanner.char());
        scanner.next();
    }
    timeStr += acc.join("");
    return success(timeStr);
}
export function ArrayValue(scanner) {
    scanner.nextUntilChar({
        inline: true
    });
    if (scanner.char() === "[") {
        scanner.next();
    } else {
        return failure();
    }
    const array = [];
    while(!scanner.eof()){
        scanner.nextUntilChar();
        const result = Value(scanner);
        if (result.ok) {
            array.push(result.body);
        } else {
            break;
        }
        scanner.nextUntilChar({
            inline: true
        });
        // may have a next item, but trailing comma is allowed at array
        if (scanner.char() === ",") {
            scanner.next();
        } else {
            break;
        }
    }
    scanner.nextUntilChar();
    if (scanner.char() === "]") {
        scanner.next();
    } else {
        throw new TOMLParseError("Array is not closed");
    }
    return success(array);
}
export function InlineTable(scanner) {
    scanner.nextUntilChar();
    const pairs = surround("{", join(Pair, ","), "}")(scanner);
    if (!pairs.ok) {
        return failure();
    }
    const table = {};
    for (const pair of pairs.body){
        deepAssign(table, pair);
    }
    return success(table);
}
export const Value = or([
    MultilineBasicString,
    MultilineLiteralString,
    BasicString,
    LiteralString,
    Symbols,
    DateTime,
    LocalTime,
    Float,
    Integer,
    ArrayValue,
    InlineTable, 
]);
export const Pair = kv(DottedKey, "=", Value);
export function Block(scanner) {
    scanner.nextUntilChar();
    const result = merge(repeat(Pair))(scanner);
    if (result.ok) {
        return success({
            type: "Block",
            value: result.body
        });
    } else {
        return failure();
    }
}
export const TableHeader = surround("[", DottedKey, "]");
export function Table(scanner) {
    scanner.nextUntilChar();
    const header = TableHeader(scanner);
    if (!header.ok) {
        return failure();
    }
    scanner.nextUntilChar();
    const block = Block(scanner);
    return success({
        type: "Table",
        key: header.body,
        value: block.ok ? block.body.value : {}
    });
}
export const TableArrayHeader = surround("[[", DottedKey, "]]");
export function TableArray(scanner) {
    scanner.nextUntilChar();
    const header = TableArrayHeader(scanner);
    if (!header.ok) {
        return failure();
    }
    scanner.nextUntilChar();
    const block = Block(scanner);
    return success({
        type: "TableArray",
        key: header.body,
        value: block.ok ? block.body.value : {}
    });
}
export function Toml(scanner) {
    const blocks = repeat(or([
        Block,
        TableArray,
        Table
    ]))(scanner);
    if (!blocks.ok) {
        return failure();
    }
    const body = {};
    for (const block of blocks.body){
        switch(block.type){
            case "Block":
                {
                    deepAssign(body, block.value);
                    break;
                }
            case "Table":
                {
                    Utils.deepAssignWithTable(body, block);
                    break;
                }
            case "TableArray":
                {
                    Utils.deepAssignWithTable(body, block);
                    break;
                }
        }
    }
    return success(body);
}
export function ParserFactory(parser) {
    return function parse(tomlString) {
        const scanner = new Scanner(tomlString);
        let parsed = null;
        let err = null;
        try {
            parsed = parser(scanner);
        } catch (e) {
            err = e instanceof Error ? e : new Error("[non-error thrown]");
        }
        if (err || !parsed || !parsed.ok || !scanner.eof()) {
            const position = scanner.position();
            const subStr = tomlString.slice(0, position);
            const lines = subStr.split("\n");
            const row = lines.length;
            const column = (()=>{
                let count = subStr.length;
                for (const line of lines){
                    if (count > line.length) {
                        count -= line.length + 1;
                    } else {
                        return count;
                    }
                }
                return count;
            })();
            const message = `Parse error on line ${row}, column ${column}: ${err ? err.message : `Unexpected character: "${scanner.char()}"`}`;
            throw new TOMLParseError(message);
        }
        return parsed.body;
    };
}
/**
 * Parse parses TOML string into an object.
 * @param tomlString
 */ export const parse = ParserFactory(Toml);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2VuY29kaW5nL190b21sL3BhcnNlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBkZWVwQXNzaWduIH0gZnJvbSBcIi4uLy4uL191dGlsL2RlZXBfYXNzaWduLnRzXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW50ZXJmYWNlcyBhbmQgYmFzZSBjbGFzc2VzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuaW50ZXJmYWNlIFN1Y2Nlc3M8VD4ge1xuICBvazogdHJ1ZTtcbiAgYm9keTogVDtcbn1cbmludGVyZmFjZSBGYWlsdXJlIHtcbiAgb2s6IGZhbHNlO1xufVxudHlwZSBQYXJzZVJlc3VsdDxUPiA9IFN1Y2Nlc3M8VD4gfCBGYWlsdXJlO1xuXG50eXBlIFBhcnNlckNvbXBvbmVudDxUID0gdW5rbm93bj4gPSAoc2Nhbm5lcjogU2Nhbm5lcikgPT4gUGFyc2VSZXN1bHQ8VD47XG5cbnR5cGUgQmxvY2tQYXJzZVJlc3VsdEJvZHkgPSB7XG4gIHR5cGU6IFwiQmxvY2tcIjtcbiAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xufSB8IHtcbiAgdHlwZTogXCJUYWJsZVwiO1xuICBrZXk6IHN0cmluZ1tdO1xuICB2YWx1ZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59IHwge1xuICB0eXBlOiBcIlRhYmxlQXJyYXlcIjtcbiAga2V5OiBzdHJpbmdbXTtcbiAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xufTtcblxuZXhwb3J0IGNsYXNzIFRPTUxQYXJzZUVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuZXhwb3J0IGNsYXNzIFNjYW5uZXIge1xuICAjd2hpdGVzcGFjZSA9IC9bIFxcdF0vO1xuICAjcG9zaXRpb24gPSAwO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHNvdXJjZTogc3RyaW5nKSB7fVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCBjaGFyYWN0ZXJcbiAgICogQHBhcmFtIGluZGV4IC0gcmVsYXRpdmUgaW5kZXggZnJvbSBjdXJyZW50IHBvc2l0aW9uXG4gICAqL1xuICBjaGFyKGluZGV4ID0gMCkge1xuICAgIHJldHVybiB0aGlzLnNvdXJjZVt0aGlzLiNwb3NpdGlvbiArIGluZGV4XSA/PyBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzbGljZWQgc3RyaW5nXG4gICAqIEBwYXJhbSBzdGFydCAtIHN0YXJ0IHBvc2l0aW9uIHJlbGF0aXZlIGZyb20gY3VycmVudCBwb3NpdGlvblxuICAgKiBAcGFyYW0gZW5kIC0gZW5kIHBvc2l0aW9uIHJlbGF0aXZlIGZyb20gY3VycmVudCBwb3NpdGlvblxuICAgKi9cbiAgc2xpY2Uoc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZSh0aGlzLiNwb3NpdGlvbiArIHN0YXJ0LCB0aGlzLiNwb3NpdGlvbiArIGVuZCk7XG4gIH1cblxuICAvKipcbiAgICogTW92ZSBwb3NpdGlvbiB0byBuZXh0XG4gICAqL1xuICBuZXh0KGNvdW50PzogbnVtYmVyKSB7XG4gICAgaWYgKHR5cGVvZiBjb3VudCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHRoaXMuI3Bvc2l0aW9uKys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI3Bvc2l0aW9uKys7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1vdmUgcG9zaXRpb24gdW50aWwgY3VycmVudCBjaGFyIGlzIG5vdCBhIHdoaXRlc3BhY2UsIEVPTCwgb3IgY29tbWVudC5cbiAgICogQHBhcmFtIG9wdGlvbnMuaW5saW5lIC0gc2tpcCBvbmx5IHdoaXRlc3BhY2VzXG4gICAqL1xuICBuZXh0VW50aWxDaGFyKFxuICAgIG9wdGlvbnM6IHsgaW5saW5lPzogYm9vbGVhbjsgY29tbWVudD86IGJvb2xlYW4gfSA9IHsgY29tbWVudDogdHJ1ZSB9LFxuICApIHtcbiAgICBpZiAob3B0aW9ucy5pbmxpbmUpIHtcbiAgICAgIHdoaWxlICh0aGlzLiN3aGl0ZXNwYWNlLnRlc3QodGhpcy5jaGFyKCkpICYmICF0aGlzLmVvZigpKSB7XG4gICAgICAgIHRoaXMubmV4dCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgY29uc3QgY2hhciA9IHRoaXMuY2hhcigpO1xuICAgICAgICBpZiAodGhpcy4jd2hpdGVzcGFjZS50ZXN0KGNoYXIpIHx8IHRoaXMuaXNDdXJyZW50Q2hhckVPTCgpKSB7XG4gICAgICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5jb21tZW50ICYmIHRoaXMuY2hhcigpID09PSBcIiNcIikge1xuICAgICAgICAgIC8vIGVudGVyaW5nIGNvbW1lbnRcbiAgICAgICAgICB3aGlsZSAoIXRoaXMuaXNDdXJyZW50Q2hhckVPTCgpICYmICF0aGlzLmVvZigpKSB7XG4gICAgICAgICAgICB0aGlzLm5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gSW52YWxpZCBpZiBjdXJyZW50IGNoYXIgaXMgb3RoZXIga2luZHMgb2Ygd2hpdGVzcGFjZVxuICAgIGlmICghdGhpcy5pc0N1cnJlbnRDaGFyRU9MKCkgJiYgL1xccy8udGVzdCh0aGlzLmNoYXIoKSkpIHtcbiAgICAgIGNvbnN0IGVzY2FwZWQgPSBcIlxcXFx1XCIgKyB0aGlzLmNoYXIoKS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KTtcbiAgICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihgQ29udGFpbnMgaW52YWxpZCB3aGl0ZXNwYWNlczogXFxgJHtlc2NhcGVkfVxcYGApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQb3NpdGlvbiByZWFjaGVkIEVPRiBvciBub3RcbiAgICovXG4gIGVvZigpIHtcbiAgICByZXR1cm4gdGhpcy5wb3NpdGlvbigpID49IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY3VycmVudCBwb3NpdGlvblxuICAgKi9cbiAgcG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuI3Bvc2l0aW9uO1xuICB9XG5cbiAgaXNDdXJyZW50Q2hhckVPTCgpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFyKCkgPT09IFwiXFxuXCIgfHwgdGhpcy5zbGljZSgwLCAyKSA9PT0gXCJcXHJcXG5cIjtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gVXRpbGl0aWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBzdWNjZXNzPFQ+KGJvZHk6IFQpOiBTdWNjZXNzPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBvazogdHJ1ZSxcbiAgICBib2R5LFxuICB9O1xufVxuZnVuY3Rpb24gZmFpbHVyZSgpOiBGYWlsdXJlIHtcbiAgcmV0dXJuIHtcbiAgICBvazogZmFsc2UsXG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBVdGlscyA9IHtcbiAgdW5mbGF0KFxuICAgIGtleXM6IHN0cmluZ1tdLFxuICAgIHZhbHVlczogdW5rbm93biA9IHt9LFxuICAgIGNPYmo/OiB1bmtub3duLFxuICApOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGNPYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghY09iaikge1xuICAgICAgICBjT2JqID0gdmFsdWVzO1xuICAgICAgfVxuICAgICAgY29uc3Qga2V5OiBzdHJpbmcgfCB1bmRlZmluZWQgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBvdXRba2V5XSA9IGNPYmo7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy51bmZsYXQoa2V5cy5zbGljZSgwLCAtMSksIHZhbHVlcywgb3V0KTtcbiAgICB9XG4gIH0sXG4gIGRlZXBBc3NpZ25XaXRoVGFibGUodGFyZ2V0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgdGFibGU6IHtcbiAgICB0eXBlOiBcIlRhYmxlXCIgfCBcIlRhYmxlQXJyYXlcIjtcbiAgICBrZXk6IHN0cmluZ1tdO1xuICAgIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgfSkge1xuICAgIGlmICh0YWJsZS5rZXkubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIGtleSBsZW5ndGhcIik7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gdGFyZ2V0W3RhYmxlLmtleVswXV07XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICB0YXJnZXQsXG4gICAgICAgIHRoaXMudW5mbGF0KFxuICAgICAgICAgIHRhYmxlLmtleSxcbiAgICAgICAgICB0YWJsZS50eXBlID09PSBcIlRhYmxlXCIgPyB0YWJsZS52YWx1ZSA6IFt0YWJsZS52YWx1ZV0sXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGlmICh0YWJsZS50eXBlID09PSBcIlRhYmxlQXJyYXlcIiAmJiB0YWJsZS5rZXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHZhbHVlLnB1c2godGFibGUudmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdO1xuICAgICAgICBVdGlscy5kZWVwQXNzaWduV2l0aFRhYmxlKGxhc3QsIHtcbiAgICAgICAgICB0eXBlOiB0YWJsZS50eXBlLFxuICAgICAgICAgIGtleTogdGFibGUua2V5LnNsaWNlKDEpLFxuICAgICAgICAgIHZhbHVlOiB0YWJsZS52YWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgIFV0aWxzLmRlZXBBc3NpZ25XaXRoVGFibGUodmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIHtcbiAgICAgICAgdHlwZTogdGFibGUudHlwZSxcbiAgICAgICAga2V5OiB0YWJsZS5rZXkuc2xpY2UoMSksXG4gICAgICAgIHZhbHVlOiB0YWJsZS52YWx1ZSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIGFzc2lnblwiKTtcbiAgICB9XG4gIH0sXG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFBhcnNlciBjb21iaW5hdG9ycyBhbmQgZ2VuZXJhdG9yc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIG9yPFQ+KHBhcnNlcnM6IFBhcnNlckNvbXBvbmVudDxUPltdKTogUGFyc2VyQ29tcG9uZW50PFQ+IHtcbiAgcmV0dXJuIGZ1bmN0aW9uIE9yKHNjYW5uZXI6IFNjYW5uZXIpOiBQYXJzZVJlc3VsdDxUPiB7XG4gICAgZm9yIChjb25zdCBwYXJzZSBvZiBwYXJzZXJzKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZShzY2FubmVyKTtcbiAgICAgIGlmIChyZXN1bHQub2spIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gam9pbjxUPihcbiAgcGFyc2VyOiBQYXJzZXJDb21wb25lbnQ8VD4sXG4gIHNlcGFyYXRvcjogc3RyaW5nLFxuKTogUGFyc2VyQ29tcG9uZW50PFRbXT4ge1xuICBjb25zdCBTZXBhcmF0b3IgPSBjaGFyYWN0ZXIoc2VwYXJhdG9yKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIEpvaW4oc2Nhbm5lcjogU2Nhbm5lcik6IFBhcnNlUmVzdWx0PFRbXT4ge1xuICAgIGNvbnN0IGZpcnN0ID0gcGFyc2VyKHNjYW5uZXIpO1xuICAgIGlmICghZmlyc3Qub2spIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKCk7XG4gICAgfVxuICAgIGNvbnN0IG91dDogVFtdID0gW2ZpcnN0LmJvZHldO1xuICAgIHdoaWxlICghc2Nhbm5lci5lb2YoKSkge1xuICAgICAgaWYgKCFTZXBhcmF0b3Ioc2Nhbm5lcikub2spIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIoc2Nhbm5lcik7XG4gICAgICBpZiAocmVzdWx0Lm9rKSB7XG4gICAgICAgIG91dC5wdXNoKHJlc3VsdC5ib2R5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihgSW52YWxpZCB0b2tlbiBhZnRlciBcIiR7c2VwYXJhdG9yfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdWNjZXNzKG91dCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGt2PFQ+KFxuICBrZXlQYXJzZXI6IFBhcnNlckNvbXBvbmVudDxzdHJpbmdbXT4sXG4gIHNlcGFyYXRvcjogc3RyaW5nLFxuICB2YWx1ZVBhcnNlcjogUGFyc2VyQ29tcG9uZW50PFQ+LFxuKTogUGFyc2VyQ29tcG9uZW50PHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9PiB7XG4gIGNvbnN0IFNlcGFyYXRvciA9IGNoYXJhY3RlcihzZXBhcmF0b3IpO1xuICByZXR1cm4gZnVuY3Rpb24gS3YoXG4gICAgc2Nhbm5lcjogU2Nhbm5lcixcbiAgKTogUGFyc2VSZXN1bHQ8eyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0+IHtcbiAgICBjb25zdCBrZXkgPSBrZXlQYXJzZXIoc2Nhbm5lcik7XG4gICAgaWYgKCFrZXkub2spIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKCk7XG4gICAgfVxuICAgIGNvbnN0IHNlcCA9IFNlcGFyYXRvcihzY2FubmVyKTtcbiAgICBpZiAoIXNlcC5vaykge1xuICAgICAgdGhyb3cgbmV3IFRPTUxQYXJzZUVycm9yKGBrZXkvdmFsdWUgcGFpciBkb2Vzbid0IGhhdmUgXCIke3NlcGFyYXRvcn1cImApO1xuICAgIH1cbiAgICBjb25zdCB2YWx1ZSA9IHZhbHVlUGFyc2VyKHNjYW5uZXIpO1xuICAgIGlmICghdmFsdWUub2spIHtcbiAgICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihcbiAgICAgICAgYFZhbHVlIG9mIGtleS92YWx1ZSBwYWlyIGlzIGludmFsaWQgZGF0YSBmb3JtYXRgLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1Y2Nlc3MoVXRpbHMudW5mbGF0KGtleS5ib2R5LCB2YWx1ZS5ib2R5KSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG1lcmdlKFxuICBwYXJzZXI6IFBhcnNlckNvbXBvbmVudDx1bmtub3duW10+LFxuKTogUGFyc2VyQ29tcG9uZW50PFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gIHJldHVybiBmdW5jdGlvbiBNZXJnZShcbiAgICBzY2FubmVyOiBTY2FubmVyLFxuICApOiBQYXJzZVJlc3VsdDxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHBhcnNlcihzY2FubmVyKTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgICB9XG4gICAgY29uc3QgYm9keSA9IHt9O1xuICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIHJlc3VsdC5ib2R5KSB7XG4gICAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwib2JqZWN0XCIgJiYgYm9keSAhPT0gbnVsbCkge1xuICAgICAgICBkZWVwQXNzaWduKGJvZHksIHJlY29yZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdWNjZXNzKGJvZHkpO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXBlYXQ8VD4oXG4gIHBhcnNlcjogUGFyc2VyQ29tcG9uZW50PFQ+LFxuKTogUGFyc2VyQ29tcG9uZW50PFRbXT4ge1xuICByZXR1cm4gZnVuY3Rpb24gUmVwZWF0KFxuICAgIHNjYW5uZXI6IFNjYW5uZXIsXG4gICkge1xuICAgIGNvbnN0IGJvZHk6IFRbXSA9IFtdO1xuICAgIHdoaWxlICghc2Nhbm5lci5lb2YoKSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gcGFyc2VyKHNjYW5uZXIpO1xuICAgICAgaWYgKHJlc3VsdC5vaykge1xuICAgICAgICBib2R5LnB1c2gocmVzdWx0LmJvZHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzY2FubmVyLm5leHRVbnRpbENoYXIoKTtcbiAgICB9XG4gICAgaWYgKGJvZHkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZmFpbHVyZSgpO1xuICAgIH1cbiAgICByZXR1cm4gc3VjY2Vzcyhib2R5KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gc3Vycm91bmQ8VD4oXG4gIGxlZnQ6IHN0cmluZyxcbiAgcGFyc2VyOiBQYXJzZXJDb21wb25lbnQ8VD4sXG4gIHJpZ2h0OiBzdHJpbmcsXG4pOiBQYXJzZXJDb21wb25lbnQ8VD4ge1xuICBjb25zdCBMZWZ0ID0gY2hhcmFjdGVyKGxlZnQpO1xuICBjb25zdCBSaWdodCA9IGNoYXJhY3RlcihyaWdodCk7XG4gIHJldHVybiBmdW5jdGlvbiBTdXJyb3VuZChzY2FubmVyOiBTY2FubmVyKSB7XG4gICAgaWYgKCFMZWZ0KHNjYW5uZXIpLm9rKSB7XG4gICAgICByZXR1cm4gZmFpbHVyZSgpO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBwYXJzZXIoc2Nhbm5lcik7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihgSW52YWxpZCB0b2tlbiBhZnRlciBcIiR7bGVmdH1cImApO1xuICAgIH1cbiAgICBpZiAoIVJpZ2h0KHNjYW5uZXIpLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgVE9NTFBhcnNlRXJyb3IoXG4gICAgICAgIGBOb3QgY2xvc2VkIGJ5IFwiJHtyaWdodH1cIiBhZnRlciBzdGFydGVkIHdpdGggXCIke2xlZnR9XCJgLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1Y2Nlc3MocmVzdWx0LmJvZHkpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjaGFyYWN0ZXIoc3RyOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNoYXJhY3RlcihzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8dm9pZD4ge1xuICAgIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcbiAgICBpZiAoc2Nhbm5lci5zbGljZSgwLCBzdHIubGVuZ3RoKSA9PT0gc3RyKSB7XG4gICAgICBzY2FubmVyLm5leHQoc3RyLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKCk7XG4gICAgfVxuICAgIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcbiAgICByZXR1cm4gc3VjY2Vzcyh1bmRlZmluZWQpO1xuICB9O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUGFyc2VyIGNvbXBvbmVudHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IFBhdHRlcm5zID0ge1xuICBCQVJFX0tFWTogL1tBLVphLXowLTlfLV0vLFxuICBGTE9BVDogL1swLTlfXFwuZStcXC1dL2ksXG4gIEVORF9PRl9WQUxVRTogL1sgXFx0XFxyXFxuIyx9XS8sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gQmFyZUtleShzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8c3RyaW5nPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcbiAgaWYgKCFzY2FubmVyLmNoYXIoKSB8fCAhUGF0dGVybnMuQkFSRV9LRVkudGVzdChzY2FubmVyLmNoYXIoKSkpIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG4gIGNvbnN0IGFjYzogc3RyaW5nW10gPSBbXTtcbiAgd2hpbGUgKHNjYW5uZXIuY2hhcigpICYmIFBhdHRlcm5zLkJBUkVfS0VZLnRlc3Qoc2Nhbm5lci5jaGFyKCkpKSB7XG4gICAgYWNjLnB1c2goc2Nhbm5lci5jaGFyKCkpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIGNvbnN0IGtleSA9IGFjYy5qb2luKFwiXCIpO1xuICByZXR1cm4gc3VjY2VzcyhrZXkpO1xufVxuXG5mdW5jdGlvbiBFc2NhcGVTZXF1ZW5jZShzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8c3RyaW5nPiB7XG4gIGlmIChzY2FubmVyLmNoYXIoKSA9PT0gXCJcXFxcXCIpIHtcbiAgICBzY2FubmVyLm5leHQoKTtcbiAgICAvLyBTZWUgaHR0cHM6Ly90b21sLmlvL2VuL3YxLjAuMC1yYy4zI3N0cmluZ1xuICAgIHN3aXRjaCAoc2Nhbm5lci5jaGFyKCkpIHtcbiAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcyhcIlxcYlwiKTtcbiAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcyhcIlxcdFwiKTtcbiAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcyhcIlxcblwiKTtcbiAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcyhcIlxcZlwiKTtcbiAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcyhcIlxcclwiKTtcbiAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICBjYXNlIFwiVVwiOiB7XG4gICAgICAgIC8vIFVuaWNvZGUgY2hhcmFjdGVyXG4gICAgICAgIGNvbnN0IGNvZGVQb2ludExlbiA9IHNjYW5uZXIuY2hhcigpID09PSBcInVcIiA/IDQgOiA2O1xuICAgICAgICBjb25zdCBjb2RlUG9pbnQgPSBwYXJzZUludChcbiAgICAgICAgICBcIjB4XCIgKyBzY2FubmVyLnNsaWNlKDEsIDEgKyBjb2RlUG9pbnRMZW4pLFxuICAgICAgICAgIDE2LFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBzdHIgPSBTdHJpbmcuZnJvbUNvZGVQb2ludChjb2RlUG9pbnQpO1xuICAgICAgICBzY2FubmVyLm5leHQoY29kZVBvaW50TGVuICsgMSk7XG4gICAgICAgIHJldHVybiBzdWNjZXNzKHN0cik7XG4gICAgICB9XG4gICAgICBjYXNlICdcIic6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcygnXCInKTtcbiAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgICByZXR1cm4gc3VjY2VzcyhcIlxcXFxcIik7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBzY2FubmVyLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN1Y2Nlc3Moc2Nhbm5lci5jaGFyKCkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBCYXNpY1N0cmluZyhzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8c3RyaW5nPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcbiAgaWYgKHNjYW5uZXIuY2hhcigpID09PSAnXCInKSB7XG4gICAgc2Nhbm5lci5uZXh0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuICBjb25zdCBhY2MgPSBbXTtcbiAgd2hpbGUgKHNjYW5uZXIuY2hhcigpICE9PSAnXCInICYmICFzY2FubmVyLmVvZigpKSB7XG4gICAgaWYgKHNjYW5uZXIuY2hhcigpID09PSBcIlxcblwiKSB7XG4gICAgICB0aHJvdyBuZXcgVE9NTFBhcnNlRXJyb3IoXCJTaW5nbGUtbGluZSBzdHJpbmcgY2Fubm90IGNvbnRhaW4gRU9MXCIpO1xuICAgIH1cbiAgICBjb25zdCBlc2NhcGVkQ2hhciA9IEVzY2FwZVNlcXVlbmNlKHNjYW5uZXIpO1xuICAgIGlmIChlc2NhcGVkQ2hhci5vaykge1xuICAgICAgYWNjLnB1c2goZXNjYXBlZENoYXIuYm9keSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjYy5wdXNoKHNjYW5uZXIuY2hhcigpKTtcbiAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgIH1cbiAgfVxuICBpZiAoc2Nhbm5lci5lb2YoKSkge1xuICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihcbiAgICAgIGBTaW5nbGUtbGluZSBzdHJpbmcgaXMgbm90IGNsb3NlZDpcXG4ke2FjYy5qb2luKFwiXCIpfWAsXG4gICAgKTtcbiAgfVxuICBzY2FubmVyLm5leHQoKTsgLy8gc2tpcCBsYXN0ICdcIlwiXG4gIHJldHVybiBzdWNjZXNzKGFjYy5qb2luKFwiXCIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIExpdGVyYWxTdHJpbmcoc2Nhbm5lcjogU2Nhbm5lcik6IFBhcnNlUmVzdWx0PHN0cmluZz4ge1xuICBzY2FubmVyLm5leHRVbnRpbENoYXIoeyBpbmxpbmU6IHRydWUgfSk7XG4gIGlmIChzY2FubmVyLmNoYXIoKSA9PT0gXCInXCIpIHtcbiAgICBzY2FubmVyLm5leHQoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG4gIGNvbnN0IGFjYzogc3RyaW5nW10gPSBbXTtcbiAgd2hpbGUgKHNjYW5uZXIuY2hhcigpICE9PSBcIidcIiAmJiAhc2Nhbm5lci5lb2YoKSkge1xuICAgIGlmIChzY2FubmVyLmNoYXIoKSA9PT0gXCJcXG5cIikge1xuICAgICAgdGhyb3cgbmV3IFRPTUxQYXJzZUVycm9yKFwiU2luZ2xlLWxpbmUgc3RyaW5nIGNhbm5vdCBjb250YWluIEVPTFwiKTtcbiAgICB9XG4gICAgYWNjLnB1c2goc2Nhbm5lci5jaGFyKCkpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIGlmIChzY2FubmVyLmVvZigpKSB7XG4gICAgdGhyb3cgbmV3IFRPTUxQYXJzZUVycm9yKFxuICAgICAgYFNpbmdsZS1saW5lIHN0cmluZyBpcyBub3QgY2xvc2VkOlxcbiR7YWNjLmpvaW4oXCJcIil9YCxcbiAgICApO1xuICB9XG4gIHNjYW5uZXIubmV4dCgpOyAvLyBza2lwIGxhc3QgXCInXCJcbiAgcmV0dXJuIHN1Y2Nlc3MoYWNjLmpvaW4oXCJcIikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gTXVsdGlsaW5lQmFzaWNTdHJpbmcoXG4gIHNjYW5uZXI6IFNjYW5uZXIsXG4pOiBQYXJzZVJlc3VsdDxzdHJpbmc+IHtcbiAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKHsgaW5saW5lOiB0cnVlIH0pO1xuICBpZiAoc2Nhbm5lci5zbGljZSgwLCAzKSA9PT0gJ1wiXCJcIicpIHtcbiAgICBzY2FubmVyLm5leHQoMyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuICBpZiAoc2Nhbm5lci5jaGFyKCkgPT09IFwiXFxuXCIpIHtcbiAgICAvLyBUaGUgZmlyc3QgbmV3bGluZSBpcyB0cmltbWVkXG4gICAgc2Nhbm5lci5uZXh0KCk7XG4gIH1cbiAgY29uc3QgYWNjOiBzdHJpbmdbXSA9IFtdO1xuICB3aGlsZSAoc2Nhbm5lci5zbGljZSgwLCAzKSAhPT0gJ1wiXCJcIicgJiYgIXNjYW5uZXIuZW9mKCkpIHtcbiAgICAvLyBsaW5lIGVuZGluZyBiYWNrc2xhc2hcbiAgICBpZiAoc2Nhbm5lci5zbGljZSgwLCAyKSA9PT0gXCJcXFxcXFxuXCIpIHtcbiAgICAgIHNjYW5uZXIubmV4dCgpO1xuICAgICAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKHsgY29tbWVudDogZmFsc2UgfSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZXNjYXBlZENoYXIgPSBFc2NhcGVTZXF1ZW5jZShzY2FubmVyKTtcbiAgICBpZiAoZXNjYXBlZENoYXIub2spIHtcbiAgICAgIGFjYy5wdXNoKGVzY2FwZWRDaGFyLmJvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY2MucHVzaChzY2FubmVyLmNoYXIoKSk7XG4gICAgICBzY2FubmVyLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc2Nhbm5lci5lb2YoKSkge1xuICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihcbiAgICAgIGBNdWx0aS1saW5lIHN0cmluZyBpcyBub3QgY2xvc2VkOlxcbiR7YWNjLmpvaW4oXCJcIil9YCxcbiAgICApO1xuICB9XG4gIC8vIGlmIGVuZHMgd2l0aCA0IGBcImAsIHB1c2ggdGhlIGZpc3QgYFwiYCB0byBzdHJpbmdcbiAgaWYgKHNjYW5uZXIuY2hhcigzKSA9PT0gJ1wiJykge1xuICAgIGFjYy5wdXNoKCdcIicpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIHNjYW5uZXIubmV4dCgzKTsgLy8gc2tpcCBsYXN0ICdcIlwiXCJcIlxuICByZXR1cm4gc3VjY2VzcyhhY2Muam9pbihcIlwiKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBNdWx0aWxpbmVMaXRlcmFsU3RyaW5nKFxuICBzY2FubmVyOiBTY2FubmVyLFxuKTogUGFyc2VSZXN1bHQ8c3RyaW5nPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcbiAgaWYgKHNjYW5uZXIuc2xpY2UoMCwgMykgPT09IFwiJycnXCIpIHtcbiAgICBzY2FubmVyLm5leHQoMyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuICBpZiAoc2Nhbm5lci5jaGFyKCkgPT09IFwiXFxuXCIpIHtcbiAgICAvLyBUaGUgZmlyc3QgbmV3bGluZSBpcyB0cmltbWVkXG4gICAgc2Nhbm5lci5uZXh0KCk7XG4gIH1cbiAgY29uc3QgYWNjOiBzdHJpbmdbXSA9IFtdO1xuICB3aGlsZSAoc2Nhbm5lci5zbGljZSgwLCAzKSAhPT0gXCInJydcIiAmJiAhc2Nhbm5lci5lb2YoKSkge1xuICAgIGFjYy5wdXNoKHNjYW5uZXIuY2hhcigpKTtcbiAgICBzY2FubmVyLm5leHQoKTtcbiAgfVxuICBpZiAoc2Nhbm5lci5lb2YoKSkge1xuICAgIHRocm93IG5ldyBUT01MUGFyc2VFcnJvcihcbiAgICAgIGBNdWx0aS1saW5lIHN0cmluZyBpcyBub3QgY2xvc2VkOlxcbiR7YWNjLmpvaW4oXCJcIil9YCxcbiAgICApO1xuICB9XG4gIC8vIGlmIGVuZHMgd2l0aCA0IGAnYCwgcHVzaCB0aGUgZmlzdCBgJ2AgdG8gc3RyaW5nXG4gIGlmIChzY2FubmVyLmNoYXIoMykgPT09IFwiJ1wiKSB7XG4gICAgYWNjLnB1c2goXCInXCIpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIHNjYW5uZXIubmV4dCgzKTsgLy8gc2tpcCBsYXN0IFwiJycnXCJcbiAgcmV0dXJuIHN1Y2Nlc3MoYWNjLmpvaW4oXCJcIikpO1xufVxuXG5jb25zdCBzeW1ib2xQYWlyczogW3N0cmluZywgdW5rbm93bl1bXSA9IFtcbiAgW1widHJ1ZVwiLCB0cnVlXSxcbiAgW1wiZmFsc2VcIiwgZmFsc2VdLFxuICBbXCJpbmZcIiwgSW5maW5pdHldLFxuICBbXCIraW5mXCIsIEluZmluaXR5XSxcbiAgW1wiLWluZlwiLCAtSW5maW5pdHldLFxuICBbXCJuYW5cIiwgTmFOXSxcbiAgW1wiK25hblwiLCBOYU5dLFxuICBbXCItbmFuXCIsIE5hTl0sXG5dO1xuZXhwb3J0IGZ1bmN0aW9uIFN5bWJvbHMoc2Nhbm5lcjogU2Nhbm5lcik6IFBhcnNlUmVzdWx0PHVua25vd24+IHtcbiAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKHsgaW5saW5lOiB0cnVlIH0pO1xuICBjb25zdCBmb3VuZCA9IHN5bWJvbFBhaXJzLmZpbmQoKFtzdHJdKSA9PlxuICAgIHNjYW5uZXIuc2xpY2UoMCwgc3RyLmxlbmd0aCkgPT09IHN0clxuICApO1xuICBpZiAoIWZvdW5kKSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuICBjb25zdCBbc3RyLCB2YWx1ZV0gPSBmb3VuZDtcbiAgc2Nhbm5lci5uZXh0KHN0ci5sZW5ndGgpO1xuICByZXR1cm4gc3VjY2Vzcyh2YWx1ZSk7XG59XG5cbmV4cG9ydCBjb25zdCBEb3R0ZWRLZXkgPSBqb2luKFxuICBvcihbQmFyZUtleSwgQmFzaWNTdHJpbmcsIExpdGVyYWxTdHJpbmddKSxcbiAgXCIuXCIsXG4pO1xuXG5leHBvcnQgZnVuY3Rpb24gSW50ZWdlcihzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8bnVtYmVyIHwgc3RyaW5nPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcblxuICAvLyBJZiBiaW5hcnkgLyBvY3RhbCAvIGhleFxuICBjb25zdCBmaXJzdDIgPSBzY2FubmVyLnNsaWNlKDAsIDIpO1xuICBpZiAoZmlyc3QyLmxlbmd0aCA9PT0gMiAmJiAvMCg/Onh8b3xiKS9pLnRlc3QoZmlyc3QyKSkge1xuICAgIHNjYW5uZXIubmV4dCgyKTtcbiAgICBjb25zdCBhY2MgPSBbZmlyc3QyXTtcbiAgICB3aGlsZSAoL1swLTlhLWZfXS9pLnRlc3Qoc2Nhbm5lci5jaGFyKCkpICYmICFzY2FubmVyLmVvZigpKSB7XG4gICAgICBhY2MucHVzaChzY2FubmVyLmNoYXIoKSk7XG4gICAgICBzY2FubmVyLm5leHQoKTtcbiAgICB9XG4gICAgaWYgKGFjYy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKCk7XG4gICAgfVxuICAgIHJldHVybiBzdWNjZXNzKGFjYy5qb2luKFwiXCIpKTtcbiAgfVxuXG4gIGNvbnN0IGFjYyA9IFtdO1xuICBpZiAoL1srLV0vLnRlc3Qoc2Nhbm5lci5jaGFyKCkpKSB7XG4gICAgYWNjLnB1c2goc2Nhbm5lci5jaGFyKCkpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIHdoaWxlICgvWzAtOV9dLy50ZXN0KHNjYW5uZXIuY2hhcigpKSAmJiAhc2Nhbm5lci5lb2YoKSkge1xuICAgIGFjYy5wdXNoKHNjYW5uZXIuY2hhcigpKTtcbiAgICBzY2FubmVyLm5leHQoKTtcbiAgfVxuXG4gIGlmIChhY2MubGVuZ3RoID09PSAwIHx8IChhY2MubGVuZ3RoID09PSAxICYmIC9bKy1dLy50ZXN0KGFjY1swXSkpKSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuXG4gIGNvbnN0IGludCA9IHBhcnNlSW50KGFjYy5maWx0ZXIoKGNoYXIpID0+IGNoYXIgIT09IFwiX1wiKS5qb2luKFwiXCIpKTtcbiAgcmV0dXJuIHN1Y2Nlc3MoaW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZsb2F0KHNjYW5uZXI6IFNjYW5uZXIpOiBQYXJzZVJlc3VsdDxudW1iZXI+IHtcbiAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKHsgaW5saW5lOiB0cnVlIH0pO1xuXG4gIC8vIGxvb2thaGVhZCB2YWxpZGF0aW9uIGlzIG5lZWRlZCBmb3IgaW50ZWdlciB2YWx1ZSBpcyBzaW1pbGFyIHRvIGZsb2F0XG4gIGxldCBwb3NpdGlvbiA9IDA7XG4gIHdoaWxlIChcbiAgICBzY2FubmVyLmNoYXIocG9zaXRpb24pICYmXG4gICAgIVBhdHRlcm5zLkVORF9PRl9WQUxVRS50ZXN0KHNjYW5uZXIuY2hhcihwb3NpdGlvbikpXG4gICkge1xuICAgIGlmICghUGF0dGVybnMuRkxPQVQudGVzdChzY2FubmVyLmNoYXIocG9zaXRpb24pKSkge1xuICAgICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgICB9XG4gICAgcG9zaXRpb24rKztcbiAgfVxuXG4gIGNvbnN0IGFjYyA9IFtdO1xuICBpZiAoL1srLV0vLnRlc3Qoc2Nhbm5lci5jaGFyKCkpKSB7XG4gICAgYWNjLnB1c2goc2Nhbm5lci5jaGFyKCkpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIHdoaWxlIChQYXR0ZXJucy5GTE9BVC50ZXN0KHNjYW5uZXIuY2hhcigpKSAmJiAhc2Nhbm5lci5lb2YoKSkge1xuICAgIGFjYy5wdXNoKHNjYW5uZXIuY2hhcigpKTtcbiAgICBzY2FubmVyLm5leHQoKTtcbiAgfVxuXG4gIGlmIChhY2MubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuICBjb25zdCBmbG9hdCA9IHBhcnNlRmxvYXQoYWNjLmZpbHRlcigoY2hhcikgPT4gY2hhciAhPT0gXCJfXCIpLmpvaW4oXCJcIikpO1xuICBpZiAoaXNOYU4oZmxvYXQpKSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuXG4gIHJldHVybiBzdWNjZXNzKGZsb2F0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIERhdGVUaW1lKHNjYW5uZXI6IFNjYW5uZXIpOiBQYXJzZVJlc3VsdDxEYXRlPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcblxuICBsZXQgZGF0ZVN0ciA9IHNjYW5uZXIuc2xpY2UoMCwgMTApO1xuICAvLyBleGFtcGxlOiAxOTc5LTA1LTI3XG4gIGlmICgvXlxcZHs0fS1cXGR7Mn0tXFxkezJ9Ly50ZXN0KGRhdGVTdHIpKSB7XG4gICAgc2Nhbm5lci5uZXh0KDEwKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG5cbiAgY29uc3QgYWNjID0gW107XG4gIC8vIGV4YW1wbGU6IDE5NzktMDUtMjdUMDA6MzI6MDBaXG4gIHdoaWxlICgvWyAwLTlUWi46LV0vLnRlc3Qoc2Nhbm5lci5jaGFyKCkpICYmICFzY2FubmVyLmVvZigpKSB7XG4gICAgYWNjLnB1c2goc2Nhbm5lci5jaGFyKCkpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIGRhdGVTdHIgKz0gYWNjLmpvaW4oXCJcIik7XG4gIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShkYXRlU3RyLnRyaW0oKSk7XG4gIC8vIGludmFsaWQgZGF0ZVxuICBpZiAoaXNOYU4oZGF0ZS5nZXRUaW1lKCkpKSB7XG4gICAgdGhyb3cgbmV3IFRPTUxQYXJzZUVycm9yKGBJbnZhbGlkIGRhdGUgc3RyaW5nIFwiJHtkYXRlU3RyfVwiYCk7XG4gIH1cblxuICByZXR1cm4gc3VjY2VzcyhkYXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIExvY2FsVGltZShzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8c3RyaW5nPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcblxuICBsZXQgdGltZVN0ciA9IHNjYW5uZXIuc2xpY2UoMCwgOCk7XG4gIGlmICgvXihcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pLy50ZXN0KHRpbWVTdHIpKSB7XG4gICAgc2Nhbm5lci5uZXh0KDgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWlsdXJlKCk7XG4gIH1cblxuICBjb25zdCBhY2MgPSBbXTtcbiAgaWYgKHNjYW5uZXIuY2hhcigpID09PSBcIi5cIikge1xuICAgIGFjYy5wdXNoKHNjYW5uZXIuY2hhcigpKTtcbiAgICBzY2FubmVyLm5leHQoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3VjY2Vzcyh0aW1lU3RyKTtcbiAgfVxuXG4gIHdoaWxlICgvWzAtOV0vLnRlc3Qoc2Nhbm5lci5jaGFyKCkpICYmICFzY2FubmVyLmVvZigpKSB7XG4gICAgYWNjLnB1c2goc2Nhbm5lci5jaGFyKCkpO1xuICAgIHNjYW5uZXIubmV4dCgpO1xuICB9XG4gIHRpbWVTdHIgKz0gYWNjLmpvaW4oXCJcIik7XG4gIHJldHVybiBzdWNjZXNzKHRpbWVTdHIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQXJyYXlWYWx1ZShzY2FubmVyOiBTY2FubmVyKTogUGFyc2VSZXN1bHQ8dW5rbm93bltdPiB7XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcih7IGlubGluZTogdHJ1ZSB9KTtcblxuICBpZiAoc2Nhbm5lci5jaGFyKCkgPT09IFwiW1wiKSB7XG4gICAgc2Nhbm5lci5uZXh0KCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhaWx1cmUoKTtcbiAgfVxuXG4gIGNvbnN0IGFycmF5OiB1bmtub3duW10gPSBbXTtcbiAgd2hpbGUgKCFzY2FubmVyLmVvZigpKSB7XG4gICAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKCk7XG4gICAgY29uc3QgcmVzdWx0ID0gVmFsdWUoc2Nhbm5lcik7XG4gICAgaWYgKHJlc3VsdC5vaykge1xuICAgICAgYXJyYXkucHVzaChyZXN1bHQuYm9keSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzY2FubmVyLm5leHRVbnRpbENoYXIoeyBpbmxpbmU6IHRydWUgfSk7XG4gICAgLy8gbWF5IGhhdmUgYSBuZXh0IGl0ZW0sIGJ1dCB0cmFpbGluZyBjb21tYSBpcyBhbGxvd2VkIGF0IGFycmF5XG4gICAgaWYgKHNjYW5uZXIuY2hhcigpID09PSBcIixcIikge1xuICAgICAgc2Nhbm5lci5uZXh0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBzY2FubmVyLm5leHRVbnRpbENoYXIoKTtcblxuICBpZiAoc2Nhbm5lci5jaGFyKCkgPT09IFwiXVwiKSB7XG4gICAgc2Nhbm5lci5uZXh0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFRPTUxQYXJzZUVycm9yKFwiQXJyYXkgaXMgbm90IGNsb3NlZFwiKTtcbiAgfVxuXG4gIHJldHVybiBzdWNjZXNzKGFycmF5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIElubGluZVRhYmxlKFxuICBzY2FubmVyOiBTY2FubmVyLFxuKTogUGFyc2VSZXN1bHQ8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcbiAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKCk7XG4gIGNvbnN0IHBhaXJzID0gc3Vycm91bmQoXG4gICAgXCJ7XCIsXG4gICAgam9pbihQYWlyLCBcIixcIiksXG4gICAgXCJ9XCIsXG4gICkoc2Nhbm5lcik7XG4gIGlmICghcGFpcnMub2spIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG4gIGNvbnN0IHRhYmxlID0ge307XG4gIGZvciAoY29uc3QgcGFpciBvZiBwYWlycy5ib2R5KSB7XG4gICAgZGVlcEFzc2lnbih0YWJsZSwgcGFpcik7XG4gIH1cbiAgcmV0dXJuIHN1Y2Nlc3ModGFibGUpO1xufVxuXG5leHBvcnQgY29uc3QgVmFsdWUgPSBvcihbXG4gIE11bHRpbGluZUJhc2ljU3RyaW5nLFxuICBNdWx0aWxpbmVMaXRlcmFsU3RyaW5nLFxuICBCYXNpY1N0cmluZyxcbiAgTGl0ZXJhbFN0cmluZyxcbiAgU3ltYm9scyxcbiAgRGF0ZVRpbWUsXG4gIExvY2FsVGltZSxcbiAgRmxvYXQsXG4gIEludGVnZXIsXG4gIEFycmF5VmFsdWUsXG4gIElubGluZVRhYmxlLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBQYWlyID0ga3YoRG90dGVkS2V5LCBcIj1cIiwgVmFsdWUpO1xuXG5leHBvcnQgZnVuY3Rpb24gQmxvY2soXG4gIHNjYW5uZXI6IFNjYW5uZXIsXG4pOiBQYXJzZVJlc3VsdDxCbG9ja1BhcnNlUmVzdWx0Qm9keT4ge1xuICBzY2FubmVyLm5leHRVbnRpbENoYXIoKTtcbiAgY29uc3QgcmVzdWx0ID0gbWVyZ2UocmVwZWF0KFBhaXIpKShzY2FubmVyKTtcbiAgaWYgKHJlc3VsdC5vaykge1xuICAgIHJldHVybiBzdWNjZXNzKHtcbiAgICAgIHR5cGU6IFwiQmxvY2tcIixcbiAgICAgIHZhbHVlOiByZXN1bHQuYm9keSxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBUYWJsZUhlYWRlciA9IHN1cnJvdW5kKFwiW1wiLCBEb3R0ZWRLZXksIFwiXVwiKTtcblxuZXhwb3J0IGZ1bmN0aW9uIFRhYmxlKFxuICBzY2FubmVyOiBTY2FubmVyLFxuKTogUGFyc2VSZXN1bHQ8QmxvY2tQYXJzZVJlc3VsdEJvZHk+IHtcbiAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKCk7XG4gIGNvbnN0IGhlYWRlciA9IFRhYmxlSGVhZGVyKHNjYW5uZXIpO1xuICBpZiAoIWhlYWRlci5vaykge1xuICAgIHJldHVybiBmYWlsdXJlKCk7XG4gIH1cbiAgc2Nhbm5lci5uZXh0VW50aWxDaGFyKCk7XG4gIGNvbnN0IGJsb2NrID0gQmxvY2soc2Nhbm5lcik7XG4gIHJldHVybiBzdWNjZXNzKHtcbiAgICB0eXBlOiBcIlRhYmxlXCIsXG4gICAga2V5OiBoZWFkZXIuYm9keSxcbiAgICB2YWx1ZTogYmxvY2sub2sgPyBibG9jay5ib2R5LnZhbHVlIDoge30sXG4gIH0pO1xufVxuXG5leHBvcnQgY29uc3QgVGFibGVBcnJheUhlYWRlciA9IHN1cnJvdW5kKFxuICBcIltbXCIsXG4gIERvdHRlZEtleSxcbiAgXCJdXVwiLFxuKTtcblxuZXhwb3J0IGZ1bmN0aW9uIFRhYmxlQXJyYXkoXG4gIHNjYW5uZXI6IFNjYW5uZXIsXG4pOiBQYXJzZVJlc3VsdDxCbG9ja1BhcnNlUmVzdWx0Qm9keT4ge1xuICBzY2FubmVyLm5leHRVbnRpbENoYXIoKTtcbiAgY29uc3QgaGVhZGVyID0gVGFibGVBcnJheUhlYWRlcihzY2FubmVyKTtcbiAgaWYgKCFoZWFkZXIub2spIHtcbiAgICByZXR1cm4gZmFpbHVyZSgpO1xuICB9XG4gIHNjYW5uZXIubmV4dFVudGlsQ2hhcigpO1xuICBjb25zdCBibG9jayA9IEJsb2NrKHNjYW5uZXIpO1xuICByZXR1cm4gc3VjY2Vzcyh7XG4gICAgdHlwZTogXCJUYWJsZUFycmF5XCIsXG4gICAga2V5OiBoZWFkZXIuYm9keSxcbiAgICB2YWx1ZTogYmxvY2sub2sgPyBibG9jay5ib2R5LnZhbHVlIDoge30sXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gVG9tbChcbiAgc2Nhbm5lcjogU2Nhbm5lcixcbik6IFBhcnNlUmVzdWx0PFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG4gIGNvbnN0IGJsb2NrcyA9IHJlcGVhdChvcihbQmxvY2ssIFRhYmxlQXJyYXksIFRhYmxlXSkpKHNjYW5uZXIpO1xuICBpZiAoIWJsb2Nrcy5vaykge1xuICAgIHJldHVybiBmYWlsdXJlKCk7XG4gIH1cbiAgY29uc3QgYm9keSA9IHt9O1xuICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcy5ib2R5KSB7XG4gICAgc3dpdGNoIChibG9jay50eXBlKSB7XG4gICAgICBjYXNlIFwiQmxvY2tcIjoge1xuICAgICAgICBkZWVwQXNzaWduKGJvZHksIGJsb2NrLnZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiVGFibGVcIjoge1xuICAgICAgICBVdGlscy5kZWVwQXNzaWduV2l0aFRhYmxlKGJvZHksIGJsb2NrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiVGFibGVBcnJheVwiOiB7XG4gICAgICAgIFV0aWxzLmRlZXBBc3NpZ25XaXRoVGFibGUoYm9keSwgYmxvY2spO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN1Y2Nlc3MoYm9keSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQYXJzZXJGYWN0b3J5PFQ+KHBhcnNlcjogUGFyc2VyQ29tcG9uZW50PFQ+KSB7XG4gIHJldHVybiBmdW5jdGlvbiBwYXJzZSh0b21sU3RyaW5nOiBzdHJpbmcpOiBUIHtcbiAgICBjb25zdCBzY2FubmVyID0gbmV3IFNjYW5uZXIodG9tbFN0cmluZyk7XG5cbiAgICBsZXQgcGFyc2VkOiBQYXJzZVJlc3VsdDxUPiB8IG51bGwgPSBudWxsO1xuICAgIGxldCBlcnI6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIHBhcnNlZCA9IHBhcnNlcihzY2FubmVyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlIDogbmV3IEVycm9yKFwiW25vbi1lcnJvciB0aHJvd25dXCIpO1xuICAgIH1cblxuICAgIGlmIChlcnIgfHwgIXBhcnNlZCB8fCAhcGFyc2VkLm9rIHx8ICFzY2FubmVyLmVvZigpKSB7XG4gICAgICBjb25zdCBwb3NpdGlvbiA9IHNjYW5uZXIucG9zaXRpb24oKTtcbiAgICAgIGNvbnN0IHN1YlN0ciA9IHRvbWxTdHJpbmcuc2xpY2UoMCwgcG9zaXRpb24pO1xuICAgICAgY29uc3QgbGluZXMgPSBzdWJTdHIuc3BsaXQoXCJcXG5cIik7XG4gICAgICBjb25zdCByb3cgPSBsaW5lcy5sZW5ndGg7XG4gICAgICBjb25zdCBjb2x1bW4gPSAoKCkgPT4ge1xuICAgICAgICBsZXQgY291bnQgPSBzdWJTdHIubGVuZ3RoO1xuICAgICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgICBpZiAoY291bnQgPiBsaW5lLmxlbmd0aCkge1xuICAgICAgICAgICAgY291bnQgLT0gbGluZS5sZW5ndGggKyAxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgIH0pKCk7XG4gICAgICBjb25zdCBtZXNzYWdlID0gYFBhcnNlIGVycm9yIG9uIGxpbmUgJHtyb3d9LCBjb2x1bW4gJHtjb2x1bW59OiAke1xuICAgICAgICBlcnIgPyBlcnIubWVzc2FnZSA6IGBVbmV4cGVjdGVkIGNoYXJhY3RlcjogXCIke3NjYW5uZXIuY2hhcigpfVwiYFxuICAgICAgfWA7XG4gICAgICB0aHJvdyBuZXcgVE9NTFBhcnNlRXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZWQuYm9keTtcbiAgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBwYXJzZXMgVE9NTCBzdHJpbmcgaW50byBhbiBvYmplY3QuXG4gKiBAcGFyYW0gdG9tbFN0cmluZ1xuICovXG5leHBvcnQgY29uc3QgcGFyc2UgPSBQYXJzZXJGYWN0b3J5KFRvbWwpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxVQUFVLFFBQVEsNEJBQTRCLENBQUM7QUE4QnhELE9BQU8sTUFBTSxjQUFjLFNBQVMsS0FBSztDQUFHO0FBRTVDLE9BQU8sTUFBTSxPQUFPO0lBQ2xCLENBQUMsVUFBVSxDQUFXO0lBQ3RCLENBQUMsUUFBUSxDQUFLO0lBQ2QsWUFBb0IsTUFBYyxDQUFFO1FBQWhCLGNBQUEsTUFBYyxDQUFBO2FBRmxDLENBQUMsVUFBVTthQUNYLENBQUMsUUFBUSxHQUFHLENBQUM7SUFDd0I7SUFFckM7OztHQUdDLEdBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7UUFDZCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNuRDtJQUVBOzs7O0dBSUMsR0FDRCxLQUFLLENBQUMsS0FBYSxFQUFFLEdBQVcsRUFBVTtRQUN4QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQ3pFO0lBRUE7O0dBRUMsR0FDRCxJQUFJLENBQUMsS0FBYyxFQUFFO1FBQ25CLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdC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