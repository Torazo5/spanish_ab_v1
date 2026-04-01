# Phase 4: Transcript & Review - Research

**Researched:** 2026-04-01
**Domain:** React state management, collapsible UI, immutable score snapshot
**Confidence:** HIGH

## Summary

Phase 4 is a pure UI/state phase — no new API routes are needed. The full Spanish script already lives in the `TypedListeningScript.script` field that is fetched during generation and stored in the `script` state on the listening page. The two requirements map to two independent concerns: (1) a collapsible transcript panel available at all times (LISTEN-06), and (2) a post-submit "review mode" where answers can be edited without touching the locked score (LISTEN-07).

The key architectural insight is that `results` (the submitted score snapshot) must be captured into a separate immutable ref/state at submission time, and review-mode answers must live in a separate state slice from the original `answers`. The existing `PageState` type (`'setup' | 'loaded' | 'answered'`) needs a fourth value `'review'` added, or alternatively `review` can be a boolean flag alongside the existing states.

No new dependencies are required. All patterns are achievable with the project's existing stack: React `useState`, Next.js App Router client components, Tailwind v4, and shadcn/ui.

**Primary recommendation:** Add a `TranscriptPanel` collapsible component and a `reviewAnswers` state slice to the listening page; snapshot `results` at submit time and never mutate it during review.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LISTEN-06 | User can reveal the full audio transcript at any point during a session | `script.script` is already in page state; needs a toggle + collapsible UI component |
| LISTEN-07 | After submitting, user can enter "Review with transcript" mode to see the script and amend responses for learning | Needs a `reviewAnswers` state, `'review'` page state, TypedQuestionPanel in non-disabled mode, locked `results` snapshot |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

All actionable directives from CLAUDE.md that apply to this phase:

- **Runtime:** Next.js 14 App Router, all TypeScript. Client components use `'use client'`.
- **Node via nvm:** Commands must source `$NVM_DIR/nvm.sh` first.
- **No test suite:** `No test suite exists yet` — no test files required.
- **Tailwind v4 + shadcn/ui (Radix preset)** — use existing component patterns.
- **Font:** Plus Jakarta Sans.
- **Groq client:** Lazy-init via Proxy — do not instantiate at module level (irrelevant here — no new API routes).
- **Build validation:** `npm run build` validates types via `tsc`. Must pass.
- **Lint:** `npm run lint` must pass.
- **No new env vars** needed for this phase.

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 (via Next 16.2.2) | State, hooks, rendering | Project foundation |
| Next.js | 16.2.2 | App Router, client components | Project foundation |
| Tailwind v4 | installed | Utility styling | Project-wide |
| shadcn/ui | installed | `Card`, `Button`, `Collapsible` primitives | Project-wide |
| lucide-react | installed | Icons (ChevronDown, BookOpen, etc.) | Used throughout existing components |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-collapsible | installed (via shadcn) | Accessible expand/collapse for transcript | Use for LISTEN-06 toggle |

**Installation:** None required. All dependencies are already present.

## Architecture Patterns

### Recommended Project Structure

No new files strictly required — all changes can land in the listening page + one new component. Recommended split:

```
components/listening/
├── TranscriptPanel.tsx     # NEW — collapsible transcript reveal (LISTEN-06)
├── TypedQuestionPanel.tsx  # EXISTING — receives reviewAnswers in review mode
├── FeedbackPanel.tsx       # EXISTING — unchanged
└── ListeningPlayer.tsx     # EXISTING — unchanged

app/listening/
└── page.tsx                # MODIFIED — adds reviewAnswers state, review PageState
```

### Pattern 1: Collapsible Transcript Panel (LISTEN-06)

**What:** A controlled expand/collapse widget that shows the full `script.script` text. Visible on all states except `'setup'`.
**When to use:** Once a script has been generated (`script !== null`).

The simplest correct implementation uses local state inside `TranscriptPanel` itself — no need to hoist the open/closed flag to the page unless other components need to know.

```tsx
// Source: existing codebase pattern — shadcn/ui Collapsible primitive
'use client'
import { useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'

interface Props { script: string }

export function TranscriptPanel({ script }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          {open ? 'Hide transcript' : 'Reveal transcript'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap border-t border-white/10 pt-3">
          {script}
        </div>
      )}
    </div>
  )
}
```

Using Radix Collapsible is an alternative but plain `useState` is sufficient and already used throughout the codebase. Avoid over-engineering for a single toggle.

### Pattern 2: Review Mode State Architecture (LISTEN-07)

**What:** After submitting, a "Review with transcript" button transitions to `'review'` page state. In review mode, `TranscriptPanel` is always visible (open by default), questions are editable via a separate `reviewAnswers` state, and the locked score (`results`) is displayed read-only above.

**Critical invariant:** `results` (the submitted score) MUST NOT be recomputed during review. It is a snapshot captured at submit time. `reviewAnswers` is a separate state that starts as a copy of `answers` at submit time.

