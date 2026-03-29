'use client'
import { useEffect, useRef } from 'react'
import type { ConversationMessage } from '@/lib/types'

interface Props {
  history: ConversationMessage[]
  streamingText: string
  showTranscript?: boolean
}

export function ConversationPanel({ history, streamingText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingText])

  return (
    <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2">
      {history.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
            }`}
          >
            {msg.role === 'assistant' && (
              <span className="text-xs font-medium text-zinc-400 block mb-0.5">Luis</span>
            )}
            {msg.content}
          </div>
        </div>
      ))}

      {streamingText && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-zinc-800 text-zinc-100">
            <span className="text-xs font-medium text-zinc-400 block mb-0.5">Luis</span>
            {streamingText}
            <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-zinc-400 animate-pulse rounded-sm" />
          </div>
        </div>
      )}

      {history.length === 0 && !streamingText && (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          Press Start to begin the conversation
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
