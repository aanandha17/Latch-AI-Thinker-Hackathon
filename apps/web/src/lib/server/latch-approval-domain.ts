import { createHash } from "node:crypto";
import { latchDraftSchema, readLatchMetadata, type LatchSavedTask } from "../latch-approval";
import { assignStableIds, validateExtraction } from "../latch-validate";
import type { WorkplaceTask } from "../followup-types";
import { FollowupError } from "./followup-error";
export const latchHash = (value: string) => createHash("sha256").update(value).digest("hex");
export const threadMarker = (threadId: string) => "latch-thread:" + latchHash(threadId);
export function prepareLatchDraft(input: unknown) {
  const draft = latchDraftSchema.parse(input);
  const original = validateExtraction(draft.extraction, draft.thread);
  const stable = assignStableIds(original, draft.thread);
  // Reject arbitrary client IDs even when their evidence is valid.
  if (original.commitments.some((item, i) => item.id !== stable.commitments[i].id)) throw new FollowupError("Refresh extraction before preparing this task.");
  const detected = stable.commitments.find(item => item.id === draft.commitmentId);
  if (!detected) throw new FollowupError("Select an extracted commitment. Suggestions cannot be approved.");
  const metadata = {
    version: 1 as const, threadId: draft.thread.threadId, revision: draft.thread.revision,
    timezone: draft.thread.timezone, commitmentId: detected.id, detected,
    reviewed: draft.reviewed,
    dependencies: stable.dependencies.filter(edge => edge.dependentId === detected.id || edge.prerequisiteId === detected.id),
  };
  const details = [
    "LATCH reviewed commitment — sample team conversation",
    "Owner (metadata): " + (draft.reviewed.owner ?? "Unassigned"),
    "Deadline wording: " + (draft.reviewed.dueText ?? "No deadline stated"),
    "Deadline boundary: " + (draft.reviewed.dueAt ?? "No clock deadline") + " · " + draft.thread.timezone,
    "Source messages: " + detected.sourceMessageIds.join(", "),
    "Exact evidence: " + detected.evidenceQuote,
    "Dependencies: " + metadata.dependencies.map(edge => edge.prerequisiteId + " -> " + edge.dependentId).join("; "),
    "Reviewed fields may differ from detection. No native owner assignment or task scheduling is implied.",
    threadMarker(draft.thread.threadId),
    "LATCH-METADATA:" + JSON.stringify(metadata),
  ].join("\n");
  if (details.length > 16000) throw new FollowupError("This commitment has too much evidence for the demo approval record. Narrow the conversation and extract again.");
  return { threadId: draft.thread.threadId, revision: draft.thread.revision, commitmentId: detected.id, title: draft.reviewed.title, details };
}
export function savedLatchTask(task: WorkplaceTask, threadId: string): LatchSavedTask {
  const metadata = readLatchMetadata(task.description);
  if (!metadata || metadata.threadId !== threadId || metadata.commitmentId !== metadata.detected.id || task.title !== metadata.reviewed.title ||
      !task.description.split("\n").includes(threadMarker(threadId))) {
    throw new FollowupError("Provider record has invalid LATCH metadata or belongs to another thread.");
  }
  return { ...task, metadata };
}
