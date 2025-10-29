/**
 * API Response Caching Utilities
 * Provides comprehensive caching headers and ETag support for instant cache hits
 */

import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export interface CacheOptions {
  maxAge?: number // Cache duration in seconds (default: 180)
  staleWhileRevalidate?: number // SWR duration in seconds (default: 60)  
  private?: boolean // Private cache (default: true)
  etag?: boolean // Generate ETag (default: true)
  vary?: string[] // Vary headers (default: ['Authorization'])
}

/**
 * Generate ETag from response data for cache validation
 */
export function generateETag(data: any): string {
  const hash = createHash('md5')
  hash.update(JSON.stringify(data))
  return `"${hash.digest('hex')}"`
}

/**
 * Create optimized cache headers for API responses
 */
export function createCacheHeaders(options: CacheOptions = {}): Headers {
  const {
    maxAge = 180, // 3 minutes default
    staleWhileRevalidate = 60, // 1 minute SWR
    private: isPrivate = true,
    etag = true,
    vary = ['Authorization']
  } = options

  const headers = new Headers()

  // Cache-Control header with optimized directives
  const cacheControl = [
    isPrivate ? 'private' : 'public',
    `max-age=${maxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
    'must-revalidate'
  ].join(', ')

  headers.set('Cache-Control', cacheControl)
  headers.set('Content-Type', 'application/json')

  // Vary header for proper cache segmentation
  if (vary.length > 0) {
    headers.set('Vary', vary.join(', '))
  }

  return headers
}

/**
 * Create cached response with optimal headers and ETag support
 */
export function createCachedResponse(
  data: any, 
  options: CacheOptions & { status?: number } = {}
): NextResponse {
  const { status = 200, ...cacheOptions } = options
  const headers = createCacheHeaders(cacheOptions)

  // Generate ETag for cache validation
  if (cacheOptions.etag !== false) {
    const etag = generateETag(data)
    headers.set('ETag', etag)
  }

  // Add performance timing header
  headers.set('X-Cache', 'MISS')
  headers.set('X-Generated-At', new Date().toISOString())

  return NextResponse.json(data, { status, headers })
}

/**
 * Check if request has matching ETag (304 Not Modified support)
 */
export function checkETag(request: Request, data: any): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match')
  if (!ifNoneMatch) return false

  const currentETag = generateETag(data)
  return ifNoneMatch === currentETag
}

/**
 * Handle conditional requests with ETag validation
 */
export function handleConditionalRequest(
  request: Request, 
  data: any, 
  options: CacheOptions = {}
): NextResponse | null {
  if (checkETag(request, data)) {
    // Return 304 Not Modified with cache headers
    const headers = createCacheHeaders(options)
    headers.set('ETag', generateETag(data))
    headers.set('X-Cache', 'HIT')
    
    return new NextResponse(null, { 
      status: 304, 
      headers 
    })
  }
  
  return null // Continue with normal response
}

/**
 * Cache configurations for different types of data
 */
export const CacheConfigs = {
  // Fast-changing data (user-specific, frequent updates)
  DYNAMIC: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30,
    private: true,
    etag: true
  } as CacheOptions,

  // Moderate-changing data (dashboard, lists)
  MODERATE: {
    maxAge: 180, // 3 minutes  
    staleWhileRevalidate: 60,
    private: true,
    etag: true
  } as CacheOptions,

  // Slow-changing data (settings, profiles)
  STATIC: {
    maxAge: 600, // 10 minutes
    staleWhileRevalidate: 180,
    private: true,
    etag: true  
  } as CacheOptions,

  // User-specific data (invoices, customers)
  USER_DATA: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 120,
    private: true,
    etag: true,
    vary: ['Authorization', 'X-User-ID']
  } as CacheOptions,

  // Reference data (rarely changes)
  REFERENCE: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 1800,
    private: false,
    etag: true,
    vary: []
  } as CacheOptions
}

/**
 * Middleware for adding performance monitoring headers
 */
export function addPerformanceHeaders(
  response: NextResponse, 
  startTime: number,
  queryCount?: number
): NextResponse {
  const responseTime = Date.now() - startTime
  
  response.headers.set('X-Response-Time', `${responseTime}ms`)
  
  if (queryCount !== undefined) {
    response.headers.set('X-Query-Count', queryCount.toString())
  }
  
  // Performance classification
  let performanceRating = 'excellent'
  if (responseTime > 200) performanceRating = 'good'
  if (responseTime > 500) performanceRating = 'poor'
  if (responseTime > 1000) performanceRating = 'critical'
  
  response.headers.set('X-Performance', performanceRating)
  
  return response
}

/**
 * Helper for creating fast API responses with optimal caching
 */
export async function createFastResponse<T>(
  request: Request,
  dataFetcher: () => Promise<T>,
  cacheConfig: CacheOptions = CacheConfigs.MODERATE
): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const data = await dataFetcher()
    
    // Check conditional request (ETag)
    const conditionalResponse = handleConditionalRequest(request, data, cacheConfig)
    if (conditionalResponse) {
      return addPerformanceHeaders(conditionalResponse, startTime)
    }
    
    // Create cached response
    const response = createCachedResponse(data, cacheConfig)
    
    return addPerformanceHeaders(response, startTime)
    
  } catch (error) {
    console.error('API Error:', error)
    
    // Error response with short cache to prevent cascading failures
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: createCacheHeaders({ maxAge: 10, staleWhileRevalidate: 5 })
      }
    )
    
    return addPerformanceHeaders(errorResponse, startTime)
  }
}