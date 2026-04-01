'use client'

import type { AnswerResult, TrueFalseNotGivenQuestion } from '@/lib/types'
import { getMarkLabel } from '@/lib/listening-structure'

interface Props {
  question: TrueFalseNotGivenQuestion
  markNumber: number
  answer: string
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
  result?: AnswerResult
}

const TFNG_OPTIONS: { label: string; value: 'true' | 'false' | 'not-given' }[] = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
  { label: 'Not Given', value: 'not-given' },
]

export function TfngRenderer({ question, markNumber, answer, onAnswerChange, disabled, result }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-300">
          <span className="font-medium text-zinc-400">{getMarkLabel(markNumber)}.</span> {question.text}
        </p>
        {result && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            result.correct
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>
            {result.correct ? 'Correct' : 'Incorrect'}
          </span>
        )}
      </div>
      <div
        className={`flex gap-2 mt-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        role="group"
        aria-label={question.text}
      >
        {TFNG_OPTIONS.map(({ label, value }) => {
          const selected = answer === value
          const isCorrectOption = value === question.correctAnswer
          const reviewClass = result == null
            ? null
            : selected && result.correct
              ? 'border-green-500/60 bg-green-500/15 text-white'
              : selected && !result.correct
                ? 'border-red-500/60 bg-red-500/15 text-white'
                : !result.correct && isCorrectOption
                  ? 'border-green-500/60 bg-green-500/10 text-white'
                  : null
          return (
            <button
              key={value}
              type="button"
              onClick={() => onAnswerChange(question.id, value)}
              className={[
                'rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200',
                reviewClass ?? (selected
                  ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_8px_20px_-10px_rgba(56,189,248,0.6)]'
                  : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-300 hover:border-sky-400/25 hover:text-white'),
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>
      {result && !result.correct && result.correctAnswer && (
        <p className="mt-2 text-xs text-green-300">Correct answer: {result.correctAnswer}</p>
      )}
    </div>
  )
}
