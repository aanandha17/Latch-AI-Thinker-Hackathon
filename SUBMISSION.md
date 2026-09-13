# Submission checklist

Choose your city on the [global event page](https://aitinkerers.org/hackathons/global/agents-everywhere). Use that city's participant portal for the submission deadline and published judging criteria, and its handbook for eligibility and required deliverables. See [hackathon-rules.md](hackathon-rules.md) for the agent-readable summary.

## Build eligibility

- [ ] Our submitted project is a net-new build created during the official hackathon period
- [ ] Its core functionality was built during the event; we are not resubmitting or extending a pre-existing project and entering it as new
- [ ] We identify inherited templates, libraries, prompts, components, and starter code separately from our event work

**What we inherited**

The official Agents, Everywhere starter kit supplied the Next.js and
CopilotKit web infrastructure, dependency setup, example interaction patterns,
and an Ambiguous MCP integration pattern. We reused those building blocks and
their documented security constraints.

**What we built during the hackathon**

LATCH is our conversation-to-commitment workflow: typed structured extraction,
exact-message evidence validation, stable commitment IDs, suggestion
separation, dependency-cycle protection, a Commitment Graph, editable review,
an immutable approval proposal, and durable Ambiguous task creation with
read-back and duplicate prevention. The team must confirm the build timing
before checking the eligibility boxes above.

## Title and description

**What you built**

**LATCH — conversation commitment agent.** It reads a busy team conversation,
separates accepted commitments from suggestions, extracts owners and stated
deadlines, maps dependencies, and preserves an exact evidence quote for every
item. A person reviews the fields before LATCH creates a real Ambiguous task;
the app then reads that provider record back and prevents duplicate saves.

**Who it is for**

Small, fast-moving teams coordinating launches, hackathons, and projects in
chat, where members cannot read every message and verbal promises are easily
lost.

**Why the context matters**

LATCH sees the thread’s authors, timestamps, message IDs, exact wording, and
current review state. Without that surrounding context, a standalone chatbot
would require users to paste the conversation manually and could not prove
which message supports a commitment or whether a dependency was actually
stated.

**Sponsor technologies used**

- **CopilotKit:** contextual in-app assistant and UI integration.
- **OpenRouter:** free routed model used for structured commitment extraction.
- **Ambiguous AI:** persistent task creation, provider identity, exact
  read-back, and refresh verification.

Exa is configured for optional research, but it is not part of the ordinary
web workflow shown in the core demo and should not be claimed unless the team
adds and demonstrates that interaction.

## Evidence for the judging criteria

Judges score each of the four official criteria from 1–5. This checklist helps you gather evidence; it does not guarantee a score. A working starter is a foundation for your own project.

| Official criterion | Show in your project and demo |
|---|---|
| Core Requirements & Functionality | Run one complete workflow in the intended environment, from user request through tools to a verified result. Repeat it with live integrations; offline tests alone do not prove the deployed flow. |
| Innovation & Theme Alignment | Show the surrounding context before the prompt and explain the original interaction it enables. Compare with the context removed: what value would a standalone chatbox lose? |
| Technical Execution & Integration | Show how tools, data, and the environment connect. Demonstrate a relevant failure or cancellation path and explain recovery, state persistence, and integration limits. |
| Usefulness & Agentic Experience | Identify the user and problem, show a meaningful action in the surface, and demonstrate clear feedback and appropriate user control. Explain what work the agent saves. |

- [ ] We can point to visible evidence for every criterion
- [ ] We distinguish live services, sample data, session-only state, and standalone recipes
- [ ] Sponsor technologies contribute to the workflow; their count is not a judging criterion

## Public repository

- [ ] A new participant can run the quickstart from a clean clone
- [ ] The README lists the credentials and separate processes required
- [ ] `npm run verify` passes; optional recipe checks pass if used
- [ ] `.env`, tokens, generated traces with sensitive data, and account secrets are excluded
- [ ] Sample data, session-only state, and unimplemented integrations are clearly labeled

## Two-minute demo video

Use [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the timed recording flow.

- [ ] Show the surface and existing context before the prompt
- [ ] Demonstrate one complete interaction
- [ ] Show a visible result: an actual record, local state change, or research source links
- [ ] If showing an approval, distinguish the decision from execution and demonstrate the resulting behavior
- [ ] State which sponsor technologies made the interaction possible
- [ ] Keep the video within the event's limit and check audio

See [demo prompts](dev-docs/demo-prompts.md) for a reproducible incident workflow.

## Social post and final submission

- [ ] Follow the organizer's posting and sponsor-tagging instructions
- [ ] Link the public repository and video
- [ ] Credit the sponsors you used and applicable local partners
- [ ] Check the live integration once more before recording or submitting
- [ ] Inspect the repository, video and screenshots for secrets

Prepare the post and submission for a human to publish; running the starter kit
does not publish either automatically.
