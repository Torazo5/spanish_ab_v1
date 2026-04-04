'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mic, RotateCcw, Info, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConversationPanel } from '@/components/oral/ConversationPanel'
import { ObserverPanel } from '@/components/oral/ObserverPanel'
import { MicrophoneButton } from '@/components/oral/MicrophoneButton'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useOralSession } from '@/hooks/useOralSession'
import {
  getGuidedOnboardingStep,
  ORAL_GUIDED_DEFAULTS,
  ORAL_GUIDED_STORAGE_KEY,
  shouldAutoStartGuidedSession,
} from '@/lib/oral-onboarding'
import { IB_TOPICS, ORAL_DIFFICULTY_OPTIONS } from '@/lib/types'
import type { ConversationMode, IbTopic, OralDifficulty } from '@/lib/types'

const GUIDED_COPY = {
  permission: {
    eyebrow: 'Step 1',
    title: 'Allow the mic so we can start for you',
    body: 'Accept the browser microphone prompt. As soon as access is ready, Luis will open the conversation automatically.',
  },
  starting: {
    eyebrow: 'Step 1',
    title: 'Starting your first oral',
    body: 'We already picked a topic and level. Luis is about to speak first so you can just listen.',
  },
  listen: {
    eyebrow: 'Step 2',
    title: 'Listen to Luis first',
    body: 'Let him ask the opening question. You do not need to configure anything before trying the feature.',
  },
  record: {
    eyebrow: 'Step 3',
    title: 'Now tap the mic and answer in Spanish',
    body: 'Keep it short. One reply is enough to unlock the full oral controls and show instant tutor notes.',
  },
  processing: {
    eyebrow: 'Step 3',
    title: 'Analyzing your answer',
    body: 'Stay here for a moment. We are transcribing your reply and generating feedback.',
  },
  feedback: {
    eyebrow: 'Unlocked',
    title: 'You are in',
    body: 'Your first oral reply is complete. The full controls are now available if you want to keep practicing or change the setup.',
  },
} as const

