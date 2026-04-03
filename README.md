# Spanish Practice App

A web app for practicing **IB Ab Initio Spanish** with two modes:

- **Listening** — AI-generated Spanish scripts with comprehension questions, auto-graded
- **Oral** — Live conversation practice with an AI partner ("Maria"), with real-time observer feedback on your Spanish

Built with Next.js 16, TypeScript, Tailwind v4, and shadcn/ui. The app uses Groq for conversation, transcription, and fallback LLM calls, Azure Speech for TTS, and includes Vercel Analytics plus Speed Insights for pilot telemetry.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your environment variables**

   Create a `.env.local` file in the project root:

   ```
   GROQ_API_KEY=gsk_...
   AZURE_TTS_KEY=...
   AZURE_TTS_REGION=...
   CEREBRAS_API_KEY=...
   ```

   Required runtime secrets for production:

   - `GROQ_API_KEY` for conversation, feedback, and speech-to-text
   - `AZURE_TTS_KEY` and `AZURE_TTS_REGION` for Spanish audio playback
   - `CEREBRAS_API_KEY` when the listening flow is using Cerebras-backed generation in your deployed environment

   Optional:

   - `FEEDBACK_WEBHOOK_URL` to forward in-app pilot feedback to a webhook destination; otherwise feedback is captured in server logs

   Get a Groq key at [console.groq.com](https://console.groq.com/).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on localhost:3000 |
| `npm run build` | Production build (includes type-checking) |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check only |

## Production Deployment

Use Vercel for the initial pilot.

1. Import the repo into Vercel.
2. Set the production environment variables listed above.
3. Deploy to production.
4. Smoke test the live URL:
   - home page renders
   - listening generates and grades an exercise
   - oral records, transcribes, replies, and plays TTS
   - the in-app `Feedback` widget submits successfully

For the real-user pilot checklist, see [`roadmap.md`](./roadmap.md).

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **UI:** Tailwind v4, shadcn/ui (Radix), Lucide icons, Plus Jakarta Sans
- **LLM:** Groq plus the current listening generation provider setup in `lib/`
- **STT:** Whisper Large v3 Turbo via Groq
- **TTS:** Azure Speech (`es-ES-AlvaroNeural`)
- **State:** Zustand
