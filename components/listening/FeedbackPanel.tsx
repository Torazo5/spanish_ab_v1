'use client'
import type { AnswerResult, TypedListeningQuestion } from '@/lib/types'

interface Props {
  results: AnswerResult[]
  questions: TypedListeningQuestion[]
  totalScore: number
  maxScore: number
  encouragement: string
}

export function FeedbackPanel({ results, questions, totalScore, maxScore, encouragement }: Props) {
  const pct = Math.round((totalScore / maxScore) * 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Results</h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-white">{totalScore}</span>
          <span className="text-zinc-500">/{maxScore}</span>
          <span className={`ml-2 text-sm font-medium ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {pct}%
          </span>
        </div>
      </div>

      <p className="text-sm text-zinc-400 italic">{encouragement}</p>

      <div className="space-y-3">
        {results.map((result, i) => {
          const question = questions.find((q) => q.id === result.questionId)
          return (
            <div
              key={result.questionId}
              className={`rounded-lg p-3 border ${
                result.correct
                  ? 'border-green-800 bg-green-950/30'
                  : 'border-red-800 bg-red-950/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 text-sm shrink-0 ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {result.correct ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-xs text-zinc-400 mb-0.5">{i + 1}. {question?.text}</p>
                  <p className="text-sm text-zinc-300">{result.feedback}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
