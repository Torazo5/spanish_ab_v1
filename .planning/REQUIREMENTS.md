# Requirements: Spanish Practice Tool

**Defined:** 2026-03-31
**Core Value:** Authentic IB exam-style practice that a student can run on their own machine for free.

## v1.1 Requirements

Requirements for milestone v1.1: IB-Authentic Listening Practice.

### Question Types

- [x] **LISTEN-01**: User can encounter at least 5 distinct IB-style question types in a single listening session
- [ ] **LISTEN-04**: Person-attribution questions present each statement with Person A / Person B / Ambos options
- [ ] **LISTEN-05**: Icon-matching questions use Lucide icons to represent concepts (transport, weather, activities)

### Grading

- [ ] **LISTEN-02**: MCQ, True/False/Not Given, icon-matching, and person-attribution questions are graded instantly client-side
- [ ] **LISTEN-03**: Open-ended and gap-fill questions are graded by AI with explanatory feedback

### Transcript & Review

- [ ] **LISTEN-06**: User can reveal the full audio transcript at any point during a session
- [ ] **LISTEN-07**: After submitting answers, user can enter "Review with transcript" mode to see the script and amend responses for learning

### Prompt Quality

- [x] **LISTEN-08**: AI prompts produce question mixes that authentically reflect IB Ab Initio exam question style and difficulty

### Session Configuration

- [x] **LISTEN-09**: User can select total marks for a session before starting (options: 5, 10, 15, 25; default 10); AI generates questions to fill the mark total

## Future Requirements

### Potential v1.2+

- **LISTEN-F01**: Timed exam simulation mode
- **LISTEN-F02**: Session history / score tracking across sessions
- **LISTEN-F03**: Audio playback of generated script (TTS for the listening passage)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / auth | Single-user local tool, no benefit |
| Persistence across sessions | No DB, session-state only by design |
| Custom topic input (freeform) | Topic picker sufficient for exam prep scope |
| Audio recording of user reading the script | Out of scope for listening mode |
| Timed exam simulation | Useful but adds complexity beyond this milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LISTEN-01 | Phase 2 | Complete |
| LISTEN-02 | Phase 3 | Pending |
| LISTEN-03 | Phase 3 | Pending |
| LISTEN-04 | Phase 2 | Pending |
| LISTEN-05 | Phase 2 | Pending |
| LISTEN-06 | Phase 4 | Pending |
| LISTEN-07 | Phase 4 | Pending |
| LISTEN-08 | Phase 1 | Complete |
| LISTEN-09 | Phase 1 | Complete |

**Coverage:**
- v1.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 — Phase assignments added after roadmap creation*
