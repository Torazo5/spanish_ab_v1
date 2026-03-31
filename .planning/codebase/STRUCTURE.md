# Project Structure

```
spanish_1/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Plus Jakarta Sans font, global styles)
│   ├── page.tsx                  # Home page — links to /oral and /listening
│   ├── globals.css               # Tailwind v4 imports + custom styles
│   ├── oral/
│   │   └── page.tsx              # Oral practice — topic picker, conversation, observer
│   ├── listening/
│   │   └── page.tsx              # Listening practice — script generation, Q&A
│   └── api/
│       ├── oral/
│       │   ├── conversation/route.ts  # SSE — Llama 3.1 8b conversation as "Luis"
│       │   ├── observe/route.ts       # SSE (single event) — Llama 3.3 70b grammar feedback
│       │   ├── transcribe/route.ts    # JSON — Whisper STT from audio blob
│       │   └── drill-deeper/route.ts  # (new, untracked) Grammar explanation drill-down
│       ├── listening/
│       │   ├── generate-script/route.ts  # JSON — Llama generates script + questions
│       │   └── check-answers/route.ts    # JSON — Llama grades answers
│       └── tts/
│           └── route.ts              # Binary MP3 stream — Microsoft Edge TTS
│
├── components/
│   ├── oral/
│   │   ├── ConversationPanel.tsx  # Chat bubbles (user + AI), streaming text display
│   │   ├── ObserverPanel.tsx      # Grammar feedback cards with error highlights
│   │   ├── MicrophoneButton.tsx   # Record button with phase-aware states + countdown
│   │   └── ErrorCard.tsx          # (new, untracked) Error display component
│   ├── listening/
│   │   ├── ListeningPlayer.tsx    # Audio playback + script display
│   │   ├── QuestionPanel.tsx      # Question form for listening comprehension
│   │   └── FeedbackPanel.tsx      # Answer results and feedback
│   └── ui/                        # shadcn/ui primitives (Radix-based)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── select.tsx
│       └── textarea.tsx
│
├── hooks/
│   ├── useOralSession.ts         # Orchestrates full oral turn cycle (transcribe → chat + observe)
│   ├── useMediaRecorder.ts       # Browser MediaRecorder wrapper with countdown timer
│   └── useSpeechSynthesis.ts     # TTS via /api/tts, Audio object playback
│
├── lib/
│   ├── groq.ts                   # Groq client singleton (Proxy pattern) + MODELS registry
│   ├── types.ts                  # Shared TypeScript types (IbTopic, OralPhase, feedback types)
│   ├── utils.ts                  # cn() utility (tailwind-merge + clsx)
│   └── prompts/
│       ├── oral.ts               # Conversation + observer system prompts
│       └── listening.ts          # Script generation + answer checking prompts
│
├── public/                       # Static assets (SVG icons)
├── CLAUDE.md                     # Claude Code instructions
├── README.md                     # Project documentation
├── package.json                  # Dependencies and scripts
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config
├── postcss.config.mjs            # PostCSS (Tailwind)
├── eslint.config.mjs             # ESLint flat config
├── components.json               # shadcn/ui config
└── .env.local                    # GROQ_API_KEY (not committed)
```

## Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `app/api/oral/` | Oral practice backend — transcription, conversation, grammar observation |
| `app/api/listening/` | Listening practice backend — script generation, answer grading |
| `app/api/tts/` | Text-to-speech — shared by both features |
| `components/oral/` | Oral practice UI — conversation display, observer feedback, mic button |
| `components/listening/` | Listening practice UI — player, questions, feedback |
| `components/ui/` | shadcn/ui primitives — do not edit directly |
| `hooks/` | Client-side logic — session orchestration, audio recording, TTS playback |
| `lib/prompts/` | LLM prompt templates — separated by feature |
| `lib/` | Shared utilities — Groq client, types, Tailwind helpers |

## Key Patterns

- **One route per concern**: Each API route does exactly one thing
- **Feature-based grouping**: Components, routes, and prompts grouped by feature (oral/listening)
- **Hooks as orchestrators**: Complex client logic lives in hooks, not components
- **Pages are thin**: `oral/page.tsx` wires hooks + components together, minimal logic
