'use client'

import type { AnswerResult, McqQuestion } from '@/lib/types'
import { getMarkLabel } from '@/lib/listening-structure'

interface Props {
  question: McqQuestion
  markNumber: number
  answer: string
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
  result?: AnswerResult
}

export function McqRenderer({ question, markNumber, answer, onAnswerChange, disabled, result }: Props) {
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
      <div className={`space-y-2 mt-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {question.options.map((option, i) => {
          const selected = answer === i.toString()
          const isCorrectOption = i === question.correctIndex
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
              key={i}
              type="button"
              aria-pressed={selected}
              onClick={() => onAnswerChange(question.id, i.toString())}
              className={[
                'rounded-xl border px-4 py-2.5 text-sm text-left w-full transition-all duration-200',
                reviewClass ?? (selected
                  ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_8px_20px_-10px_rgba(56,189,248,0.6)]'
                  : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-200 hover:border-sky-400/25 hover:text-white'),
              ].join(' ')}
            >
              <span className="text-[10px] font-semibold uppercase text-zinc-500 mr-2">
                {'ABCD'[i]}
              </span>
              {option}
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
