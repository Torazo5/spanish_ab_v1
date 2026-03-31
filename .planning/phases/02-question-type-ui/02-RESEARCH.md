# Phase 02: Question Type UI - Research

**Researched:** 2026-03-31
**Domain:** React component architecture, TypeScript discriminated union rendering, Tailwind v4, lucide-react dynamic icon lookup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Icon-only chip grid — no text labels. Each answer option is a clickable chip showing only the Lucide icon. Users must recognize the concept from the icon alone.
- **D-02:** Same chip pattern and selected state as the MarkSelector (sky-blue border + glow, dot indicator). Grid layout, 2–4 icons per row.
- **D-03:** Inline 3-button row per statement for person-attribution. Statement text on the left, `[A]` `[B]` `[AB]` toggle-style buttons on the right. One row per statement.
- **D-04:** Button labels: "A", "B", "Ambos" (abbreviated on buttons; full names shown in a header above the statement list).
- **D-05:** Inline blank — a short `<input>` embedded directly in the sentence where the blank marker appears.
- **D-06:** The generation schema (`GapFillQuestion`) must include a `sentence` field with a `___` placeholder so the renderer knows where to split/embed the input.

### Claude's Discretion

- Whether to use a single dispatching `TypedQuestionPanel` or per-type component files. Keep consistent with existing `components/listening/` structure.
- Exact chip sizing, icon size, gap spacing within the icon chip grid
- Whether True/False/Not Given renders as radio group or 3-button toggle row (similar to person-attribution)
- Loading/disabled states for all question types
- How to handle `TypedListeningScript` vs legacy `ListeningScript` in `app/listening/page.tsx` state

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LISTEN-01 | User can encounter at least 5 distinct IB-style question types in a single listening session | Discriminated union `TypedListeningQuestion` already defined in `lib/types.ts`; dispatching component renders per type |
| LISTEN-04 | Person-attribution questions present each statement with Person A / Person B / Ambos options | `PersonAttributionQuestion` type exists with `personA`, `personB`, `correctAnswer` fields; component pattern designed in UI-SPEC |
| LISTEN-05 | Icon-matching questions use Lucide icons to represent concepts | `IconMatchingQuestion` type exists with `icons[].name` field; lucide-react 1.7.0 installed; dynamic lookup via `icons` named export confirmed |

</phase_requirements>

---

## Summary

Phase 02 is a pure frontend component-building phase. The data contract (all 5 `TypedListeningQuestion` variants as a TypeScript discriminated union) was fully established in Phase 01. The task is to render each variant with a visually distinct, interactive UI that matches the design contract in `02-UI-SPEC.md`.

The UI-SPEC is unusually detailed — it specifies exact Tailwind class strings for every state of every component. The planner should treat the UI-SPEC as a step-by-step implementation reference, not a summary. Component file locations, prop shapes, selected/unselected styles, disabled states, interaction behaviors, and accessibility requirements are all pre-decided.

One schema gap requires action before the gap-fill renderer can be built: `GapFillQuestion` in `lib/types.ts` currently has `text` and `acceptedAnswers` but no `sentence` field. The generation prompt in `lib/prompts/listening.ts` already uses `text` for the sentence with the blank (it includes `___` in the example), so the type just needs `sentence: string` added. The prompt also needs a minor update so it outputs `sentence` as the field name. This is a Wave 0 prerequisite for the gap-fill renderer.

The page-level integration (`app/listening/page.tsx`) currently uses `ListeningScript` and `answers: string[]`. Phase 02 must migrate both to `TypedListeningScript` and `answers: Record<string, string>`, update the `QuestionPanel` import to `TypedQuestionPanel`, and adjust the submit button disabled condition.

**Primary recommendation:** Build `TypedQuestionPanel.tsx` as the dispatching shell first, then implement each renderer as a separate file in `components/listening/`, following UI-SPEC class strings exactly. Fix the `GapFillQuestion` schema gap before implementing `GapFillRenderer`.

