// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Command line arguments parser based on
 * [minimist](https://github.com/substack/minimist).
 *
 * This module is browser compatible.
 *
 * @module
 */ import { assert } from "../_util/assert.ts";
const { hasOwn  } = Object;
function get(obj, key) {
    if (hasOwn(obj, key)) {
        return obj[key];
    }
}
function getForce(obj, key) {
    const v = get(obj, key);
    assert(v != null);
    return v;
}
function isNumber(x) {
    if (typeof x === "number") return true;
    if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function hasKey(obj, keys) {
    let o = obj;
    keys.slice(0, -1).forEach((key)=>{
        o = get(o, key) ?? {};
    });
    const key = keys[keys.length - 1];
    return hasOwn(o, key);
}
/** Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default, any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * ```ts
 * import { parse } from "./mod.ts";
 * const parsedArgs = parse(Deno.args);
 * ```
 *
 * ```ts
 * import { parse } from "./mod.ts";
 * const parsedArgs = parse(["--foo", "--bar=baz", "--no-qux", "./quux.txt"]);
 * // parsedArgs: { foo: true, bar: "baz", qux: false, _: ["./quux.txt"] }
 * ```
 */ export function parse(args, { "--": doubleDash = false , alias ={} , boolean =false , default: defaults = {} , stopEarly =false , string =[] , collect =[] , negatable =[] , unknown =(i)=>i  } = {}) {
    const flags = {
        bools: {},
        strings: {},
        unknownFn: unknown,
        allBools: false,
        collect: {},
        negatable: {}
    };
    if (boolean !== undefined) {
        if (typeof boolean === "boolean") {
            flags.allBools = !!boolean;
        } else {
            const booleanArgs = typeof boolean === "string" ? [
                boolean
            ] : boolean;
            for (const key of booleanArgs.filter(Boolean)){
                flags.bools[key] = true;
            }
        }
    }
    const aliases = {};
    if (alias !== undefined) {
        for(const key1 in alias){
            const val = getForce(alias, key1);
            if (typeof val === "string") {
                aliases[key1] = [
                    val
                ];
            } else {
                aliases[key1] = val;
            }
            for (const alias1 of getForce(aliases, key1)){
                aliases[alias1] = [
                    key1
                ].concat(aliases[key1].filter((y)=>alias1 !== y));
            }
        }
    }
    if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [
            string
        ] : string;
        for (const key2 of stringArgs.filter(Boolean)){
            flags.strings[key2] = true;
            const alias2 = get(aliases, key2);
            if (alias2) {
                for (const al of alias2){
                    flags.strings[al] = true;
                }
            }
        }
    }
    if (collect !== undefined) {
        const collectArgs = typeof collect === "string" ? [
            collect
        ] : collect;
        for (const key3 of collectArgs.filter(Boolean)){
            flags.collect[key3] = true;
            const alias3 = get(aliases, key3);
            if (alias3) {
                for (const al1 of alias3){
                    flags.collect[al1] = true;
                }
            }
        }
    }
    if (negatable !== undefined) {
        const negatableArgs = typeof negatable === "string" ? [
            negatable
        ] : negatable;
        for (const key4 of negatableArgs.filter(Boolean)){
            flags.negatable[key4] = true;
            const alias4 = get(aliases, key4);
            if (alias4) {
                for (const al2 of alias4){
                    flags.negatable[al2] = true;
                }
            }
        }
    }
    const argv = {
        _: []
    };
    function argDefined(key, arg) {
        return flags.allBools && /^--[^=]+$/.test(arg) || get(flags.bools, key) || !!get(flags.strings, key) || !!get(aliases, key);
    }
    function setKey(obj, name, value, collect = true) {
        let o = obj;
        const keys = name.split(".");
        keys.slice(0, -1).forEach(function(key) {
            if (get(o, key) === undefined) {
                o[key] = {};
            }
            o = get(o, key);
        });
        const key = keys[keys.length - 1];
        const collectable = collect && !!get(flags.collect, name);
        if (!collectable) {
            o[key] = value;
        } else if (get(o, key) === undefined) {
            o[key] = [
                value
            ];
        } else if (Array.isArray(get(o, key))) {
            o[key].push(value);
        } else {
            o[key] = [
                get(o, key),
                value
            ];
        }
    }
    function setArg(key, val, arg = undefined, collect) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg, key, val) === false) return;
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
        setKey(argv, key, value, collect);
        const alias = get(aliases, key);
        if (alias) {
            for (const x of alias){
                setKey(argv, x, value, collect);
            }
        }
    }
    function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x)=>typeof get(flags.bools, x) === "boolean");
    }
    let notFlags = [];
    // all args after "--" are not parsed
    if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
    }
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
            const m = arg.match(/^--([^=]+)=(.*)$/s);
            assert(m != null);
            const [, key5, value] = m;
            if (flags.bools[key5]) {
                const booleanValue = value !== "false";
                setArg(key5, booleanValue, arg);
            } else {
                setArg(key5, value, arg);
            }
        } else if (/^--no-.+/.test(arg) && get(flags.negatable, arg.replace(/^--no-/, ""))) {
            const m1 = arg.match(/^--no-(.+)/);
            assert(m1 != null);
            setArg(m1[1], false, arg, false);
        } else if (/^--.+/.test(arg)) {
            const m2 = arg.match(/^--(.+)/);
            assert(m2 != null);
            const [, key6] = m2;
            const next = args[i + 1];
            if (next !== undefined && !/^-/.test(next) && !get(flags.bools, key6) && !flags.allBools && (get(aliases, key6) ? !aliasIsBoolean(key6) : true)) {
                setArg(key6, next, arg);
                i++;
            } else if (/^(true|false)$/.test(next)) {
                setArg(key6, next === "true", arg);
                i++;
            } else {
                setArg(key6, get(flags.strings, key6) ? "" : true, arg);
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for(let j = 0; j < letters.length; j++){
                const next1 = arg.slice(j + 2);
                if (next1 === "-") {
                    setArg(letters[j], next1, arg);
                    continue;
                }
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next1)) {
                    setArg(letters[j], next1.split(/=(.+)/)[1], arg);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next1)) {
                    setArg(letters[j], next1, arg);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg);
                    broken = true;
                    break;
                } else {
                    setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
                }
            }
            const [key7] = arg.slice(-1);
            if (!broken && key7 !== "-") {
                if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !get(flags.bools, key7) && (get(aliases, key7) ? !aliasIsBoolean(key7) : true)) {
                    setArg(key7, args[i + 1], arg);
                    i++;
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key7, args[i + 1] === "true", arg);
                    i++;
                } else {
                    setArg(key7, get(flags.strings, key7) ? "" : true, arg);
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
            }
            if (stopEarly) {
                argv._.push(...args.slice(i + 1));
                break;
            }
        }
    }
    for (const [key8, value1] of Object.entries(defaults)){
        if (!hasKey(argv, key8.split("."))) {
            setKey(argv, key8, value1);
            if (aliases[key8]) {
                for (const x of aliases[key8]){
                    setKey(argv, x, value1);
                }
            }
        }
    }
    for (const key9 of Object.keys(flags.bools)){
        if (!hasKey(argv, key9.split("."))) {
            const value2 = get(flags.collect, key9) ? [] : false;
            setKey(argv, key9, value2, false);
        }
    }
    for (const key10 of Object.keys(flags.strings)){
        if (!hasKey(argv, key10.split(".")) && get(flags.collect, key10)) {
            setKey(argv, key10, [], false);
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key11 of notFlags){
            argv["--"].push(key11);
        }
    } else {
        for (const key12 of notFlags){
            argv._.push(key12);
        }
    }
    return argv;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2ZsYWdzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLyoqXG4gKiBDb21tYW5kIGxpbmUgYXJndW1lbnRzIHBhcnNlciBiYXNlZCBvblxuICogW21pbmltaXN0XShodHRwczovL2dpdGh1Yi5jb20vc3Vic3RhY2svbWluaW1pc3QpLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAbW9kdWxlXG4gKi9cbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcblxuLyoqIENvbWJpbmVzIHJlY3Vyc2l2ZWx5IGFsbCBpbnRlcnNlY3Rpb24gdHlwZXMgYW5kIHJldHVybnMgYSBuZXcgc2luZ2xlIHR5cGUuICovXG50eXBlIElkPFQ+ID0gVCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gID8gVCBleHRlbmRzIGluZmVyIFUgPyB7IFtLIGluIGtleW9mIFVdOiBJZDxVW0tdPiB9IDogbmV2ZXJcbiAgOiBUO1xuXG4vKiogQ29udmVydHMgYW4gdW5pb24gdHlwZSBgQSB8IEIgfCBDYCBpbnRvIGFuIGludGVyc2VjdGlvbiB0eXBlIGBBICYgQiAmIENgLiAqL1xudHlwZSBVbmlvblRvSW50ZXJzZWN0aW9uPFQ+ID1cbiAgKFQgZXh0ZW5kcyB1bmtub3duID8gKGFyZ3M6IFQpID0+IHVua25vd24gOiBuZXZlcikgZXh0ZW5kc1xuICAgIChhcmdzOiBpbmZlciBSKSA9PiB1bmtub3duID8gUiBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID8gUiA6IG5ldmVyXG4gICAgOiBuZXZlcjtcblxudHlwZSBCb29sZWFuVHlwZSA9IGJvb2xlYW4gfCBzdHJpbmcgfCB1bmRlZmluZWQ7XG50eXBlIFN0cmluZ1R5cGUgPSBzdHJpbmcgfCB1bmRlZmluZWQ7XG50eXBlIEFyZ1R5cGUgPSBTdHJpbmdUeXBlIHwgQm9vbGVhblR5cGU7XG5cbnR5cGUgQ29sbGVjdGFibGUgPSBzdHJpbmcgfCB1bmRlZmluZWQ7XG50eXBlIE5lZ2F0YWJsZSA9IHN0cmluZyB8IHVuZGVmaW5lZDtcblxudHlwZSBVc2VUeXBlczxcbiAgQiBleHRlbmRzIEJvb2xlYW5UeXBlLFxuICBTIGV4dGVuZHMgU3RyaW5nVHlwZSxcbiAgQyBleHRlbmRzIENvbGxlY3RhYmxlLFxuPiA9IHVuZGVmaW5lZCBleHRlbmRzIChcbiAgJiAoZmFsc2UgZXh0ZW5kcyBCID8gdW5kZWZpbmVkIDogQilcbiAgJiBDXG4gICYgU1xuKSA/IGZhbHNlXG4gIDogdHJ1ZTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgcmVjb3JkIHdpdGggYWxsIGF2YWlsYWJsZSBmbGFncyB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIHR5cGUgYW5kXG4gKiBkZWZhdWx0IHR5cGUuXG4gKi9cbnR5cGUgVmFsdWVzPFxuICBCIGV4dGVuZHMgQm9vbGVhblR5cGUsXG4gIFMgZXh0ZW5kcyBTdHJpbmdUeXBlLFxuICBDIGV4dGVuZHMgQ29sbGVjdGFibGUsXG4gIE4gZXh0ZW5kcyBOZWdhdGFibGUsXG4gIEQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCxcbiAgQSBleHRlbmRzIEFsaWFzZXMgfCB1bmRlZmluZWQsXG4+ID0gVXNlVHlwZXM8QiwgUywgQz4gZXh0ZW5kcyB0cnVlID8gXG4gICAgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICYgQWRkQWxpYXNlczxcbiAgICAgIFNwcmVhZERlZmF1bHRzPFxuICAgICAgICAmIENvbGxlY3RWYWx1ZXM8Uywgc3RyaW5nLCBDLCBOPlxuICAgICAgICAmIFJlY3Vyc2l2ZVJlcXVpcmVkPENvbGxlY3RWYWx1ZXM8QiwgYm9vbGVhbiwgQz4+XG4gICAgICAgICYgQ29sbGVjdFVua25vd25WYWx1ZXM8QiwgUywgQywgTj4sXG4gICAgICAgIERlZG90UmVjb3JkPEQ+XG4gICAgICA+LFxuICAgICAgQVxuICAgID5cbiAgOiAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG50eXBlIEFsaWFzZXM8VCA9IHN0cmluZywgViBleHRlbmRzIHN0cmluZyA9IHN0cmluZz4gPSBQYXJ0aWFsPFxuICBSZWNvcmQ8RXh0cmFjdDxULCBzdHJpbmc+LCBWIHwgUmVhZG9ubHlBcnJheTxWPj5cbj47XG5cbnR5cGUgQWRkQWxpYXNlczxcbiAgVCxcbiAgQSBleHRlbmRzIEFsaWFzZXMgfCB1bmRlZmluZWQsXG4+ID0geyBbSyBpbiBrZXlvZiBUIGFzIEFsaWFzTmFtZTxLLCBBPl06IFRbS10gfTtcblxudHlwZSBBbGlhc05hbWU8XG4gIEssXG4gIEEgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkLFxuPiA9IEsgZXh0ZW5kcyBrZXlvZiBBXG4gID8gc3RyaW5nIGV4dGVuZHMgQVtLXSA/IEsgOiBBW0tdIGV4dGVuZHMgc3RyaW5nID8gSyB8IEFbS10gOiBLXG4gIDogSztcblxuLyoqXG4gKiBTcHJlYWRzIGFsbCBkZWZhdWx0IHZhbHVlcyBvZiBSZWNvcmQgYERgIGludG8gUmVjb3JkIGBBYFxuICogYW5kIG1ha2VzIGRlZmF1bHQgdmFsdWVzIHJlcXVpcmVkLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYFNwcmVhZFZhbHVlczx7IGZvbz86IGJvb2xlYW4sIGJhcj86IG51bWJlciB9LCB7IGZvbzogbnVtYmVyIH0+YFxuICpcbiAqICoqUmVzdWx0OioqIGB7IGZvbzogYm9vbGFuIHwgbnVtYmVyLCBiYXI/OiBudW1iZXIgfWBcbiAqL1xudHlwZSBTcHJlYWREZWZhdWx0czxBLCBEPiA9IEQgZXh0ZW5kcyB1bmRlZmluZWQgPyBBXG4gIDogQSBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID8gXG4gICAgICAmIE9taXQ8QSwga2V5b2YgRD5cbiAgICAgICYge1xuICAgICAgICBbSyBpbiBrZXlvZiBEXTogSyBleHRlbmRzIGtleW9mIEFcbiAgICAgICAgICA/IChBW0tdICYgRFtLXSB8IERbS10pIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAgICAgICAgID8gTm9uTnVsbGFibGU8U3ByZWFkRGVmYXVsdHM8QVtLXSwgRFtLXT4+XG4gICAgICAgICAgOiBEW0tdIHwgTm9uTnVsbGFibGU8QVtLXT5cbiAgICAgICAgICA6IHVua25vd247XG4gICAgICB9XG4gIDogbmV2ZXI7XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgUmVjb3JkIGZvciB0aGUgYGRlZmF1bHRgIG9wdGlvbiB0byBhZGRcbiAqIGF1dG8gc3VnZ2VzdGlvbiBzdXBwb3J0IGZvciBJREUncy5cbiAqL1xudHlwZSBEZWZhdWx0czxCIGV4dGVuZHMgQm9vbGVhblR5cGUsIFMgZXh0ZW5kcyBTdHJpbmdUeXBlPiA9IElkPFxuICBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICAgICYgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAvLyBEZWRvdHRlZCBhdXRvIHN1Z2dlc3Rpb25zOiB7IGZvbzogeyBiYXI6IHVua25vd24gfSB9XG4gICAgJiBNYXBUeXBlczxTLCB1bmtub3duPlxuICAgICYgTWFwVHlwZXM8QiwgdW5rbm93bj5cbiAgICAvLyBGbGF0IGF1dG8gc3VnZ2VzdGlvbnM6IHsgXCJmb28uYmFyXCI6IHVua25vd24gfVxuICAgICYgTWFwRGVmYXVsdHM8Qj5cbiAgICAmIE1hcERlZmF1bHRzPFM+XG4gID5cbj47XG5cbnR5cGUgTWFwRGVmYXVsdHM8VCBleHRlbmRzIEFyZ1R5cGU+ID0gUGFydGlhbDxcbiAgUmVjb3JkPFQgZXh0ZW5kcyBzdHJpbmcgPyBUIDogc3RyaW5nLCB1bmtub3duPlxuPjtcblxudHlwZSBSZWN1cnNpdmVSZXF1aXJlZDxUPiA9IFQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IHtcbiAgICBbSyBpbiBrZXlvZiBUXS0/OiBSZWN1cnNpdmVSZXF1aXJlZDxUW0tdPjtcbiAgfVxuICA6IFQ7XG5cbi8qKiBTYW1lIGFzIGBNYXBUeXBlc2AgYnV0IGFsc28gc3VwcG9ydHMgY29sbGVjdGFibGUgb3B0aW9ucy4gKi9cbnR5cGUgQ29sbGVjdFZhbHVlczxcbiAgVCBleHRlbmRzIEFyZ1R5cGUsXG4gIFYsXG4gIEMgZXh0ZW5kcyBDb2xsZWN0YWJsZSxcbiAgTiBleHRlbmRzIE5lZ2F0YWJsZSA9IHVuZGVmaW5lZCxcbj4gPSBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICBDIGV4dGVuZHMgc3RyaW5nID8gXG4gICAgICAmIE1hcFR5cGVzPEV4Y2x1ZGU8VCwgQz4sIFYsIE4+XG4gICAgICAmIChUIGV4dGVuZHMgdW5kZWZpbmVkID8gUmVjb3JkPG5ldmVyLCBuZXZlcj4gOiBSZWN1cnNpdmVSZXF1aXJlZDxcbiAgICAgICAgTWFwVHlwZXM8RXh0cmFjdDxDLCBUPiwgQXJyYXk8Vj4sIE4+XG4gICAgICA+KVxuICAgIDogTWFwVHlwZXM8VCwgViwgTj5cbj47XG5cbi8qKiBTYW1lIGFzIGBSZWNvcmRgIGJ1dCBhbHNvIHN1cHBvcnRzIGRvdHRlZCBhbmQgbmVnYXRhYmxlIG9wdGlvbnMuICovXG50eXBlIE1hcFR5cGVzPFQgZXh0ZW5kcyBBcmdUeXBlLCBWLCBOIGV4dGVuZHMgTmVnYXRhYmxlID0gdW5kZWZpbmVkPiA9XG4gIHVuZGVmaW5lZCBleHRlbmRzIFQgPyBSZWNvcmQ8bmV2ZXIsIG5ldmVyPlxuICAgIDogVCBleHRlbmRzIGAke2luZmVyIE5hbWV9LiR7aW5mZXIgUmVzdH1gID8ge1xuICAgICAgICBbSyBpbiBOYW1lXT86IE1hcFR5cGVzPFxuICAgICAgICAgIFJlc3QsXG4gICAgICAgICAgVixcbiAgICAgICAgICBOIGV4dGVuZHMgYCR7TmFtZX0uJHtpbmZlciBOZWdhdGV9YCA/IE5lZ2F0ZSA6IHVuZGVmaW5lZFxuICAgICAgICA+O1xuICAgICAgfVxuICAgIDogVCBleHRlbmRzIHN0cmluZyA/IFBhcnRpYWw8UmVjb3JkPFQsIE4gZXh0ZW5kcyBUID8gViB8IGZhbHNlIDogVj4+XG4gICAgOiBSZWNvcmQ8bmV2ZXIsIG5ldmVyPjtcblxudHlwZSBDb2xsZWN0VW5rbm93blZhbHVlczxcbiAgQiBleHRlbmRzIEJvb2xlYW5UeXBlLFxuICBTIGV4dGVuZHMgU3RyaW5nVHlwZSxcbiAgQyBleHRlbmRzIENvbGxlY3RhYmxlLFxuICBOIGV4dGVuZHMgTmVnYXRhYmxlLFxuPiA9IEIgJiBTIGV4dGVuZHMgQyA/IFJlY29yZDxuZXZlciwgbmV2ZXI+XG4gIDogRGVkb3RSZWNvcmQ8XG4gICAgLy8gVW5rbm93biBjb2xsZWN0YWJsZSAmIG5vbi1uZWdhdGFibGUgYXJncy5cbiAgICAmIFJlY29yZDxcbiAgICAgIEV4Y2x1ZGU8XG4gICAgICAgIEV4dHJhY3Q8RXhjbHVkZTxDLCBOPiwgc3RyaW5nPixcbiAgICAgICAgRXh0cmFjdDxTIHwgQiwgc3RyaW5nPlxuICAgICAgPixcbiAgICAgIEFycmF5PHVua25vd24+XG4gICAgPlxuICAgIC8vIFVua25vd24gY29sbGVjdGFibGUgJiBuZWdhdGFibGUgYXJncy5cbiAgICAmIFJlY29yZDxcbiAgICAgIEV4Y2x1ZGU8XG4gICAgICAgIEV4dHJhY3Q8RXh0cmFjdDxDLCBOPiwgc3RyaW5nPixcbiAgICAgICAgRXh0cmFjdDxTIHwgQiwgc3RyaW5nPlxuICAgICAgPixcbiAgICAgIEFycmF5PHVua25vd24+IHwgZmFsc2VcbiAgICA+XG4gID47XG5cbi8qKiBDb252ZXJ0cyBgeyBcImZvby5iYXIuYmF6XCI6IHVua25vd24gfWAgaW50byBgeyBmb286IHsgYmFyOiB7IGJhejogdW5rbm93biB9IH0gfWAuICovXG50eXBlIERlZG90UmVjb3JkPFQ+ID0gUmVjb3JkPHN0cmluZywgdW5rbm93bj4gZXh0ZW5kcyBUID8gVFxuICA6IFQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IFVuaW9uVG9JbnRlcnNlY3Rpb248XG4gICAgICBWYWx1ZU9mPFxuICAgICAgICB7IFtLIGluIGtleW9mIFRdOiBLIGV4dGVuZHMgc3RyaW5nID8gRGVkb3Q8SywgVFtLXT4gOiBuZXZlciB9XG4gICAgICA+XG4gICAgPlxuICA6IFQ7XG5cbnR5cGUgRGVkb3Q8VCBleHRlbmRzIHN0cmluZywgVj4gPSBUIGV4dGVuZHMgYCR7aW5mZXIgTmFtZX0uJHtpbmZlciBSZXN0fWBcbiAgPyB7IFtLIGluIE5hbWVdOiBEZWRvdDxSZXN0LCBWPiB9XG4gIDogeyBbSyBpbiBUXTogViB9O1xuXG50eXBlIFZhbHVlT2Y8VD4gPSBUW2tleW9mIFRdO1xuXG4vKiogVGhlIHZhbHVlIHJldHVybmVkIGZyb20gYHBhcnNlYC4gKi9cbmV4cG9ydCB0eXBlIEFyZ3M8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIEEgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gIEREIGV4dGVuZHMgYm9vbGVhbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbj4gPSBJZDxcbiAgJiBBXG4gICYge1xuICAgIC8qKiBDb250YWlucyBhbGwgdGhlIGFyZ3VtZW50cyB0aGF0IGRpZG4ndCBoYXZlIGFuIG9wdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAgICAgKiB0aGVtLiAqL1xuICAgIF86IEFycmF5PHN0cmluZyB8IG51bWJlcj47XG4gIH1cbiAgJiAoYm9vbGVhbiBleHRlbmRzIEREID8gRG91YmxlRGFzaFxuICAgIDogdHJ1ZSBleHRlbmRzIEREID8gUmVxdWlyZWQ8RG91YmxlRGFzaD5cbiAgICA6IFJlY29yZDxuZXZlciwgbmV2ZXI+KVxuPjtcblxudHlwZSBEb3VibGVEYXNoID0ge1xuICAvKiogQ29udGFpbnMgYWxsIHRoZSBhcmd1bWVudHMgdGhhdCBhcHBlYXIgYWZ0ZXIgdGhlIGRvdWJsZSBkYXNoOiBcIi0tXCIuICovXG4gIFwiLS1cIj86IEFycmF5PHN0cmluZz47XG59O1xuXG4vKiogVGhlIG9wdGlvbnMgZm9yIHRoZSBgcGFyc2VgIGNhbGwuICovXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlT3B0aW9uczxcbiAgQiBleHRlbmRzIEJvb2xlYW5UeXBlID0gQm9vbGVhblR5cGUsXG4gIFMgZXh0ZW5kcyBTdHJpbmdUeXBlID0gU3RyaW5nVHlwZSxcbiAgQyBleHRlbmRzIENvbGxlY3RhYmxlID0gQ29sbGVjdGFibGUsXG4gIE4gZXh0ZW5kcyBOZWdhdGFibGUgPSBOZWdhdGFibGUsXG4gIEQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCA9XG4gICAgfCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgIHwgdW5kZWZpbmVkLFxuICBBIGV4dGVuZHMgQWxpYXNlczxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWQgPVxuICAgIHwgQWxpYXNlczxzdHJpbmcsIHN0cmluZz5cbiAgICB8IHVuZGVmaW5lZCxcbiAgREQgZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gYm9vbGVhbiB8IHVuZGVmaW5lZCxcbj4ge1xuICAvKiogV2hlbiBgdHJ1ZWAsIHBvcHVsYXRlIHRoZSByZXN1bHQgYF9gIHdpdGggZXZlcnl0aGluZyBiZWZvcmUgdGhlIGAtLWAgYW5kXG4gICAqIHRoZSByZXN1bHQgYFsnLS0nXWAgd2l0aCBldmVyeXRoaW5nIGFmdGVyIHRoZSBgLS1gLiBIZXJlJ3MgYW4gZXhhbXBsZTpcbiAgICpcbiAgICogYGBgdHNcbiAgICogLy8gJCBkZW5vIHJ1biBleGFtcGxlLnRzIC0tIGEgYXJnMVxuICAgKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL21vZC50c1wiO1xuICAgKiBjb25zb2xlLmRpcihwYXJzZShEZW5vLmFyZ3MsIHsgXCItLVwiOiBmYWxzZSB9KSk7XG4gICAqIC8vIG91dHB1dDogeyBfOiBbIFwiYVwiLCBcImFyZzFcIiBdIH1cbiAgICogY29uc29sZS5kaXIocGFyc2UoRGVuby5hcmdzLCB7IFwiLS1cIjogdHJ1ZSB9KSk7XG4gICAqIC8vIG91dHB1dDogeyBfOiBbXSwgLS06IFsgXCJhXCIsIFwiYXJnMVwiIF0gfVxuICAgKiBgYGBcbiAgICpcbiAgICogRGVmYXVsdHMgdG8gYGZhbHNlYC5cbiAgICovXG4gIFwiLS1cIj86IEREO1xuXG4gIC8qKiBBbiBvYmplY3QgbWFwcGluZyBzdHJpbmcgbmFtZXMgdG8gc3RyaW5ncyBvciBhcnJheXMgb2Ygc3RyaW5nIGFyZ3VtZW50XG4gICAqIG5hbWVzIHRvIHVzZSBhcyBhbGlhc2VzLiAqL1xuICBhbGlhcz86IEE7XG5cbiAgLyoqIEEgYm9vbGVhbiwgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgdG8gYWx3YXlzIHRyZWF0IGFzIGJvb2xlYW5zLiBJZlxuICAgKiBgdHJ1ZWAgd2lsbCB0cmVhdCBhbGwgZG91YmxlIGh5cGhlbmF0ZWQgYXJndW1lbnRzIHdpdGhvdXQgZXF1YWwgc2lnbnMgYXNcbiAgICogYGJvb2xlYW5gIChlLmcuIGFmZmVjdHMgYC0tZm9vYCwgbm90IGAtZmAgb3IgYC0tZm9vPWJhcmApICovXG4gIGJvb2xlYW4/OiBCIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PEIsIHN0cmluZz4+O1xuXG4gIC8qKiBBbiBvYmplY3QgbWFwcGluZyBzdHJpbmcgYXJndW1lbnQgbmFtZXMgdG8gZGVmYXVsdCB2YWx1ZXMuICovXG4gIGRlZmF1bHQ/OiBEICYgRGVmYXVsdHM8QiwgUz47XG5cbiAgLyoqIFdoZW4gYHRydWVgLCBwb3B1bGF0ZSB0aGUgcmVzdWx0IGBfYCB3aXRoIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0XG4gICAqIG5vbi1vcHRpb24uICovXG4gIHN0b3BFYXJseT86IGJvb2xlYW47XG5cbiAgLyoqIEEgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgYXJndW1lbnQgbmFtZXMgdG8gYWx3YXlzIHRyZWF0IGFzIHN0cmluZ3MuICovXG4gIHN0cmluZz86IFMgfCBSZWFkb25seUFycmF5PEV4dHJhY3Q8Uywgc3RyaW5nPj47XG5cbiAgLyoqIEEgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgYXJndW1lbnQgbmFtZXMgdG8gYWx3YXlzIHRyZWF0IGFzIGFycmF5cy5cbiAgICogQ29sbGVjdGFibGUgb3B0aW9ucyBjYW4gYmUgdXNlZCBtdWx0aXBsZSB0aW1lcy4gQWxsIHZhbHVlcyB3aWxsIGJlXG4gICAqIGNvbGxlY3RlZCBpbnRvIG9uZSBhcnJheS4gSWYgYSBub24tY29sbGVjdGFibGUgb3B0aW9uIGlzIHVzZWQgbXVsdGlwbGVcbiAgICogdGltZXMsIHRoZSBsYXN0IHZhbHVlIGlzIHVzZWQuICovXG4gIGNvbGxlY3Q/OiBDIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PEMsIHN0cmluZz4+O1xuXG4gIC8qKiBBIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzIGFyZ3VtZW50IG5hbWVzIHdoaWNoIGNhbiBiZSBuZWdhdGVkXG4gICAqIGJ5IHByZWZpeGluZyB0aGVtIHdpdGggYC0tbm8tYCwgbGlrZSBgLS1uby1jb25maWdgLiAqL1xuICBuZWdhdGFibGU/OiBOIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PE4sIHN0cmluZz4+O1xuXG4gIC8qKiBBIGZ1bmN0aW9uIHdoaWNoIGlzIGludm9rZWQgd2l0aCBhIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXIgbm90IGRlZmluZWQgaW5cbiAgICogdGhlIGBvcHRpb25zYCBjb25maWd1cmF0aW9uIG9iamVjdC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYCwgdGhlXG4gICAqIHVua25vd24gb3B0aW9uIGlzIG5vdCBhZGRlZCB0byBgcGFyc2VkQXJnc2AuICovXG4gIHVua25vd24/OiAoYXJnOiBzdHJpbmcsIGtleT86IHN0cmluZywgdmFsdWU/OiB1bmtub3duKSA9PiB1bmtub3duO1xufVxuXG5pbnRlcmZhY2UgRmxhZ3Mge1xuICBib29sczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj47XG4gIHN0cmluZ3M6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+O1xuICBjb2xsZWN0OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgbmVnYXRhYmxlOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgdW5rbm93bkZuOiAoYXJnOiBzdHJpbmcsIGtleT86IHN0cmluZywgdmFsdWU/OiB1bmtub3duKSA9PiB1bmtub3duO1xuICBhbGxCb29sczogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIE5lc3RlZE1hcHBpbmcge1xuICBba2V5OiBzdHJpbmddOiBOZXN0ZWRNYXBwaW5nIHwgdW5rbm93bjtcbn1cblxuY29uc3QgeyBoYXNPd24gfSA9IE9iamVjdDtcblxuZnVuY3Rpb24gZ2V0PFQ+KG9iajogUmVjb3JkPHN0cmluZywgVD4sIGtleTogc3RyaW5nKTogVCB8IHVuZGVmaW5lZCB7XG4gIGlmIChoYXNPd24ob2JqLCBrZXkpKSB7XG4gICAgcmV0dXJuIG9ialtrZXldO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEZvcmNlPFQ+KG9iajogUmVjb3JkPHN0cmluZywgVD4sIGtleTogc3RyaW5nKTogVCB7XG4gIGNvbnN0IHYgPSBnZXQob2JqLCBrZXkpO1xuICBhc3NlcnQodiAhPSBudWxsKTtcbiAgcmV0dXJuIHY7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKHg6IHVua25vd24pOiBib29sZWFuIHtcbiAgaWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKC9eMHhbMC05YS1mXSskL2kudGVzdChTdHJpbmcoeCkpKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIC9eWy0rXT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKGVbLStdP1xcZCspPyQvLnRlc3QoU3RyaW5nKHgpKTtcbn1cblxuZnVuY3Rpb24gaGFzS2V5KG9iajogTmVzdGVkTWFwcGluZywga2V5czogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgbGV0IG8gPSBvYmo7XG4gIGtleXMuc2xpY2UoMCwgLTEpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIG8gPSAoZ2V0KG8sIGtleSkgPz8ge30pIGFzIE5lc3RlZE1hcHBpbmc7XG4gIH0pO1xuXG4gIGNvbnN0IGtleSA9IGtleXNba2V5cy5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIGhhc093bihvLCBrZXkpO1xufVxuXG4vKiogVGFrZSBhIHNldCBvZiBjb21tYW5kIGxpbmUgYXJndW1lbnRzLCBvcHRpb25hbGx5IHdpdGggYSBzZXQgb2Ygb3B0aW9ucywgYW5kXG4gKiByZXR1cm4gYW4gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgZmxhZ3MgZm91bmQgaW4gdGhlIHBhc3NlZCBhcmd1bWVudHMuXG4gKlxuICogQnkgZGVmYXVsdCwgYW55IGFyZ3VtZW50cyBzdGFydGluZyB3aXRoIGAtYCBvciBgLS1gIGFyZSBjb25zaWRlcmVkIGJvb2xlYW5cbiAqIGZsYWdzLiBJZiB0aGUgYXJndW1lbnQgbmFtZSBpcyBmb2xsb3dlZCBieSBhbiBlcXVhbCBzaWduIChgPWApIGl0IGlzXG4gKiBjb25zaWRlcmVkIGEga2V5LXZhbHVlIHBhaXIuIEFueSBhcmd1bWVudHMgd2hpY2ggY291bGQgbm90IGJlIHBhcnNlZCBhcmVcbiAqIGF2YWlsYWJsZSBpbiB0aGUgYF9gIHByb3BlcnR5IG9mIHRoZSByZXR1cm5lZCBvYmplY3QuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBhcnNlIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKiBjb25zdCBwYXJzZWRBcmdzID0gcGFyc2UoRGVuby5hcmdzKTtcbiAqIGBgYFxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL21vZC50c1wiO1xuICogY29uc3QgcGFyc2VkQXJncyA9IHBhcnNlKFtcIi0tZm9vXCIsIFwiLS1iYXI9YmF6XCIsIFwiLS1uby1xdXhcIiwgXCIuL3F1dXgudHh0XCJdKTtcbiAqIC8vIHBhcnNlZEFyZ3M6IHsgZm9vOiB0cnVlLCBiYXI6IFwiYmF6XCIsIHF1eDogZmFsc2UsIF86IFtcIi4vcXV1eC50eHRcIl0gfVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZTxcbiAgViBleHRlbmRzIFZhbHVlczxCLCBTLCBDLCBOLCBELCBBPixcbiAgREQgZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBCIGV4dGVuZHMgQm9vbGVhblR5cGUgPSB1bmRlZmluZWQsXG4gIFMgZXh0ZW5kcyBTdHJpbmdUeXBlID0gdW5kZWZpbmVkLFxuICBDIGV4dGVuZHMgQ29sbGVjdGFibGUgPSB1bmRlZmluZWQsXG4gIE4gZXh0ZW5kcyBOZWdhdGFibGUgPSB1bmRlZmluZWQsXG4gIEQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgQSBleHRlbmRzIEFsaWFzZXM8QUssIEFWPiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgQUsgZXh0ZW5kcyBzdHJpbmcgPSBzdHJpbmcsXG4gIEFWIGV4dGVuZHMgc3RyaW5nID0gc3RyaW5nLFxuPihcbiAgYXJnczogc3RyaW5nW10sXG4gIHtcbiAgICBcIi0tXCI6IGRvdWJsZURhc2ggPSBmYWxzZSxcbiAgICBhbGlhcyA9IHt9IGFzIE5vbk51bGxhYmxlPEE+LFxuICAgIGJvb2xlYW4gPSBmYWxzZSxcbiAgICBkZWZhdWx0OiBkZWZhdWx0cyA9IHt9IGFzIEQgJiBEZWZhdWx0czxCLCBTPixcbiAgICBzdG9wRWFybHkgPSBmYWxzZSxcbiAgICBzdHJpbmcgPSBbXSxcbiAgICBjb2xsZWN0ID0gW10sXG4gICAgbmVnYXRhYmxlID0gW10sXG4gICAgdW5rbm93biA9IChpOiBzdHJpbmcpOiB1bmtub3duID0+IGksXG4gIH06IFBhcnNlT3B0aW9uczxCLCBTLCBDLCBOLCBELCBBLCBERD4gPSB7fSxcbik6IEFyZ3M8ViwgREQ+IHtcbiAgY29uc3QgZmxhZ3M6IEZsYWdzID0ge1xuICAgIGJvb2xzOiB7fSxcbiAgICBzdHJpbmdzOiB7fSxcbiAgICB1bmtub3duRm46IHVua25vd24sXG4gICAgYWxsQm9vbHM6IGZhbHNlLFxuICAgIGNvbGxlY3Q6IHt9LFxuICAgIG5lZ2F0YWJsZToge30sXG4gIH07XG5cbiAgaWYgKGJvb2xlYW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgYm9vbGVhbiA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIGZsYWdzLmFsbEJvb2xzID0gISFib29sZWFuO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBib29sZWFuQXJnczogUmVhZG9ubHlBcnJheTxzdHJpbmc+ID0gdHlwZW9mIGJvb2xlYW4gPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyBbYm9vbGVhbl1cbiAgICAgICAgOiBib29sZWFuO1xuXG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBib29sZWFuQXJncy5maWx0ZXIoQm9vbGVhbikpIHtcbiAgICAgICAgZmxhZ3MuYm9vbHNba2V5XSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYWxpYXNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG4gIGlmIChhbGlhcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYWxpYXMpIHtcbiAgICAgIGNvbnN0IHZhbCA9IGdldEZvcmNlKGFsaWFzLCBrZXkpO1xuICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgYWxpYXNlc1trZXldID0gW3ZhbF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGlhc2VzW2tleV0gPSB2YWwgYXMgQXJyYXk8c3RyaW5nPjtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgYWxpYXMgb2YgZ2V0Rm9yY2UoYWxpYXNlcywga2V5KSkge1xuICAgICAgICBhbGlhc2VzW2FsaWFzXSA9IFtrZXldLmNvbmNhdChhbGlhc2VzW2tleV0uZmlsdGVyKCh5KSA9PiBhbGlhcyAhPT0geSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdHJpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHN0cmluZ0FyZ3M6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiA9IHR5cGVvZiBzdHJpbmcgPT09IFwic3RyaW5nXCJcbiAgICAgID8gW3N0cmluZ11cbiAgICAgIDogc3RyaW5nO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2Ygc3RyaW5nQXJncy5maWx0ZXIoQm9vbGVhbikpIHtcbiAgICAgIGZsYWdzLnN0cmluZ3Nba2V5XSA9IHRydWU7XG4gICAgICBjb25zdCBhbGlhcyA9IGdldChhbGlhc2VzLCBrZXkpO1xuICAgICAgaWYgKGFsaWFzKSB7XG4gICAgICAgIGZvciAoY29uc3QgYWwgb2YgYWxpYXMpIHtcbiAgICAgICAgICBmbGFncy5zdHJpbmdzW2FsXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoY29sbGVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgY29sbGVjdEFyZ3M6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiA9IHR5cGVvZiBjb2xsZWN0ID09PSBcInN0cmluZ1wiXG4gICAgICA/IFtjb2xsZWN0XVxuICAgICAgOiBjb2xsZWN0O1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgY29sbGVjdEFyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICBmbGFncy5jb2xsZWN0W2tleV0gPSB0cnVlO1xuICAgICAgY29uc3QgYWxpYXMgPSBnZXQoYWxpYXNlcywga2V5KTtcbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICBmb3IgKGNvbnN0IGFsIG9mIGFsaWFzKSB7XG4gICAgICAgICAgZmxhZ3MuY29sbGVjdFthbF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKG5lZ2F0YWJsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbmVnYXRhYmxlQXJnczogUmVhZG9ubHlBcnJheTxzdHJpbmc+ID0gdHlwZW9mIG5lZ2F0YWJsZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBbbmVnYXRhYmxlXVxuICAgICAgOiBuZWdhdGFibGU7XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBuZWdhdGFibGVBcmdzLmZpbHRlcihCb29sZWFuKSkge1xuICAgICAgZmxhZ3MubmVnYXRhYmxlW2tleV0gPSB0cnVlO1xuICAgICAgY29uc3QgYWxpYXMgPSBnZXQoYWxpYXNlcywga2V5KTtcbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICBmb3IgKGNvbnN0IGFsIG9mIGFsaWFzKSB7XG4gICAgICAgICAgZmxhZ3MubmVnYXRhYmxlW2FsXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBhcmd2OiBBcmdzID0geyBfOiBbXSB9O1xuXG4gIGZ1bmN0aW9uIGFyZ0RlZmluZWQoa2V5OiBzdHJpbmcsIGFyZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIChmbGFncy5hbGxCb29scyAmJiAvXi0tW149XSskLy50ZXN0KGFyZykpIHx8XG4gICAgICBnZXQoZmxhZ3MuYm9vbHMsIGtleSkgfHxcbiAgICAgICEhZ2V0KGZsYWdzLnN0cmluZ3MsIGtleSkgfHxcbiAgICAgICEhZ2V0KGFsaWFzZXMsIGtleSlcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0S2V5KFxuICAgIG9iajogTmVzdGVkTWFwcGluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IHVua25vd24sXG4gICAgY29sbGVjdCA9IHRydWUsXG4gICkge1xuICAgIGxldCBvID0gb2JqO1xuICAgIGNvbnN0IGtleXMgPSBuYW1lLnNwbGl0KFwiLlwiKTtcbiAgICBrZXlzLnNsaWNlKDAsIC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGlmIChnZXQobywga2V5KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG9ba2V5XSA9IHt9O1xuICAgICAgfVxuICAgICAgbyA9IGdldChvLCBrZXkpIGFzIE5lc3RlZE1hcHBpbmc7XG4gICAgfSk7XG5cbiAgICBjb25zdCBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgY29sbGVjdGFibGUgPSBjb2xsZWN0ICYmICEhZ2V0KGZsYWdzLmNvbGxlY3QsIG5hbWUpO1xuXG4gICAgaWYgKCFjb2xsZWN0YWJsZSkge1xuICAgICAgb1trZXldID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChnZXQobywga2V5KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBvW2tleV0gPSBbdmFsdWVdO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShnZXQobywga2V5KSkpIHtcbiAgICAgIChvW2tleV0gYXMgdW5rbm93bltdKS5wdXNoKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb1trZXldID0gW2dldChvLCBrZXkpLCB2YWx1ZV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0QXJnKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHZhbDogdW5rbm93bixcbiAgICBhcmc6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgICBjb2xsZWN0PzogYm9vbGVhbixcbiAgKSB7XG4gICAgaWYgKGFyZyAmJiBmbGFncy51bmtub3duRm4gJiYgIWFyZ0RlZmluZWQoa2V5LCBhcmcpKSB7XG4gICAgICBpZiAoZmxhZ3MudW5rbm93bkZuKGFyZywga2V5LCB2YWwpID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0gIWdldChmbGFncy5zdHJpbmdzLCBrZXkpICYmIGlzTnVtYmVyKHZhbCkgPyBOdW1iZXIodmFsKSA6IHZhbDtcbiAgICBzZXRLZXkoYXJndiwga2V5LCB2YWx1ZSwgY29sbGVjdCk7XG5cbiAgICBjb25zdCBhbGlhcyA9IGdldChhbGlhc2VzLCBrZXkpO1xuICAgIGlmIChhbGlhcykge1xuICAgICAgZm9yIChjb25zdCB4IG9mIGFsaWFzKSB7XG4gICAgICAgIHNldEtleShhcmd2LCB4LCB2YWx1ZSwgY29sbGVjdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZ2V0Rm9yY2UoYWxpYXNlcywga2V5KS5zb21lKFxuICAgICAgKHgpID0+IHR5cGVvZiBnZXQoZmxhZ3MuYm9vbHMsIHgpID09PSBcImJvb2xlYW5cIixcbiAgICApO1xuICB9XG5cbiAgbGV0IG5vdEZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIGFsbCBhcmdzIGFmdGVyIFwiLS1cIiBhcmUgbm90IHBhcnNlZFxuICBpZiAoYXJncy5pbmNsdWRlcyhcIi0tXCIpKSB7XG4gICAgbm90RmxhZ3MgPSBhcmdzLnNsaWNlKGFyZ3MuaW5kZXhPZihcIi0tXCIpICsgMSk7XG4gICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgYXJncy5pbmRleE9mKFwiLS1cIikpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXTtcblxuICAgIGlmICgvXi0tLis9Ly50ZXN0KGFyZykpIHtcbiAgICAgIGNvbnN0IG0gPSBhcmcubWF0Y2goL14tLShbXj1dKyk9KC4qKSQvcyk7XG4gICAgICBhc3NlcnQobSAhPSBudWxsKTtcbiAgICAgIGNvbnN0IFssIGtleSwgdmFsdWVdID0gbTtcblxuICAgICAgaWYgKGZsYWdzLmJvb2xzW2tleV0pIHtcbiAgICAgICAgY29uc3QgYm9vbGVhblZhbHVlID0gdmFsdWUgIT09IFwiZmFsc2VcIjtcbiAgICAgICAgc2V0QXJnKGtleSwgYm9vbGVhblZhbHVlLCBhcmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0QXJnKGtleSwgdmFsdWUsIGFyZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIC9eLS1uby0uKy8udGVzdChhcmcpICYmIGdldChmbGFncy5uZWdhdGFibGUsIGFyZy5yZXBsYWNlKC9eLS1uby0vLCBcIlwiKSlcbiAgICApIHtcbiAgICAgIGNvbnN0IG0gPSBhcmcubWF0Y2goL14tLW5vLSguKykvKTtcbiAgICAgIGFzc2VydChtICE9IG51bGwpO1xuICAgICAgc2V0QXJnKG1bMV0sIGZhbHNlLCBhcmcsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKC9eLS0uKy8udGVzdChhcmcpKSB7XG4gICAgICBjb25zdCBtID0gYXJnLm1hdGNoKC9eLS0oLispLyk7XG4gICAgICBhc3NlcnQobSAhPSBudWxsKTtcbiAgICAgIGNvbnN0IFssIGtleV0gPSBtO1xuICAgICAgY29uc3QgbmV4dCA9IGFyZ3NbaSArIDFdO1xuICAgICAgaWYgKFxuICAgICAgICBuZXh0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgIS9eLS8udGVzdChuZXh0KSAmJlxuICAgICAgICAhZ2V0KGZsYWdzLmJvb2xzLCBrZXkpICYmXG4gICAgICAgICFmbGFncy5hbGxCb29scyAmJlxuICAgICAgICAoZ2V0KGFsaWFzZXMsIGtleSkgPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpXG4gICAgICApIHtcbiAgICAgICAgc2V0QXJnKGtleSwgbmV4dCwgYXJnKTtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIGlmICgvXih0cnVlfGZhbHNlKSQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgc2V0QXJnKGtleSwgbmV4dCA9PT0gXCJ0cnVlXCIsIGFyZyk7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldEFyZyhrZXksIGdldChmbGFncy5zdHJpbmdzLCBrZXkpID8gXCJcIiA6IHRydWUsIGFyZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgvXi1bXi1dKy8udGVzdChhcmcpKSB7XG4gICAgICBjb25zdCBsZXR0ZXJzID0gYXJnLnNsaWNlKDEsIC0xKS5zcGxpdChcIlwiKTtcblxuICAgICAgbGV0IGJyb2tlbiA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsZXR0ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBhcmcuc2xpY2UoaiArIDIpO1xuXG4gICAgICAgIGlmIChuZXh0ID09PSBcIi1cIikge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKSAmJiAvPS8udGVzdChuZXh0KSkge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LnNwbGl0KC89KC4rKS8pWzFdLCBhcmcpO1xuICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pICYmXG4gICAgICAgICAgLy0/XFxkKyhcXC5cXGQqKT8oZS0/XFxkKyk/JC8udGVzdChuZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKTtcbiAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxldHRlcnNbaiArIDFdICYmIGxldHRlcnNbaiArIDFdLm1hdGNoKC9cXFcvKSkge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBhcmcuc2xpY2UoaiArIDIpLCBhcmcpO1xuICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGdldChmbGFncy5zdHJpbmdzLCBsZXR0ZXJzW2pdKSA/IFwiXCIgOiB0cnVlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IFtrZXldID0gYXJnLnNsaWNlKC0xKTtcbiAgICAgIGlmICghYnJva2VuICYmIGtleSAhPT0gXCItXCIpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFyZ3NbaSArIDFdICYmXG4gICAgICAgICAgIS9eKC18LS0pW14tXS8udGVzdChhcmdzW2kgKyAxXSkgJiZcbiAgICAgICAgICAhZ2V0KGZsYWdzLmJvb2xzLCBrZXkpICYmXG4gICAgICAgICAgKGdldChhbGlhc2VzLCBrZXkpID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKVxuICAgICAgICApIHtcbiAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2kgKyAxXSwgYXJnKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJnc1tpICsgMV0gJiYgL14odHJ1ZXxmYWxzZSkkLy50ZXN0KGFyZ3NbaSArIDFdKSkge1xuICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSArIDFdID09PSBcInRydWVcIiwgYXJnKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0QXJnKGtleSwgZ2V0KGZsYWdzLnN0cmluZ3MsIGtleSkgPyBcIlwiIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWZsYWdzLnVua25vd25GbiB8fCBmbGFncy51bmtub3duRm4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgYXJndi5fLnB1c2goZmxhZ3Muc3RyaW5nc1tcIl9cIl0gPz8gIWlzTnVtYmVyKGFyZykgPyBhcmcgOiBOdW1iZXIoYXJnKSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RvcEVhcmx5KSB7XG4gICAgICAgIGFyZ3YuXy5wdXNoKC4uLmFyZ3Muc2xpY2UoaSArIDEpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZGVmYXVsdHMpKSB7XG4gICAgaWYgKCFoYXNLZXkoYXJndiwga2V5LnNwbGl0KFwiLlwiKSkpIHtcbiAgICAgIHNldEtleShhcmd2LCBrZXksIHZhbHVlKTtcblxuICAgICAgaWYgKGFsaWFzZXNba2V5XSkge1xuICAgICAgICBmb3IgKGNvbnN0IHggb2YgYWxpYXNlc1trZXldKSB7XG4gICAgICAgICAgc2V0S2V5KGFyZ3YsIHgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZsYWdzLmJvb2xzKSkge1xuICAgIGlmICghaGFzS2V5KGFyZ3YsIGtleS5zcGxpdChcIi5cIikpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldChmbGFncy5jb2xsZWN0LCBrZXkpID8gW10gOiBmYWxzZTtcbiAgICAgIHNldEtleShcbiAgICAgICAgYXJndixcbiAgICAgICAga2V5LFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgZmFsc2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZsYWdzLnN0cmluZ3MpKSB7XG4gICAgaWYgKCFoYXNLZXkoYXJndiwga2V5LnNwbGl0KFwiLlwiKSkgJiYgZ2V0KGZsYWdzLmNvbGxlY3QsIGtleSkpIHtcbiAgICAgIHNldEtleShcbiAgICAgICAgYXJndixcbiAgICAgICAga2V5LFxuICAgICAgICBbXSxcbiAgICAgICAgZmFsc2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkb3VibGVEYXNoKSB7XG4gICAgYXJndltcIi0tXCJdID0gW107XG4gICAgZm9yIChjb25zdCBrZXkgb2Ygbm90RmxhZ3MpIHtcbiAgICAgIGFyZ3ZbXCItLVwiXS5wdXNoKGtleSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIG5vdEZsYWdzKSB7XG4gICAgICBhcmd2Ll8ucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcmd2IGFzIEFyZ3M8ViwgREQ+O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRTs7Ozs7OztDQU9DLEdBQ0QsU0FBUyxNQUFNLFFBQVEsb0JBQW9CLENBQUM7QUE4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