// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Contains the functions {@linkcode accepts}, {@linkcode acceptsEncodings}, and
 * {@linkcode acceptsLanguages} to provide content negotiation capabilities.
 *
 * @module
 */ import { preferredEncodings } from "./_negotiation/encoding.ts";
import { preferredLanguages } from "./_negotiation/language.ts";
import { preferredMediaTypes } from "./_negotiation/media_type.ts";
export function accepts(request, ...types) {
    const accept = request.headers.get("accept");
    return types.length ? accept ? preferredMediaTypes(accept, types)[0] : types[0] : accept ? preferredMediaTypes(accept) : [
        "*/*"
    ];
}
export function acceptsEncodings(request, ...encodings) {
    const acceptEncoding = request.headers.get("accept-encoding");
    return encodings.length ? acceptEncoding ? preferredEncodings(acceptEncoding, encodings)[0] : encodings[0] : acceptEncoding ? preferredEncodings(acceptEncoding) : [
        "*"
    ];
}
export function acceptsLanguages(request, ...langs) {
    const acceptLanguage = request.headers.get("accept-language");
    return langs.length ? acceptLanguage ? preferredLanguages(acceptLanguage, langs)[0] : langs[0] : acceptLanguage ? preferredLanguages(acceptLanguage) : [
        "*"
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2h0dHAvbmVnb3RpYXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBDb250YWlucyB0aGUgZnVuY3Rpb25zIHtAbGlua2NvZGUgYWNjZXB0c30sIHtAbGlua2NvZGUgYWNjZXB0c0VuY29kaW5nc30sIGFuZFxuICoge0BsaW5rY29kZSBhY2NlcHRzTGFuZ3VhZ2VzfSB0byBwcm92aWRlIGNvbnRlbnQgbmVnb3RpYXRpb24gY2FwYWJpbGl0aWVzLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgeyBwcmVmZXJyZWRFbmNvZGluZ3MgfSBmcm9tIFwiLi9fbmVnb3RpYXRpb24vZW5jb2RpbmcudHNcIjtcbmltcG9ydCB7IHByZWZlcnJlZExhbmd1YWdlcyB9IGZyb20gXCIuL19uZWdvdGlhdGlvbi9sYW5ndWFnZS50c1wiO1xuaW1wb3J0IHsgcHJlZmVycmVkTWVkaWFUeXBlcyB9IGZyb20gXCIuL19uZWdvdGlhdGlvbi9tZWRpYV90eXBlLnRzXCI7XG5cbmV4cG9ydCB0eXBlIFJlcXVlc3QgPSB7XG4gIGhlYWRlcnM6IHtcbiAgICBnZXQoa2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsO1xuICB9O1xufTtcblxuLyoqIFJldHVybnMgYW4gYXJyYXkgb2YgbWVkaWEgdHlwZXMgYWNjZXB0ZWQgYnkgdGhlIHJlcXVlc3QsIGluIG9yZGVyIG9mXG4gKiBwcmVmZXJlbmNlLiBJZiB0aGVyZSBhcmUgbm8gbWVkaWEgdHlwZXMgc3VwcGxpZWQgaW4gdGhlIHJlcXVlc3QsIHRoZW4gYW55XG4gKiBtZWRpYSB0eXBlIHNlbGVjdG9yIHdpbGwgYmUgcmV0dXJuZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0cyhyZXF1ZXN0OiBSZXF1ZXN0KTogc3RyaW5nW107XG4vKiogRm9yIGEgZ2l2ZW4gc2V0IG9mIG1lZGlhIHR5cGVzLCByZXR1cm4gdGhlIGJlc3QgbWF0Y2ggYWNjZXB0ZWQgaW4gdGhlXG4gKiByZXF1ZXN0LiBJZiBubyBtZWRpYSB0eXBlIG1hdGNoZXMsIHRoZW4gdGhlIGZ1bmN0aW9uIHJldHVybnMgYHVuZGVmaW5lZGAuICovXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0cyhcbiAgcmVxdWVzdDogUmVxdWVzdCxcbiAgLi4udHlwZXM6IHN0cmluZ1tdXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0cyhcbiAgcmVxdWVzdDogUmVxdWVzdCxcbiAgLi4udHlwZXM6IHN0cmluZ1tdXG4pOiBzdHJpbmcgfCBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IGFjY2VwdCA9IHJlcXVlc3QuaGVhZGVycy5nZXQoXCJhY2NlcHRcIik7XG4gIHJldHVybiB0eXBlcy5sZW5ndGhcbiAgICA/IGFjY2VwdCA/IHByZWZlcnJlZE1lZGlhVHlwZXMoYWNjZXB0LCB0eXBlcylbMF0gOiB0eXBlc1swXVxuICAgIDogYWNjZXB0XG4gICAgPyBwcmVmZXJyZWRNZWRpYVR5cGVzKGFjY2VwdClcbiAgICA6IFtcIiovKlwiXTtcbn1cblxuLyoqIFJldHVybnMgYW4gYXJyYXkgb2YgY29udGVudCBlbmNvZGluZ3MgYWNjZXB0ZWQgYnkgdGhlIHJlcXVlc3QsIGluIG9yZGVyIG9mXG4gKiBwcmVmZXJlbmNlLiBJZiB0aGVyZSBhcmUgbm8gZW5jb2Rpbmcgc3VwcGxpZWQgaW4gdGhlIHJlcXVlc3QsIHRoZW4gYFtcIipcIl1gXG4gKiBpcyByZXR1cm5lZCwgaW1wbHlpbmcgYW55IGVuY29kaW5nIGlzIGFjY2VwdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjY2VwdHNFbmNvZGluZ3MocmVxdWVzdDogUmVxdWVzdCk6IHN0cmluZ1tdO1xuLyoqIEZvciBhIGdpdmVuIHNldCBvZiBjb250ZW50IGVuY29kaW5ncywgcmV0dXJuIHRoZSBiZXN0IG1hdGNoIGFjY2VwdGVkIGluIHRoZVxuICogcmVxdWVzdC4gSWYgbm8gY29udGVudCBlbmNvZGluZ3MgbWF0Y2gsIHRoZW4gdGhlIGZ1bmN0aW9uIHJldHVybnNcbiAqIGB1bmRlZmluZWRgLlxuICpcbiAqICoqTk9URToqKiBZb3Ugc2hvdWxkIGFsd2F5cyBzdXBwbHkgYGlkZW50aXR5YCBhcyBvbmUgb2YgdGhlIGVuY29kaW5nc1xuICogdG8gZW5zdXJlIHRoYXQgdGhlcmUgaXMgYSBtYXRjaCB3aGVuIHRoZSBgQWNjZXB0LUVuY29kaW5nYCBoZWFkZXIgaXMgcGFydFxuICogb2YgdGhlIHJlcXVlc3QuICovXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0c0VuY29kaW5ncyhcbiAgcmVxdWVzdDogUmVxdWVzdCxcbiAgLi4uZW5jb2RpbmdzOiBzdHJpbmdbXVxuKTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuZXhwb3J0IGZ1bmN0aW9uIGFjY2VwdHNFbmNvZGluZ3MoXG4gIHJlcXVlc3Q6IFJlcXVlc3QsXG4gIC4uLmVuY29kaW5nczogc3RyaW5nW11cbik6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgYWNjZXB0RW5jb2RpbmcgPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYWNjZXB0LWVuY29kaW5nXCIpO1xuICByZXR1cm4gZW5jb2RpbmdzLmxlbmd0aFxuICAgID8gYWNjZXB0RW5jb2RpbmdcbiAgICAgID8gcHJlZmVycmVkRW5jb2RpbmdzKGFjY2VwdEVuY29kaW5nLCBlbmNvZGluZ3MpWzBdXG4gICAgICA6IGVuY29kaW5nc1swXVxuICAgIDogYWNjZXB0RW5jb2RpbmdcbiAgICA/IHByZWZlcnJlZEVuY29kaW5ncyhhY2NlcHRFbmNvZGluZylcbiAgICA6IFtcIipcIl07XG59XG5cbi8qKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxhbmd1YWdlcyBhY2NlcHRlZCBieSB0aGUgcmVxdWVzdCwgaW4gb3JkZXIgb2ZcbiAqIHByZWZlcmVuY2UuIElmIHRoZXJlIGFyZSBubyBsYW5ndWFnZXMgc3VwcGxpZWQgaW4gdGhlIHJlcXVlc3QsIHRoZW4gYFtcIipcIl1gXG4gKiBpcyByZXR1cm5lZCwgaW1wbHkgYW55IGxhbmd1YWdlIGlzIGFjY2VwdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjY2VwdHNMYW5ndWFnZXMocmVxdWVzdDogUmVxdWVzdCk6IHN0cmluZ1tdO1xuLyoqIEZvciBhIGdpdmVuIHNldCBvZiBsYW5ndWFnZXMsIHJldHVybiB0aGUgYmVzdCBtYXRjaCBhY2NlcHRlZCBpbiB0aGUgcmVxdWVzdC5cbiAqIElmIG5vIGxhbmd1YWdlcyBtYXRjaCwgdGhlbiB0aGUgZnVuY3Rpb24gcmV0dXJucyBgdW5kZWZpbmVkYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY2NlcHRzTGFuZ3VhZ2VzKFxuICByZXF1ZXN0OiBSZXF1ZXN0LFxuICAuLi5sYW5nczogc3RyaW5nW11cbik6IHN0cmluZyB8IHVuZGVmaW5lZDtcbmV4cG9ydCBmdW5jdGlvbiBhY2NlcHRzTGFuZ3VhZ2VzKFxuICByZXF1ZXN0OiBSZXF1ZXN0LFxuICAuLi5sYW5nczogc3RyaW5nW11cbik6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgYWNjZXB0TGFuZ3VhZ2UgPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYWNjZXB0LWxhbmd1YWdlXCIpO1xuICByZXR1cm4gbGFuZ3MubGVuZ3RoXG4gICAgPyBhY2NlcHRMYW5ndWFnZSA/IHByZWZlcnJlZExhbmd1YWdlcyhhY2NlcHRMYW5ndWFnZSwgbGFuZ3MpWzBdIDogbGFuZ3NbMF1cbiAgICA6IGFjY2VwdExhbmd1YWdlXG4gICAgPyBwcmVmZXJyZWRMYW5ndWFnZXMoYWNjZXB0TGFuZ3VhZ2UpXG4gICAgOiBbXCIqXCJdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Q0FLQyxHQUVELFNBQVMsa0JBQWtCLFFBQVEsNEJBQTRCLENBQUM7QUFDaEUsU0FBUyxrQkFBa0IsUUFBUSw0QkFBNEIsQ0FBQztBQUNoRSxTQUFTLG1CQUFtQixRQUFRLDhCQUE4QixDQUFDO0FBa0JuRSxPQUFPLFNBQVMsT0FBTyxDQUNyQixPQUFnQixFQUNoQixHQUFHLEtBQUssQUFBVSxFQUNhO0lBQy9CLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxBQUFDO0lBQzdDLE9BQU8sS0FBSyxDQUFDLE1BQU0sR0FDZixNQUFNLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FDekQsTUFBTSxHQUNOLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxHQUMzQjtRQUFDLEtBQUs7S0FBQyxDQUFDO0FBQ2QsQ0FBQztBQWlCRCxPQUFPLFNBQVMsZ0JBQWdCLENBQzlCLE9BQWdCLEVBQ2hCLEdBQUcsU0FBUyxBQUFVLEVBQ1M7SUFDL0IsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQUFBQztJQUM5RCxPQUFPLFNBQVMsQ0FBQyxNQUFNLEdBQ25CLGNBQWMsR0FDWixrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQ2hELFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FDZCxjQUFjLEdBQ2Qsa0JBQWtCLENBQUMsY0FBYyxDQUFDLEdBQ2xDO1FBQUMsR0FBRztLQUFDLENBQUM7QUFDWixDQUFDO0FBWUQsT0FBTyxTQUFTLGdCQUFnQixDQUM5QixPQUFnQixFQUNoQixHQUFHLEtBQUssQUFBVSxFQUNhO0lBQy9CLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEFBQUM7SUFDOUQsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUNmLGNBQWMsR0FBRyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUN4RSxjQUFjLEdBQ2Qsa0JBQWtCLENBQUMsY0FBYyxDQUFDLEdBQ2xDO1FBQUMsR0FBRztLQUFDLENBQUM7QUFDWixDQUFDIn0=