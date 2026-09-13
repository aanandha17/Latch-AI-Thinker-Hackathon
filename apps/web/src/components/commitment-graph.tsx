"use client";

import React from "react";
import type { LatchExtraction } from "@/lib/latch-schema";

export function CommitmentGraph({
  extraction,
  savedIds,
  reviewingId,
  onReview,
}: {
  extraction: LatchExtraction;
  savedIds: Set<string>;
  reviewingId?: string;
  onReview: (id: string) => void;
}) {
  const byId = new Map(extraction.commitments.map((item) => [item.id, item]));

  return (
    <div className="latch-graph">
      {extraction.dependencies.length > 0 && (
        <section className="latch-dependencies" aria-labelledby="dependencies-title">
          <h3 id="dependencies-title">Dependency map</h3>
          {extraction.dependencies.map((dependency) => (
            <div
              className="latch-dependency"
              key={`${dependency.prerequisiteId}-${dependency.dependentId}`}
            >
              <span>{byId.get(dependency.prerequisiteId)?.title}</span>
              <span className="latch-arrow" aria-label="must finish before">
                →
              </span>
              <span>{byId.get(dependency.dependentId)?.title}</span>
              <small>“{dependency.evidenceQuote}”</small>
            </div>
          ))}
        </section>
      )}

      <ol className="latch-commitment-list" aria-label="Detected commitments">
        {extraction.commitments.map((commitment) => {
          const saved = savedIds.has(commitment.id);
          return (
            <li className="latch-commitment-card" key={commitment.id}>
              <div className="latch-card-heading">
                <code>{commitment.id}</code>
                <span
                  className={saved ? "latch-state latch-state-saved" : "latch-state"}
                >
                  {saved ? "Saved" : commitment.needsReview ? "Needs review" : "Detected"}
                </span>
              </div>
              <h3>{commitment.title}</h3>
              <dl className="latch-facts">
                <div>
                  <dt>Owner</dt>
                  <dd>{commitment.owner ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt>Due</dt>
                  <dd>{commitment.dueText ?? "Not stated"}</dd>
                </div>
              </dl>
              <details>
                <summary>Evidence and confidence</summary>
                <blockquote>“{commitment.evidenceQuote}”</blockquote>
                <p>
                  Messages {commitment.sourceMessageIds.join(", ")} · {commitment.confidence} confidence
                </p>
              </details>
              <button
                className="latch-button latch-button-secondary"
                type="button"
                disabled={saved}
                onClick={() => onReview(commitment.id)}
              >
                {saved
                  ? "Saved to Ambiguous"
                  : reviewingId === commitment.id
                    ? "Reviewing below"
                    : "Review before saving"}
              </button>
            </li>
          );
        })}
      </ol>

      {extraction.suggestions.length > 0 && (
        <section className="latch-suggestions" aria-labelledby="suggestions-title">
          <h3 id="suggestions-title">Suggestions—not commitments</h3>
          <ul>
            {extraction.suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <span>{suggestion.text}</span>
                <small>
                  “{suggestion.evidenceQuote}” · {suggestion.sourceMessageIds.join(", ")}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {extraction.warnings.length > 0 && (
        <details className="latch-warnings">
          <summary>{extraction.warnings.length} extraction warning(s)</summary>
          <ul>
            {extraction.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
