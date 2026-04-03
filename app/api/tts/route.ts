import { NextRequest } from 'next/server'
import { textErrorResponse } from '@/lib/provider-errors'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  if (!text?.trim()) return new Response('text is required', { status: 400 })

  const key = process.env.AZURE_TTS_KEY
  const region = process.env.AZURE_TTS_REGION
  if (!key || !region) return new Response('TTS not configured', { status: 503 })

  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const ssml = `<speak version='1.0' xml:lang='es-ES'><voice name='es-ES-AlvaroNeural'>${escaped}</voice></speak>`

  try {
    const res = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          'User-Agent': 'spanish-practice-app',
        },
        body: ssml,
      }
    )

    if (!res.ok) {
      throw Object.assign(new Error(`TTS failed with status ${res.status}`), { status: res.status })
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return textErrorResponse(error, 'TTS failed.', 502)
  }
}
