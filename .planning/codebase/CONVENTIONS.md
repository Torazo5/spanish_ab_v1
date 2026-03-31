# Code Conventions

## Naming

- **Files**: kebab-case for routes (`generate-script/route.ts`), PascalCase for components (`ObserverPanel.tsx`), camelCase for hooks (`useOralSession.ts`) and lib files (`groq.ts`)
- **Components**: PascalCase, named exports (not default) except page components
- **Hooks**: `use` prefix, camelCase, named exports
- **Types**: PascalCase for interfaces/type aliases, exported from `lib/types.ts`
- **Constants**: UPPER_SNAKE_CASE for model registries (`MODELS`), PascalCase arrays (`IB_TOPICS`)

## TypeScript

- Strict mode enabled
- Type imports with `import type { ... }` syntax
- Request body typing via `as` assertion on `req.json()` — no runtime validation (Zod not used)
- Union types for enums (`OralPhase`, `ErrorCategory`, `IbTopic`) rather than TS enums
- Shared types in `lib/types.ts`, co-located types in hook files for internal state

## React Patterns

- `'use client'` directive on all interactive components and hooks
- `useState` + `useCallback` + `useRef` — no external state management
- Ref pattern for callbacks to avoid stale closures (`onBlobReadyRef.current = onBlobReady`)
- Ref pattern for accessing latest state in callbacks without re-creating them (`topicRef`, `sessionRef`)
- Hooks return object destructuring pattern: `{ speak, stop, isSpeaking }`

## API Routes

- Every route exports `runtime = 'nodejs'` and `maxDuration = 30`
- SSE routes: Manual `ReadableStream` construction with `event:` + `data:` lines, `text/event-stream` content type
- JSON routes: `NextResponse.json()` for responses
- Error handling: try/catch with fallback objects or error JSON responses
- LLM JSON parsing: Always strip markdown code fences (`/^```(?:json)?\n?/`) before `JSON.parse`

## Styling

- Tailwind v4 with zinc color palette (dark theme throughout)
- `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge) for conditional classes
- Inline Tailwind classes — no CSS modules or styled-components
- shadcn/ui components in `components/ui/` — Radix primitives, not directly modified
- Custom interactive elements use `transition-all active:scale-95` pattern
- Font: Plus Jakarta Sans via `next/font/google`

## Error Handling

- API: try/catch at route level, return error JSON or fallback objects
- Client: Error state string in page component, displayed inline
- TTS: Singleton reset on error (`tts = null`) for self-healing
- Observer: Unicode normalization to filter false-positive accent errors from Whisper

## Async Patterns

- `Promise.all` for parallel API calls (conversation + observer)
- SSE streaming via `ReadableStream` + `TextEncoder` on server, `reader.read()` loop on client
- `AbortController` for cancellation support in oral session
- Groq SDK streaming with `for await` loops

## Import Organization

- Next.js imports first (`next/server`, `next/link`, `next/font`)
- React imports (`useState`, `useCallback`, etc.)
- External packages (`lucide-react`, `groq-sdk`, `msedge-tts`)
- Internal `@/` path aliases (`@/lib/`, `@/components/`, `@/hooks/`)
