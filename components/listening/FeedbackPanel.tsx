'use client'
import type { AnswerResult, TypedListeningQuestion } from '@/lib/types'
import { TypedQuestionPanel } from '@/components/listening/TypedQuestionPanel'

interface Props {
  results: AnswerResult[]
  questions: TypedListeningQuestion[]
  answers: Record<string, string>
  totalScore: number
  maxScore: number
  encouragement: string
}

export function FeedbackPanel({ results, questions, answers, totalScore, maxScore, encouragement }: Props) {
  const pct = Math.round((totalScore / maxScore) * 100)
  const resultsByQuestionId = Object.fromEntries(
    results.map((result) => [result.questionId, result])
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Results</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-white">{totalScore}</span>
          <span className="text-zinc-500"> / {maxScore} marks</span>
          <span className={`ml-2 text-sm font-medium ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {pct}%
          </span>
        </div>
      </div>

      <p className="text-sm text-zinc-400 italic">{encouragement}</p>

      <TypedQuestionPanel
        questions={questions}
        answers={answers}
        onAnswerChange={() => {}}
        disabled
        resultsByQuestionId={resultsByQuestionId}
      />
    </div>
  )
}
