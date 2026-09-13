"use client";
import React from "react";
import type { LatchCommitment } from "@/lib/latch-schema";
import type { LatchSavedTask } from "@/lib/latch-approval";
export function CommitmentCard({ commitment, saved, reviewing, declined, onReview, onEvidence }: {
  commitment: LatchCommitment; saved?: LatchSavedTask; reviewing?: boolean; declined?: boolean;
  onReview: (id: string) => void; onEvidence: (ids: string[]) => void;
}) {
  const state = saved ? "Saved" : reviewing ? "Reviewing" : declined ? "Declined" : "Detected";
  return <article className={"latch-card " + (saved ? "is-saved" : "")} id={"card-" + encodeURIComponent(commitment.id)}>
    <div className="latch-card-top"><span className={"latch-badge " + (saved ? "green" : "")}>{state}</span><span className="latch-muted">{commitment.sourceMessageIds.join(" · ")}</span></div>
    <h3>{commitment.title}</h3>
    <div className="latch-owner"><span className="latch-avatar small">{commitment.owner?.slice(0,1) ?? "?"}</span><span>{commitment.owner ?? "Owner needs review"}</span></div>
    <p className="latch-deadline">{commitment.dueText ?? "No deadline stated"}</p>
    {commitment.dueAt && <p className="latch-muted"><time dateTime={commitment.dueAt}>{commitment.dueAt.slice(0,10)} · {commitment.dueAt.slice(11,16)} {commitment.dueAt.slice(19)}</time></p>}
    <details className="latch-evidence"><summary>View evidence</summary><blockquote>“{commitment.evidenceQuote}”</blockquote><button className="latch-text-button" onClick={() => onEvidence(commitment.sourceMessageIds)}>Show source messages ↗</button></details>
    <div className="latch-card-bottom"><span className="latch-muted">{commitment.needsReview ? "Needs review" : commitment.confidence + " confidence"}</span>
      {saved ? <span className="latch-saved-label">✓ In Ambiguous</span> : <button className="latch-secondary" onClick={() => onReview(commitment.id)}>Review task ↗</button>}</div>
  </article>;
}
