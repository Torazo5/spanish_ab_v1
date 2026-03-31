'use client'
import { useState } from 'react'
import { Lightbulb, ClipboardCopy, Check, ChevronUp } from 'lucide-react'
import type { GrammarError } from '@/lib/types'

export const CATEGORY_COLORS: Record<string, string> = {
  gender: 'bg-purple-900/60 text-purple-200',
  tense: 'bg-blue-900/60 text-blue-200',
  conjugation: 'bg-orange-900/60 text-orange-200',
  vocabulary: 'bg-cyan-900/60 text-cyan-200',
  'word-order': 'bg-pink-900/60 text-pink-200',
}

export const SEVERITY_STYLES: Record<string, string> = {
  major: 'border-l-red-400',
  minor: 'border-l-yellow-500',
}

/** Highlights only the words that differ between original and correction. */
export function DiffHighlight({ original, correction }: { original: string; correction: string }) {
  const trimmedCorrection = correction.trim()

  if (!trimmedCorrection || trimmedCorrection.toLowerCase() === original.trim().toLowerCase()) {
    return (
      <span className="text-sm bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 font-bold">
        {original}
      </span>
    )
  }

  const origWords = original.split(/\s+/)
  const corrWords = trimmedCorrection.split(/\s+/)
  const maxLen = Math.max(origWords.length, corrWords.length)

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

// Module-level cache so re-clicking doesn't re-fetch
const drillCache = new Map<string, string>()

function buildClipboardPrompt(error: GrammarError, originalSentence: string): string {
  return `I'm learning Spanish (A2-B1 level) and made this mistake while speaking. Please help me understand it deeply.

**My sentence:** "${originalSentence}"
**My error:** I said "${error.original}" but it should be "${error.correction}"
**Error type:** ${error.category}
**Brief note:** ${error.explanation}

Please explain:
1. What grammar rule did I break and why?
2. Give me 3-5 example sentences showing correct usage
3. Are there common exceptions to this rule?
4. What's a good way to remember this rule?
5. Give me 3 fill-in-the-blank practice sentences`
}

/** Renders simple bold markdown (**text**) as <strong> elements. */
function renderBoldMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-zinc-100 font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

interface ErrorCardProps {
  error: GrammarError
  errorKey: string
  originalMessage: string
  onDismiss: (key: string) => void
}

export function ErrorCard({ error, errorKey, originalMessage, onDismiss }: ErrorCardProps) {
  const [drillState, setDrillState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [drillExplanation, setDrillExplanation] = useState<string | null>(null)
  const [drillExpanded, setDrillExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  async function handleDrill() {
    // If already loaded, just toggle visibility
    if (drillExplanation) {
      setDrillExpanded((prev) => !prev)
      return
    }

    // Check cache
    const cached = drillCache.get(errorKey)
    if (cached) {
      setDrillExplanation(cached)
      setDrillState('done')
      setDrillExpanded(true)
      return
    }

    setDrillState('loading')
    try {
      const res = await fetch('/api/oral/drill-deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalSentence: originalMessage, error }),
      })
      const data = await res.json()
      if (!res.ok || !data.explanation) {
        setDrillState('error')
        return
      }
      drillCache.set(errorKey, data.explanation)
      setDrillExplanation(data.explanation)
      setDrillState('done')
      setDrillExpanded(true)
    } catch {
      setDrillState('error')
    }
  }

  async function handleCopy() {
    const prompt = buildClipboardPrompt(error, originalMessage)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: clipboard API unavailable
    }
  }

  return (
    <div className={`bg-zinc-900/60 rounded-lg border-l-2 ${SEVERITY_STYLES[error.severity] ?? 'border-l-zinc-600'}`}>
      <div className="p-3 flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <DiffHighlight original={error.original} correction={error.correction} />
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[error.category] ?? 'bg-zinc-700 text-zinc-300'}`}>
              {error.category}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              error.severity === 'major'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {error.severity}
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">{error.explanation}</p>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 self-center flex flex-col gap-1">
          <button
            onClick={handleDrill}
            title="Get a detailed explanation of this error"
            className={`text-[10px] px-2 py-1 rounded border font-medium transition-colors flex items-center gap-1 ${
              drillState === 'done'
                ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                : 'border-zinc-700 text-zinc-500 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            {drillState === 'loading' ? '...' : 'Explain'}
          </button>
          <button
            onClick={handleCopy}
            title="Copy a prompt to paste into ChatGPT, Claude, or Gemini"
            className={`text-[10px] px-2 py-1 rounded border font-medium transition-colors flex items-center gap-1 ${
              copied
                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => onDismiss(errorKey)}
            title="This feedback is incorrect — dismiss it"
            className="text-[10px] px-2 py-1 rounded border border-zinc-700 text-zinc-500 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Drill deeper explanation */}
      {drillState === 'loading' && (
        <div className="px-3 pb-3">
          <div className="bg-blue-950/20 rounded-lg p-3 text-xs text-zinc-400 animate-pulse">
            Generating explanation...
          </div>
        </div>
      )}
      {drillState === 'error' && (
        <div className="px-3 pb-3">
          <div className="bg-red-950/20 rounded-lg p-3 text-xs text-red-400">
            Failed to load explanation. Try again.
          </div>
        </div>
      )}
      {drillState === 'done' && drillExplanation && drillExpanded && (
        <div className="px-3 pb-3">
          <div className="bg-blue-950/20 rounded-lg p-3 relative">
            <button
              onClick={() => setDrillExpanded(false)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line pr-5">
              {drillExplanation.split('\n').map((line, i) => (
                <div key={i}>{renderBoldMarkdown(line)}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
