import { FollowupError } from "./followup-error";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { createLatchRecord, commitmentMarker, parseLatchRecord, threadMarker } from "../latch-record";
import { latchThreadSchema, reviewedCommitmentSchema } from "../latch-schema";
import type { Proposal, WorkplaceTask } from "../followup-types";
import type { Workplace } from "./workplace";

const draftSchema = z
  .object({
    thread: latchThreadSchema,
    commitment: reviewedCommitmentSchema,
  })
  .strict();
const storedSchema = z.object({
  id: z.uuid(),
  threadId: z.string(),
  commitmentId: z.string(),
  title: z.string(),
  description: z.string(),
  commitment: reviewedCommitmentSchema,
  workspaceId: z.string(),
  identityName: z.string(),
  identityId: z.string(),
  expiresAt: z.number(),
  sessionHash: z.string(),
  actionKey: z.string(),
});
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function fileExists(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}
const uncertain = () =>
  new FollowupError(
    "The write outcome is uncertain or still in progress. Refresh to reconcile from Ambiguous. This exact action will not be created again; inspect the workspace before starting a different task.",
  );

/** Files are approval/attempt metadata, never a source of saved task records. Keep this directory on persistent disk. */
export class FollowupService {
  constructor(
    private workplace: Workplace,
    private directory: string,
    private now = Date.now,
  ) {}
  private enrich(task: WorkplaceTask): WorkplaceTask {
    return { ...task, latch: parseLatchRecord(task.description) };
  }
  async list(threadId: string) {
    const tag = threadMarker(z.string().trim().min(1).max(120).parse(threadId));
    return (await this.workplace.list(tag))
      .filter((task) => task.description.split("\n").includes(tag))
      .map((task) => this.enrich(task));
  }
  async get(id: string) {
    return this.enrich(await this.workplace.get(id));
  }
  async propose(session: string, input: unknown): Promise<Proposal> {
    const draft = draftSchema.parse(input);
    const identity = await this.workplace.identity();
    const actionKey = hash(
      JSON.stringify([
        identity.workspaceId,
        draft.thread.threadId,
        draft.commitment,
      ]),
    );
    const record = createLatchRecord(draft.thread, draft.commitment, actionKey);
    const proposal = {
      id: randomUUID(),
      threadId: draft.thread.threadId,
      commitmentId: record.commitment.id,
      title: record.title,
      description: record.description,
      commitment: record.commitment,
      workspaceId: identity.workspaceId,
      identityName: identity.name,
      identityId: identity.id,
      expiresAt: this.now() + 10 * 60_000,
      sessionHash: hash(session),
      actionKey,
    };
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await writeFile(
      join(this.directory, `${proposal.id}.json`),
      JSON.stringify(proposal),
      { flag: "wx", mode: 0o600 },
    );
    const {
      sessionHash: _session,
      actionKey: _action,
      identityId: _identity,
      ...publicProposal
    } = proposal;
    return publicProposal;
  }
  private async proposal(session: string, id: string) {
    z.uuid().parse(id);
    const proposal = storedSchema.parse(
      JSON.parse(await readFile(join(this.directory, `${id}.json`), "utf8")),
    );
    if (proposal.sessionHash !== hash(session))
      throw new FollowupError(
        "This proposal belongs to another browser session.",
      );
    if (proposal.expiresAt <= this.now())
      throw new FollowupError(
        "This proposal expired. Prepare and review a new proposal.",
      );
    return proposal;
  }
  private async decide(id: string, decision: "approved" | "declined") {
    const path = join(this.directory, `${id}.decision`);
    try {
      await writeFile(path, decision, { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (!fileExists(error)) throw error;
    }
    const saved = await readFile(path, "utf8");
    if (saved !== decision)
      throw new FollowupError(`This proposal was already ${saved}.`);
  }
  async deny(session: string, id: string) {
    await this.proposal(session, id);
    await this.decide(id, "declined");
  }
  async approve(session: string, id: string): Promise<WorkplaceTask> {
    const proposal = await this.proposal(session, id);
    const identity = await this.workplace.identity();
    if (
      identity.workspaceId !== proposal.workspaceId ||
      identity.id !== proposal.identityId
    ) {
      throw new FollowupError(
        "The connected workspace or identity changed. Prepare a new proposal before approving.",
      );
    }
    // The decision is bound to immutable server-held fields and this browser session.
    await this.decide(id, "approved");
    const logicalMatch = async () => {
      const tag = commitmentMarker(proposal.commitmentId);
      const found = (await this.workplace.list(tag)).filter((task) =>
        task.description.split("\n").includes(tag),
      );
      if (found.length > 1)
        throw new FollowupError(
          "Ambiguous contains multiple records for this commitment; inspect the workspace before continuing.",
        );
      if (
        found[0] &&
        (found[0].title !== proposal.title ||
          found[0].description !== proposal.description)
      )
        throw new FollowupError(
          "This commitment is already saved with different reviewed fields. Refresh and inspect that record instead of creating a duplicate.",
        );
      return found[0];
    };
    const reconcile = async () => {
      const found = (
        await this.workplace.list(`followup:${proposal.actionKey}`)
      ).filter(
        (t) =>
          t.title === proposal.title && t.description === proposal.description,
      );
      if (found.length > 1)
        throw new FollowupError(
          "Ambiguous contains multiple matching records; inspect the workspace before continuing.",
        );
      return found[0];
    };
    const readBack = async (id: string) => {
      const record = await this.workplace.get(id);
      if (
        record.id !== id ||
        record.title !== proposal.title ||
        record.description !== proposal.description
      ) {
        throw new FollowupError(
          `Ambiguous task ${id} differs from the approved fields. Inspect the workspace; do not create it again.`,
        );
      }
      return this.enrich(record);
    };
    const savedCommitment = await logicalMatch();
    if (savedCommitment) return readBack(savedCommitment.id);
    const existing = await reconcile();
    if (existing) return readBack(existing.id);
    let sent = false;
    let conflict = false;
    let created: WorkplaceTask;
    try {
      created = await this.workplace.create(
        proposal.title,
        proposal.description,
        async () => {
          // Runs after live schema discovery, immediately before callTool. Failed discovery consumes no attempt.
          if (proposal.expiresAt <= this.now())
            throw new FollowupError(
              "This proposal expired before the write. Nothing was sent.",
            );
          const attempt = join(this.directory, `${proposal.actionKey}.attempt`);
          try {
            await writeFile(attempt, id, { flag: "wx", mode: 0o600 });
          } catch (error) {
            if (!fileExists(error)) throw error;
            conflict = true;
            throw uncertain();
          }
          if (proposal.expiresAt <= this.now()) {
            await unlink(attempt); // This request owns the claim and has not sent a write.
            throw new FollowupError(
              "This proposal expired before the write. Nothing was sent.",
            );
          }
          sent = true;
        },
      );
    } catch (error) {
      if (conflict) {
        const recovered = await reconcile();
        if (recovered) return readBack(recovered.id);
      }
      if (sent || conflict) throw uncertain();
      throw error; // A guaranteed pre-send failure remains retryable.
    }
    try {
      return await readBack(created.id);
    } catch (error) {
      if (error instanceof FollowupError) throw error;
      throw new FollowupError(
        `Ambiguous created task ${created.id}, but read-back failed. Refresh to retrieve it; do not create it again.`,
      );
    }
  }
}
