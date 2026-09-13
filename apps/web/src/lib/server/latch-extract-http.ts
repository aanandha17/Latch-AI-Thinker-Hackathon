import { extractionRequestSchema } from "../latch-schema";
import { ExtractionError } from "./latch-extract-core";
import type { LatchThread, LatchExtraction } from "../latch-schema";
type Extractor = (thread: LatchThread, options: { signal?: AbortSignal }) => Promise<LatchExtraction>;

const MAX_BODY_BYTES = 450000; // 50 x 2000 Unicode characters plus metadata, bounded while reading.
export function createExtractionHandler(extract: Extractor) {
  return async (request: Request) => {
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
    if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
    // Same trusted-loopback policy as followup-http.ts; Host accounts for Next URL normalization.
    let expected: URL;
    try {
      expected = new URL(request.url);
      expected.host = request.headers.get("host") || expected.host;
    } catch { return reply({ error: "Invalid origin." }, 403); }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname) ||
        request.headers.get("origin") !== expected.origin ||
        !request.headers.get("content-type")?.startsWith("application/json")) {
      return reply({ error: "Use extraction from this app's own page." }, 403);
    }
    let body: unknown;
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "A JSON thread is required." }, 400);
    let readTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const read = async () => {
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > MAX_BODY_BYTES) { void reader.cancel(); return null; }
          chunks.push(chunk.value);
        }
        const all = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
        return new TextDecoder("utf-8", { fatal: true }).decode(all);
      };
      const text = await Promise.race([read(), new Promise<never>((_, reject) => {
        readTimer = setTimeout(() => { void reader.cancel(); reject(new Error("timeout")); }, 5000);
      })]);
      if (text === null) return reply({ error: "Thread payload is too large." }, 413);
      body = JSON.parse(text);
    } catch { return reply({ error: "Invalid JSON or incomplete request body." }, 400); }
    finally { clearTimeout(readTimer); }
    const parsed = extractionRequestSchema.safeParse(body);
    if (!parsed.success) return reply({ error: "Invalid thread. Use a timezone, reference datetime, revision, unique message IDs, and at most 50 messages of 2,000 characters each." }, 400);
    try { return reply(await extract(parsed.data, { signal: request.signal })); }
    catch (error) {
      if (error instanceof ExtractionError) {
        return reply({ error: error.message, code: error.code }, error.code === "UNCONFIGURED" ? 503 : error.code === "TIMEOUT" ? 504 : 502);
      }
      return reply({ error: "Extraction could not be completed. Retry the current thread." }, 502);
    }
  };
}
