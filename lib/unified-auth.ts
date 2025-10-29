import { NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

export type AuthContext = 'server' | 'client' | 'api'

export interface AuthResult {
  user: any | null
  error: string | null
}

/**
 * Resolve auth for server/api/client contexts.
 * - Uses server cookie-based Supabase client when available
 * - Falls back to Authorization: Bearer <token> when provided
 */
export async function resolveAuth(
  request?: NextRequest,
  context: AuthContext = 'server'
): Promise<AuthResult> {
  // Server/API context: use server client which reads cookies
  if (context === 'server' || context === 'api') {
    try {
      const supabase = await createServerClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        return { user, error: null }
      }
    } catch (e) {
      // continue to fallback
    }

    // Fallback: Authorization header Bearer token
    if (request) {
      const authHeader = request.headers.get('authorization') || ''
      const match = authHeader.match(/^Bearer\s+(.+)$/i)
      if (match) {
        const token = match[1]
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
              }
            }
          )

          if (res.ok) {
            const user = await res.json()
            return { user, error: null }
          }
        } catch (e) {
          // ignore and return unauthorized below
        }
      }
    }

    return { user: null, error: 'Unauthorized' }
  }

  // Client-side auth: use browser client
  if (context === 'client') {
    try {
      const supabase = createBrowserClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        return { user, error: null }
      }
    } catch (e) {
      // continue to error
    }

    return { user: null, error: 'Unauthorized' }
  }

  return { user: null, error: 'Invalid context' }
}

/**
 * Get authenticated server client and user (null if unauthenticated)
 */
export async function getAuthenticatedServerClient(request?: NextRequest) {
  const { user, error } = await resolveAuth(request, 'server')
  if (error || !user) {
    return { client: null, user: null, error }
  }

  const client = await createServerClient()
  return { client, user, error: null }
}

/**
 * Require auth in API handlers. Throws an error when unauthenticated.
 */
export async function requireAuth(request: NextRequest): Promise<any> {
  const result = await resolveAuth(request, 'api')
  if (!result.user) {
    throw new Error(result.error || 'Unauthorized')
  }
  return result.user
}
