"use client";

import { useState, type FormEvent } from "react";
import {
  CopilotChat,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { GenerativeUI } from "@/components/generative-ui";
import { AppControl } from "@/components/app-control";
import { useWorkplace } from "@/lib/use-workplace";
import { WorkplaceFollowups } from "@/components/workplace-followups";
import {
  createLocalMessage,
  latchAuthors,
  latchDemoThread,
  type LatchAuthor,
  type LatchMessage,
} from "@/lib/latch-demo";

const inheritedIncidentId = "INC-1042";

export default function Home() {
  const [messages, setMessages] = useState<LatchMessage[]>(() => [
    ...latchDemoThread.messages,
  ]);
  const [revision, setRevision] = useState(latchDemoThread.revision);
  const [author, setAuthor] = useState<LatchAuthor>(latchAuthors[0]);
  const [draft, setDraft] = useState("");
  const [extractionNotice, setExtractionNotice] = useState("");
  const workplace = useWorkplace(inheritedIncidentId);

  useConfigureSuggestions(
    {
      suggestions: [
        {
          title: "Find commitments",
          message:
            "Identify the commitments and suggestions in the selected team conversation.",
        },
        {
          title: "Explain a dependency",
          message:
            "Who is waiting on whom in this team conversation, and what evidence supports it?",
        },
      ],
      available: "before-first-message",
    },
    [],
  );

  function addMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;

    setMessages((current) => [
      ...current,
      createLocalMessage(current, author, draft),
    ]);
    setRevision((current) => current + 1);
    setDraft("");
    setExtractionNotice("");
  }

  function resetSample() {
    setMessages([...latchDemoThread.messages]);
    setRevision(latchDemoThread.revision);
    setDraft("");
    setExtractionNotice("");
  }

  return (
    <>
      <GenerativeUI />
      <AppControl
        selectedId={inheritedIncidentId}
        selectIncident={() => undefined}
        workplace={workplace}
      />
      <main className="latch-workspace">
        <header className="latch-header">
          <div>
            <p className="latch-eyebrow">LATCH / Commitment Graph</p>
            <h1>Catch the promises work forgets.</h1>
            <p className="latch-intro">
              Turn a busy team conversation into reviewable commitments,
              evidence, and dependencies.
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
                  <code>{latchDemoThread.threadId}</code>
                  <span aria-hidden="true">·</span>
                  <time dateTime={latchDemoThread.date}>
                    {latchDemoThread.date}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{latchDemoThread.timezone}</span>
                </p>
              </div>
              <span className="latch-revision">Revision {revision}</span>
            </header>

            <ol className="latch-message-list" aria-label="Team messages">
              {messages.map((message) => (
                <li className="latch-message" key={message.id}>
                  <div
                    className="latch-avatar"
                    aria-hidden="true"
                    data-author={message.author}
                  >
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
                    onChange={(event) =>
                      setAuthor(event.target.value as LatchAuthor)
                    }
                  >
                    {latchAuthors.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
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
                <button
                  className="latch-button latch-button-secondary"
                  type="button"
                  onClick={resetSample}
                >
                  Reset sample
                </button>
              </div>
            </form>
          </section>

          <section
            className="latch-panel latch-results-panel"
            aria-labelledby="results-title"
          >
            <header className="latch-panel-header">
              <div>
                <p className="latch-kicker">Commitment Graph</p>
                <h2 id="results-title">Detected work</h2>
              </div>
              <span className="latch-status-dot">Not analyzed</span>
            </header>

            <div className="latch-empty-results">
              <div className="latch-empty-icon" aria-hidden="true">
                ↗
              </div>
              <h3>No commitments extracted yet</h3>
              <p>
                The validated extraction service will populate commitments,
                suggestions, evidence, and dependency arrows here.
              </p>
            </div>

            <button
              className="latch-button latch-button-primary latch-catch-button"
              type="button"
              onClick={() =>
                setExtractionNotice(
                  "Extraction is not connected in this UI milestone. No result or external task was created.",
                )
              }
            >
              Catch commitments
            </button>
            <p className="latch-results-note" role="status">
              {extractionNotice ||
                "This control does not save anything to Ambiguous."}
            </p>
          </section>
        </div>

        <section className="latch-inherited" aria-labelledby="inherited-title">
          <header className="latch-inherited-header">
            <div>
              <p className="latch-kicker">Inherited starter integration</p>
              <h2 id="inherited-title">Approval and assistant sandbox</h2>
            </div>
            <p>
              Retained temporarily while Members 2 and 3 migrate the typed
              extraction and approval flows to LATCH.
            </p>
          </header>
          <div className="latch-inherited-grid">
            <section className="latch-panel">
              <WorkplaceFollowups
                incidentId={inheritedIncidentId}
                workplace={workplace}
              />
            </section>
            <section className="ck-panel ck-assistant" aria-label="Assistant">
              <header className="ck-assistant-header">
                <h2>Ask assistant</h2>
                <p>Current starter chat, pending LATCH context integration.</p>
              </header>
              <CopilotChat
                className="ck-chat"
                labels={{
                  welcomeMessageText:
                    "The LATCH conversation UI is ready for extraction integration.",
                  chatInputPlaceholder: "Ask about the workspace…",
                }}
              />
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