---

## Standard Stack

### Core

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| lucide-react | 1.7.0 | Lucide icon components for icon-matching chips | Already installed; LISTEN-05 explicitly requires Lucide |
| React | 19.2.4 | Component framework | Project standard (Next.js 16 App Router) |
| TypeScript | 5.x | Type-safe discriminated union switching | Project standard |
| Tailwind CSS | 4.x | Utility-class styling | Project standard |

### Supporting

| Library | Version (installed) | Purpose | When to Use |
|---------|---------------------|---------|-------------|
| shadcn `Button` | via `radix-ui ^1.4.3` | Primitive used via `components/ui/button.tsx` | Only if a render variant matches a CVA slot — UI-SPEC uses raw `<button>` for toggle chips, so shadcn Button is NOT used for the new question renderers |
| shadcn `Card` | — | Wraps each question block | Already used in `app/listening/page.tsx` |
| shadcn `Textarea` | — | Still needed for open-ended question type | Only OpenEndedRenderer (not in Phase 02 but type exists) |
| `class-variance-authority` | ^0.7.1 | Variant composition (already in project) | Not needed for Phase 02 components — UI-SPEC uses inline conditionals |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dynamic `icons[name]` lookup | Static import of each icon | Dynamic lookup is required because icon names come from JSON at runtime; static imports are not viable |
| Raw `<button>` for toggle chips | shadcn `Button` | The CVA variants in `button.tsx` don't match the chip-style; raw buttons with inline Tailwind are the established pattern in this project (see MarkSelector chips in `page.tsx`) |

**Installation:** No new packages required. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
components/listening/
├── TypedQuestionPanel.tsx        # dispatching shell — replaces QuestionPanel.tsx
├── McqRenderer.tsx               # MCQ radio-style option list
├── TfngRenderer.tsx              # True/False/Not Given 3-button toggle
├── GapFillRenderer.tsx           # Inline sentence with embedded <input>
├── IconMatchingRenderer.tsx      # Icon-only chip grid with dynamic Lucide lookup
├── PersonAttributionRenderer.tsx # Per-statement A/B/Ambos button row
├── QuestionPanel.tsx             # PRESERVED (legacy, not deleted in Phase 02)
└── ...existing files unchanged...
```

### Pattern 1: Discriminated Union Dispatch

The `TypedQuestionPanel` renders a list of `TypedListeningQuestion[]`. For each question, it switches on `question.type` and delegates to the matching renderer. This is the standard TypeScript discriminated union pattern.

```typescript
// Source: CONTEXT.md component inventory + TypeScript discriminated union best practice
function TypedQuestionPanel({ questions, answers, onAnswerChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Questions</h3>
      {questions.map((q) => {
        switch (q.type) {
          case 'mcq': return <McqRenderer key={q.id} question={q} answer={answers[q.id] ?? ''} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'true-false-notgiven': return <TfngRenderer key={q.id} question={q} answer={answers[q.id] ?? ''} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'gap-fill': return <GapFillRenderer key={q.id} question={q} answer={answers[q.id] ?? ''} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'icon-matching': return <IconMatchingRenderer key={q.id} question={q} answer={answers[q.id] ?? ''} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'person-attribution': return <PersonAttributionRenderer key={q.id} question={q} answer={answers[q.id] ?? ''} onAnswerChange={onAnswerChange} disabled={disabled} />
        }
      })}
    </div>
  )
}
```

TypeScript will type-narrow `q` inside each case arm, giving each renderer the correct specific type with no casting required.

### Pattern 2: Dynamic Lucide Icon Lookup

The `IconMatchingRenderer` receives `question.icons[n].name` as a kebab-case string (e.g. `"cloud-rain"`). lucide-react 1.7.0 exports icons under PascalCase names (e.g. `CloudRain`). The conversion and fallback pattern:

```typescript
// Source: verified against installed lucide-react 1.7.0 exports
import * as LucideIcons from 'lucide-react'

