import type {
  IconMatchingQuestion,
  ListeningQuestionBlockMetadata,
  ListeningMode,
  McqQuestion,
  PersonAttributionQuestion,
  QuestionType,
  TypedListeningQuestion,
} from '@/lib/types'
import { getListeningBlockPlan } from '@/lib/listening-structure'

export interface ListeningTranscriptValidationSpec {
  expectedMarks: number
  mode?: ListeningMode
}

export interface ListeningQuestionBlockValidationSpec {
  blockIndex: number
  count: number
  type: QuestionType
  mode?: ListeningMode
  sourceParagraph?: number
  transcriptParagraphCount?: number
}

export interface ListeningQuestionBlockValidationOptions {
  sourceParagraph?: unknown
}

function isQuestionBlockMetadata(value: unknown): value is ListeningQuestionBlockMetadata {
  return isRecord(value) && typeof value.type === 'string' && Number.isInteger(value.startMark) && Number.isInteger(value.endMark)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function splitTranscriptIntoParagraphs(script: string): string[] {
  return script
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function hasExactlyOneBlank(sentence: string): boolean {
  return (sentence.match(/___/g) ?? []).length === 1
}

function validateMcq(question: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!hasStringArray(question.options) || question.options.length < 3 || question.options.length > 4) {
    errors.push('MCQ questions must include 3 or 4 string options.')
  }
  if (!Number.isInteger(question.correctIndex)) {
    errors.push('MCQ questions must include an integer correctIndex.')
  }

  const { options, correctIndex } = question as Partial<McqQuestion>
  if (
    Array.isArray(options) &&
    typeof correctIndex === 'number' &&
    Number.isInteger(correctIndex) &&
    (correctIndex < 0 || correctIndex >= options.length)
  ) {
    errors.push('MCQ correctIndex must point to an existing option.')
  }

  return errors
}

function validateTfng(question: Record<string, unknown>): string[] {
  return question.correctAnswer === 'true' || question.correctAnswer === 'false' || question.correctAnswer === 'not-given'
    ? []
    : ['True/false/not-given questions must include correctAnswer of "true", "false", or "not-given".']
}

function validateGapFill(question: Record<string, unknown>): string[] {
  const errors: string[] = []
  const sentence = typeof question.sentence === 'string' ? question.sentence : ''

  if (sentence.trim() === '' || !sentence.includes('___')) {
    errors.push('Gap-fill questions must include a sentence containing ___ as the blank.')
  } else if (!hasExactlyOneBlank(sentence)) {
    errors.push('Gap-fill questions must contain exactly one ___ blank per item.')
  }

  if (!hasStringArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) {
    errors.push('Gap-fill questions must include at least one accepted answer.')
  } else if (question.acceptedAnswers.some((answer) => answer.trim() === '')) {
    errors.push('Gap-fill acceptedAnswers must not contain empty strings.')
  }

  return errors
}

function validateIconMatching(question: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!Array.isArray(question.icons) || question.icons.length < 3 || question.icons.length > 4) {
    errors.push('Icon-matching questions must include 3 or 4 icons.')
  }

  const typedQuestion = question as Partial<IconMatchingQuestion>
  const iconsAreValid = typedQuestion.icons?.every(
    (icon) =>
      typeof icon?.name === 'string' &&
      icon.name.trim() !== '' &&
      typeof icon?.label === 'string' &&
      icon.label.trim() !== ''
  )
  if (!iconsAreValid) {
    errors.push('Each icon-matching icon must include non-empty string name and label fields.')
  }

  if (
    typeof typedQuestion.correctIconName !== 'string' ||
    typedQuestion.correctIconName.trim() === '' ||
    !typedQuestion.icons?.some((icon) => icon.name === typedQuestion.correctIconName)
  ) {
    errors.push('Icon-matching questions must include a correctIconName that matches one of the icons.')
  }

  return errors
}

