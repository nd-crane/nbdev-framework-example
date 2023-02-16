// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/**
 * Higher level API for dealing with OS signals.
 *
 * @module
 */ import { MuxAsyncIterator } from "../async/mux_async_iterator.ts";
import { deferred } from "../async/deferred.ts";
/**
 * Generates an AsyncIterable which can be awaited on for one or more signals.
 * `dispose()` can be called when you are finished waiting on the events.
 *
 * Example:
 *
 * ```ts
 *       import { signal } from "./mod.ts";
 *
 *       const sig = signal("SIGUSR1", "SIGINT");
 *       setTimeout(() => {}, 5000); // Prevents exiting immediately
 *
 *       for await (const _ of sig) {
 *         console.log("interrupt or usr1 signal received");
 *       }
 *
 *       // At some other point in your code when finished listening:
 *       sig.dispose();
 * ```
 *
 * @param signals - one or more signals to listen to
 */ export function signal(...signals) {
    const mux = new MuxAsyncIterator();
    if (signals.length < 1) {
        throw new Error("No signals are given. You need to specify at least one signal to create a signal stream.");
    }
    const streams = signals.map(createSignalStream);
    streams.forEach((stream)=>{
        mux.add(stream);
    });
    // Create dispose method for the muxer of signal streams.
    const dispose = ()=>{
        streams.forEach((stream)=>{
            stream.dispose();
        });
    };
    return Object.assign(mux, {
        dispose
    });
}
function createSignalStream(signal) {
    let streamContinues = deferred();
    const handler = ()=>{
        streamContinues.resolve(true);
    };
    Deno.addSignalListener(signal, handler);
    const gen = async function*() {
        while(await streamContinues){
            streamContinues = deferred();
            yield undefined;
        }
    };
    return Object.assign(gen(), {
        dispose () {
            streamContinues.resolve(false);
            Deno.removeSignalListener(signal, handler);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL3NpZ25hbC9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8qKlxuICogSGlnaGVyIGxldmVsIEFQSSBmb3IgZGVhbGluZyB3aXRoIE9TIHNpZ25hbHMuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB7IE11eEFzeW5jSXRlcmF0b3IgfSBmcm9tIFwiLi4vYXN5bmMvbXV4X2FzeW5jX2l0ZXJhdG9yLnRzXCI7XG5pbXBvcnQgeyBkZWZlcnJlZCB9IGZyb20gXCIuLi9hc3luYy9kZWZlcnJlZC50c1wiO1xuXG5leHBvcnQgdHlwZSBEaXNwb3NhYmxlID0geyBkaXNwb3NlOiAoKSA9PiB2b2lkIH07XG5cbi8qKlxuICogR2VuZXJhdGVzIGFuIEFzeW5jSXRlcmFibGUgd2hpY2ggY2FuIGJlIGF3YWl0ZWQgb24gZm9yIG9uZSBvciBtb3JlIHNpZ25hbHMuXG4gKiBgZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHdoZW4geW91IGFyZSBmaW5pc2hlZCB3YWl0aW5nIG9uIHRoZSBldmVudHMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogICAgICAgaW1wb3J0IHsgc2lnbmFsIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKlxuICogICAgICAgY29uc3Qgc2lnID0gc2lnbmFsKFwiU0lHVVNSMVwiLCBcIlNJR0lOVFwiKTtcbiAqICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge30sIDUwMDApOyAvLyBQcmV2ZW50cyBleGl0aW5nIGltbWVkaWF0ZWx5XG4gKlxuICogICAgICAgZm9yIGF3YWl0IChjb25zdCBfIG9mIHNpZykge1xuICogICAgICAgICBjb25zb2xlLmxvZyhcImludGVycnVwdCBvciB1c3IxIHNpZ25hbCByZWNlaXZlZFwiKTtcbiAqICAgICAgIH1cbiAqXG4gKiAgICAgICAvLyBBdCBzb21lIG90aGVyIHBvaW50IGluIHlvdXIgY29kZSB3aGVuIGZpbmlzaGVkIGxpc3RlbmluZzpcbiAqICAgICAgIHNpZy5kaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gc2lnbmFscyAtIG9uZSBvciBtb3JlIHNpZ25hbHMgdG8gbGlzdGVuIHRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaWduYWwoXG4gIC4uLnNpZ25hbHM6IFtEZW5vLlNpZ25hbCwgLi4uRGVuby5TaWduYWxbXV1cbik6IEFzeW5jSXRlcmFibGU8dm9pZD4gJiBEaXNwb3NhYmxlIHtcbiAgY29uc3QgbXV4ID0gbmV3IE11eEFzeW5jSXRlcmF0b3I8dm9pZD4oKTtcblxuICBpZiAoc2lnbmFscy5sZW5ndGggPCAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJObyBzaWduYWxzIGFyZSBnaXZlbi4gWW91IG5lZWQgdG8gc3BlY2lmeSBhdCBsZWFzdCBvbmUgc2lnbmFsIHRvIGNyZWF0ZSBhIHNpZ25hbCBzdHJlYW0uXCIsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHN0cmVhbXMgPSBzaWduYWxzLm1hcChjcmVhdGVTaWduYWxTdHJlYW0pO1xuXG4gIHN0cmVhbXMuZm9yRWFjaCgoc3RyZWFtKSA9PiB7XG4gICAgbXV4LmFkZChzdHJlYW0pO1xuICB9KTtcblxuICAvLyBDcmVhdGUgZGlzcG9zZSBtZXRob2QgZm9yIHRoZSBtdXhlciBvZiBzaWduYWwgc3RyZWFtcy5cbiAgY29uc3QgZGlzcG9zZSA9ICgpID0+IHtcbiAgICBzdHJlYW1zLmZvckVhY2goKHN0cmVhbSkgPT4ge1xuICAgICAgc3RyZWFtLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihtdXgsIHsgZGlzcG9zZSB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2lnbmFsU3RyZWFtKFxuICBzaWduYWw6IERlbm8uU2lnbmFsLFxuKTogQXN5bmNJdGVyYWJsZTx2b2lkPiAmIERpc3Bvc2FibGUge1xuICBsZXQgc3RyZWFtQ29udGludWVzID0gZGVmZXJyZWQ8Ym9vbGVhbj4oKTtcbiAgY29uc3QgaGFuZGxlciA9ICgpID0+IHtcbiAgICBzdHJlYW1Db250aW51ZXMucmVzb2x2ZSh0cnVlKTtcbiAgfTtcbiAgRGVuby5hZGRTaWduYWxMaXN0ZW5lcihzaWduYWwsIGhhbmRsZXIpO1xuXG4gIGNvbnN0IGdlbiA9IGFzeW5jIGZ1bmN0aW9uKiAoKSB7XG4gICAgd2hpbGUgKGF3YWl0IHN0cmVhbUNvbnRpbnVlcykge1xuICAgICAgc3RyZWFtQ29udGludWVzID0gZGVmZXJyZWQ8Ym9vbGVhbj4oKTtcbiAgICAgIHlpZWxkIHVuZGVmaW5lZDtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZ2VuKCksIHtcbiAgICBkaXNwb3NlKCkge1xuICAgICAgc3RyZWFtQ29udGludWVzLnJlc29sdmUoZmFsc2UpO1xuICAgICAgRGVuby5yZW1vdmVTaWduYWxMaXN0ZW5lcihzaWduYWwsIGhhbmRsZXIpO1xuICAgIH0sXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRTs7OztDQUlDLEdBRUQsU0FBUyxnQkFBZ0IsUUFBUSxnQ0FBZ0MsQ0FBQztBQUNsRSxTQUFTLFFBQVEsUUFBUSxzQkFBc0IsQ0FBQztBQUloRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUJDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sQ0FDcEIsR0FBRyxPQUFPLEFBQWlDLEVBQ1Q7SUFDbEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxnQkFBZ0IsRUFBUSxBQUFDO0lBRXpDLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FDYiwwRkFBMEYsQ0FDM0YsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEFBQUM7SUFFaEQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sR0FBSztRQUMxQixHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxDQUFDO0lBRUgseURBQXlEO0lBQ3pELE1BQU0sT0FBTyxHQUFHLElBQU07UUFDcEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sR0FBSztZQUMxQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLEFBQUM7SUFFRixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO1FBQUUsT0FBTztLQUFFLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDekIsTUFBbUIsRUFDZTtJQUNsQyxJQUFJLGVBQWUsR0FBRyxRQUFRLEVBQVcsQUFBQztJQUMxQyxNQUFNLE9BQU8sR0FBRyxJQUFNO1FBQ3BCLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQyxBQUFDO0lBQ0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUV4QyxNQUFNLEdBQUcsR0FBRyxrQkFBbUI7UUFDN0IsTUFBTyxNQUFNLGVBQWUsQ0FBRTtZQUM1QixlQUFlLEdBQUcsUUFBUSxFQUFXLENBQUM7WUFDdEMsTUFBTSxTQUFTLENBQUM7UUFDbEIsQ0FBQztJQUNILENBQUMsQUFBQztJQUVGLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUMxQixPQUFPLElBQUc7WUFDUixlQUFlLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUMifQ==