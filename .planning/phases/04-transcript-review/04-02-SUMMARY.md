---
phase: 04-transcript-review
plan: 02
subsystem: ui
tags: [react, tailwind, listening, review-mode, state-management]
self-check: PASSED
human-verified: APPROVED
---

# Summary

Added review mode to the listening page. After submitting, users see a "Review with transcript" button. Clicking enters review mode: transcript auto-opens, questions are re-editable via separate `reviewAnswers` state, and original score is shown read-only. "Back to results" returns to score view. All state resets on new exercise.

## Key decisions
- `reviewAnswers` is isolated from `answers` — no path to score mutation
- Score snapshot captured before `setPageState('answered')` to avoid stale closure
- `defaultOpen={pageState === 'review'}` reused TranscriptPanel prop from Plan 01

## Requirements satisfied
- LISTEN-07: Post-submit review mode without score mutation

## Key files
- app/listening/page.tsx (modified — reviewAnswers state, review mode JSX, button wiring)
