// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import * as path from "../path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType } from "./_util.ts";
/**
 * Ensures that the file exists.
 * If the file that is requested to be created is in directories that do not
 * exist.
 * these directories are created. If the file already exists,
 * it is NOTMODIFIED.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export async function ensureFile(filePath) {
    try {
        // if file exists
        const stat = await Deno.lstat(filePath);
        if (!stat.isFile) {
            throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
        }
    } catch (err) {
        // if file not exists
        if (err instanceof Deno.errors.NotFound) {
            // ensure dir exists
            await ensureDir(path.dirname(filePath));
            // create file
            await Deno.writeFile(filePath, new Uint8Array());
            return;
        }
        throw err;
    }
}
/**
 * Ensures that the file exists.
 * If the file that is requested to be created is in directories that do not
 * exist,
 * these directories are created. If the file already exists,
 * it is NOT MODIFIED.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export function ensureFileSync(filePath) {
    try {
        // if file exists
        const stat = Deno.lstatSync(filePath);
        if (!stat.isFile) {
            throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
        }
    } catch (err) {
        // if file not exists
        if (err instanceof Deno.errors.NotFound) {
            // ensure dir exists
            ensureDirSync(path.dirname(filePath));
            // create file
            Deno.writeFileSync(filePath, new Uint8Array());
            return;
        }
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2ZzL2Vuc3VyZV9maWxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCIuLi9wYXRoL21vZC50c1wiO1xuaW1wb3J0IHsgZW5zdXJlRGlyLCBlbnN1cmVEaXJTeW5jIH0gZnJvbSBcIi4vZW5zdXJlX2Rpci50c1wiO1xuaW1wb3J0IHsgZ2V0RmlsZUluZm9UeXBlIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuLyoqXG4gKiBFbnN1cmVzIHRoYXQgdGhlIGZpbGUgZXhpc3RzLlxuICogSWYgdGhlIGZpbGUgdGhhdCBpcyByZXF1ZXN0ZWQgdG8gYmUgY3JlYXRlZCBpcyBpbiBkaXJlY3RvcmllcyB0aGF0IGRvIG5vdFxuICogZXhpc3QuXG4gKiB0aGVzZSBkaXJlY3RvcmllcyBhcmUgY3JlYXRlZC4gSWYgdGhlIGZpbGUgYWxyZWFkeSBleGlzdHMsXG4gKiBpdCBpcyBOT1RNT0RJRklFRC5cbiAqIFJlcXVpcmVzIHRoZSBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIGZsYWcuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICAvLyBpZiBmaWxlIGV4aXN0c1xuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBEZW5vLmxzdGF0KGZpbGVQYXRoKTtcbiAgICBpZiAoIXN0YXQuaXNGaWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdmaWxlJywgZ290ICcke2dldEZpbGVJbmZvVHlwZShzdGF0KX0nYCxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiBmaWxlIG5vdCBleGlzdHNcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICAgIC8vIGVuc3VyZSBkaXIgZXhpc3RzXG4gICAgICBhd2FpdCBlbnN1cmVEaXIocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSk7XG4gICAgICAvLyBjcmVhdGUgZmlsZVxuICAgICAgYXdhaXQgRGVuby53cml0ZUZpbGUoZmlsZVBhdGgsIG5ldyBVaW50OEFycmF5KCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG4vKipcbiAqIEVuc3VyZXMgdGhhdCB0aGUgZmlsZSBleGlzdHMuXG4gKiBJZiB0aGUgZmlsZSB0aGF0IGlzIHJlcXVlc3RlZCB0byBiZSBjcmVhdGVkIGlzIGluIGRpcmVjdG9yaWVzIHRoYXQgZG8gbm90XG4gKiBleGlzdCxcbiAqIHRoZXNlIGRpcmVjdG9yaWVzIGFyZSBjcmVhdGVkLiBJZiB0aGUgZmlsZSBhbHJlYWR5IGV4aXN0cyxcbiAqIGl0IGlzIE5PVCBNT0RJRklFRC5cbiAqIFJlcXVpcmVzIHRoZSBgLS1hbGxvdy1yZWFkYCBhbmQgYC0tYWxsb3ctd3JpdGVgIGZsYWcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVGaWxlU3luYyhmaWxlUGF0aDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgLy8gaWYgZmlsZSBleGlzdHNcbiAgICBjb25zdCBzdGF0ID0gRGVuby5sc3RhdFN5bmMoZmlsZVBhdGgpO1xuICAgIGlmICghc3RhdC5pc0ZpbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuc3VyZSBwYXRoIGV4aXN0cywgZXhwZWN0ZWQgJ2ZpbGUnLCBnb3QgJyR7Z2V0RmlsZUluZm9UeXBlKHN0YXQpfSdgLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIGlmIGZpbGUgbm90IGV4aXN0c1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgLy8gZW5zdXJlIGRpciBleGlzdHNcbiAgICAgIGVuc3VyZURpclN5bmMocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSk7XG4gICAgICAvLyBjcmVhdGUgZmlsZVxuICAgICAgRGVuby53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBuZXcgVWludDhBcnJheSgpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFlBQVksSUFBSSxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZDLFNBQVMsU0FBUyxFQUFFLGFBQWEsUUFBUSxpQkFBaUIsQ0FBQztBQUMzRCxTQUFTLGVBQWUsUUFBUSxZQUFZLENBQUM7QUFFN0M7Ozs7Ozs7Q0FPQyxHQUNELE9BQU8sZUFBZSxVQUFVLENBQUMsUUFBZ0IsRUFBRTtJQUNqRCxJQUFJO1FBQ0YsaUJBQWlCO1FBQ2pCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQUFBQztRQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUNiLENBQUMsMENBQTBDLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUN0RSxDQUFDO1FBQ0osQ0FBQztJQUNILEVBQUUsT0FBTyxHQUFHLEVBQUU7UUFDWixxQkFBcUI7UUFDckIsSUFBSSxHQUFHLFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDdkMsb0JBQW9CO1lBQ3BCLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN4QyxjQUFjO1lBQ2QsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakQsT0FBTztRQUNULENBQUM7UUFFRCxNQUFNLEdBQUcsQ0FBQztJQUNaLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Q0FPQyxHQUNELE9BQU8sU0FBUyxjQUFjLENBQUMsUUFBZ0IsRUFBRTtJQUMvQyxJQUFJO1FBQ0YsaUJBQWlCO1FBQ2pCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEFBQUM7UUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FDYixDQUFDLDBDQUEwQyxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDdEUsQ0FBQztRQUNKLENBQUM7SUFDSCxFQUFFLE9BQU8sR0FBRyxFQUFFO1FBQ1oscUJBQXFCO1FBQ3JCLElBQUksR0FBRyxZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQ3ZDLG9CQUFvQjtZQUNwQixhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLGNBQWM7WUFDZCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDL0MsT0FBTztRQUNULENBQUM7UUFDRCxNQUFNLEdBQUcsQ0FBQztJQUNaLENBQUM7QUFDSCxDQUFDIn0=