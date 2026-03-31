# Technology Stack — v1.1 IB-Authentic Listening Practice

**Project:** Spanish Practice Tool (milestone v1.1)
**Researched:** 2026-03-31
**Scope:** Stack ADDITIONS only. Existing validated stack is not reconsidered.

---

## Verdict: Minimal additions needed

The existing stack handles every new requirement with two targeted additions:
one new shadcn/ui component (RadioGroup) and a Lucide dynamic-icon lookup
utility written in-project. No new npm packages are required.

---

## New shadcn/ui Component Required

### RadioGroup — MUST INSTALL

**Why:** MCQ, True/False/Not Given, icon-matching, and person-attribution all
present a fixed set of mutually-exclusive choices. RadioGroup is the
semantically correct primitive (WAI-ARIA radio group pattern with roving
tabindex). Using `<select>` or button arrays instead would be non-standard
and require custom keyboard handling.

**Install:**
```bash
npx shadcn@latest add radio-group
```

This generates `components/ui/radio-group.tsx` wrapping
`@radix-ui/react-radio-group` (already a transitive dep via `radix-ui
^1.4.3`). The component exposes `RadioGroup` (controlled via `value` /
`onValueChange`) and `RadioGroupItem` (each option, takes a string `value`
prop). Styling slots straight into existing Tailwind v4 + dark zinc palette
with no configuration.

**Usage pattern for all deterministic question types:**
```tsx
<RadioGroup value={answer} onValueChange={setAnswer} disabled={submitted}>
  <RadioGroupItem value="a" /> Option A
  <RadioGroupItem value="b" /> Option B
</RadioGroup>
```

Confidence: HIGH — official shadcn/ui docs confirm availability; Radix dep
already present.

---

## Label Component (OPTIONAL — LOW priority)

**Install:** `npx shadcn@latest add label`

Useful for wiring `<Label htmlFor>` to `<RadioGroupItem id>` for accessible
click targets. Not strictly required if `<label>` HTML elements are used
directly, which is equally valid. Install only if the team prefers the
shadcn-styled variant.

---

## No Other shadcn Components Needed

| Considered | Decision | Reason |
|------------|----------|--------|
| Tooltip | Skip | Icon-matching labels render inline; no hover tooltip needed |
| Separator | Skip | Tailwind `border-t border-zinc-800` is sufficient |
| ScrollArea | Skip | Tailwind `overflow-y-auto` works; ScrollArea adds ~3KB for no gain |
| Accordion | Skip | Transcript reveal is a simple toggle, not an accordion |
| Tabs | Skip | Review-with-transcript mode is state-driven, not tab-driven |

---

## Lucide Dynamic Icon Lookup — In-Project Utility

**Why:** Icon-matching questions require the LLM to name icons in generated
JSON, and the UI must render the correct Lucide component at runtime without
importing all ~1500 icons statically.

**What the installed library provides (verified v1.7.0):**
`lucide-react` ships `dynamicIconImports` — a map of kebab-case icon names
to lazy import functions. Keys are the original Lucide names in kebab-case
(e.g., `"plane"`, `"bus"`, `"apple"`, `"sun"`).

```ts
// node_modules/lucide-react/dist/esm/dynamicIconImports.js
const dynamicIconImports = {
  "plane": () => import('./icons/plane.js'),
  "bus":   () => import('./icons/bus.js'),
  // ...~1500 entries
}
```

**Recommended approach — static import map, not dynamic imports:**

