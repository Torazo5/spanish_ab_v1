'use client'
import type { ObserverFeedback } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const CATEGORY_COLORS: Record<string, string> = {
  gender: 'bg-purple-900 text-purple-200',
  tense: 'bg-blue-900 text-blue-200',
  conjugation: 'bg-orange-900 text-orange-200',
  vocabulary: 'bg-cyan-900 text-cyan-200',
  'word-order': 'bg-pink-900 text-pink-200',
}

const SEVERITY_COLORS: Record<string, string> = {
  major: 'bg-red-900 text-red-200',
  minor: 'bg-yellow-900 text-yellow-200',
}

interface Props {
  feedbackHistory: ObserverFeedback[]
}

export function ObserverPanel({ feedbackHistory }: Props) {
  if (feedbackHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm text-center px-4">
        Tutor feedback will appear here as you speak
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto flex-1">
      {[...feedbackHistory].reverse().map((fb) => (
        <div key={fb.turnNumber} className="border border-zinc-700 rounded-xl p-3 text-sm">
          <div className="text-xs text-zinc-500 mb-2">Turn {fb.turnNumber}</div>

          {fb.errors.length > 0 && (
            <div className="space-y-2 mb-2">
              {fb.errors.map((err, i) => (
                <div key={i} className="bg-zinc-900 rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-red-400 line-through text-xs">{err.original}</span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-green-300 text-xs font-medium">{err.correction}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[err.category] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {err.category}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[err.severity] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {err.severity}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs">{err.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {fb.correctedSentence && (
            <div className="bg-zinc-900 rounded-lg p-2 mb-2">
              <div className="text-[10px] text-zinc-500 mb-1">corrected</div>
              <p className="text-green-200 text-xs font-medium">{fb.correctedSentence}</p>
            </div>
          )}

          {fb.generalFeedback && (
            <div className="bg-amber-950/50 border border-amber-800/40 rounded-lg p-2">
              <div className="text-[10px] text-amber-400 mb-1">feedback</div>
              <p className="text-amber-200 text-xs">{fb.generalFeedback}</p>
            </div>
          )}

        </div>
      ))}
    </div>
  )
}
