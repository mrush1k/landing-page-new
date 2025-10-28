"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Optimized Protected Route - Relies on middleware auth check
 * No loading spinner needed as middleware already validates session
 * This component just handles the redirect for client-side navigation
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once loading is complete AND there's no user
    // Don't redirect during initial load to avoid false positives
    if (!loading && user === null) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Render immediately - middleware already verified auth on server
  // The useEffect will handle any edge cases for client-side navigation
  return <>{children}</>
}