import { NextRequest, NextResponse } from 'next/server'
import { generateListeningText } from '@/lib/listening-llm'
import { jsonErrorResponse } from '@/lib/provider-errors'
import { checkAnswersPrompt } from '@/lib/prompts/listening'
import type { TypedListeningQuestion } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { script, questions, answers } = (await req.json()) as {
    script: string
    questions: TypedListeningQuestion[]
    answers: Record<string, string>
  }

  // Only grade gap-fill questions via AI
  const gapFillQuestions = questions.filter((q) => q.type === 'gap-fill') as Array<{
    id: string
    text: string
    marks: number
    sentence: string
  }>

  if (gapFillQuestions.length === 0) {
    return NextResponse.json({ results: [], encouragement: '' })
  }

  try {
    const response = await generateListeningText({
      prompt: checkAnswersPrompt(
        script,
        gapFillQuestions.map((question) => ({
          ...question,
          markNumber: questions.findIndex((entry) => entry.id === question.id) + 1,
        })),
        answers
      ),
      stage: 'answer-check',
    })

    const text = response.text
    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    try {
      const data = JSON.parse(jsonText)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: 'Failed to parse LLM response', raw: text }, { status: 500 })
    }
  } catch (error) {
    return jsonErrorResponse(error, 'Failed to check answers.')
  }
}