function validatePersonAttribution(question: Record<string, unknown>): string[] {
  const typedQuestion = question as Partial<PersonAttributionQuestion>
  const errors: string[] = []

  if (
    typeof typedQuestion.personA !== 'string' ||
    typedQuestion.personA.trim() === '' ||
    typeof typedQuestion.personB !== 'string' ||
    typedQuestion.personB.trim() === ''
  ) {
    errors.push('Person-attribution questions must include non-empty personA and personB strings.')
  }

  if (typedQuestion.correctAnswer !== 'A' && typedQuestion.correctAnswer !== 'B' && typedQuestion.correctAnswer !== 'ambos') {
    errors.push('Person-attribution questions must include correctAnswer of "A", "B", or "ambos".')
  }

  return errors
}

function validateQuestion(question: unknown, index: number): { errors: string[]; type?: TypedListeningQuestion['type']; marks?: number } {
  if (!isRecord(question)) {
    return { errors: [`Question ${index + 1} must be an object.`] }
  }

  const errors: string[] = []
  const prefix = `Question ${index + 1}`

  if (typeof question.id !== 'string' || question.id.trim() === '') {
    errors.push(`${prefix} must include a non-empty string id.`)
  }
  if (typeof question.text !== 'string' || question.text.trim() === '') {
    errors.push(`${prefix} must include non-empty Spanish question text.`)
  }
  if (question.marks !== 1) {
    errors.push(`${prefix} must have marks of exactly 1.`)
  }
  if (typeof question.type !== 'string') {
    errors.push(`${prefix} must include a question type.`)
    return { errors }
  }

  switch (question.type) {
    case 'mcq':
      errors.push(...validateMcq(question).map((error) => `${prefix}: ${error}`))
      break
    case 'true-false-notgiven':
      errors.push(...validateTfng(question).map((error) => `${prefix}: ${error}`))
      break
    case 'gap-fill':
      errors.push(...validateGapFill(question).map((error) => `${prefix}: ${error}`))
      break
    case 'icon-matching':
      errors.push(...validateIconMatching(question).map((error) => `${prefix}: ${error}`))
      break
    case 'person-attribution':
      errors.push(...validatePersonAttribution(question).map((error) => `${prefix}: ${error}`))
      break
    default:
      errors.push(`${prefix} has unsupported type "${question.type}".`)
  }

  return {
    errors,
    type: question.type as TypedListeningQuestion['type'],
    marks: question.marks as number | undefined,
  }
}

function validateQuestionsArray(questions: unknown[]): {
  errors: string[]
  blockLengths: number[]
  blockTexts: string[][]
  blockTypes: string[]
  totalQuestionMarks: number
} {
  const errors: string[] = []
  const ids = new Set<string>()
  let totalQuestionMarks = 0
  const blockTypes: string[] = []
  const blockLengths: number[] = []
  const blockTexts: string[][] = []

  questions.forEach((question, index) => {
    const result = validateQuestion(question, index)
    errors.push(...result.errors)

    if (isRecord(question) && typeof question.id === 'string') {
      if (ids.has(question.id)) {
        errors.push(`Question ids must be unique. Duplicate id: ${question.id}.`)
      }
      ids.add(question.id)
    }

    if (result.marks === 1) {
      totalQuestionMarks += result.marks
    }

    if (!result.type) {
      return
    }

    const currentBlockType = blockTypes.at(-1)
    if (currentBlockType === result.type) {
      const lastIndex = blockLengths.length - 1
      blockLengths[lastIndex] += 1
      if (isRecord(question) && typeof question.text === 'string') {
        blockTexts[lastIndex].push(question.text)
      }
      return
    }

    blockTypes.push(result.type)
    blockLengths.push(1)
    blockTexts.push(isRecord(question) && typeof question.text === 'string' ? [question.text] : [])
  })

  return { errors, blockLengths, blockTexts, blockTypes, totalQuestionMarks }
}

