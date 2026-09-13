# LATCH local AI (no paid model API)

Install Ollama from https://ollama.com/download/windows and run:

```powershell
ollama pull qwen2.5:7b
```

Set root .env (keep existing keys private):

```dotenv
MODEL_PROVIDER=ollama
MODEL=qwen2.5:7b
```

Restart LATCH with npm.cmd run dev:web. Ollama must be running on 127.0.0.1:11434. The local provider sends both extraction and CopilotKit chat to its OpenAI-compatible chat endpoint. The extractor still uses Agent, run and its Zod schema, with exact evidence and deadline validation. No cloud fallback occurs when local inference fails. Ambiguous remains an online service for approved saves; local AI does not make persistence offline.

For the real local extraction check, start the web app and run from the repo root:

```powershell
node --import tsx apps/web/scripts/check-latch-extraction.ts
```

The checker requires four commitments, the separate voice suggestion, slides -> rehearsal, Kuala Lumpur deadlines, no clock for Ben, and a changed deadline with stable ID. It also tests tentative/question/injection-only messages. Successful compilation or unit tests are not evidence that a downloaded model passes this checker.

Extraction currently has a 30-second server deadline and a 35-second browser deadline. Cold model loading can consume part of this budget. Warm the model before a demo; if inference fails, keep the safe error and do not fabricate results.

To return to hosted OpenAI, set MODEL_PROVIDER=openai and MODEL to an available OpenAI model with funded API access, then restart. Keys are never sent to Ollama; the local adapter uses a non-secret placeholder.

Current laptop setup: official Ollama 0.34.0 installer download is in progress. Installation and model pull are not complete; local extraction quality is unverified. Automatic approval review rejected unattended background installation. Run the downloaded installer manually once its download finishes, then ollama pull qwen2.5:7b.

