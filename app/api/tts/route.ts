import { NextRequest } from 'next/server'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

export const runtime = 'nodejs'
export const maxDuration = 30

// Reuse the TTS instance across requests to avoid re-handshaking
let tts: MsEdgeTTS | null = null

async function getTts(): Promise<MsEdgeTTS> {
  if (!tts) {
    tts = new MsEdgeTTS()
    await tts.setMetadata(
      'es-ES-AlvaroNeural',
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    )
  }
  return tts
}

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text: string }

  if (!text?.trim()) {
    return new Response('text is required', { status: 400 })
  }

  try {
    const engine = await getTts()
    const { audioStream } = engine.toStream(text)

    const readable = new ReadableStream({
      start(controller) {
        audioStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        audioStream.on('end', () => controller.close())
        audioStream.on('error', (err: Error) => {
          // Reset so next request gets a fresh connection
          tts = null
          controller.error(err)
        })
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    tts = null // reset on error
    return new Response('TTS failed', { status: 500 })
  }
}
