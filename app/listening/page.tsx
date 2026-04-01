'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListeningPlayer } from '@/components/listening/ListeningPlayer'
import { TypedQuestionPanel } from '@/components/listening/TypedQuestionPanel'
import { FeedbackPanel } from '@/components/listening/FeedbackPanel'
import { TranscriptPanel } from '@/components/listening/TranscriptPanel'
import { IB_TOPICS, MARK_OPTIONS, type MarkOption } from '@/lib/types'
import type { TypedListeningScript, AnswerResult, IbTopic } from '@/lib/types'
import { gradeLocally } from '@/lib/grading'

type PageState = 'setup' | 'loaded' | 'answered' | 'review'

export default function ListeningPage() {
  const [topic, setTopic] = useState<IbTopic>('school')
  const [marks, setMarks] = useState<MarkOption>(10)
  const [pageState, setPageState] = useState<PageState>('setup')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState<TypedListeningScript | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<{
    results: AnswerResult[]
    totalScore: number
    maxScore: number
    encouragement: string
  } | null>(null)
  const [error, setError] = useState('')

  const generateScript = async () => {
    setLoading(true)
    setError('')
    setScript(null)
    setAnswers({})
    setResults(null)
    setReviewAnswers({})

    try {
      const res = await fetch('/api/listening/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, marks }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setScript(data)
      setAnswers({})
      setPageState('loaded')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate exercise')
    } finally {
      setLoading(false)
    }
  }

  const checkAnswers = async () => {
    if (!script) return
    setLoading(true)
    setError('')

    try {
      // Grade deterministic types client-side
      const localResults = gradeLocally(script.questions, answers)

      // Send only gap-fill questions to AI
      const gapFillQuestions = script.questions.filter((q) => q.type === 'gap-fill')
      let aiResults: AnswerResult[] = []
      let encouragement = ''

      if (gapFillQuestions.length > 0) {
        const res = await fetch('/api/listening/check-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: script.script, questions: script.questions, answers }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        aiResults = data.results ?? []
        encouragement = data.encouragement ?? ''
      }

      // Merge results preserving question order
      const allResults: AnswerResult[] = script.questions.map((q) => {
        if (q.type === 'gap-fill') {
          return aiResults.find((r) => r.questionId === q.id) ?? {
            questionId: q.id,
            correct: false,
            feedback: 'No feedback available.',
            marks: 0,
          }
        }
        return localResults.find((r) => r.questionId === q.id) ?? {
          questionId: q.id,
          correct: false,
          feedback: '',
          marks: 0,
        }
      })

      // Compute score from marks fields
      const totalScore = allResults.reduce((sum, r) => {
        return sum + (r.marks ?? (r.correct ? 1 : 0))
      }, 0)
      const maxScore = script.totalMarks

      setResults({
        results: allResults,
        totalScore,
        maxScore,
        encouragement: encouragement || (totalScore >= maxScore * 0.8 ? 'Great work!' : 'Keep practising!'),
      })
      setReviewAnswers({ ...answers })
      setPageState('answered')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check answers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <h1 className="text-base font-semibold">Listening Practice</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Setup card */}
          <Card className="w-full border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)] space-y-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/70">
                Listening Setup
              </p>
              <h2 className="text-lg font-semibold text-white">Choose a topic</h2>
              <p className="text-sm text-zinc-400">
                Pick a theme and generate a Spanish listening exercise with questions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {IB_TOPICS.map((t, index) => (
                <button
                  key={t.value}
                  onClick={() => setTopic(t.value)}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                    topic === t.value
                      ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_20px_45px_-30px_rgba(56,189,248,0.95)]'
                      : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-200 hover:border-sky-400/25 hover:from-zinc-700 hover:via-zinc-900 hover:to-zinc-950 hover:text-white'
                  }`}
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/8 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-start justify-between gap-3">
                    <span className="block">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        Topic {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="mt-1 block text-sm font-semibold leading-snug">{t.label}</span>
                    </span>
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full transition-all ${
                        topic === t.value ? 'bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.13)]' : 'bg-zinc-600'
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>

            {/* Mark Target section */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/70">Mark Target</p>
              <h2 className="text-lg font-semibold text-white">How many marks?</h2>
              <p className="text-sm text-zinc-400">Total marks determines how many questions are generated.</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MARK_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarks(m)}
                  disabled={loading}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-center transition-all duration-200 active:scale-[0.99] ${
                    loading ? 'pointer-events-none opacity-60' : ''
                  } ${
                    marks === m
                      ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 text-white shadow-[0_20px_45px_-30px_rgba(56,189,248,0.95)]'
                      : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-200 hover:border-sky-400/25 hover:text-white'
                  }`}
                >
                  <span className="relative flex flex-col items-center gap-0.5">
                    <span className="text-sm font-semibold">{m}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">marks</span>
                  </span>
                  <span
                    className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full transition-all ${
                      marks === m ? 'bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.13)]' : 'bg-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              onClick={generateScript}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_24px_45px_-28px_rgba(56,189,248,0.95)] transition-all hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && pageState === 'setup' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Headphones className="w-4 h-4" /> Generate Exercise</>
              )}
            </button>
          </Card>

          {/* Listening player */}
          {script && (
            <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
              <ListeningPlayer script={script.script} title={script.title} />
            </Card>
          )}

          {/* Transcript — visible after generation, all non-setup states */}
          {script && pageState !== 'setup' && (
            <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
              <TranscriptPanel script={script.script} defaultOpen={pageState === 'review'} />
            </Card>
          )}

          {/* Questions */}
          {script && (pageState === 'loaded') && (
            <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] space-y-4">
              <TypedQuestionPanel
                questions={script.questions}
                answers={answers}
                onAnswerChange={(id, value) => setAnswers(prev => ({ ...prev, [id]: value }))}
                disabled={loading}
              />
              <button
                onClick={checkAnswers}
                disabled={loading || !Object.values(answers).some(v => v.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_24px_45px_-28px_rgba(56,189,248,0.95)] transition-all hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                ) : (
                  'Check Answers'
                )}
              </button>
            </Card>
          )}

          {/* Results */}
          {results && pageState === 'answered' && (
            <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]">
              <FeedbackPanel
                results={results.results}
                questions={script!.questions}
                totalScore={results.totalScore}
                maxScore={results.maxScore}
                encouragement={results.encouragement}
              />
              <button
                onClick={() => { setPageState('setup'); setScript(null); setResults(null); setReviewAnswers({}); setError('') }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-800/60 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60 hover:text-white active:scale-[0.98]"
              >
                New Exercise
              </button>
              <button
                onClick={() => setPageState('review')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-950/40 py-3 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-900/50 hover:text-sky-200 active:scale-[0.98]"
              >
                Review with transcript
              </button>
            </Card>
          )}

          {/* Review mode: editable questions with locked score */}
          {script && pageState === 'review' && results && (
            <Card className="border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] space-y-4">
              <p className="text-xs text-zinc-500 text-center">
                Original score: <span className="text-white font-semibold">{results.totalScore} / {results.maxScore}</span> — amending answers here does not change your score
              </p>
              <TypedQuestionPanel
                questions={script.questions}
                answers={reviewAnswers}
                onAnswerChange={(id, value) => setReviewAnswers(prev => ({ ...prev, [id]: value }))}
                disabled={false}
              />
              <button
                onClick={() => setPageState('answered')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-800/60 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60 hover:text-white active:scale-[0.98]"
              >
                Back to results
              </button>
            </Card>
          )}

        </div>
      </div>
    </main>
  )
}
