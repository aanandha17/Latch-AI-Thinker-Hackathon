"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { CopilotChat } from "@copilotkit/react-core/v2";
import { AppControl } from "@/components/app-control";
import { CommitmentGraph } from "@/components/commitment-graph";
import { CommitmentReview } from "@/components/commitment-review";
import { WorkplaceFollowups } from "@/components/workplace-followups";
import { useModelConfigured } from "@/components/providers";
import { extractCurrentThread as requestExtraction } from "@/lib/latch-client";
import {
  createLocalMessage,
  latchAuthors,
  latchDemoThread,
  type LatchAuthor,
  type LatchMessage,
} from "@/lib/latch-demo";
import type { LatchExtraction, LatchThread } from "@/lib/latch-schema";
import { useWorkplace } from "@/lib/use-workplace";

export default function Home() {
  const [messages, setMessages] = useState<LatchMessage[]>(() => [
    ...latchDemoThread.messages,
  ]);
  const [revision, setRevision] = useState(latchDemoThread.revision);
  const [author, setAuthor] = useState<LatchAuthor>(latchAuthors[0]);
  const [draft, setDraft] = useState("");
  const [extraction, setExtraction] = useState<LatchExtraction | null>(null);
  const [extractionError, setExtractionError] = useState("");
  const [extractionNotice, setExtractionNotice] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string>();
  const extractionSequence = useRef(0);

  const thread = useMemo<LatchThread>(
    () => ({ ...latchDemoThread, revision, messages }),
    [messages, revision],
  );
  const latestThread = useRef(thread);
  latestThread.current = thread;
  const workplace = useWorkplace(thread.threadId);
  const modelConfigured = useModelConfigured();

  const catchCommitments = useCallback(async () => {
    const snapshot = thread;
    const request = ++extractionSequence.current;
    setExtracting(true);
    setExtractionError("");
    setExtractionNotice("Analyzing quoted conversation data…");
    setReviewingId(undefined);
    workplace.discardProposal();
    try {
      const result = await requestExtraction(snapshot);
      if (
        request !== extractionSequence.current ||
        latestThread.current.revision !== snapshot.revision
      )
        throw new Error(
          "The conversation changed during extraction. Run Catch commitments again.",
        );
      setExtraction(result);
      setExtractionNotice(
        `Validated ${result.commitments.length} commitment(s), ${result.suggestions.length} suggestion(s), and ${result.dependencies.length} dependency edge(s).`,
      );
      return result;
    } catch (error) {
      if (request === extractionSequence.current) {
        setExtraction(null);
        setExtractionError(
          error instanceof Error ? error.message : "Unable to analyze this conversation.",
        );
        setExtractionNotice("No Ambiguous task was created.");
      }
      throw error;
    } finally {
      if (request === extractionSequence.current) setExtracting(false);
    }
  }, [thread, workplace.discardProposal]);

  const savedIds = useMemo(
    () =>
      new Set(
        workplace.status?.status === "connected"
          ? workplace.status.tasks
              .map((task) => task.latch?.commitmentId)
              .filter((id): id is string => Boolean(id))
          : [],
      ),
    [workplace.status],
  );
  const reviewingCommitment = extraction?.commitments.find(
    (item) => item.id === reviewingId,
  );
  const prerequisiteIds =
    extraction?.dependencies
      .filter((item) => item.dependentId === reviewingId)
      .map((item) => item.prerequisiteId) ?? [];

  function invalidateExtraction(message: string) {
    extractionSequence.current += 1;
    setExtraction(null);
    setReviewingId(undefined);
    setExtractionError("");
    setExtractionNotice(message);
    setExtracting(false);
    workplace.discardProposal();
  }

  function addMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      createLocalMessage(current, author, draft),
    ]);
    setRevision((current) => current + 1);
    setDraft("");
    invalidateExtraction("Conversation changed. Run Catch commitments to analyze the new revision.");
  }

  function resetSample() {
    setMessages([...latchDemoThread.messages]);
    setRevision(latchDemoThread.revision);
    setDraft("");
    invalidateExtraction("Sample conversation restored. Run Catch commitments when ready.");
  }

  return (
    <>
      {modelConfigured && (
        <AppControl
          thread={thread}
          extraction={extraction}
          workplace={workplace}
          onCatch={catchCommitments}
        />
      )}
      <main className="latch-workspace">
        <header className="latch-header">
          <div>
            <p className="latch-eyebrow">LATCH / Commitment Graph</p>
            <h1>Catch the promises work forgets.</h1>
            <p className="latch-intro">
              Turn a busy team conversation into reviewable commitments, evidence, dependencies, and durable workplace records.
            </p>
          </div>
          <span className="latch-sample-tag">Sample data</span>
        </header>

        <div className="latch-primary-grid">
          <section className="latch-panel" aria-labelledby="thread-title">
            <header className="latch-panel-header">
              <div>
                <p className="latch-kicker">Sample team workspace</p>
                <h2 id="thread-title">Launch-day coordination</h2>
                <p className="latch-metadata">
                  <code>{thread.threadId}</code>
                  <span aria-hidden="true">·</span>
                  <time dateTime={thread.date}>{thread.date}</time>
                  <span aria-hidden="true">·</span>
                  <span>{thread.timezone}</span>
                </p>
              </div>
              <span className="latch-revision">Revision {revision}</span>
            </header>

            <ol className="latch-message-list" aria-label="Team messages">
              {messages.map((message) => (
                <li className="latch-message" key={message.id}>
                  <div className="latch-avatar" aria-hidden="true" data-author={message.author}>
                    {message.author.charAt(0)}
                  </div>
                  <div className="latch-message-body">
                    <div className="latch-message-meta">
                      <strong>{message.author}</strong>
                      <time>{message.time}</time>
                      <code>{message.id}</code>
                      {message.source === "local" && (
                        <span className="latch-local-badge">Local demo</span>
                      )}
                    </div>
                    <p>{message.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <form className="latch-composer" onSubmit={addMessage}>
              <div className="latch-composer-fields">
                <label>
                  <span>Author</span>
                  <select
                    value={author}
                    onChange={(event) => setAuthor(event.target.value as LatchAuthor)}
                  >
                    {latchAuthors.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label className="latch-message-input">
                  <span>Local demo message</span>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Add a message to this sample thread"
                    maxLength={2000}
                    required
                  />
                </label>
              </div>
              <div className="latch-composer-actions">
                <button className="latch-button latch-button-primary" type="submit">
                  Add message
                </button>
                <button className="latch-button latch-button-secondary" type="button" onClick={resetSample}>
                  Reset sample
                </button>
              </div>
            </form>
          </section>

          <section className="latch-panel latch-results-panel" aria-labelledby="results-title">
            <header className="latch-panel-header">
              <div>
                <p className="latch-kicker">Commitment Graph</p>
                <h2 id="results-title">Detected work</h2>
              </div>
              <span className="latch-status-dot" data-ready={Boolean(extraction)}>
                {extracting ? "Analyzing" : extraction ? "Validated" : "Not analyzed"}
              </span>
            </header>

            {extraction ? (
              <CommitmentGraph
                extraction={extraction}
                savedIds={savedIds}
                reviewingId={reviewingId}
                onReview={setReviewingId}
              />
            ) : (
              <div className="latch-empty-results">
                <div className="latch-empty-icon" aria-hidden="true">↗</div>
                <h3>No commitments extracted yet</h3>
                <p>
                  Run the validated agent to separate commitments from suggestions and map direct dependencies.
                </p>
              </div>
            )}

            <button
              className="latch-button latch-button-primary latch-catch-button"
              type="button"
              disabled={extracting}
              onClick={() => catchCommitments().catch(() => {})}
            >
              {extracting ? "Catching commitments…" : "Catch commitments"}
            </button>
            {extractionError && <p className="ck-error" role="alert">{extractionError}</p>}
            <p className="latch-results-note" role="status">
              {extractionNotice || "Analysis never saves anything to Ambiguous."}
            </p>
          </section>
        </div>

        {reviewingCommitment && (
          <div className="latch-review-section">
            <CommitmentReview
              key={reviewingCommitment.id}
              thread={thread}
              commitment={reviewingCommitment}
              prerequisiteIds={prerequisiteIds}
              workplace={workplace}
              onClose={() => setReviewingId(undefined)}
            />
          </div>
        )}

        <section className="latch-inherited" aria-labelledby="integration-title">
          <header className="latch-inherited-header">
            <div>
              <p className="latch-kicker">Review, approve, verify</p>
              <h2 id="integration-title">Durable Ambiguous workflow</h2>
            </div>
            <p>
              LATCH stores the reviewed fields, evidence, dependency IDs, and stable commitment ID, then reads the same provider record back.
            </p>
          </header>
          <div className="latch-inherited-grid">
            <section className="latch-panel">
              <WorkplaceFollowups threadId={thread.threadId} workplace={workplace} />
            </section>
            <section className="ck-panel ck-assistant" aria-label="Assistant">
              <header className="ck-assistant-header">
                <h2>Ask LATCH</h2>
                <p>The assistant sees the current thread and only validated extraction results.</p>
              </header>
              {modelConfigured ? (
                <CopilotChat
                  className="ck-chat"
                  labels={{
                    welcomeMessageText:
                      "I can analyze this conversation and explain its validated commitments. Saving always requires your approval button.",
                    chatInputPlaceholder: "Ask about commitments or dependencies…",
                  }}
                />
              ) : (
                <div className="latch-assistant-setup">
                  <strong>Assistant ready after model setup</strong>
                  <p>
                    Add your OpenRouter API key to the root <code>.env</code>, then restart the web app. The free setup does not require an OpenAI key.
                  </p>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