```tsx
// In page.tsx — state additions
const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({})

// PageState extended:
type PageState = 'setup' | 'loaded' | 'answered' | 'review'

// At submit time — snapshot answers into reviewAnswers
setReviewAnswers({ ...answers })  // copy before transitioning
setPageState('answered')

// Enter review mode
const enterReview = () => {
  setPageState('review')
}
```

In the JSX, the `'review'` state renders:
1. `TranscriptPanel` with `defaultOpen={true}` (prop or internal default)
2. A locked score summary (read-only `FeedbackPanel` or simple score line)
3. `TypedQuestionPanel` with `answers={reviewAnswers}` and `onAnswerChange` updating `reviewAnswers` — NOT the original `answers`
4. No "Check Answers" button — this is a learning review, not re-grading

### Pattern 3: PageState-driven rendering

The existing page already uses `pageState` to gate which sections are visible. Adding `'review'` is a clean extension of the existing pattern:

```tsx
// Existing pattern in page.tsx
{script && pageState !== 'answered' && ( /* questions + submit */ )}
{results && ( /* feedback + new exercise */ )}

// Extended pattern
{script && (pageState === 'loaded' || pageState === 'review') && (
  <TranscriptPanel script={script.script} defaultOpen={pageState === 'review'} />
)}
{script && pageState === 'answered' && (
  /* FeedbackPanel + "Review with transcript" button + "New Exercise" button */
)}
{script && pageState === 'review' && (
  /* score summary (read-only) + TypedQuestionPanel with reviewAnswers */
)}
```

### Anti-Patterns to Avoid

- **Mutating `answers` in review mode:** `answers` is the original submitted state. Mutating it would invalidate the score snapshot. Always use a separate `reviewAnswers`.
- **Re-running `checkAnswers` in review mode:** Review is for learning, not re-grading. No submit button in review mode.
- **Storing `transcriptOpen` in page-level state unnecessarily:** The transcript toggle is local UI state — keep it inside `TranscriptPanel` unless there's a reason to hoist it.
- **Using `disabled={true}` on questions in review mode:** In review mode, questions must be editable (`disabled={false}`), unlike the `'answered'` state.
- **Showing the transcript in `'setup'` state:** Before a script is generated there is no transcript to show. Gate `TranscriptPanel` on `script !== null`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth expand/collapse animation | Custom CSS height animation | CSS `transition` on `max-height`, or Radix Collapsible | Height animations are tricky; simple `{open && ...}` with no animation is also acceptable for this scope |
| State isolation for review answers | Complex reducer | Two separate `useState` slices | Simple and explicit; no need for useReducer for two string-keyed records |

