import "server-only";
import { resolve } from "node:path";
import { createLatchApprovalHandler } from "@/lib/server/latch-approval-http";
import { configuredWorkplace } from "@/lib/server/workplace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = createLatchApprovalHandler({
  connect: () => process.env.AMBIGUOUS_API_KEY?.trim() && process.env.AMBIGUOUS_API_KEY !== "stub-replace-me" ? configuredWorkplace() : undefined,
  directory: resolve(process.env.LATCH_APPROVAL_DIR || ".data/latch-approvals"),
});
export const GET = handler;
export const POST = handler;
