import type {
  TypedListeningQuestion,
  AnswerResult,
  McqQuestion,
  TrueFalseNotGivenQuestion,
  IconMatchingQuestion,
  PersonAttributionQuestion,
} from '@/lib/types'

export interface GradedResult extends AnswerResult {
  marks: number
}

function gradeMcq(q: McqQuestion, answer: string): GradedResult {
  const selectedIndex = parseInt(answer, 10)
  const correct = selectedIndex === q.correctIndex
  const correctOption = q.options[q.correctIndex]
  return {
    questionId: q.id,
    correct,
    feedback: correct ? 'Correct!' : 'Incorrect.',
    correctAnswer: correctOption,
    marks: correct ? q.marks : 0,
  }
}

function gradeTfng(q: TrueFalseNotGivenQuestion, answer: string): GradedResult {
  const correct = answer === q.correctAnswer
  const labelMap: Record<string, string> = {
    true: 'True',
    false: 'False',
    'not-given': 'Not Given',
  }
  const correctLabel = labelMap[q.correctAnswer] ?? q.correctAnswer
  return {
    questionId: q.id,
    correct,
    feedback: correct ? 'Correct!' : 'Incorrect.',
    correctAnswer: correctLabel,
    marks: correct ? q.marks : 0,
  }
}

function gradeIconMatching(q: IconMatchingQuestion, answer: string): GradedResult {
  const correct = answer === q.correctIconName
  const correctIcon = q.icons.find((i) => i.name === q.correctIconName)
  const correctLabel = correctIcon?.label ?? q.correctIconName
  return {
    questionId: q.id,
    correct,
    feedback: correct ? 'Correct!' : 'Incorrect.',
    correctAnswer: correctLabel,
    marks: correct ? q.marks : 0,
  }
}

function gradePersonAttribution(q: PersonAttributionQuestion, answer: string): GradedResult {
  const correct = answer === q.correctAnswer
  const labelMap: Record<string, string> = {
    A: q.personA,
    B: q.personB,
    ambos: 'Ambos',
  }
  const correctLabel = labelMap[q.correctAnswer] ?? q.correctAnswer
  return {
    questionId: q.id,
    correct,
    feedback: correct ? 'Correct!' : 'Incorrect.',
    correctAnswer: correctLabel,
    marks: correct ? q.marks : 0,
  }
}

/**
 * Grade deterministic question types client-side (no API call needed).
 * Gap-fill questions are skipped and must be sent to AI grading.
 * Returns GradedResult[] only for deterministic types.
 */
export function gradeLocally(
  questions: TypedListeningQuestion[],
  answers: Record<string, string>
): GradedResult[] {
  const results: GradedResult[] = []

  for (const q of questions) {
    if (q.type === 'gap-fill') continue

    const answer = answers[q.id] ?? ''

    if (q.type === 'mcq') {
      results.push(gradeMcq(q, answer))
    } else if (q.type === 'true-false-notgiven') {
      results.push(gradeTfng(q, answer))
    } else if (q.type === 'icon-matching') {
      results.push(gradeIconMatching(q, answer))
    } else if (q.type === 'person-attribution') {
      results.push(gradePersonAttribution(q, answer))
    }
  }

  return results
}
