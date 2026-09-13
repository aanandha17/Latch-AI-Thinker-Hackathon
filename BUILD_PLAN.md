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
