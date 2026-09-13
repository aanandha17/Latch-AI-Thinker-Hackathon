"use client";

import { useState } from "react";
import type { WorkplaceControls } from "@/lib/use-workplace";

export function WorkplaceFollowups({
  threadId,
  workplace,
}: {
  threadId: string;
  workplace: WorkplaceControls;
}) {
  const [error, setError] = useState("");
  const { status, proposal, busy, notice } = workplace;
  const tasks = status?.status === "connected" ? status.tasks : [];

  async function refresh() {
    setError("");
    try {
      await workplace.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to refresh commitments from Ambiguous.",
      );
    }
  }

  return (
    <section className="ck-followups" aria-labelledby="followup-title">
      <header className="ck-followups-header">
        <div>
          <h2 id="followup-title">Saved commitments</h2>
          <p className="ck-local-note">
            Only an explicit approval click can write. Refresh always reads Ambiguous again.
          </p>
        </div>
        <span className="ck-tag">Ambiguous</span>
      </header>

      {status?.status === "unconfigured" ? (
        <div className="ck-setup-note">
          <strong>Connect a workspace to save commitments</strong>
          <p>{status.message}</p>
          <p>No browser-only task is created as a stand-in.</p>
        </div>
      ) : status?.status === "connected" ? (
        <p className="ck-local-note">
          Retrieved as {status.identityName}. Workspace <code>{status.workspaceId}</code>.
        </p>
      ) : (
        <p className="ck-local-note">
          {workplace.error
            ? "Workplace connection unavailable."
            : "Connecting to Ambiguous…"}
        </p>
      )}

      {tasks.length ? (
        <ul className="ck-task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span aria-hidden="true">●</span>
              <div>
                <strong>{task.title}</strong>
                <code className="ck-record-id">{task.id}</code>
                {task.latch && (
                  <p className="ck-local-note">
                    Owner {task.latch.owner ?? "unknown"} · Due{" "}
                    {task.latch.dueText ?? "not stated"} · Commitment{" "}
                    {task.latch.commitmentId}
                  </p>
                )}
                {task.url ? (
                  <a href={task.url} target="_blank" rel="noreferrer">
                    Open Ambiguous record
                  </a>
                ) : (
                  <span className="ck-muted">Use the record ID above in Ambiguous.</span>
                )}
                <details>
                  <summary>Verified saved payload</summary>
                  <p className="ck-preserve-lines">{task.description}</p>
                </details>
              </div>
            </li>
          ))}
        </ul>
      ) : status?.status === "connected" ? (
        <p className="ck-empty">No saved commitments for {threadId}.</p>
      ) : null}

      <button type="button" className="ck-btn" disabled={busy} onClick={refresh}>
        Refresh from Ambiguous
      </button>

      {proposal && (
        <section className="ck-approval" aria-label="Approve Ambiguous commitment">
          <h3>Approve this exact Ambiguous record</h3>
          <p>
            Save as {proposal.identityName} in workspace{" "}
            <code>{proposal.workspaceId}</code>. Expires{" "}
            {new Date(proposal.expiresAt).toLocaleTimeString()}.
          </p>
          <strong>{proposal.title}</strong>
          <p className="ck-preserve-lines">{proposal.description}</p>
          <p>This is the real external write. Review every field above.</p>
          <div className="ck-approval-actions">
            <button
              type="button"
              className="ck-btn ck-btn--primary"
              disabled={busy}
              onClick={workplace.approve}
            >
              {busy ? "Working…" : "Approve & save to Ambiguous"}
            </button>
            <button type="button" className="ck-btn" disabled={busy} onClick={workplace.deny}>
              Decline
            </button>
          </div>
        </section>
      )}

      {(error || workplace.error) && (
        <p role="alert" className="ck-error">
          {error || workplace.error}
        </p>
      )}
      <p role="status" className="ck-notice">{notice}</p>
    </section>
  );
}
