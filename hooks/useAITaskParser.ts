import { useState } from 'react'

export interface ParsedTaskData {
  name: string
  description?: string
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'
  dayOfWeek?: number
  dayOfMonth?: number
  customDays?: number[]
  time?: string
  dueDate?: string
  assignedTo?: string
  pointValue?: number
  photoRequired?: boolean
  confidence: number
}

export interface ParseResult {
  success: boolean
  parsed?: ParsedTaskData
  apiFormat?: any
  confidence?: number
  usage?: {
    tokens: number
    cost: number
  }
  error?: string
}

export function useAITaskParser() {
  const [isParsing, setIsParsing] = useState(false)
  const [lastParsed, setLastParsed] = useState<ParseResult | null>(null)

  const parseTask = async (input: string): Promise<ParseResult> => {
    if (!input || input.trim().length === 0) {
      return {
        success: false,
        error: 'Input is required',
      }
    }

    setIsParsing(true)

    try {
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      })

      const data = await response.json()

      if (!response.ok) {
        const result: ParseResult = {
          success: false,
          error: data.error || 'Failed to parse task',
        }
        setLastParsed(result)
        return result
      }

      const result: ParseResult = {
        success: true,
        parsed: data.parsed,
        apiFormat: data.apiFormat,
        confidence: data.confidence,
        usage: data.usage,
      }

      setLastParsed(result)
      return result
    } catch (error) {
      console.error('Error parsing task:', error)
      const result: ParseResult = {
        success: false,
        error: 'Network error while parsing task',
      }
      setLastParsed(result)
      return result
    } finally {
      setIsParsing(false)
    }
  }

  return {
    parseTask,
    isParsing,
    lastParsed,
  }
}
