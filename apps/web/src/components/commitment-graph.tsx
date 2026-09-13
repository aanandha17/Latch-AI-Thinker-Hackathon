"use client";
import React from "react";
import type { LatchExtraction } from "@/lib/latch-schema";
import type { LatchSavedTask } from "@/lib/latch-approval";
import { CommitmentCard } from "./commitment-card";
export function CommitmentGraph({ result, savedTasks, reviewingId, declinedIds, onReview, onEvidence }: {
  result: LatchExtraction; savedTasks: LatchSavedTask[]; reviewingId?: string; declinedIds: Set<string>;
  onReview: (id: string) => void; onEvidence: (ids: string[]) => void;
}) {
  // Topological levels keep all prerequisites above dependents, including branching graphs.
  const levels = new Map<string, number>();
  const level = (id: string): number => {
    if (levels.has(id)) return levels.get(id)!;
    const parents = result.dependencies.filter(edge => edge.dependentId === id);
    const value = parents.length ? 1 + Math.max(...parents.map(edge => level(edge.prerequisiteId))) : 0;
    levels.set(id, value); return value;
  };
  result.commitments.forEach(item => level(item.id));
  const connected = new Set(result.dependencies.flatMap(edge => [edge.prerequisiteId, edge.dependentId]));
  const renderCard = (id: string) => {
    const commitment = result.commitments.find(item => item.id === id)!;
    return <CommitmentCard key={id} commitment={commitment}
      saved={savedTasks.find(task => task.metadata.commitmentId === id)}
      reviewing={id === reviewingId} declined={declinedIds.has(id)} onReview={onReview} onEvidence={onEvidence} />;
  };
  return <div className="latch-graph">
    {connected.size > 0 && <section className="latch-chain" aria-label="Dependent commitments">
      <div className="latch-section-kicker">Connected work</div>
      {[...new Set([...levels.entries()].filter(([id]) => connected.has(id)).map(([,value]) => value))].sort((a,b)=>a-b).map(depth => <div key={depth}>
        {depth > 0 && <div className="latch-edge-list">{result.dependencies.filter(edge => levels.get(edge.dependentId) === depth).map(edge => <div className="latch-edge" key={edge.prerequisiteId + edge.dependentId}>
          <svg viewBox="0 0 20 30" aria-hidden="true"><path d="M10 0v24m-5-5 5 6 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          <div><strong>{result.commitments.find(c => c.id === edge.prerequisiteId)?.title} → {result.commitments.find(c => c.id === edge.dependentId)?.title}</strong><span>must finish before</span>
            <details><summary>Dependency evidence</summary><blockquote>{edge.evidenceQuote}</blockquote><button className="latch-text-button" onClick={() => onEvidence(edge.sourceMessageIds)}>Show {edge.sourceMessageIds.join(", ")}</button></details>
          </div>
        </div>)}</div>}
        <div className="latch-card-grid">{result.commitments.filter(c => connected.has(c.id) && levels.get(c.id) === depth).map(c => renderCard(c.id))}</div>
      </div>)}
    </section>}
    {result.commitments.some(c => !connected.has(c.id)) && <section><div className="latch-section-kicker">Independent work</div><div className="latch-card-grid">{result.commitments.filter(c => !connected.has(c.id)).map(c => renderCard(c.id))}</div></section>}
    {result.commitments.length === 0 && <div className="latch-empty"><h3>No commitments found</h3><p>This thread does not contain accepted work. Suggestions stay separate.</p></div>}
  </div>;
}
