import type {
  IconMatchingQuestion,
  McqQuestion,
  PersonAttributionQuestion,
  TypedListeningQuestion,
} from '@/lib/types'
import { getListeningBlockPlan } from '@/lib/listening-structure'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
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
  if (typeof question.sentence !== 'string' || !question.sentence.includes('___')) {
    errors.push('Gap-fill questions must include a sentence containing ___ as the blank.')
  }
  if (!hasStringArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) {
    errors.push('Gap-fill questions must include at least one accepted answer.')
  }
  return errors
}

function validateIconMatching(question: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!Array.isArray(question.icons) || question.icons.length < 3 || question.icons.length > 4) {
    errors.push('Icon-matching questions must include 3 or 4 icons.')
  }

  const typedQuestion = question as Partial<IconMatchingQuestion>
  const iconsAreValid = typedQuestion.icons?.every((icon) => typeof icon?.name === 'string' && typeof icon?.label === 'string')
  if (!iconsAreValid) {
    errors.push('Each icon-matching icon must include string name and label fields.')
  }

  if (
    typeof typedQuestion.correctIconName !== 'string' ||
    !typedQuestion.icons?.some((icon) => icon.name === typedQuestion.correctIconName)
  ) {
    errors.push('Icon-matching questions must include a correctIconName that matches one of the icons.')
  }

  return errors
}

function validatePersonAttribution(question: Record<string, unknown>): string[] {
  const typedQuestion = question as Partial<PersonAttributionQuestion>
  const errors: string[] = []

  if (typeof typedQuestion.personA !== 'string' || typeof typedQuestion.personB !== 'string') {
    errors.push('Person-attribution questions must include personA and personB strings.')
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

export function validateGeneratedListeningScript(data: unknown, expectedMarks: number): string[] {
  if (!isRecord(data)) {
    return ['Response must be a JSON object.']
  }

  const errors: string[] = []

  if (typeof data.script !== 'string' || data.script.trim() === '') {
    errors.push('script must be a non-empty string.')
  }
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('title must be a non-empty string.')
  }
  if (data.totalMarks !== expectedMarks) {
    errors.push(`totalMarks must be exactly ${expectedMarks}.`)
  }
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('questions must be a non-empty array.')
    return errors
  }

  const ids = new Set<string>()
  let totalQuestionMarks = 0
  const blockTypes: string[] = []
  const blockLengths: number[] = []
  const blockTexts: string[][] = []

  data.questions.forEach((question, index) => {
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

    if (result.type) {
      const currentBlockType = blockTypes.at(-1)

      if (currentBlockType === result.type) {
        const lastIndex = blockLengths.length - 1
        blockLengths[lastIndex] += 1
        if (isRecord(question) && typeof question.text === 'string') {
          blockTexts[lastIndex].push(question.text)
        }
      } else {
        blockTypes.push(result.type)
        blockLengths.push(1)
        blockTexts.push(isRecord(question) && typeof question.text === 'string' ? [question.text] : [])
      }
    }
  })

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

  blockTypes.forEach((type, index) => {
    if (type !== 'gap-fill') return

    const texts = blockTexts[index] ?? []
    if (new Set(texts).size > 1) {
      errors.push(`Gap-fill block ${index + 1} must use the same instruction text for every entry.`)
    }
  })

  return errors
}
