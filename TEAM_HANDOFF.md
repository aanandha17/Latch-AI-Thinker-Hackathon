# Current LATCH status — 2026-09-13

The user expanded the assignment to all roles. Extraction, the workspace UI/graph, and the LATCH browser approval/persistence adaptation are implemented on feature/latch-extraction. Earlier role assignments below are historical. Read CONTINUE_HERE.md for the current continuation instructions and DEMO_SCRIPT.md for rehearsal.

Latest offline verification: npm.cmd run verify passed 68 web tests and workspace typechecks; npm.cmd run typecheck passed. The inherited Windows agent-core/channel glob issue remains; previous explicit runs passed 37 and 22 tests. Production build status is recorded in EXTRACTION_REPORT.md.

Current UI files: page.tsx, globals.css, layout.tsx, providers.tsx, app-control.tsx, commitment-card.tsx, commitment-graph.tsx, latch-review.tsx, latch-saved.tsx. Approval files: latch-approval.ts, latch-task-client.ts, use-latch-workplace.ts, server/latch-approval-domain.ts, server/latch-approval-http.ts, server/latch-approvals.ts, api/latch/tasks/route.ts. New tests cover service, HTTP and graph rendering. The generic followup-client factory now accepts an optional endpoint; its existing default stays unchanged.

API additions: GET /api/latch/config returns only chatConfigured. GET /api/latch/tasks?session=1 establishes the HttpOnly approval session; GET with threadId lists real records and optional taskId retrieves one. POST operation=propose accepts thread, extraction, commitmentId and reviewed {title,owner,dueText,dueAt}; returns an immutable proposal. POST approve or deny accepts only proposalId plus operation. Only browser approval can write; proposal creation and chat tools cannot. Keep the full thread/extraction snapshot when opening review and invalidate it after revision changes. Saved records remain separate from extraction state.

Browser checked at 1366x768: all five sample messages, missing-credential extraction error, revision increment after deadline edit, and honest unsaved/provider setup states. Graph direction and no-deadline labels are covered by rendered component tests. Live populated graph screenshots and full keyboard approval checks remain pending real extraction.

Credentials intentionally deferred by user. Real inference, changed-deadline inference, live CopilotKit chat, and actual Ambiguous approve/read-back/decline have NOT been verified. No external record was created. Do not present offline test fixtures as live results.

---
# LATCH extraction handoff

## Start here

The active project is C:\AI Empire\Hackathon\Latch-AI-Thinker-Hackathon. The extraction branch includes the imported starter because main initially contained only an empty main.py. Do not start the UI branch from empty main.

After this branch is pushed, the frontend member can run:

```powershell
git clone https://github.com/aanandha17/Latch-AI-Thinker-Hackathon.git
cd Latch-AI-Thinker-Hackathon
git fetch origin
git switch -c feature/latch-ui origin/feature/latch-extraction
npm.cmd ci
Copy-Item .env.example .env
```

If already cloned, skip the clone. If feature/latch-ui already exists, inspect its state before switching; do not overwrite work. Commit and push role-specific files. GitHub synchronizes pushed commits, not live laptop edits. Never force-push or commit .env/node_modules/.data.

Keep the existing lockfile and /v2 APIs. Zod 4.5.4 and @openai/agents 0.17.2 were inspected from the locked install. No second framework is needed.

## Shared API

POST /api/latch/extract accepts a JSON LatchThread:

```json
{
  "threadId": "latch-demo-01",
  "revision": 1,
  "referenceDate": "2026-09-13T13:00:00+08:00",
  "timezone": "Asia/Kuala_Lumpur",
  "messages": [{
    "id": "m1",
    "threadId": "latch-demo-01",
    "author": "Aisha",
    "timestamp": "2026-09-13T13:01:00+08:00",
    "text": "I'll confirm the venue today by 3 PM."
  }]
}
```

Response: LatchExtraction directly, with threadId, revision, commitments, suggestions, dependencies and warnings. All schema fields are required; unknown owner/deadline values use null. Import types from apps/web/src/lib/latch-schema.ts.

