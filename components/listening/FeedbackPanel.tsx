'use client'
import type { AnswerResult, TypedListeningQuestion } from '@/lib/types'
import { getMarkLabel } from '@/lib/listening-structure'

interface Props {
  results: AnswerResult[]
  questions: TypedListeningQuestion[]
  totalScore: number
  maxScore: number
  encouragement: string
}

export function FeedbackPanel({ results, questions, totalScore, maxScore, encouragement }: Props) {
  const pct = Math.round((totalScore / maxScore) * 100)
  const questionMap = new Map(
    questions.map((question, index) => [question.id, { question, markNumber: index + 1 }])
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

      <div className="space-y-3">
        {results.map((result) => {
          const entry = questionMap.get(result.questionId)
          const question = entry?.question
          const isGapFill = question?.type === 'gap-fill'
          const marksLabel = result.marks !== undefined
            ? `${result.marks} / ${question?.marks ?? '?'} mark${(question?.marks ?? 1) !== 1 ? 's' : ''}`
            : null

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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs text-zinc-400">
                      {entry ? `${getMarkLabel(entry.markNumber)}. ` : ''}
                      {question?.text}
                    </p>
                    {marksLabel && (
                      <span className={`text-xs font-medium shrink-0 ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                        {marksLabel}
                      </span>
                    )}
                  </div>
                  {/* Gap-fill: show AI explanatory feedback */}
                  {isGapFill && result.feedback && (
                    <p className="text-sm text-zinc-300">{result.feedback}</p>
                  )}
                  {/* Deterministic incorrect: show correct answer */}
                  {!isGapFill && !result.correct && result.correctAnswer && (
                    <p className="text-sm text-zinc-300">
                      Correct answer: <span className="text-green-400 font-medium">{result.correctAnswer}</span>
                    </p>
                  )}
                  {/* Deterministic correct: brief confirmation */}
                  {!isGapFill && result.correct && (
                    <p className="text-sm text-zinc-400">Correct!</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
