import { NextResponse } from 'next/server'

export const PROTOTYPE_CAPACITY_MESSAGE =
  'We hit our current usage limit. Sorry, this is still a prototype. Please try again a bit later.'

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  if ('response' in error && typeof error.response === 'object' && error.response !== null) {
    const response = error.response as { status?: unknown }
    if (typeof response.status === 'number') {
      return response.status
    }
  }

  return null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return ''
}

export function isCapacityError(error: unknown): boolean {
  const status = getErrorStatus(error)
  if (status === 429 || status === 529) {
    return true
  }

  const message = getErrorMessage(error)
  return /rate limit|too many requests|capacity|quota|overloaded|resource exhausted/i.test(message)
}

export function getPrototypeCapacityMessage(error: unknown, fallback: string): string {
  return isCapacityError(error) ? PROTOTYPE_CAPACITY_MESSAGE : fallback
}

export function getPrototypeCapacityStatus(error: unknown, fallbackStatus = 500): number {
  return isCapacityError(error) ? 429 : fallbackStatus
}

export function jsonErrorResponse(error: unknown, fallbackMessage: string, fallbackStatus = 500) {
  const message = getPrototypeCapacityMessage(error, fallbackMessage)
  const status = getPrototypeCapacityStatus(error, fallbackStatus)
  return NextResponse.json({ error: message }, { status })
}

export function textErrorResponse(error: unknown, fallbackMessage: string, fallbackStatus = 500) {
  const message = getPrototypeCapacityMessage(error, fallbackMessage)
  const status = getPrototypeCapacityStatus(error, fallbackStatus)
  return new Response(message, { status })
}
