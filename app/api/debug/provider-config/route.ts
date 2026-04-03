import { NextResponse } from 'next/server'

import { getListeningProviderDebugInfo } from '@/lib/listening-llm'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET() {
  return NextResponse.json({
    ok: true,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    listening: getListeningProviderDebugInfo(),
  })
}
