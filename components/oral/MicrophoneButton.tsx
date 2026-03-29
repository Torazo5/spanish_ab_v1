'use client'
import { Mic, MicOff, Square } from 'lucide-react'
import type { OralPhase } from '@/lib/types'

interface Props {
  isRecording: boolean
  phase: OralPhase
  secondsLeft: number
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function MicrophoneButton({ isRecording, phase, secondsLeft, onStart, onStop, disabled }: Props) {
  const isProcessing = phase === 'transcribing' || phase === 'processing'
  const isWaiting = phase === 'waiting-for-user'
  const canRecord = isWaiting && !isRecording

  const handleClick = () => {
    if (isRecording) {
      onStop()
    } else if (canRecord) {
      onStart()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing || (!isRecording && !canRecord)}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200
          ${isRecording
            ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900'
            : canRecord
            ? 'bg-zinc-700 hover:bg-zinc-600'
            : 'bg-zinc-800 opacity-50 cursor-not-allowed'
          }
          disabled:cursor-not-allowed
        `}
      >
        {isRecording ? (
          <>
            <Square className="w-5 h-5 text-white fill-white" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping" />
          </>
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      <div className="text-sm text-zinc-400">
        {isRecording && (
          <span className="text-red-400">
            Recording... {secondsLeft < 15 && <span className="font-bold">{secondsLeft}s left</span>}
          </span>
        )}
        {isProcessing && <span className="animate-pulse">Analyzing...</span>}
        {isWaiting && !isRecording && <span>Press mic to speak</span>}
        {phase === 'ai-speaking' && <span>Luis is speaking...</span>}
        {phase === 'idle' && <span>Select a topic to start</span>}
      </div>
    </div>
  )
}
