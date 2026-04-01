'use client'

import type { PersonAttributionQuestion } from '@/lib/types'

interface Props {
  question: PersonAttributionQuestion
  answer: string
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}

const BUTTONS: { value: 'A' | 'B' | 'ambos'; label: string }[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'ambos', label: 'Ambos' },
]

export function PersonAttributionRenderer({ question, answer, onAnswerChange, disabled = false }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/70 mb-2">
        {question.personA} = A &middot; {question.personB} = B
      </p>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-zinc-200 flex-1">{question.text}</span>

        <div
          className={`flex gap-1.5 shrink-0 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          role="group"
          aria-label={question.text}
        >
          {BUTTONS.map(({ value, label }) => {
            const selected = answer === value
            return (
              <button
                key={value}
                onClick={() => onAnswerChange(question.id, value)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                  selected
                    ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_8px_20px_-10px_rgba(56,189,248,0.4)]'
                    : 'border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-sky-400/25 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
