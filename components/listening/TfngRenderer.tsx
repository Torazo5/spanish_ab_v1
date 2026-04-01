'use client'

import { TrueFalseNotGivenQuestion } from '@/lib/types'

interface Props {
  question: TrueFalseNotGivenQuestion
  answer: string
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}

const TFNG_OPTIONS: { label: string; value: 'true' | 'false' | 'not-given' }[] = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
  { label: 'Not Given', value: 'not-given' },
]

export function TfngRenderer({ question, answer, onAnswerChange, disabled }: Props) {
  return (
    <div>
      <p className="text-sm text-zinc-300">
        <span className="font-medium text-zinc-400">{question.id}.</span> {question.text}
      </p>
      <div
        className={`flex gap-2 mt-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        role="group"
        aria-label={question.text}
      >
        {TFNG_OPTIONS.map(({ label, value }) => {
          const selected = answer === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onAnswerChange(question.id, value)}
              className={[
                'rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200',
                selected
                  ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_8px_20px_-10px_rgba(56,189,248,0.6)]'
                  : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-300 hover:border-sky-400/25 hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
