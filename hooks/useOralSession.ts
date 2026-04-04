'use client'
import { useState, useCallback, useRef } from 'react'
import { rewindLatestUserTurn } from '@/lib/oral-retry'
import type {
  ConversationMessage,
  ConversationMode,
  IbTopic,
  ObserverFeedback,
  OralPhase,
  OralDifficulty,
} from '@/lib/types'

interface OralSessionState {
  phase: OralPhase
  history: ConversationMessage[]
  feedbackHistory: ObserverFeedback[]
  streamingText: string
  turnNumber: number
}

async function getApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json()
      if (data && typeof data.error === 'string' && data.error.trim() !== '') {
        return data.error
      }
    } else {
      const text = await response.text()
      if (text.trim() !== '') {
        return text
      }
    }
  } catch {
    // Ignore parse failures and fall back to the provided message.
  }

  return fallback
}

function createInitialState(phase: OralPhase = 'idle'): OralSessionState {
  return {
    phase,
    history: [],
    feedbackHistory: [],
    streamingText: '',
    turnNumber: 0,
  }
}

export function useOralSession(
  onSpeak: (text: string) => Promise<void>,
  onStopSpeaking: () => void
) {
  const [state, setState] = useState<OralSessionState>(createInitialState())

  const abortRef = useRef<AbortController | null>(null)
  const historyRef = useRef<ConversationMessage[]>([])
  const turnNumberRef = useRef(0)

  const setPhase = useCallback((phase: OralPhase) => {
    setState((s) => ({ ...s, phase }))
  }, [])

  const addMessage = useCallback((msg: ConversationMessage) => {
    historyRef.current = [...historyRef.current, msg]
    setState((s) => ({ ...s, history: historyRef.current }))
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

      if (!res.ok || !res.body) {
        throw new Error(await getApiErrorMessage(res, 'Failed to generate conversation reply'))
      }

      const reader = res.body.getReader()
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

  const runObserver = useCallback(
    async (
      userMessage: string,
      conversationHistory: ConversationMessage[],
      turnNumber: number,
      speechMode: 'natural' | 'strict'
    ) => {
      const res = await fetch('/api/oral/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          conversationHistory,
          turnNumber,
          speechMode,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(await getApiErrorMessage(res, 'Failed to generate tutor feedback'))
      }

      const reader = res.body.getReader()
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
            } catch {
              // Ignore malformed feedback chunks and keep listening for the final event.
            }
          }
        }
      }
    },
    [addFeedback]
  )

  const startAssistantTurn = useCallback(
    async (topic: IbTopic, difficulty: OralDifficulty, options?: { initial?: boolean }) => {
      setPhase('ai-speaking')
      const text = await streamConversation({
        topic,
        difficulty,
        history: historyRef.current,
        initial: options?.initial,
      })
      addMessage({ role: 'assistant', content: text, timestamp: Date.now() })
      await onSpeak(text)
      setPhase('waiting-for-user')
    },
    [streamConversation, addMessage, onSpeak, setPhase]
  )

  const startSession = useCallback(
    async (
      topic: IbTopic,
      difficulty: OralDifficulty = 'medium',
      conversationMode: ConversationMode = 'auto'
    ) => {
      onStopSpeaking()
      abortRef.current?.abort()
      historyRef.current = []
      turnNumberRef.current = 0

      if (conversationMode === 'manual') {
        setState(createInitialState('waiting-for-ai-start'))
        return
      }

      setState(createInitialState('ai-speaking'))
      const text = await streamConversation({ topic, difficulty, history: [], initial: true })
      addMessage({ role: 'assistant', content: text, timestamp: Date.now() })
      await onSpeak(text)
      setPhase('waiting-for-user')
    },
    [streamConversation, addMessage, onSpeak, onStopSpeaking, setPhase]
  )

  const processUserTurn = useCallback(
    async (
      audioBlob: Blob,
      topic: IbTopic,
      difficulty: OralDifficulty = 'medium',
      speechMode: 'natural' | 'strict' = 'natural',
      conversationMode: ConversationMode = 'auto'
    ) => {
      onStopSpeaking()
      setPhase('transcribing')

      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      const transcribeRes = await fetch('/api/oral/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeRes.ok) {
        throw new Error(await getApiErrorMessage(transcribeRes, 'Failed to transcribe recording'))
      }

      const { transcript } = await transcribeRes.json()

      const turnNumber = turnNumberRef.current + 1
      turnNumberRef.current = turnNumber
      setState((s) => ({ ...s, turnNumber }))

      const userMessage: ConversationMessage = {
        role: 'user',
        content: transcript,
        timestamp: Date.now(),
      }
      addMessage(userMessage)
      setPhase('processing')

      const currentHistory = historyRef.current
      const observerPromise = runObserver(transcript, currentHistory, turnNumber, speechMode)

      if (conversationMode === 'manual') {
        await observerPromise
        setPhase('waiting-for-ai-start')
        return
      }

      const [conversationText] = await Promise.all([
        streamConversation({
          history: currentHistory,
          topic,
          difficulty,
        }),
        observerPromise,
      ])

      addMessage({ role: 'assistant', content: conversationText, timestamp: Date.now() })
      setPhase('ai-speaking')
      await onSpeak(conversationText)
      setPhase('waiting-for-user')
    },
    [streamConversation, addMessage, onSpeak, onStopSpeaking, runObserver, setPhase]
  )

  const beginAssistantTurn = useCallback(
    async (topic: IbTopic, difficulty: OralDifficulty = 'medium') => {
      await startAssistantTurn(topic, difficulty, { initial: historyRef.current.length === 0 })
    },
    [startAssistantTurn]
  )

  const resetSession = useCallback(() => {
    abortRef.current?.abort()
    historyRef.current = []
    turnNumberRef.current = 0
    setState(createInitialState())
  }, [])

  const retryLatestUserTurn = useCallback(() => {
    onStopSpeaking()
    abortRef.current?.abort()

    const rewound = rewindLatestUserTurn({
      history: historyRef.current,
      feedbackHistory: state.feedbackHistory,
      turnNumber: turnNumberRef.current,
    })

    if (!rewound.didRewind) return false

    historyRef.current = rewound.history
    turnNumberRef.current = rewound.turnNumber
    setState((s) => ({
      ...s,
      history: rewound.history,
      feedbackHistory: rewound.feedbackHistory,
      turnNumber: rewound.turnNumber,
      streamingText: '',
      phase: 'waiting-for-user',
    }))
    return true
  }, [onStopSpeaking, state.feedbackHistory])

  return {
    ...state,
    startSession,
    beginAssistantTurn,
    processUserTurn,
    retryLatestUserTurn,
    resetSession,
  }
}
