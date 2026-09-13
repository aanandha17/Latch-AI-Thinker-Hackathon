import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LATCH — Commitment Graph",
  description:
    "Turn team conversation into reviewable commitments, evidence, and dependencies.",
};

function modelIsConfigured() {
  const provider = (process.env.MODEL_PROVIDER || "openai")
    .trim()
    .toLowerCase();
  const keyNames: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_API_KEY",
  };
  const keyName = keyNames[provider];
  const value = keyName ? process.env[keyName] : undefined;
  return Boolean(value && value !== "stub-replace-me");
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers modelConfigured={modelIsConfigured()}>{children}</Providers>
      </body>
    </html>
  );
}
