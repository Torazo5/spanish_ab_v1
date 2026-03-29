# Spanish Practice App

A web app for practicing **IB Ab Initio Spanish** with two modes:

- **Listening** — AI-generated Spanish scripts with comprehension questions, auto-graded
- **Oral** — Live conversation practice with an AI partner ("Maria"), with real-time observer feedback on your Spanish

Built with Next.js 14 (App Router), TypeScript, Tailwind v4, and shadcn/ui. All LLM and speech-to-text calls go through [Groq](https://groq.com/) (Llama + Whisper). Text-to-speech uses Microsoft Edge TTS.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your Groq API key**

   Create a `.env.local` file in the project root:

   ```
   GROQ_API_KEY=gsk_...
   ```

   Get a free key at [console.groq.com](https://console.groq.com/).

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

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **UI:** Tailwind v4, shadcn/ui (Radix), Lucide icons, Plus Jakarta Sans
- **LLM:** Llama 3 via Groq (`llama-3.1-8b-instant` for conversation, `llama-3.3-70b-versatile` for observer feedback)
- **STT:** Whisper Large v3 Turbo via Groq
- **TTS:** Microsoft Edge TTS (`es-ES-AlvaroNeural`)
- **State:** Zustand
