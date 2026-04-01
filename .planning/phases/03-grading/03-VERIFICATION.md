---
phase: 03-grading
verified: 2026-04-01T08:00:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Confirm grading flow works end-to-end in browser"
    expected: "Deterministic types grade instantly (no loading spinner for those), gap-fill shows AI feedback text, total score shown as 'X / Y marks', correct answers show green, incorrect show red with correct answer label"
    why_human: "Real-time UI behavior and visible loading states cannot be verified programmatically without a running browser"
---

# Phase 3: Grading Verification Report

**Phase Goal:** Implement grading system — client-side for deterministic types, AI for gap-fill, marks-based scoring with feedback
**Verified:** 2026-04-01T08:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | MCQ, TFNG, icon-matching, person-attribution grade instantly without API call | VERIFIED | `gradeLocally` in `lib/grading.ts` handles all four; page.tsx calls it synchronously before any fetch |
| 2 | Gap-fill questions are sent to AI and return explanatory feedback | VERIFIED | `app/api/listening/check-answers/route.ts` filters to `gap-fill` only; prompt requests `"feedback"` per result; page.tsx gates fetch on `gapFillQuestions.length > 0` |
| 3 | Score is computed in marks from question.marks fields | VERIFIED | `page.tsx` L101-103 sums `r.marks` across `allResults`; denominator is `script.totalMarks` |
| 4 | User sees total score in marks after submission | VERIFIED | `FeedbackPanel` header renders `{totalScore} / {maxScore} marks` (L20-21) |
| 5 | Correct answers are visually distinguished from incorrect | VERIFIED | Green border (`border-green-800 bg-green-950/30`) vs red border (`border-red-800 bg-red-950/30`) plus `✓`/`✗` icons |
| 6 | Gap-fill results show AI explanatory feedback | VERIFIED | `FeedbackPanel` L61-63: renders `result.feedback` when `isGapFill && result.feedback` |
| 7 | Deterministic results show the correct answer | VERIFIED | `FeedbackPanel` L65-69: renders `result.correctAnswer` in green text when `!isGapFill && !result.correct` |

**Score:** 7/7 truths verified (automated)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/grading.ts` | Client-side deterministic grading function | VERIFIED | 103 lines; exports `gradeLocally` and `GradedResult`; handles MCQ, TFNG, icon-matching, person-attribution |
| `app/api/listening/check-answers/route.ts` | AI grading for gap-fill only | VERIFIED | Filters to `gap-fill` before AI call; returns early with `{ results: [], encouragement: '' }` when no gap-fill |
| `app/listening/page.tsx` | Split grading flow | VERIFIED | Imports `gradeLocally`; gates API call on gap-fill presence; merges in question order; computes `totalScore` from `marks` |
| `components/listening/FeedbackPanel.tsx` | Marks display and correct answer reveal | VERIFIED | Renders `totalScore / maxScore marks`; `correctAnswer` on wrong deterministic; AI feedback on gap-fill |
| `lib/types.ts` | AnswerResult with marks and correctAnswer fields | VERIFIED | `marks?: number` (L134), `correctAnswer?: string` (L135) both present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `app/listening/page.tsx` | `lib/grading.ts` | `import { gradeLocally }` | WIRED | Line 12 imports, line 63 calls `gradeLocally(script.questions, answers)` |
| `app/listening/page.tsx` | `/api/listening/check-answers` | `fetch` for gap-fill only | WIRED | Lines 66-72: filter + conditional fetch; response used at lines 78-79 |
| `components/listening/FeedbackPanel.tsx` | `lib/types.ts` | `AnswerResult` with marks | WIRED | Line 2 imports `AnswerResult`; prop type uses it; renders `result.marks`, `result.correctAnswer` |
| `app/api/listening/check-answers/route.ts` | `lib/prompts/listening.ts` | `checkAnswersPrompt` | WIRED | Line 3 import; line 30 call passing `gapFillQuestions` and `answers` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `FeedbackPanel.tsx` | `results` prop | `allResults` in `page.tsx` — merged from `gradeLocally()` output + AI API response | Yes — deterministic results from local computation; gap-fill from Groq AI call | FLOWING |
| `FeedbackPanel.tsx` | `totalScore` prop | `page.tsx` L101-103 sum of `r.marks` | Yes — derived from real question marks and grading | FLOWING |
| `app/api/listening/check-answers/route.ts` | `gapFillQuestions` | `req.json()` → filtered from `TypedListeningQuestion[]` | Yes — Groq LLM call at line 28; result parsed and returned | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — core logic is server-side AI calls and UI state; cannot invoke the full grading flow without a running dev server and browser.

The type-check confirms no structural issues:
```
npx tsc --noEmit  →  exit 0 (no output, no errors)
```

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LISTEN-02 | 03-01, 03-02 | MCQ, TFNG, icon-matching, person-attribution graded client-side | SATISFIED | `gradeLocally` in `lib/grading.ts` handles all four types without any API call |
| LISTEN-03 | 03-01, 03-02 | Open-ended and gap-fill graded by AI with explanatory feedback | SATISFIED | Route filters to gap-fill only; prompt requests feedback string per result; FeedbackPanel renders it |

No orphaned requirements: LISTEN-02 and LISTEN-03 are both claimed by plan 03-01 and 03-02, and both have verified implementation evidence.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODOs, FIXMEs, placeholder returns, empty implementations, or hardcoded empty data found in any phase 3 file.

### Notable Observations

**`GradedResult` extends `AnswerResult` with a non-optional `marks: number`** — but `AnswerResult.marks` is optional. This means the page's `allResults: AnswerResult[]` merges typed `GradedResult` objects alongside the fallback literals with `marks: 0`. The score computation at L102 falls back to `r.correct ? 1 : 0` for any result missing `marks`, which is a safe fallback and not a bug, but means a gap-fill result that fails to parse from AI will score 0 correctly.

**`checkAnswersPrompt` sends all questions including non-gap-fill to the LLM** — the route correctly filters `gapFillQuestions` before calling AI, and passes only those to the prompt. However, the page sends `questions: script.questions` (all questions) in the POST body (line 74), not just gap-fill. The route re-filters server-side at line 17, so this is harmless — extra data is sent but the route ignores it. No correctness issue.

### Human Verification Required

#### 1. End-to-end grading flow in browser

**Test:** Run `npm run dev`, open `localhost:3000/listening`, generate a 10-mark exercise with a topic that includes a mix of types. Answer some questions correctly, some incorrectly, then click Check Answers.
**Expected:**
- Deterministic questions (MCQ, TFNG, icon-matching, person-attribution) show results immediately after the AI call resolves (they do not cause extra delay individually)
- Gap-fill questions show AI explanatory feedback text beneath each result
- Total score header shows format "X / Y marks" with a percentage
- Correct answers have green border + green check mark
- Incorrect deterministic answers have red border + "Correct answer: [label]" in green text
- Encouragement sentence appears beneath the score

**Why human:** Loading state timing (deterministic vs AI calls), visual distinction rendering, and AI feedback text quality require a running browser session to confirm.

---

## Gaps Summary

No automated gaps found. All 7 truths verified, all artifacts substantive and wired, data flows through to render. Phase 3 goal is achieved at the code level.

The only open item is the blocking human-verify checkpoint from plan 03-02 Task 2 — per the SUMMARY, this was marked "approved" by a human during plan execution. If that approval was genuine, the phase is fully complete. The verification above confirms the code matches what was approved.

---

_Verified: 2026-04-01T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
