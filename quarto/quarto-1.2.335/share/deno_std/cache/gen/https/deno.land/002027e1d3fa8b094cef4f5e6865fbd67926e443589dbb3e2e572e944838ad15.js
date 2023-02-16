// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** **Deprecated**. Use
 * [Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
 * or `std/crypto` instead.
 *
 * This module is browser compatible.
 *
 * @deprecated Use Web Crypto API or std/crypto instead.
 * @module
 */ import { Hash } from "./_wasm/hash.ts";
/** @deprecated Use Web Crypto API or std/crypto instead. */ export const supportedAlgorithms = [
    "md2",
    "md4",
    "md5",
    "ripemd160",
    "ripemd320",
    "sha1",
    "sha224",
    "sha256",
    "sha384",
    "sha512",
    "sha3-224",
    "sha3-256",
    "sha3-384",
    "sha3-512",
    "keccak224",
    "keccak256",
    "keccak384",
    "keccak512",
    "blake3",
    "tiger", 
];
/**
 * Creates a new `Hash` instance.
 *
 * @param algorithm name of hash algorithm to use
 * @deprecated Use Web Crypto API or std/crypto instead.
 */ export function createHash(algorithm) {
    return new Hash(algorithm);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2hhc2gvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKiAqKkRlcHJlY2F0ZWQqKi4gVXNlXG4gKiBbV2ViIENyeXB0b10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYl9DcnlwdG9fQVBJKVxuICogb3IgYHN0ZC9jcnlwdG9gIGluc3RlYWQuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSBXZWIgQ3J5cHRvIEFQSSBvciBzdGQvY3J5cHRvIGluc3RlYWQuXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHsgSGFzaCB9IGZyb20gXCIuL193YXNtL2hhc2gudHNcIjtcbmltcG9ydCB0eXBlIHsgSGFzaGVyIH0gZnJvbSBcIi4vaGFzaGVyLnRzXCI7XG5cbi8qKiBAZGVwcmVjYXRlZCBVc2UgV2ViIENyeXB0byBBUEkgb3Igc3RkL2NyeXB0byBpbnN0ZWFkLiAqL1xuZXhwb3J0IHR5cGUgeyBIYXNoZXIgfSBmcm9tIFwiLi9oYXNoZXIudHNcIjtcbi8qKiBAZGVwcmVjYXRlZCBVc2UgV2ViIENyeXB0byBBUEkgb3Igc3RkL2NyeXB0byBpbnN0ZWFkLiAqL1xuZXhwb3J0IGNvbnN0IHN1cHBvcnRlZEFsZ29yaXRobXMgPSBbXG4gIFwibWQyXCIsXG4gIFwibWQ0XCIsXG4gIFwibWQ1XCIsXG4gIFwicmlwZW1kMTYwXCIsXG4gIFwicmlwZW1kMzIwXCIsXG4gIFwic2hhMVwiLFxuICBcInNoYTIyNFwiLFxuICBcInNoYTI1NlwiLFxuICBcInNoYTM4NFwiLFxuICBcInNoYTUxMlwiLFxuICBcInNoYTMtMjI0XCIsXG4gIFwic2hhMy0yNTZcIixcbiAgXCJzaGEzLTM4NFwiLFxuICBcInNoYTMtNTEyXCIsXG4gIFwia2VjY2FrMjI0XCIsXG4gIFwia2VjY2FrMjU2XCIsXG4gIFwia2VjY2FrMzg0XCIsXG4gIFwia2VjY2FrNTEyXCIsXG4gIFwiYmxha2UzXCIsXG4gIFwidGlnZXJcIixcbl0gYXMgY29uc3Q7XG4vKiogQGRlcHJlY2F0ZWQgVXNlIFdlYiBDcnlwdG8gQVBJIG9yIHN0ZC9jcnlwdG8gaW5zdGVhZC4gKi9cbmV4cG9ydCB0eXBlIFN1cHBvcnRlZEFsZ29yaXRobSA9IHR5cGVvZiBzdXBwb3J0ZWRBbGdvcml0aG1zW251bWJlcl07XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEhhc2hgIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBhbGdvcml0aG0gbmFtZSBvZiBoYXNoIGFsZ29yaXRobSB0byB1c2VcbiAqIEBkZXByZWNhdGVkIFVzZSBXZWIgQ3J5cHRvIEFQSSBvciBzdGQvY3J5cHRvIGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIYXNoKGFsZ29yaXRobTogU3VwcG9ydGVkQWxnb3JpdGhtKTogSGFzaGVyIHtcbiAgcmV0dXJuIG5ldyBIYXNoKGFsZ29yaXRobSBhcyBzdHJpbmcpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Ozs7Q0FRQyxHQUVELFNBQVMsSUFBSSxRQUFRLGlCQUFpQixDQUFDO0FBS3ZDLDBEQUEwRCxHQUMxRCxPQUFPLE1BQU0sbUJBQW1CLEdBQUc7SUFDakMsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsV0FBVztJQUNYLFdBQVc7SUFDWCxNQUFNO0lBQ04sUUFBUTtJQUNSLFFBQVE7SUFDUixRQUFRO0lBQ1IsUUFBUTtJQUNSLFVBQVU7SUFDVixVQUFVO0lBQ1YsVUFBVTtJQUNWLFVBQVU7SUFDVixXQUFXO0lBQ1gsV0FBVztJQUNYLFdBQVc7SUFDWCxXQUFXO0lBQ1gsUUFBUTtJQUNSLE9BQU87Q0FDUixBQUFTLENBQUM7QUFHWDs7Ozs7Q0FLQyxHQUNELE9BQU8sU0FBUyxVQUFVLENBQUMsU0FBNkIsRUFBVTtJQUNoRSxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBVyxDQUFDO0FBQ3ZDLENBQUMifQ==