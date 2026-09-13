"use client";
import React from "react";
import { useEffect, useRef, useState } from "react";
import type { LatchCommitment, LatchExtraction, LatchThread } from "@/lib/latch-schema";
import { readLatchMetadata, reviewedFieldsSchema } from "@/lib/latch-approval";
import type { LatchWorkplaceControls } from "@/lib/use-latch-workplace";
export function LatchReview({ thread, extraction, commitment, currentRevision, workplace, onClose, onDeclined }: {
  thread: LatchThread; extraction: LatchExtraction; commitment: LatchCommitment; currentRevision: number;
  workplace: LatchWorkplaceControls; onClose: () => void; onDeclined: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previous = workplace.proposal?.commitmentId === commitment.id && workplace.proposal.revision === thread.revision ? readLatchMetadata(workplace.proposal.description)?.reviewed : undefined;
  const [title, setTitle] = useState(previous?.title ?? commitment.title);
  const [owner, setOwner] = useState(previous ? previous.owner ?? "" : commitment.owner ?? "");
  const [dueText, setDueText] = useState(previous ? previous.dueText ?? "" : commitment.dueText ?? "");
  const [dueAt, setDueAt] = useState(previous ? previous.dueAt ?? "" : commitment.dueAt ?? "");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => { dialog.current?.showModal(); const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const proposal = workplace.proposal?.commitmentId === commitment.id && workplace.proposal.revision === thread.revision ? workplace.proposal : undefined;
  const stale = currentRevision !== thread.revision;
  const expired = !!proposal && proposal.expiresAt <= clock;
  const locked = workplace.busy || !!proposal;
  const prepare = async () => {
    const reviewed = reviewedFieldsSchema.safeParse({ title, owner: owner.trim() || null, dueText: dueText.trim() || null, dueAt: dueAt.trim() || null });
    if (!reviewed.success) { setError("Enter a title of at most 200 characters and a valid ISO deadline with offset, or leave deadline fields empty."); return; }
    setError(""); setConfirmed(false);
    try { await workplace.propose({ thread, extraction, commitmentId: commitment.id, reviewed: reviewed.data }); } catch {}
  };
  return <dialog ref={dialog} className="latch-dialog" onCancel={event => { if (workplace.busy) event.preventDefault(); else onClose(); }}>
    <div className="latch-dialog-head"><div><p className="latch-section-kicker">Human review · revision {thread.revision}</p><h2>Make the commitment explicit.</h2></div><button aria-label="Close review" className="latch-icon-button" disabled={workplace.busy} onClick={onClose}>×</button></div>
    <p className="latch-muted">Review the fields, then prepare an immutable proposal. Preparing does not save anything.</p>
    {stale && <p role="alert" className="latch-alert">The conversation changed. Close this review and catch commitments again.</p>}
    <div className="latch-form">
      <label>Task title<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} disabled={locked} maxLength={200}/></label>
      <label>Owner <span>(metadata, not native assignment)</span><input value={owner} onChange={e=>setOwner(e.target.value)} disabled={locked} maxLength={100} placeholder="Unassigned"/></label>
      <label>Deadline wording<input value={dueText} onChange={e=>setDueText(e.target.value)} disabled={locked} maxLength={300} placeholder="No deadline stated"/></label>
      <label>Deadline boundary <span>({thread.timezone}; optional ISO datetime)</span><input value={dueAt} onChange={e=>setDueAt(e.target.value)} disabled={locked} placeholder="2026-09-13T17:00:00+08:00"/></label>
    </div>
    <blockquote className="latch-review-quote">“{commitment.evidenceQuote}”<cite>{commitment.sourceMessageIds.join(", ")} · original evidence stays unchanged</cite></blockquote>
    {(error || workplace.error) && <p role="alert" className="latch-alert">{error || workplace.error}</p>}
    {!proposal ? <button className="latch-primary" disabled={workplace.busy || stale} onClick={()=>void prepare()}>{workplace.busy ? "Preparing…" : "Prepare approval proposal"}</button> : <section className="latch-approval-box">
      <h3>Ready for your approval</h3><button className="latch-text-button" disabled={workplace.busy} onClick={() => { workplace.clearProposal(); setConfirmed(false); }}>Edit fields / prepare a new proposal</button><p>Workspace: <strong>{proposal.identityName}</strong> · <code>{proposal.workspaceId}</code></p>
      <p>Expires {new Date(proposal.expiresAt).toLocaleTimeString()} · {expired ? "Expired" : "Pending, not saved"}</p>
      <details open><summary>Exact record to be saved</summary><strong>{proposal.title}</strong><pre>{proposal.description}</pre></details>
      <label className="latch-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={workplace.busy || expired || stale}/>I reviewed the exact record and intended workspace.</label>
      <div className="latch-actions">
        <button className="latch-primary" disabled={!confirmed || workplace.busy || expired || stale} onClick={async()=>{ const task=await workplace.approve(proposal.id); if(task)onClose(); }}>{workplace.busy ? "Working…" : "Approve & save to Ambiguous"}</button>
        <button className="latch-secondary" disabled={workplace.busy} onClick={async()=>{ if(await workplace.deny(proposal.id)){onDeclined(commitment.id);onClose();} }}>Decline</button>
      </div>
      {expired && <p className="latch-alert">Use Edit fields / prepare a new proposal to renew this review. Nothing is saved automatically.</p>}
    </section>}
  </dialog>;
}
