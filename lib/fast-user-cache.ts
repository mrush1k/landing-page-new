/**
 * Fast User Cache System
 * Eliminates repeated database lookups on every API call
 * Implements multi-level caching: Memory -> Browser -> Database
 */

import { prisma } from './prisma'
import type { User } from '@prisma/client'

interface CachedUser {
  user: User | null
  timestamp: number
}

export class FastUserCache {
  // L1: In-memory cache (0ms access)
  private static memoryCache = new Map<string, CachedUser>()
  
  // Cache TTL: 5 minutes for balance of performance vs data freshness
  private static TTL = 5 * 60 * 1000 // 5 minutes
  
  // L2: Browser cache key prefix
  private static BROWSER_PREFIX = 'user_cache_'
  
  /**
   * Get user with multi-level caching
   * Priority: Memory -> Browser -> Database
   */
  static async getUser(supabaseUser: { id: string; email?: string }): Promise<User | null> {
    if (!supabaseUser?.id) return null
    
    const key = supabaseUser.id
    const now = Date.now()
    
    // L1: Check memory cache first (instant)
    const memCached = this.memoryCache.get(key)
    if (memCached && (now - memCached.timestamp) < this.TTL) {
      return memCached.user
    }
    
    // L2: Check browser cache (very fast)
    if (typeof window !== 'undefined') {
      try {
        const browserCached = localStorage.getItem(`${this.BROWSER_PREFIX}${key}`)
        if (browserCached) {
          const parsed: CachedUser = JSON.parse(browserCached)
          if ((now - parsed.timestamp) < this.TTL) {
            // Promote to memory cache
            this.memoryCache.set(key, parsed)
            return parsed.user
          } else {
            // Expired, remove from browser cache
            localStorage.removeItem(`${this.BROWSER_PREFIX}${key}`)
          }
        }
      } catch (error) {
        // Silent fail for browser cache errors
        console.warn('Browser cache read failed:', error)
      }
    }
    
    // L3: Database lookup (last resort)
    const dbUser = await this.fetchUserFromDatabase(supabaseUser)
    
    // Cache the result in all levels
    this.setCachedUser(key, dbUser, now)
    
    return dbUser
  }
  
  /**
   * Optimized database user lookup with fallback strategy
   */
  private static async fetchUserFromDatabase(supabaseUser: { id: string; email?: string }): Promise<User | null> {
    try {
      // First try: Direct ID lookup (fastest)
      let dbUser = await prisma.user.findUnique({ 
        where: { id: supabaseUser.id },
        // Only select fields we actually need for most operations
        select: {
          id: true,
          email: true,
          username: true,
          country: true,
          currency: true,
          firstName: true,
          lastName: true,
          businessName: true,
          onboardingCompleted: true,
          createdAt: true
        }
      })
      
      // Fallback: Email lookup if ID fails and email exists
      if (!dbUser && supabaseUser.email) {
        dbUser = await prisma.user.findUnique({ 
          where: { email: supabaseUser.email },
          select: {
            id: true,
            email: true,
            username: true,
            country: true,
            currency: true,
            firstName: true,
            lastName: true,
            businessName: true,
            onboardingCompleted: true,
            createdAt: true
          }
        })
      }
      
      return dbUser as User
    } catch (error) {
      console.error('Database user lookup failed:', error)
      return null
    }
  }
  
  /**
   * Cache user in all available levels
   */
  private static setCachedUser(key: string, user: User | null, timestamp: number = Date.now()) {
    const cachedData: CachedUser = { user, timestamp }
    
    // L1: Memory cache
    this.memoryCache.set(key, cachedData)
    
    // L2: Browser cache (if available)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${this.BROWSER_PREFIX}${key}`, JSON.stringify(cachedData))
      } catch (error) {
        // Silent fail for browser cache errors (quota exceeded, etc.)
        console.warn('Browser cache write failed:', error)
      }
    }
  }
  
  /**
   * Invalidate cached user (call when user data changes)
   */
  static invalidateUser(userId: string) {
    // Clear from memory cache
    this.memoryCache.delete(userId)
    
    // Clear from browser cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${this.BROWSER_PREFIX}${userId}`)
      } catch (error) {
        console.warn('Browser cache clear failed:', error)
      }
    }
  }
  
  /**
   * Clear all cached users (useful for logout)
   */
  static clearAll() {
    // Clear memory cache
    this.memoryCache.clear()
    
    // Clear browser cache
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(this.BROWSER_PREFIX)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } catch (error) {
        console.warn('Browser cache clear all failed:', error)
      }
    }
  }
  
  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      ttl: this.TTL,
      browserCacheSupported: typeof window !== 'undefined' && !!window.localStorage
    }
  }
  
  /**
   * Preload user into cache (useful after login/signup)
   */
  static async preloadUser(supabaseUser: { id: string; email?: string }) {
    // Fire and forget - don't await
    this.getUser(supabaseUser).catch(error => {
      console.warn('User preload failed:', error)
    })
  }
}

/**
 * Convenience function for API routes to replace resolveDbUser
 */
export async function resolveDbUserFast(supabaseUser: any): Promise<User | null> {
  return FastUserCache.getUser(supabaseUser)
}

/**
 * Hook for React components to use cached user data
 */
export function useCachedUser(supabaseUser: { id: string; email?: string } | null) {
  return supabaseUser ? FastUserCache.getUser(supabaseUser) : Promise.resolve(null)
}