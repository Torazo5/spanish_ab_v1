'use client'

import { useState, useSyncExternalStore } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'spanish-practice-maintenance-notice-v1'

function subscribeToStorage() {
  return () => {}
}

function hasDismissedNotice() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dismissed'
  } catch {
    return false
  }
}

function wasNotDismissedOnServer() {
  return false
}

export function MaintenanceNotice() {
  const [dismissedThisVisit, setDismissedThisVisit] = useState(false)
  const hasDismissed = useSyncExternalStore(
    subscribeToStorage,
    hasDismissedNotice,
    wasNotDismissedOnServer
  )

  function dismissNotice() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'dismissed')
    } catch {
      // The in-memory state still prevents a repeat during this visit.
    }
    setDismissedThisVisit(true)
  }

  if (hasDismissed || dismissedThisVisit) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-notice-title"
        className="relative w-full max-w-sm rounded-2xl border border-amber-300/20 bg-zinc-950 p-6 text-white shadow-2xl"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3 text-zinc-400 hover:text-white"
          onClick={dismissNotice}
          aria-label="Close maintenance notice"
        >
          <X className="h-4 w-4" />
        </Button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Quick note
        </p>
        <h2 id="maintenance-notice-title" className="mt-2 text-lg font-semibold">
          Sorry for the maintenance — everything is working now.
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Send us any advice through Feedback, and tell your friends about Spanish Practice.
        </p>
        <Button
          type="button"
          className="mt-5 w-full bg-amber-300 text-zinc-950 hover:bg-amber-200"
          onClick={dismissNotice}
        >
          Got it
        </Button>
      </section>
    </div>
  )
}
