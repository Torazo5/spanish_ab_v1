# Testing

## Current State

**No test suite exists.** There are no test files, no test runner configured (no Jest, Vitest, or Playwright), and no test scripts in `package.json`.

## Validation Methods

- **Type checking**: `npx tsc --noEmit` (also runs during `npm run build`)
- **Linting**: `npm run lint` (ESLint flat config)
- **Manual testing**: Browser-based testing of the full flow

## Coverage Gaps

| Area | Risk | Impact |
|------|------|--------|
| LLM JSON parsing | Code fences not stripped → parse failure | Observer/listening silently fails |
| SSE stream parsing | Malformed chunks → lost data | Conversation text incomplete |
| MediaRecorder blob delivery | Stale closure bug if pattern changes | Audio never processed |
| Whisper transcription | Empty/garbled transcript → bad feedback | Observer gives wrong corrections |
| TTS singleton reset | Race condition on concurrent errors | TTS stuck in broken state |
| Observer accent filtering | Unicode edge cases | False errors shown to user |

## Recommendations

1. **Unit tests for `lib/`**: Groq client proxy, prompt builders, type guards — pure functions, easy to test
2. **API route tests**: Mock Groq SDK, verify SSE format, JSON parsing edge cases
3. **Hook tests with React Testing Library**: `useOralSession` turn cycle, `useMediaRecorder` state transitions
4. **E2E tests with Playwright**: Full oral session flow, listening flow — requires Groq API key or mock server
5. **Suggested runner**: Vitest (fast, ESM-native, good Next.js integration)
