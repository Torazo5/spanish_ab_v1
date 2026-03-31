# Phase 2: Question Type UI - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Render all 5 IB question types (MCQ, True/False/Not Given, Gap-fill, Icon-matching, Person-attribution) as distinct, interactive components in the browser. Users can select/type answers for each type. Grading logic, answer submission, and transcript reveal are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Icon-matching interaction
- **D-01:** Icon-only chip grid — no text labels. Each answer option is a clickable chip showing only the Lucide icon. The whole point is that users must recognize the concept from the icon alone, not read a label.
- **D-02:** Same chip pattern and selected state as the MarkSelector (sky-blue border + glow, dot indicator). Grid layout, 2–4 icons per row.

### Person-attribution layout
- **D-03:** Inline 3-button row per statement. Statement text on the left, `[A]` `[B]` `[AB]` toggle-style buttons on the right. One row per statement — compact, scannable.
- **D-04:** Button labels: "A", "B", "Ambos" (abbreviated on the buttons, full names shown in a header above the statement list identifying who Person A and Person B are).

### Gap-fill input
- **D-05:** Inline blank — a short `<input>` embedded directly in the sentence where the blank marker appears (e.g. `El chico fue a la [_______] por la mañana`). More exam-like than a textarea below.
- **D-06:** The generation schema (`GapFillQuestion`) must include a `sentence` field with a `___` or `{blank}` placeholder so the renderer knows where to split/embed the input.

### Component file structure
- **Claude's Discretion:** Whether to use a single dispatching `TypedQuestionPanel` or per-type component files. Keep consistent with existing `components/listening/` structure.

### Claude's Discretion
- Exact chip sizing, icon size, gap spacing within the icon chip grid
- Whether True/False/Not Given renders as radio group or 3-button toggle row (similar to person-attribution)
- Loading/disabled states for all question types
- How to handle `TypedListeningScript` vs legacy `ListeningScript` in `app/listening/page.tsx` state

</decisions>

<specifics>
## Specific Ideas

- Icon-matching: **no labels at all** — the user identifies concepts from the icon alone. This is an explicit IB-style constraint, not a visual preference.
- Person-attribution header should clarify who "Person A" and "Person B" are (their names come from the script context in `PersonAttributionQuestion`).
- The mark selector chips from Phase 01 (`app/listening/page.tsx`) are the visual reference for icon chips and toggle buttons — reuse the same pattern.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types and schema
- `lib/types.ts` — All 5 `TypedListeningQuestion` variants defined in Phase 01. The `GapFillQuestion` type needs a `sentence` field with a blank marker if not already present — check before planning.

### Existing listening UI
- `components/listening/QuestionPanel.tsx` — Current component to be replaced/reworked. Shows existing patterns (Textarea, zinc palette).
- `app/listening/page.tsx` — Page state machine (`setup` | `loaded` | `answered`), existing MarkSelector chip pattern as reference for icon chips.

### Design system
- `CLAUDE.md` §UI — Tailwind v4 + shadcn/ui (Radix), zinc dark palette, Plus Jakarta Sans. All new components must follow this.

### Requirements
- `.planning/REQUIREMENTS.md` — LISTEN-01 (5 distinct types visible), LISTEN-04 (Person A / Person B / Ambos), LISTEN-05 (Lucide icons, not emoji/SVG)
- `.planning/ROADMAP.md` §Phase 2 — Success criteria: 5 visually distinct layouts, MCQ as radio groups, T-F-NG with three-option selectors, person-attribution with A/B/Ambos, icon-matching with Lucide icons

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/button.tsx` — Button primitive for toggle-style selectors (person-attribution, T-F-NG)
- `components/ui/card.tsx` — Card wrapper for question blocks
- `components/ui/textarea.tsx` — Still needed for open-ended question type
- MarkSelector chip pattern in `app/listening/page.tsx` — Visual reference for icon chips and selected state (sky-blue border + glow + dot indicator, `disabled` + `pointer-events-none opacity-60` during loading)

### Established Patterns
- Zinc dark palette: `bg-zinc-900`, `border-zinc-700`, `text-zinc-100`, `text-zinc-400` for secondary text
- Sky blue accent for selected state: `border-sky-500`, `shadow-sky-500/20`
- `useState` for local selection state (no external state management)

### Integration Points
- `QuestionPanel.tsx` is the main integration point — `app/listening/page.tsx` renders it with `questions` and `answers` props. Phase 2 replaces or extends this component.
- `app/listening/page.tsx` currently passes `answers: string[]` — typed question types may need `answers: Record<string, string>` or similar if answer shapes differ by type.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-question-type-ui*
*Context gathered: 2026-03-31*
