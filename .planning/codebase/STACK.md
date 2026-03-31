# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- TypeScript ^5 - All application code (components, hooks, API routes, lib)

**Secondary:**
- CSS (Tailwind v4) - Styling via `app/globals.css` and utility classes

## Runtime

**Environment:**
- Node.js v22.22.2 (managed via nvm)
- All API routes explicitly set `export const runtime = 'nodejs'`

**Package Manager:**
- npm 10.9.7
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.2.1 - App Router (not Pages Router). Config at `next.config.ts` (currently empty/default).
- React 19.2.4 / React DOM 19.2.4

**UI:**
- Tailwind CSS ^4 - via `@tailwindcss/postcss` plugin in `postcss.config.mjs`
- shadcn/ui (^4.1.1 `shadcn` package) - Radix-based component library
- Radix UI ^1.4.3 - Underlying headless primitives for shadcn
- class-variance-authority ^0.7.1 - Component variant management (cva)
- clsx ^2.1.1 + tailwind-merge ^3.5.0 - Class name utilities
- tw-animate-css ^1.4.0 - Tailwind animation utilities
- Lucide React ^1.7.0 - Icon library

**State Management:**
- Zustand ^5.0.12 - Listed as dependency but no store files detected yet. State currently managed via React hooks.

**Build/Dev:**
- TypeScript ^5 - Strict mode enabled in `tsconfig.json`
- ESLint ^9 with `eslint-config-next` 16.2.1 (core-web-vitals + typescript presets) - Config at `eslint.config.mjs`
- PostCSS via `postcss.config.mjs` with `@tailwindcss/postcss` plugin

**Testing:**
- No test framework configured. No test suite exists.

## Key Dependencies

**Critical (AI/ML):**
- `groq-sdk` ^1.1.2 - Client for Groq API (LLM chat completions + Whisper STT). Lazy-initialized via Proxy in `lib/groq.ts`.
- `msedge-tts` ^2.0.4 - Microsoft Edge Text-to-Speech engine (no API key required). Module-level cached instance in `app/api/tts/route.ts`.

**Infrastructure:**
- `next` 16.2.1 - Full-stack framework, handles routing, bundling, API routes, SSR
- `react` / `react-dom` 19.2.4 - UI rendering

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2017
- Module resolution: bundler
- Strict mode: enabled
- Path alias: `@/*` maps to project root (`"./*"`)
- JSX: react-jsx
- Incremental compilation: enabled

**ESLint (`eslint.config.mjs`):**
- Flat config format (ESLint v9)
- Extends: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**PostCSS (`postcss.config.mjs`):**
- Single plugin: `@tailwindcss/postcss`

**Next.js (`next.config.ts`):**
- Default/empty configuration

**Environment:**
- Single required env var: `GROQ_API_KEY` in `.env.local`
- `.env.example` documents the required variable

**Font:**
- Plus Jakarta Sans loaded via `next/font/google` in `app/layout.tsx`, exposed as CSS variable `--font-jakarta`

## Platform Requirements

**Development:**
- Node.js v22+ (nvm recommended)
- npm 10+
- `GROQ_API_KEY` set in `.env.local` (free tier from console.groq.com)

**Production:**
- Any Node.js hosting platform compatible with Next.js 16 (Vercel, etc.)
- `maxDuration = 30` set on all API routes (relevant for serverless platforms)
- No database required - stateless application

## Scripts

```bash
npm run dev      # Next.js dev server at localhost:3000
npm run build    # Production build (includes tsc type checking)
npm run start    # Start production server
npm run lint     # ESLint
npx tsc --noEmit # Type-check only (no emit)
```

---

*Stack analysis: 2026-03-30*
