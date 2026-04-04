import type { ConversationMessage, ObserverFeedback } from '@/lib/types'

interface RewindLatestUserTurnInput {
  history: ConversationMessage[]
  feedbackHistory: ObserverFeedback[]
  turnNumber: number
}

interface RewindLatestUserTurnResult {
  history: ConversationMessage[]
  feedbackHistory: ObserverFeedback[]
  turnNumber: number
  didRewind: boolean
}

export function rewindLatestUserTurn({
  history,
  feedbackHistory,
  turnNumber,
}: RewindLatestUserTurnInput): RewindLatestUserTurnResult {
  const latestUserIndex = [...history].map((message, index) => ({ message, index })).reverse().find(({ message }) => message.role === 'user')?.index

  if (latestUserIndex === undefined) {
    return {
      history,
      feedbackHistory,
      turnNumber,
      didRewind: false,
    }
  }

  return {
    history: history.slice(0, latestUserIndex),
    feedbackHistory: feedbackHistory.slice(0, -1),
    turnNumber: Math.max(0, turnNumber - 1),
    didRewind: true,
  }
}
