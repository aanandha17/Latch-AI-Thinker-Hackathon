import { Agent, run } from "@openai/agents";
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
  constructor() {
    super("Set a real OPENAI_API_KEY in the root .env file, then restart the web app.");
    this.name = "LatchExtractionConfigurationError";
  }
}

export async function runLatchExtractionAgent(thread: LatchThread) {
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "stub-replace-me"
  )
    throw new LatchExtractionConfigurationError();

  const agent = new Agent({
    name: "LATCH commitment extractor",
    model: process.env.LATCH_EXTRACTION_MODEL || "gpt-4o-mini",
    instructions: latchExtractionInstructions,
    outputType: latchExtractionSchema,
  });
  const result = await run(
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
    { maxTurns: 2, signal: AbortSignal.timeout(25_000) },
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
