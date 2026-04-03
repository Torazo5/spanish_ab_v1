import { NextRequest } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { conversationSystemPrompt, openingTurnInstruction } from '@/lib/prompts/oral'
import type { ConversationMessage, IbTopic, OralDifficulty } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { userMessage, history, topic, difficulty = 'medium', initial } = (await req.json()) as {
    userMessage?: string
    history: ConversationMessage[]
    topic: IbTopic
    difficulty?: OralDifficulty
    initial?: boolean
  }

  const messages: { role: 'user' | 'assistant'; content: string }[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  if (initial) {
    // Opening turn — AI starts the conversation
    messages.push({
      role: 'user',
      content: openingTurnInstruction(difficulty),
    })
  } else if (userMessage) {
    messages.push({ role: 'user', content: userMessage })
  }

  const stream = await groq.chat.completions.create({
    model: MODELS.conversation,
    messages: [
      { role: 'system', content: conversationSystemPrompt(topic, difficulty) },
      ...messages,
    ],
    max_tokens: 150,
    temperature: 0.9,
    stream: true,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      let fullText = ''
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (delta) {
            fullText += delta
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ fullText })}\n\n`))
      } finally {
        controller.close()
      }
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
