"use client";
import { createContext, useEffect, useState } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
export const ChatConfiguration = createContext(false);
export function Providers({ children }: { children: React.ReactNode }) {
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/latch/config", { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(value => { if (!controller.signal.aborted) setConfigured(value?.chatConfigured === true); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  // Keep the same /v2 provider and multi-route runtime. The chat panel separately explains missing credentials.
  return <ChatConfiguration.Provider value={configured}>
    <CopilotKitProvider runtimeUrl="/api/copilotkit" useSingleEndpoint={false} enableInspector={false}>
      {children}
    </CopilotKitProvider>
  </ChatConfiguration.Provider>;
}
