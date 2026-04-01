'use client'
import type { AnswerResult, TypedListeningQuestion } from '@/lib/types'
import { McqRenderer } from '@/components/listening/McqRenderer'
import { TfngRenderer } from '@/components/listening/TfngRenderer'
import { GapFillRenderer } from '@/components/listening/GapFillRenderer'
import { IconMatchingRenderer } from '@/components/listening/IconMatchingRenderer'
import { PersonAttributionRenderer } from '@/components/listening/PersonAttributionRenderer'
import {
  getMarkLabel,
  getQuestionTypeLabel,
  groupQuestionsIntoMarkBlocks,
} from '@/lib/listening-structure'

interface Props {
  questions: TypedListeningQuestion[]
  answers: Record<string, string>
  onAnswerChange: (id: string, value: string) => void
  disabled?: boolean
  resultsByQuestionId?: Record<string, AnswerResult>
}

export function TypedQuestionPanel({
  questions,
  answers,
  onAnswerChange,
  disabled,
  resultsByQuestionId,
}: Props) {
  const blocks = groupQuestionsIntoMarkBlocks(questions)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Marks</h3>
      {blocks.map((block) => (
        <section key={`${block.type}-${block.startMark}`} className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/70">
              {block.startMark === block.endMark
                ? getMarkLabel(block.startMark)
                : `Marks ${block.startMark}-${block.endMark}`}
            </p>
            <p className="text-xs font-medium text-zinc-400">{getQuestionTypeLabel(block.type)}</p>
          </div>

          {block.type === 'gap-fill' ? (
            <GapFillRenderer
              questions={block.entries
                .filter(
                  (
                    entry
                  ): entry is { question: Extract<TypedListeningQuestion, { type: 'gap-fill' }>; markNumber: number } =>
                    entry.question.type === 'gap-fill'
                )
                .map(({ question, markNumber }) => ({
                  question,
                  markNumber,
                }))}
              answers={answers}
              onAnswerChange={onAnswerChange}
              disabled={disabled}
              resultsByQuestionId={resultsByQuestionId}
            />
          ) : (
            <div className="space-y-4">
              {block.entries.map(({ question, markNumber }, index) => {
                const answer = answers[question.id] ?? ''

                switch (question.type) {
                  case 'mcq':
                    return (
                      <McqRenderer
                        key={question.id}
                        question={question}
                        markNumber={markNumber}
                        answer={answer}
                        onAnswerChange={onAnswerChange}
                        disabled={disabled}
                        result={resultsByQuestionId?.[question.id]}
                      />
                    )
                  case 'true-false-notgiven':
                    return (
                      <TfngRenderer
                        key={question.id}
                        question={question}
                        markNumber={markNumber}
                        answer={answer}
                        onAnswerChange={onAnswerChange}
                        disabled={disabled}
                        result={resultsByQuestionId?.[question.id]}
                      />
                    )
                  case 'gap-fill':
                    return null
                  case 'icon-matching':
                    return (
                      <IconMatchingRenderer
                        key={question.id}
                        question={question}
                        markNumber={markNumber}
                        answer={answer}
                        onAnswerChange={onAnswerChange}
                        disabled={disabled}
                        result={resultsByQuestionId?.[question.id]}
                      />
                    )
                  case 'person-attribution':
                    return (
                      <PersonAttributionRenderer
                        key={question.id}
                        question={question}
                        markNumber={markNumber}
                        answer={answer}
                        onAnswerChange={onAnswerChange}
                        disabled={disabled}
                        showLegend={index === 0}
                        result={resultsByQuestionId?.[question.id]}
                      />
                    )
                }
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
