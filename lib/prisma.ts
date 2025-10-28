import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with connection management
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'minimal',
  // Connection configuration for better stability
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Connection management and graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Only add listeners once to prevent memory leaks (Node.js only)
let listenersAdded = false
if (!listenersAdded && typeof process !== 'undefined' && typeof process.setMaxListeners === 'function') {
  // Increase max listeners to prevent warnings
  process.setMaxListeners(15)
  
  // Graceful shutdown handlers
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  listenersAdded = true
}

// Connection retry wrapper for better error handling
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,  // Reduced from 3 to 2
  delay: number = 500      // Reduced from 1000 to 500
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      // Only log in development to reduce noise
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error.message)
      }
      
      // Check if it's a connection error worth retrying
      const isRetryableError = 
        error.message?.includes('connection') || 
        error.message?.includes('forcibly closed') ||
        error.message?.includes('timeout') ||
        error.code === 'P1001' || 
        error.code === 'P1008' ||
        error.code === 'P1011'
      
      if (isRetryableError && i < maxRetries - 1) {
        // Shorter exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(1.5, i)))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}