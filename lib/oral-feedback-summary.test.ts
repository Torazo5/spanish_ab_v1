import test from 'node:test'
import assert from 'node:assert/strict'

import { getFeedbackHeadline } from './oral-feedback-summary.ts'
import type { ObserverFeedback } from './types.ts'

function makeFeedback(overrides: Partial<ObserverFeedback> = {}): ObserverFeedback {
  return {
    originalMessage: 'Yo es estudiante',
    correctedSentence: 'Yo soy estudiante',
    errors: [],
    generalFeedback: null,
    turnNumber: 1,
    ...overrides,
  }
}

test('headline insight prioritizes the most severe correction', () => {
  const feedback = makeFeedback({
    errors: [
      {
        original: 'es',
        correction: 'soy',
        explanation: 'Use the first-person form of ser.',
        category: 'conjugation',
        severity: 'major',
      },
    ],
  })

  assert.deepEqual(getFeedbackHeadline(feedback), {
    title: 'One thing to fix next',
    detail: 'Change "es" to "soy".',
  })
})

test('headline insight falls back to general feedback when there are no errors', () => {
  const feedback = makeFeedback({
    correctedSentence: '',
    generalFeedback: 'Good detail. Add one more reason next time.',
  })

  assert.deepEqual(getFeedbackHeadline(feedback), {
    title: 'Strongest improvement',
    detail: 'Good detail. Add one more reason next time.',
  })
})

test('headline insight celebrates clean turns', () => {
  const feedback = makeFeedback({
    originalMessage: 'Me gusta mi colegio.',
    correctedSentence: '',
  })

  assert.deepEqual(getFeedbackHeadline(feedback), {
    title: 'Keep this going',
    detail: 'No clear grammar mistakes in this answer.',
  })
})
