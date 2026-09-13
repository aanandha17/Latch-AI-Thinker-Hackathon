import { z } from "zod";
import {
  extractLatchThread,
  LatchExtractionConfigurationError,
} from "./latch-extract";
import { LatchValidationError } from "../latch-validate";

const MAX_BODY_BYTES = 100_000;

function trustedRequest(request: Request) {
  const url = new URL(request.url);
  const expectedOrigin = new URL(url);
  expectedOrigin.host = request.headers.get("host") || url.host;
  if (!["localhost", "127.0.0.1", "[::1]"].includes(expectedOrigin.hostname))
    return false;
  const origin = request.headers.get("origin");
  return !origin || origin === expectedOrigin.origin;
}

export function createLatchExtractionHandler(
  extract: typeof extractLatchThread = extractLatchThread,
) {
  return async function handle(request: Request) {
    if (!trustedRequest(request))
      return Response.json({ error: "Untrusted request origin." }, { status: 403 });
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return Response.json({ error: "Expected application/json." }, { status: 415 });

    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES)
        return Response.json({ error: "Conversation payload is too large." }, { status: 413 });
      const result = await extract(JSON.parse(text));
      return Response.json(result, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      if (error instanceof SyntaxError)
        return Response.json({ error: "Invalid JSON body." }, { status: 400 });
      if (error instanceof z.ZodError)
        return Response.json(
          { error: "Conversation or extraction data did not match the LATCH schema." },
          { status: 400 },
        );
      if (error instanceof LatchValidationError)
        return Response.json({ error: error.message }, { status: 422 });
      if (error instanceof LatchExtractionConfigurationError)
        return Response.json({ error: error.message }, { status: 503 });
      console.warn("LATCH extraction failed with a provider or runtime error.");
      return Response.json(
        { error: "The extraction service is unavailable. No task was created." },
        { status: 502 },
      );
    }
  };
}
