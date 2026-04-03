import { randomUUID } from 'crypto'
import { parseJsonFromLlm } from '@/lib/llm-json'
import type {
  ListeningGenerationMode,
  ListeningQuestionBlockPayload,
  ListeningQuestionBlockSpec,
  ListeningTranscriptPayload,
} from '@/lib/listening-generator-contracts'
import { normalizeListeningQuestionDrafts } from '@/lib/listening-generator-contracts'
import { generateListeningText } from '@/lib/listening-llm'
import { getListeningBlockPlan, getListeningQuestionTypePlan } from '@/lib/listening-structure'
import {
  generateQuestionBlockPrompt,
  generateQuestionBlockRepairPrompt,
  generateTranscriptPrompt,
  generateTranscriptRepairPrompt,
  verifySequentialQuestionBlockPrompt,
} from '@/lib/prompts/listening'
import {
  validateGeneratedListeningScript,
  validateListeningQuestionBlock,
  validateListeningTranscript,
} from '@/lib/listening-validation'
import type {
  IbTopic,
  ListeningQuestionBlockMetadata,
  TypedListeningQuestion,
  TypedListeningScript,
} from '@/lib/types'

type ListeningGenerationStage = 'request' | 'transcript' | 'question-block' | 'repair' | 'assembly'

const TRANSCRIPT_MAX_ATTEMPTS = 2
const BLOCK_MAX_ATTEMPTS = 2
const MAX_ERROR_DETAILS = 8
const MAX_LOG_PREVIEW_LENGTH = 180

export interface GenerateListeningScriptArgs {
  topic: IbTopic
  marks: number
  mode?: ListeningGenerationMode
}

interface ListeningLogEvent {
  requestId: string
  stage: ListeningGenerationStage
  status: 'started' | 'success' | 'failed'
  attempt?: number
  blockIndex?: number
  questionType?: string
  topic?: IbTopic
  marks?: number
  mode?: ListeningGenerationMode
  validationErrorCount?: number
  providerModel?: string
  finishReason?: string | null
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  details?: string[]
  preview?: string
}

export class ListeningGenerationError extends Error {
  readonly requestId: string
  readonly stage: ListeningGenerationStage
  readonly details: string[]

  constructor(message: string, options: { requestId: string; stage: ListeningGenerationStage; details: string[] }) {
    super(message)
    this.name = 'ListeningGenerationError'
    this.requestId = options.requestId
    this.stage = options.stage
    this.details = compactDetails(options.details)
  }
}

function isVerboseListeningLoggingEnabled(): boolean {
  const debugFlag = process.env.DEBUG ?? ''
  return process.env.NODE_ENV !== 'production' || debugFlag.includes('listening') || debugFlag === '*'
}

function compactDetails(details: string[]): string[] {
  return details
    .map((detail) => detail.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, MAX_ERROR_DETAILS)
    .map((detail) => (detail.length > 220 ? `${detail.slice(0, 217)}...` : detail))
}

function getPreview(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_LOG_PREVIEW_LENGTH)
}

function logListeningEvent(event: ListeningLogEvent, options?: { verboseOnly?: boolean }) {
  if (options?.verboseOnly && !isVerboseListeningLoggingEnabled()) {
    return
  }

  const payload = {
    scope: 'listening-generation',
    ...event,
  }

  const output = JSON.stringify(payload)

  if (event.status === 'failed') {
    console.error(output)
    return
  }

  console.info(output)
}

function isSequentialVerifierEnabled(): boolean {
  return process.env.LISTENING_ENABLE_SEQUENTIAL_VERIFIER === '1'
}

function splitIntoSentences(script: string): string[] {
  const sentences = script.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [script]
  return sentences.map((sentence) => sentence.trim()).filter(Boolean)
}

function chunkEvenly(parts: string[], chunkCount: number): string[] {
  if (chunkCount <= 1) {
    return [parts.join(' ').trim()].filter(Boolean)
  }

  return Array.from({ length: chunkCount }, (_, index) => {
    const start = Math.floor((index * parts.length) / chunkCount)
    const end = Math.floor(((index + 1) * parts.length) / chunkCount)
    return parts.slice(start, end).join(' ').trim()
  }).filter(Boolean)
}

