import { prisma, withRetry } from './prisma'
import { FastUserCache, resolveDbUserFast } from './fast-user-cache'
import type { User } from '@prisma/client'
import type { Prisma } from '@prisma/client'

/**
 * Generic database operation wrapper with auto-retry
 */
export async function dbOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    operationName?: string
  } = {}
): Promise<T> {
  const { maxRetries = 2, delay = 500, operationName = 'DB operation' } = options

  try {
    return await withRetry(operation, maxRetries, delay)
  } catch (error: any) {
    console.error(`${operationName} failed:`, {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    throw error
  }
}

/**
 * Get or create database user from Supabase user
 */
export async function getOrCreateDbUser(supabaseUser: {
  id: string
  email?: string
  user_metadata?: any
}): Promise<User | null> {
  // Try cache first
  let dbUser = await resolveDbUserFast(supabaseUser)
  if (dbUser) return dbUser

  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not configured - skipping user creation')
    return null
  }

  try {
    dbUser = await dbOperation(
      () => prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: supabaseUser.email?.split('@')[0] || `user_${supabaseUser.id.slice(0, 8)}`,
          country: 'US',
          currency: 'USD',
          displayName: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User'
        }
      }),
      { operationName: 'Create user' }
    )

    // Fire-and-forget cache update
    if (dbUser) FastUserCache.getUser({ id: dbUser.id, email: dbUser.email }).catch(() => {})

    return dbUser
  } catch (error: any) {
    // Unique constraint violation - another request created the user
    if (error?.code === 'P2002') {
      return await resolveDbUserFast(supabaseUser)
    }
    throw error
  }
}

/**
 * Transaction wrapper
 */
export async function dbTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { maxRetries?: number } = {}
): Promise<T> {
  return dbOperation(() => prisma.$transaction(operations), { ...options, operationName: 'Transaction' })
}

/**
 * Query builders for common patterns
 */
export const QueryBuilders = {
  userScoped: <T extends { userId: string; deletedAt?: Date | null }>(
    model: any,
    userId: string,
    additionalWhere: any = {}
  ) => ({
    where: {
      userId,
      deletedAt: null,
      ...additionalWhere
    }
  }),

  paginated: (page: number = 1, limit: number = 10) => ({
    skip: (page - 1) * limit,
    take: limit
  }),

  invoiceIncludes: {
    minimal: {
      customer: {
        select: { displayName: true, email: true }
      }
    },
    standard: {
      customer: true,
      items: true,
      _count: { select: { payments: true } }
    },
    full: {
      customer: true,
      items: true,
      payments: true,
      user: {
        select: {
          businessName: true,
          email: true,
          phone: true,
          address: true,
          logoUrl: true
        }
      }
    }
  }
}

/**
 * Serializers to convert Prisma Decimal -> number for JSON
 */
export function serializeInvoice(invoice: any) {
  if (!invoice) return invoice
  return {
    ...invoice,
    total: Number(invoice.total),
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    items: invoice.items?.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total)
    }))
  }
}

export function serializePayment(payment: any) {
  if (!payment) return payment
  return {
    ...payment,
    amount: Number(payment.amount)
  }
}
