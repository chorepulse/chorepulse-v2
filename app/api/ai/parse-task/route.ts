import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseTaskFromNaturalLanguage, validateParsedTask, convertParsedTaskToAPIFormat } from '@/lib/ai/task-parser'
import { isAIEnabled, DEFAULT_MODEL } from '@/lib/openai'

/**
 * POST /api/ai/parse-task
 * Parse natural language task description into structured data
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI features are enabled
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ChorePulse user ID and organization
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get request body
    const body = await request.json()
    const { input } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required and must be a string' },
        { status: 400 }
      )
    }

    // Parse the task
    const { task: parsedTask, usage } = await parseTaskFromNaturalLanguage(input)

    // Log AI usage
    try {
      await adminClient.from('ai_usage_logs').insert({
        user_id: userData.id,
        organization_id: userData.organization_id,
        feature: 'task_parsing',
        model: DEFAULT_MODEL,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        total_tokens: usage.inputTokens + usage.outputTokens,
        estimated_cost: usage.cost,
        request_data: { input },
        response_data: { parsed: parsedTask },
        status: 'success',
      })
    } catch (logError) {
      console.error('Failed to log AI usage:', logError)
      // Don't fail the request if logging fails
    }

    // Validate the parsed task
    const validation = validateParsedTask(parsedTask)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid task data',
          details: validation.errors,
          parsedTask,
        },
        { status: 400 }
      )
    }

    // Convert to API format
    const apiFormat = convertParsedTaskToAPIFormat(parsedTask)

    return NextResponse.json({
      success: true,
      parsed: parsedTask,
      apiFormat,
      confidence: parsedTask.confidence,
      usage: {
        tokens: usage.inputTokens + usage.outputTokens,
        cost: usage.cost,
      },
    })
  } catch (error) {
    console.error('Error parsing task:', error)
    return NextResponse.json(
      { error: 'Failed to parse task' },
      { status: 500 }
    )
  }
}
