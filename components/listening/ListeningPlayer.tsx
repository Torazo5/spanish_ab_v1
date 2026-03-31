'use client'
import { useState } from 'react'
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <div className="flex items-center gap-3">
        {isSpeaking ? (
          <Button onClick={handleStop} variant="outline" size="sm" className="gap-2">
            <Pause className="w-4 h-4" /> Pause
          </Button>
        ) : (
          <Button onClick={handlePlay} disabled={isLoading} size="sm" className="gap-2">
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            ) : hasPlayed ? (
              <><RotateCcw className="w-4 h-4" /> Play Again</>
            ) : (
              <><Play className="w-4 h-4" /> Play Audio</>
            )}
          </Button>
        )}
        {isSpeaking && !isLoading && (
          <div className="flex gap-1 items-end">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-blue-400 rounded-full animate-pulse"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
