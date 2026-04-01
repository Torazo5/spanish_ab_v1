---
phase: 02-question-type-ui
plan: "01"
subsystem: ui
tags: [react, typescript, tailwind, radix, listening, mcq, tfng, gap-fill]

# Dependency graph
requires:
  - phase: 01-generation-foundation
    provides: TypedListeningQuestion discriminated union; GapFillQuestion, McqQuestion, TrueFalseNotGivenQuestion types
provides:
  - GapFillQuestion.sentence field in lib/types.ts for inline gap rendering
  - McqRenderer component with radio-style option buttons and letter prefixes
  - TfngRenderer component with 3-button True/False/Not Given toggle row
  - GapFillRenderer component with inline input embedded in sentence
  - Updated generation prompt using sentence field and tree-pine icon
affects:
  - 02-02-PLAN (IconMatching and PersonAttribution renderers)
  - 02-03-PLAN (TypedQuestionPanel dispatcher)
  - app/listening/page.tsx (future wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - sky-400/50 selected-state border with gradient background for interactive chips/buttons
    - pointer-events-none opacity-60 for disabled state (consistent with MarkSelector pattern)
    - Inline sentence split on ___ for gap-fill rendering
    - role="group" with aria-label on toggle button containers (TFNG accessibility)
    - aria-pressed on radio-style option buttons (MCQ accessibility)

key-files:
  created:
    - components/listening/McqRenderer.tsx
    - components/listening/TfngRenderer.tsx
    - components/listening/GapFillRenderer.tsx
  modified:
    - lib/types.ts
    - lib/prompts/listening.ts
    - eslint.config.mjs

key-decisions:
  - "sentence field added to GapFillQuestion at position after text, before marks — preserves backward compat for text field used as question label"
  - "eslint.claude/** ignore added to prevent pre-existing CJS tooling violations from blocking lint gate"

patterns-established:
  - "Pattern 1: All renderers accept (question, answer, onAnswerChange, disabled?) — uniform prop interface for dispatcher"
  - "Pattern 2: Selected state uses border-sky-400/50 + from-sky-400/20 via-sky-500/10 gradient — matches MarkSelector chips exactly"
  - "Pattern 3: Disabled state is pointer-events-none opacity-60 on the input container — not on the outer wrapper"

requirements-completed: [LISTEN-01]

# Metrics
duration: 12min
completed: 2026-04-01
---

# Phase 02 Plan 01: Question Type Renderers (MCQ, TFNG, Gap-Fill) Summary

**Three question-type renderer components built with sky-400 selected state, plus GapFillQuestion.sentence schema fix and tree-pine icon whitelist correction in the generation prompt**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-01T04:00:00Z
- **Completed:** 2026-04-01T04:12:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added `sentence: string` field to `GapFillQuestion` interface enabling inline gap-fill rendering
- Updated generation prompt gap-fill example to include `sentence` field with `___` placeholder, and fixed `tree` icon name to `tree-pine`
- Built `McqRenderer` with vertical radio-style option buttons, A/B/C/D letter prefixes, and `aria-pressed` accessibility attribute
- Built `TfngRenderer` with 3-button True/False/Not Given toggle row using `role="group"` for accessibility
- Built `GapFillRenderer` splitting `question.sentence` on `___` and embedding a bottom-border-only inline input

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix GapFillQuestion schema and generation prompt** - `897af5d` (feat)
2. **Task 2: Build McqRenderer and TfngRenderer components** - `4847224` (feat)
3. **Task 3: Build GapFillRenderer component** - `86bedfd` (feat)

## Files Created/Modified
- `lib/types.ts` - Added `sentence: string` field to GapFillQuestion interface
- `lib/prompts/listening.ts` - Updated gap-fill JSON example with sentence field; fixed tree -> tree-pine
- `components/listening/McqRenderer.tsx` - MCQ radio-style option buttons with letter prefix and aria-pressed
- `components/listening/TfngRenderer.tsx` - True/False/Not Given 3-button toggle with role=group
- `components/listening/GapFillRenderer.tsx` - Inline sentence input split on ___ placeholder
- `eslint.config.mjs` - Added .claude/** to eslint ignores (deviation, see below)

## Decisions Made
- The `sentence` field was placed after `text` and before `marks` in `GapFillQuestion` — `text` is preserved as the question instruction label (e.g., "Fill in the missing word") while `sentence` holds the script excerpt with `___`
- No local state is used in renderers; all state is lifted via `onAnswerChange` callback, consistent with the dispatcher pattern planned in 02-03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added .claude/** to eslint ignores**
- **Found during:** Task 2 verification (npm run lint)
- **Issue:** Pre-existing CommonJS `require()` calls in `.claude/get-shit-done/bin/*.cjs` and `.claude/hooks/*.js` were causing 116 lint errors, blocking the plan's success criteria of `npm run lint` passes
- **Fix:** Added `.claude/**` to `globalIgnores` in `eslint.config.mjs` — these are GSD tooling files not subject to the project's TypeScript/ESM lint rules
- **Files modified:** eslint.config.mjs
- **Verification:** `npm run lint` exits 0 with no errors
- **Committed in:** `4847224` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking lint gate)
**Impact on plan:** Necessary fix for pre-existing issue; no scope creep on component code.

## Issues Encountered
None in the component implementation itself. The lint issue was pre-existing and resolved via deviation Rule 3.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — all three renderers receive live `answer` and `onAnswerChange` props; no hardcoded empty data or placeholder values flow to the UI.

## Next Phase Readiness
- Three renderers ready for import by the dispatcher (Plan 02-02 handles IconMatchingRenderer and PersonAttributionRenderer; Plan 02-03 builds TypedQuestionPanel dispatcher)
- All renderers use the uniform `(question, answer, onAnswerChange, disabled?)` prop interface ready for TypedQuestionPanel
- No blockers

---
*Phase: 02-question-type-ui*
*Completed: 2026-04-01*
