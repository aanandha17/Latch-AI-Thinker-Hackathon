import { z } from "zod";
import { commitmentSchema, extractionSchema, extractionRequestSchema } from "./latch-schema";
export const reviewedFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  owner: z.string().trim().min(1).max(100).nullable(),
  dueText: z.string().trim().min(1).max(300).nullable(),
  dueAt: z.iso.datetime({ offset: true }).nullable(),
}).strict().refine(value => value.dueAt === null || value.dueText !== null, "A clock deadline needs deadline wording.");
export const latchDraftSchema = z.object({
  thread: extractionRequestSchema,
  extraction: extractionSchema,
  commitmentId: z.string().min(1).max(20000),
  reviewed: reviewedFieldsSchema,
}).strict();
export const latchMetadataSchema = z.object({
  version: z.literal(1),
  threadId: z.string().min(1).max(80),
  revision: z.number().int().positive(),
  timezone: z.string(),
  commitmentId: z.string().min(1),
  detected: commitmentSchema,
  reviewed: reviewedFieldsSchema,
  dependencies: extractionSchema.shape.dependencies,
}).strict();
export type LatchDraft = z.infer<typeof latchDraftSchema>;
export type ReviewedFields = z.infer<typeof reviewedFieldsSchema>;
export type LatchMetadata = z.infer<typeof latchMetadataSchema>;
export type LatchProposal = {
  id: string; threadId: string; commitmentId: string; revision: number;
  title: string; description: string; workspaceId: string; identityName: string; expiresAt: number;
};
export type LatchSavedTask = {
  id: string; title: string; description: string; url: string | null; metadata: LatchMetadata;
};
export type LatchWorkplaceStatus =
  | { status: "unconfigured"; message: string }
  | { status: "connected"; workspaceId: string; identityName: string; tasks: LatchSavedTask[] };
export function readLatchMetadata(description: string): LatchMetadata | null {
  const line = description.split("\n").findLast(line => line.startsWith("LATCH-METADATA:"));
  if (!line) return null;
  try {
    const result = latchMetadataSchema.safeParse(JSON.parse(line.slice("LATCH-METADATA:".length)));
    return result.success ? result.data : null;
  } catch { return null; }
}
