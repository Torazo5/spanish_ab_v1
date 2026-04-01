'use client'

import { Fragment } from 'react'
import { GapFillQuestion } from '@/lib/types'

interface Props {
  questions: Array<{
    question: GapFillQuestion
    markNumber: number
  }>
  answers: Record<string, string>
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}

export function GapFillRenderer({ questions, answers, onAnswerChange, disabled }: Props) {
  const prompt = questions[0]?.question.text ?? 'Completa el texto.'

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-300">
        {prompt}
      </p>

      <p className={`text-sm text-zinc-200 leading-relaxed ${disabled ? 'opacity-60' : ''}`}>
        {questions.map(({ question, markNumber }, index) => {
          const parts = question.sentence.split('___')
          const answer = answers[question.id] ?? ''

          return (
            <Fragment key={question.id}>
              {index > 0 && ' '}
              <span>{parts[0]}</span>
              <span className="mx-1 inline-flex whitespace-nowrap align-middle">
                <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-sky-400/20 bg-sky-950/30 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                  {markNumber}
                </span>
                <input
                  className="ml-1 inline-block w-24 border-b-2 border-zinc-600 bg-transparent px-1 text-center text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-sky-400"
                  aria-label={`Mark ${markNumber}`}
                  value={answer}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  disabled={disabled}
                  placeholder={String(markNumber)}
                />
              </span>
              <span>{parts[1]}</span>
            </Fragment>
          )
        })}
      </p>
    </div>
  )
}
