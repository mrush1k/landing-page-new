/**
 * Unified Session Management
 * Centralizes all session handling, token refresh, and cookie management
 */

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { User, Session } from '@supabase/supabase-js'

// Session cache for server-side (prevents repeated Supabase calls)
const sessionCache = new Map<string, { session: Session | null; timestamp: number }>()
const SESSION_CACHE_TTL = 60000 // 1 minute

/**
 * Get session with caching for server context
 */
export async function getServerSession(request?: NextRequest): Promise<{
  session: Session | null
  user: User | null
}> {
  const supabase = await createServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Session fetch error:', error)
    return { session: null, user: null }
  }

  return { session, user: session?.user || null }
}

/**
 * Refresh session if expired or about to expire
 */
export async function refreshSessionIfNeeded(session: Session | null): Promise<Session | null> {
  if (!session) return null

  const expiresAt = session.expires_at || 0
  const now = Math.floor(Date.now() / 1000)
  const bufferTime = 5 * 60 // 5 minutes

  // Session still valid
  if (expiresAt - now > bufferTime) {
    return session
  }

  // Need to refresh
  try {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Session refresh failed:', error)
      return null
    }

    return data.session
  } catch (error) {
    console.error('Session refresh error:', error)
    return null
  }
}

/**
 * Extract user ID from JWT without Supabase client (fastest)
 */
export function extractUserIdFromJWT(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    return payload.sub || null
  } catch {
    return null
  }
}

/**
 * Validate session and return user
 */
export async function validateSession(): Promise<User | null> {
  const { user } = await getServerSession()
  return user
}
