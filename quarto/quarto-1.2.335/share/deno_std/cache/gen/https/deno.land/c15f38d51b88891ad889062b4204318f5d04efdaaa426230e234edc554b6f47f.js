// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Schema } from "../schema.ts";
import { regexp, undefinedType } from "../type/mod.ts";
import { def } from "./default.ts";
// Extends JS-YAML default schema with additional JavaScript types
// It is not described in the YAML specification.
export const extended = new Schema({
    explicit: [
        regexp,
        undefinedType
    ],
    include: [
        def
    ]
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2VuY29kaW5nL195YW1sL3NjaGVtYS9leHRlbmRlZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBTY2hlbWEgfSBmcm9tIFwiLi4vc2NoZW1hLnRzXCI7XG5pbXBvcnQgeyByZWdleHAsIHVuZGVmaW5lZFR5cGUgfSBmcm9tIFwiLi4vdHlwZS9tb2QudHNcIjtcbmltcG9ydCB7IGRlZiB9IGZyb20gXCIuL2RlZmF1bHQudHNcIjtcblxuLy8gRXh0ZW5kcyBKUy1ZQU1MIGRlZmF1bHQgc2NoZW1hIHdpdGggYWRkaXRpb25hbCBKYXZhU2NyaXB0IHR5cGVzXG4vLyBJdCBpcyBub3QgZGVzY3JpYmVkIGluIHRoZSBZQU1MIHNwZWNpZmljYXRpb24uXG5leHBvcnQgY29uc3QgZXh0ZW5kZWQgPSBuZXcgU2NoZW1hKHtcbiAgZXhwbGljaXQ6IFtyZWdleHAsIHVuZGVmaW5lZFR5cGVdLFxuICBpbmNsdWRlOiBbZGVmXSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRSxTQUFTLE1BQU0sUUFBUSxjQUFjLENBQUM7QUFDdEMsU0FBUyxNQUFNLEVBQUUsYUFBYSxRQUFRLGdCQUFnQixDQUFDO0FBQ3ZELFNBQVMsR0FBRyxRQUFRLGNBQWMsQ0FBQztBQUVuQyxrRUFBa0U7QUFDbEUsaURBQWlEO0FBQ2pELE9BQU8sTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUM7SUFDakMsUUFBUSxFQUFFO1FBQUMsTUFBTTtRQUFFLGFBQWE7S0FBQztJQUNqQyxPQUFPLEVBQUU7UUFBQyxHQUFHO0tBQUM7Q0FDZixDQUFDLENBQUMifQ==