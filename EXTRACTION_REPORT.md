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
