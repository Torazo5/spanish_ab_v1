'use client'

import { GapFillQuestion } from '@/lib/types'

interface Props {
  question: GapFillQuestion
  answer: string
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}

export function GapFillRenderer({ question, answer, onAnswerChange, disabled }: Props) {
  const parts = question.sentence.split('___')

  return (
    <div>
      <p className="text-sm text-zinc-300">
        <span className="font-medium text-zinc-400">{question.id}.</span> {question.text}
      </p>
      <p className={`text-sm text-zinc-200 leading-relaxed mt-2 ${disabled ? 'opacity-60' : ''}`}>
        <span>{parts[0]}</span>
        <input
          className="inline-block w-32 border-b-2 border-zinc-600 bg-transparent text-sm text-zinc-100 text-center outline-none focus:border-sky-400 transition-colors duration-200 mx-1 px-1"
          aria-label="Fill in the blank"
          value={answer}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
          disabled={disabled}
        />
        <span>{parts[1]}</span>
      </p>
    </div>
  )
}