Requests require matching loopback Origin and Host and JSON Content-Type. Limits: 50 messages, 2,000 characters each, 450,000 body bytes, 5-second body-read timeout, 30-second model timeout. Safe errors: 400 invalid input, 403 origin/type policy, 413 oversized body, 503 missing credentials, 504 timeout, 502 failed/invalid model output. Responses are no-store.

The server has no authoritative thread database: it validates the model's returned revision against the submitted snapshot. The client rejects results whose thread, revision or content changed during the request. Revisions must increase for every edit, append, reset or date/timezone change; do not reset to 1 within a live editing session.

EvidenceQuote must occur exactly within at least one cited message, not concatenated across messages. Every cited ID must exist in this thread. Unknown named people must be explicitly mentioned; unfamiliar owners and low-confidence commitments require review. Confidence is qualitative, not calibrated probability.

Deadline normalization currently validates explicit today/tomorrow/YYYY-MM-DD plus AM/PM or 24-hour clocks. Other natural-language dates stay in dueText with dueAt null, needsReview true and a warning. Date-only deadlines never get invented midnight times. Fixture persistence preserves "before" wording and its 18:00 boundary. Ben's dependency does not inherit the slides deadline.

Stable IDs use lossless encoding of threadId + sorted evidence IDs + quote-position ordinal. Titles, deadlines and model IDs are excluded. Dependencies are remapped. Edits that split/merge promises or change the set of evidence messages may change identity; review them as new proposals. No stable ID is a provider record ID.

## Frontend integration

The sample fixture and minimal integration page already exist so extraction can be exercised before the UI work. Reuse latchDemo from latch-demo.ts; do not create a competing fixture or fake outputs. The fixed date is available as referenceDate.slice(0, 10).

```tsx
const extraction = useLatchExtraction(thread);
<AppControl thread={thread} extraction={extraction} savedTasks={actualSavedSummaries} />
<button disabled={extraction.loading} onClick={() => void extraction.extractCurrentThread()}>
  Catch commitments
</button>
```

The no-argument catch_commitments tool calls this same operation. Consume extraction.result in graph/card props. It is null for stale revisions. Show extraction.loading, extraction.error, extraction.needsExtraction and a retry button invoking the same function. Do not introduce another fetch call or register catch_commitments twice.

The hook owns extraction only. Saved records belong in Member 3's separate state; do not clear or replace them during extraction, reset, error or retry. Pass actual provider read-back summaries to AppControl.savedTasks. That array is currently omitted because LATCH persistence is not implemented.

Frontend owns subsequent page.tsx/globals.css/graph/card changes. Coordinate edits to schema, validator, hook, app-control.tsx and chat route with the extraction member. Preserve the provider and server approval components.

## Approval member

The inherited incident page is available at /starter, with its original controls in incident-app-control.tsx. The LATCH page has no save controls yet. Do not pass LATCH commitments to the incident API using fake incident IDs. Adapt the real approval layer to thread + stable commitment identity, retaining server session/origin/expiry/immutable review/attempt metadata/read-back. Only browser approval writes; chat/extractor cannot call raw write tools. Preserve saved records across re-extraction.

## Local verification

```powershell
npm.cmd run verify
npm.cmd run typecheck
npm.cmd run build --workspace web
```

Set MODEL_PROVIDER=openai, MODEL and OPENAI_API_KEY in ignored root .env locally. Do not paste credentials into ChatGPT. Start with npm.cmd run dev:web, then in another terminal:

```powershell
node --import tsx apps/web/scripts/check-latch-extraction.ts
```

This makes real paid model calls and checks fixture facts, changes slides from 5 PM to 4 PM, verifies stable identity, then tests tentative/question/injection text. It does not write to Ambiguous. Offline mocked tests cannot establish real inference quality.

Member 3 must separately verify approved create, same-ID fresh read after refresh and decline with actual credentials. The current branch does not claim LATCH persistence or a finished graph.

The unchanged frontend assignment with an appended integration note is in TEAM_FRONTEND_PROMPT.md.
