"use client"

import { createContext, useEffect, useState, useContext, useCallback, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { User } from './types'
import { performanceMonitor } from './performance-monitor'
import { FastUserCache } from './fast-user-cache'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  loading: boolean
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  getAuthHeaders: () => Promise<HeadersInit>
  updateUserProfile: (userData: User) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Request deduplication for profile fetches
const pendingProfileFetches = new Map<string, Promise<User | null>>()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Use ref to prevent effect re-runs
  const profileFetchedRef = useRef(false)

  // Helper to create fallback profile
  const createFallbackProfile = (supabaseUser: SupabaseUser): User => {
    const metadata = supabaseUser.user_metadata || {}
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      username: supabaseUser.email?.split('@')[0] || 'user',
      displayName: metadata.name || metadata.full_name || metadata.fullName || supabaseUser.email?.split('@')[0] || 'User',
      firstName: metadata.given_name || metadata.firstName || '',
      lastName: metadata.family_name || metadata.lastName || '',
      country: metadata.country || 'US',
      currency: metadata.currency || 'USD',
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  // Optimized profile fetch with request deduplication and FastUserCache
  const fetchUserProfile = useCallback(async (userId: string) => {
    // Check for pending request to avoid duplicate fetches
    if (pendingProfileFetches.has(userId)) {
      const profile = await pendingProfileFetches.get(userId)!
      if (profile) setUserProfile(profile)
      return
    }

    const fetchPromise = (async (): Promise<User | null> => {
      try {
        performanceMonitor.startTimer('profile-fetch')
        
        // Try FastUserCache first (0-5ms lookup)
        const cachedProfile = await FastUserCache.getUser({ id: userId })
        if (cachedProfile) {
          const duration = performanceMonitor.endTimer('profile-fetch')
          setUserProfile(cachedProfile as any as User)
          return cachedProfile as any as User
        }

        // Cache miss - fetch from API
        const response = await fetch(`/api/users/${userId}`)
        
        if (response.ok) {
          const profile = await response.json()
          performanceMonitor.endTimer('profile-fetch')
          setUserProfile(profile)
          return profile
        }

        // API failed - create fallback profile
        performanceMonitor.endTimer('profile-fetch')
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const fallbackProfile = createFallbackProfile(session.user)
          setUserProfile(fallbackProfile)
          return fallbackProfile
        }
        
        return null
      } catch (error) {
        console.error('Error fetching user profile:', error)
        performanceMonitor.endTimer('profile-fetch')
        
        // Create fallback profile from Supabase user data
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const fallbackProfile = createFallbackProfile(session.user)
            setUserProfile(fallbackProfile)
            return fallbackProfile
          }
        } catch (fallbackError) {
          console.error('Error creating fallback profile:', fallbackError)
        }
        
        return null
      } finally {
        // Clear pending request
        pendingProfileFetches.delete(userId)
      }
    })()

    pendingProfileFetches.set(userId, fetchPromise)
    await fetchPromise
  }, [supabase])

  useEffect(() => {
    // Prevent duplicate fetches
    if (profileFetchedRef.current) return
    
    performanceMonitor.startTimer('auth-initialization')
    
    // Get initial session with faster loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        profileFetchedRef.current = true
        // Set loading to false immediately for faster page rendering
        setLoading(false)
        performanceMonitor.endTimer('auth-initialization')
        
        // Fetch profile in background without blocking UI
        fetchUserProfile(session.user.id)
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
        // Fetch profile in background
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        profileFetchedRef.current = false
        // Clear cache on sign out
        pendingProfileFetches.clear()
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

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

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    }
  }, [supabase])

  const updateUserProfile = (userData: User) => {
    setUserProfile(userData)
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileFetchedRef.current = false
      await fetchUserProfile(user.id)
    }
  }, [user, fetchUserProfile])

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
        updateUserProfile,
        refreshProfile,
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