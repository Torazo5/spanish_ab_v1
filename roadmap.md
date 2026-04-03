# Pilot Rollout Roadmap

This is the lightweight rollout plan for getting a few real users onto the app without overbuilding operations.

## Phase 1: Launch Blockers

- Set production environment variables in Vercel:
  - `GROQ_API_KEY`
  - `AZURE_TTS_KEY`
  - `AZURE_TTS_REGION`
  - `CEREBRAS_API_KEY` if listening generation depends on it in production
  - `FEEDBACK_WEBHOOK_URL` only if you want feedback forwarded outside logs
- Confirm the production deployment can complete:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Smoke test the deployed app once with real secrets:
  - home page loads
  - listening can generate, play audio, submit, and show feedback
  - oral can record, transcribe, respond, and play TTS
  - feedback form submits successfully

## Phase 2: Pilot Launch

- Deploy to Vercel production and use the production URL as the pilot link.
- Keep the pilot small at first: a few users only.
- Ask testers to try both modes at least once.
- Ask testers to submit feedback whenever:
  - the app breaks
  - instructions are confusing
  - AI output feels wrong or low quality
  - audio or microphone behavior is unreliable

## Phase 3: First Real-User Iteration

- Review Vercel logs after the first batch of sessions.
- Review analytics and speed insights for obvious drop-off or broken navigation.
- Triage fixes in this order:
  - hard blockers
  - repeated confusing UX
  - listening generation/grading quality failures
  - oral transcription / TTS reliability issues
- Only add heavier systems after the pilot proves they are necessary.

## Tester Script

- Start on the home page and try both `Listening` and `Oral`.
- In `Listening`, generate one exercise, answer it, submit it, and open review/transcript.
- In `Oral`, start a conversation, record at least one response, and wait for the AI reply and feedback.
- If anything feels broken or awkward, use the in-app `Feedback` button and describe:
  - what you expected
  - what actually happened
  - which page you were on

## Notes

- The current goal is pilot stability, not public-launch polish.
- Server logs are an acceptable feedback backup for this phase.
- If the pilot is successful, the next step is deeper reliability work and a more formal testing harness.
