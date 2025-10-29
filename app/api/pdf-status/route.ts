import { NextRequest, NextResponse } from 'next/server'
import { fastPDFGenerator } from '@/lib/pdf-generator-fast'

export async function GET() {
  try {
    // Get browser status without initializing
    const browserStatus = {
      hasGlobalBrowser: !!global.__pdfBrowser,
      isConnected: global.__pdfBrowser?.isConnected() || false,
      pagePoolSize: global.__pdfPagePool?.length || 0,
      cacheSize: global.__pdfCache?.size || 0,
      browserPromise: !!global.__pdfBrowserPromise
    }

    console.log('🔍 Browser Status Check:', browserStatus)

    return NextResponse.json({
      success: true,
      browserStatus,
      message: 'Browser status retrieved'
    })
  } catch (error) {
    console.error('❌ Browser status check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check browser status' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    console.log('🔥 Manual browser initialization requested...')
    
    const startTime = Date.now()
    await fastPDFGenerator.initializeBrowser()
    const duration = Date.now() - startTime
    
    const finalStatus = {
      hasGlobalBrowser: !!global.__pdfBrowser,
      isConnected: global.__pdfBrowser?.isConnected() || false,
      pagePoolSize: global.__pdfPagePool?.length || 0,
      cacheSize: global.__pdfCache?.size || 0
    }

    console.log('✅ Manual initialization complete:', finalStatus)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Browser initialized manually', 
      duration,
      browserStatus: finalStatus
    })
  } catch (error) {
    console.error('❌ Manual browser initialization failed:', error)
    return NextResponse.json(
      { error: 'Failed to initialize browser manually' },
      { status: 500 }
    )
  }
}