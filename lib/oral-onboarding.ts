import type { ConversationMode, IbTopic, OralDifficulty, OralPhase } from '@/lib/types'

export const ORAL_GUIDED_STORAGE_KEY = 'oral-guided-onboarding-complete'

export const ORAL_GUIDED_DEFAULTS: {
  topic: IbTopic
  conversationMode: ConversationMode
  difficulty: OralDifficulty
  speechMode: 'natural' | 'strict'
  showTranscript: boolean
} = {
  topic: 'school',
  conversationMode: 'auto',
  difficulty: 'medium',
  speechMode: 'natural',
  showTranscript: true,
}

export type GuidedOnboardingStep =
  | 'permission'
  | 'starting'
  | 'listen'
  | 'record'
  | 'processing'
  | 'feedback'

interface GuidedOnboardingContext {
  permissionGranted: boolean
  sessionStarted: boolean
  phase: OralPhase
  historyLength: number
  feedbackCount: number
}

interface AutoStartContext {
  enabled: boolean
  permissionGranted: boolean
  sessionStarted: boolean
  hasStartedAutomatically: boolean
}

export function getGuidedOnboardingStep({
  permissionGranted,
  sessionStarted,
  phase,
  historyLength,
  feedbackCount,
}: GuidedOnboardingContext): GuidedOnboardingStep {
  if (!permissionGranted) return 'permission'
  if (feedbackCount > 0) return 'feedback'
  if (!sessionStarted) return 'starting'
  if (phase === 'transcribing' || phase === 'processing') return 'processing'
  if (phase === 'waiting-for-user' && historyLength > 0) return 'record'
  return 'listen'
}

export function shouldAutoStartGuidedSession({
  enabled,
  permissionGranted,
  sessionStarted,
  hasStartedAutomatically,
}: AutoStartContext): boolean {
  return enabled && permissionGranted && !sessionStarted && !hasStartedAutomatically
}
