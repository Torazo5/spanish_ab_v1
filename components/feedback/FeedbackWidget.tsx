'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function FeedbackWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')

  const contextLabel = useMemo(() => {
    if (!pathname || pathname === '/') return 'home'
    return pathname.replace(/^\//, '')
  }, [pathname])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setError('Write a quick note before sending.')
      setSubmitState('error')
      return
    }

    setSubmitState('submitting')
    setError('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedMessage,
          contactEmail: contactEmail.trim(),
          path: pathname,
          context: contextLabel,
          href: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not send feedback right now.')
      }

      setSubmitState('success')
      setMessage('')
      setContactEmail('')
    } catch (submissionError) {
      setSubmitState('error')
      setError(submissionError instanceof Error ? submissionError.message : 'Could not send feedback right now.')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {isOpen && (
        <Card className="w-[min(24rem,calc(100vw-2rem))] border border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/70">Pilot Feedback</p>
              <h2 className="text-base font-semibold">Report friction fast</h2>
              <p className="text-sm text-zinc-400">
                Tell us what broke or felt confusing on <span className="text-zinc-200">{contextLabel}</span>.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-400 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close feedback form"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
            <Textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                if (submitState !== 'idle') setSubmitState('idle')
              }}
              placeholder="What happened? What were you trying to do?"
              className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
              maxLength={2000}
            />
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="Email (optional)"
              className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus-visible:border-zinc-400"
            />

            {submitState === 'success' ? (
              <p className="text-sm text-emerald-300">Thanks. Feedback received.</p>
            ) : error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : (
              <p className="text-xs text-zinc-500">Page and browser context are attached automatically.</p>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              <Button
                type="submit"
                className="bg-amber-300 text-zinc-950 hover:bg-amber-200"
                disabled={submitState === 'submitting'}
              >
                {submitState === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send feedback'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Button
        type="button"
        size="lg"
        className="rounded-full bg-amber-300 px-4 text-zinc-950 shadow-lg hover:bg-amber-200"
        onClick={() => setIsOpen((open) => !open)}
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </Button>
    </div>
  )
}
