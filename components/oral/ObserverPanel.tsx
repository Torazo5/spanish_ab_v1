'use client'
import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { ObserverFeedback, GrammarError } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  gender: 'bg-purple-900/60 text-purple-200',
  tense: 'bg-blue-900/60 text-blue-200',
  conjugation: 'bg-orange-900/60 text-orange-200',
  vocabulary: 'bg-cyan-900/60 text-cyan-200',
  'word-order': 'bg-pink-900/60 text-pink-200',
}

const SEVERITY_STYLES: Record<string, string> = {
  major: 'border-l-red-400',
  minor: 'border-l-yellow-500',
}

/**
 * Highlights only the words that differ between original and correction.
 */
function DiffHighlight({ original, correction }: { original: string; correction: string }) {
  const origWords = original.split(/\s+/)
  const corrWords = correction.split(/\s+/)
  const maxLen = Math.max(origWords.length, corrWords.length)

  // Find which original words differ from the correction
  const diffIndices = new Set<number>()
  for (let i = 0; i < maxLen; i++) {
    if ((origWords[i] ?? '').toLowerCase() !== (corrWords[i] ?? '').toLowerCase()) {
      diffIndices.add(i)
    }
  }

  return (
    <>
      <span className="text-sm bg-red-500/20 px-1.5 py-0.5 rounded">
        {origWords.map((word, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <span className={diffIndices.has(i) ? 'text-red-300 font-bold underline decoration-red-400 decoration-2 underline-offset-2' : 'text-red-300/70'}>
              {word}
            </span>
          </span>
        ))}
      </span>
      <span className="text-zinc-600">→</span>
      <span className="text-sm bg-green-500/15 px-1.5 py-0.5 rounded">
        {corrWords.map((word, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <span className={diffIndices.has(i) ? 'text-green-300 font-bold' : 'text-green-300/70'}>
              {word}
            </span>
          </span>
        ))}
      </span>
    </>
  )
}

/**
 * Renders the original message with error words bolded + underlined in red.
 * Uses case-insensitive matching to find the first occurrence of each error's
 * original text and wraps it.
 */
function AnnotatedMessage({ message, errors }: { message: string; errors: GrammarError[] }) {
  const segments = useMemo(() => {
    if (errors.length === 0) return [{ text: message, isError: false }]

    // Find all error spans in the original message
    type Span = { start: number; end: number; error: GrammarError }
    const spans: Span[] = []
    const lowerMsg = message.toLowerCase()
    const used = new Set<number>() // track used positions to avoid overlap

    for (const err of errors) {
      const needle = err.original.toLowerCase()
      let searchFrom = 0
      while (searchFrom < lowerMsg.length) {
        const idx = lowerMsg.indexOf(needle, searchFrom)
        if (idx === -1) break
        // Check no overlap with existing spans
        const overlaps = spans.some(
          (s) => idx < s.end && idx + needle.length > s.start
        )
        if (!overlaps) {
          spans.push({ start: idx, end: idx + needle.length, error: err })
          break
        }
        searchFrom = idx + 1
      }
    }

    // Sort spans by position
    spans.sort((a, b) => a.start - b.start)

    // Build segments
    const result: { text: string; isError: boolean }[] = []
    let cursor = 0
    for (const span of spans) {
      if (span.start > cursor) {
        result.push({ text: message.slice(cursor, span.start), isError: false })
      }
      result.push({ text: message.slice(span.start, span.end), isError: true })
      cursor = span.end
    }
    if (cursor < message.length) {
      result.push({ text: message.slice(cursor), isError: false })
    }

    return result
  }, [message, errors])

  return (
    <p className="text-sm text-zinc-200 leading-relaxed">
      {segments.map((seg, i) =>
        seg.isError ? (
          <span key={i} className="font-bold underline decoration-red-400 decoration-2 underline-offset-2 text-red-300">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  )
}

interface Props {
  feedbackHistory: ObserverFeedback[]
}

export function ObserverPanel({ feedbackHistory }: Props) {
  // Track dismissed errors by "turnNumber-errorIndex"
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set(prev).add(key))
  }

  if (feedbackHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm text-center px-4">
        Tutor feedback will appear here as you speak
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 overflow-y-auto flex-1 pr-1">
      {[...feedbackHistory].reverse().map((fb) => {
        const visibleErrors = fb.errors.filter(
          (_, i) => !dismissed.has(`${fb.turnNumber}-${i}`)
        )

        return (
          <div key={fb.turnNumber} className="border border-zinc-700/60 rounded-xl p-4 space-y-3">
            <div className="text-[11px] text-zinc-500 font-medium">Turn {fb.turnNumber}</div>

            {/* Original message with inline error highlights */}
            {fb.originalMessage && (
              <div className="bg-zinc-900/80 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">You said</div>
                <AnnotatedMessage message={fb.originalMessage} errors={visibleErrors} />
              </div>
            )}

            {/* Individual error cards */}
            {visibleErrors.length > 0 && (
              <div className="space-y-2">
                {fb.errors.map((err, i) => {
                  const key = `${fb.turnNumber}-${i}`
                  if (dismissed.has(key)) return null
                  return (
                    <div
                      key={i}
                      className={`bg-zinc-900/60 rounded-lg p-3 border-l-2 ${SEVERITY_STYLES[err.severity] ?? 'border-l-zinc-600'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <DiffHighlight original={err.original} correction={err.correction} />
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[err.category] ?? 'bg-zinc-700 text-zinc-300'}`}>
                            {err.category}
                          </span>
                        </div>
                        <button
                          onClick={() => dismiss(key)}
                          className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-zinc-800"
                          title="Dismiss — this feedback is incorrect"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed mt-1.5">{err.explanation}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Corrected version */}
            {fb.correctedSentence && (
              <div className="bg-zinc-900/50 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Corrected</div>
                <p className="text-green-200 text-sm leading-relaxed">{fb.correctedSentence}</p>
              </div>
            )}

            {/* General feedback */}
            {fb.generalFeedback && (
              <div className="bg-amber-950/40 border border-amber-800/30 rounded-lg p-3">
                <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-1.5">Feedback</div>
                <p className="text-amber-200 text-xs leading-relaxed">{fb.generalFeedback}</p>
              </div>
            )}

            {visibleErrors.length === 0 && !fb.generalFeedback && (
              <p className="text-green-400 text-xs">No errors detected</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
