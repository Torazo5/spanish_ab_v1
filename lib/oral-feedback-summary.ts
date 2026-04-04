import type { ObserverFeedback } from '@/lib/types'

export interface FeedbackHeadline {
  title: string
  detail: string
}

export function getFeedbackHeadline(feedback: ObserverFeedback): FeedbackHeadline {
  const prioritizedError = [...feedback.errors].sort((a, b) => {
    if (a.severity === b.severity) return 0
    return a.severity === 'major' ? -1 : 1
  })[0]

  if (prioritizedError) {
    return {
      title: 'One thing to fix next',
      detail: `Change "${prioritizedError.original}" to "${prioritizedError.correction}".`,
    }
  }

  if (feedback.generalFeedback) {
    return {
      title: 'Strongest improvement',
      detail: feedback.generalFeedback,
    }
  }

  return {
    title: 'Keep this going',
    detail: 'No clear grammar mistakes in this answer.',
  }
}
