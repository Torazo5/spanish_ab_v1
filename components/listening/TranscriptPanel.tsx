'use client'
import { useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'

interface TranscriptPanelProps {
  script: string
  defaultOpen?: boolean
}

export function TranscriptPanel({ script, defaultOpen = false }: TranscriptPanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          {open ? 'Hide transcript' : 'Reveal transcript'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap border-t border-white/10 pt-3">
          {script}
        </div>
      )}
    </div>
  )
}
