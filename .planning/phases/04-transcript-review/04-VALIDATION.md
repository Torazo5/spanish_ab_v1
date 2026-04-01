---
phase: 4
slug: transcript-review
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test suite exists yet (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npx tsc --noEmit && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npx tsc --noEmit && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | LISTEN-06 | build | `npm run build` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | LISTEN-06 | build | `npm run build` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 2 | LISTEN-07 | build | `npm run build` | ✅ | ⬜ pending |
| 4-02-02 | 02 | 2 | LISTEN-07 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No new test framework installation needed — project has no test suite.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Reveal transcript shows/hides correctly | LISTEN-06 | No test suite | Click "Reveal transcript" during active session; verify full Spanish script appears |
| Review mode does not change original score | LISTEN-07 | No test suite | Submit answers, enter review mode, change answers, verify displayed score unchanged |
| Review mode amends visible in transcript context | LISTEN-07 | No test suite | In review mode, change an answer; verify transcript is visible alongside questions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