function toPascalCase(kebab: string): string {
  return kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  const pascal = toPascalCase(name)
  return (LucideIcons as Record<string, unknown>)[pascal] as React.ComponentType<{ className?: string }> ?? LucideIcons.HelpCircle
}
```

**CRITICAL:** The prompt whitelist includes `"tree"` as an allowed icon name, but `Tree` does NOT exist in lucide-react 1.7.0. The available tree icons are `TreePine`, `TreeDeciduous`, `TreePalm`, `Trees`. The `HelpCircle` fallback handles this gracefully. The generation prompt should be updated to replace `tree` with `tree-pine` in the allowed icon list.

### Pattern 3: Answers as Record

The page migrates from `answers: string[]` to `answers: Record<string, string>` keyed by question `id`. This allows heterogeneous answer shapes (index-based arrays break when question order changes or types differ).

```typescript
// In app/listening/page.tsx — migration pattern
// Before: const [answers, setAnswers] = useState<string[]>([])
// After:
const [answers, setAnswers] = useState<Record<string, string>>({})

// onAnswerChange signature:
const handleAnswerChange = (id: string, value: string) =>
  setAnswers(prev => ({ ...prev, [id]: value }))

// Submit disabled condition:
disabled={loading || !Object.values(answers).some(v => v.trim())}

