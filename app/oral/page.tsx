'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mic, RotateCcw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConversationPanel } from '@/components/oral/ConversationPanel'
import { ObserverPanel } from '@/components/oral/ObserverPanel'
import { MicrophoneButton } from '@/components/oral/MicrophoneButton'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useOralSession } from '@/hooks/useOralSession'
import { IB_TOPICS, ORAL_DIFFICULTY_OPTIONS } from '@/lib/types'
import type { ConversationMode, IbTopic, OralDifficulty } from '@/lib/types'

export default function OralPage() {
  const [topic, setTopic] = useState<IbTopic>('school')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [speechMode, setSpeechMode] = useState<'natural' | 'strict'>('natural')
  const [conversationMode, setConversationMode] = useState<ConversationMode>('manual')
  const [difficulty, setDifficulty] = useState<OralDifficulty>('medium')
  const [autoCollapse, setAutoCollapse] = useState(true)
  const [error, setError] = useState('')

  const { speak, stop: stopSpeaking } = useSpeechSynthesis()
  const session = useOralSession(speak, stopSpeaking)

  const topicRef = useRef(topic)
  const speechModeRef = useRef(speechMode)
  const conversationModeRef = useRef(conversationMode)
  const difficultyRef = useRef(difficulty)
  const sessionRef = useRef(session)

  useEffect(() => {
    topicRef.current = topic
    speechModeRef.current = speechMode
    conversationModeRef.current = conversationMode
    difficultyRef.current = difficulty
    sessionRef.current = session
  }, [topic, speechMode, conversationMode, difficulty, session])

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

  const handleStart = async () => {
    setError('')
    setSessionStarted(true)
    try {
      await session.startSession(topic, difficulty, conversationMode)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session')
      setSessionStarted(false)
    }
  }

  const handleBeginAssistantTurn = useCallback(async () => {
    setError('')
    try {
      await sessionRef.current.beginAssistantTurn(topicRef.current, difficultyRef.current)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate Luis\'s reply')
    }
  }, [])

  const handleReset = () => {
    stopSpeaking()
    session.resetSession()
    setSessionStarted(false)
    setError('')
  }

  return (
    <main className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <h1 className="text-base font-semibold">Oral Practice</h1>
        </div>

        {sessionStarted && (
          <Button onClick={handleReset} variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        )}
      </div>

      {/* Setup (before session starts) */}
      {!sessionStarted && (
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-6">
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
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
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
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
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
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
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
        </div>
      )}

      {/* Active session */}
      {sessionStarted && (
        <>
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
                      showTranscript
                        ? 'bg-zinc-700 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    With text
                  </button>
                  <button
                    onClick={() => setShowTranscript(false)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      !showTranscript
                        ? 'bg-zinc-700 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
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
                      conversationMode === 'manual'
                        ? 'bg-zinc-700 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setConversationMode('auto')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      conversationMode === 'auto'
                        ? 'bg-zinc-700 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
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

          {/* Main split layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation panel (left) */}
            <div className="flex-[2] flex flex-col p-4 overflow-hidden border-r border-zinc-800">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Conversation
              </h2>
              <ConversationPanel
                history={session.history}
                streamingText={session.streamingText}
                showTranscript={showTranscript}
                phase={session.phase}
                onStartAssistantTurn={conversationMode === 'manual' ? handleBeginAssistantTurn : undefined}
              />
            </div>

            {/* Observer panel (right) */}
            <div className="flex-[3] flex flex-col p-4 overflow-hidden">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Tutor&apos;s Notes
              </h2>
              <ObserverPanel feedbackHistory={session.feedbackHistory} autoCollapse={autoCollapse} />
            </div>
          </div>

          {/* Bottom bar */}
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
              />
              {conversationMode === 'manual' && session.phase === 'waiting-for-ai-start' && (
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