function splitTranscriptIntoParagraphs(script: string): string[] {
  return script
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function buildSourceParagraphs(script: string, blockCount: number): Array<string | undefined> {
  const trimmed = script.trim()
  if (trimmed === '') {
    return Array.from({ length: blockCount }, () => undefined)
  }

  const paragraphs = splitTranscriptIntoParagraphs(trimmed)

  const paragraphSegments =
    paragraphs.length >= blockCount ? chunkEvenly(paragraphs, blockCount) : chunkEvenly(splitIntoSentences(trimmed), blockCount)

  return Array.from({ length: blockCount }, (_, index) => paragraphSegments[index] ?? trimmed)
}

function buildQuestionBlockSpecs(
  transcript: ListeningTranscriptPayload,
  marks: number,
  mode: ListeningGenerationMode
): ListeningQuestionBlockSpec[] {
  const blockPlan = getListeningBlockPlan(marks)
  const typePlan = getListeningQuestionTypePlan(marks)
  const transcriptParagraphs = splitTranscriptIntoParagraphs(transcript.script)
  const sourceParagraphs =
    mode === 'sequential'
      ? transcriptParagraphs
      : buildSourceParagraphs(transcript.script, blockPlan.length)
  let questionStartMark = 1

  return blockPlan.map((count, blockIndex) => {
    const spec: ListeningQuestionBlockSpec = {
      blockIndex,
      count,
      type: typePlan[blockIndex],
      questionStartMark,
      mode,
      sourceParagraph: mode === 'sequential' ? blockIndex + 1 : undefined,
      sourceText: sourceParagraphs[blockIndex],
      transcriptParagraphCount: transcriptParagraphs.length,
    }

    questionStartMark += count
    return spec
  })
}

function buildQuestionBlockMetadata(blockSpecs: ListeningQuestionBlockSpec[]): ListeningQuestionBlockMetadata[] {
  return blockSpecs.map((blockSpec) => ({
    type: blockSpec.type,
    startMark: blockSpec.questionStartMark,
    endMark: blockSpec.questionStartMark + blockSpec.count - 1,
    sourceParagraph: blockSpec.sourceParagraph,
  }))
}

interface SequentialVerificationResult {
  valid: boolean
  issues: string[]
}

function getQuestionVerificationShape(question: TypedListeningQuestion): {
  type: typeof question.type
  text: string
  sentence?: string
  options?: string[]
} {
  switch (question.type) {
    case 'gap-fill':
      return {
        type: question.type,
        text: question.text,
        sentence: question.sentence,
      }
    case 'mcq':
      return {
        type: question.type,
        text: question.text,
        options: question.options,
      }
    default:
      return {
        type: question.type,
        text: question.text,
      }
  }
}

async function verifySequentialQuestionBlock(args: {
  requestId: string
  transcript: ListeningTranscriptPayload
  blockSpec: ListeningQuestionBlockSpec
  questions: TypedListeningQuestion[]
}): Promise<SequentialVerificationResult | null> {
  if (
    !isSequentialVerifierEnabled() ||
    args.blockSpec.mode !== 'sequential' ||
    !Number.isInteger(args.blockSpec.sourceParagraph) ||
    !args.blockSpec.sourceText
  ) {
    return null
  }

  const paragraphNumber = args.blockSpec.sourceParagraph as number

  try {
    const response = await generateListeningText({
      prompt: verifySequentialQuestionBlockPrompt({
        transcript: args.transcript.script,
        paragraphNumber,
        paragraphText: args.blockSpec.sourceText,
        questions: args.questions.map(getQuestionVerificationShape),
      }),
      stage: 'verification',
    })

    if (response.finishReason === 'length') {
      return null
    }

    const parsed = parseJsonFromLlm<SequentialVerificationResult>(response.text)
    if ('error' in parsed) {
      return null
    }

    if (typeof parsed.data.valid !== 'boolean') {
      return null
    }

    return {
      valid: parsed.data.valid,
      issues:
        Array.isArray(parsed.data.issues) && parsed.data.issues.every((issue) => typeof issue === 'string')
          ? parsed.data.issues
          : [],
    }
  } catch (error) {
    logListeningEvent(
      {
        requestId: args.requestId,
        stage: 'repair',
        status: 'failed',
        blockIndex: args.blockSpec.blockIndex,
        questionType: args.blockSpec.type,
        validationErrorCount: 1,
        details: [
          `Sequential verifier request failed: ${error instanceof Error ? error.message : 'unknown verification error'}`,
        ],
      },
      { verboseOnly: true }
    )

    return null
  }
}

async function generateTranscript(args: {
  topic: IbTopic
  marks: number
  mode: ListeningGenerationMode
  requestId: string
}): Promise<ListeningTranscriptPayload> {
  let lastErrors: string[] = ['Transcript generation did not complete.']
  let previousResponse = ''

  for (let attempt = 1; attempt <= TRANSCRIPT_MAX_ATTEMPTS; attempt += 1) {
    logListeningEvent(
      {
        requestId: args.requestId,
        stage: 'transcript',
        status: 'started',
        attempt,
        topic: args.topic,
        marks: args.marks,
        mode: args.mode,
      },
      { verboseOnly: true }
    )

    try {
      const response = await generateListeningText({
        prompt:
          attempt === 1
            ? generateTranscriptPrompt(args.topic, args.marks, args.mode)
            : generateTranscriptRepairPrompt(args.topic, args.marks, args.mode, previousResponse, lastErrors),
        stage: attempt === 1 ? 'transcript' : 'repair',
      })
      previousResponse = response.text

      if (response.finishReason === 'length') {
        lastErrors = ['Transcript response was truncated by the model token limit.']
        logListeningEvent(
          {
            requestId: args.requestId,
            stage: 'transcript',
            status: 'failed',
            attempt,
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            validationErrorCount: lastErrors.length,
            providerModel: response.model,
            finishReason: response.finishReason,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
            details: compactDetails(lastErrors),
          },
          { verboseOnly: true }
        )
        continue
      }

      const parsed = parseJsonFromLlm<ListeningTranscriptPayload>(response.text)
      if ('error' in parsed) {
        lastErrors = [`Transcript response was not valid JSON: ${parsed.error}`]
        logListeningEvent(
          {
            requestId: args.requestId,
            stage: 'transcript',
            status: 'failed',
            attempt,
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            validationErrorCount: lastErrors.length,
            providerModel: response.model,
            finishReason: response.finishReason,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
            details: compactDetails(lastErrors),
            preview: isVerboseListeningLoggingEnabled() ? getPreview(response.text) : undefined,
          },
          { verboseOnly: true }
        )
        continue
      }

      const validationErrors = validateListeningTranscript(parsed.data, {
        expectedMarks: args.marks,
        mode: args.mode,
      })
      if (validationErrors.length === 0) {
        logListeningEvent(
          {
            requestId: args.requestId,
            stage: 'transcript',
            status: 'success',
            attempt,
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            validationErrorCount: 0,
            providerModel: response.model,
            finishReason: response.finishReason,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          },
          { verboseOnly: true }
        )

        return {
          title: parsed.data.title.trim(),
          script: parsed.data.script.trim(),
        }
      }

      lastErrors = validationErrors
      logListeningEvent(
        {
          requestId: args.requestId,
          stage: 'transcript',
          status: 'failed',
          attempt,
          topic: args.topic,
          marks: args.marks,
          mode: args.mode,
          validationErrorCount: validationErrors.length,
          providerModel: response.model,
          finishReason: response.finishReason,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          details: compactDetails(validationErrors),
        },
        { verboseOnly: true }
      )
    } catch (error) {
      lastErrors = [error instanceof Error ? error.message : 'Transcript LLM request failed.']
      logListeningEvent(
        {
          requestId: args.requestId,
          stage: 'transcript',
          status: 'failed',
          attempt,
          topic: args.topic,
          marks: args.marks,
          mode: args.mode,
          validationErrorCount: lastErrors.length,
          details: compactDetails(lastErrors),
        },
        { verboseOnly: true }
      )
    }
  }

  throw new ListeningGenerationError('Failed to generate a valid listening transcript.', {
    requestId: args.requestId,
    stage: 'transcript',
    details: lastErrors,
  })
}

async function generateQuestionBlock(args: {
  topic: IbTopic
  marks: number
  mode: ListeningGenerationMode
  requestId: string
  transcript: ListeningTranscriptPayload
  blockSpec: ListeningQuestionBlockSpec
}): Promise<TypedListeningQuestion[]> {
  let lastErrors: string[] = [`Block ${args.blockSpec.blockIndex + 1} generation did not complete.`]
  let previousResponse = ''

  for (let attempt = 1; attempt <= BLOCK_MAX_ATTEMPTS; attempt += 1) {
    const stage: ListeningGenerationStage = attempt === 1 ? 'question-block' : 'repair'
    logListeningEvent(
      {
        requestId: args.requestId,
        stage,
        status: 'started',
        attempt,
        blockIndex: args.blockSpec.blockIndex,
        questionType: args.blockSpec.type,
        topic: args.topic,
        marks: args.marks,
        mode: args.mode,
      },
      { verboseOnly: true }
    )

    const prompt =
      stage === 'question-block'
        ? generateQuestionBlockPrompt({
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            transcript: args.transcript,
            blockSpec: args.blockSpec,
          })
        : generateQuestionBlockRepairPrompt({
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            transcript: args.transcript,
            blockSpec: args.blockSpec,
            previousResponse,
            validationErrors: lastErrors,
          })

    try {
      const response = await generateListeningText({
        prompt,
        stage: stage === 'question-block' ? 'question-block' : 'repair',
      })
      previousResponse = response.text

      if (response.finishReason === 'length') {
        lastErrors = [`Block ${args.blockSpec.blockIndex + 1} response was truncated by the model token limit.`]
        logListeningEvent(
          {
            requestId: args.requestId,
            stage,
            status: 'failed',
            attempt,
            blockIndex: args.blockSpec.blockIndex,
            questionType: args.blockSpec.type,
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            validationErrorCount: lastErrors.length,
            providerModel: response.model,
            finishReason: response.finishReason,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
            details: compactDetails(lastErrors),
          },
          { verboseOnly: true }
        )
        continue
      }

      const parsed = parseJsonFromLlm<ListeningQuestionBlockPayload>(response.text)
      if ('error' in parsed) {
        lastErrors = [`Block ${args.blockSpec.blockIndex + 1} response was not valid JSON: ${parsed.error}`]
        logListeningEvent(
          {
            requestId: args.requestId,
            stage,
            status: 'failed',
            attempt,
            blockIndex: args.blockSpec.blockIndex,
            questionType: args.blockSpec.type,
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            validationErrorCount: lastErrors.length,
            providerModel: response.model,
            finishReason: response.finishReason,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
            details: compactDetails(lastErrors),
            preview: isVerboseListeningLoggingEnabled() ? getPreview(response.text) : undefined,
          },
          { verboseOnly: true }
        )
        continue
      }

      const questions = normalizeListeningQuestionDrafts(parsed.data.questions ?? [], args.blockSpec.questionStartMark)
      const validationErrors = validateListeningQuestionBlock(questions, args.blockSpec, {
        sourceParagraph: parsed.data.sourceParagraph,
      })
      if (validationErrors.length === 0) {
        const verificationResult = await verifySequentialQuestionBlock({
          requestId: args.requestId,
          transcript: args.transcript,
          blockSpec: args.blockSpec,
          questions,
        })

        if (verificationResult && !verificationResult.valid) {
          lastErrors =
            verificationResult.issues.length > 0
              ? verificationResult.issues.map(
                  (issue) => `Block ${args.blockSpec.blockIndex + 1} failed sequential verification: ${issue}`
                )
              : [`Block ${args.blockSpec.blockIndex + 1} failed sequential verification.`]
          logListeningEvent(
            {
              requestId: args.requestId,
              stage,
              status: 'failed',
              attempt,
              blockIndex: args.blockSpec.blockIndex,
              questionType: args.blockSpec.type,
              topic: args.topic,
              marks: args.marks,
              mode: args.mode,
              validationErrorCount: lastErrors.length,
              details: compactDetails(lastErrors),
            },
            { verboseOnly: true }
          )
          continue
        }

        logListeningEvent(
          {
            requestId: args.requestId,
            stage,
            status: 'success',
            attempt,
            blockIndex: args.blockSpec.blockIndex,
            questionType: args.blockSpec.type,
            topic: args.topic,
            marks: args.marks,
            mode: args.mode,
            validationErrorCount: 0,
            providerModel: response.model,
            finishReason: response.finishReason,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          },
          { verboseOnly: true }
        )

        return questions
      }

      lastErrors = validationErrors
      logListeningEvent(
        {
          requestId: args.requestId,
          stage,
          status: 'failed',
          attempt,
          blockIndex: args.blockSpec.blockIndex,
          questionType: args.blockSpec.type,
          topic: args.topic,
          marks: args.marks,
          mode: args.mode,
          validationErrorCount: validationErrors.length,
          providerModel: response.model,
          finishReason: response.finishReason,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          details: compactDetails(validationErrors),
        },
        { verboseOnly: true }
      )
    } catch (error) {
      lastErrors = [
        `Block ${args.blockSpec.blockIndex + 1} request failed: ${
          error instanceof Error ? error.message : 'unknown LLM request error'
        }`,
      ]
      logListeningEvent(
        {
          requestId: args.requestId,
          stage,
          status: 'failed',
          attempt,
          blockIndex: args.blockSpec.blockIndex,
          questionType: args.blockSpec.type,
          topic: args.topic,
          marks: args.marks,
          mode: args.mode,
          validationErrorCount: lastErrors.length,
          details: compactDetails(lastErrors),
        },
        { verboseOnly: true }
      )
    }
  }

  throw new ListeningGenerationError('Failed to generate a valid listening question block.', {
    requestId: args.requestId,
    stage: 'repair',
    details: lastErrors,
  })
}

export async function generateListeningScript({
  topic,
  marks,
  mode = 'general',
}: GenerateListeningScriptArgs): Promise<TypedListeningScript> {
  const requestId = randomUUID()

  logListeningEvent({
    requestId,
    stage: 'request',
    status: 'started',
    topic,
    marks,
    mode,
  })

  try {
    const transcript = await generateTranscript({ topic, marks, mode, requestId })
    const blockSpecs = buildQuestionBlockSpecs(transcript, marks, mode)
    const questionBlocks = buildQuestionBlockMetadata(blockSpecs)
    const questions: TypedListeningQuestion[] = []

    for (const blockSpec of blockSpecs) {
      const blockQuestions = await generateQuestionBlock({
        topic,
        marks,
        mode,
        requestId,
        transcript,
        blockSpec,
      })
      questions.push(...blockQuestions)
    }

    const result: TypedListeningScript = {
      title: transcript.title,
      script: transcript.script,
      totalMarks: marks,
      mode,
      questions,
      questionBlocks,
    }

    const finalErrors = validateGeneratedListeningScript(result, marks, { mode })
    if (finalErrors.length > 0) {
      throw new ListeningGenerationError('Generated listening exercise failed final validation.', {
        requestId,
        stage: 'assembly',
        details: finalErrors,
      })
    }

    logListeningEvent({
      requestId,
      stage: 'assembly',
      status: 'success',
      topic,
      marks,
      mode,
      validationErrorCount: 0,
      details: [`blocks=${blockSpecs.length}`, `questions=${questions.length}`],
    })

    return result
  } catch (error) {
    const wrappedError =
      error instanceof ListeningGenerationError
        ? error
        : new ListeningGenerationError('Listening generation failed unexpectedly.', {
            requestId,
            stage: 'assembly',
            details: [error instanceof Error ? error.message : 'Unknown listening generation error.'],
          })

    logListeningEvent({
      requestId: wrappedError.requestId,
      stage: wrappedError.stage,
      status: 'failed',
      topic,
      marks,
      mode,
      validationErrorCount: wrappedError.details.length,
      details: wrappedError.details,
    })

    throw wrappedError
  }
}
