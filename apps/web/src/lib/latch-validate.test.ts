import assert from "node:assert/strict";
import test from "node:test";
import { latchDemoThread } from "./latch-demo";
import { validateAndNormalizeExtraction } from "./latch-validate";

function candidate() {
  return {
    commitments: [
      {
        id: "venue",
        title: "Confirm the venue",
        owner: "Aisha",
        dueText: "today by 3 PM",
        dueAt: "2026-09-13T15:00:00+08:00",
        sourceMessageIds: ["m1"],
        evidenceQuote: "I'll confirm the venue today by 3 PM.",
        confidence: "high",
        needsReview: false,
      },
      {
        id: "slides",
        title: "Finish the three demo slides",
        owner: "Marcus",
        dueText: "today by 5 PM",
        dueAt: "2026-09-13T17:00:00+08:00",
        sourceMessageIds: ["m2"],
        evidenceQuote: "I'll finish the three demo slides today by 5 PM.",
        confidence: "high",
        needsReview: false,
      },
      {
        id: "rehearsal",
        title: "Start rehearsal",
        owner: "Ben",
        dueText: null,
        dueAt: null,
        sourceMessageIds: ["m3"],
        evidenceQuote: "I'll start rehearsal after Marcus finishes the slides.",
        confidence: "high",
        needsReview: false,
      },
      {
        id: "persistence",
        title: "Test persistence",
        owner: "Marcus",
        dueText: "today before 6 PM",
        dueAt: "2026-09-13T18:00:00+08:00",
        sourceMessageIds: ["m5"],
        evidenceQuote: "I'll test persistence today before 6 PM.",
        confidence: "high",
        needsReview: false,
      },
    ],
    suggestions: [
      {
        id: "voice",
        text: "Add voice later",
        sourceMessageIds: ["m4"],
        evidenceQuote: "Maybe we should add voice later.",
      },
    ],
    dependencies: [
      {
        prerequisiteId: "slides",
        dependentId: "rehearsal",
        sourceMessageIds: ["m3"],
        evidenceQuote: "I'll start rehearsal after Marcus finishes the slides.",
      },
    ],
    warnings: [],
  };
}

test("validated extraction preserves null deadlines and remaps dependency endpoints to stable IDs", () => {
  const result = validateAndNormalizeExtraction(latchDemoThread, candidate());
  assert.equal(result.commitments.length, 4);
  assert.equal(result.suggestions.length, 1);
  assert.equal(result.commitments[2].dueText, null);
  assert.equal(result.commitments[2].dueAt, null);
  assert.match(result.commitments[0].id, /^c-[a-f0-9]{8}$/);
  assert.equal(result.dependencies[0].prerequisiteId, result.commitments[1].id);
  assert.equal(result.dependencies[0].dependentId, result.commitments[2].id);
});

test("stable commitment IDs do not change when a reviewer edits a title", () => {
  const first = candidate();
  const second = candidate();
  second.commitments[0].title = "Confirm final venue";
  const firstId = validateAndNormalizeExtraction(latchDemoThread, first).commitments[0].id;
  const secondId = validateAndNormalizeExtraction(latchDemoThread, second).commitments[0].id;
  assert.equal(firstId, secondId);
});

test("invented evidence, invented owners, and dueAt without dueText are rejected", () => {
  const inventedQuote = candidate();
  inventedQuote.commitments[0].evidenceQuote = "Aisha promised something else.";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, inventedQuote),
    /exact quote/,
  );

  const inventedOwner = candidate();
  inventedOwner.commitments[0].owner = "Nobody Named";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, inventedOwner),
    /owner not named/,
  );

  const inventedDeadline = candidate();
  inventedDeadline.commitments[2].dueAt = "2026-09-13T19:00:00+08:00";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, inventedDeadline),
    /dueAt without/,
  );
});

test("unknown dependency endpoints, self edges, cycles, and duplicate IDs are rejected", () => {
  const unknown = candidate();
  unknown.dependencies[0].prerequisiteId = "missing";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, unknown),
    /endpoint/,
  );

  const self = candidate();
  self.dependencies[0].dependentId = "slides";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, self),
    /depend on itself/,
  );

  const cycle = candidate();
  cycle.dependencies.push({
    prerequisiteId: "rehearsal",
    dependentId: "slides",
    sourceMessageIds: ["m3"],
    evidenceQuote: "I'll start rehearsal after Marcus finishes the slides.",
  });
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, cycle),
    /cycle/,
  );

  const duplicate = candidate();
  duplicate.suggestions[0].id = "venue";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, duplicate),
    /unique/,
  );
});

test("low-confidence or ownerless work cannot bypass review", () => {
  const output = candidate();
  output.commitments[0].confidence = "low";
  assert.throws(
    () => validateAndNormalizeExtraction(latchDemoThread, output),
    /marked for review/,
  );
});