export function validateListeningTranscript(
  data: unknown,
  spec: ListeningTranscriptValidationSpec
): string[] {
  if (!isRecord(data)) {
    return ['Transcript response must be a JSON object.']
  }

  const errors: string[] = []
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const script = typeof data.script === 'string' ? data.script.trim() : ''
  const expectedRange = spec.expectedMarks <= 10 ? { min: 150, max: 180 } : { min: 180, max: 250 }

  if (title === '') {
    errors.push('title must be a non-empty string.')
  }
  if (script === '') {
    errors.push('script must be a non-empty string.')
  }

  if (script !== '') {
    const wordCount = countWords(script)
    if (wordCount < expectedRange.min || wordCount > expectedRange.max) {
      errors.push(`script must be between ${expectedRange.min} and ${expectedRange.max} words; got ${wordCount}.`)
    }

    const paragraphs = splitTranscriptIntoParagraphs(script)
    if (paragraphs.length === 0) {
      errors.push('script must contain at least one non-empty paragraph.')
    }

    if (spec.mode === 'sequential') {
      const expectedParagraphCount = getListeningBlockPlan(spec.expectedMarks).length
      if (paragraphs.length !== expectedParagraphCount) {
        errors.push(
          `script must contain exactly ${expectedParagraphCount} paragraphs for sequential mode; got ${paragraphs.length}.`
        )
      }
    }
  }

  return errors
}

export function validateListeningQuestionBlock(
  questions: unknown,
  spec: ListeningQuestionBlockValidationSpec,
  options?: ListeningQuestionBlockValidationOptions
): string[] {
  const scopedErrors: string[] = []

  if (!Array.isArray(questions)) {
    return [`Block ${spec.blockIndex + 1} must be an array of questions.`]
  }

  if (spec.mode === 'sequential') {
    const sourceParagraphValue = options?.sourceParagraph

    if (!Number.isInteger(spec.transcriptParagraphCount) || (spec.transcriptParagraphCount ?? 0) <= 0) {
      scopedErrors.push(`Block ${spec.blockIndex + 1} requires a valid transcript paragraph count.`)
    }

    if (!Number.isInteger(sourceParagraphValue)) {
      scopedErrors.push(`Block ${spec.blockIndex + 1} must include an integer sourceParagraph in sequential mode.`)
    } else {
      const sourceParagraph = sourceParagraphValue as number
      if (sourceParagraph < 1 || sourceParagraph > (spec.transcriptParagraphCount ?? 0)) {
        scopedErrors.push(
          `Block ${spec.blockIndex + 1} sourceParagraph must be between 1 and ${spec.transcriptParagraphCount ?? 0}; got ${sourceParagraph}.`
        )
      }

      if (Number.isInteger(spec.sourceParagraph) && sourceParagraph !== spec.sourceParagraph) {
        scopedErrors.push(
          `Block ${spec.blockIndex + 1} must target paragraph ${spec.sourceParagraph}; got ${sourceParagraph}.`
        )
      }
    }
  }
  const { errors, blockLengths, blockTexts, blockTypes, totalQuestionMarks } = validateQuestionsArray(questions)
  scopedErrors.push(...errors.map((error) => `Block ${spec.blockIndex + 1}: ${error}`))

  if (questions.length !== spec.count) {
    scopedErrors.push(`Block ${spec.blockIndex + 1} must contain exactly ${spec.count} entries; got ${questions.length}.`)
  }

  if (totalQuestionMarks !== spec.count) {
    scopedErrors.push(`Block ${spec.blockIndex + 1} must total exactly ${spec.count} marks; got ${totalQuestionMarks}.`)
  }

  if (blockTypes.length !== 1) {
    scopedErrors.push(`Block ${spec.blockIndex + 1} must contain exactly one contiguous question type.`)
  }

  if (blockTypes[0] && blockTypes[0] !== spec.type) {
    scopedErrors.push(
      `Block ${spec.blockIndex + 1} must contain only "${spec.type}" questions; got "${blockTypes[0]}".`
    )
  }

  if (blockLengths.length > 0 && blockLengths[0] !== spec.count) {
    scopedErrors.push(`Block ${spec.blockIndex + 1} must have contiguous length ${spec.count}; got ${blockLengths[0]}.`)
  }

  if (spec.type === 'gap-fill') {
    const texts = blockTexts[0] ?? []
    if (new Set(texts).size > 1) {
      scopedErrors.push(`Block ${spec.blockIndex + 1} gap-fill items must use the same instruction text.`)
    }
  }

  return scopedErrors
}

