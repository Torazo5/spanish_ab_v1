'use client'
import { useRef, useState, useCallback } from 'react'

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsSpeaking(false)
    setIsLoading(false)
  }, [])

  const speak = useCallback(async (text: string) => {
    stop()
    setIsLoading(true)
    setIsSpeaking(true)

    const url = `/api/tts?text=${encodeURIComponent(text)}`
    const audio = new Audio(url)
    audioRef.current = audio

    audio.onplay = () => setIsLoading(false)
    audio.onended = () => { setIsSpeaking(false); setIsLoading(false) }
    audio.onerror = () => { setIsSpeaking(false); setIsLoading(false) }

    try {
      await audio.play()
      setIsLoading(false)
    } catch {
      setIsSpeaking(false)
      setIsLoading(false)
    }
  }, [stop])

  return { speak, stop, isSpeaking, isLoading, isSupported: true }
}