// Initialize after generation:
setAnswers({}) // no per-question init needed with Record
```

### Pattern 4: GapFill Inline Input Sentence Split

```typescript
// Source: UI-SPEC D-05/D-06 — split on ___ placeholder
const parts = question.sentence.split('___')
// parts[0] = text before blank, parts[1] = text after blank
return (
  <p className="text-sm text-zinc-200 leading-relaxed">
    <span>{parts[0]}</span>
    <input
      className="inline-block w-32 border-b-2 border-zinc-600 bg-transparent text-sm text-zinc-100 text-center outline-none focus:border-sky-400 transition-colors duration-200 mx-1 px-1"
      aria-label="Fill in the blank"
      value={answer}
      onChange={e => onAnswerChange(question.id, e.target.value)}
      disabled={disabled}
    />
    <span>{parts[1]}</span>
  </p>
)
```

### Anti-Patterns to Avoid

- **Index-based answer access:** `answers[i]` — will break when question list is sparse or reordered. Use `answers[question.id]`.
- **Static Lucide imports for icon-matching:** Importing `Bus, Train, Plane` etc. statically is not viable — the icon name comes from JSON at runtime. Always use the dynamic `* as LucideIcons` lookup.
- **Using shadcn `<Button>` for chip toggles:** The CVA variants don't match the chip design. Use raw `<button>` with inline Tailwind classes identical to the MarkSelector pattern.
- **Keeping `QuestionPanel` as entry point:** The page must switch to `TypedQuestionPanel` and pass `TypedListeningScript.questions` (typed array). Do NOT pass `ListeningQuestion[]` to the new component.
- **Deleting `QuestionPanel.tsx`:** It is still imported/relied on by legacy paths. Leave it in place in Phase 02.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon lookup by string | Custom icon registry / import mapping | `import * as LucideIcons from 'lucide-react'` with PascalCase conversion | lucide-react is already a named-export map; dynamic property access is the intended pattern |
| Toggle group state | Shared toggle manager / radio group component | `useState<string>` local to each renderer, call `onAnswerChange` on click | State is per-question and lifted; no cross-question coordination needed |
| CSS animation on selection | Custom keyframes | Tailwind `transition-all duration-200` + `shadow-[...]` | Already established in MarkSelector pattern |

**Key insight:** This phase is assembling pre-designed pieces. All architectural decisions are locked in the UI-SPEC. Hand-rolling anything that departs from the established MarkSelector pattern will produce visual inconsistency.

---

## Common Pitfalls

### Pitfall 1: `tree` icon name doesn't exist in lucide-react 1.7.0

**What goes wrong:** The generation prompt whitelist includes `tree`, but lucide-react 1.7.0 has no `Tree` export. Any question with `"name": "tree"` will silently fall back to `HelpCircle`.
**Why it happens:** The prompt was written with a name that doesn't match the actual library export.
**How to avoid:** Update the prompt's icon whitelist to replace `tree` with `tree-pine` (which maps to `TreePine`, confirmed present). The fallback `HelpCircle` is still required for any unexpected name.
**Warning signs:** Icon chips rendering `HelpCircle` unexpectedly during testing.

### Pitfall 2: `GapFillQuestion` has no `sentence` field yet

**What goes wrong:** `GapFillRenderer` needs `question.sentence` to know where to put the `<input>`. The current type only has `text` and `acceptedAnswers`. Building the renderer before fixing the schema causes a TypeScript error.
**Why it happens:** This schema gap was identified in the UI-SPEC and must be fixed as Wave 0.
**How to avoid:** Add `sentence: string` to `GapFillQuestion` in `lib/types.ts` AND update the generation prompt (`lib/prompts/listening.ts`) to output `sentence` (currently uses `text` for the same purpose with `___`). Both changes must land together in one commit.
**Warning signs:** `Property 'sentence' does not exist on type 'GapFillQuestion'` TypeScript error.

### Pitfall 3: `answers` shape mismatch between page and panel

**What goes wrong:** `app/listening/page.tsx` initializes `answers` as `string[]` and passes it to `QuestionPanel` with index-based access. Switching to `TypedQuestionPanel` without migrating the state type will cause a TypeScript error and runtime bugs.
**Why it happens:** The two systems use incompatible answer shapes.
**How to avoid:** Migrate `answers` state to `Record<string, string>` in `page.tsx` at the same time as swapping the component. Update the submit disabled condition and `checkAnswers` payload in the same commit.
**Warning signs:** `Type 'string[]' is not assignable to type 'Record<string, string>'` TypeScript error.

### Pitfall 4: `import * as LucideIcons` tree-shaking concerns

**What goes wrong:** `import * as LucideIcons` imports all ~1400 icon components, which may increase bundle size.
**Why it happens:** Next.js + webpack can tree-shake named imports but not namespace imports.
**How to avoid:** This is an acceptable tradeoff for this project (local tool, not production SaaS). Document the choice. If bundle size becomes a concern, a dynamic `import()` per icon can be added in a future phase. Do not over-engineer now.
**Warning signs:** Build warning about large chunk size (threshold is ~500KB).

### Pitfall 5: `app/listening/page.tsx` still uses `ListeningScript` type for state

**What goes wrong:** The API route `generate-script` already returns `TypedListeningScript` shape (with `totalMarks` and typed `questions`). The page currently types `script` as `ListeningScript | null`, which doesn't include `totalMarks` or the typed question union.
**Why it happens:** Phase 01 updated the API but left the page typing at the old interface.
**How to avoid:** Change `useState<ListeningScript | null>` to `useState<TypedListeningScript | null>` and update the import. The `FeedbackPanel` receives `questions={script!.questions}` — check if `FeedbackPanel` needs updating too (it accepts `ListeningQuestion[]`).
**Warning signs:** TypeScript errors when accessing `script.questions[n].type` or `script.totalMarks`.

---

## Code Examples

### Verified Chip Selected State (from app/listening/page.tsx)

```typescript
// Source: app/listening/page.tsx — MarkSelector chips (the visual reference for all Phase 02 toggles)
className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-center transition-all duration-200 active:scale-[0.99] ${
  loading ? 'pointer-events-none opacity-60' : ''
} ${
  marks === m
    ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_20px_45px_-30px_rgba(56,189,248,0.95)]'
    : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-200 hover:border-sky-400/25 hover:text-white'
}`}
```

### Dot Indicator (from app/listening/page.tsx)

