import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { checkAnswersPrompt } from '@/lib/prompts/listening'
import type { ListeningQuestion } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { script, questions, answers } = (await req.json()) as {
    script: string
    questions: ListeningQuestion[]
    answers: string[]
  }

  const response = await groq.chat.completions.create({
    model: MODELS.listening,
    messages: [{ role: 'user', content: checkAnswersPrompt(script, questions, answers) }],
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
