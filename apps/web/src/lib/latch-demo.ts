export const latchAuthors = ["Aisha", "Marcus", "Ben"] as const;

export type LatchAuthor = (typeof latchAuthors)[number];

export type LatchMessage = {
  id: string;
  author: LatchAuthor;
  time: string;
  text: string;
  source: "sample" | "local";
};

export type LatchDemoThread = {
  threadId: string;
  date: string;
  timezone: string;
  referenceTime: string;
  revision: number;
  messages: LatchMessage[];
};

export const latchDemoThread: LatchDemoThread = {
  threadId: "latch-demo-01",
  date: "2026-09-13",
  timezone: "Asia/Kuala_Lumpur",
  referenceTime: "2026-09-13T13:00:00+08:00",
  revision: 1,
  messages: [
    {
      id: "m1",
      author: "Aisha",
      time: "13:01",
      text: "I'll confirm the venue today by 3 PM.",
      source: "sample",
    },
    {
      id: "m2",
      author: "Marcus",
      time: "13:02",
      text: "I'll finish the three demo slides today by 5 PM.",
      source: "sample",
    },
    {
      id: "m3",
      author: "Ben",
      time: "13:03",
      text: "I'll start rehearsal after Marcus finishes the slides.",
      source: "sample",
    },
    {
      id: "m4",
      author: "Aisha",
      time: "13:04",
      text: "Maybe we should add voice later.",
      source: "sample",
    },
    {
      id: "m5",
      author: "Marcus",
      time: "13:05",
      text: "I'll test persistence today before 6 PM.",
      source: "sample",
    },
  ],
};

export function createLocalMessage(
  messages: LatchMessage[],
  author: LatchAuthor,
  text: string,
): LatchMessage {
  const nextNumber =
    messages.reduce((largest, message) => {
      const numericId = Number.parseInt(message.id.replace(/^m/, ""), 10);
      return Number.isFinite(numericId) ? Math.max(largest, numericId) : largest;
    }, 0) + 1;
  const minutesAfterMidnight = 13 * 60 + nextNumber;
  const hour = Math.floor(minutesAfterMidnight / 60) % 24;
  const minute = minutesAfterMidnight % 60;

  return {
    id: `m${nextNumber}`,
    author,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    text: text.trim(),
    source: "local",
  };
}