```typescript
// Source: app/listening/page.tsx — selected state dot indicator (top-right corner)
<span
  className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full transition-all ${
    marks === m ? 'bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.13)]' : 'bg-zinc-600'
  }`}
/>
```

### Dynamic Lucide Icon Lookup (verified against lucide-react 1.7.0)

```typescript
// Source: verified by inspecting node_modules/lucide-react exports
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

function toPascalCase(kebab: string): string {
  return kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function getIcon(name: string): React.ComponentType<LucideProps> {
  const key = toPascalCase(name)
  const icon = (LucideIcons as Record<string, unknown>)[key]
  return (typeof icon === 'function' ? icon : LucideIcons.HelpCircle) as React.ComponentType<LucideProps>
}

// Usage in icon chip:
const IconComponent = getIcon(iconOption.name)
<IconComponent className={`w-5 h-5 ${selected ? 'text-white' : 'text-zinc-300'}`} />
```

### TypedQuestionPanel Props Interface (from UI-SPEC)

```typescript
// Source: 02-UI-SPEC.md component inventory
interface Props {
  questions: TypedListeningQuestion[]
  answers: Record<string, string>
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}
```

### GapFillQuestion Schema Addition Required

```typescript
// Source: 02-UI-SPEC.md schema prerequisite — add to lib/types.ts
export interface GapFillQuestion {
  type: 'gap-fill'
  id: string
  text: string         // keep for backward compat / display
  sentence: string     // ADD THIS: full sentence with ___ placeholder for inline input
  marks: number
  acceptedAnswers: string[]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `answers: string[]` (index-based) | `answers: Record<string, string>` (id-keyed) | Phase 02 migration | Supports heterogeneous question types without index fragility |
| Single textarea per question (`QuestionPanel`) | Per-type renderer dispatched from `TypedQuestionPanel` | Phase 02 | All 5 IB question types render with appropriate interaction affordances |
| `ListeningScript` type on page state | `TypedListeningScript` with typed question union | Phase 02 migration | TypeScript narrows `question.type` in each renderer without casting |

**Deprecated/outdated:**

- `QuestionPanel.tsx` with `ListeningQuestion[]` + `answers: string[]`: The old component is not deleted in Phase 02 but is no longer the entry point for the listening page.
- `checkAnswersPrompt` in `lib/prompts/listening.ts`: Currently sends `answers: string[]` — Phase 03 will need to update this for typed questions, but that is out of scope for Phase 02.

---

## Open Questions

1. **`FeedbackPanel` type compatibility after `script` type migration**
   - What we know: `FeedbackPanel` receives `questions={script!.questions}` which is typed as `ListeningQuestion[]`. After migrating `script` to `TypedListeningScript`, `script.questions` becomes `TypedListeningQuestion[]`.
   - What's unclear: Whether `FeedbackPanel` will compile without changes (it only uses `q.id` and `q.text`, which exist on all variants).
   - Recommendation: Check `FeedbackPanel.tsx` during Wave 0 and widen its `questions` prop to accept `TypedListeningQuestion[]` if needed.

2. **`checkAnswers` API payload shape**
   - What we know: The `checkAnswers` function in `page.tsx` currently sends `answers: string[]`. With `Record<string, string>`, the shape changes.
   - What's unclear: Whether the `check-answers` API route needs changes in Phase 02 or can defer to Phase 03.
   - Recommendation: Phase 02 should update the `checkAnswers` call to send `Object.entries(answers)` mapped to `{ id, value }` pairs, or document this as a known mismatch to address in Phase 03. Since Phase 02 doesn't implement grading, the check-answers button can remain disabled/non-functional for typed questions.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this is a pure frontend component phase with no new CLI tools, services, or runtimes beyond the existing Next.js dev server).

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — `CLAUDE.md` states "No test suite exists yet" |
| Config file | None |
| Quick run command | `npm run build` (type-checks via `tsc`) + `npm run lint` |
| Full suite command | `npm run build` |

No automated test infrastructure exists. All validation for this phase is via TypeScript compilation (`npm run build`) and manual browser verification.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LISTEN-01 | 5 distinct question type layouts visible in one session | manual-only (requires live API to generate a mixed session) | `npm run build` (compile gate) | N/A |
| LISTEN-04 | Person-attribution renders A/B/Ambos per statement | manual-only | `npm run build` | N/A |
| LISTEN-05 | Icon-matching uses Lucide icons, not emoji/SVG | manual-only + TypeScript (getIcon returns LucideProps component) | `npm run build` | N/A |

**Manual-only justification:** The project has no test suite. The interaction behaviors (chip selection, focus state, inline input) require a browser. TypeScript compilation is the automated gate.

### Sampling Rate

- **Per task commit:** `npm run build && npm run lint`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build` passes (zero type errors) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Add `sentence: string` to `GapFillQuestion` in `lib/types.ts` — required before `GapFillRenderer` can be implemented
- [ ] Update generation prompt in `lib/prompts/listening.ts` — change `text` field example to `sentence`, replace `tree` with `tree-pine` in allowed icon list
- [ ] Verify `FeedbackPanel.tsx` accepts `TypedListeningQuestion[]` (or widen its prop type) before migrating page state

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforcement |
|-----------|-------------|
| Always source nvm before running Node: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"` | Apply to any bash commands in plan tasks |
| `npm run build` validates types via `tsc` | Use as compile gate after every task |
| `npm run lint` for ESLint | Run alongside build |
| `npm run dev` starts server at localhost:3000 | Manual verification steps |
| All API routes use `runtime = 'nodejs'` and `maxDuration = 30` | Not directly relevant to Phase 02 (no new API routes) |
| Groq client lazy-initialised via Proxy — do not instantiate at module level | Not relevant to Phase 02 (no LLM calls) |
| Tailwind v4 + shadcn/ui (Radix preset) | All new components must use this stack |
| Zinc dark palette, Plus Jakarta Sans | Follow color + typography contract in UI-SPEC |
| `ConversationPanel.showTranscript` prop pattern | Not relevant to Phase 02 |

---

## Sources

### Primary (HIGH confidence)

- `lib/types.ts` (inspected directly) — all 5 `TypedListeningQuestion` variants; confirmed `GapFillQuestion` lacks `sentence` field
- `app/listening/page.tsx` (inspected directly) — MarkSelector chip pattern, `answers: string[]` state shape, `ListeningScript` type usage
- `components/listening/QuestionPanel.tsx` (inspected directly) — current component structure, `ListeningQuestion[]` prop type
- `components/ui/button.tsx` (inspected directly) — CVA variant structure confirms NOT suitable for chip toggle pattern
- `lib/prompts/listening.ts` (inspected directly) — confirmed `tree` in icon whitelist; `text` (not `sentence`) used for gap-fill
- lucide-react 1.7.0 `node_modules` (verified via Node.js) — 29/30 whitelisted icons found; `tree` is missing, `tree-pine` → `TreePine` exists
- `.planning/phases/02-question-type-ui/02-UI-SPEC.md` (inspected) — complete implementation contract
- `.planning/phases/02-question-type-ui/02-CONTEXT.md` (inspected) — locked decisions
- `package.json` (inspected) — confirmed lucide-react 1.7.0, Next.js 16.2.1, React 19.2.4, Tailwind 4.x, no test framework

### Secondary (MEDIUM confidence)

- `radix-ui ^1.4.3` unified package (observed from package.json and button.tsx import `from "radix-ui"`) — uses `Slot.Root` not `@radix-ui/react-slot`

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages inspected in node_modules with version verification
- Architecture: HIGH — types inspected directly; discriminated union patterns are stable TypeScript
- Pitfalls: HIGH — schema gap and icon mismatch verified by direct inspection, not assumption

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable libraries; lucide-react icon list could change on major bump)
