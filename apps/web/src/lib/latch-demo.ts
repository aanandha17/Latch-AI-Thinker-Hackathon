import type { LatchThread } from "./latch-schema";

// Input data only. No expected model answers are shipped to the extractor.
export const latchDemo: LatchThread = {
  threadId: "latch-demo-01", revision: 1,
  referenceDate: "2026-09-13T13:00:00+08:00", timezone: "Asia/Kuala_Lumpur",
  messages: [
    ["m1", "Aisha", "13:01", "I'll confirm the venue today by 3 PM."],
    ["m2", "Marcus", "13:02", "I'll finish the three demo slides today by 5 PM."],
    ["m3", "Ben", "13:03", "I'll start rehearsal after Marcus finishes the slides."],
    ["m4", "Aisha", "13:04", "Maybe we should add voice later."],
    ["m5", "Marcus", "13:05", "I'll test persistence today before 6 PM."],
  ].map(([id, author, time, text]) => ({ id, author, text, threadId: "latch-demo-01", timestamp: `2026-09-13T${time}:00+08:00` })),
};
