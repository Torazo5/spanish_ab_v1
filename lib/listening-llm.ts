import { MODELS, getGroq } from '@/lib/groq'

export type ListeningLlmStage = 'transcript' | 'question-block' | 'repair' | 'verification'

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

export function getListeningLlmConfig(stage: ListeningLlmStage): ListeningLlmStageConfig {
  return LISTENING_LLM_STAGE_CONFIG[stage]
}

export async function generateListeningText({
  prompt,
  stage,
}: GenerateListeningTextArgs): Promise<ListeningLlmResult> {
  const config = getListeningLlmConfig(stage)
  let lastError: unknown

  for (let providerAttempt = 0; providerAttempt <= PROVIDER_RETRY_DELAYS_MS.length; providerAttempt += 1) {
    try {
      const response = await getGroq().chat.completions.create({
        model: MODELS.listening,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      })

      const choice = response.choices[0]
      return {
        text: getContentText(choice?.message?.content),
        finishReason: choice?.finish_reason,
        model: response.model ?? MODELS.listening,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
      }
    } catch (error) {
      lastError = error
      if (providerAttempt === PROVIDER_RETRY_DELAYS_MS.length || !isRetryableProviderError(error)) {
        throw error
      }

      await sleep(PROVIDER_RETRY_DELAYS_MS[providerAttempt])
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Listening LLM request failed.')
}
