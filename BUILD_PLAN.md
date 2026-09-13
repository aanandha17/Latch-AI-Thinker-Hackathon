# Current LATCH status — 2026-09-13

The user expanded the assignment to all roles. Extraction, the workspace UI/graph, and the LATCH browser approval/persistence adaptation are implemented on feature/latch-extraction. Earlier role assignments below are historical. Read CONTINUE_HERE.md for the current continuation instructions and DEMO_SCRIPT.md for rehearsal.

Latest offline verification: npm.cmd run verify passed 68 web tests and workspace typechecks; npm.cmd run typecheck passed. The inherited Windows agent-core/channel glob issue remains; previous explicit runs passed 37 and 22 tests. Production build status is recorded in EXTRACTION_REPORT.md.

Current UI files: page.tsx, globals.css, layout.tsx, providers.tsx, app-control.tsx, commitment-card.tsx, commitment-graph.tsx, latch-review.tsx, latch-saved.tsx. Approval files: latch-approval.ts, latch-task-client.ts, use-latch-workplace.ts, server/latch-approval-domain.ts, server/latch-approval-http.ts, server/latch-approvals.ts, api/latch/tasks/route.ts. New tests cover service, HTTP and graph rendering. The generic followup-client factory now accepts an optional endpoint; its existing default stays unchanged.

API additions: GET /api/latch/config returns only chatConfigured. GET /api/latch/tasks?session=1 establishes the HttpOnly approval session; GET with threadId lists real records and optional taskId retrieves one. POST operation=propose accepts thread, extraction, commitmentId and reviewed {title,owner,dueText,dueAt}; returns an immutable proposal. POST approve or deny accepts only proposalId plus operation. Only browser approval can write; proposal creation and chat tools cannot. Keep the full thread/extraction snapshot when opening review and invalidate it after revision changes. Saved records remain separate from extraction state.

Browser checked at 1366x768: all five sample messages, missing-credential extraction error, revision increment after deadline edit, and honest unsaved/provider setup states. Graph direction and no-deadline labels are covered by rendered component tests. Live populated graph screenshots and full keyboard approval checks remain pending real extraction.

Credentials intentionally deferred by user. Real inference, changed-deadline inference, live CopilotKit chat, and actual Ambiguous approve/read-back/decline have NOT been verified. No external record was created. Do not present offline test fixtures as live results.

---
# LATCH build plan

## Foundation and ownership

Official starter imported on 2026-09-13 from https://github.com/CopilotKit/agents-everywhere-starter-kit at 5c8bf4c810bcd3abadaf573f7575bb73e098b03e. Preserve LICENSE, package-lock.json, CopilotKit /v2, the provider, fresh agent creation, workplace:false and maxSteps:10. No changes to Channels or mobile implementations.

The extraction member works on feature/latch-extraction. The frontend member continues on feature/latch-ui from the extraction commit, not the empty main branch. Member 3 owns LATCH approval/persistence adaptation. See TEAM_HANDOFF.md for exact contracts and ownership. Member numbers differ between the supplied prompts; use these role names.

## Extraction scope

- latch-schema.ts and latch-validate.ts: shared types, evidence/graph/deadline checks and stable identity.
- server/latch-extract.ts and server/latch-extract-http.ts: tool-free Agents SDK extraction and bounded HTTP transport.
- api/latch/extract/route.ts: trusted-origin server endpoint.
- latch-extraction-client.ts and use-latch-extraction.ts: one operation, concurrency and revision checks, no saved-record mutation.
- app-control.tsx and a web-only chat prompt: catch_commitments and current context.
- A minimal sample/integration page for verification. Frontend member owns subsequent visual development and commitment graph.
- Offline tests and a credential-dependent live check with a changed deadline.

## Frontend scope

Reuse the shared fixture if already present. Own page.tsx, globals.css, commitment-graph.tsx and commitment-card.tsx. Consume useLatchExtraction and pass its same extractCurrentThread function to AppControl and the button. Never invent extraction or saved records.

## Member 3 scope

Adapt inherited followup HTTP/service/UI to LATCH thread + stable commitment identity. Preserve sessions, origin checks, immutable proposals, expiry, duplicate attempts and fresh provider read-back. Only browser approval creates external records. Existing incident reference remains available until that migration; do not map LATCH commitments to incident IDs.

## Verification

Run npm.cmd run verify, npm.cmd run typecheck and npm.cmd run build --workspace web. Then configure local OpenAI credentials and run the live extraction checker. Member 3 separately verifies approved create, same-ID read-back and decline. No merging main, deployment, publishing of the app or submission. Push only the requested feature branch after reviewing staged files.
