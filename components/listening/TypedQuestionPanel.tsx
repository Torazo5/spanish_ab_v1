'use client'
import type { TypedListeningQuestion } from '@/lib/types'
import { McqRenderer } from '@/components/listening/McqRenderer'
import { TfngRenderer } from '@/components/listening/TfngRenderer'
import { GapFillRenderer } from '@/components/listening/GapFillRenderer'
import { IconMatchingRenderer } from '@/components/listening/IconMatchingRenderer'
import { PersonAttributionRenderer } from '@/components/listening/PersonAttributionRenderer'

interface Props {
  questions: TypedListeningQuestion[]
  answers: Record<string, string>
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}

export function TypedQuestionPanel({ questions, answers, onAnswerChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Questions</h3>
      {questions.map((q) => {
        const answer = answers[q.id] ?? ''
        switch (q.type) {
          case 'mcq':
            return <McqRenderer key={q.id} question={q} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'true-false-notgiven':
            return <TfngRenderer key={q.id} question={q} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'gap-fill':
            return <GapFillRenderer key={q.id} question={q} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'icon-matching':
            return <IconMatchingRenderer key={q.id} question={q} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />
          case 'person-attribution':
            return <PersonAttributionRenderer key={q.id} question={q} answer={answer} onAnswerChange={onAnswerChange} disabled={disabled} />
        }
      })}
    </div>
  )
}
