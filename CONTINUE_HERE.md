# Continue LATCH on the next laptop

The user expanded the assignment to cover extraction, frontend, graph and browser-approved persistence. Continue the existing implementation; do not restart or replace it with fixture answers.

## Repository and transfer
Repository: https://github.com/aanandha17/Latch-AI-Thinker-Hackathon.git
Branch: feature/latch-extraction
Current laptop: C:\AI Empire\Hackathon\Latch-AI-Thinker-Hackathon
The previous GitHub push was blocked by canceled authentication. Confirm this branch exists remotely before cloning it; otherwise transfer the Git bundle supplied alongside the project. Never assume main contains this work.

Read AGENTS.md, BUILD_PLAN.md, hackathon-overview.md, hackathon-rules.md, using-sponsor-tools.md, apps/web/README.md and EXTRACTION_REPORT.md. Preserve the installed lockfile and CopilotKit /v2 API, fresh agent creation, workplace:false and maxSteps:10.

## Implemented
- Typed Zod thread/extraction contract, exact evidence checks, conservative timezone deadlines, tentative language handling, stable evidence-based IDs, graph validation.
- Tool-free OpenAI Agents SDK extraction and bounded origin-protected HTTP transport; invalid output never falls back to sample results.
- Shared button/CopilotKit extraction operation, concurrency guard, revision discard and retry.
- Sample conversation editor/composer, commitment graph, evidence cards, suggestions outside approval, browser review dialog.
- Separate LATCH approval service and HTTP endpoint with immutable session-bound proposals, expiry, workspace identity, duplicate-attempt protection and provider read-back.
- Saved-task reads retain actual provider IDs and metadata. Chat cannot approve or call raw workplace write tools.
- Original incident reference remains at /starter.

## Next work
The user explicitly chose OFFLINE work; credentials are not configured. Do not claim live success.
1. Install using npm.cmd ci on the new laptop. Configure root .env locally using .env.example. Set MODEL, OPENAI_API_KEY and AMBIGUOUS_API_KEY; never paste or commit secrets.
2. Run npm.cmd run verify, npm.cmd run typecheck, npm.cmd run build --workspace web. Windows inherited agent-core/channel test scripts match zero files because of single quotes; run their test files explicitly as noted in EXTRACTION_REPORT.md.
3. Run npm.cmd run dev:web; open http://127.0.0.1:3100.
4. Run the real extraction checker in apps/web/scripts/check-latch-extraction.ts using node --env-file-if-exists=../../.env --import tsx from apps/web. It requires an active local server. Inspect script usage before running. Confirm four commitments, voice suggestion, slides -> rehearsal, Ben without clock, deadlines 15:00/17:00/18:00 +08:00.
5. Change slides 5 PM to 4 PM; extract again. Confirm changed deadline with stable ID. Run ambiguity/injection checks without writes.
6. Review one real commitment in a demo workspace. Only click browser Approve after checking the exact immutable proposal. Refresh/restart and retrieve the same provider ID. Decline a second proposal and confirm no creation.
7. Verify keyboard dialog focus/escape, graph layout at 1366x768 and screenshots with real validated extraction. Optional local delay simulation only after the live core path passes; never modify a saved record for that scenario.
8. Record actual outcomes in EXTRACTION_REPORT.md and prepare the two-minute demo in DEMO_SCRIPT.md.

Do not discard .data/latch-approvals after an uncertain write. It stores local attempt protection; reconcile provider state before continuing on a different laptop. Do not transfer credentials in Git or publish private proposal state.

Commit only your changes. Push the feature branch only with working authorized authentication. Do not merge main, force-push, deploy, publish the app or submit.
The previous user's budget stop was before 50 credits remaining on their account; do not assume the next teammate's account has the same spending authorization.