**Key insight:** This phase has no complex algorithmic logic. All difficulty is in state isolation (don't let review mutate submitted score) and UI structure (render the right panels in the right states).

## Common Pitfalls

### Pitfall 1: Stale closure on reviewAnswers initialisation

**What goes wrong:** `reviewAnswers` is initialised from `answers` at submit time. If initialised lazily (e.g., in the review button handler reading stale closure), it captures a stale copy.
**Why it happens:** React state updates are async; if `answers` is read inside a handler after a `setAnswers` call in the same event, it may be stale.
**How to avoid:** Initialise `reviewAnswers` in the `checkAnswers` function immediately after computing `allResults`, before any `setPageState` call — at that point `answers` is the current value from the enclosing closure.
**Warning signs:** Review questions are all blank, or show wrong values.

### Pitfall 2: Score recalculation triggered by reviewAnswers change

**What goes wrong:** If `results` is derived state (computed from `answers`), changing `reviewAnswers` could re-derive it.
**Why it happens:** Accidentally using `reviewAnswers` where `answers` was intended in the `checkAnswers` callback.
**How to avoid:** `results` is set once in `checkAnswers` and stored in `useState`. It is never recomputed after that. `reviewAnswers` only feeds `TypedQuestionPanel` in review mode.
**Warning signs:** Score changes after editing in review mode.

### Pitfall 3: Transcript rendered in setup state

**What goes wrong:** `TranscriptPanel` mounted before `script` is available, causing a crash or empty panel.
**Why it happens:** Forgetting to gate on `script !== null`.
**How to avoid:** Render `TranscriptPanel` only inside the `{script && ...}` block.

### Pitfall 4: TypeScript type error on extended PageState

**What goes wrong:** The existing `type PageState = 'setup' | 'loaded' | 'answered'` doesn't include `'review'`. Any `pageState === 'review'` check will produce a TS error.
**Why it happens:** The type is defined inline in `page.tsx` — easy to miss updating it.
**How to avoid:** Update the type definition at the top of `page.tsx` to include `'review'` before using it.
**Warning signs:** `npm run build` fails with a TypeScript type error.

### Pitfall 5: "Review with transcript" button placement

**What goes wrong:** Button appears in the wrong state (e.g., also in review mode, or missing after submit).
**Why it happens:** The existing `{results && (...)}` block is `'answered'` state but `results` is truthy in `'review'` too.
**How to avoid:** Gate the "Review with transcript" button on `pageState === 'answered'`, not just `results !== null`. Use `pageState === 'answered' && results` as the condition.

## Code Examples

### Full state shape for Phase 4 additions

```tsx
// Source: analysis of existing page.tsx
type PageState = 'setup' | 'loaded' | 'answered' | 'review'   // add 'review'

// New state
const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({})

// In checkAnswers, before setPageState('answered'):
setReviewAnswers({ ...answers })

// "Review with transcript" button (inside answered state block):
<button
  onClick={() => setPageState('review')}
  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-950/40 py-3 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-900/50 hover:text-sky-200 active:scale-[0.98]"
>
  Review with transcript
</button>
```

### TranscriptPanel integration in JSX

```tsx
{/* Transcript — visible after generation, in all non-setup states */}
{script && pageState !== 'setup' && (
  <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
    <TranscriptPanel script={script.script} defaultOpen={pageState === 'review'} />
  </Card>
)}
```

### Review mode questions section

```tsx
{/* Review mode: editable questions with locked score */}
{script && pageState === 'review' && results && (
  <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] space-y-4">
    {/* Read-only score reminder */}
    <p className="text-xs text-zinc-500 text-center">
      Original score: <span className="text-white font-semibold">{results.totalScore} / {results.maxScore}</span> — amending answers here does not change your score
    </p>
    <TypedQuestionPanel
      questions={script.questions}
      answers={reviewAnswers}
      onAnswerChange={(id, value) => setReviewAnswers(prev => ({ ...prev, [id]: value }))}
      disabled={false}
    />
  </Card>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Browser SpeechSynthesis API | `/api/tts` + object URL (msedge-tts) | Phase 1/earlier | Already in place — no change needed |
| Single `answers` state for all modes | Separate `reviewAnswers` state for review mode | Phase 4 (this phase) | Enables score immutability |

## Open Questions

1. **Should "Review with transcript" also re-play the audio?**
   - What we know: LISTEN-07 only requires transcript visibility + answer editing
   - What's unclear: Whether users would expect the audio player to remain accessible in review mode
   - Recommendation: Keep `ListeningPlayer` visible throughout (it already renders whenever `script` is set). No special action needed — it renders in `loaded`, `answered`, and `review` states naturally if the existing render condition is adjusted.

2. **Should there be a "Back to results" button from review mode?**
   - What we know: The success criteria don't specify this
   - What's unclear: Whether users expect to return to the `'answered'` feedback view
   - Recommendation: Add a simple "Back to results" button in review mode that sets `pageState('answered')`. Low-cost, improves UX.

3. **Should `TranscriptPanel` be collapsed or expanded by default in `'answered'` vs `'review'` states?**
   - What we know: LISTEN-06 says "visible and functional at any point" — it should be togglable, not forced open
   - Recommendation: Default collapsed when `pageState === 'loaded'` or `'answered'`; default open when `pageState === 'review'` (since review explicitly pairs transcript with questions). Implement via a `defaultOpen` prop.

## Environment Availability

Step 2.6: SKIPPED — This phase involves only client-side React state and UI components. No external tools, services, CLIs, or databases are required beyond what is already running.

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treating as enabled. However, CLAUDE.md states "No test suite exists yet." Therefore no automated test commands exist.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no test suite configured |
| Config file | None |
| Quick run command | `npm run build && npm run lint` (build + type check as proxy) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LISTEN-06 | Transcript toggle visible and works at any session state | manual | — | N/A |
| LISTEN-07 | Review mode shows transcript + editable questions; score unchanged | manual | — | N/A |

**Manual verification steps (Phase 4 specific):**
1. Generate a session → verify "Reveal transcript" toggle appears in `loaded` state
2. Click transcript toggle → verify Spanish script appears; click again → hides
3. Submit answers → verify score displayed, "Review with transcript" button appears
4. Click "Review with transcript" → verify transcript is open by default, questions are editable
5. Change an answer in review mode → verify score header still shows original score
6. Verify `npm run build` passes (TypeScript type check on extended PageState)

### Wave 0 Gaps

- [ ] `PageState` type in `app/listening/page.tsx` needs `'review'` added before any plan tasks reference it
- [ ] `components/listening/TranscriptPanel.tsx` does not exist — must be created in Wave 1

*(No test framework to install — no test files to create)*

## Sources

### Primary (HIGH confidence)

- Direct code inspection of `app/listening/page.tsx` — current state shape, PageState type, render conditions
- Direct code inspection of `lib/types.ts` — TypedListeningScript.script field confirmed
- Direct code inspection of `lib/grading.ts` — gradeLocally signature confirmed
- Direct code inspection of `components/listening/*.tsx` — TypedQuestionPanel prop interface confirmed

### Secondary (MEDIUM confidence)

- REQUIREMENTS.md — LISTEN-06, LISTEN-07 requirements text
- ROADMAP.md — Phase 4 success criteria

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing project, no new dependencies
- Architecture: HIGH — based on direct code reading of all relevant files
- Pitfalls: HIGH — derived from concrete code patterns in current codebase
- State pattern: HIGH — straightforward React useState, no novel patterns needed

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack, no moving parts)
