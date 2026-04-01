---
phase: 03-grading
plan: 01
subsystem: api
tags: [grading, typescript, nextjs, listening, mcq, gap-fill]

# Dependency graph
requires:
  - phase: 02-question-type-ui
    provides: TypedListeningQuestion discriminated union, TypedListeningScript, Record<string,string> answers map
provides:
  - Client-side deterministic grading for MCQ, TFNG, icon-matching, person-attribution via gradeLocally()
  - AI grading limited to gap-fill questions only via updated check-answers API route
  - Split grading flow in listening page that merges local and AI results
affects: [03-02-transcript-review, FeedbackPanel, listening page]

# Tech tracking
tech-stack:
  added: []
  patterns: [split grading — deterministic client-side + AI for open-ended only]

key-files:
  created: [lib/grading.ts]
  modified:
    - app/api/listening/check-answers/route.ts
    - lib/prompts/listening.ts
    - app/listening/page.tsx
    - lib/types.ts

key-decisions:
  - "gradeLocally returns GradedResult (extends AnswerResult with marks field) to carry per-question mark tally"
  - "AnswerResult.marks added as optional field to remain backward compatible with FeedbackPanel and AI response shape"
  - "checkAnswersPrompt updated to accept Record<string,string> keyed by q.id and include marks in each result"
  - "Encouragement generated client-side (score >= 80% threshold) when no gap-fill questions are present"

patterns-established:
  - "Split grading: gradeLocally for deterministic types, API for open-ended — merge preserving question order"
  - "Score computed from result.marks field, falling back to boolean correct for backward compat"

requirements-completed: [LISTEN-02, LISTEN-03]

# Metrics
duration: 8min
completed: 2026-04-01
---

# Phase 3 Plan 01: Grading Utility Summary

**Client-side deterministic grading (MCQ, TFNG, icon-matching, person-attribution) via gradeLocally() and AI gap-fill-only route, with marks-based score computation**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-01T06:17:00Z
- **Completed:** 2026-04-01T06:25:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `lib/grading.ts` with `gradeLocally()` that handles all 4 deterministic question types, returning GradedResult[] with per-question marks
- Updated `check-answers` API route to accept `TypedListeningQuestion[]` and filter to gap-fill only before calling AI
- Updated `checkAnswersPrompt` to accept `Record<string, string>` answers keyed by `q.id` with marks in each result
- Wired split grading flow into page: local results + optional AI call merged in question order, score computed from marks fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Create grading utility and update API route** - `dbbd9ae` (feat)
2. **Task 2: Wire split grading into page** - `57e012d` (feat)

## Files Created/Modified
- `lib/grading.ts` — New grading utility; exports gradeLocally() and GradedResult type
- `app/api/listening/check-answers/route.ts` — Now accepts TypedListeningQuestion[], filters to gap-fill, calls AI only when needed
- `lib/prompts/listening.ts` — checkAnswersPrompt updated to use Record<string,string> answers[q.id] pattern
- `app/listening/page.tsx` — Split grading flow with merge and marks-based score computation
- `lib/types.ts` — Added optional marks field to AnswerResult

## Decisions Made
- Added `marks` as optional on `AnswerResult` for backward compatibility (FeedbackPanel and AI response already use this interface)
- `GradedResult` extends `AnswerResult` to carry marks without breaking existing callers
- Gap-fill API returns marks per question from AI so the merge logic can sum them uniformly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. The worktree was behind main and required merging from main before starting — this is normal worktree sync, not an issue with the plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Split grading complete; LISTEN-02 and LISTEN-03 requirements fulfilled
- FeedbackPanel renders per-question marks if present (optional field) — ready for Phase 03 Plan 02 (transcript & review)
- No blockers

---
*Phase: 03-grading*
*Completed: 2026-04-01*
