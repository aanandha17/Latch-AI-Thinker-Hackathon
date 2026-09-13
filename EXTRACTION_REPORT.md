# Current LATCH status — 2026-09-13

The user expanded the assignment to all roles. Extraction, the workspace UI/graph, and the LATCH browser approval/persistence adaptation are implemented on feature/latch-extraction. Earlier role assignments below are historical. Read CONTINUE_HERE.md for the current continuation instructions and DEMO_SCRIPT.md for rehearsal.

Latest offline verification: npm.cmd run verify passed 68 web tests and workspace typechecks; npm.cmd run typecheck passed. The inherited Windows agent-core/channel glob issue remains; previous explicit runs passed 37 and 22 tests. Production build status is recorded in EXTRACTION_REPORT.md.

Current UI files: page.tsx, globals.css, layout.tsx, providers.tsx, app-control.tsx, commitment-card.tsx, commitment-graph.tsx, latch-review.tsx, latch-saved.tsx. Approval files: latch-approval.ts, latch-task-client.ts, use-latch-workplace.ts, server/latch-approval-domain.ts, server/latch-approval-http.ts, server/latch-approvals.ts, api/latch/tasks/route.ts. New tests cover service, HTTP and graph rendering. The generic followup-client factory now accepts an optional endpoint; its existing default stays unchanged.

API additions: GET /api/latch/config returns only chatConfigured. GET /api/latch/tasks?session=1 establishes the HttpOnly approval session; GET with threadId lists real records and optional taskId retrieves one. POST operation=propose accepts thread, extraction, commitmentId and reviewed {title,owner,dueText,dueAt}; returns an immutable proposal. POST approve or deny accepts only proposalId plus operation. Only browser approval can write; proposal creation and chat tools cannot. Keep the full thread/extraction snapshot when opening review and invalidate it after revision changes. Saved records remain separate from extraction state.

Browser checked at 1366x768: all five sample messages, missing-credential extraction error, revision increment after deadline edit, and honest unsaved/provider setup states. Graph direction and no-deadline labels are covered by rendered component tests. Live populated graph screenshots and full keyboard approval checks remain pending real extraction.

Credentials intentionally deferred by user. Real inference, changed-deadline inference, live CopilotKit chat, and actual Ambiguous approve/read-back/decline have NOT been verified. No external record was created. Do not present offline test fixtures as live results.

---
# Extraction implementation report

## Completed

Implemented the structured schema, semantic validation, stable IDs and dependency remapping, tool-free server extractor, protected POST route, shared client operation, CopilotKit catch_commitments tool and a minimal editable integration page.

Both frontend entry points share extractCurrentThread. Overlapping calls share one promise. Changed thread/revision/content causes stale results to be discarded. Extraction owns no saved-record state and has no external write API.

## Files

Original LATCH code:
- apps/web/src/lib/latch-schema.ts
- apps/web/src/lib/latch-demo.ts (sample input only, created early for integration)
- apps/web/src/lib/latch-validate.ts
- apps/web/src/lib/latch-extraction-client.ts
- apps/web/src/lib/use-latch-extraction.ts
- apps/web/src/lib/latch-chat-prompt.ts
- apps/web/src/lib/server/latch-extract.ts
- apps/web/src/lib/server/latch-extract-core.ts (injectable execution logic for offline tests)
- apps/web/src/lib/server/latch-extract-http.ts
- apps/web/src/app/api/latch/extract/route.ts
- apps/web/src/components/app-control.tsx
- apps/web/src/app/page.tsx (minimal integration presentation)
- apps/web/src/lib/latch-test-fixture.ts (offline expected values; never imported by production)
- apps/web/src/lib/latch-validate.test.ts
- apps/web/src/lib/latch-extraction-client.test.ts
- apps/web/src/lib/server/latch-extract.test.ts
- apps/web/scripts/check-latch-extraction.ts

Adapted starter route: apps/web/src/app/api/copilotkit/[[...path]]/route.ts adds only the web-specific prompt, preserving factory/provider/maxSteps/workplace:false.

Preserved incident reference: apps/web/src/app/starter/page.tsx and apps/web/src/components/incident-app-control.tsx. Original incident data, approval service/UI, provider and shared agent remain intact.

Documentation: BUILD_PLAN.md, BUILD_LOG.md, TEAM_HANDOFF.md, TEAM_FRONTEND_PROMPT.md, EXTRACTION_REPORT.md, README.md introduction. All other added source files are inherited from the official starter at 5c8bf4c810bcd3abadaf573f7575bb73e098b03e, imported because the team's repo was empty.

## Verification on 2026-09-13

- npm.cmd run verify: PASS, including all workspace typechecks and 52 web tests (18 new LATCH tests).
- npm.cmd run typecheck: PASS.
- npm.cmd run build --workspace web: PASS. The inherited Google Vertex import emits a dynamic-dependency warning; build completes.
- The inherited agent-core/channel npm test scripts discover zero tests under Windows due to single-quoted patterns. Running explicit filenames from each respective workspace passes another 37 model tests and 22 Channels tests. An initial supplemental run from the repository root failed to load the Channels JSX config; rerunning from the correct workspace resolved it without code changes.
- Lockfile SHA-256 matches the official starter: DE1E4599539D6971A57379E6E57FED4AB3FF89EA674ADBED511D617E648339E9.
- Browser smoke check: exact five sample messages visible; missing-credential error and Retry work; adding a message increments revision from 1 to 2; original fixture restored by reload.
- No local .env was present during verification. Live inference, changed-deadline live verification and chat inference are PENDING credentials. Offline fixtures are not evidence of real model behavior.
- npm ci reports 8 moderate and 2 high dependency advisories. No lockfile updates or audit auto-fixes were applied.

## Contract and integration

See TEAM_HANDOFF.md for the complete request shape, response contract, safe HTTP statuses, supported deadline forms and code wiring. Frontend role should branch from origin/feature/latch-extraction, reuse latchDemo/useLatchExtraction/AppControl and replace presentation. Member 3 must connect actual LATCH approval/read-back records separately.

## Remaining

Configure MODEL and OPENAI_API_KEY locally, restart the app, and run:
node --import tsx apps/web/scripts/check-latch-extraction.ts

The checker performs real fixture and adversarial inference and changes slides from 5 PM to 4 PM, asserting the normalized deadline changes while the stable ID remains unchanged.

The graph, LATCH approval/persistence adaptation, visual polish and final demo remain assigned to the other team members. Browser tab metadata is still inherited and can be updated during frontend polish. No deployment, merge to main, app publication or submission was performed.

## Final full-scope build check
Production build PASS after restoring the CopilotKit required runtime URL. Only inherited Google Vertex dynamic-dependency warning remains. Offline production workspace screenshot: docs/screenshots/workspace-offline.png. No model output is shown or claimed. Initial build failure from an omitted runtimeUrl was corrected before this successful build.

## Credential-configured live attempt
All three environment settings are present. Live extraction attempted but did not pass. A minimal direct OpenAI request returned HTTP 429, code credit_balance_exhausted, type insufficient_quota. No successful live extraction or saved record is claimed. Fixed the checker's top-level await incompatibility by using an async main function; npm.cmd run typecheck passed. Resume live checker after API billing is funded.

