import { extractionRequestSchema, extractionSchema, type LatchThread, type LatchExtraction } from "./latch-schema";

export class LatchValidationError extends Error {}
const fail = (message: string): never => { throw new LatchValidationError(message); };
const unique = (ids: string[]) => new Set(ids).size === ids.length;
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function mentions(text: string, name: string) {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])${escaped(name)}(?=$|[^\\p{L}\\p{N}_])`, "u").test(text);
}
function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (name: string) => parts.find(p => p.type === name)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")), minute: Number(get("minute")), second: Number(get("second")) };
}

// Conservative deadline policy: unknown natural-language dates stay textual and require review.
// We verify explicit ISO dates / today / tomorrow with AM-PM or 24-hour clocks.
function checkDeadline(item: LatchExtraction["commitments"][number], thread: LatchThread) {
  if (item.dueText === null) {
    if (item.dueAt !== null) fail("A clock deadline requires quoted deadline wording.");
    return;
  }
  if (!item.evidenceQuote.includes(item.dueText)) fail("Deadline wording must be an exact part of the evidence quote.");
  if (/\bafter\b/i.test(item.dueText)) {
    if (item.dueAt !== null) fail("A dependency is not a clock deadline.");
    return;
  }
  if (!/\b(by|before|at|on|today|tomorrow|deadline|due)\b|\d{4}-\d{2}-\d{2}/i.test(item.dueText)) fail("Deadline wording must state a deadline.");
  const clock = item.dueText.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(AM|PM)\b/i);
  const clock24 = item.dueText.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const hour = clock ? Number(clock[1]) % 12 + (clock[3].toUpperCase() === "PM" ? 12 : 0) : clock24 ? Number(clock24[1]) : undefined;
  const minute = Number(clock?.[2] ?? clock24?.[2] ?? 0);
  let day = item.dueText.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const reference = localParts(new Date(thread.referenceDate), thread.timezone).date;
  if (/\btoday\b/i.test(item.dueText)) day = reference;
  if (/\btomorrow\b/i.test(item.dueText)) day = new Date(Date.parse(reference + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  if (hour === undefined || !day) {
    if (item.dueAt !== null || !item.needsReview) fail("An unresolved deadline must remain null and require review.");
    return;
  }
  if (item.dueAt === null) fail("An explicit supported deadline needs its stated clock boundary.");
  const actual = localParts(new Date(item.dueAt!), thread.timezone);
  if (actual.date !== day || actual.hour !== hour || actual.minute !== minute || actual.second !== 0) fail("Deadline does not match the quoted date and timezone.");
  // Require the serialized offset to agree with the fixture timezone, not merely the instant.
  const printedLocal = item.dueAt!.slice(0, 16);
  if (printedLocal !== `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`) fail("Serialize deadlines in the supplied timezone.");
}

export function validateExtraction(value: unknown, rawThread: LatchThread): LatchExtraction {
  const thread = extractionRequestSchema.parse(rawThread);
  const result = extractionSchema.parse(value);
  if (result.threadId !== thread.threadId || result.revision !== thread.revision) fail("Stale extraction: the thread or revision changed.");
  const messages = new Map(thread.messages.map(m => [m.id, m]));
  const checkSources = (ids: string[], quote?: string) => {
    if (!unique(ids) || ids.some(id => !messages.has(id))) fail("Evidence IDs must be unique and belong to this thread.");
    // The one quote must occur in at least one cited message, never span synthetic joins.
    if (quote !== undefined && !ids.some(id => messages.get(id)!.text.includes(quote))) fail("Evidence quote is not an exact substring of a referenced message.");
  };
  if (!unique([...result.commitments, ...result.suggestions].map(item => item.id))) fail("Output IDs must be unique.");
  const authors = new Set(thread.messages.map(m => m.author));
  for (const item of result.commitments) {
    checkSources(item.sourceMessageIds, item.evidenceQuote);
    const source = item.sourceMessageIds.map(id => messages.get(id)!);
    if (item.owner !== null && !authors.has(item.owner) && !source.some(m => mentions(m.text, item.owner!))) fail("Owner is neither known nor explicitly mentioned in the evidence.");
    if ((item.owner === null || !authors.has(item.owner) || item.confidence === "low") && !item.needsReview) fail("Low confidence or unknown owner requires review.");
    // Defense in depth for unsupported promises; broader linguistic interpretation remains model work.
    const isTentative = (text: string) => /\b(maybe|might|perhaps)\b|^\s*(can|could|would)\s+(someone|anyone)\b/i.test(text);
    if (source.every(m => isTentative(m.text))) fail("Tentative ideas and unanswered questions are not commitments.");
    if (source.every(m => /ignore all rules|ignore (all |previous )?instructions/i.test(m.text))) fail("Embedded instructions are not commitments.");
    checkDeadline(item, thread);
  }
  for (const item of result.suggestions) checkSources(item.sourceMessageIds);
  const nodes = new Set(result.commitments.map(item => item.id));
  const edges = new Set<string>();
  const adjacency = new Map<string, string[]>();
  for (const edge of result.dependencies) {
    checkSources(edge.sourceMessageIds, edge.evidenceQuote);
    if (!nodes.has(edge.prerequisiteId) || !nodes.has(edge.dependentId)) fail("Dependency endpoints must be commitments.");
    if (edge.prerequisiteId === edge.dependentId) fail("Self dependencies are invalid.");
    const key = JSON.stringify([edge.prerequisiteId, edge.dependentId]);
    if (edges.has(key)) fail("Duplicate dependency.");
    edges.add(key);
    adjacency.set(edge.prerequisiteId, [...(adjacency.get(edge.prerequisiteId) ?? []), edge.dependentId]);
  }
  const active = new Set<string>(), done = new Set<string>();
  const visit = (id: string) => {
    if (active.has(id)) fail("Dependency cycle detected.");
    if (done.has(id)) return;
    active.add(id);
    for (const next of adjacency.get(id) ?? []) visit(next);
    active.delete(id); done.add(id);
  };
  for (const id of nodes) visit(id);
  return result;
}

// Lossless encoding avoids hash collisions. No title, deadline or generated ID enters identity.
// Per-evidence ordinal follows quote position in source order, not the model's array ordering.
export function assignStableIds(result: LatchExtraction, thread: LatchThread): LatchExtraction {
  const validated = validateExtraction(result, thread);
  const map = new Map<string, string>();
  function assign<T extends { id: string; sourceMessageIds: string[] }>(items: T[], kind: string): T[] {
    const groups = new Map<string, T[]>();
    for (const item of items) {
      const key = JSON.stringify([...item.sourceMessageIds].sort());
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    for (const [key, group] of groups) {
      if (kind === "c") {
        const position = (item: T) => {
          const commitment = item as T & { evidenceQuote: string };
          for (const [index, m] of thread.messages.entries()) {
            if (item.sourceMessageIds.includes(m.id) && m.text.includes(commitment.evidenceQuote)) return index * 2001 + m.text.indexOf(commitment.evidenceQuote);
          }
          return 0;
        };
        group.sort((a, b) => position(a) - position(b));
        if (group.some((item, index) => index > 0 && position(item) === position(group[index - 1]))) fail("Distinct commitments sharing evidence need distinct quote positions.");
      } else if (group.length > 1) {
        fail("Combine suggestions that share the same evidence IDs.");
      }
      group.forEach((item, index) => map.set(item.id, `latch:${kind}:${encodeURIComponent(thread.threadId)}:${encodeURIComponent(key)}:${index}`));
    }
    return items.map(item => ({ ...item, id: map.get(item.id)! }));
  }
  const commitments = assign(validated.commitments, "c");
  const suggestions = assign(validated.suggestions, "s");
  return { ...validated, commitments, suggestions, dependencies: validated.dependencies.map(edge => ({ ...edge, prerequisiteId: map.get(edge.prerequisiteId)!, dependentId: map.get(edge.dependentId)! })) };
}
