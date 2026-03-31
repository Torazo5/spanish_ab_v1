# Concerns

## Security

| Concern | Severity | Details |
|---------|----------|---------|
| No input validation on API routes | Medium | Request bodies are cast with `as` — no runtime validation. Malformed requests could cause unexpected behavior. |
| API key in env only | Low | `GROQ_API_KEY` in `.env.local` — appropriate for a local dev tool, but no server-side rate limiting if deployed. |
| No CORS restrictions | Low | Next.js API routes are same-origin by default. Only a concern if deployed publicly. |
| No auth | Low | Single-user tool — appropriate for current use case. |

## Performance

| Concern | Severity | Details |
|---------|----------|---------|
| Sequential transcription bottleneck | Medium | Whisper transcription is serial before conversation + observer can start. Adds ~1-2s latency per turn. |
| TTS singleton race condition | Low | If two TTS requests fire concurrently and one errors, the singleton resets mid-stream for the other. Unlikely in current single-user flow. |
| No audio caching | Low | Same TTS text generates a new MP3 every time. Could cache repeated phrases. |
| Large bundle from lucide-react | Low | Tree-shaking should handle this, but worth checking bundle size. |

## Reliability

| Concern | Severity | Details |
|---------|----------|---------|
| No retry logic | Medium | All Groq API calls are fire-once. Network blips or rate limits cause immediate failure. |
| Observer JSON parsing fragile | Medium | Relies on LLM producing valid JSON. Fallback object has empty `correctedSentence` which may confuse UI. |
| Session state lost on refresh | Medium | No persistence — entire conversation and feedback history gone on page reload. |
| Stale closure risk in hooks | Low | Mitigated by ref pattern, but any new callback that captures state directly could re-introduce the bug. |
| MediaRecorder browser support | Low | `getSupportedMimeType()` tries multiple formats, but some browsers (Safari) may have limited codec support. |

## Tech Debt

| Item | Details |
|------|---------|
| `drill-deeper` route untracked | New API route exists but not yet committed or integrated into UI. |
| `ErrorCard` component untracked | New component exists but not committed. |
| Backwards-compat alias in groq.ts | Both `groq` (Proxy) and `getGroq()` exported — routes use the proxy, but the dual export is confusing. |
| Observer uses SSE for single event | Returns `text/event-stream` but only emits one `feedback` event then closes. Could be a simpler JSON response. |
| Hardcoded 60s recording limit | `MAX_RECORDING_SECONDS` not configurable. May need adjustment for different practice scenarios. |

## Dependency Risks

| Package | Risk | Details |
|---------|------|---------|
| `msedge-tts` | Medium | Unofficial package that reverse-engineers Microsoft Edge's TTS API. Could break if Microsoft changes their endpoint. |
| `groq-sdk` | Low | Official SDK, actively maintained. Free tier limits (1,000 req/day for 70b model) could be hit with heavy use. |
| Tailwind v4 | Low | Relatively new major version — some ecosystem tools may not fully support it yet. |

## Scalability

Not a primary concern for a single-user study tool, but if deployed:
- No connection pooling for Groq
- Module-level TTS singleton won't work across serverless function instances
- No queue or backpressure for concurrent requests
- SSE connections hold open for duration of LLM generation