export default function OralPage() {
  const [topic, setTopic] = useState<IbTopic>(ORAL_GUIDED_DEFAULTS.topic)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(ORAL_GUIDED_DEFAULTS.showTranscript)
  const [speechMode, setSpeechMode] = useState<'natural' | 'strict'>(ORAL_GUIDED_DEFAULTS.speechMode)
  const [conversationMode, setConversationMode] = useState<ConversationMode>(ORAL_GUIDED_DEFAULTS.conversationMode)
  const [difficulty, setDifficulty] = useState<OralDifficulty>(ORAL_GUIDED_DEFAULTS.difficulty)
  const [autoCollapse, setAutoCollapse] = useState(true)
  const [error, setError] = useState('')
  const [guidanceReady, setGuidanceReady] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [retryNudgeActive, setRetryNudgeActive] = useState(false)

  const { speak, stop: stopSpeaking, isSpeaking, isLoading } = useSpeechSynthesis()
  const session = useOralSession(speak, stopSpeaking)

  const topicRef = useRef(topic)
  const speechModeRef = useRef(speechMode)
  const conversationModeRef = useRef(conversationMode)
  const difficultyRef = useRef(difficulty)
  const sessionRef = useRef(session)
  const autoStartAttemptedRef = useRef(false)
  const retryNudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    topicRef.current = topic
    speechModeRef.current = speechMode
    conversationModeRef.current = conversationMode
    difficultyRef.current = difficulty
    sessionRef.current = session
  }, [topic, speechMode, conversationMode, difficulty, session])

  useEffect(() => {
    return () => {
      if (retryNudgeTimeoutRef.current) {
        clearTimeout(retryNudgeTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const completed = window.localStorage.getItem(ORAL_GUIDED_STORAGE_KEY) === 'true'
    queueMicrotask(() => {
      setGuidedMode(!completed)
      setGuidanceReady(true)
    })
  }, [])

  const finishGuidedMode = useCallback(() => {
    window.localStorage.setItem(ORAL_GUIDED_STORAGE_KEY, 'true')
    setGuidedMode(false)
  }, [])

  const handleBlobReady = useCallback(async (blob: Blob) => {
    setError('')
    try {
      await sessionRef.current.processUserTurn(
        blob,
        topicRef.current,
        difficultyRef.current,
        speechModeRef.current,
        conversationModeRef.current
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process audio')
    }
  }, [])

  const recorder = useMediaRecorder(handleBlobReady)

  const handleStart = useCallback(async () => {
    setError('')
    setSessionStarted(true)
    try {
      await session.startSession(topicRef.current, difficultyRef.current, conversationModeRef.current)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session')
      setSessionStarted(false)
    }
  }, [session])

  const handleBeginAssistantTurn = useCallback(async () => {
    setError('')
    try {
      await sessionRef.current.beginAssistantTurn(topicRef.current, difficultyRef.current)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate Luis\'s reply')
    }
  }, [])

  const handleReplayAssistantMessage = useCallback((message: { content: string }) => {
    setError('')
    void speak(message.content)
  }, [speak])

  const handleRetryLatestUserTurn = useCallback(() => {
    setError('')
    const didRewind = sessionRef.current.retryLatestUserTurn()
    if (!didRewind) return

    setRetryNudgeActive(true)
    if (retryNudgeTimeoutRef.current) {
      clearTimeout(retryNudgeTimeoutRef.current)
    }
    retryNudgeTimeoutRef.current = setTimeout(() => {
      setRetryNudgeActive(false)
    }, 4000)
  }, [])

  const handleSkipGuided = useCallback(() => {
    finishGuidedMode()
    autoStartAttemptedRef.current = true
  }, [finishGuidedMode])

  useEffect(() => {
    if (!guidedMode || session.feedbackHistory.length === 0) return
    queueMicrotask(finishGuidedMode)
  }, [guidedMode, session.feedbackHistory.length, finishGuidedMode])

  useEffect(() => {
    if (
      !shouldAutoStartGuidedSession({
        enabled: guidedMode,
        permissionGranted: recorder.permissionGranted,
        sessionStarted,
        hasStartedAutomatically: autoStartAttemptedRef.current,
      })
    ) {
      return
    }

    autoStartAttemptedRef.current = true
    queueMicrotask(() => {
      void handleStart()
    })
  }, [guidedMode, recorder.permissionGranted, sessionStarted, handleStart])

  const handleReset = () => {
    stopSpeaking()
    session.resetSession()
    setSessionStarted(false)
    setError('')
    autoStartAttemptedRef.current = false
    setRetryNudgeActive(false)
    if (retryNudgeTimeoutRef.current) {
      clearTimeout(retryNudgeTimeoutRef.current)
      retryNudgeTimeoutRef.current = null
    }
  }

  const guidedStep = getGuidedOnboardingStep({
    permissionGranted: recorder.permissionGranted,
    sessionStarted,
    phase: session.phase,
    historyLength: session.history.length,
    feedbackCount: session.feedbackHistory.length,
  })

  const guidedPrompt = GUIDED_COPY[guidedStep]

  const renderSetupCard = () => {
    if (!guidanceReady) {
      return (
        <Card className="w-full max-w-md border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6 text-zinc-300 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]">
          Loading oral practice...
        </Card>
      )
    }

    if (guidedMode) {
      return (
        <Card className="w-full max-w-xl space-y-6 border-emerald-400/15 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.2),transparent_35%),linear-gradient(135deg,rgba(16,24,39,1),rgba(9,9,11,1))] p-7 shadow-[0_30px_80px_-50px_rgba(16,185,129,0.7)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Guided first try
              </p>
              <h2 className="text-2xl font-semibold text-white">Try the oral feature before you tweak anything</h2>
              <p className="max-w-lg text-sm leading-6 text-zinc-300">
                We removed the setup decisions for the first run. Luis will start, you answer once, and then the full controls appear.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white" onClick={handleSkipGuided}>
              Show full controls
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-zinc-200 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">1</p>
              <p className="mt-1 font-medium text-white">Luis starts automatically</p>
              <p className="mt-1 text-zinc-400">No opening click and no manual pacing.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">2</p>
              <p className="mt-1 font-medium text-white">You tap the mic once</p>
              <p className="mt-1 text-zinc-400">A short answer is enough for the first run.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">3</p>
              <p className="mt-1 font-medium text-white">Tutor notes appear instantly</p>
              <p className="mt-1 text-zinc-400">Then the rest of the controls unlock.</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/8 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
              {guidedPrompt.eyebrow}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">{guidedPrompt.title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-300">{guidedPrompt.body}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Topic: School</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Auto replies</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Medium difficulty</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Natural feedback</span>
            </div>
            {!recorder.permissionGranted && (
              <p className="mt-4 text-sm text-yellow-300">
                Microphone permission is still needed. Accept the prompt and the session will begin.
              </p>
            )}
            {error && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-red-300">{error}</p>
                {recorder.permissionGranted && (
                  <Button
                    onClick={handleStart}
                    className="rounded-xl bg-emerald-500 px-4 text-white hover:bg-emerald-400"
                  >
                    Try again
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      )
    }

    return (
      <Card className="w-full max-w-md space-y-6 border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
            Oral Setup
          </p>
          <h2 className="text-lg font-semibold text-white">Choose a topic</h2>
          <p className="text-sm text-zinc-400">
            Pick the theme and how much control you want over Luis&apos;s replies.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {IB_TOPICS.map((t, index) => (
            <button
              key={t.value}
              onClick={() => setTopic(t.value)}
              className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                topic === t.value
                  ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-zinc-950 text-white shadow-[0_20px_45px_-30px_rgba(16,185,129,0.95)]'
                  : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-200 hover:border-emerald-400/25 hover:from-zinc-700 hover:via-zinc-900 hover:to-zinc-950 hover:text-white'
              }`}
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/8 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-start justify-between gap-3">
                <span className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    Topic {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug">{t.label}</span>
                </span>
                <span
                  className={`mt-0.5 h-2.5 w-2.5 rounded-full transition-all ${
                    topic === t.value ? 'bg-emerald-300 shadow-[0_0_0_6px_rgba(110,231,183,0.13)]' : 'bg-zinc-600'
                  }`}
                />
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">Conversation pacing</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConversationMode('manual')}
              className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                conversationMode === 'manual'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-white shadow-[0_18px_35px_-28px_rgba(16,185,129,0.95)]'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="block font-semibold">Manual</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">
                You click to start each Luis message.
              </span>
            </button>
            <button
              onClick={() => setConversationMode('auto')}
              className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                conversationMode === 'auto'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-white shadow-[0_18px_35px_-28px_rgba(16,185,129,0.95)]'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="block font-semibold">Auto</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">
                Luis answers automatically like a real conversation.
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">Transcript display</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowTranscript(true)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                showTranscript
                  ? 'border-zinc-500 bg-zinc-800 text-white'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="block font-semibold">With text</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">Show your transcript</span>
            </button>
            <button
              onClick={() => setShowTranscript(false)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                !showTranscript
                  ? 'border-zinc-500 bg-zinc-800 text-white'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="block font-semibold">No text</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">Hide your transcript</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            Difficulty
            <span className="relative group">
              <Info className="w-3 h-3 text-zinc-500" />
              <span className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-[11px] leading-relaxed text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                A good answer on Medium is enough for a 7 in Spanish AB Initio.
              </span>
            </span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ORAL_DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                  difficulty === option.value
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-white shadow-[0_18px_35px_-28px_rgba(16,185,129,0.95)]'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">Feedback strictness</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSpeechMode('natural')}
              className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                speechMode === 'natural'
                  ? 'border-zinc-500 bg-zinc-800 text-white'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                Natural speech
                <span className="relative group">
                  <Info className="w-3 h-3 text-zinc-500" />
                  <span className="absolute bottom-full left-1/2 z-10 mb-2 w-52 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-[11px] leading-relaxed text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                    Ignores stutters, repetitions, and self-corrections that are common in spoken language. Only flags actual grammar mistakes.
                  </span>
                </span>
              </span>
              <span className="mt-0.5 block text-[11px] text-zinc-400">Ignore stutters</span>
            </button>
            <button
              onClick={() => setSpeechMode('strict')}
              className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99] ${
                speechMode === 'strict'
                  ? 'border-zinc-500 bg-zinc-800 text-white'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                Strict
                <span className="relative group">
                  <Info className="w-3 h-3 text-zinc-500" />
                  <span className="absolute bottom-full left-1/2 z-10 mb-2 w-52 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-[11px] leading-relaxed text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                    Flags all errors including hesitations, false starts, and repeated words. Best for polished speaking practice.
                  </span>
                </span>
              </span>
              <span className="mt-0.5 block text-[11px] text-zinc-400">Flag everything</span>
            </button>
          </div>
        </div>

        {!recorder.permissionGranted && (
          <p className="text-xs text-yellow-400">
            Microphone permission needed. Allow access when prompted.
          </p>
        )}
        <button
          onClick={handleStart}
          disabled={!recorder.permissionGranted}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_24px_45px_-28px_rgba(16,185,129,0.95)] transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Mic className="w-4 h-4" />
          Start Session
        </button>
      </Card>
    )
  }

  return (
    <main className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">Oral Practice</h1>
            {guidedMode && guidanceReady && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Guided first try
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {guidedMode && guidanceReady && (
            <Button onClick={handleSkipGuided} variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
              Show full controls
            </Button>
          )}
          {sessionStarted && (
            <Button onClick={handleReset} variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {!sessionStarted && (
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-6">
          {renderSetupCard()}
        </div>
      )}

      {sessionStarted && (
        <>
          {guidedMode ? (
            <div className="border-b border-emerald-400/15 bg-emerald-400/6 px-4 py-3">
              <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                    {guidedPrompt.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{guidedPrompt.title}</p>
                  <p className="mt-1 text-sm text-zinc-300">{guidedPrompt.body}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white" onClick={handleSkipGuided}>
                  Skip guide
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800/50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>
                  Topic: <span className="text-zinc-300">{IB_TOPICS.find((t) => t.value === topic)?.label}</span>
                </span>
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                  {conversationMode === 'manual' ? 'Manual replies' : 'Auto replies'}
                </span>
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                  {ORAL_DIFFICULTY_OPTIONS.find((option) => option.value === difficulty)?.label} difficulty
                </span>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Transcript
                  </p>
                  <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/80 p-1">
                    <button
                      onClick={() => setShowTranscript(true)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        showTranscript ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      With text
                    </button>
                    <button
                      onClick={() => setShowTranscript(false)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        !showTranscript ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      No text
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Pacing
                  </p>
                  <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/80 p-1">
                    <button
                      onClick={() => setConversationMode('manual')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        conversationMode === 'manual' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => setConversationMode('auto')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        conversationMode === 'auto' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Feedback
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSpeechMode((m) => m === 'natural' ? 'strict' : 'natural')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                        speechMode === 'natural'
                          ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
                          : 'bg-amber-900/50 border-amber-700/50 text-amber-300'
                      }`}
                    >
                      {speechMode === 'natural' ? 'Natural' : 'Strict'}
                    </button>
                    <button
                      onClick={() => setAutoCollapse((v) => !v)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                        autoCollapse
                          ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {autoCollapse ? 'Collapse old' : 'Show all'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            <div className={`flex flex-col p-4 overflow-hidden border-r border-zinc-800 ${guidedMode ? 'flex-[3]' : 'flex-[2]'}`}>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Conversation
              </h2>
              <ConversationPanel
                history={session.history}
                streamingText={session.streamingText}
                showTranscript={showTranscript}
                phase={session.phase}
                onStartAssistantTurn={conversationMode === 'manual' ? handleBeginAssistantTurn : undefined}
                onReplayAssistantMessage={handleReplayAssistantMessage}
                onRetryLatestUserTurn={handleRetryLatestUserTurn}
                canRetryLatestUserTurn={!guidedMode && session.feedbackHistory.length > 0 && session.phase === 'waiting-for-user'}
              />
            </div>

            <div className={`flex flex-col p-4 overflow-hidden ${guidedMode ? 'flex-[2]' : 'flex-[3]'}`}>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Tutor&apos;s Notes
              </h2>
              <ObserverPanel feedbackHistory={session.feedbackHistory} autoCollapse={autoCollapse} />
            </div>
          </div>

          <div className="border-t border-zinc-800 px-4 py-3">
            {error && (
              <div className="text-red-400 text-xs mb-2">{error}</div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <MicrophoneButton
                isRecording={recorder.isRecording}
                phase={session.phase}
                secondsLeft={recorder.secondsLeft}
                onStart={recorder.startRecording}
                onStop={recorder.stopRecording}
                disabled={isSpeaking || isLoading}
                highlight={(guidedMode && guidedStep === 'record') || retryNudgeActive}
              />
              {!guidedMode && conversationMode === 'manual' && session.phase === 'waiting-for-ai-start' && (
                <Button
                  onClick={handleBeginAssistantTurn}
                  className="rounded-xl bg-emerald-500 px-4 text-white hover:bg-emerald-400"
                >
                  {session.history.length === 0 ? 'Start Conversation' : 'Generate Luis Reply'}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
