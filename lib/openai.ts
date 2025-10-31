/**
 * OpenAI Client Configuration
 *
 * Centralized OpenAI client for all AI features including:
 * - Natural language task parsing
 * - Smart task suggestions
 * - Pulse AI meal planning
 */

import OpenAI from 'openai'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Default model from environment or fallback
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Cost tracking (approximate costs per 1K tokens)
export const MODEL_COSTS = {
  'gpt-4o-mini': {
    input: 0.00015,  // $0.150 per 1M tokens
    output: 0.0006,  // $0.600 per 1M tokens
  },
  'gpt-4o': {
    input: 0.0025,   // $2.50 per 1M tokens
    output: 0.01,    // $10.00 per 1M tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0005,   // $0.50 per 1M tokens
    output: 0.0015,  // $1.50 per 1M tokens
  },
}

/**
 * Calculate approximate cost for a completion
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS['gpt-4o-mini']
  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return (
    !!process.env.OPENAI_API_KEY &&
    process.env.NEXT_PUBLIC_FEATURE_AI_ENABLED === 'true'
  )
}

/**
 * Wrapper for OpenAI completions with error handling and cost tracking
 */
export async function createCompletion(params: {
  messages: OpenAI.ChatCompletionMessageParam[]
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}): Promise<{
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
}> {
  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 1000,
    responseFormat = 'text',
  } = params

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    })

    const content = completion.choices[0]?.message?.content || ''
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0 }

    return {
      content,
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        cost: calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
      },
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate AI completion')
  }
}
