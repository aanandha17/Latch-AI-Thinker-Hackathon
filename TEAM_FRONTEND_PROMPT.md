You are responsible for the frontend, Commitment Graph, and final demo experience for our LATCH hackathon project.

Before editing, read AGENTS.md, BUILD_PLAN.md, hackathon-overview.md, hackathon-rules.md, using-sponsor-tools.md, apps/web/README.md, and the root/web package files. Preserve the existing starter architecture, dependencies, lockfile, CopilotKit provider, approval components, and Ambiguous functionality.

Work on branch: feature/latch-ui.

Your responsibilities:

1. Create apps/web/src/lib/latch-demo.ts containing the reproducible sample conversation:
   - threadId: latch-demo-01
   - date: 2026-09-13
   - timezone: Asia/Kuala_Lumpur
   - revision: 1
   - m1 Aisha 13:01: I'll confirm the venue today by 3 PM.
   - m2 Marcus 13:02: I'll finish the three demo slides today by 5 PM.
   - m3 Ben 13:03: I'll start rehearsal after Marcus finishes the slides.
   - m4 Aisha 13:04: Maybe we should add voice later.
   - m5 Marcus 13:05: I'll test persistence today before 6 PM.

2. Build the one-page team workspace in:
   - apps/web/src/app/page.tsx
   - apps/web/src/app/globals.css
   - any new presentation-only components you create.

3. Show:
   - Sample team workspace label
   - thread date and timezone
   - author, timestamp, message ID, and message text
   - local message composer
   - Catch commitments button location
   - results and graph area
   - Saved in Ambiguous section

4. Create:
   - apps/web/src/components/commitment-graph.tsx
   - apps/web/src/components/commitment-card.tsx

5. The graph must:
   - display owner, action, deadline, evidence, status, and review state
   - visibly show slides -> rehearsal
   - label the edge “must finish before”
   - keep suggestions outside task approval controls
   - show unknown deadlines as “No deadline stated”
   - support keyboard-accessible controls
   - remain readable at 1366×768 and 100% zoom

6. Do not hardcode fake extraction results, saved IDs, successful states, or provider links. Consume validated data from Member 2 through typed props or shared state.

7. Do not implement the OpenAI extraction endpoint or modify the server-side approval logic. Coordinate before editing any file owned by another member.

8. Only after the core path works, optionally add the local delay scenario:
   - slides move from 5 PM to 6 PM
   - rehearsal is marked as possibly starting later
   - no Ambiguous record is changed
   - the scenario is clearly labelled as local and unsaved

9. Finish the visual polish, screenshot, two-minute demonstration preparation, and accurate README visual/demo sections. Do not claim unfinished features.

Verification:
- Check all five fixture messages manually.
- Confirm the revision changes when a message is added.
- Confirm the graph arrow points from slides to rehearsal.
- Confirm m4 remains a suggestion.
- Run npm.cmd run typecheck.
- Run npm.cmd run build --workspace web.
- Report changed files, test results, screenshots, and remaining integration needs.
- Commit only your files. Do not merge main, deploy, publish, or submit.

Additional integration instructions from the extraction handoff:

Read TEAM_HANDOFF.md and BUILD_LOG.md first. The role numbers in the team prompts differ; “Member 2” above means the extraction role. Start feature/latch-ui from the completed origin/feature/latch-extraction commit, since main was initially empty. Do not merge main.

latch-demo.ts and a minimal page already exist to verify extraction. Reuse and improve them instead of replacing the shared data contract. The date is represented by referenceDate: "2026-09-13T13:00:00+08:00". Every message has id, threadId, author, timestamp and text. Preserve the exact five messages and increment revision on every conversation/date/timezone change.

Use useLatchExtraction(thread) from apps/web/src/lib/use-latch-extraction.ts. Pass the same controls to AppControl and the Catch commitments button. The existing no-argument catch_commitments tool already invokes extractCurrentThread. Do not create a second extraction fetch, tool registration, provider or chat framework. Render extraction.result through typed graph/card props; handle loading, error, retry and needsExtraction. Stale results must remain hidden.

Saved records are independent Member 3 state. Never clear them on re-extraction or label detections as saved. Pass only actual provider read-back summaries through AppControl.savedTasks. Keep suggestions outside approval controls. Do not wire the incident approval API to LATCH using fabricated incident IDs. The inherited reference is at /starter until Member 3 completes the LATCH migration.

Do not edit extraction schema, validator, server endpoint, shared hook or chat route without coordinating. Use the existing qualitative confidence and needsReview fields. Refer to TEAM_HANDOFF.md for supported deadline normalization and stable ID limitations.

After local credentials are configured and the server runs, execute:
node --import tsx apps/web/scripts/check-latch-extraction.ts
Record its actual result; offline tests alone do not establish live inference or persistence. Preserve the original assignment above and report any remaining blocker truthfully.