export function validateGeneratedListeningScript(
  data: unknown,
  expectedMarks: number,
  options?: { mode?: ListeningMode }
): string[] {
  if (!isRecord(data)) {
    return ['Response must be a JSON object.']
  }

  const errors: string[] = [
    ...validateListeningTranscript(data, { expectedMarks, mode: options?.mode }),
  ]

  if (data.totalMarks !== expectedMarks) {
    errors.push(`totalMarks must be exactly ${expectedMarks}.`)
  }
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('questions must be a non-empty array.')
    return errors
  }

  const { errors: questionErrors, blockLengths, blockTexts, blockTypes, totalQuestionMarks } = validateQuestionsArray(
    data.questions
  )
  errors.push(...questionErrors)

  if (totalQuestionMarks !== expectedMarks) {
    errors.push(`The sum of question marks must be exactly ${expectedMarks}; got ${totalQuestionMarks}.`)
  }
  if (data.questions.length !== expectedMarks) {
    errors.push(`There must be exactly ${expectedMarks} 1-mark entries; got ${data.questions.length}.`)
  }

  const expectedBlockPlan = getListeningBlockPlan(expectedMarks)
  if (blockLengths.length !== expectedBlockPlan.length) {
    errors.push(`There must be exactly ${expectedBlockPlan.length} contiguous mark blocks; got ${blockLengths.length}.`)
  }

  expectedBlockPlan.forEach((expectedLength, index) => {
    const actualLength = blockLengths[index]
    if (actualLength !== expectedLength) {
      errors.push(`Mark block ${index + 1} must contain exactly ${expectedLength} entries; got ${actualLength ?? 0}.`)
    }
  })

  if (new Set(blockTypes).size !== blockTypes.length) {
    errors.push('Each contiguous mark block must use a different question type.')
  }

  if (options?.mode === 'sequential') {
    const questionBlocks = Array.isArray(data.questionBlocks) ? data.questionBlocks : null

    if (!questionBlocks) {
      errors.push('Sequential mode responses must include questionBlocks metadata.')
    } else if (questionBlocks.length !== expectedBlockPlan.length) {
      errors.push(
        `Sequential mode questionBlocks metadata must contain exactly ${expectedBlockPlan.length} blocks; got ${questionBlocks.length}.`
      )
    } else {
      questionBlocks.forEach((block, index) => {
        if (!isQuestionBlockMetadata(block)) {
          errors.push(`Sequential mode question block ${index + 1} metadata is invalid.`)
          return
        }

        const expectedStartMark = expectedBlockPlan.slice(0, index).reduce((sum, count) => sum + count, 1)
        const expectedEndMark = expectedStartMark + expectedBlockPlan[index] - 1

        if (block.startMark !== expectedStartMark || block.endMark !== expectedEndMark) {
          errors.push(
            `Sequential mode question block ${index + 1} must span marks ${expectedStartMark}-${expectedEndMark}; got ${block.startMark}-${block.endMark}.`
          )
        }

        if (block.type !== blockTypes[index]) {
          errors.push(
            `Sequential mode question block ${index + 1} metadata type must match generated questions; expected "${blockTypes[index] ?? 'unknown'}", got "${block.type}".`
          )
        }

        if (!Number.isInteger(block.sourceParagraph) || block.sourceParagraph !== index + 1) {
          errors.push(
            `Sequential mode question block ${index + 1} must target sourceParagraph ${index + 1}; got ${String(block.sourceParagraph)}.`
          )
        }
      })
    }
  }

  blockTypes.forEach((type, index) => {
    if (type !== 'gap-fill') {
      return
    }

    const texts = blockTexts[index] ?? []
    if (new Set(texts).size > 1) {
      errors.push(`Gap-fill block ${index + 1} must use the same instruction text for every entry.`)
    }
  })

  return errors
}
