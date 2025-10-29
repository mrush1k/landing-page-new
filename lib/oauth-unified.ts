/**
 * Unified OAuth Provider Integration
 * Eliminates provider-specific code duplication
 */

import { createClient } from '@/utils/supabase/client'

export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'apple'

interface OAuthConfig {
  provider: OAuthProvider
  scopes?: string[]
  redirectTo?: string
}

/**
 * Universal OAuth sign-in
 */
export async function signInWithOAuth({ provider, scopes, redirectTo }: OAuthConfig) {
  const supabase = createClient()
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  // Build callback URL with 'next' parameter for final destination
  const finalDestination = redirectTo || '/dashboard'
  const callbackUrl = `${baseUrl}/auth/callback?next=${encodeURIComponent(finalDestination)}`

  // Map provider names to Supabase provider names
  const providerMap: Record<OAuthProvider, any> = {
    'google': 'google',
    'microsoft': 'azure', // Microsoft is 'azure' in Supabase
    'apple': 'apple',
    'github': 'github'
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: providerMap[provider],
    options: {
      redirectTo: callbackUrl,
      scopes: scopes?.join(' '),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })

  if (error) {
    console.error(`OAuth ${provider} error:`, error)
    return { url: null, error }
  }

  return { url: data.url, error: null }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback() {
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('OAuth callback error:', error)
    return { user: null, error }
  }

  return { user: session?.user || null, error: null }
}

/**
 * Link OAuth provider to existing account
 */
export async function linkOAuthProvider(provider: OAuthProvider) {
  const supabase = createClient()
  
  const providerMap: Record<OAuthProvider, any> = {
    'google': 'google',
    'microsoft': 'azure',
    'apple': 'apple',
    'github': 'github'
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider: providerMap[provider]
  })

  if (error) {
    console.error(`Failed to link ${provider}:`, error)
    return { error }
  }

  return { error: null }
}

/**
 * Unlink OAuth provider
 */
export async function unlinkOAuthProvider(provider: OAuthProvider) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const identity = user.identities?.find(i => i.provider === provider || (provider === 'microsoft' && i.provider === 'azure'))
  
  if (!identity) {
    return { error: 'Provider not linked' }
  }

  const { error } = await supabase.auth.unlinkIdentity(identity)

  if (error) {
    console.error(`Failed to unlink ${provider}:`, error)
    return { error }
  }

  return { error: null }
}
