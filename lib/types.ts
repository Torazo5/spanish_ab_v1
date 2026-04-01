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

export type ConversationMode = 'auto' | 'manual'

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

export type QuestionType = 'mcq' | 'true-false-notgiven' | 'gap-fill' | 'icon-matching' | 'person-attribution'

export const MARK_OPTIONS = [5, 10, 15, 25] as const
export type MarkOption = (typeof MARK_OPTIONS)[number]

export interface McqQuestion {
  type: 'mcq'
  id: string
  text: string
  marks: number
  options: string[]
  correctIndex: number
}

export interface TrueFalseNotGivenQuestion {
  type: 'true-false-notgiven'
  id: string
  text: string
  marks: number
  correctAnswer: 'true' | 'false' | 'not-given'
}

export interface GapFillQuestion {
  type: 'gap-fill'
  id: string
  text: string
  sentence: string
  marks: number
  acceptedAnswers: string[]
}

export interface IconMatchingQuestion {
  type: 'icon-matching'
  id: string
  text: string
  marks: number
  icons: { name: string; label: string }[]
  correctIconName: string
}

export interface PersonAttributionQuestion {
  type: 'person-attribution'
  id: string
  text: string
  marks: number
  personA: string
  personB: string
  correctAnswer: 'A' | 'B' | 'ambos'
}

export type TypedListeningQuestion =
  | McqQuestion
  | TrueFalseNotGivenQuestion
  | GapFillQuestion
  | IconMatchingQuestion
  | PersonAttributionQuestion

export interface TypedListeningScript {
  script: string
  title: string
  totalMarks: number
  questions: TypedListeningQuestion[]
}

export interface AnswerResult {
  questionId: string
  correct: boolean
  feedback: string
  marks?: number
  correctAnswer?: string
}

export type OralPhase =
  | 'idle'
  | 'ai-speaking'
  | 'waiting-for-ai-start'
  | 'waiting-for-user'
  | 'recording'
  | 'transcribing'
  | 'processing'
