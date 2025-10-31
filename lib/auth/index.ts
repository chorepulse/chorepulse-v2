import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user',
      }
    }

    return {
      success: true,
      user: authData.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during sign up',
    }
  }
}

/**
 * Sign in an existing user with email and password
 * Allows 7-day grace period for email confirmation
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    // Check if error is due to email not confirmed
    if (error && error.message.includes('Email not confirmed')) {
      // Get user to check signup date
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('email', data.email)
        .single()

      if (userData) {
        const signupDate = new Date(userData.created_at)
        const today = new Date()
        const daysSinceSignup = Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

        // If within 7-day grace period, bypass email confirmation
        if (daysSinceSignup <= 7) {
          // Use admin auth to sign in without email confirmation
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
            options: {
              emailRedirectTo: undefined,
            }
          })

          // If still failing, return helpful message
          if (sessionError) {
            return {
              success: false,
              error: `Your account was created ${daysSinceSignup} days ago. Please check your email to confirm your account, or wait up to 7 days for automatic access.`,
            }
          }
        } else {
          return {
            success: false,
            error: 'Please confirm your email address. Check your inbox for the confirmation link.',
          }
        }
      }

      return {
        success: false,
        error: error.message,
      }
    }

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to sign in',
      }
    }

    return {
      success: true,
      user: authData.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during sign in',
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during sign out',
    }
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return null
    }

    return data.session
  } catch (error) {
    return null
  }
}

/**
 * Get the current user
 */
export async function getUser() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return null
    }

    return data.user
  } catch (error) {
    return null
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    }
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    }
  }
}
