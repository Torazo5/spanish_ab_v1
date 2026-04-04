'use client'
import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ObserverFeedback, GrammarError } from '@/lib/types'
import { getFeedbackHeadline } from '@/lib/oral-feedback-summary'
import { ErrorCard } from './ErrorCard'

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
  autoCollapse?: boolean
}

export function ObserverPanel({ feedbackHistory, autoCollapse = false }: Props) {
  // Track dismissed errors by "turnNumber-errorIndex"
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  // Scope manual expand/collapse overrides to the current feedback list length.
  const [manualToggle, setManualToggle] = useState<Record<string, boolean>>({})

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

  const latestTurn = Math.max(...feedbackHistory.map((fb) => fb.turnNumber))

  return (
    <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
      {[...feedbackHistory].reverse().map((fb) => {
        const isCurrent = fb.turnNumber === latestTurn
        const visibleErrors = fb.errors.filter(
          (_, i) => !dismissed.has(`${fb.turnNumber}-${i}`)
        )
        const headline = getFeedbackHeadline({
          ...fb,
          errors: visibleErrors,
        })

        const toggleKey = `${feedbackHistory.length}-${fb.turnNumber}`
        const isExpanded = manualToggle[toggleKey] ?? (autoCollapse ? isCurrent : true)

        const errorCount = visibleErrors.length

        return (
          <div
            key={fb.turnNumber}
            className={`rounded-xl p-4 space-y-3 transition-colors ${
              isCurrent
                ? 'border-2 border-blue-500/40 bg-blue-950/10'
                : 'border border-zinc-700/60'
            }`}
          >
            {/* Turn header — clickable to expand/collapse */}
            <button
              onClick={() => setManualToggle((prev) => ({ ...prev, [toggleKey]: !isExpanded }))}
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 font-medium">Turn {fb.turnNumber}</span>
                {isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold uppercase tracking-wider">
                    Latest
                  </span>
                )}
                {!isExpanded && errorCount > 0 && (
                  <span className="text-[10px] text-red-400">
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                )}
                {!isExpanded && errorCount === 0 && !fb.generalFeedback && (
                  <span className="text-[10px] text-green-400">No errors</span>
                )}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
              <>
                {isCurrent && (
                  <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
                      {headline.title}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-100">{headline.detail}</p>
                  </div>
                )}

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
                        <ErrorCard
                          key={i}
                          error={err}
                          errorKey={key}
                          originalMessage={fb.originalMessage}
                          onDismiss={dismiss}
                        />
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
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
