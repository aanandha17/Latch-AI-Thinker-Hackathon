"use client";
import { useCallback, useContext, useRef, useState } from "react";
import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { ChatConfiguration } from "@/components/providers";
import { AppControl } from "@/components/app-control";
import { CommitmentGraph } from "@/components/commitment-graph";
import { LatchReview } from "@/components/latch-review";
import { LatchSaved } from "@/components/latch-saved";
import { latchDemo } from "@/lib/latch-demo";
import type { LatchCommitment, LatchExtraction, LatchThread } from "@/lib/latch-schema";
import { useLatchExtraction } from "@/lib/use-latch-extraction";
import { useLatchWorkplace } from "@/lib/use-latch-workplace";

export default function Home() {
  const chatConfigured = useContext(ChatConfiguration);
  const [thread, setThread] = useState(() => structuredClone(latchDemo));
  const [author, setAuthor] = useState("Aisha");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string>();
  const [editText, setEditText] = useState("");
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<{ thread: LatchThread; extraction: LatchExtraction; commitment: LatchCommitment }>();
  const clearHighlight = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const extraction = useLatchExtraction(thread);
  const workplace = useLatchWorkplace(thread.threadId);
  const savedTasks = workplace.status?.status === "connected" ? workplace.status.tasks : [];
  const openReview = useCallback((id: string) => {
    const result = extraction.result;
    const commitment = result?.commitments.find(c => c.id === id);
    if (!result || !commitment) return false;
    setReview({ thread: structuredClone(thread), extraction: result, commitment });
    return true;
  }, [thread, extraction.result]);
  const showEvidence = (ids: string[]) => {
    setHighlighted(ids); clearTimeout(clearHighlight.current);
    document.getElementById("message-" + ids[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("message-" + ids[0])?.focus({ preventScroll: true });
    clearHighlight.current = setTimeout(() => setHighlighted([]), 5000);
  };
  useConfigureSuggestions({ suggestions: [
    { title: "Catch commitments", message: "Catch commitments in the current thread." },
    { title: "Explain dependencies", message: "Explain who is waiting for whom using the evidence." },
  ], available: "before-first-message" }, []);
  const addMessage = () => {
    if (!draft.trim() || thread.messages.length >= 50) return;
    setThread(previous => {
      const last = Math.max(Date.parse(previous.referenceDate), ...previous.messages.map(m=>Date.parse(m.timestamp)));
      return { ...previous, revision: previous.revision + 1, messages: [...previous.messages, { id: crypto.randomUUID(), threadId: previous.threadId, author, timestamp: new Date(last + 60000).toISOString(), text: draft.trim() }] };
    });
    setDraft("");
  };
  return <div className="latch-app">
    <AppControl thread={thread} extraction={extraction} workplace={workplace} onReview={openReview}
      savedTasks={savedTasks.map(task => ({ id: task.id, title: task.title, commitmentId: task.metadata.commitmentId, threadId: task.metadata.threadId }))} />
    <header className="latch-topbar">
      <a href="#workspace" className="latch-brand" aria-label="LATCH workspace"><span className="latch-mark" aria-hidden="true">↳</span>LATCH<span className="latch-brand-divider"/> <span className="latch-brand-sub">commitment graph</span></a>
      <div className="latch-top-actions"><span className="latch-demo-tag"><span/> Local demo</span><button className="latch-secondary" onClick={()=>setChatOpen(true)}>✦ Ask LATCH</button><span className="latch-avatar">T</span></div>
    </header>
    <div className="latch-shell">
      <aside className="latch-sidebar" aria-label="Workspace navigation">
        <div className="latch-sidebar-label">WORKSPACE</div><a className="is-active" href="#workspace"><span>◈</span> Team conversation</a><a href="#saved-tasks"><span>☑</span> Saved tasks <span className="latch-nav-count">{savedTasks.length}</span></a>
        <div className="latch-sidebar-note"><span className="latch-note-icon">↳</span><strong>Promises, made visible.</strong><p>Read the conversation.<br/>Catch the commitments.<br/>Approve what matters.</p><span className="latch-muted">Human approval, always.</span></div>
      </aside>
      <main id="workspace" className="latch-main">
        <div className="latch-page-heading"><div><p className="latch-section-kicker">Sample team workspace</p><h1>Catch the promises<br className="latch-mobile-break"/> work forgets.</h1><p className="latch-muted">From a conversation to evidence-backed work. You stay in control.</p></div>
          <button className="latch-primary latch-catch" disabled={extraction.loading || !!editing} onClick={()=>void extraction.extractCurrentThread()}>{extraction.loading ? "Catching commitments…" : "✦ Catch commitments"}<span aria-hidden="true">↗</span></button>
        </div>
        <div className="latch-workspace-grid">
          <section className="latch-conversation-panel" aria-label="Team conversation">
            <header className="latch-panel-heading"><div><h2>Demo day planning</h2><p>{thread.referenceDate.slice(0,10)} · {thread.timezone}</p></div><span className="latch-badge">r{thread.revision}</span></header>
            <div className="latch-thread-meta"><span className="latch-member-stack"><i>A</i><i>M</i><i>B</i></span><span>3 teammates · {thread.messages.length} messages</span></div>
            <div className="latch-messages">{thread.messages.map(message=><article tabIndex={-1} id={"message-"+message.id} key={message.id} className={"latch-message "+(highlighted.includes(message.id)?"is-highlighted":"")}>
              <span className={"latch-avatar author-"+message.author.toLowerCase()}>{message.author.slice(0,1)}</span>
              <div className="latch-message-body"><div className="latch-message-meta"><strong>{message.author}</strong><time dateTime={message.timestamp}>{new Intl.DateTimeFormat("en-GB",{timeZone:thread.timezone,hour:"2-digit",minute:"2-digit"}).format(new Date(message.timestamp))}</time><span className="latch-message-id" title={message.id}>{message.id.length>8?message.id.slice(0,8):message.id}</span></div>
                {editing===message.id ? <div><label className="latch-sr-only" htmlFor="edit-message">Edit message from {message.author}</label><textarea id="edit-message" autoFocus value={editText} maxLength={2000} onChange={e=>setEditText(e.target.value)}/><div className="latch-actions"><button className="latch-secondary" disabled={!editText.trim()} onClick={()=>{setThread(previous=>({...previous,revision:previous.revision+1,messages:previous.messages.map(m=>m.id===message.id?{...m,text:editText.trim()}:m)}));setEditing(undefined);}}>Save edit</button><button className="latch-text-button" onClick={()=>setEditing(undefined)}>Cancel</button></div></div>
                : <><p>{message.text}</p><button className="latch-edit-button" aria-label={"Edit message "+message.id} onClick={()=>{setEditing(message.id);setEditText(message.text);}}>Edit</button></>}
              </div>
            </article>)}</div>
            <form className="latch-composer" onSubmit={e=>{e.preventDefault();addMessage();}}>
              <label htmlFor="draft-author">Write as <select id="draft-author" value={author} onChange={e=>setAuthor(e.target.value)}>{["Aisha","Marcus","Ben"].map(name=><option key={name}>{name}</option>)}</select></label>
              <label className="latch-sr-only" htmlFor="new-message">New message</label><textarea id="new-message" placeholder="Add to the conversation…" maxLength={2000} value={draft} onChange={e=>setDraft(e.target.value)}/>
              <div className="latch-composer-bottom"><span>Local sample · {draft.length}/2,000</span><button className="latch-secondary" disabled={!draft.trim()||thread.messages.length>=50}>Add message ↑</button></div>
            </form>
            <button className="latch-text-button latch-reset" disabled={workplace.busy || !!review} onClick={()=>{setThread(previous=>({...structuredClone(latchDemo),revision:previous.revision+1}));setEditing(undefined);setDeclinedIds(new Set());}}>↺ Reset sample text <span>Saved tasks stay unchanged</span></button>
          </section>
          <section className="latch-results-panel" aria-label="Commitment graph">
            <header className="latch-result-heading"><div><p className="latch-section-kicker">The work behind the words</p><h2>Commitment graph</h2></div><span className="latch-badge">{extraction.result ? extraction.result.commitments.length+" commitments" : "Awaiting extraction"}</span></header>
            {extraction.loading && <div className="latch-status-box" role="status"><span className="latch-spinner"/>Reading the current thread. Checking promises and evidence…</div>}
            {extraction.error && <div className="latch-alert" role="alert"><p>{extraction.error}</p><button className="latch-secondary" disabled={extraction.loading} onClick={()=>void extraction.extractCurrentThread()}>Retry extraction</button></div>}
            {extraction.needsExtraction && !extraction.loading && <p className="latch-notice" role="status">The conversation changed. Catch commitments again for revision {thread.revision}.</p>}
            {!extraction.result && <div className="latch-empty-graph"><div className="latch-graph-illustration" aria-hidden="true"><i/><span>↓</span><i/></div><h3>Your graph starts here.</h3><p>Catch the commitments in this conversation to see<br/>who owns what, and who is waiting for whom.</p><span className="latch-badge">Evidence first. Approval always.</span></div>}
            {extraction.result && <>
              <CommitmentGraph result={extraction.result} savedTasks={savedTasks} reviewingId={review?.commitment.id} declinedIds={declinedIds} onReview={openReview} onEvidence={showEvidence}/>
              {extraction.result.suggestions.length>0 && <section className="latch-suggestions"><h3>Ideas, not commitments <span className="latch-count">{extraction.result.suggestions.length}</span></h3>{extraction.result.suggestions.map(item=><article key={item.id}><span>◌</span><div><p>{item.text}</p><small>{item.reason}</small><button className="latch-text-button" onClick={()=>showEvidence(item.sourceMessageIds)}>Source {item.sourceMessageIds.join(", ")}</button></div></article>)}</section>}
              {extraction.result.warnings.length>0 && <aside className="latch-alert"><strong>Review notes</strong>{extraction.result.warnings.map((text,i)=><p key={i}>{text}</p>)}</aside>}
            </>}
          </section>
        </div>
        <LatchSaved workplace={workplace}/>
        <footer className="latch-footer"><span>LATCH · Built for Agents, Everywhere</span><span>Sample conversation · Owner & deadline stored as metadata</span></footer>
      </main>
    </div>
    <aside className="latch-chat-drawer" hidden={!chatOpen} aria-label="Ask LATCH">
      <header><div><p className="latch-section-kicker">In your workspace</p><h2>Ask LATCH</h2></div><button className="latch-icon-button" aria-label="Close assistant" onClick={()=>setChatOpen(false)}>×</button></header>
      <p className="latch-muted">Your assistant sees the current conversation and validated results. Saving always needs your approval.</p>
      {chatConfigured && chatOpen ? <CopilotChat className="ck-chat" labels={{welcomeMessageText:"What did the team commit to?",chatInputPlaceholder:"Ask about this conversation…"}}/> : <p className="latch-setup">Configure the chat model and API key in local .env, restart the server and reload this page to use the assistant. The sample workspace remains available offline.</p>}
    </aside>
    {review && <LatchReview key={review.commitment.id+":"+review.thread.revision} {...review} currentRevision={thread.revision} workplace={workplace} onClose={()=>setReview(undefined)} onDeclined={id=>setDeclinedIds(previous=>new Set([...previous,id]))}/>}
  </div>;
}
