import Groq from 'groq-sdk'

let _groq: Groq | null = null

export function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}

// Backwards-compat alias used in routes
export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    return (getGroq() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const MODELS = {
  conversation: 'qwen/qwen3.8-27b',
  observer: 'openai/gpt-oss-120b',
  listening: 'openai/gpt-oss-120b',
  whisper: 'whisper-large-v3-turbo',
  drillDeeper: 'openai/gpt-oss-20b',
} as const
