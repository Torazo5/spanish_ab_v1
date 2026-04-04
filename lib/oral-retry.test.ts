import test from 'node:test'
import assert from 'node:assert/strict'

import { rewindLatestUserTurn } from './oral-retry.ts'
import type { ConversationMessage, ObserverFeedback } from './types.ts'

function makeMessage(role: ConversationMessage['role'], content: string, timestamp: number): ConversationMessage {
  return { role, content, timestamp }
}

function makeFeedback(turnNumber: number): ObserverFeedback {
  return {
    originalMessage: `turn-${turnNumber}`,
    correctedSentence: '',
    errors: [],
    generalFeedback: null,
    turnNumber,
  }
}

test('rewindLatestUserTurn removes the last user answer, later assistant continuation, and latest feedback', () => {
  const history = [
    makeMessage('assistant', 'Prompt 1', 1),
    makeMessage('user', 'Answer 1', 2),
    makeMessage('assistant', 'Follow up 1', 3),
    makeMessage('user', 'Answer 2', 4),
    makeMessage('assistant', 'Follow up 2', 5),
  ]

  const result = rewindLatestUserTurn({
    history,
    feedbackHistory: [makeFeedback(1), makeFeedback(2)],
    turnNumber: 2,
  })

  assert.deepEqual(result.history, [
    makeMessage('assistant', 'Prompt 1', 1),
    makeMessage('user', 'Answer 1', 2),
    makeMessage('assistant', 'Follow up 1', 3),
  ])
  assert.deepEqual(result.feedbackHistory, [makeFeedback(1)])
  assert.equal(result.turnNumber, 1)
  assert.equal(result.didRewind, true)
})

test('rewindLatestUserTurn handles manual mode where no assistant continuation exists yet', () => {
  const history = [
    makeMessage('assistant', 'Prompt 1', 1),
    makeMessage('user', 'Answer 1', 2),
  ]

  const result = rewindLatestUserTurn({
    history,
    feedbackHistory: [makeFeedback(1)],
    turnNumber: 1,
  })

  assert.deepEqual(result.history, [makeMessage('assistant', 'Prompt 1', 1)])
  assert.deepEqual(result.feedbackHistory, [])
  assert.equal(result.turnNumber, 0)
  assert.equal(result.didRewind, true)
})

test('rewindLatestUserTurn leaves state untouched when there is no user answer to retry', () => {
  const history = [makeMessage('assistant', 'Prompt 1', 1)]

  const result = rewindLatestUserTurn({
    history,
    feedbackHistory: [],
    turnNumber: 0,
  })

  assert.deepEqual(result.history, history)
  assert.deepEqual(result.feedbackHistory, [])
  assert.equal(result.turnNumber, 0)
  assert.equal(result.didRewind, false)
})
