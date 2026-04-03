import { MODELS, getGroq } from '@/lib/groq'

export type ListeningLlmStage = 'transcript' | 'question-block' | 'repair' | 'verification' | 'answer-check'

interface ListeningLlmStageConfig {
  maxTokens: number
  temperature: number
}

const LISTENING_LLM_STAGE_CONFIG: Record<ListeningLlmStage, ListeningLlmStageConfig> = {
  transcript: {
    maxTokens: 900,
    temperature: 0.4,
  },
  'question-block': {
    maxTokens: 1200,
    temperature: 0.2,
  },
  repair: {
    maxTokens: 1200,
    temperature: 0.1,
  },
  verification: {
    maxTokens: 400,
    temperature: 0,
  },
  'answer-check': {
    maxTokens: 800,
    temperature: 0.3,
  },
}

const PROVIDER_RETRY_DELAYS_MS = [250, 750]

interface UsageSummary {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface ListeningLlmResult {
  text: string
  finishReason?: string | null
  model: string
  usage: UsageSummary
}

interface GenerateListeningTextArgs {
  prompt: string
  stage: ListeningLlmStage
}

interface ProviderTarget {
  provider: 'groq' | 'cerebras'
  model: string
}

interface CerebrasChatCompletionResponse {
  model?: string
  choices?: Array<{
    finish_reason?: string | null
    message?: {
      content?: unknown
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getContentText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }

      if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
        return part.text
      }

      return ''
    })
    .join('')
}

function isRetryableProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const status = 'status' in error && typeof error.status === 'number' ? error.status : null
  if (status === 429 || (status !== null && status >= 500)) {
    return true
  }

  return /timeout|timed out|rate limit|temporar|unavailable|network|fetch failed/i.test(error.message)
}

function getCerebrasApiKey(): string | null {
  const apiKey = process.env.CEREBRAS_API_KEY?.trim()
  return apiKey ? apiKey : null
}

function getListeningProviderTargets(): ProviderTarget[] {
  const targets: ProviderTarget[] = [{ provider: 'groq', model: MODELS.listening }]
  const cerebrasApiKey = getCerebrasApiKey()

  if (!cerebrasApiKey) {
    return targets
  }

  const primaryCerebrasModel = process.env.CEREBRAS_LISTENING_MODEL?.trim() || 'llama3.1-8b'
  const fallbackCerebrasModel = process.env.CEREBRAS_LISTENING_FALLBACK_MODEL?.trim()

  targets.push({ provider: 'cerebras', model: primaryCerebrasModel })

  if (fallbackCerebrasModel && fallbackCerebrasModel !== primaryCerebrasModel) {
    targets.push({ provider: 'cerebras', model: fallbackCerebrasModel })
  }

  return targets
}

export function getListeningProviderDebugInfo() {
  const hasCerebrasApiKey = Boolean(getCerebrasApiKey())
  const configuredTargets = getListeningProviderTargets().map((target) => ({
    provider: target.provider,
    model: target.model,
  }))

  return {
    hasCerebrasApiKey,
    configuredTargets,
    cerebrasPrimaryModel: process.env.CEREBRAS_LISTENING_MODEL?.trim() || 'llama3.1-8b',
    cerebrasFallbackModel: process.env.CEREBRAS_LISTENING_FALLBACK_MODEL?.trim() || null,
  }
}

async function createCerebrasChatCompletion(args: {
  model: string
  prompt: string
  maxTokens: number
  temperature: number
}): Promise<ListeningLlmResult> {
  const apiKey = getCerebrasApiKey()
  if (!apiKey) {
    throw new Error('Cerebras API key is not configured.')
  }

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      messages: [{ role: 'user', content: args.prompt }],
      max_tokens: args.maxTokens,
      temperature: args.temperature,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw Object.assign(
      new Error(errorText || `Cerebras request failed with status ${response.status}`),
      { status: response.status }
    )
  }

  const data = (await response.json()) as CerebrasChatCompletionResponse
  const choice = data.choices?.[0]

  return {
    text: getContentText(choice?.message?.content),
    finishReason: choice?.finish_reason,
    model: data.model ?? args.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  }
}

export function getListeningLlmConfig(stage: ListeningLlmStage): ListeningLlmStageConfig {
  return LISTENING_LLM_STAGE_CONFIG[stage]
}

export async function generateListeningText({
  prompt,
  stage,
}: GenerateListeningTextArgs): Promise<ListeningLlmResult> {
  const config = getListeningLlmConfig(stage)
  let lastError: unknown

  for (const target of getListeningProviderTargets()) {
    for (let providerAttempt = 0; providerAttempt <= PROVIDER_RETRY_DELAYS_MS.length; providerAttempt += 1) {
      try {
        if (target.provider === 'cerebras') {
          return await createCerebrasChatCompletion({
            model: target.model,
            prompt,
            maxTokens: config.maxTokens,
            temperature: config.temperature,
          })
        }

        const response = await getGroq().chat.completions.create({
          model: target.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        })

        const choice = response.choices[0]
        return {
          text: getContentText(choice?.message?.content),
          finishReason: choice?.finish_reason,
          model: response.model ?? target.model,
          usage: {
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens,
          },
        }
      } catch (error) {
        lastError = error
        if (!isRetryableProviderError(error)) {
          throw error
        }

        if (providerAttempt === PROVIDER_RETRY_DELAYS_MS.length) {
          break
        }

        await sleep(PROVIDER_RETRY_DELAYS_MS[providerAttempt])
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Listening LLM request failed.')
}
