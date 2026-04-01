'use client'

import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { IconMatchingQuestion } from '@/lib/types'
import { getMarkLabel } from '@/lib/listening-structure'

function toPascalCase(kebab: string): string {
  return kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function getIcon(name: string): React.ComponentType<LucideProps> {
  const key = toPascalCase(name)
  const icon = (LucideIcons as Record<string, unknown>)[key]
  return (icon != null ? icon : LucideIcons.HelpCircle) as React.ComponentType<LucideProps>
}

interface Props {
  question: IconMatchingQuestion
  markNumber: number
  answer: string
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
}

export function IconMatchingRenderer({ question, markNumber, answer, onAnswerChange, disabled = false }: Props) {
  const cols = question.icons.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-300">
        <span className="font-medium text-zinc-400">{getMarkLabel(markNumber)}.</span> {question.text}
      </p>

      <div className={`grid ${cols} gap-2 mt-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {question.icons.map((icon) => {
          const selected = answer === icon.name
          const IconComponent = getIcon(icon.name)

          return (
            <button
              key={icon.name}
              aria-label={icon.label}
              onClick={() => onAnswerChange(question.id, icon.name)}
              className={`relative overflow-hidden rounded-2xl border flex items-center justify-center min-h-[44px] aspect-square transition-all duration-200 active:scale-[0.99] ${
                selected
                  ? 'border-sky-400/50 bg-gradient-to-br from-sky-400/20 via-sky-500/10 to-zinc-950 shadow-[0_20px_45px_-30px_rgba(56,189,248,0.95)]'
                  : 'border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 hover:border-sky-400/25'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 ${selected ? 'text-white' : 'text-zinc-300'}`}
              />
              <span
                className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full transition-all ${
                  selected
                    ? 'bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.13)]'
                    : 'bg-zinc-600'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
