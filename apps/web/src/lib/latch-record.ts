import { z } from "zod";
import {
  reviewedCommitmentSchema,
  type LatchThread,
  type ReviewedCommitment,
} from "./latch-schema";

const META_BEGIN = "LATCH_META_BEGIN v1";
const META_END = "LATCH_META_END";

export const latchRecordMetadataSchema = z
  .object({
    version: z.literal(1),
    threadId: z.string().trim().min(1).max(120),
    threadDate: z.iso.date(),
    timezone: z.string().trim().min(1).max(120),
    commitmentId: z.string().trim().min(1).max(120),
    owner: z.string().trim().min(1).max(120).nullable(),
    dueText: z.string().trim().min(1).max(200).nullable(),
    dueAt: z.iso.datetime({ offset: true }).nullable(),
    sourceMessageIds: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    evidenceQuote: z.string().trim().min(1).max(1000),
    prerequisiteIds: z.array(z.string().trim().min(1).max(120)).max(20),
  })
  .strict();

export type LatchRecordMetadata = z.infer<typeof latchRecordMetadataSchema>;

export function threadMarker(threadId: string) {
  return `latch:thread:${threadId}`;
}

export function commitmentMarker(commitmentId: string) {
  return `latch:commitment:${commitmentId}`;
}

export function validateReviewedCommitment(
  thread: LatchThread,
  value: unknown,
): ReviewedCommitment {
  const commitment = reviewedCommitmentSchema.parse(value);
  const messages = new Map(thread.messages.map((message) => [message.id, message]));
  if (new Set(commitment.sourceMessageIds).size !== commitment.sourceMessageIds.length)
    throw new Error("Source message IDs must be unique.");
  const sources = commitment.sourceMessageIds.map((id) => {
    const message = messages.get(id);
    if (!message) throw new Error(`Unknown evidence message ${id}.`);
    return message;
  });
  if (!sources.some((message) => message.text.includes(commitment.evidenceQuote)))
    throw new Error("Evidence must be an exact quote from a cited message.");
  if (commitment.dueAt && !commitment.dueText)
    throw new Error("A normalized deadline requires evidence-backed due text.");
  if (commitment.prerequisiteIds.includes(commitment.id))
    throw new Error("A commitment cannot depend on itself.");
  if (new Set(commitment.prerequisiteIds).size !== commitment.prerequisiteIds.length)
    throw new Error("Prerequisite IDs must be unique.");
  return commitment;
}

export function createLatchRecord(
  thread: LatchThread,
  commitmentValue: unknown,
  actionKey: string,
) {
  const commitment = validateReviewedCommitment(thread, commitmentValue);
  const metadata: LatchRecordMetadata = latchRecordMetadataSchema.parse({
    version: 1,
    threadId: thread.threadId,
    threadDate: thread.date,
    timezone: thread.timezone,
    commitmentId: commitment.id,
    owner: commitment.owner,
    dueText: commitment.dueText,
    dueAt: commitment.dueAt,
    sourceMessageIds: commitment.sourceMessageIds,
    evidenceQuote: commitment.evidenceQuote,
    prerequisiteIds: commitment.prerequisiteIds,
  });
  const description = [
    `Owner: ${metadata.owner ?? "Needs review"}`,
    `Due: ${metadata.dueText ?? "Not stated"}`,
    metadata.dueAt ? `Normalized due: ${metadata.dueAt}` : null,
    `Evidence: “${metadata.evidenceQuote}”`,
    `Source messages: ${metadata.sourceMessageIds.join(", ")}`,
    `Prerequisites: ${metadata.prerequisiteIds.join(", ") || "None"}`,
    "",
    META_BEGIN,
    JSON.stringify(metadata),
    META_END,
    threadMarker(thread.threadId),
    commitmentMarker(commitment.id),
    `followup:${actionKey}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
  return { commitment, metadata, title: commitment.title, description };
}

export function parseLatchRecord(description: string) {
  const lines = description.split("\n");
  const begin = lines.indexOf(META_BEGIN);
  const end = lines.indexOf(META_END);
  if (begin < 0 || end !== begin + 2) return null;
  try {
    return latchRecordMetadataSchema.parse(JSON.parse(lines[begin + 1]));
  } catch {
    return null;
  }
}
