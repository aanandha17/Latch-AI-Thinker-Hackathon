"use client";

import { useState, type FormEvent } from "react";
import type { WorkplaceControls } from "@/lib/use-workplace";
import {
  reviewedCommitmentSchema,
  type Commitment,
  type LatchThread,
} from "@/lib/latch-schema";

export function CommitmentReview({
  thread,
  commitment,
  prerequisiteIds,
  workplace,
  onClose,
}: {
  thread: LatchThread;
  commitment: Commitment;
  prerequisiteIds: string[];
  workplace: WorkplaceControls;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(commitment.title);
  const [owner, setOwner] = useState(commitment.owner ?? "");
  const [dueText, setDueText] = useState(commitment.dueText ?? "");
  const [dueAt, setDueAt] = useState(commitment.dueAt ?? "");
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);

  function changed() {
    if (workplace.proposal) workplace.discardProposal();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreparing(true);
    setError("");
    try {
      const reviewed = reviewedCommitmentSchema.parse({
        ...commitment,
        title: title.trim(),
        owner: owner.trim() || null,
        dueText: dueText.trim() || null,
        dueAt: dueAt.trim() || null,
        prerequisiteIds,
      });
      await workplace.propose({ thread, commitment: reviewed });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to prepare this commitment for approval.",
      );
    } finally {
      setPreparing(false);
    }
  }

  return (
    <section className="latch-panel latch-review" aria-labelledby="review-title">
      <header className="latch-panel-header">
        <div>
          <p className="latch-kicker">Human approval gate</p>
          <h2 id="review-title">Review exact fields</h2>
        </div>
        <button className="latch-button latch-button-secondary" type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <p className="latch-review-intro">
        Editing or preparing this form does not write anything. The separate approval button is the only save action.
      </p>
      <form className="latch-review-form" onSubmit={submit}>
        <label>
          <span>Title</span>
          <input
            value={title}
            maxLength={200}
            required
            onChange={(event) => {
              changed();
              setTitle(event.target.value);
            }}
          />
        </label>
        <label>
          <span>Owner (blank means unknown)</span>
          <input
            value={owner}
            maxLength={120}
            onChange={(event) => {
              changed();
              setOwner(event.target.value);
            }}
          />
        </label>
        <label>
          <span>Due wording (blank means not stated)</span>
          <input
            value={dueText}
            maxLength={200}
            onChange={(event) => {
              changed();
              setDueText(event.target.value);
            }}
          />
        </label>
        <label>
          <span>Normalized due time (ISO with timezone, optional)</span>
          <input
            value={dueAt}
            placeholder="2026-09-13T15:00:00+08:00"
            onChange={(event) => {
              changed();
              setDueAt(event.target.value);
            }}
          />
        </label>
        <div className="latch-readonly-field">
          <strong>Evidence (read-only)</strong>
          <blockquote>“{commitment.evidenceQuote}”</blockquote>
          <small>Source: {commitment.sourceMessageIds.join(", ")}</small>
        </div>
        <div className="latch-readonly-field">
          <strong>Prerequisites (read-only)</strong>
          <span>{prerequisiteIds.join(", ") || "None"}</span>
        </div>
        <button
          className="latch-button latch-button-primary"
          type="submit"
          disabled={preparing || workplace.busy || workplace.status?.status !== "connected"}
        >
          {preparing ? "Preparing…" : "Prepare approval proposal"}
        </button>
      </form>
      {workplace.status?.status !== "connected" && (
        <p className="latch-results-note">
          Connect Ambiguous before preparing a save. Review remains available locally.
        </p>
      )}
      {error && <p className="ck-error" role="alert">{error}</p>}
    </section>
  );
}
