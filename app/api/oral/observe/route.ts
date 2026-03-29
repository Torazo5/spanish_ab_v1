import { NextRequest } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { OBSERVER_SYSTEM_PROMPT, observerUserPrompt } from '@/lib/prompts/oral'
import type { ConversationMessage } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { userMessage, conversationHistory, turnNumber } = (await req.json()) as {
    userMessage: string
    conversationHistory: ConversationMessage[]
    turnNumber: number
  }

  // Get the last thing María said so the observer knows what question the student is answering
  const lastAssistant = [...conversationHistory].reverse().find((m) => m.role === 'assistant')

  const response = await groq.chat.completions.create({
    model: MODELS.observer,
    messages: [
      { role: 'system', content: OBSERVER_SYSTEM_PROMPT },
      { role: 'user', content: observerUserPrompt(userMessage, turnNumber, lastAssistant?.content) },
    ],
    max_tokens: 600,
    temperature: 0.3,
  })

  const text = response.choices[0].message.content ?? ''
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    start(controller) {
      try {
        const feedback = JSON.parse(jsonText)
        // Strip errors that are capitalization/accent-only differences
        const normalize = (s: string) =>
          s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        if (Array.isArray(feedback.errors)) {
          feedback.errors = feedback.errors.filter(
            (e: { original: string; correction: string }) =>
              normalize(e.original) !== normalize(e.correction)
          )
        }
        controller.enqueue(
          encoder.encode(`event: feedback\ndata: ${JSON.stringify({ ...feedback, originalMessage: userMessage, turnNumber })}\n\n`)
        )
      } catch {
        // If JSON parsing fails, send a minimal fallback
        const fallback = {
          correctedSentence: '',
          errors: [],
          turnNumber,
        }
        controller.enqueue(
          encoder.encode(`event: feedback\ndata: ${JSON.stringify(fallback)}\n\n`)
        )
      }
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
