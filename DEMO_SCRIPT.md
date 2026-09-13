# LATCH two-minute demo

## Before recording

- Start the web app with `npm run dev:web` and open `http://127.0.0.1:3100`.
- Confirm OpenRouter and Ambiguous show as connected; keep all keys and `.env`
  out of the recording.
- Delete or clearly ignore earlier test records in Ambiguous.
- Free OpenRouter extraction may queue. Record the full run, then remove only
  the idle waiting time in the final edit.

## Script

**0:00–0:15 — Problem**

“Busy team chats contain promises, deadlines, and dependencies, but important
work is easily missed. LATCH turns the conversation already on screen into a
reviewable commitment graph.”

**0:15–0:35 — Conversation context**

Show the launch-day thread. Add: “I’ll finish the demo video tonight by 9 PM.”
Point out that the thread also contains a suggestion—“Maybe we should add
voice later”—which must not become a commitment.

**0:35–0:55 — Agent extraction**

Click **Catch commitments**. After the optional jump cut, show the extracted
owners, deadlines, exact evidence quotes, and the dependency from finishing
the slides to starting rehearsal.

“OpenRouter powers the structured extraction. LATCH validates every result
against the real messages, so invented owners, quotes, and dependency cycles
are rejected.”

**0:55–1:20 — Human control**

Select **Review before saving** for “Start rehearsal.” Show the editable title,
owner, and due fields, plus the read-only evidence and prerequisite.

“Detection is not permission to write. LATCH requires an explicit review and
a separate approval.”

**1:20–1:45 — Durable action**

Click **Prepare approval proposal**, inspect the exact payload, then click
**Approve & save to Ambiguous**.

“Ambiguous creates the real workplace task only after approval. LATCH reads
the provider record back and displays its actual ID.”

**1:45–2:00 — Proof and value**

Click **Refresh from Ambiguous** and show that the same task returns with a
**Saved** badge and cannot be duplicated.

“CopilotKit supplies the contextual in-app experience, OpenRouter supplies the
model, and Ambiguous supplies durable workplace records. LATCH helps teams
recover decisions without rereading the entire chat.”

## Recording checklist

- Show the conversation before extraction.
- Show commitments, the separated suggestion, evidence, and a dependency.
- Show the approval boundary and the returned Ambiguous record ID.
- Refresh once to prove persistence and duplicate prevention.
- Do not show `.env`, API keys, personal email, or private workspace data.

