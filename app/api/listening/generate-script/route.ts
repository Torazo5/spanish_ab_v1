import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { generateScriptPrompt, generateScriptRepairPrompt } from '@/lib/prompts/listening'
import { validateGeneratedListeningScript } from '@/lib/listening-validation'
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

  let lastRaw = ''
  let lastErrors: string[] = []

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const prompt =
      attempt === 0
        ? generateScriptPrompt(topic, marks)
        : generateScriptRepairPrompt(topic, marks, lastRaw, lastErrors)

    const response = await groq.chat.completions.create({
      model: MODELS.listening,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
      temperature: attempt === 0 ? 0.5 : 0.2,
    })

    const text = response.choices[0].message.content ?? ''
    lastRaw = text

    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    try {
      const data = JSON.parse(jsonText)
      const validationErrors = validateGeneratedListeningScript(data, marks)

      if (validationErrors.length === 0) {
        return NextResponse.json(data)
      }

      lastErrors = validationErrors
    } catch {
      lastErrors = ['Response was not valid JSON.']
    }
  }

  return NextResponse.json(
    { error: 'Failed to generate a valid listening exercise', details: lastErrors, raw: lastRaw },
    { status: 500 }
  )
}
