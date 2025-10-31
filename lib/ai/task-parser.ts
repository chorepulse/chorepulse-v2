/**
 * Natural Language Task Parser
 *
 * Uses OpenAI to parse natural language task descriptions into structured task data.
 * Examples:
 * - "Clean the bathroom every Tuesday at 3pm" → { name: "Clean the bathroom", recurrence: "weekly", dayOfWeek: 2, time: "15:00" }
 * - "Take out the trash on Mondays and Thursdays" → { name: "Take out the trash", recurrence: "custom", customDays: [1,4] }
 * - "Do laundry tomorrow at 10am worth 50 points" → { name: "Do laundry", dueDate: <tomorrow>, time: "10:00", pointValue: 50 }
 */

import { createCompletion } from '@/lib/openai'

export interface ParsedTask {
  // Basic fields
  name: string
  description?: string
  category?: string

  // Scheduling
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'
  dayOfWeek?: number // 0-6 (Sunday-Saturday)
  dayOfMonth?: number // 1-31
  customDays?: number[] // For custom recurrence
  time?: string // HH:MM format
  dueDate?: string // ISO date string for one-time tasks

  // Assignment
  assignedTo?: string // User name or role

  // Reward
  pointValue?: number

  // Requirements
  photoRequired?: boolean

  // Metadata
  confidence: number // 0-1, how confident the parser is
  originalInput: string
}

const TASK_PARSING_SYSTEM_PROMPT = `You are a helpful assistant that parses natural language task descriptions into structured data for a family chore management app called ChorePulse.

Extract the following information from the user's input:
- **name**: The task name (required)
- **description**: Additional details about the task (optional)
- **category**: Task category - infer from the task name. Options: "cleaning", "cooking", "outdoor", "pet_care", "homework", "organization", "maintenance", "errands", "personal_care", "other"
- **recurrence**: "once", "daily", "weekly", "monthly", or "custom"
- **dayOfWeek**: Day of week as number (0=Sunday, 1=Monday, ... 6=Saturday) for weekly tasks
- **dayOfMonth**: Day of month (1-31) for monthly tasks
- **customDays**: Array of day numbers for custom recurrence (e.g., [1,4] for Monday and Thursday)
- **time**: Time in HH:MM format (24-hour)
- **dueDate**: ISO date string for one-time tasks (use today as reference if not specified)
- **assignedTo**: Name or role of person assigned (e.g., "John", "teenager", "kids")
- **pointValue**: Point reward for completing the task
- **photoRequired**: Whether photo proof is required (true/false)
- **confidence**: Your confidence in the parse (0-1)

Examples:

Input: "Clean the bathroom every Tuesday at 3pm"
Output: {
  "name": "Clean the bathroom",
  "category": "cleaning",
  "recurrence": "weekly",
  "dayOfWeek": 2,
  "time": "15:00",
  "confidence": 0.95
}

Input: "Take out the trash on Mondays and Thursdays"
Output: {
  "name": "Take out the trash",
  "recurrence": "custom",
  "customDays": [1, 4],
  "confidence": 0.9
}

Input: "Do laundry tomorrow at 10am worth 50 points"
Output: {
  "name": "Do laundry",
  "recurrence": "once",
  "dueDate": "2025-10-29",
  "time": "10:00",
  "pointValue": 50,
  "confidence": 0.85
}

Input: "Vacuum the living room daily at 5pm, photo required"
Output: {
  "name": "Vacuum the living room",
  "recurrence": "daily",
  "time": "17:00",
  "photoRequired": true,
  "confidence": 0.9
}

Input: "Make your bed every morning, assign to teenagers"
Output: {
  "name": "Make your bed",
  "recurrence": "daily",
  "assignedTo": "teenager",
  "confidence": 0.85
}

Always respond with valid JSON only. If you're not confident about a field, omit it rather than guessing.`

/**
 * Parse natural language task description into structured data
 */
export async function parseTaskFromNaturalLanguage(input: string): Promise<{
  task: ParsedTask
  usage: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
}> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const result = await createCompletion({
      messages: [
        {
          role: 'system',
          content: TASK_PARSING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Today's date is ${today}. Parse this task: "${input}"`,
        },
      ],
      model: 'gpt-4o-mini',
      temperature: 0.3, // Lower temperature for more consistent parsing
      maxTokens: 500,
      responseFormat: 'json_object',
    })

    const parsed = JSON.parse(result.content) as Partial<ParsedTask>

    // Ensure required fields
    if (!parsed.name) {
      throw new Error('Failed to extract task name')
    }

    // Add original input for reference
    const taskData: ParsedTask = {
      ...parsed,
      name: parsed.name,
      originalInput: input,
      confidence: parsed.confidence || 0.5,
    }

    return {
      task: taskData,
      usage: result.usage,
    }
  } catch (error) {
    console.error('Task parsing error:', error)

    // Fallback: return basic task with low confidence
    return {
      task: {
        name: input,
        originalInput: input,
        confidence: 0.1,
      },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      },
    }
  }
}

/**
 * Validate parsed task data
 */
export function validateParsedTask(task: ParsedTask): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate name
  if (!task.name || task.name.trim().length === 0) {
    errors.push('Task name is required')
  }

  // Validate day of week
  if (task.dayOfWeek !== undefined && (task.dayOfWeek < 0 || task.dayOfWeek > 6)) {
    errors.push('Day of week must be between 0 (Sunday) and 6 (Saturday)')
  }

  // Validate day of month
  if (task.dayOfMonth !== undefined && (task.dayOfMonth < 1 || task.dayOfMonth > 31)) {
    errors.push('Day of month must be between 1 and 31')
  }

  // Validate time format
  if (task.time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(task.time)) {
    errors.push('Time must be in HH:MM format (24-hour)')
  }

  // Validate point value
  if (task.pointValue !== undefined && task.pointValue < 0) {
    errors.push('Point value must be non-negative')
  }

  // Validate confidence
  if (task.confidence < 0 || task.confidence > 1) {
    errors.push('Confidence must be between 0 and 1')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Convert parsed task to format expected by task creation API
 */
export function convertParsedTaskToAPIFormat(parsed: ParsedTask) {
  const apiTask: any = {
    name: parsed.name,
    description: parsed.description || '',
    recurrence_type: parsed.recurrence || 'once',
    point_value: parsed.pointValue || 10,
    photo_required: parsed.photoRequired || false,
  }

  // Add scheduling fields based on recurrence type
  if (parsed.recurrence === 'weekly' && parsed.dayOfWeek !== undefined) {
    apiTask.day_of_week = parsed.dayOfWeek
  }

  if (parsed.recurrence === 'monthly' && parsed.dayOfMonth !== undefined) {
    apiTask.day_of_month = parsed.dayOfMonth
  }

  if (parsed.recurrence === 'custom' && parsed.customDays) {
    apiTask.custom_days = parsed.customDays
  }

  if (parsed.time) {
    apiTask.time = parsed.time
  }

  if (parsed.dueDate) {
    apiTask.due_date = parsed.dueDate
  }

  return apiTask
}
