'use client'
import { useRef, useState, useCallback } from 'react'

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(async (text: string) => {
    stop()
    setIsSpeaking(true)

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        setIsSpeaking(false)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      currentUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        currentUrlRef.current = null
        setIsSpeaking(false)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        currentUrlRef.current = null
        setIsSpeaking(false)
      }

      await audio.play()
    } catch {
      setIsSpeaking(false)
    }
  }, [stop])

  return { speak, stop, isSpeaking, isSupported: true }
}
