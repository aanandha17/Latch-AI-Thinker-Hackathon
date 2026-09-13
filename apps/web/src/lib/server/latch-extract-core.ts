import { extractionRequestSchema, emptyExtraction, type LatchThread } from "../latch-schema";
import { assignStableIds, validateExtraction } from "../latch-validate";
export class ExtractionError extends Error {
  constructor(public code: "UNCONFIGURED" | "TIMEOUT" | "MODEL_FAILED", message: string) { super(message); }
}
export type ModelRunner = (thread: LatchThread, signal: AbortSignal) => Promise<unknown>;
export async function extractThread(raw: LatchThread, options: { signal?: AbortSignal; timeoutMs?: number; modelRunner: ModelRunner }) {
  const thread = extractionRequestSchema.parse(raw);
  if (thread.messages.length === 0) return emptyExtraction(thread);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener("abort", cancel, { once: true });
  if (options.signal?.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abortListener: (() => void) | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      abortListener = () => reject(new ExtractionError("TIMEOUT", "Extraction was interrupted. Retry the current thread."));
      controller.signal.addEventListener("abort", abortListener, { once: true });
      if (controller.signal.aborted) abortListener();
      timer = setTimeout(() => controller.abort(), Math.min(options.timeoutMs ?? 30000, 30000));
    });
    const output = await Promise.race([
      Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return options.modelRunner(thread, controller.signal);
      }),
      timeout,
    ]);
    // Missing/refused/malformed output always fails, never falls back to demo answers.
    return assignStableIds(validateExtraction(output, thread), thread);
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError("MODEL_FAILED", "Extraction failed or returned unsupported evidence. Check the server configuration and retry.");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
    if (abortListener) controller.signal.removeEventListener("abort", abortListener);
  }
}
