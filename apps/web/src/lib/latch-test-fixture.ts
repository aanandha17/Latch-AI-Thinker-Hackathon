// Offline expected outputs only. Production imports must never reference this file.
import { latchDemo } from "./latch-demo";
import { emptyExtraction, type LatchExtraction } from "./latch-schema";
export function fixtureOutput(): LatchExtraction {
  return {
    ...emptyExtraction(latchDemo),
    commitments: [0, 1, 2, 4].map((index, ordinal) => ({
      id: "c" + ordinal,
      title: ["Confirm venue", "Finish slides", "Start rehearsal", "Test persistence"][ordinal],
      owner: latchDemo.messages[index].author,
      dueText: ["today by 3 PM", "today by 5 PM", null, "today before 6 PM"][ordinal],
      dueAt: ["2026-09-13T15:00:00+08:00", "2026-09-13T17:00:00+08:00", null, "2026-09-13T18:00:00+08:00"][ordinal],
      sourceMessageIds: [latchDemo.messages[index].id], evidenceQuote: latchDemo.messages[index].text,
      confidence: "high", needsReview: false,
    })),
    suggestions: [{ id: "s0", text: latchDemo.messages[3].text, sourceMessageIds: ["m4"], reason: "Tentative idea; nobody accepted responsibility." }],
    dependencies: [{ prerequisiteId: "c1", dependentId: "c2", sourceMessageIds: ["m3"], evidenceQuote: latchDemo.messages[2].text }],
  };
}
