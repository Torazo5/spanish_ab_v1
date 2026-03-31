# Architecture

## High-Level Pattern

Next.js 14 App Router with a clear client/server split:
- **Server**: Stateless API routes (`app/api/`) — each route does one thing (transcribe, chat, observe, TTS, generate script, check answers)
- **Client**: Browser orchestrates all parallelism and state via React hooks (`hooks/`)
- **No database** — all state lives in React component state for the session duration

## Data Flows

### Oral Practice Session

```
[Setup] User picks topic + mode → starts session

[Opening Turn]
  OralPage → useOralSession.startSession(topic)
    → POST /api/oral/conversation (SSE stream, initial=true)
    → AI response streamed into ConversationPanel
    → useSpeechSynthesis.speak(text) → POST /api/tts → MP3 playback
    → Phase: idle → ai-speaking → waiting-for-user

[User Turn Cycle]
  User presses mic → useMediaRecorder records → blob via onBlobReady callback

  1. SERIAL: POST /api/oral/transcribe (Whisper STT)
     ↓ transcript

  2. PARALLEL (Promise.all):
     A: POST /api/oral/conversation (SSE stream) → streamed into ConversationPanel
     B: POST /api/oral/observe (non-streaming Llama) → ObserverFeedback JSON → ObserverPanel

  3. When conversation stream completes:
     → useSpeechSynthesis.speak(fullText) → POST /api/tts → MP3 playback
     → Phase: recording → transcribing → processing → ai-speaking → waiting-for-user
```

### Listening Practice Session

```
  1. User picks topic → POST /api/listening/generate-script
     → Llama generates Spanish script + 5 questions as JSON
     → Script displayed + played via TTS

  2. User answers questions → POST /api/listening/check-answers
     → Llama grades each answer → feedback displayed
```

### TTS Pipeline

```
  useSpeechSynthesis.speak(text)
    → POST /api/tts { text }
    → MsEdgeTTS (es-ES-AlvaroNeural) generates MP3 stream
    → Browser creates object URL from blob → new Audio(url).play()
    → Cleanup: URL.revokeObjectURL on end/error
```

## Key Abstractions

### OralPhase State Machine
`idle → ai-speaking → waiting-for-user → recording → transcribing → processing → ai-speaking → ...`

Defined in `lib/types.ts`, managed by `useOralSession`. The phase drives UI state (mic button enabled/disabled, loading indicators).

### Groq Client Singleton
`lib/groq.ts` exports a `Proxy`-based lazy singleton. The real `Groq` instance is created on first property access, avoiding build failures when `GROQ_API_KEY` is absent. A `MODELS` registry maps logical roles to specific model IDs.

### MediaRecorder → Blob Delivery
`useMediaRecorder(onBlobReady)` uses a ref-based callback pattern to avoid stale closures. When recording stops, `onstop` fires the callback directly — no polling.

## API Route Conventions

- All routes: `runtime = 'nodejs'`, `maxDuration = 30`
- Streaming routes: Return `text/event-stream` SSE with `event:` + `data:` lines
- JSON routes: Standard `NextResponse.json()`
- Binary routes: Return `audio/mpeg` ReadableStream
- LLM JSON responses: Strip markdown code fences before `JSON.parse`, with try/catch fallbacks

## Error Handling

- API routes: try/catch with fallback objects (observer) or error responses (generate-script, TTS)
- Client: Error state in `OralPage`, displayed as inline red text
- TTS: Module-level instance reset on error so next request gets a fresh connection
- Observer: Accent/capitalization artifacts from Whisper are filtered out via Unicode normalization

## Cross-Cutting Concerns

- **No authentication** — single-user local tool
- **No persistence** — session state lost on page refresh
- **No rate limiting** — relies on Groq's free tier limits
- **SSE for streaming** — conversation and observer both use SSE, but observer emits a single event after non-streaming LLM call
