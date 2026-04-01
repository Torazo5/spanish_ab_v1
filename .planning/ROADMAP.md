# Roadmap: Spanish Practice Tool

## Milestones

- 🚧 **v1.1 IB-Authentic Listening Practice** - Phases 1-4 (in progress)

## Phases

### 🚧 v1.1 IB-Authentic Listening Practice (In Progress)

**Milestone Goal:** Rebuild the listening feature to deliver authentic IB Ab Initio exam-style questions with rich variety, smart grading, and transcript review.

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Generation Foundation** - AI generates authentic, mark-configurable, mixed-type question sets as structured JSON (completed 2026-03-31)
- [x] **Phase 2: Question Type UI** - All 5 IB question types are renderable and interactive in the browser (completed 2026-04-01)
- [ ] **Phase 3: Grading** - Deterministic types graded client-side; open-ended and gap-fill graded by AI with feedback
- [ ] **Phase 4: Transcript & Review** - Full transcript reveal available at any time; post-submit review mode for learning

## Phase Details

### Phase 1: Generation Foundation
**Goal**: AI reliably generates a Spanish script and a mark-balanced, authentically IB-styled mix of question types as structured JSON, configurable by total mark count
**Depends on**: Nothing (first phase)
**Requirements**: LISTEN-08, LISTEN-09
**Success Criteria** (what must be TRUE):
  1. User can select a total mark value (5, 10, 15, or 25) before starting a session, with 10 as the default
  2. The generated question set contains questions whose mark values sum to the selected total
  3. Every generated session contains at least one MCQ, at least one True/False/Not Given, and at least one of gap-fill, icon-matching, or person-attribution
  4. Generated questions read at IB Ab Initio level — concise Spanish script, questions that require listening comprehension to answer
**Plans:** 2/2 plans complete
Plans:
- [x] 01-01-PLAN.md — Define typed question schema and rewrite generation prompt for mixed-type mark-balanced output
- [x] 01-02-PLAN.md — Add MarkSelector UI to listening page and wire marks to API

### Phase 2: Question Type UI
**Goal**: All 5 IB question types are rendered as distinct interactive components a user can engage with in the browser
**Depends on**: Phase 1
**Requirements**: LISTEN-01, LISTEN-04, LISTEN-05
**Success Criteria** (what must be TRUE):
  1. User sees at least 5 visually distinct question type layouts in a single session
  2. MCQ questions render as radio button groups with labelled answer options
  3. True/False/Not Given questions render with three-option selectors
  4. Person-attribution questions render each statement with a Person A / Person B / Ambos selector
  5. Icon-matching questions display Lucide icons (not emoji or custom SVG) as selectable answer options
**Plans**: TBD
**UI hint**: yes

### Phase 3: Grading
**Goal**: Submitting answers produces correct, instant grades for deterministic question types and explanatory AI feedback for open-ended and gap-fill
**Depends on**: Phase 2
**Requirements**: LISTEN-02, LISTEN-03
**Success Criteria** (what must be TRUE):
  1. After submitting, MCQ, True/False/Not Given, icon-matching, and person-attribution questions show correct/incorrect without an API call
  2. After submitting, gap-fill and open-ended questions show AI-generated explanatory feedback
  3. User sees a total score expressed in marks after submission
  4. Correct and incorrect answers are visually distinguished (color, icon, or label)
**Plans**: TBD

### Phase 4: Transcript & Review
**Goal**: Users can access the full audio transcript at any moment and enter a guided review mode after submitting to amend answers and reinforce learning
**Depends on**: Phase 3
**Requirements**: LISTEN-06, LISTEN-07
**Success Criteria** (what must be TRUE):
  1. A "Reveal transcript" control is visible and functional at any point during a session, before and after submitting
  2. After submitting, a "Review with transcript" button appears and activates review mode
  3. In review mode, the full script is visible alongside the questions and the user can change any answer
  4. Amended answers in review mode do not alter the originally submitted score
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Generation Foundation | v1.1 | 2/2 | Complete   | 2026-03-31 |
| 2. Question Type UI | v1.1 | 3/3 | Complete   | 2026-04-01 |
| 3. Grading | v1.1 | 0/TBD | Not started | - |
| 4. Transcript & Review | v1.1 | 0/TBD | Not started | - |
