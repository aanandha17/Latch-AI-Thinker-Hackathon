import { z } from "zod";

const identity = z.string().min(1).max(80);
const sourceIds = z.array(identity).min(1).max(50);
export const messageSchema = z.object({
  id: identity,
  threadId: identity,
  author: z.string().trim().min(1).max(100),
  timestamp: z.iso.datetime({ offset: true }),
  text: z.string().min(1).max(2000),
}).strict();

export const extractionRequestSchema = z.object({
  threadId: identity,
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  referenceDate: z.iso.datetime({ offset: true }),
  timezone: z.string().min(1).max(100).refine((value) => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; }
    catch { return false; }
  }, "Use a valid IANA timezone."),
  messages: z.array(messageSchema).max(50),
}).strict().superRefine((input, ctx) => {
  const ids = new Set<string>();
  input.messages.forEach((message, index) => {
    if (message.threadId !== input.threadId || ids.has(message.id)) {
      ctx.addIssue({ code: "custom", path: ["messages", index], message: "Messages must have unique IDs and belong to the selected thread." });
    }
    ids.add(message.id);
  });
});

// Required nullable fields work with the installed Zod 4 / Agents structured output API.
export const commitmentSchema = z.object({
  id: z.string().min(1).max(20000),
  title: z.string().trim().min(1).max(300),
  owner: z.string().trim().min(1).max(100).nullable(),
  dueText: z.string().min(1).max(2000).nullable(),
  dueAt: z.iso.datetime({ offset: true }).nullable(),
  sourceMessageIds: sourceIds,
  evidenceQuote: z.string().min(1).max(2000),
  confidence: z.enum(["high", "medium", "low"]),
  needsReview: z.boolean(),
}).strict();
export const extractionSchema = z.object({
  threadId: identity,
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  commitments: z.array(commitmentSchema).max(100),
  suggestions: z.array(z.object({
    id: z.string().min(1).max(20000),
    text: z.string().min(1).max(2000),
    sourceMessageIds: sourceIds,
    reason: z.string().min(1).max(2000),
  }).strict()).max(100),
  dependencies: z.array(z.object({
    prerequisiteId: z.string().min(1).max(20000),
    dependentId: z.string().min(1).max(20000),
    sourceMessageIds: sourceIds,
    evidenceQuote: z.string().min(1).max(2000),
  }).strict()).max(200),
  warnings: z.array(z.string().min(1).max(2000)).max(100),
}).strict();

export type LatchThread = z.infer<typeof extractionRequestSchema>;
export type LatchMessage = z.infer<typeof messageSchema>;
export type LatchExtraction = z.infer<typeof extractionSchema>;
export type LatchCommitment = z.infer<typeof commitmentSchema>;
export function emptyExtraction(thread: LatchThread): LatchExtraction {
  return { threadId: thread.threadId, revision: thread.revision, commitments: [], suggestions: [], dependencies: [], warnings: [] };
}
