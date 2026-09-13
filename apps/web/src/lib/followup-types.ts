import type { LatchRecordMetadata } from "./latch-record";
import type { ReviewedCommitment } from "./latch-schema";

export type WorkplaceTask = {
  id: string;
  title: string;
  description: string;
  url: string | null;
  latch?: LatchRecordMetadata | null;
};
export type Proposal = {
  id: string;
  threadId: string;
  commitmentId: string;
  title: string;
  description: string;
  commitment: ReviewedCommitment;
  workspaceId: string;
  identityName: string;
  expiresAt: number;
};
export type WorkplaceStatus =
  | { status: "unconfigured"; message: string }
  | {
      status: "connected";
      workspaceId: string;
      identityName: string;
      tasks: WorkplaceTask[];
    };
