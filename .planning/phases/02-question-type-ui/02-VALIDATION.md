---
phase: 02
slug: question-type-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no test suite exists yet (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds (tsc), ~30 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After wave complete:** Run `npm run build`

---

## Validation Architecture

Since no test suite exists, validation relies on:
1. TypeScript type-checking — catches discriminated union mismatches and prop errors at compile time
2. Full production build — catches import errors, missing components, and SSR issues

