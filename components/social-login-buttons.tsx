"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { Icons } from './ui/icons'
import { useToast } from '@/hooks/use-toast'
import { signInWithOAuth, type OAuthProvider } from '@/lib/oauth-unified'

interface SocialLoginButtonsProps {
  isSignUp?: boolean
  isTrial?: boolean
  onSuccess?: () => void
  disabled?: boolean
}

export function SocialLoginButtons({ 
  isSignUp = false, 
  isTrial = false, 
  onSuccess, 
  disabled = false 
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const { toast } = useToast()

  const handleSocialLogin = async (provider: OAuthProvider) => {
    if (disabled) return
    
    setLoadingProvider(provider)
    
    try {
      const { url, error } = await signInWithOAuth({
        provider,
        redirectTo: '/dashboard',
      })

      if (error) {
        throw error
      }
      
      // Redirect to OAuth provider
      if (url) {
        window.location.href = url
      }
      
    } catch (error) {
      console.error(`${provider} authentication error:`, error)
      toast({
        title: "Authentication Error",
        description: `Failed to authenticate with ${provider}. Please try again.`,
        variant: "destructive",
      })
      setLoadingProvider(null)
    }
  }

  const getButtonText = (provider: string) => {
    const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1)
    if (isTrial) {
      return `Start Free Trial with ${formattedProvider}`
    }
    return isSignUp ? `Sign up with ${formattedProvider}` : `Sign in with ${formattedProvider}`
  }

  return (
    <div className="space-y-3">
      {/* Google Sign In */}
      <Button
        variant="outline"
        className="w-full h-11 text-sm font-medium"
        onClick={() => handleSocialLogin('google')}
        disabled={disabled || loadingProvider !== null}
      >
        {loadingProvider === 'google' ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        {getButtonText('Google')}
      </Button>

      {/* Microsoft/Outlook Sign In */}
      <Button
        variant="outline"
        className="w-full h-11 text-sm font-medium"
        onClick={() => handleSocialLogin('microsoft')}
        disabled={disabled || loadingProvider !== null}
      >
        {loadingProvider === 'microsoft' ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.microsoft className="mr-2 h-4 w-4" />
        )}
        {getButtonText('Outlook')}
      </Button>

      {/* Apple Sign In */}
      <Button
        variant="outline"
        className="w-full h-11 text-sm font-medium bg-black text-white hover:bg-gray-800 border-black"
        onClick={() => handleSocialLogin('apple')}
        disabled={disabled || loadingProvider !== null}
      >
        {loadingProvider === 'apple' ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.apple className="mr-2 h-4 w-4" />
        )}
        {getButtonText('Apple')}
      </Button>
    </div>
  )
}

// Compact version for inline usage
export function SocialLoginCompact({ 
  onSuccess, 
  disabled = false 
}: Pick<SocialLoginButtonsProps, 'onSuccess' | 'disabled'>) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const { toast } = useToast()

  const handleSocialLogin = async (provider: OAuthProvider) => {
    if (disabled) return
    
    setLoadingProvider(provider)
    
    try {
      const { url, error } = await signInWithOAuth({
        provider,
        redirectTo: window.location.pathname,
      })

      if (error) {
        throw error
      }

      if (url) {
        window.location.href = url
      }
      
    } catch (error) {
      console.error(`${provider} authentication error:`, error)
      toast({
        title: "Authentication Error",
        description: `Failed to authenticate with ${provider}. Please try again.`,
        variant: "destructive",
      })
      setLoadingProvider(null)
    }
  }

  return (
    <div className="flex space-x-3">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={() => handleSocialLogin('google')}
        disabled={disabled || loadingProvider !== null}
      >
        {loadingProvider === 'google' ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={() => handleSocialLogin('microsoft')}
        disabled={disabled || loadingProvider !== null}
      >
        {loadingProvider === 'microsoft' ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.microsoft className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 bg-black text-white hover:bg-gray-800 border-black"
        onClick={() => handleSocialLogin('apple')}
        disabled={disabled || loadingProvider !== null}
      >
        {loadingProvider === 'apple' ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.apple className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}