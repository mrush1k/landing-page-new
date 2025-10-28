import { fastPDFGenerator } from './pdf-generator-fast'

// Global flag to prevent multiple initializations
declare global {
  var __pdfAutoInitStarted: boolean
}

// Auto-initialize PDF generator on server startup (only once)
if (!global.__pdfAutoInitStarted) {
  global.__pdfAutoInitStarted = true
  console.log('🔥 PDF Auto-Initialize: Starting warmup on server startup...')

  // Use a timeout to allow server to fully start first
  setTimeout(async () => {
    try {
      await fastPDFGenerator.initializeBrowser()
      console.log('✅ PDF Auto-Initialize: Ready for instant PDFs!')
    } catch (error) {
      console.error('❌ PDF Auto-Initialize failed:', error)
    }
  }, 2000) // 2 second delay to let server start
}

export { fastPDFGenerator }