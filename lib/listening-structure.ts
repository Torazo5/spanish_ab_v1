import type { QuestionType, TypedListeningQuestion } from '@/lib/types'

const LISTENING_BLOCK_PLANS: Record<number, number[]> = {
  5: [3, 2],
  10: [4, 3, 3],
  15: [5, 5, 5],
  25: [9, 8, 8],
}

export interface ListeningMarkBlock {
  type: QuestionType
  startMark: number
  endMark: number
  entries: {
    question: TypedListeningQuestion
    markNumber: number
  }[]
}

export function getListeningBlockPlan(marks: number): number[] {
  return LISTENING_BLOCK_PLANS[marks] ?? [marks]
}

export function getMarkLabel(markNumber: number): string {
  return `Mark ${markNumber}`
}

export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case 'mcq':
      return 'Multiple Choice'
    case 'true-false-notgiven':
      return 'True / False / Not Given'
    case 'gap-fill':
      return 'Gap Fill Passage'
    case 'icon-matching':
      return 'Icon Matching'
    case 'person-attribution':
      return 'Person A / Person B / Ambos'
  }
}

export function groupQuestionsIntoMarkBlocks(questions: TypedListeningQuestion[]): ListeningMarkBlock[] {
  const blocks: ListeningMarkBlock[] = []

  questions.forEach((question, index) => {
    const markNumber = index + 1
    const currentBlock = blocks.at(-1)

    if (currentBlock && currentBlock.type === question.type) {
      currentBlock.entries.push({ question, markNumber })
      currentBlock.endMark = markNumber
      return
    }

    blocks.push({
      type: question.type,
      startMark: markNumber,
      endMark: markNumber,
      entries: [{ question, markNumber }],
    })
  })

  return blocks
}
