'use client'
import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mic, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConversationPanel } from '@/components/oral/ConversationPanel'
import { ObserverPanel } from '@/components/oral/ObserverPanel'
import { MicrophoneButton } from '@/components/oral/MicrophoneButton'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useOralSession } from '@/hooks/useOralSession'
import { IB_TOPICS } from '@/lib/types'
import type { IbTopic } from '@/lib/types'

export default function OralPage() {
  const [topic, setTopic] = useState<IbTopic>('school')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [error, setError] = useState('')

  const { speak, stop: stopSpeaking } = useSpeechSynthesis()
  const session = useOralSession(speak, stopSpeaking)

  // Use a ref so the callback always sees the latest topic/session without stale closure issues
  const topicRef = useRef(topic)
  topicRef.current = topic
  const sessionRef = useRef(session)
  sessionRef.current = session

  const handleBlobReady = useCallback(async (blob: Blob) => {
    try {
      await sessionRef.current.processUserTurn(blob, topicRef.current)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process audio')
    }
  }, [])

  const recorder = useMediaRecorder(handleBlobReady)

  const handleStart = async () => {
    setError('')
    setSessionStarted(true)
    try {
      await session.startSession(topic)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session')
      setSessionStarted(false)
    }
  }

  const handleReset = () => {
    stopSpeaking()
    session.resetSession()
    setSessionStarted(false)
    setError('')
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-zinc-400 h-8">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
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
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="bg-zinc-900 border-zinc-800 p-6 w-full max-w-sm space-y-5">
            <h2 className="text-sm font-semibold text-zinc-300">Choose a topic</h2>
            <div className="flex flex-wrap gap-2">
              {IB_TOPICS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTopic(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all active:scale-95 ${
                    topic === t.value
                      ? 'bg-green-600 border-green-500 text-white shadow-md shadow-green-950'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Mode selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400">Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowTranscript(true)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all active:scale-95 text-left ${
                    showTranscript
                      ? 'bg-zinc-700 border-zinc-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-300'
                  }`}
                >
                  <div className="font-semibold">With text</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">See your words</div>
                </button>
                <button
                  onClick={() => setShowTranscript(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all active:scale-95 text-left ${
                    !showTranscript
                      ? 'bg-zinc-700 border-zinc-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-300'
                  }`}
                >
                  <div className="font-semibold">No text</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Audio only</div>
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
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-white text-sm tracking-wide shadow-lg shadow-green-950/50 flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Conversation
            </button>
          </Card>
        </div>
      )}

      {/* Active session */}
      {sessionStarted && (
        <>
          {/* Topic + mode bar */}
          <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Topic: <span className="text-zinc-300">{IB_TOPICS.find((t) => t.value === topic)?.label}</span>
            </span>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                showTranscript
                  ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {showTranscript ? 'Text on' : 'Text off'}
            </button>
          </div>

          {/* Main split layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation panel (left) */}
            <div className="flex-[3] flex flex-col p-4 overflow-hidden border-r border-zinc-800">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Conversation
              </h2>
              <ConversationPanel
                history={session.history}
                streamingText={session.streamingText}
                showTranscript={showTranscript}
              />
            </div>

            {/* Observer panel (right) */}
            <div className="flex-[2] flex flex-col p-4 overflow-hidden">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Tutor&apos;s Notes
              </h2>
              <ObserverPanel feedbackHistory={session.feedbackHistory} />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-zinc-800 px-4 py-3">
            {error && (
              <div className="text-red-400 text-xs mb-2">{error}</div>
            )}
            <MicrophoneButton
              isRecording={recorder.isRecording}
              phase={session.phase}
              secondsLeft={recorder.secondsLeft}
              onStart={recorder.startRecording}
              onStop={recorder.stopRecording}
            />
          </div>
        </>
      )}
    </main>
  )
}
