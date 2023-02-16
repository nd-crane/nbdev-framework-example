// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { Tokenizer } from "./tokenizer.ts";
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
// according to unicode symbols (http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("H"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    // quoted literal
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    // literal
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }, 
];
export class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules){
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type , value , hour12  })=>{
            const result = {
                type,
                value
            };
            if (hour12) result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {}) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format){
            const type = token.type;
            switch(type){
                case "year":
                    {
                        const value = utc ? date.getUTCFullYear() : date.getFullYear();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2).slice(-2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "month":
                    {
                        const value1 = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value1;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value1, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        const value2 = utc ? date.getUTCDate() : date.getDate();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value2;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value2, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        let value3 = utc ? date.getUTCHours() : date.getHours();
                        value3 -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value3;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value3, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        const value4 = utc ? date.getUTCMinutes() : date.getMinutes();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value4;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value4, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        const value5 = utc ? date.getUTCSeconds() : date.getSeconds();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value5;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value5, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value6 = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
                        string += digits(value6, Number(token.value));
                        break;
                    }
                // FIXME(bartlomieju)
                case "timeZoneName":
                    {
                        break;
                    }
                case "dayPeriod":
                    {
                        string += token.value ? date.getHours() >= 12 ? "PM" : "AM" : "";
                        break;
                    }
                case "literal":
                    {
                        string += token.value;
                        break;
                    }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format){
            const type = token.type;
            let value = "";
            switch(token.type){
                case "year":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,4}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                        }
                        break;
                    }
                case "month":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            case "narrow":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "short":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "long":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                                    }
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                                    }
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                        break;
                    }
                case "timeZoneName":
                    {
                        value = token.value;
                        break;
                    }
                case "dayPeriod":
                    {
                        value = /^(A|P)M/.exec(string)?.[0];
                        break;
                    }
                case "literal":
                    {
                        if (!string.startsWith(token.value)) {
                            throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                        }
                        value = token.value;
                        break;
                    }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({
                type,
                value
            });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    /** sort & filter dateTimeFormatPart */ sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond", 
        ];
        for (const type of typeArray){
            const current = parts.findIndex((el)=>el.type === type);
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part)=>part.type === "timeZoneName" && part.value === "UTC");
        const dayPart = parts.find((part)=>part.type === "day");
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part of parts){
            switch(part.type){
                case "year":
                    {
                        const value = Number(part.value.padStart(4, "20"));
                        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                        break;
                    }
                case "month":
                    {
                        const value1 = Number(part.value) - 1;
                        if (dayPart) {
                            utc ? date.setUTCMonth(value1, Number(dayPart.value)) : date.setMonth(value1, Number(dayPart.value));
                        } else {
                            utc ? date.setUTCMonth(value1) : date.setMonth(value1);
                        }
                        break;
                    }
                case "day":
                    {
                        const value2 = Number(part.value);
                        utc ? date.setUTCDate(value2) : date.setDate(value2);
                        break;
                    }
                case "hour":
                    {
                        let value3 = Number(part.value);
                        const dayPeriod = parts.find((part)=>part.type === "dayPeriod");
                        if (dayPeriod?.value === "PM") value3 += 12;
                        utc ? date.setUTCHours(value3) : date.setHours(value3);
                        break;
                    }
                case "minute":
                    {
                        const value4 = Number(part.value);
                        utc ? date.setUTCMinutes(value4) : date.setMinutes(value4);
                        break;
                    }
                case "second":
                    {
                        const value5 = Number(part.value);
                        utc ? date.setUTCSeconds(value5) : date.setSeconds(value5);
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value6 = Number(part.value);
                        utc ? date.setUTCMilliseconds(value6) : date.setMilliseconds(value6);
                        break;
                    }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2RhdGV0aW1lL2Zvcm1hdHRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQge1xuICBDYWxsYmFja1Jlc3VsdCxcbiAgUmVjZWl2ZXJSZXN1bHQsXG4gIFJ1bGUsXG4gIFRlc3RGdW5jdGlvbixcbiAgVGVzdFJlc3VsdCxcbiAgVG9rZW5pemVyLFxufSBmcm9tIFwiLi90b2tlbml6ZXIudHNcIjtcblxuZnVuY3Rpb24gZGlnaXRzKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIsIGNvdW50ID0gMik6IHN0cmluZyB7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KGNvdW50LCBcIjBcIik7XG59XG5cbi8vIGFzIGRlY2xhcmVkIGFzIGluIG5hbWVzcGFjZSBJbnRsXG50eXBlIERhdGVUaW1lRm9ybWF0UGFydFR5cGVzID1cbiAgfCBcImRheVwiXG4gIHwgXCJkYXlQZXJpb2RcIlxuICAvLyB8IFwiZXJhXCJcbiAgfCBcImhvdXJcIlxuICB8IFwibGl0ZXJhbFwiXG4gIHwgXCJtaW51dGVcIlxuICB8IFwibW9udGhcIlxuICB8IFwic2Vjb25kXCJcbiAgfCBcInRpbWVab25lTmFtZVwiXG4gIC8vIHwgXCJ3ZWVrZGF5XCJcbiAgfCBcInllYXJcIlxuICB8IFwiZnJhY3Rpb25hbFNlY29uZFwiO1xuXG5pbnRlcmZhY2UgRGF0ZVRpbWVGb3JtYXRQYXJ0IHtcbiAgdHlwZTogRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXM7XG4gIHZhbHVlOiBzdHJpbmc7XG59XG5cbnR5cGUgVGltZVpvbmUgPSBcIlVUQ1wiO1xuXG5pbnRlcmZhY2UgT3B0aW9ucyB7XG4gIHRpbWVab25lPzogVGltZVpvbmU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24odmFsdWU6IHN0cmluZyk6IFRlc3RGdW5jdGlvbiB7XG4gIHJldHVybiAoc3RyaW5nOiBzdHJpbmcpOiBUZXN0UmVzdWx0ID0+IHtcbiAgICByZXR1cm4gc3RyaW5nLnN0YXJ0c1dpdGgodmFsdWUpXG4gICAgICA/IHsgdmFsdWUsIGxlbmd0aDogdmFsdWUubGVuZ3RoIH1cbiAgICAgIDogdW5kZWZpbmVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNYXRjaFRlc3RGdW5jdGlvbihtYXRjaDogUmVnRXhwKTogVGVzdEZ1bmN0aW9uIHtcbiAgcmV0dXJuIChzdHJpbmc6IHN0cmluZyk6IFRlc3RSZXN1bHQgPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IG1hdGNoLmV4ZWMoc3RyaW5nKTtcbiAgICBpZiAocmVzdWx0KSByZXR1cm4geyB2YWx1ZTogcmVzdWx0LCBsZW5ndGg6IHJlc3VsdFswXS5sZW5ndGggfTtcbiAgfTtcbn1cblxuLy8gYWNjb3JkaW5nIHRvIHVuaWNvZGUgc3ltYm9scyAoaHR0cDovL3d3dy51bmljb2RlLm9yZy9yZXBvcnRzL3RyMzUvdHIzNS1kYXRlcy5odG1sI0RhdGVfRmllbGRfU3ltYm9sX1RhYmxlKVxuY29uc3QgZGVmYXVsdFJ1bGVzID0gW1xuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcInl5eXlcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInllYXJcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcInl5XCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJ5ZWFyXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIk1NXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtb250aFwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiTVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwibW9udGhcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImRkXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJkYXlcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImRcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImRheVwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG5cbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJISFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiaG91clwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiSFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiaG91clwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiaGhcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJob3VyXCIsXG4gICAgICB2YWx1ZTogXCIyLWRpZ2l0XCIsXG4gICAgICBob3VyMTI6IHRydWUsXG4gICAgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiaFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImhvdXJcIixcbiAgICAgIHZhbHVlOiBcIm51bWVyaWNcIixcbiAgICAgIGhvdXIxMjogdHJ1ZSxcbiAgICB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJtbVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwibWludXRlXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJtXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtaW51dGVcIiwgdmFsdWU6IFwibnVtZXJpY1wiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcInNzXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJzZWNvbmRcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcInNcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInNlY29uZFwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1NTXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJmcmFjdGlvbmFsU2Vjb25kXCIsIHZhbHVlOiAzIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIlNTXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJmcmFjdGlvbmFsU2Vjb25kXCIsIHZhbHVlOiAyIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIlNcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDEgfSksXG4gIH0sXG5cbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJhXCIpLFxuICAgIGZuOiAodmFsdWU6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJkYXlQZXJpb2RcIixcbiAgICAgIHZhbHVlOiB2YWx1ZSBhcyBzdHJpbmcsXG4gICAgfSksXG4gIH0sXG5cbiAgLy8gcXVvdGVkIGxpdGVyYWxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKC9eKCcpKD88dmFsdWU+XFxcXC58W15cXCddKilcXDEvKSxcbiAgICBmbjogKG1hdGNoOiB1bmtub3duKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwibGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IChtYXRjaCBhcyBSZWdFeHBFeGVjQXJyYXkpLmdyb3VwcyEudmFsdWUgYXMgc3RyaW5nLFxuICAgIH0pLFxuICB9LFxuICAvLyBsaXRlcmFsXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVNYXRjaFRlc3RGdW5jdGlvbigvXi4rP1xccyovKSxcbiAgICBmbjogKG1hdGNoOiB1bmtub3duKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwibGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IChtYXRjaCBhcyBSZWdFeHBFeGVjQXJyYXkpWzBdLFxuICAgIH0pLFxuICB9LFxuXTtcblxudHlwZSBGb3JtYXRQYXJ0ID0ge1xuICB0eXBlOiBEYXRlVGltZUZvcm1hdFBhcnRUeXBlcztcbiAgdmFsdWU6IHN0cmluZyB8IG51bWJlcjtcbiAgaG91cjEyPzogYm9vbGVhbjtcbn07XG50eXBlIEZvcm1hdCA9IEZvcm1hdFBhcnRbXTtcblxuZXhwb3J0IGNsYXNzIERhdGVUaW1lRm9ybWF0dGVyIHtcbiAgI2Zvcm1hdDogRm9ybWF0O1xuXG4gIGNvbnN0cnVjdG9yKGZvcm1hdFN0cmluZzogc3RyaW5nLCBydWxlczogUnVsZVtdID0gZGVmYXVsdFJ1bGVzKSB7XG4gICAgY29uc3QgdG9rZW5pemVyID0gbmV3IFRva2VuaXplcihydWxlcyk7XG4gICAgdGhpcy4jZm9ybWF0ID0gdG9rZW5pemVyLnRva2VuaXplKFxuICAgICAgZm9ybWF0U3RyaW5nLFxuICAgICAgKHsgdHlwZSwgdmFsdWUsIGhvdXIxMiB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICB9IGFzIHVua25vd24gYXMgUmVjZWl2ZXJSZXN1bHQ7XG4gICAgICAgIGlmIChob3VyMTIpIHJlc3VsdC5ob3VyMTIgPSBob3VyMTIgYXMgYm9vbGVhbjtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0sXG4gICAgKSBhcyBGb3JtYXQ7XG4gIH1cblxuICBmb3JtYXQoZGF0ZTogRGF0ZSwgb3B0aW9uczogT3B0aW9ucyA9IHt9KTogc3RyaW5nIHtcbiAgICBsZXQgc3RyaW5nID0gXCJcIjtcblxuICAgIGNvbnN0IHV0YyA9IG9wdGlvbnMudGltZVpvbmUgPT09IFwiVVRDXCI7XG5cbiAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRoaXMuI2Zvcm1hdCkge1xuICAgICAgY29uc3QgdHlwZSA9IHRva2VuLnR5cGU7XG5cbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFwieWVhclwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkgOiBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKS5zbGljZSgtMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtb250aFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSAodXRjID8gZGF0ZS5nZXRVVENNb250aCgpIDogZGF0ZS5nZXRNb250aCgpKSArIDE7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ0RhdGUoKSA6IGRhdGUuZ2V0RGF0ZSgpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJob3VyXCI6IHtcbiAgICAgICAgICBsZXQgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ0hvdXJzKCkgOiBkYXRlLmdldEhvdXJzKCk7XG4gICAgICAgICAgdmFsdWUgLT0gdG9rZW4uaG91cjEyICYmIGRhdGUuZ2V0SG91cnMoKSA+IDEyID8gMTIgOiAwO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtaW51dGVcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENNaW51dGVzKCkgOiBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2Vjb25kXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDU2Vjb25kcygpIDogZGF0ZS5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjXG4gICAgICAgICAgICA/IGRhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKClcbiAgICAgICAgICAgIDogZGF0ZS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCBOdW1iZXIodG9rZW4udmFsdWUpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBGSVhNRShiYXJ0bG9taWVqdSlcbiAgICAgICAgY2FzZSBcInRpbWVab25lTmFtZVwiOiB7XG4gICAgICAgICAgLy8gc3RyaW5nICs9IHV0YyA/IFwiWlwiIDogdG9rZW4udmFsdWVcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5UGVyaW9kXCI6IHtcbiAgICAgICAgICBzdHJpbmcgKz0gdG9rZW4udmFsdWUgPyAoZGF0ZS5nZXRIb3VycygpID49IDEyID8gXCJQTVwiIDogXCJBTVwiKSA6IFwiXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImxpdGVyYWxcIjoge1xuICAgICAgICAgIHN0cmluZyArPSB0b2tlbi52YWx1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgRXJyb3IoYEZvcm1hdHRlckVycm9yOiB7ICR7dG9rZW4udHlwZX0gJHt0b2tlbi52YWx1ZX0gfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cblxuICBwYXJzZVRvUGFydHMoc3RyaW5nOiBzdHJpbmcpOiBEYXRlVGltZUZvcm1hdFBhcnRbXSB7XG4gICAgY29uc3QgcGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRoaXMuI2Zvcm1hdCkge1xuICAgICAgY29uc3QgdHlwZSA9IHRva2VuLnR5cGU7XG5cbiAgICAgIGxldCB2YWx1ZSA9IFwiXCI7XG4gICAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDR9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtb250aFwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwibmFycm93XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJzaG9ydFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15bYS16QS1aXSsvLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwibG9uZ1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15bYS16QS1aXSsvLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRheVwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGlmICh0b2tlbi5ob3VyMTIgJiYgcGFyc2VJbnQodmFsdWUpID4gMTIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgYFRyeWluZyB0byBwYXJzZSBob3VyIGdyZWF0ZXIgdGhhbiAxMi4gVXNlICdIJyBpbnN0ZWFkIG9mICdoJy5gLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgaWYgKHRva2VuLmhvdXIxMiAmJiBwYXJzZUludCh2YWx1ZSkgPiAxMikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVHJ5aW5nIHRvIHBhcnNlIGhvdXIgZ3JlYXRlciB0aGFuIDEyLiBVc2UgJ0hIJyBpbnN0ZWFkIG9mICdoaCcuYCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJtaW51dGVcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzZWNvbmRcIjoge1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsxLDJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezJ9Ly5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYFBhcnNlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmcmFjdGlvbmFsU2Vjb25kXCI6IHtcbiAgICAgICAgICB2YWx1ZSA9IG5ldyBSZWdFeHAoYF5cXFxcZHske3Rva2VuLnZhbHVlfX1gKS5leGVjKHN0cmluZylcbiAgICAgICAgICAgID8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwidGltZVpvbmVOYW1lXCI6IHtcbiAgICAgICAgICB2YWx1ZSA9IHRva2VuLnZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5UGVyaW9kXCI6IHtcbiAgICAgICAgICB2YWx1ZSA9IC9eKEF8UClNLy5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImxpdGVyYWxcIjoge1xuICAgICAgICAgIGlmICghc3RyaW5nLnN0YXJ0c1dpdGgodG9rZW4udmFsdWUgYXMgc3RyaW5nKSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgIGBMaXRlcmFsIFwiJHt0b2tlbi52YWx1ZX1cIiBub3QgZm91bmQgXCIke3N0cmluZy5zbGljZSgwLCAyNSl9XCJgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFsdWUgPSB0b2tlbi52YWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IEVycm9yKGAke3Rva2VuLnR5cGV9ICR7dG9rZW4udmFsdWV9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgYHZhbHVlIG5vdCB2YWxpZCBmb3IgdG9rZW4geyAke3R5cGV9ICR7dmFsdWV9IH0gJHtcbiAgICAgICAgICAgIHN0cmluZy5zbGljZShcbiAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgMjUsXG4gICAgICAgICAgICApXG4gICAgICAgICAgfWAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBwYXJ0cy5wdXNoKHsgdHlwZSwgdmFsdWUgfSk7XG5cbiAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZSh2YWx1ZS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgYGRhdGV0aW1lIHN0cmluZyB3YXMgbm90IGZ1bGx5IHBhcnNlZCEgJHtzdHJpbmcuc2xpY2UoMCwgMjUpfWAsXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJ0cztcbiAgfVxuXG4gIC8qKiBzb3J0ICYgZmlsdGVyIGRhdGVUaW1lRm9ybWF0UGFydCAqL1xuICBzb3J0RGF0ZVRpbWVGb3JtYXRQYXJ0KHBhcnRzOiBEYXRlVGltZUZvcm1hdFBhcnRbXSk6IERhdGVUaW1lRm9ybWF0UGFydFtdIHtcbiAgICBsZXQgcmVzdWx0OiBEYXRlVGltZUZvcm1hdFBhcnRbXSA9IFtdO1xuICAgIGNvbnN0IHR5cGVBcnJheSA9IFtcbiAgICAgIFwieWVhclwiLFxuICAgICAgXCJtb250aFwiLFxuICAgICAgXCJkYXlcIixcbiAgICAgIFwiaG91clwiLFxuICAgICAgXCJtaW51dGVcIixcbiAgICAgIFwic2Vjb25kXCIsXG4gICAgICBcImZyYWN0aW9uYWxTZWNvbmRcIixcbiAgICBdO1xuICAgIGZvciAoY29uc3QgdHlwZSBvZiB0eXBlQXJyYXkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBwYXJ0cy5maW5kSW5kZXgoKGVsKSA9PiBlbC50eXBlID09PSB0eXBlKTtcbiAgICAgIGlmIChjdXJyZW50ICE9PSAtMSkge1xuICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHBhcnRzLnNwbGljZShjdXJyZW50LCAxKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQocGFydHMpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJ0c1RvRGF0ZShwYXJ0czogRGF0ZVRpbWVGb3JtYXRQYXJ0W10pOiBEYXRlIHtcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB1dGMgPSBwYXJ0cy5maW5kKFxuICAgICAgKHBhcnQpID0+IHBhcnQudHlwZSA9PT0gXCJ0aW1lWm9uZU5hbWVcIiAmJiBwYXJ0LnZhbHVlID09PSBcIlVUQ1wiLFxuICAgICk7XG5cbiAgICBjb25zdCBkYXlQYXJ0ID0gcGFydHMuZmluZCgocGFydCkgPT4gcGFydC50eXBlID09PSBcImRheVwiKTtcblxuICAgIHV0YyA/IGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCkgOiBkYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgc3dpdGNoIChwYXJ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUucGFkU3RhcnQoNCwgXCIyMFwiKSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENGdWxsWWVhcih2YWx1ZSkgOiBkYXRlLnNldEZ1bGxZZWFyKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibW9udGhcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpIC0gMTtcbiAgICAgICAgICBpZiAoZGF5UGFydCkge1xuICAgICAgICAgICAgdXRjXG4gICAgICAgICAgICAgID8gZGF0ZS5zZXRVVENNb250aCh2YWx1ZSwgTnVtYmVyKGRheVBhcnQudmFsdWUpKVxuICAgICAgICAgICAgICA6IGRhdGUuc2V0TW9udGgodmFsdWUsIE51bWJlcihkYXlQYXJ0LnZhbHVlKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDTW9udGgodmFsdWUpIDogZGF0ZS5zZXRNb250aCh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDRGF0ZSh2YWx1ZSkgOiBkYXRlLnNldERhdGUodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJob3VyXCI6IHtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgY29uc3QgZGF5UGVyaW9kID0gcGFydHMuZmluZChcbiAgICAgICAgICAgIChwYXJ0OiBEYXRlVGltZUZvcm1hdFBhcnQpID0+IHBhcnQudHlwZSA9PT0gXCJkYXlQZXJpb2RcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChkYXlQZXJpb2Q/LnZhbHVlID09PSBcIlBNXCIpIHZhbHVlICs9IDEyO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDSG91cnModmFsdWUpIDogZGF0ZS5zZXRIb3Vycyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENNaW51dGVzKHZhbHVlKSA6IGRhdGUuc2V0TWludXRlcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENTZWNvbmRzKHZhbHVlKSA6IGRhdGUuc2V0U2Vjb25kcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDTWlsbGlzZWNvbmRzKHZhbHVlKSA6IGRhdGUuc2V0TWlsbGlzZWNvbmRzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbiAgfVxuXG4gIHBhcnNlKHN0cmluZzogc3RyaW5nKTogRGF0ZSB7XG4gICAgY29uc3QgcGFydHMgPSB0aGlzLnBhcnNlVG9QYXJ0cyhzdHJpbmcpO1xuICAgIGNvbnN0IHNvcnRQYXJ0cyA9IHRoaXMuc29ydERhdGVUaW1lRm9ybWF0UGFydChwYXJ0cyk7XG4gICAgcmV0dXJuIHRoaXMucGFydHNUb0RhdGUoc29ydFBhcnRzKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FNRSxTQUFTLFFBQ0osZ0JBQWdCLENBQUM7QUFFeEIsU0FBUyxNQUFNLENBQUMsS0FBc0IsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFVO0lBQ3pELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQTRCRCxTQUFTLHlCQUF5QixDQUFDLEtBQWEsRUFBZ0I7SUFDOUQsT0FBTyxDQUFDLE1BQWMsR0FBaUI7UUFDckMsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUMzQjtZQUFFLEtBQUs7WUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07U0FBRSxHQUMvQixTQUFTLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBYSxFQUFnQjtJQUM1RCxPQUFPLENBQUMsTUFBYyxHQUFpQjtRQUNyQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxBQUFDO1FBQ2xDLElBQUksTUFBTSxFQUFFLE9BQU87WUFBRSxLQUFLLEVBQUUsTUFBTTtZQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FB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