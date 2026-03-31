---
phase: 01-generation-foundation
plan: 01
subsystem: api
tags: [typescript, groq, llama, ib-spanish, question-types, discriminated-union]

# Dependency graph
requires: []
provides:
  - TypedListeningQuestion discriminated union covering all 5 IB question types
  - TypedListeningScript interface with totalMarks field
  - MARK_OPTIONS constant [5, 10, 15, 25] and MarkOption type
  - Mark-aware generation prompt producing mixed question type sets
  - API route accepting marks parameter with validation
affects:
  - 01-02 (question type UI — depends on TypedListeningQuestion union)
  - phase 02 (grading — depends on question type schema and correctAnswer fields)
  - phase 03 (transcript/review — depends on TypedListeningScript)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discriminated union for question types (type field as discriminant)
    - Backward-compatible type extension (new interfaces added, old ones preserved)
    - Detailed JSON schema in prompt for structured LLM output

key-files:
  created: []
  modified:
    - lib/types.ts
    - lib/prompts/listening.ts
    - app/api/listening/generate-script/route.ts

key-decisions:
  - "Keep old ListeningQuestion/ListeningScript for backward compat with existing QuestionPanel/FeedbackPanel"
  - "Use discriminated union with type field so downstream UI can switch on question type"
  - "Embed full JSON schema examples in prompt for each question type to guide LLM output"
  - "Default marks = 10 in both prompt and route for zero-friction existing callers"

patterns-established:
  - "Discriminated union pattern: TypedListeningQuestion uses type field to narrow question interface"
  - "Prompt schema embedding: full JSON examples per type in prompt for reliable structured output"

requirements-completed: [LISTEN-08, LISTEN-09]

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 01 Plan 01: Generation Foundation Summary

**TypedListeningQuestion discriminated union (5 IB types) + mark-aware prompt that generates mixed question sets summing to requested total**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-31T10:10:16Z
- **Completed:** 2026-03-31T10:11:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Defined complete TypeScript schema for all 5 IB Ab Initio question types as discriminated union
- Added MARK_OPTIONS and MarkOption type to codify valid mark totals (5, 10, 15, 25)
- Rewrote generateScriptPrompt to accept marks param and embed full per-type JSON schemas
- Updated API route to extract and validate marks parameter, doubled max_tokens to 2000

## Task Commits

1. **Task 1: Define question type schema and update ListeningScript type** - `dda8bcf` (feat)
2. **Task 2: Rewrite generation prompt and update API route to accept marks** - `9006050` (feat)

## Files Created/Modified
- `lib/types.ts` - Added QuestionType, MARK_OPTIONS, MarkOption, 5 question interfaces, TypedListeningQuestion union, TypedListeningScript; existing types unchanged
- `lib/prompts/listening.ts` - generateScriptPrompt now accepts marks param with detailed per-type schemas; checkAnswersPrompt unchanged
- `app/api/listening/generate-script/route.ts` - Extracts marks from body, validates against [5,10,15,25], passes to prompt, max_tokens 2000

## Decisions Made
- Kept old `ListeningQuestion`/`ListeningScript` interfaces untouched — existing QuestionPanel and FeedbackPanel components consume them and are not changed in Phase 1
- Used discriminated union (`type` field) rather than class hierarchy — aligns with existing TypeScript patterns in the codebase and makes narrowing straightforward in switch/if blocks
- Default marks = 10 in both prompt function and route — zero-friction for existing callers or direct API tests that don't pass marks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TypedListeningQuestion union is the data contract for Plan 01-02 (question type UI components)
- All 5 question interfaces include the type-specific fields needed for client-side grading (correctIndex, correctAnswer, acceptedAnswers, correctIconName)
- No blockers or concerns

---
*Phase: 01-generation-foundation*
*Completed: 2026-03-31*
