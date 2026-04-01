'use client'
import { useState } from 'react'
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

interface Props {
  script: string
  title: string
}

export function ListeningPlayer({ script, title }: Props) {
  const { speak, stop, isSpeaking, isLoading } = useSpeechSynthesis()
  const [hasPlayed, setHasPlayed] = useState(false)

  const handlePlay = () => {
    setHasPlayed(true)
    speak(script)
  }

  const handleStop = () => {
    stop()
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_42%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-5 shadow-[0_24px_70px_-44px_rgba(56,189,248,0.5)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/70">
            Audio Prompt
          </p>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="text-sm text-zinc-400">
            Play the recording first, then answer from memory before opening the transcript.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-400/20 bg-sky-950/30 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">Mode</p>
          <p className="text-sm font-semibold text-sky-100">{isSpeaking ? 'Playing' : 'Ready'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isSpeaking ? (
          <button
            onClick={handleStop}
            className="group relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-zinc-950 px-5 py-3 text-sm font-semibold text-rose-100 shadow-[0_20px_45px_-30px_rgba(244,63,94,0.95)] transition-all duration-200 hover:border-rose-300/50 hover:from-rose-400/25 hover:via-rose-500/15 hover:to-zinc-950 active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <Pause className="relative h-4 w-4" />
            <span className="relative">Pause Audio</span>
          </button>
        ) : (
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className="group relative inline-flex min-h-12 items-center gap-3 overflow-hidden rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-400/25 via-sky-500/12 to-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_45px_-28px_rgba(56,189,248,0.95)] transition-all duration-200 hover:border-sky-300/60 hover:from-sky-300/30 hover:via-sky-500/16 hover:to-zinc-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/12 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 backdrop-blur-sm">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasPlayed ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
            </span>
            <span className="relative flex flex-col items-start leading-none">
              <span>{isLoading ? 'Loading audio...' : hasPlayed ? 'Play Again' : 'Play Audio'}</span>
              <span className="mt-1 text-[11px] font-medium text-sky-100/70">
                {hasPlayed ? 'Restart the same clip' : 'Hear the Spanish passage'}
              </span>
            </span>
          </button>
        )}
        {isSpeaking && !isLoading && (
          <div className="flex items-end gap-1 rounded-2xl border border-sky-400/15 bg-zinc-900/70 px-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-sky-300 animate-pulse"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
