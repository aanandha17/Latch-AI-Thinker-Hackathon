import { extractionRequestSchema, type LatchThread, type LatchExtraction } from "./latch-schema";
import { validateExtraction } from "./latch-validate";

export type ExtractionState = { status: "idle" | "loading" | "success" | "error"; result: LatchExtraction | null; error: string | null; fingerprint: string | null };
export type ExtractionOutcome = { status: "success"; result: LatchExtraction } | { status: "error"; message: string };
export const threadFingerprint = (thread: LatchThread) => JSON.stringify(thread);
export const initialExtractionState: ExtractionState = { status: "idle", result: null, error: null, fingerprint: null };

export function createExtractionController(getThread: () => LatchThread, publish: (state: ExtractionState) => void, fetcher: typeof fetch = fetch) {
  let pending: Promise<ExtractionOutcome> | null = null;
  let controller: AbortController | null = null;
  let disposed = false;
  const emit = (state: ExtractionState) => { if (!disposed) publish(state); };
  const extractCurrentThread = (): Promise<ExtractionOutcome> => {
    if (pending) return pending;
    if (disposed) return Promise.resolve({ status: "error", message: "The workspace is closed." });
    const snapshot = structuredClone(getThread());
    const fingerprint = threadFingerprint(snapshot);
    controller = new AbortController();
    const signal = controller.signal;
    emit({ status: "loading", result: null, error: null, fingerprint });
    pending = Promise.resolve().then(async (): Promise<ExtractionOutcome> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const input = extractionRequestSchema.parse(snapshot);
        const { response, value } = await Promise.race([
          fetcher("/api/latch/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal }).then(async response => ({ response, value: response.ok ? await response.json() as unknown : null })),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { controller?.abort(); reject(new Error("timeout")); }, 35000); }),
        ]);
        if (threadFingerprint(getThread()) !== fingerprint) throw new Error("stale");
        if (!response.ok) {
          const message = response.status === 503 ? "Set MODEL and OPENAI_API_KEY in root .env and restart the app."
            : response.status === 504 ? "Extraction timed out. Retry the current thread."
            : response.status === 403 ? "Open this app on its loopback address and retry."
            : response.status === 400 || response.status === 413 ? "Check the thread: at most 50 messages, 2,000 characters each, with valid IDs and timestamps."
            : "The model could not produce a valid extraction. Retry the current thread.";
          emit({ status: "error", result: null, error: message, fingerprint });
          return { status: "error", message };
        }
        if (threadFingerprint(getThread()) !== fingerprint) throw new Error("stale");
        const result = validateExtraction(value, input);
        emit({ status: "success", result, error: null, fingerprint });
        return { status: "success", result };
      } catch {
        const message = threadFingerprint(getThread()) !== fingerprint
          ? "The thread changed during extraction. Catch commitments again for the current revision."
          : "Extraction failed, timed out, or returned invalid evidence. Retry the current thread.";
        emit({ status: "error", result: null, error: message, fingerprint });
        return { status: "error", message };
      } finally {
        clearTimeout(timer); pending = null; controller = null;
      }
    });
    return pending;
  };
  return { extractCurrentThread, dispose() { disposed = true; controller?.abort(); } };
}
