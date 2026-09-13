import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommitmentGraph } from "./commitment-graph";
import type { LatchExtraction } from "../lib/latch-schema";

const extraction: LatchExtraction = {
  commitments: [
    {
      id: "c-slides",
      title: "Finish slides",
      owner: "Marcus",
      dueText: "today by 5 PM",
      dueAt: "2026-09-13T17:00:00+08:00",
      sourceMessageIds: ["m2"],
      evidenceQuote: "I'll finish the three demo slides today by 5 PM.",
      confidence: "high",
      needsReview: false,
    },
    {
      id: "c-rehearsal",
      title: "Start rehearsal",
      owner: "Ben",
      dueText: null,
      dueAt: null,
      sourceMessageIds: ["m3"],
      evidenceQuote: "I'll start rehearsal after Marcus finishes the slides.",
      confidence: "high",
      needsReview: false,
    },
  ],
  suggestions: [
    {
      id: "s-voice",
      text: "Add voice later",
      sourceMessageIds: ["m4"],
      evidenceQuote: "Maybe we should add voice later.",
    },
  ],
  dependencies: [
    {
      prerequisiteId: "c-slides",
      dependentId: "c-rehearsal",
      sourceMessageIds: ["m3"],
      evidenceQuote: "I'll start rehearsal after Marcus finishes the slides.",
    },
  ],
  warnings: [],
};

test("the Commitment Graph renders edges, evidence, suggestions, and saved state", () => {
  const html = renderToStaticMarkup(
    <CommitmentGraph
      extraction={extraction}
      savedIds={new Set(["c-slides"])}
      reviewingId="c-rehearsal"
      onReview={() => {}}
    />,
  );
  assert.match(html, /Dependency map/);
  assert.match(html, /Finish slides/);
  assert.match(html, /→/);
  assert.match(html, /Start rehearsal/);
  assert.match(html, /Suggestions—not commitments/);
  assert.match(html, /Add voice later/);
  assert.match(html, /Saved to Ambiguous/);
  assert.match(html, /Reviewing below/);
});
