import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 10

interface FeedbackPayload {
  message?: unknown
  contactEmail?: unknown
  path?: unknown
  context?: unknown
  href?: unknown
  userAgent?: unknown
}

function asOptionalTrimmedString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as FeedbackPayload | null
  const message = asOptionalTrimmedString(body?.message, 2000)
  const contactEmail = asOptionalTrimmedString(body?.contactEmail, 320)
  const path = asOptionalTrimmedString(body?.path, 200)
  const context = asOptionalTrimmedString(body?.context, 120)
  const href = asOptionalTrimmedString(body?.href, 500)
  const submittedUserAgent = asOptionalTrimmedString(body?.userAgent, 500)

  if (!message) {
    return NextResponse.json({ error: 'Feedback message is required.' }, { status: 400 })
  }

  const requestHeaders = await headers()
  const feedbackRecord = {
    message,
    contactEmail,
    path,
    context,
    href,
    userAgent: submittedUserAgent ?? requestHeaders.get('user-agent') ?? undefined,
    submittedAt: new Date().toISOString(),
  }

  console.log('[pilot-feedback]', JSON.stringify(feedbackRecord))

  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL?.trim()
  if (webhookUrl) {
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackRecord),
      })

      if (!webhookResponse.ok) {
        console.error('[pilot-feedback] webhook forward failed', webhookResponse.status)
      }
    } catch (error) {
      console.error('[pilot-feedback] webhook forward threw', error)
    }
  }

  return NextResponse.json({ ok: true })
}
