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
  conversation: 'llama-3.1-8b-instant',  // fast, 14,400 req/day free
  observer: 'llama-3.3-70b-versatile',   // quality, 1,000 req/day free
  listening: 'llama-3.3-70b-versatile',
  whisper: 'whisper-large-v3-turbo',
} as const
