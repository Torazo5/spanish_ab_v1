import { NextRequest } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { textErrorResponse } from '@/lib/provider-errors'
import { getObserverSystemPrompt, observerUserPrompt } from '@/lib/prompts/oral'
import type { ConversationMessage } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { userMessage, conversationHistory, turnNumber, speechMode = 'natural' } = (await req.json()) as {
    userMessage: string
    conversationHistory: ConversationMessage[]
    turnNumber: number
    speechMode?: 'natural' | 'strict'
  }

  // Get the last thing Luis said so the observer knows what question the student is answering
  const lastAssistant = [...conversationHistory].reverse().find((m) => m.role === 'assistant')

  try {
    const response = await groq.chat.completions.create({
      model: MODELS.observer,
      messages: [
        { role: 'system', content: getObserverSystemPrompt(speechMode) },
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
          // If JSON parsing fails, send a contract-safe fallback so the UI
          // still shows the student's original utterance for this turn.
          const fallback = {
            originalMessage: userMessage,
            correctedSentence: '',
            errors: [],
            generalFeedback: null,
            turnNumber,
          }
          controller.enqueue(
            encoder.encode(`event: feedback\ndata: ${JSON.stringify(fallback)}\n\n`)
          )
        }
        controller.enqueue(
          encoder.encode(`event: done\ndata: {}\n\n`)
        )
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
  } catch (error) {
    return textErrorResponse(error, 'Failed to generate tutor feedback.')
  }
}
