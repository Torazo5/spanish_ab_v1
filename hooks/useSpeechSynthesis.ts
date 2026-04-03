'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playbackTokenRef = useRef(0)

  const stop = useCallback(() => {
    playbackTokenRef.current += 1
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current.onplay = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.onpause = null
    }
    audioRef.current = null
    setIsSpeaking(false)
    setIsLoading(false)
  }, [])

  const speak = useCallback(async (text: string) => {
    stop()
    setIsLoading(true)
    setIsSpeaking(true)

    const url = `/api/tts?text=${encodeURIComponent(text)}`
    const audio = new Audio(url)
    const playbackToken = playbackTokenRef.current
    audioRef.current = audio

    audio.onplay = () => setIsLoading(false)
    audio.onended = () => {
      if (playbackTokenRef.current !== playbackToken) return
      audioRef.current = null
      setIsSpeaking(false)
      setIsLoading(false)
    }
    audio.onerror = () => {
      if (playbackTokenRef.current !== playbackToken) return
      audioRef.current = null
      setIsSpeaking(false)
      setIsLoading(false)
    }
    audio.onpause = () => {
      if (playbackTokenRef.current !== playbackToken) return
      if (!audio.ended) {
        setIsSpeaking(false)
        setIsLoading(false)
      }
    }

    if (typeof document !== 'undefined' && document.hidden) {
      stop()
      return
    }

    try {
      await audio.play()
      if (playbackTokenRef.current !== playbackToken) {
        return
      }
      if (typeof document !== 'undefined' && document.hidden) {
        stop()
        return
      }
      setIsLoading(false)
    } catch {
      if (playbackTokenRef.current !== playbackToken) return
      audioRef.current = null
      setIsSpeaking(false)
      setIsLoading(false)
    }
  }, [stop])

  useEffect(() => {
    const handleVisibilityLoss = () => {
      if (document.hidden) {
        stop()
      }
    }

    const handlePageHide = () => {
      stop()
    }

    document.addEventListener('visibilitychange', handleVisibilityLoss)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityLoss)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [stop])

  return { speak, stop, isSpeaking, isLoading, isSupported: true }
}
