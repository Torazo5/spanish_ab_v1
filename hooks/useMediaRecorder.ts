'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

const MAX_RECORDING_SECONDS = 60

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'audio/webm'
}

export function useMediaRecorder(onBlobReady?: (blob: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onBlobReadyRef = useRef(onBlobReady)
  onBlobReadyRef.current = onBlobReady

  // Request mic permission on mount
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream
        setPermissionGranted(true)
      })
      .catch(() => setPermissionGranted(false))

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current || isRecording) return
    chunksRef.current = []
    setSecondsLeft(MAX_RECORDING_SECONDS)

    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(streamRef.current, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      onBlobReadyRef.current?.(blob)
    }

    recorder.start(250) // collect chunks every 250ms
    mediaRecorderRef.current = recorder
    setIsRecording(true)

    // Countdown timer
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          recorder.stop()
          return MAX_RECORDING_SECONDS
        }
        return s - 1
      })
    }, 1000)
  }, [isRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  return {
    isRecording,
    permissionGranted,
    secondsLeft,
    startRecording,
    stopRecording,
  }
}
