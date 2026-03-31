import { NextRequest } from 'next/server'

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

  if (!res.ok) return new Response('TTS failed', { status: 502 })

  return new Response(res.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
