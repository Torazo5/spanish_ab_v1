import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { generateScriptPrompt } from '@/lib/prompts/listening'
import type { IbTopic } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { topic, marks = 10 } = (await req.json()) as { topic: IbTopic; marks?: number }

  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 })
  }

  const validMarks = [5, 10, 15, 25]
  if (!validMarks.includes(marks)) {
    return NextResponse.json({ error: 'marks must be 5, 10, 15, or 25' }, { status: 400 })
  }

  const response = await groq.chat.completions.create({
    model: MODELS.listening,
    messages: [{ role: 'user', content: generateScriptPrompt(topic, marks) }],
    max_tokens: 2000,
    temperature: 0.8,
  })

  const text = response.choices[0].message.content ?? ''

  // strip markdown code fences if present
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    const data = JSON.parse(jsonText)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to parse LLM response', raw: text }, { status: 500 })
  }
}
