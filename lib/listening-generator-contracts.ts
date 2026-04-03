import type {
  GapFillQuestion,
  IconMatchingQuestion,
  ListeningMode,
  McqQuestion,
  PersonAttributionQuestion,
  QuestionType,
  TrueFalseNotGivenQuestion,
  TypedListeningQuestion,
} from '@/lib/types'

export type ListeningGenerationMode = ListeningMode

export interface ListeningTranscriptPayload {
  title: string
  script: string
}

interface ListeningQuestionDraftBase {
  type: QuestionType
  text: string
}

export interface McqQuestionDraft extends ListeningQuestionDraftBase {
  type: 'mcq'
  options: string[]
  correctIndex: number
}

export interface TrueFalseNotGivenQuestionDraft extends ListeningQuestionDraftBase {
  type: 'true-false-notgiven'
  correctAnswer: 'true' | 'false' | 'not-given'
}

export interface GapFillQuestionDraft extends ListeningQuestionDraftBase {
  type: 'gap-fill'
  sentence: string
  acceptedAnswers: string[]
}

export interface IconMatchingQuestionDraft extends ListeningQuestionDraftBase {
  type: 'icon-matching'
  icons: { name: string; label: string }[]
  correctIconName: string
}

export interface PersonAttributionQuestionDraft extends ListeningQuestionDraftBase {
  type: 'person-attribution'
  personA: string
  personB: string
  correctAnswer: 'A' | 'B' | 'ambos'
}

export type ListeningQuestionDraft =
  | McqQuestionDraft
  | TrueFalseNotGivenQuestionDraft
  | GapFillQuestionDraft
  | IconMatchingQuestionDraft
  | PersonAttributionQuestionDraft

export interface ListeningQuestionBlockPayload {
  sourceParagraph?: number
  questions: ListeningQuestionDraft[]
}

export interface ListeningQuestionBlockSpec {
  blockIndex: number
  count: number
  type: QuestionType
  questionStartMark: number
  mode: ListeningGenerationMode
  sourceParagraph?: number
  sourceText?: string
  transcriptParagraphCount: number
}

function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function trimStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => trimString(entry)).filter((entry) => entry.length > 0)
    : []
}

function normalizeQuestionBase(draft: ListeningQuestionDraft, questionNumber: number) {
  return {
    id: `q${questionNumber}`,
    text: trimString(draft.text),
    marks: 1 as const,
  }
}

export function normalizeListeningQuestionDrafts(
  drafts: ListeningQuestionDraft[],
  questionStartMark: number
): TypedListeningQuestion[] {
  return drafts.map((draft, index) => {
    const questionNumber = questionStartMark + index
    const base = normalizeQuestionBase(draft, questionNumber)

    switch (draft.type) {
      case 'mcq':
        return {
          ...base,
          type: 'mcq',
          options: trimStringArray(draft.options),
          correctIndex: draft.correctIndex,
        } satisfies McqQuestion
      case 'true-false-notgiven':
        return {
          ...base,
          type: 'true-false-notgiven',
          correctAnswer: draft.correctAnswer,
        } satisfies TrueFalseNotGivenQuestion
      case 'gap-fill':
        return {
          ...base,
          type: 'gap-fill',
          sentence: trimString(draft.sentence),
          acceptedAnswers: trimStringArray(draft.acceptedAnswers),
        } satisfies GapFillQuestion
      case 'icon-matching':
        return {
          ...base,
          type: 'icon-matching',
          icons: Array.isArray(draft.icons)
            ? draft.icons.map((icon) => ({
                name: trimString(icon?.name),
                label: trimString(icon?.label),
              }))
            : [],
          correctIconName: trimString(draft.correctIconName),
        } satisfies IconMatchingQuestion
      case 'person-attribution':
        return {
          ...base,
          type: 'person-attribution',
          personA: trimString(draft.personA),
          personB: trimString(draft.personB),
          correctAnswer: draft.correctAnswer,
        } satisfies PersonAttributionQuestion
    }
  })
}
