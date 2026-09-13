import {
  latchExtractionSchema,
  latchThreadSchema,
  type LatchExtraction,
  type LatchThread,
} from "./latch-schema";

export class LatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LatchValidationError";
  }
}

function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length)
    throw new LatchValidationError(`${label} must be unique.`);
}

function validateEvidence(
  thread: LatchThread,
  sourceMessageIds: string[],
  evidenceQuote: string,
  label: string,
) {
  assertUnique(sourceMessageIds, `${label} sourceMessageIds`);
  const byId = new Map(thread.messages.map((message) => [message.id, message]));
  const sources = sourceMessageIds.map((id) => {
    const source = byId.get(id);
    if (!source)
      throw new LatchValidationError(`${label} cites unknown message ${id}.`);
    return source;
  });
  if (!sources.some((source) => source.text.includes(evidenceQuote)))
    throw new LatchValidationError(
      `${label} evidenceQuote is not an exact quote from a cited message.`,
    );
}

function validateAcyclic(
  commitmentIds: Set<string>,
  dependencies: LatchExtraction["dependencies"],
) {
  const outgoing = new Map<string, string[]>();
  const pairs = new Set<string>();
  for (const dependency of dependencies) {
    if (
      !commitmentIds.has(dependency.prerequisiteId) ||
      !commitmentIds.has(dependency.dependentId)
    )
      throw new LatchValidationError(
        "Every dependency endpoint must reference a commitment.",
      );
    if (dependency.prerequisiteId === dependency.dependentId)
      throw new LatchValidationError("A commitment cannot depend on itself.");
    const pair = `${dependency.prerequisiteId}->${dependency.dependentId}`;
    if (pairs.has(pair))
      throw new LatchValidationError("Duplicate dependency detected.");
    pairs.add(pair);
    outgoing.set(dependency.prerequisiteId, [
      ...(outgoing.get(dependency.prerequisiteId) ?? []),
      dependency.dependentId,
    ]);
  }

  const active = new Set<string>();
  const finished = new Set<string>();
  const visit = (id: string) => {
    if (active.has(id))
      throw new LatchValidationError("Commitment dependencies contain a cycle.");
    if (finished.has(id)) return;
    active.add(id);
    for (const dependent of outgoing.get(id) ?? []) visit(dependent);
    active.delete(id);
    finished.add(id);
  };
  for (const id of commitmentIds) visit(id);
}

export function validateAndNormalizeExtraction(
  threadValue: unknown,
  extractionValue: unknown,
): LatchExtraction {
  const thread = latchThreadSchema.parse(threadValue);
  const extraction = latchExtractionSchema.parse(extractionValue);
  const candidateIds = [
    ...extraction.commitments.map((item) => item.id),
    ...extraction.suggestions.map((item) => item.id),
  ];
  assertUnique(candidateIds, "Extraction IDs");

  const authors = new Set(
    thread.messages.map((message) => message.author.toLocaleLowerCase()),
  );
  const conversationText = thread.messages
    .map((message) => message.text)
    .join("\n")
    .toLocaleLowerCase();

  for (const commitment of extraction.commitments) {
    validateEvidence(
      thread,
      commitment.sourceMessageIds,
      commitment.evidenceQuote,
      `Commitment ${commitment.id}`,
    );
    if (
      commitment.owner &&
      !authors.has(commitment.owner.toLocaleLowerCase()) &&
      !conversationText.includes(commitment.owner.toLocaleLowerCase())
    )
      throw new LatchValidationError(
        `Commitment ${commitment.id} has an owner not named in the conversation.`,
      );
    if (commitment.dueAt && !commitment.dueText)
      throw new LatchValidationError(
        `Commitment ${commitment.id} has dueAt without evidence-backed dueText.`,
      );
    if (
      (!commitment.owner || commitment.confidence === "low") &&
      !commitment.needsReview
    )
      throw new LatchValidationError(
        `Commitment ${commitment.id} must be marked for review.`,
      );
  }
  for (const suggestion of extraction.suggestions)
    validateEvidence(
      thread,
      suggestion.sourceMessageIds,
      suggestion.evidenceQuote,
      `Suggestion ${suggestion.id}`,
    );
  for (const dependency of extraction.dependencies)
    validateEvidence(
      thread,
      dependency.sourceMessageIds,
      dependency.evidenceQuote,
      `Dependency ${dependency.prerequisiteId}->${dependency.dependentId}`,
    );

  validateAcyclic(
    new Set(extraction.commitments.map((item) => item.id)),
    extraction.dependencies,
  );

  const occurrenceByEvidence = new Map<string, number>();
  const idMap = new Map<string, string>();
  const commitments = extraction.commitments.map((commitment) => {
    const evidenceKey = [...commitment.sourceMessageIds].sort().join(",");
    const occurrence = occurrenceByEvidence.get(evidenceKey) ?? 0;
    occurrenceByEvidence.set(evidenceKey, occurrence + 1);
    const id = `c-${stableHash(
      `${thread.threadId}|${evidenceKey}|${occurrence}`,
    )}`;
    idMap.set(commitment.id, id);
    return { ...commitment, id };
  });

  const suggestions = extraction.suggestions.map((suggestion, index) => ({
    ...suggestion,
    id: `s-${stableHash(
      `${thread.threadId}|${[...suggestion.sourceMessageIds]
        .sort()
        .join(",")}|${index}`,
    )}`,
  }));
  const dependencies = extraction.dependencies.map((dependency) => ({
    ...dependency,
    prerequisiteId: idMap.get(dependency.prerequisiteId)!,
    dependentId: idMap.get(dependency.dependentId)!,
  }));

  return latchExtractionSchema.parse({
    commitments,
    suggestions,
    dependencies,
    warnings: extraction.warnings,
  });
}
