"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LatchThread } from "./latch-schema";
import { createExtractionController, initialExtractionState, threadFingerprint } from "./latch-extraction-client";

export function useLatchExtraction(thread: LatchThread) {
  const current = useRef(thread);
  current.current = thread;
  const [state, setState] = useState(initialExtractionState);
  const instance = useRef<ReturnType<typeof createExtractionController> | null>(null);
  if (!instance.current) instance.current = createExtractionController(() => current.current, setState);
  useEffect(() => {
    // StrictMode cleanup/remount needs a fresh live controller.
    if (!instance.current) instance.current = createExtractionController(() => current.current, setState);
    return () => { instance.current?.dispose(); instance.current = null; };
  }, []);
  const extractCurrentThread = useCallback(() => instance.current!.extractCurrentThread(), []);
  const currentResult = state.fingerprint === threadFingerprint(thread) ? state.result : null;
  return {
    result: currentResult,
    loading: state.status === "loading",
    error: state.error,
    needsExtraction: state.fingerprint !== null && state.fingerprint !== threadFingerprint(thread),
    extractCurrentThread,
  };
}
export type LatchExtractionControls = ReturnType<typeof useLatchExtraction>;
