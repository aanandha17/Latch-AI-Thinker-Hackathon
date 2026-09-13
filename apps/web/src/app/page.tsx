"use client";
import { useState } from "react";
import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { AppControl } from "@/components/app-control";
import { latchDemo } from "@/lib/latch-demo";
import { useLatchExtraction } from "@/lib/use-latch-extraction";

export default function Home() {
  const [thread, setThread] = useState(() => structuredClone(latchDemo));
  const [author, setAuthor] = useState("Aisha");
  const [draft, setDraft] = useState("");
  const extraction = useLatchExtraction(thread);
  useConfigureSuggestions({ suggestions: [{ title: "Catch commitments", message: "Catch commitments in the current thread." }], available: "before-first-message" }, []);
  return <>
    <AppControl thread={thread} extraction={extraction} />
    <main className="ck-workspace">
      <header className="ck-workspace-header">
        <div><p className="ck-eyebrow">Sample team workspace</p><h1>LATCH</h1><p>Catch the promises work forgets.</p>
          <p>{thread.referenceDate.slice(0, 10)} · {thread.timezone} · revision {thread.revision}</p></div>
        <a href="/starter">Inherited approval reference</a>
      </header>
      <div className="ck-workspace-grid">
        <section className="ck-panel" style={{ padding: 24 }} aria-label="Team conversation">
          <h2>Conversation</h2>
          <p>Local sample data. Editing a message increments the revision.</p>
          {thread.messages.map(message => <div key={message.id} style={{ marginBottom: 16 }}>
            <label htmlFor={message.id}><strong>{message.author}</strong> · {message.timestamp.slice(11, 16)} · {message.id}</label>
            <textarea id={message.id} value={message.text} maxLength={2000} style={{ display: "block", width: "100%", minHeight: 64 }}
              onChange={event => setThread(previous => ({ ...previous, revision: previous.revision + 1, messages: previous.messages.map(m => m.id === message.id ? { ...m, text: event.target.value } : m) }))} />
          </div>)}
          <form onSubmit={event => { event.preventDefault(); if (!draft.trim() || thread.messages.length >= 50) return;
            setThread(previous => ({ ...previous, revision: previous.revision + 1, messages: [...previous.messages, { id: crypto.randomUUID(), threadId: previous.threadId, author, timestamp: previous.referenceDate, text: draft.trim() }] })); setDraft("");
          }}>
            <label>Author <select value={author} onChange={event => setAuthor(event.target.value)}>{["Aisha", "Marcus", "Ben"].map(name => <option key={name}>{name}</option>)}</select></label>
            <label style={{ display: "block" }}>New message <textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} /></label>
            <button disabled={!draft.trim() || thread.messages.length >= 50}>Add message</button>
          </form>
          <button type="button" disabled={extraction.loading} onClick={() => void extraction.extractCurrentThread()} style={{ marginTop: 16 }}>
            {extraction.loading ? "Catching commitments…" : "Catch commitments"}
          </button>
          {extraction.loading && <p role="status">Reading this revision. This can take up to 30 seconds.</p>}
          {extraction.error && <div role="alert"><p>{extraction.error}</p><button disabled={extraction.loading} onClick={() => void extraction.extractCurrentThread()}>Retry</button></div>}
          {extraction.needsExtraction && !extraction.loading && <p role="status">Conversation changed. Catch commitments again.</p>}
          <section aria-label="Extraction results" aria-live="polite">
            <h2>Results</h2>
            {!extraction.result && <p>No current extraction. Results appear after a successful model response.</p>}
            {extraction.result && <>
              <p>{extraction.result.commitments.length} commitments · {extraction.result.suggestions.length} suggestions</p>
              {extraction.result.commitments.map(item => <article key={item.id} style={{ borderTop: "1px solid #ddd", padding: "12px 0" }}>
                <h3>{item.title}</h3><p>{item.owner ?? "Unknown owner"} · {item.dueText ?? "No deadline stated"}</p>
                {item.dueAt && <p><time>{item.dueAt}</time></p>}
                <p>Detected, unsaved · {item.needsReview ? "Needs review" : "Ready for human review"} · {item.confidence} confidence</p>
                <details><summary>Evidence ({item.sourceMessageIds.join(", ")})</summary><blockquote>{item.evidenceQuote}</blockquote></details>
              </article>)}
              <h3>Dependencies</h3>
              {extraction.result.dependencies.map(edge => <p key={edge.prerequisiteId + edge.dependentId}>
                {extraction.result!.commitments.find(c => c.id === edge.prerequisiteId)?.title} → {extraction.result!.commitments.find(c => c.id === edge.dependentId)?.title} (must finish before)
              </p>)}
              <h3>Suggestions</h3>{extraction.result.suggestions.map(item => <p key={item.id}>{item.text} — {item.reason}</p>)}
              {extraction.result.warnings.map((warning, index) => <p key={index}>{warning}</p>)}
            </>}
          </section>
          <section aria-label="Saved in Ambiguous"><h2>Saved in Ambiguous</h2><p>LATCH approval and provider read-back will be connected by Member 3. Extraction does not save tasks.</p></section>
        </section>
        <section className="ck-panel ck-assistant" aria-label="LATCH assistant">
          <header className="ck-assistant-header"><h2>Ask LATCH</h2><p>The assistant sees the selected thread.</p></header>
          <CopilotChat className="ck-chat" labels={{ welcomeMessageText: "Catch commitments from this conversation.", chatInputPlaceholder: "Ask about this thread…" }} />
        </section>
      </div>
    </main>
  </>;
}
