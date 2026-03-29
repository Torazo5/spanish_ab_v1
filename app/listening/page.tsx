'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListeningPlayer } from '@/components/listening/ListeningPlayer'
import { QuestionPanel } from '@/components/listening/QuestionPanel'
import { FeedbackPanel } from '@/components/listening/FeedbackPanel'
import { IB_TOPICS } from '@/lib/types'
import type { ListeningScript, AnswerResult, IbTopic } from '@/lib/types'

type PageState = 'setup' | 'loaded' | 'answered'

export default function ListeningPage() {
  const [topic, setTopic] = useState<IbTopic>('school')
  const [pageState, setPageState] = useState<PageState>('setup')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState<ListeningScript | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
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
    setAnswers([])
    setResults(null)

    try {
      const res = await fetch('/api/listening/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setScript(data)
      setAnswers(new Array(data.questions.length).fill(''))
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
      const res = await fetch('/api/listening/check-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: script.script, questions: script.questions, answers }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data)
      setPageState('answered')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check answers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-zinc-400">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Listening Practice</h1>
        </div>

        {/* Topic selector */}
        <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
          <label className="text-sm font-medium text-zinc-300">Topic</label>
          <div className="flex flex-wrap gap-2">
            {IB_TOPICS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTopic(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all active:scale-95 ${
                  topic === t.value
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={generateScript} disabled={loading} className="w-full">
            {loading && pageState === 'setup' ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
            ) : (
              'Generate Exercise'
            )}
          </Button>
        </Card>

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Listening player */}
        {script && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-4">
            <ListeningPlayer script={script.script} title={script.title} />
          </Card>
        )}

        {/* Questions */}
        {script && pageState !== 'answered' && (
          <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-4">
            <QuestionPanel
              questions={script.questions}
              answers={answers}
              onAnswerChange={(i, v) => setAnswers((a) => { const next = [...a]; next[i] = v; return next })}
              disabled={loading}
            />
            <Button
              onClick={checkAnswers}
              disabled={loading || answers.every((a) => !a.trim())}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking...</>
              ) : (
                'Check Answers'
              )}
            </Button>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <FeedbackPanel
              results={results.results}
              questions={script!.questions}
              totalScore={results.totalScore}
              maxScore={results.maxScore}
              encouragement={results.encouragement}
            />
            <Button
              onClick={() => { setPageState('setup'); setScript(null); setResults(null) }}
              variant="outline"
              className="w-full mt-4 border-zinc-700"
            >
              New Exercise
            </Button>
          </Card>
        )}
      </div>
    </main>
  )
}
