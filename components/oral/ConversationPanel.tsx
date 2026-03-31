'use client'
import { useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConversationMessage, OralPhase } from '@/lib/types'

interface Props {
  history: ConversationMessage[]
  streamingText: string
  showTranscript?: boolean
  phase?: OralPhase
  onStartAssistantTurn?: () => void
}

export function ConversationPanel({
  history,
  streamingText,
  showTranscript = true,
  phase,
  onStartAssistantTurn,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isWaitingForManualStart = phase === 'waiting-for-ai-start' && Boolean(onStartAssistantTurn)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingText])

  return (
    <div className="flex-1 overflow-y-auto rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_32%)] bg-zinc-950/70 p-4 pr-3">
      <div className="flex flex-col gap-4">
        {history.map((msg, i) => {
          const isUser = msg.role === 'user'
          const bubbleLabel = isUser ? 'You' : 'Luis'
          const bubbleContent =
            isUser && !showTranscript ? (
              <span className="inline-flex items-center gap-2 text-sky-50/90">
                <Mic className="h-3.5 w-3.5" />
                Your response recorded
              </span>
            ) : (
              msg.content
            )

          return (
            <div
              key={i}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[24px] border px-4 py-3 text-sm leading-relaxed shadow-[0_24px_50px_-30px_rgba(0,0,0,0.75)] ${
                  isUser
                    ? 'rounded-br-md border-sky-400/20 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white'
                    : 'rounded-bl-md border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-zinc-100'
                }`}
              >
                <span
                  className={`mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    isUser ? 'bg-white/12 text-sky-100' : 'bg-white/6 text-zinc-400'
                  }`}
                >
                  {bubbleLabel}
                </span>
                <div className={isUser && !showTranscript ? 'italic text-white/90' : ''}>{bubbleContent}</div>
              </div>
            </div>
          )
        })}

        {streamingText && (
          <div className="flex justify-start">
            <div
              className="max-w-[85%] rounded-[24px] rounded-bl-md border border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.75)]"
            >
              <span className="mb-1.5 inline-flex rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Luis
              </span>
              <div>
                {streamingText}
                <span className="ml-1 inline-block h-3.5 w-1.5 rounded-sm bg-zinc-400 align-[-2px] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {history.length === 0 && !streamingText && (
          <div className="flex min-h-[280px] flex-1 items-center justify-center">
            {isWaitingForManualStart ? (
              <div className="max-w-sm rounded-[28px] border border-emerald-400/20 bg-emerald-500/8 px-6 py-7 text-center shadow-[0_24px_60px_-36px_rgba(16,185,129,0.9)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
                  Manual Mode
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">Start when you&apos;re ready</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  Luis will wait for your click before he opens the conversation.
                </p>
                <Button
                  onClick={onStartAssistantTurn}
                  className="mt-5 rounded-xl bg-emerald-500 px-4 text-white hover:bg-emerald-400"
                >
                  Start Conversation
                </Button>
              </div>
            ) : (
              <div className="text-center text-sm text-zinc-500">Press Start Session to begin the conversation</div>
            )}
          </div>
        )}

        {history.length > 0 && !streamingText && phase === 'ai-speaking' && (
          <div className="flex justify-start">
            <div className="flex items-end gap-1 rounded-[24px] rounded-bl-md border border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black px-4 py-4 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.75)]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && !streamingText && isWaitingForManualStart && (
          <div className="flex justify-center pt-1">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-zinc-200">
              <span>Luis is waiting for your cue.</span>
              <Button
                onClick={onStartAssistantTurn}
                size="sm"
                className="rounded-xl bg-emerald-500 px-3 text-white hover:bg-emerald-400"
              >
                Generate Reply
              </Button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
