# External Integrations

**Analysis Date:** 2026-03-30

## APIs & External Services

### Groq Cloud API

The sole external API. One API key covers all LLM and STT usage.

**SDK/Client:** `groq-sdk` ^1.1.2
**Client location:** `lib/groq.ts`
**Auth:** `GROQ_API_KEY` env var (Bearer token, set in `.env.local`)

**Initialization pattern:** The Groq client is lazy-initialized via a `Proxy` to avoid instantiation at module load time (which would fail during build when the env var is absent).

```typescript
// lib/groq.ts - DO NOT instantiate at module level
export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    return (getGroq() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
```

**Models used (defined in `lib/groq.ts` as `MODELS`):**

| Constant | Model ID | Free Tier Limit | Used By |
|----------|----------|-----------------|---------|
| `conversation` | `llama-3.1-8b-instant` | 14,400 req/day | `app/api/oral/conversation/route.ts` |
| `observer` | `llama-3.3-70b-versatile` | 1,000 req/day | `app/api/oral/observe/route.ts` |
| `listening` | `llama-3.3-70b-versatile` | 1,000 req/day | `app/api/listening/generate-script/route.ts`, `app/api/listening/check-answers/route.ts` |
| `whisper` | `whisper-large-v3-turbo` | - | `app/api/oral/transcribe/route.ts` |
| `drillDeeper` | `llama-3.1-8b-instant` | 14,400 req/day | `app/api/oral/drill-deeper/route.ts` |

**API endpoints used:**
- `groq.chat.completions.create()` - LLM text generation (both streaming and non-streaming)
- `groq.audio.transcriptions.create()` - Whisper speech-to-text

**Streaming:** The `conversation` route uses `stream: true` and returns SSE (`text/event-stream`). The `observe` route calls non-streaming but wraps the response in SSE format for client consistency.

### Microsoft Edge TTS

**Package:** `msedge-tts` ^2.0.4
**Route:** `app/api/tts/route.ts`
**Auth:** None required (uses Edge's public TTS websocket endpoint)
**Voice:** `es-ES-AlvaroNeural` (Spanish, Spain)
**Format:** `AUDIO_24KHZ_48KBITRATE_MONO_MP3`

**Caching pattern:** The `MsEdgeTTS` instance is module-level cached and reused across requests. On error, it is set to `null` so the next request creates a fresh connection.

```typescript
// app/api/tts/route.ts
let tts: MsEdgeTTS | null = null
async function getTts(): Promise<MsEdgeTTS> {
  if (!tts) {
    tts = new MsEdgeTTS()
    await tts.setMetadata('es-ES-AlvaroNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
  }
  return tts
}
```

**Response:** Returns raw MP3 audio stream with `Content-Type: audio/mpeg` and 1-hour cache header.

### Google Fonts (CDN)

**Used in:** `app/layout.tsx`
**Font:** Plus Jakarta Sans via `next/font/google`
**Loaded at:** Build time (Next.js optimizes and self-hosts the font)

## Data Storage

**Databases:** None. The application is entirely stateless.

**File Storage:** None. Audio blobs are transient (browser MediaRecorder to API to Whisper, never persisted).

**Caching:**
- Module-level in-memory caching for `MsEdgeTTS` instance (`app/api/tts/route.ts`)
- Module-level lazy init for `Groq` client (`lib/groq.ts`)
- No external cache (Redis, etc.)

## Authentication & Identity

**Auth Provider:** None. The app has no user accounts or authentication. It is a single-user local tool.

## Monitoring & Observability

**Error Tracking:** None (no Sentry, etc.)

**Logs:** `console` only (implicit via Next.js dev server output). No structured logging framework.

## CI/CD & Deployment

**Hosting:** Not configured. Compatible with any Next.js-capable host (Vercel, etc.).

**CI Pipeline:** None configured. No GitHub Actions or similar.

## Environment Configuration

**Required env vars:**
| Variable | Location | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | `.env.local` | Authenticates all Groq API calls (LLM + Whisper STT) |

**Env files present:**
- `.env.local` - Contains the actual key (gitignored)
- `.env.example` - Documents required variables with placeholder values

**Secrets location:** Local `.env.local` file only. No secrets manager or vault.

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None

## Browser APIs Used

These are not external integrations per se, but the app relies on browser-side APIs that affect compatibility:

- **MediaRecorder API** - Records user audio for oral practice (`hooks/useMediaRecorder.ts`)
- **Audio API** - `new Audio(url)` plays TTS MP3 responses (`hooks/useSpeechSynthesis.ts`)
- **Fetch with SSE** - Consumes `text/event-stream` responses from conversation and observer routes

## Rate Limit Awareness

The app operates within Groq's free tier. The primary bottleneck is the `llama-3.3-70b-versatile` model at 1,000 req/day, shared between:
- Observer feedback (1 call per oral turn)
- Listening script generation (1 call per script)
- Listening answer checking (1 call per submission)

The `llama-3.1-8b-instant` model at 14,400 req/day is used for conversation and drill-deeper, which is more generous.

---

*Integration audit: 2026-03-30*
