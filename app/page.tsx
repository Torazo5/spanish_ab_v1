import Link from 'next/link'
import { Headphones, Mic, Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.15),transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] text-white px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-8 lg:flex-row lg:items-center lg:gap-12">
        <section className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Start here
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Try one spoken Spanish reply before you do anything else
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Open the oral mode and we will walk you through it: Luis speaks first, you tap the mic once, and the tutor notes show up immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">1. Listen</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">2. Reply once</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">3. See instant feedback</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/oral"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-[0_25px_55px_-28px_rgba(16,185,129,0.95)] transition-all hover:bg-emerald-400"
            >
              <Mic className="h-5 w-5" />
              Try Oral Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/listening"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-zinc-200 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Headphones className="h-4 w-4" />
              Or go to Listening
            </Link>
          </div>
        </section>

        <section className="w-full max-w-xl">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-black/25 shadow-[0_35px_90px_-50px_rgba(0,0,0,0.9)]">
            <div className="border-b border-white/10 px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                Guided Oral Preview
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/8 p-5">
                <p className="text-sm font-semibold text-white">Luis starts the conversation for you</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  No setup wall first. We start with a safe topic, medium difficulty, and natural speech feedback so the feature feels immediate.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Luis</p>
                  <p className="mt-2 text-sm text-white">Hola, cuentame un poco sobre tu colegio. Que te gusta mas?</p>
                </div>
                <div className="rounded-2xl border border-sky-400/20 bg-sky-500/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">You</p>
                  <p className="mt-2 text-sm text-white">Tap the mic once and answer. The tutor notes appear on the right after your reply.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Default topic</p>
                  <p className="mt-1">School</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Reply mode</p>
                  <p className="mt-1">Auto</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Feedback</p>
                  <p className="mt-1">Natural</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
