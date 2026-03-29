export type IbTopic =
  | 'travel'
  | 'family'
  | 'school'
  | 'food'
  | 'environment'
  | 'cultural-diversity'
  | 'health'
  | 'technology'

export const IB_TOPICS: { value: IbTopic; label: string }[] = [
  { value: 'school', label: 'School & Education' },
  { value: 'family', label: 'Family & Relationships' },
  { value: 'travel', label: 'Travel & Transport' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'health', label: 'Health & Sport' },
  { value: 'environment', label: 'Environment' },
  { value: 'technology', label: 'Technology & Media' },
  { value: 'cultural-diversity', label: 'Cultural Diversity' },
]

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type ErrorCategory =
  | 'gender'
  | 'tense'
  | 'conjugation'
  | 'vocabulary'
  | 'word-order'

export type ErrorSeverity = 'minor' | 'major'

export interface GrammarError {
  original: string
  correction: string
  explanation: string
  category: ErrorCategory
  severity: ErrorSeverity
}

export interface ObserverFeedback {
  originalMessage: string
  correctedSentence: string
  errors: GrammarError[]
  generalFeedback: string | null
  turnNumber: number
}

export interface ListeningQuestion {
  id: string
  text: string
}

export interface ListeningScript {
  script: string
  title: string
  questions: ListeningQuestion[]
}

export interface AnswerResult {
  questionId: string
  correct: boolean
  feedback: string
}

export type OralPhase =
  | 'idle'
  | 'ai-speaking'
  | 'waiting-for-user'
  | 'recording'
  | 'transcribing'
  | 'processing'
