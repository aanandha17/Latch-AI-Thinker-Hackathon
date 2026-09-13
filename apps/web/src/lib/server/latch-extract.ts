import { Agent, OpenAIProvider, Runner, type ModelProvider } from "@openai/agents";
import { latchExtractionInstructions } from "../latch-instructions";
import {
  latchExtractionSchema,
  latchThreadSchema,
  type LatchExtraction,
  type LatchThread,
} from "../latch-schema";
import { validateAndNormalizeExtraction } from "../latch-validate";

export type LatchExtractionRunner = (thread: LatchThread) => Promise<unknown>;

export class LatchExtractionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LatchExtractionConfigurationError";
  }
}

type LatchExtractionConfiguration = {
  model: string;
  modelProvider?: ModelProvider;
  provider: "openai" | "openrouter";
  tracingDisabled: boolean;
};

function hasKey(value: string | undefined) {
  return Boolean(value?.trim() && value !== "stub-replace-me");
}

export function resolveLatchExtractionConfiguration(
  env: Record<string, string | undefined> = process.env,
): LatchExtractionConfiguration {
  const selectedProvider = (
    env.MODEL_PROVIDER || (hasKey(env.OPENROUTER_API_KEY) ? "openrouter" : "openai")
  )
    .trim()
    .toLowerCase();

  if (selectedProvider === "openrouter") {
    if (!hasKey(env.OPENROUTER_API_KEY)) {
      throw new LatchExtractionConfigurationError(
        "Set OPENROUTER_API_KEY in the root .env file, then restart the web app.",
      );
    }
    return {
      model: (env.LATCH_EXTRACTION_MODEL || env.MODEL || "openrouter/free").trim(),
      modelProvider: new OpenAIProvider({
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        useResponses: false,
      }),
      provider: "openrouter",
      // OpenAI tracing is a separate paid service and is not needed for this
      // OpenRouter-backed extraction run.
      tracingDisabled: true,
    };
  }

  if (selectedProvider !== "openai") {
    throw new LatchExtractionConfigurationError(
      "LATCH extraction supports MODEL_PROVIDER=openrouter or openai.",
    );
  }
  if (!hasKey(env.OPENAI_API_KEY)) {
    throw new LatchExtractionConfigurationError(
      "Set OPENAI_API_KEY in the root .env file, or choose MODEL_PROVIDER=openrouter.",
    );
  }
  return {
    model: (env.LATCH_EXTRACTION_MODEL || "gpt-4o-mini").trim(),
    provider: "openai",
    tracingDisabled: false,
  };
}

export async function runLatchExtractionAgent(thread: LatchThread) {
  const configuration = resolveLatchExtractionConfiguration();

  const agent = new Agent({
    name: "LATCH commitment extractor",
    model: configuration.model,
    instructions: latchExtractionInstructions,
    outputType: latchExtractionSchema,
  });
  const runner = new Runner({
    ...(configuration.modelProvider
      ? { modelProvider: configuration.modelProvider }
      : {}),
    tracingDisabled: configuration.tracingDisabled,
  });
  const result = await runner.run(
    agent,
    JSON.stringify({
      context: {
        threadId: thread.threadId,
        date: thread.date,
        timezone: thread.timezone,
        referenceTime: thread.referenceTime,
      },
      quotedConversationData: thread.messages,
    }),
    {
      maxTurns: 2,
      signal: AbortSignal.timeout(25_000),
    },
  );
  if (!result.finalOutput) throw new Error("The extraction agent returned no output.");
  return result.finalOutput;
}

export async function extractLatchThread(
  threadValue: unknown,
  runner: LatchExtractionRunner = runLatchExtractionAgent,
): Promise<LatchExtraction> {
  const thread = latchThreadSchema.parse(threadValue);
  const output = await runner(thread);
  return validateAndNormalizeExtraction(thread, output);
}
