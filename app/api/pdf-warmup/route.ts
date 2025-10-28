import { NextRequest, NextResponse } from 'next/server'
import { warmupPDFGenerator } from '@/lib/pdf-generator-fast'

export async function POST() {
  try {
    console.log('🔥 API: Warming up PDF generator...')
    
    const startTime = Date.now()
    await warmupPDFGenerator()
    const duration = Date.now() - startTime
    
    console.log(`✅ API: PDF generator warmed up in ${duration}ms`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'PDF generator ready', 
      duration 
    })
  } catch (error) {
    console.error('❌ API: PDF warmup failed:', error)
    return NextResponse.json(
      { error: 'Failed to warm up PDF generator' },
      { status: 500 }
    )
  }
}