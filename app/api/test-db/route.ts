import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Simple query to test database connection speed
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    const queryTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      queryTime: `${queryTime}ms`,
      result
    })
  } catch (error: any) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 })
  }
}