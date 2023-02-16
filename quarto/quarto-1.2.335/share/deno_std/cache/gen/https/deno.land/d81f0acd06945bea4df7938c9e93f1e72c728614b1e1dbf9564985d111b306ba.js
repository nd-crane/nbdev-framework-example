// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Utilities for working with Deno's readers, writers, and web streams.
 *
 * `Reader` and `Writer` interfaces are deprecated in Deno, and so many of these
 * utilities are also deprecated. Consider using web streams instead.
 *
 * @module
 */ export * from "./buffer.ts";
export * from "./readers.ts";
export * from "./streams.ts";
export { copyN, readInt, readLong, readShort, sliceLongToBytes } from "./util.ts";
export * from "./writers.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2lvL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIERlbm8ncyByZWFkZXJzLCB3cml0ZXJzLCBhbmQgd2ViIHN0cmVhbXMuXG4gKlxuICogYFJlYWRlcmAgYW5kIGBXcml0ZXJgIGludGVyZmFjZXMgYXJlIGRlcHJlY2F0ZWQgaW4gRGVubywgYW5kIHNvIG1hbnkgb2YgdGhlc2VcbiAqIHV0aWxpdGllcyBhcmUgYWxzbyBkZXByZWNhdGVkLiBDb25zaWRlciB1c2luZyB3ZWIgc3RyZWFtcyBpbnN0ZWFkLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5leHBvcnQgKiBmcm9tIFwiLi9idWZmZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3JlYWRlcnMudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3N0cmVhbXMudHNcIjtcbmV4cG9ydCB7XG4gIGNvcHlOLFxuICByZWFkSW50LFxuICByZWFkTG9uZyxcbiAgcmVhZFNob3J0LFxuICBzbGljZUxvbmdUb0J5dGVzLFxufSBmcm9tIFwiLi91dGlsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi93cml0ZXJzLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFOzs7Ozs7O0NBT0MsR0FFRCxjQUFjLGFBQWEsQ0FBQztBQUM1QixjQUFjLGNBQWMsQ0FBQztBQUM3QixjQUFjLGNBQWMsQ0FBQztBQUM3QixTQUNFLEtBQUssRUFDTCxPQUFPLEVBQ1AsUUFBUSxFQUNSLFNBQVMsRUFDVCxnQkFBZ0IsUUFDWCxXQUFXLENBQUM7QUFDbkIsY0FBYyxjQUFjLENBQUMifQ==