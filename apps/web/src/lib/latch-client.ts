import {
  latchExtractionSchema,
  type LatchExtraction,
  type LatchThread,
} from "./latch-schema";

export async function extractCurrentThread(
  thread: LatchThread,
  signal?: AbortSignal,
): Promise<LatchExtraction> {
  const response = await fetch("/api/latch/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(thread),
    signal,
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error || `Extraction failed: HTTP ${response.status}`);
  return latchExtractionSchema.parse(payload);
}
