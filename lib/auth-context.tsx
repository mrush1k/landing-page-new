"use client"

import { createContext, useEffect, useState, useContext } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { User } from './types'
import { performanceMonitor } from './performance-monitor'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  loading: boolean
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  getAuthHeaders: () => Promise<HeadersInit>
  updateUser: (userData: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLastFetched, setProfileLastFetched] = useState<number>(0)
  const supabase = createClient()

  // Cache TTL: 5 minutes (300000ms)
  const PROFILE_CACHE_TTL = 300000

  const isProfileStale = () => {
    return Date.now() - profileLastFetched > PROFILE_CACHE_TTL
  }

  useEffect(() => {
    performanceMonitor.startTimer('auth-initialization')
    
    // Get initial session with faster loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Set loading to false immediately for faster page rendering
        setLoading(false)
        performanceMonitor.endTimer('auth-initialization')
        
        // Fetch profile in background without blocking UI
        if (!userProfile || isProfileStale()) {
          fetchUserProfile(session.user.id)
        }
      } else {
        setLoading(false)
        performanceMonitor.endTimer('auth-initialization')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Set loading to false immediately
        setLoading(false)
        // Only refetch profile if it's stale or missing, in background
        if (!userProfile || isProfileStale()) {
          fetchUserProfile(session.user.id)
        }
      } else {
        setUserProfile(null)
        setProfileLastFetched(0)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const fetchUserProfile = async (userId: string) => {
    try {
      performanceMonitor.startTimer('profile-fetch')
      
      // Don't set loading true - fetch profile in background
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        setProfileLastFetched(Date.now())
        
        performanceMonitor.endTimer('profile-fetch')
      } else {
        // If API fails, create fallback profile from Supabase user data
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const fallbackProfile: any = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'user',
            displayName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            firstName: session.user.user_metadata?.given_name || '',
            lastName: session.user.user_metadata?.family_name || '',
            country: 'US',
            currency: 'USD',
            onboardingCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          setUserProfile(fallbackProfile)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Create fallback profile from Supabase user data in case of network error
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const fallbackProfile: any = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'user',
            displayName: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            firstName: session.user.user_metadata?.given_name || '',
            lastName: session.user.user_metadata?.family_name || '',
            country: 'US',
            currency: 'USD',
            onboardingCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          setUserProfile(fallbackProfile)
        }
      } catch (fallbackError) {
        console.error('Error creating fallback profile:', fallbackError)
      }
    }
    // Remove finally block - don't set loading false here since we're not blocking
  }

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return { error }

      if (data.user) {
        // Create user profile
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email,
            ...userData,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          return { error: error.message || 'Failed to create user profile' }
        }

        // Generate AI logo if business name is provided
        if (userData.businessName) {
          try {
            const logoResponse = await fetch('/api/ai-logo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessName: userData.businessName,
              }),
            })
            
            if (logoResponse.ok) {
              console.log('AI logo generated successfully for', userData.businessName)
            }
          } catch (logoError) {
            console.warn('Failed to generate AI logo:', logoError)
            // Don't fail the signup if logo generation fails
          }
        }

        // Send confirmation email
        try {
          await fetch('/api/email/confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              displayName: userData.username || email.split('@')[0],
              appName: 'Invoice Easy',
            }),
          })
        } catch (emailError) {
          console.warn('Failed to send confirmation email:', emailError)
          // Don't fail the signup if email fails
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://final-google-supa-invoice.vercel.app'
      : window.location.origin
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    })
    return { error }
  }

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    }
  }

  const updateUser = (userData: User) => {
    setUserProfile(userData)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        getAuthHeaders,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}