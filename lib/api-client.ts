/**
 * Optimized API client with caching and request deduplication
 * Reduces redundant API calls and improves performance
 */

type CacheEntry = {
  data: any
  timestamp: number
}

class APIClient {
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()
  private cacheTimeout = 60000 // 1 minute default cache

  /**
   * Fetch with automatic caching and request deduplication
   */
  async fetch<T = any>(
    url: string,
    options?: RequestInit & { cache?: number | false },
    headers?: HeadersInit
  ): Promise<T> {
    const cacheKey = `${url}:${options?.method || 'GET'}:${JSON.stringify(options?.body || '')}`
    const cacheTime = options?.cache === false ? false : (options?.cache || this.cacheTimeout)

    // Check cache first (only for GET requests)
    if (options?.method === 'GET' || !options?.method) {
      const cached = this.getFromCache(cacheKey, cacheTime)
      if (cached) {
        return cached
      }

      // Check if there's a pending request for this resource
      const pending = this.pendingRequests.get(cacheKey)
      if (pending) {
        return pending
      }
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(url, options, headers)

    // Store pending request (for deduplication)
    if (options?.method === 'GET' || !options?.method) {
      this.pendingRequests.set(cacheKey, requestPromise)
    }

    try {
      const data = await requestPromise

      // Cache successful GET requests
      if ((options?.method === 'GET' || !options?.method) && cacheTime !== false) {
        this.setCache(cacheKey, data)
      }

      return data
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey)
    }
  }

  private async makeRequest<T>(
    url: string,
    options?: RequestInit,
    headers?: HeadersInit
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  private getFromCache(key: string, maxAge: number | false): any | null {
    if (maxAge === false) return null

    const entry = this.cache.get(key)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > maxAge) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })

    // Limit cache size to prevent memory leaks
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.keys())
      const firstKey = entries[0]
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
  }

  /**
   * Invalidate specific cache entries
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const keysToDelete: string[] = []
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Prefetch data for faster navigation
   */
  async prefetch(url: string, headers?: HeadersInit): Promise<void> {
    try {
      await this.fetch(url, { method: 'GET' }, headers)
    } catch (error) {
      // Silently fail prefetch requests
      console.debug('Prefetch failed:', url)
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient()

/**
 * React hook for optimized data fetching
 */
export function useOptimizedFetch<T = any>(
  url: string | null,
  options?: RequestInit & { cache?: number | false },
  headers?: HeadersInit
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (!url) return

    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.fetch<T>(url, options, headers)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [url, JSON.stringify(options), JSON.stringify(headers)])

  return { data, loading, error }
}

// Import React for the hook
import React from 'react'
