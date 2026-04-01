import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
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

  const response = await groq.chat.completions.create({
    model: MODELS.listening,
    messages: [{
      role: 'user',
      content: checkAnswersPrompt(
        script,
        gapFillQuestions.map((question) => ({
          ...question,
          markNumber: questions.findIndex((entry) => entry.id === question.id) + 1,
        })),
        answers
      ),
    }],
    max_tokens: 800,
    temperature: 0.3,
  })

  const text = response.choices[0].message.content ?? ''
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    const data = JSON.parse(jsonText)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to parse LLM response', raw: text }, { status: 500 })
  }
}
