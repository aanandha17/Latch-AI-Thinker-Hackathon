"use client";
import React from "react";
import type { LatchWorkplaceControls } from "@/lib/use-latch-workplace";
export function LatchSaved({ workplace }: { workplace: LatchWorkplaceControls }) {
  const tasks = workplace.status?.status === "connected" ? workplace.status.tasks : [];
  return <section id="saved-tasks" className="latch-saved-section">
    <div className="latch-section-heading"><div><p className="latch-section-kicker">Durable work</p><h2>Saved in Ambiguous <span className="latch-count">{tasks.length}</span></h2></div><button className="latch-secondary" disabled={workplace.refreshing || workplace.busy} onClick={()=>void workplace.refresh().catch(()=>{})}>{workplace.refreshing ? "Reading…" : "↻ Refresh from Ambiguous"}</button></div>
    {workplace.notice && <p className="latch-notice" role="status">{workplace.notice}</p>}
    {workplace.error && <p className="latch-alert" role="alert">{workplace.error} Previously confirmed records, if shown, are retained.</p>}
    {workplace.status?.status === "unconfigured" && <p className="latch-setup">{workplace.status.message}</p>}
    {tasks.length === 0 && <p className="latch-muted">No saved records loaded. Detection is a proposal; only your approval creates a task.</p>}
    <div className="latch-saved-grid">{tasks.map(task=><article key={task.id} className="latch-saved-record">
      <span className="latch-badge green">✓ Provider record</span><h3>{task.title}</h3><p>{task.metadata.reviewed.owner ?? "Unassigned"} · {task.metadata.reviewed.dueText ?? "No deadline stated"}</p>
      <code className="latch-record-id">{task.id}</code><p className="latch-muted">Evidence {task.metadata.detected.sourceMessageIds.join(", ")} · saved from revision {task.metadata.revision}</p>
      {task.url && <a href={task.url} target="_blank" rel="noreferrer">Open provider record ↗</a>}
      <details><summary>Saved fields and evidence</summary><pre>{task.description}</pre></details>
    </article>)}</div>
  </section>;
}