For IB icon-matching questions, the LLM will be constrained to a curated
allowlist of ~20-30 icons (transport, weather, food, activities, health).
A static lookup component is simpler, faster, and avoids Next.js dev-server
slowdowns documented in the lucide-icons/lucide issue tracker (issue #1576).

```tsx
// components/listening/DynamicIcon.tsx
import {
  Plane, Bus, Train, Car, Bicycle,
  Sun, Cloud, CloudRain, Snowflake,
  Apple, Pizza, Coffee,
  Dumbbell, Music, Book,
  // ...expand as needed for IB topics
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  plane: Plane, bus: Bus, train: Train, car: Car, bicycle: Bicycle,
  sun: Sun, cloud: Cloud, 'cloud-rain': CloudRain, snowflake: Snowflake,
  apple: Apple, pizza: Pizza, coffee: Coffee,
  dumbbell: Dumbbell, music: Music, book: Book,
}

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <span className="text-zinc-600 text-xs">[{name}]</span>
  return <Icon {...props} />
}
```

**Why NOT `dynamicIconImports` with `React.lazy`:**
- Adds async waterfall at render time (skeleton flash on each icon)
- Requires `next.config.ts` `transpilePackages` change
- Unnecessary: the LLM prompt will constrain icon names to the allowlist
- The static map is tree-shaken by Next.js bundler; unused icons drop out

**LLM prompt constraint:** The generate-script prompt must include the exact
kebab-case icon names the LLM is allowed to emit (e.g., `"plane"`, `"bus"`).
This is a prompt-engineering concern, not a library concern.

Confidence: HIGH — verified against installed v1.7.0 dist files.

---

## State Management for Multi-Type Answer Tracking

**Use React `useState` in the listening page, not Zustand.**

Zustand ^5.0.12 is installed but currently unused (no store files exist).
Introducing a store for listening session state would be premature — all
listening state is session-local, single-page, and does not need to be
shared across components outside the listening feature tree.

**Recommended shape:**
```ts
// In app/listening/page.tsx (or a useListeningSession hook)

type QuestionAnswer =
  | { type: 'mcq' | 'tfng' | 'icon' | 'person'; value: string }
  | { type: 'gap-fill' | 'open'; value: string }

const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({})
const [submitted, setSubmitted] = useState(false)
const [reviewMode, setReviewMode] = useState(false)
const [transcriptVisible, setTranscriptVisible] = useState(false)
```

`answers` is keyed by `question.id` (string). Each question type stores its
answer as a discriminated union so grading logic can branch by type without
casting.

**Client-side grading:**
```ts
function gradeAnswer(question: ListeningQuestion, answer: QuestionAnswer): boolean {
  if (answer.type === 'mcq' || answer.type === 'tfng' ||
      answer.type === 'icon' || answer.type === 'person') {
    return answer.value === question.correctAnswer
  }
  return false // AI-graded types return false here; server grades them
}
```

`correctAnswer` is included in the generated JSON from the LLM and stored
in the question object (never shown to the user before submission).

**Review mode:** `reviewMode = true` reveals the transcript and re-enables
input for AI-graded questions only. Deterministic answers are locked after
first submission to prevent trivial re-grading. This is enforced by passing
`disabled={submitted && isDeterministicType(q.type)}` to each question
component.

Confidence: HIGH — standard React patterns, no external dependency needed.

---

## Types Needed in `lib/types.ts`

The existing `ListeningQuestion` type (`{ id, text }`) must be extended.
No new libraries — TypeScript discriminated unions cover all new shapes.

```ts
export type QuestionType = 'mcq' | 'tfng' | 'gap-fill' | 'icon' | 'person'

export interface McqOption { id: string; text: string }

export interface ListeningQuestion {
  id: string
  type: QuestionType
  text: string
  // For MCQ
  options?: McqOption[]
  // For icon-matching: array of { icon: string (kebab-case), label: string }
  iconOptions?: { icon: string; label: string }[]
  // For person-attribution: the two person names (defaults: "Persona A", "Persona B", "Ambos")
  personOptions?: string[]
  // For gap-fill: the sentence with ___ as placeholder
  gapSentence?: string
  // Correct answer for deterministic types (hidden from user until submit)
  correctAnswer?: string
}

export interface ListeningScript {
  script: string
  title: string
  questions: ListeningQuestion[]
}
```

The existing `AnswerResult` type remains unchanged. `check-answers` route
will only be called for `gap-fill` and `open` question types.

---

## API Route Changes

### `generate-script` — extend, do not replace
The route signature stays the same (POST body `{ topic }`). The LLM prompt
changes to request the new question schema. The route itself needs no code
changes beyond accepting the new JSON shape — validation is done by
`JSON.parse` + TypeScript casting, consistent with existing pattern.

### `check-answers` — scope reduction
Currently grades all questions. After this milestone it only receives
AI-gradeable questions (`gap-fill`, `open`). Client sends a filtered subset.
No route signature change required; the route doesn't care about question
type.

### No new API routes required
Transcript reveal and review mode are pure client-state toggles. No server
call needed.

---

## What NOT to Add

| Candidate | Decision | Reason |
|-----------|----------|--------|
| `zod` for JSON validation | Skip | Overkill for a local tool; existing try/catch + TS casting is sufficient |
| `react-hook-form` | Skip | No form submission complexity; controlled `useState` is cleaner |
| `framer-motion` | Skip | Answer reveal animations can use Tailwind `transition` classes |
| `@tanstack/react-query` | Skip | No caching, no background refetch needed; single fetch per session |
| Full `dynamicIconImports` | Skip | Static map of ~25 icons is simpler and faster (see above) |
| Zustand store for listening | Skip | State is single-page local; hook is sufficient |
| Additional shadcn components | Skip | Only RadioGroup provides real value |

---

## Installation Command (one-shot)

```bash
npx shadcn@latest add radio-group
```

That is the only `npm install` or `shadcn add` required for this milestone.
The `DynamicIcon` utility is written in-project with no new dependencies.

---

## Sources

- [shadcn/ui Radio Group docs](https://ui.shadcn.com/docs/components/radix/radio-group) — MEDIUM confidence (WebSearch confirmed, official URL)
- [Radix UI Radio Group primitives](https://www.radix-ui.com/primitives/docs/components/radio-group) — MEDIUM confidence
- [Lucide React docs](https://lucide.dev/guide/packages/lucide-react) — HIGH confidence (verified against installed v1.7.0 dist files)
- [lucide-icons/lucide issue #1576](https://github.com/lucide-icons/lucide/issues/1576) — dynamic import dev-server performance warning
- [Zustand v5 selectors discussion](https://github.com/pmndrs/zustand/discussions/2867) — MEDIUM confidence
- Installed package verified: `lucide-react@1.7.0`, `zustand@5.0.12`, `radix-ui@1.4.3`
