# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node.js is installed via nvm — always source it first:
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
```

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also validates types via tsc)
npm run lint     # eslint
npx tsc --noEmit # type-check only
```

No test suite exists yet.

## Environment

Single required variable in `.env.local`:
```
GROQ_API_KEY=gsk_...
```
Covers all LLM calls (Llama via Groq) and Whisper STT. The Groq client is lazy-initialised via a Proxy in `lib/groq.ts` — do not instantiate it at module level or the build will fail when the key is absent.

## Architecture

**Next.js 14 App Router, all TypeScript.** Two features: Listening and Oral practice for IB Ab Initio Spanish.

### API routes (`app/api/`)
All routes use `runtime = 'nodejs'` and `maxDuration = 30`. Streaming routes return `text/event-stream` SSE. Binary audio routes return `audio/mpeg`.

- `listening/generate-script` — Groq Llama generates a Spanish script + 5 questions as JSON
- `listening/check-answers` — Groq Llama grades answers as JSON
- `oral/transcribe` — Groq Whisper (`whisper-large-v3-turbo`), accepts `FormData` with an audio blob
- `oral/conversation` — SSE stream, Llama `llama-3.1-8b-instant` acting as "Luis"
- `oral/observe` — non-streaming, Llama `llama-3.3-70b-versatile` returns structured JSON feedback, then emits it as a single SSE event
- `tts` — Microsoft Edge TTS via `msedge-tts` package (`es-ES-AlvaroNeural`), returns MP3 stream. The `MsEdgeTTS` instance is module-level cached and reset on error.

### Oral session flow (`hooks/useOralSession.ts`)
The browser orchestrates all parallelism — the server routes are single-purpose. Turn cycle:
1. Transcribe audio blob → Whisper (serial, both AI calls need the transcript)
2. Fire `conversation` SSE + `observe` in **parallel** via `Promise.all`
3. Stream conversation text into `ConversationPanel`; on completion call `useSpeechSynthesis.speak()`
4. Observer feedback arrives and populates `ObserverPanel`

### MediaRecorder → blob delivery
`useMediaRecorder(onBlobReady)` takes a callback. When recording stops, `onstop` fires `onBlobReadyRef.current(blob)` directly. **Do not poll `audioBlob` state** — that pattern causes a stale closure bug where the polling function never sees the updated value.

### TTS (`hooks/useSpeechSynthesis.ts`)
Calls `/api/tts`, creates an object URL from the returned MP3 blob, and plays it via `new Audio(url)`. This replaces the old browser `SpeechSynthesis` API.

### Prompts (`lib/prompts/`)
- `oral.ts` exports `conversationSystemPrompt(topic)` and `OBSERVER_SYSTEM_PROMPT`. The observer must return **only valid JSON** — parsing is wrapped in try/catch with a fallback object.
- `listening.ts` exports prompt-builder functions. Both listening endpoints strip markdown code fences before `JSON.parse`.

### UI
Tailwind v4 + shadcn/ui (Radix preset). Font: Plus Jakarta Sans. Components in `components/listening/` and `components/oral/`. `ConversationPanel` accepts a `showTranscript` prop — when false, user bubbles render `🎤 your response` instead of the transcript text.
