import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { jsonErrorResponse } from '@/lib/provider-errors'
import type { GrammarError } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_PROMPT = `You are a Spanish grammar tutor for an A2-B1 student (IB Ab Initio level).
Explain clearly and concisely:
1. **The Rule** — the grammar rule that applies (1-2 sentences)
2. **Why It's Wrong** — why their sentence broke this rule
3. **Examples** — 2-3 short example sentences showing correct usage
4. **Memory Tip** — one memorable tip to avoid this mistake

Keep under 150 words. Use simple English for explanations. Spanish examples should use bold for the key word/phrase.`

export async function POST(req: NextRequest) {
  const { originalSentence, error } = (await req.json()) as {
    originalSentence: string
    error: GrammarError
  }

  const userPrompt = `Student said: "${originalSentence}"
Error: "${error.original}" should be "${error.correction}"
Category: ${error.category}
Brief explanation: ${error.explanation}`

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.drillDeeper,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.3,
    })

    const explanation = response.choices[0].message.content ?? ''
    return NextResponse.json({ explanation })
  } catch (error) {
    return jsonErrorResponse(error, 'Failed to generate explanation.')
  }
}
