import { NextRequest, NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'
import { toFile } from 'groq-sdk'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audioBlob = formData.get('audio') as Blob | null

  if (!audioBlob) {
    return NextResponse.json({ error: 'audio is required' }, { status: 400 })
  }

  const arrayBuffer = await audioBlob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const file = await toFile(buffer, 'audio.webm', { type: audioBlob.type || 'audio/webm' })

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: MODELS.whisper,
    language: 'es',
    response_format: 'json',
    // Bias Whisper toward literal transcription rather than auto-correcting learner errors.
    // Without this, Whisper's beam search silently fixes wrong conjugations/gender to the
    // statistically "correct" form, so the Observer never sees the actual mistake.
    prompt: 'Transcripción literal. El hablante es estudiante de español y puede cometer errores gramaticales. No corrijas los errores; transcribe exactamente lo que se dijo, incluso si es gramaticalmente incorrecto.',
  })

  return NextResponse.json({ transcript: transcription.text })
}
