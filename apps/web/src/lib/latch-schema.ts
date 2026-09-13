import { z } from "zod";

export const latchMessageSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    author: z.string().trim().min(1).max(120),
    time: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1).max(2000),
    source: z.enum(["sample", "local"]),
  })
  .strict();

export const latchThreadSchema = z
  .object({
    threadId: z.string().trim().min(1).max(120),
    date: z.iso.date(),
    timezone: z.string().trim().min(1).max(120),
    referenceTime: z.iso.datetime({ offset: true }),
    revision: z.number().int().min(1),
    messages: z.array(latchMessageSchema).min(1).max(50),
  })
  .strict();

export const commitmentSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(200),
    owner: z.string().trim().min(1).max(120).nullable(),
    dueText: z.string().trim().min(1).max(200).nullable(),
    dueAt: z.iso.datetime({ offset: true }).nullable(),
    sourceMessageIds: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    evidenceQuote: z.string().trim().min(1).max(1000),
    confidence: z.enum(["high", "medium", "low"]),
    needsReview: z.boolean(),
  })
  .strict();

export const suggestionSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    text: z.string().trim().min(1).max(500),
    sourceMessageIds: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    evidenceQuote: z.string().trim().min(1).max(1000),
  })
  .strict();

export const dependencySchema = z
  .object({
    prerequisiteId: z.string().trim().min(1).max(120),
    dependentId: z.string().trim().min(1).max(120),
    sourceMessageIds: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    evidenceQuote: z.string().trim().min(1).max(1000),
  })
  .strict();

export const latchExtractionSchema = z
  .object({
    commitments: z.array(commitmentSchema).max(50),
    suggestions: z.array(suggestionSchema).max(50),
    dependencies: z.array(dependencySchema).max(100),
    warnings: z.array(z.string().trim().min(1).max(500)).max(50),
  })
  .strict();

export const reviewedCommitmentSchema = commitmentSchema.extend({
  prerequisiteIds: z.array(z.string().trim().min(1).max(120)).max(20),
});

export type LatchThread = z.infer<typeof latchThreadSchema>;
export type Commitment = z.infer<typeof commitmentSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type Dependency = z.infer<typeof dependencySchema>;
export type LatchExtraction = z.infer<typeof latchExtractionSchema>;
export type ReviewedCommitment = z.infer<typeof reviewedCommitmentSchema>;
