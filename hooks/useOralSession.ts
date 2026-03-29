'use client'
import { useState, useCallback, useRef } from 'react'
import type { ConversationMessage, IbTopic, ObserverFeedback, OralPhase } from '@/lib/types'

interface OralSessionState {
  phase: OralPhase
  history: ConversationMessage[]
  feedbackHistory: ObserverFeedback[]
  streamingText: string  // current AI response being streamed
  turnNumber: number
}

export function useOralSession(
  onSpeak: (text: string) => void,
  onStopSpeaking: () => void
) {
  const [state, setState] = useState<OralSessionState>({
    phase: 'idle',
    history: [],
    feedbackHistory: [],
    streamingText: '',
    turnNumber: 0,
  })

  const abortRef = useRef<AbortController | null>(null)

  const setPhase = (phase: OralPhase) =>
    setState((s) => ({ ...s, phase }))

  const addMessage = useCallback((msg: ConversationMessage) => {
    setState((s) => ({ ...s, history: [...s.history, msg] }))
  }, [])

  const addFeedback = useCallback((fb: ObserverFeedback) => {
    setState((s) => ({ ...s, feedbackHistory: [...s.feedbackHistory, fb] }))
  }, [])

  // Stream conversation response and return the full text
  const streamConversation = useCallback(
    async (body: object): Promise<string> => {
      abortRef.current = new AbortController()
      const res = await fetch('/api/oral/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      setState((s) => ({ ...s, streamingText: '' }))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                fullText += data.text
                setState((s) => ({ ...s, streamingText: fullText }))
              }
              if (data.fullText) fullText = data.fullText
            } catch { /* ignore */ }
          }
        }
      }

      setState((s) => ({ ...s, streamingText: '' }))
      return fullText
    },
    []
  )

  // Start the session — AI opens the conversation
  const startSession = useCallback(
    async (topic: IbTopic) => {
      setPhase('ai-speaking')
      const text = await streamConversation({ topic, history: [], initial: true })
      addMessage({ role: 'assistant', content: text, timestamp: Date.now() })
      onSpeak(text)
      setPhase('waiting-for-user')
    },
    [streamConversation, addMessage, onSpeak]
  )

  // Process a user's recorded audio blob
  const processUserTurn = useCallback(
    async (audioBlob: Blob, topic: IbTopic) => {
      onStopSpeaking()
      setPhase('transcribing')

      // Step 1: transcribe (serial — both AI calls need this)
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      const transcribeRes = await fetch('/api/oral/transcribe', {
        method: 'POST',
        body: formData,
      })
      const { transcript } = await transcribeRes.json()

      const turnNumber = state.turnNumber + 1
      setState((s) => ({ ...s, turnNumber }))

      // Add user message immediately
      addMessage({ role: 'user', content: transcript, timestamp: Date.now() })
      setPhase('processing')

      // Step 2: fire conversation + observer in parallel
      const currentHistory = state.history

      const [conversationText] = await Promise.all([
        // A: Conversation AI
        streamConversation({
          userMessage: transcript,
          history: currentHistory,
          topic,
        }),

        // B: Observer AI
        (async () => {
          const res = await fetch('/api/oral/observe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userMessage: transcript,
              conversationHistory: currentHistory,
              turnNumber,
            }),
          })
          const reader = res.body!.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (line.startsWith('event: feedback')) continue
              if (line.startsWith('data: ') && !line.includes('{}')) {
                try {
                  const feedback = JSON.parse(line.slice(6))
                  addFeedback(feedback)
                } catch { /* ignore */ }
              }
            }
          }
        })(),
      ])

      addMessage({ role: 'assistant', content: conversationText, timestamp: Date.now() })
      setPhase('ai-speaking')
      onSpeak(conversationText)
      setPhase('waiting-for-user')
    },
    [state.history, state.turnNumber, streamConversation, addMessage, addFeedback, onSpeak, onStopSpeaking]
  )

  const resetSession = useCallback(() => {
    abortRef.current?.abort()
    setState({
      phase: 'idle',
      history: [],
      feedbackHistory: [],
      streamingText: '',
      turnNumber: 0,
    })
  }, [])

  return {
    ...state,
    startSession,
    processUserTurn,
    resetSession,
  }
}
