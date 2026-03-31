# Spanish Practice Tool

## What This Is

A personal IB Ab Initio Spanish practice app for a student preparing for exams. Provides two practice modes: oral conversation with an AI partner ("Luis") plus a grammar observer, and listening comprehension with generated scripts and questions. Runs locally on Groq's free tier.

## Core Value

Authentic IB exam-style practice that a student can run on their own machine for free.

## Current Milestone: v1.1 IB-Authentic Listening Practice

**Goal:** Rebuild the listening practice feature to reflect real IB Ab Initio exam question formats, with rich question variety, smart grading, and a transcript review learning mode.

**Target features:**
- 5 IB-authentic question types: MCQ, True/False/Not Given, Gap-fill, Icon-matching (Lucide), Person-attribution (statement → Person A / Person B / Ambos)
- Smart grading: instant client-side for MCQ / T-F-NG / icon / person-attribution; AI-graded for open-ended and gap-fill
- Transcript system: always-available reveal button + post-submit "Review with transcript" mode to amend answers for learning
- IB-accurate prompt engineering: research real Ab Initio formats, then prompts generate authentic mixed question sets
- UI redesign: each question type has its own component, all consistent with existing shadcn/Tailwind v4 style

## Requirements

### Validated

- ✓ Oral conversation with AI partner "Luis" (Llama 3.1 8b instant via Groq) — v1.0
- ✓ Grammar observer feedback with error highlights and diff view (Llama 3.3 70b via Groq) — v1.0
- ✓ TTS via Microsoft Edge TTS (es-ES-AlvaroNeural, no API key) — v1.0
- ✓ STT via Groq Whisper (whisper-large-v3-turbo) — v1.0
- ✓ Listening: AI-generated Spanish script + 5 basic comprehension questions — v1.0
- ✓ Topic selection for both oral and listening modes — v1.0

### Active

- [ ] **LISTEN-01**: User can encounter at least 5 distinct IB-style question types in a single listening session
- [ ] **LISTEN-02**: MCQ, True/False/Not Given, icon-matching, and person-attribution questions are graded instantly client-side
- [ ] **LISTEN-03**: Open-ended and gap-fill questions are graded by AI with explanatory feedback
- [ ] **LISTEN-04**: Person-attribution questions present each statement with Person A / Person B / Ambos options
- [ ] **LISTEN-05**: Icon-matching questions use Lucide icons to represent concepts (transport, weather, activities)
- [ ] **LISTEN-06**: User can reveal the full audio transcript at any point during a session
- [ ] **LISTEN-07**: After submitting answers, user can enter "Review with transcript" mode to see the script and amend responses for learning
- [ ] **LISTEN-08**: AI prompts produce question mixes that authentically reflect IB Ab Initio exam question style and difficulty

### Out of Scope

- User accounts / auth — single-user local tool, no benefit
- Persistence across sessions — no DB, session-state only by design
- Custom topic input (freeform) — topic picker sufficient for exam prep scope
- Audio recording of user reading the script — out of scope for listening mode
- Timed exam simulation — useful but adds complexity beyond this milestone

## Context

- **Exam format:** IB Ab Initio listening exams include a variety of question types in a single paper. Common types: MCQ, true/false/not given (three-way), gap-fill, matching people to statements (with "Ambos" for both), and icon/picture recognition.
- **Existing listening implementation:** `app/api/listening/generate-script/route.ts` generates a script + 5 basic open-ended questions as one JSON blob. `app/api/listening/check-answers/route.ts` grades answers. UI in `components/listening/`. This will be significantly reworked.
- **AI grading split:** Deterministic question types (MCQ, T-F-NG, icon, person-attribution) should not use AI — the correct answer is known at generation time and can be checked client-side.
- **Icons:** Lucide React is already installed. Icon selection for questions should be driven by the LLM naming Lucide icon identifiers in the generated JSON.
- **Tech:** Next.js 14 App Router, TypeScript, Tailwind v4, shadcn/ui (Radix), Groq free tier only.

## Constraints

- **Stack**: Groq free tier only — no OpenAI, no paid APIs
- **No DB**: Session state only, no persistence
- **Lucide icons**: Icon-matching must use icons from the installed Lucide React library, not custom SVGs or emoji
- **Consistent UI**: All new components must follow existing shadcn/Tailwind v4 style conventions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Groq Llama for all LLM work | Free tier, sufficient quality for IB Ab Initio level | ✓ Good |
| msedge-tts for TTS | No API key required | — Pending (unofficial package risk) |
| Client-side grading for deterministic types | Faster, no API cost, reliable | — Pending |
| Lucide icons for icon-matching | Already installed, consistent with UI | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 — Milestone v1.1 started*
