import { NextRequest, NextResponse } from 'next/server'
import { generateListeningScript, ListeningGenerationError } from '@/lib/listening-generator'
import { getPrototypeCapacityMessage, getPrototypeCapacityStatus } from '@/lib/provider-errors'
import { MARK_OPTIONS, type IbTopic, type ListeningMode } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

function isListeningMode(value: unknown): value is ListeningMode {
  return value === 'general' || value === 'sequential'
}

export async function POST(req: NextRequest) {
  const { topic, marks = 10, mode = 'general' } = (await req.json()) as {
    topic?: IbTopic
    marks?: number
    mode?: ListeningMode
  }

  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 })
  }

  if (!MARK_OPTIONS.includes(marks as (typeof MARK_OPTIONS)[number])) {
    return NextResponse.json({ error: 'marks must be 5, 10, 15, or 25' }, { status: 400 })
  }

  if (!isListeningMode(mode)) {
    return NextResponse.json({ error: 'mode must be "general" or "sequential"' }, { status: 400 })
  }

  try {
    const script = await generateListeningScript({ topic, marks, mode })
    return NextResponse.json(script)
  } catch (error) {
    if (error instanceof ListeningGenerationError) {
      return NextResponse.json(
        {
          error: getPrototypeCapacityMessage(error.cause ?? error, error.message),
          requestId: error.requestId,
          stage: error.stage,
          details: error.details,
        },
        { status: getPrototypeCapacityStatus(error.cause ?? error, 500) }
      )
    }

    return NextResponse.json(
      { error: getPrototypeCapacityMessage(error, 'Listening generation failed unexpectedly.') },
      { status: getPrototypeCapacityStatus(error, 500) }
    )
  }
}
