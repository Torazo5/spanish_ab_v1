'use client'
import { Textarea } from '@/components/ui/textarea'
import type { ListeningQuestion } from '@/lib/types'

interface Props {
  questions: ListeningQuestion[]
  answers: string[]
  onAnswerChange: (index: number, value: string) => void
  disabled?: boolean
}

export function QuestionPanel({ questions, answers, onAnswerChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
        Questions
      </h3>
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-1.5">
          <label className="text-sm text-zinc-300">
            <span className="font-medium text-zinc-400">{i + 1}. </span>
            {q.text}
          </label>
          <Textarea
            value={answers[i] ?? ''}
            onChange={(e) => onAnswerChange(i, e.target.value)}
            disabled={disabled}
            placeholder="Your answer..."
            rows={2}
            className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none text-sm"
          />
        </div>
      ))}
    </div>
  )
}
