import assert from "node:assert/strict";
import test from "node:test";
import { latchDemoThread } from "./latch-demo";
import {
  commitmentMarker,
  createLatchRecord,
  parseLatchRecord,
  threadMarker,
} from "./latch-record";

const commitment = {
  id: "c-slides",
  title: "Finish slides",
  owner: "Marcus",
  dueText: "today by 5 PM",
  dueAt: "2026-09-13T17:00:00+08:00",
  sourceMessageIds: ["m2"],
  evidenceQuote: "I'll finish the three demo slides today by 5 PM.",
  confidence: "high" as const,
  needsReview: false,
  prerequisiteIds: [],
};

test("a LATCH record round-trips structured evidence and exact lookup markers", () => {
  const record = createLatchRecord(latchDemoThread, commitment, "action");
  assert.ok(record.description.split("\n").includes(threadMarker("latch-demo-01")));
  assert.ok(record.description.split("\n").includes(commitmentMarker("c-slides")));
  assert.deepEqual(parseLatchRecord(record.description), record.metadata);
});

test("review records reject invented or mismatched evidence before approval", () => {
  assert.throws(
    () =>
      createLatchRecord(
        latchDemoThread,
        { ...commitment, evidenceQuote: "not in the message" },
        "action",
      ),
    /exact quote/,
  );
  assert.equal(parseLatchRecord("ordinary task"), null);
});
