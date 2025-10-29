import { NextRequest, NextResponse } from 'next/server'
import { resolveAuth } from './unified-auth'
import { getOrCreateDbUser } from './db-operations'
import { createFastResponse, CacheConfigs } from './api-cache'
import type { User } from '@prisma/client'
import type { CacheOptions } from './api-cache'

export interface ApiContext {
  supabaseUser: any
  dbUser: User | null
  request: NextRequest
}

export interface ApiHandlerOptions {
  auth?: boolean
  cache?: CacheOptions | false
  createUserIfMissing?: boolean
}

export function apiHandler<T>(
  handler: (context: ApiContext) => Promise<T>,
  options: ApiHandlerOptions = {}
) {
  const { auth = true, cache = CacheConfigs.MODERATE, createUserIfMissing = false } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    try {
      let supabaseUser: any = null
      let dbUser: User | null = null

      if (auth) {
        const authResult = await resolveAuth(request, 'api')
        if (authResult.error || !authResult.user) {
          return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
        }
        supabaseUser = authResult.user

        if (createUserIfMissing) {
          dbUser = await getOrCreateDbUser(supabaseUser)
        } else {
          const { FastUserCache } = await import('./fast-user-cache')
          dbUser = await FastUserCache.getUser(supabaseUser)
        }

        if (!dbUser) {
          return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
        }
      }

      const context: ApiContext = { supabaseUser, dbUser, request }
      const data = await handler(context)

      if (cache !== false) {
        const response = await createFastResponse(request, async () => data, cache as CacheOptions)
        response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
        return response
      }

      const response = NextResponse.json(data)
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
      return response
    } catch (error: any) {
      console.error('API Handler Error:', {
        path: (error?.path) || 'unknown',
        method: (error?.method) || 'unknown',
        error: error?.message,
        stack: error?.stack,
        duration: Date.now() - startTime
      })

      const statusCode = error?.statusCode || 500
      const message = error?.message || 'Internal server error'

      return NextResponse.json({ error: message }, { status: statusCode, headers: { 'X-Response-Time': `${Date.now() - startTime}ms`, 'X-Error': 'true' } })
    }
  }
}

export const GET = <T>(handler: (context: ApiContext) => Promise<T>, options?: ApiHandlerOptions) => apiHandler(handler, options)
export const POST = <T>(handler: (context: ApiContext) => Promise<T>, options?: ApiHandlerOptions) => apiHandler(handler, { ...(options || {}), cache: false })
export const PUT = <T>(handler: (context: ApiContext) => Promise<T>, options?: ApiHandlerOptions) => apiHandler(handler, { ...(options || {}), cache: false })
export const DELETE = <T>(handler: (context: ApiContext) => Promise<T>, options?: ApiHandlerOptions) => apiHandler(handler, { ...(options || {}), cache: false })

export const publicHandler = <T>(handler: (request: NextRequest) => Promise<T>, cacheConfig: CacheOptions = CacheConfigs.REFERENCE) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    try {
      const data = await handler(request)
      const response = await createFastResponse(request, async () => data, cacheConfig)
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
      return response
    } catch (error: any) {
      console.error('Public Handler Error:', error)
      return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: error?.statusCode || 500, headers: { 'X-Response-Time': `${Date.now() - startTime}ms` } })
    }
  }
}
