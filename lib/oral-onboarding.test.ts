import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ORAL_GUIDED_DEFAULTS,
  getGuidedOnboardingStep,
  shouldAutoStartGuidedSession,
} from './oral-onboarding.ts'

test('guided defaults bias toward the fast first oral reply', () => {
  assert.deepEqual(ORAL_GUIDED_DEFAULTS, {
    topic: 'school',
    conversationMode: 'auto',
    difficulty: 'medium',
    speechMode: 'natural',
    showTranscript: true,
  })
})

test('guided onboarding waits on permission before starting', () => {
  assert.equal(
    getGuidedOnboardingStep({
      permissionGranted: false,
      sessionStarted: false,
      phase: 'idle',
      historyLength: 0,
      feedbackCount: 0,
    }),
    'permission'
  )
})

test('guided onboarding prompts for a spoken reply after Luis finishes', () => {
  assert.equal(
    getGuidedOnboardingStep({
      permissionGranted: true,
      sessionStarted: true,
      phase: 'waiting-for-user',
      historyLength: 1,
      feedbackCount: 0,
    }),
    'record'
  )
})

test('guided onboarding moves to feedback once the first reply is analyzed', () => {
  assert.equal(
    getGuidedOnboardingStep({
      permissionGranted: true,
      sessionStarted: true,
      phase: 'ai-speaking',
      historyLength: 3,
      feedbackCount: 1,
    }),
    'feedback'
  )
})

test('guided sessions auto-start only once permission is ready', () => {
  assert.equal(
    shouldAutoStartGuidedSession({
      enabled: true,
      permissionGranted: true,
      sessionStarted: false,
      hasStartedAutomatically: false,
    }),
    true
  )

  assert.equal(
    shouldAutoStartGuidedSession({
      enabled: true,
      permissionGranted: false,
      sessionStarted: false,
      hasStartedAutomatically: false,
    }),
    false
  )

  assert.equal(
    shouldAutoStartGuidedSession({
      enabled: true,
      permissionGranted: true,
      sessionStarted: true,
      hasStartedAutomatically: false,
    }),
    false
  )
})
