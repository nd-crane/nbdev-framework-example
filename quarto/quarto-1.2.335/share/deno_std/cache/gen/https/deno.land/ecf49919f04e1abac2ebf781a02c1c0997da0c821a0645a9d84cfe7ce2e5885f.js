// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { deferred } from "../async/deferred.ts";
/**
 * Merge multiple streams into a single one, not taking order into account.
 * If a stream ends before other ones, the other will continue adding data,
 * and the finished one will not add any more data.
 */ export function mergeReadableStreams(...streams) {
    const resolvePromises = streams.map(()=>deferred());
    return new ReadableStream({
        start (controller) {
            Promise.all(resolvePromises).then(()=>{
                controller.close();
            });
            try {
                for (const [key, stream] of Object.entries(streams)){
                    (async ()=>{
                        for await (const data of stream){
                            controller.enqueue(data);
                        }
                        resolvePromises[+key].resolve();
                    })();
                }
            } catch (e) {
                controller.error(e);
            }
        }
    });
}
/**
 * Merge multiple streams into a single one, taking order into account, and each stream
 * will wait for a chunk to enqueue before the next stream can append another chunk.
 * If a stream ends before other ones, the others will continue adding data in order,
 * and the finished one will not add any more data.
 */ export function zipReadableStreams(...streams) {
    const readers = streams.map((s)=>s.getReader());
    return new ReadableStream({
        async start (controller) {
            try {
                let resolved = 0;
                while(resolved != streams.length){
                    for (const [key, reader] of Object.entries(readers)){
                        const { value , done  } = await reader.read();
                        if (!done) {
                            controller.enqueue(value);
                        } else {
                            resolved++;
                            readers.splice(+key, 1);
                        }
                    }
                }
                controller.close();
            } catch (e) {
                controller.error(e);
            }
        }
    });
}
/**
 * Merge multiple streams into a single one, taking order into account, and each stream
 * will wait for a chunk to enqueue before the next stream can append another chunk.
 * If a stream ends before other ones, the others will be cancelled.
 */ export function earlyZipReadableStreams(...streams) {
    const readers = streams.map((s)=>s.getReader());
    return new ReadableStream({
        async start (controller) {
            try {
                loop: while(true){
                    for (const reader of readers){
                        const { value , done  } = await reader.read();
                        if (!done) {
                            controller.enqueue(value);
                        } else {
                            await Promise.all(readers.map((reader)=>reader.cancel()));
                            break loop;
                        }
                    }
                }
                controller.close();
            } catch (e) {
                controller.error(e);
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3N0cmVhbXMvbWVyZ2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgZGVmZXJyZWQgfSBmcm9tIFwiLi4vYXN5bmMvZGVmZXJyZWQudHNcIjtcblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBzdHJlYW1zIGludG8gYSBzaW5nbGUgb25lLCBub3QgdGFraW5nIG9yZGVyIGludG8gYWNjb3VudC5cbiAqIElmIGEgc3RyZWFtIGVuZHMgYmVmb3JlIG90aGVyIG9uZXMsIHRoZSBvdGhlciB3aWxsIGNvbnRpbnVlIGFkZGluZyBkYXRhLFxuICogYW5kIHRoZSBmaW5pc2hlZCBvbmUgd2lsbCBub3QgYWRkIGFueSBtb3JlIGRhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVJlYWRhYmxlU3RyZWFtczxUPihcbiAgLi4uc3RyZWFtczogUmVhZGFibGVTdHJlYW08VD5bXVxuKTogUmVhZGFibGVTdHJlYW08VD4ge1xuICBjb25zdCByZXNvbHZlUHJvbWlzZXMgPSBzdHJlYW1zLm1hcCgoKSA9PiBkZWZlcnJlZDx2b2lkPigpKTtcbiAgcmV0dXJuIG5ldyBSZWFkYWJsZVN0cmVhbTxUPih7XG4gICAgc3RhcnQoY29udHJvbGxlcikge1xuICAgICAgUHJvbWlzZS5hbGwocmVzb2x2ZVByb21pc2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHN0cmVhbV0gb2YgT2JqZWN0LmVudHJpZXMoc3RyZWFtcykpIHtcbiAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBkYXRhIG9mIHN0cmVhbSkge1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlUHJvbWlzZXNbK2tleV0ucmVzb2x2ZSgpO1xuICAgICAgICAgIH0pKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29udHJvbGxlci5lcnJvcihlKTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBzdHJlYW1zIGludG8gYSBzaW5nbGUgb25lLCB0YWtpbmcgb3JkZXIgaW50byBhY2NvdW50LCBhbmQgZWFjaCBzdHJlYW1cbiAqIHdpbGwgd2FpdCBmb3IgYSBjaHVuayB0byBlbnF1ZXVlIGJlZm9yZSB0aGUgbmV4dCBzdHJlYW0gY2FuIGFwcGVuZCBhbm90aGVyIGNodW5rLlxuICogSWYgYSBzdHJlYW0gZW5kcyBiZWZvcmUgb3RoZXIgb25lcywgdGhlIG90aGVycyB3aWxsIGNvbnRpbnVlIGFkZGluZyBkYXRhIGluIG9yZGVyLFxuICogYW5kIHRoZSBmaW5pc2hlZCBvbmUgd2lsbCBub3QgYWRkIGFueSBtb3JlIGRhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB6aXBSZWFkYWJsZVN0cmVhbXM8VD4oXG4gIC4uLnN0cmVhbXM6IFJlYWRhYmxlU3RyZWFtPFQ+W11cbik6IFJlYWRhYmxlU3RyZWFtPFQ+IHtcbiAgY29uc3QgcmVhZGVycyA9IHN0cmVhbXMubWFwKChzKSA9PiBzLmdldFJlYWRlcigpKTtcbiAgcmV0dXJuIG5ldyBSZWFkYWJsZVN0cmVhbTxUPih7XG4gICAgYXN5bmMgc3RhcnQoY29udHJvbGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHJlc29sdmVkID0gMDtcbiAgICAgICAgd2hpbGUgKHJlc29sdmVkICE9IHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBba2V5LCByZWFkZXJdIG9mIE9iamVjdC5lbnRyaWVzKHJlYWRlcnMpKSB7XG4gICAgICAgICAgICBjb25zdCB7IHZhbHVlLCBkb25lIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh2YWx1ZSEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZWQrKztcbiAgICAgICAgICAgICAgcmVhZGVycy5zcGxpY2UoK2tleSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29udHJvbGxlci5lcnJvcihlKTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBzdHJlYW1zIGludG8gYSBzaW5nbGUgb25lLCB0YWtpbmcgb3JkZXIgaW50byBhY2NvdW50LCBhbmQgZWFjaCBzdHJlYW1cbiAqIHdpbGwgd2FpdCBmb3IgYSBjaHVuayB0byBlbnF1ZXVlIGJlZm9yZSB0aGUgbmV4dCBzdHJlYW0gY2FuIGFwcGVuZCBhbm90aGVyIGNodW5rLlxuICogSWYgYSBzdHJlYW0gZW5kcyBiZWZvcmUgb3RoZXIgb25lcywgdGhlIG90aGVycyB3aWxsIGJlIGNhbmNlbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVhcmx5WmlwUmVhZGFibGVTdHJlYW1zPFQ+KFxuICAuLi5zdHJlYW1zOiBSZWFkYWJsZVN0cmVhbTxUPltdXG4pOiBSZWFkYWJsZVN0cmVhbTxUPiB7XG4gIGNvbnN0IHJlYWRlcnMgPSBzdHJlYW1zLm1hcCgocykgPT4gcy5nZXRSZWFkZXIoKSk7XG4gIHJldHVybiBuZXcgUmVhZGFibGVTdHJlYW08VD4oe1xuICAgIGFzeW5jIHN0YXJ0KGNvbnRyb2xsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxvb3A6XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgZm9yIChjb25zdCByZWFkZXIgb2YgcmVhZGVycykge1xuICAgICAgICAgICAgY29uc3QgeyB2YWx1ZSwgZG9uZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgICAgICAgIGlmICghZG9uZSkge1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUodmFsdWUhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHJlYWRlcnMubWFwKChyZWFkZXIpID0+IHJlYWRlci5jYW5jZWwoKSkpO1xuICAgICAgICAgICAgICBicmVhayBsb29wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuZXJyb3IoZSk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLFNBQVMsUUFBUSxRQUFRLHNCQUFzQixDQUFDO0FBRWhEOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsb0JBQW9CLENBQ2xDLEdBQUcsT0FBTyxBQUFxQixFQUNaO0lBQ25CLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBTSxRQUFRLEVBQVEsQ0FBQyxBQUFDO0lBQzVELE9BQU8sSUFBSSxjQUFjLENBQUk7UUFDM0IsS0FBSyxFQUFDLFVBQVUsRUFBRTtZQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFNO2dCQUN0QyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJO2dCQUNGLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFFO29CQUNuRCxDQUFDLFVBQVk7d0JBQ1gsV0FBVyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUU7NEJBQy9CLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzNCLENBQUM7d0JBQ0QsZUFBZSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2xDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ1AsQ0FBQztZQUNILEVBQUUsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7Ozs7Q0FLQyxHQUNELE9BQU8sU0FBUyxrQkFBa0IsQ0FDaEMsR0FBRyxPQUFPLEFBQXFCLEVBQ1o7SUFDbkIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQUFBQztJQUNsRCxPQUFPLElBQUksY0FBYyxDQUFJO1FBQzNCLE1BQU0sS0FBSyxFQUFDLFVBQVUsRUFBRTtZQUN0QixJQUFJO2dCQUNGLElBQUksUUFBUSxHQUFHLENBQUMsQUFBQztnQkFDakIsTUFBTyxRQUFRLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBRTtvQkFDakMsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUU7d0JBQ25ELE1BQU0sRUFBRSxLQUFLLENBQUEsRUFBRSxJQUFJLENBQUEsRUFBRSxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxBQUFDO3dCQUM1QyxJQUFJLENBQUMsSUFBSSxFQUFFOzRCQUNULFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFFLENBQUM7d0JBQzdCLE9BQU87NEJBQ0wsUUFBUSxFQUFFLENBQUM7NEJBQ1gsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDMUIsQ0FBQztvQkFDSCxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLEVBQUUsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLHVCQUF1QixDQUNyQyxHQUFHLE9BQU8sQUFBcUIsRUFDWjtJQUNuQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFLLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxBQUFDO0lBQ2xELE9BQU8sSUFBSSxjQUFjLENBQUk7UUFDM0IsTUFBTSxLQUFLLEVBQUMsVUFBVSxFQUFFO1lBQ3RCLElBQUk7Z0JBQ0YsSUFBSSxFQUNKLE1BQU8sSUFBSSxDQUFFO29CQUNYLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxDQUFFO3dCQUM1QixNQUFNLEVBQUUsS0FBSyxDQUFBLEVBQUUsSUFBSSxDQUFBLEVBQUUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQUFBQzt3QkFDNUMsSUFBSSxDQUFDLElBQUksRUFBRTs0QkFDVCxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBRSxDQUFDO3dCQUM3QixPQUFPOzRCQUNMLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFLLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQzVELE1BQU0sSUFBSSxDQUFDO3dCQUNiLENBQUM7b0JBQ0gsQ0FBQztnQkFDSCxDQUFDO2dCQUNELFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNyQixFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNILENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIn0=