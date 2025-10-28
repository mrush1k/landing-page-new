import puppeteer, { Browser, Page } from 'puppeteer'
import { Invoice, InvoiceStatus } from './types'
import { formatCurrency } from './utils'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Global browser instance to persist across requests
declare global {
  var __pdfBrowser: Browser | undefined
  var __pdfBrowserPromise: Promise<Browser> | undefined
  var __pdfPagePool: Page[]
  var __pdfCache: Map<string, { buffer: Buffer; timestamp: number }>
}

// Performance-optimized PDF generator with instant response
class FastPDFGenerator {
  private static instance: FastPDFGenerator
  private maxPages = 5
  private isShuttingDown = false
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private readonly MAX_CACHE_SIZE = 50 // Maximum cached PDFs

  constructor() {
    // Initialize global variables if they don't exist
    if (!global.__pdfPagePool) {
      global.__pdfPagePool = []
    }
    if (!global.__pdfCache) {
      global.__pdfCache = new Map()
    }
  }

  static getInstance(): FastPDFGenerator {
    if (!FastPDFGenerator.instance) {
      FastPDFGenerator.instance = new FastPDFGenerator()
    }
    return FastPDFGenerator.instance
  }

  // Getters for global state
  private get browser(): Browser | null {
    return global.__pdfBrowser || null
  }

  private set browser(value: Browser | null) {
    global.__pdfBrowser = value || undefined
  }

  private get browserPromise(): Promise<Browser> | null {
    return global.__pdfBrowserPromise || null
  }

  private set browserPromise(value: Promise<Browser> | null) {
    global.__pdfBrowserPromise = value || undefined
  }

  private get pagePool(): Page[] {
    return global.__pdfPagePool
  }

  private get pdfCache(): Map<string, { buffer: Buffer; timestamp: number }> {
    return global.__pdfCache
  }

  // Initialize browser once at startup
  async initializeBrowser(): Promise<void> {
    // Check if browser is already running and healthy
    if (this.browser && !this.browser.isConnected()) {
      console.log('🔄 FastPDF: Browser disconnected, cleaning up...')
      this.browser = null
      this.browserPromise = null
      this.pagePool.length = 0
    }

    if (this.browser && this.browser.isConnected()) {
      console.log('✅ FastPDF: Browser already running and healthy')
      return
    }

    if (this.browserPromise) {
      console.log('⏳ FastPDF: Browser launch in progress, waiting...')
      return this.browserPromise.then(() => {})
    }
    
    console.log('🚀 FastPDF: Launching browser...')
    const launchStart = Date.now()
    
    this.browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess',
        '--run-all-compositor-stages-before-draw',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection',
        '--disable-default-apps',
        '--disable-sync',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-gpu',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ],
      timeout: 60000
    })

    try {
      this.browser = await this.browserPromise
      const launchTime = Date.now() - launchStart
      
      console.log(`✅ FastPDF: Browser launched in ${launchTime}ms`)
      
      // Pre-create page pool for instant access
      const poolStart = Date.now()
      for (let i = 0; i < this.maxPages; i++) {
        const page = await this.browser.newPage()
        await this.optimizePage(page)
        this.pagePool.push(page)
      }
      const poolTime = Date.now() - poolStart

      console.log(`🚀 FastPDF: Browser initialized with ${this.maxPages} ready pages in ${poolTime}ms`)
      
      // Handle browser disconnection
      this.browser.on('disconnected', () => {
        console.log('⚠️ FastPDF: Browser disconnected')
        this.browser = null
        this.browserPromise = null
        this.pagePool.length = 0
      })
      
    } catch (error) {
      console.error('❌ FastPDF: Browser launch failed:', error)
      this.browser = null
      this.browserPromise = null
      throw error
    }
  }

  // Optimize page for fastest PDF generation
  private async optimizePage(page: Page): Promise<void> {
    // Disable unnecessary features for speed
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const resourceType = request.resourceType()
      if (['image', 'stylesheet', 'font', 'script'].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123 }) // A4 size in pixels
  }

  // Get page from pool or create new one
  private async getPage(): Promise<Page> {
    // Try to get page from pool first
    if (this.pagePool.length > 0) {
      const page = this.pagePool.pop()!
      
      // Verify page is still valid
      if (!page.isClosed()) {
        return page
      } else {
        console.log('⚠️ FastPDF: Found closed page in pool, removing')
      }
    }

    // Ensure browser is ready
    await this.initializeBrowser()
    
    if (!this.browser || !this.browser.isConnected()) {
      throw new Error('Browser not available after initialization')
    }

    const page = await this.browser.newPage()
    await this.optimizePage(page)
    return page
  }

  // Return page to pool for reuse
  private returnPage(page: Page): void {
    if (this.pagePool.length < this.maxPages && !this.isShuttingDown) {
      this.pagePool.push(page)
    } else {
      page.close().catch(console.error)
    }
  }

  // Generate cache key for invoice
  private getCacheKey(invoice: Invoice, business: any): string {
    const invoiceHash = crypto.createHash('md5')
      .update(JSON.stringify({
        id: invoice.id,
        number: invoice.number,
        updatedAt: invoice.updatedAt,
        total: invoice.total,
        status: invoice.status,
        businessName: business?.name
      }))
      .digest('hex')
    return `pdf_${invoiceHash}`
  }

  // Clean expired cache entries
  private cleanCache(): void {
    const now = Date.now()
    const expired = Array.from(this.pdfCache.entries())
      .filter(([_, data]) => now - data.timestamp > this.CACHE_TTL)
    
    expired.forEach(([key]) => this.pdfCache.delete(key))

    // Limit cache size
    if (this.pdfCache.size > this.MAX_CACHE_SIZE) {
      const oldest = Array.from(this.pdfCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, this.pdfCache.size - this.MAX_CACHE_SIZE)
      
      oldest.forEach(([key]) => this.pdfCache.delete(key))
    }
  }

  // Ultra-fast PDF generation with caching
  async generatePDF(
    invoice: Invoice,
    business?: {
      name?: string
      address?: string
      phone?: string
      email?: string
      logo?: string
      taxId?: string
    }
  ): Promise<Buffer> {
    const startTime = Date.now()
    const perfLog = {
      cacheCheck: 0,
      browserInit: 0,
      pageGet: 0,
      htmlGen: 0,
      contentSet: 0,
      pdfGen: 0,
      cacheStore: 0,
      total: 0
    }

    // Check cache first for instant response
    const cacheStart = Date.now()
    const cacheKey = this.getCacheKey(invoice, business)
    const cached = this.pdfCache.get(cacheKey)
    perfLog.cacheCheck = Date.now() - cacheStart
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      perfLog.total = Date.now() - startTime
      console.log(`⚡ FastPDF: Cache hit for ${invoice.number} (${perfLog.total}ms)`)
      return cached.buffer
    }

    let page: Page | null = null
    
    try {
      // Ensure browser is ready
      const browserStart = Date.now()
      if (!this.browser || !this.browser.isConnected()) {
        console.log('🔄 FastPDF: Browser not ready, initializing...')
        await this.initializeBrowser()
      } else {
        console.log('✅ FastPDF: Reusing existing browser')
      }
      perfLog.browserInit = Date.now() - browserStart

      // Get optimized page from pool
      const pageStart = Date.now()
      page = await this.getPage()
      perfLog.pageGet = Date.now() - pageStart

      // Generate HTML content
      const htmlStart = Date.now()
      const htmlContent = this.generateOptimizedHTML(invoice, business)
      perfLog.htmlGen = Date.now() - htmlStart

      // Set content with minimal wait time
      const contentStart = Date.now()
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded', // Faster than networkidle0
        timeout: 5000 
      })
      perfLog.contentSet = Date.now() - contentStart

      // Generate PDF with optimized settings
      const pdfStart = Date.now()
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          bottom: '15mm',
          left: '12mm',
          right: '12mm'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: false, // Faster rendering
        timeout: 10000
      })
      perfLog.pdfGen = Date.now() - pdfStart

      const buffer = Buffer.from(pdfBuffer)

      // Cache for future instant access
      const cacheStoreStart = Date.now()
      this.pdfCache.set(cacheKey, {
        buffer,
        timestamp: Date.now()
      })
      perfLog.cacheStore = Date.now() - cacheStoreStart

      // Clean cache periodically
      this.cleanCache()

      perfLog.total = Date.now() - startTime
      console.log(`🚀 FastPDF: Generated ${invoice.number} in ${perfLog.total}ms | Cache:${perfLog.cacheCheck}ms | Browser:${perfLog.browserInit}ms | Page:${perfLog.pageGet}ms | HTML:${perfLog.htmlGen}ms | Content:${perfLog.contentSet}ms | PDF:${perfLog.pdfGen}ms | Store:${perfLog.cacheStore}ms`)

      return buffer

    } catch (error) {
      perfLog.total = Date.now() - startTime
      console.error(`❌ FastPDF Error (${perfLog.total}ms):`, error)
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Return page to pool for reuse
      if (page) {
        this.returnPage(page)
      }
    }
  }

  // Optimized HTML template with inline CSS for speed
  private generateOptimizedHTML(
    invoice: Invoice,
    business: {
      name?: string
      address?: string
      phone?: string
      email?: string
      logo?: string
      taxId?: string
    } = {}
  ): string {
    const {
      number: invoiceNumber,
      issueDate,
      dueDate,
      items = [],
      subtotal = 0,
      taxAmount = 0,
      total = 0,
      status,
      notes,
      terms: paymentTerms = 'Net 30',
      customer
    } = invoice

    // Extract client details
    const clientName = customer?.displayName || customer?.businessName || 'Unknown Client'
    const clientEmail = customer?.email || ''
    const clientAddress = [
      customer?.address,
      customer?.city,
      customer?.state,
      customer?.zipCode,
      customer?.country
    ].filter(Boolean).join(', ')

    // Calculate totals
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const calculatedTax = taxAmount || 0
    const calculatedTotal = total || (calculatedSubtotal + calculatedTax)

    // Format dates
    const formatDate = (date: Date | string) => {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    // Status colors
    const getStatusColor = (status: InvoiceStatus) => {
      switch (status) {
        case InvoiceStatus.PAID: return '#10b981'
        case InvoiceStatus.OVERDUE: return '#ef4444'
        case InvoiceStatus.DRAFT: return '#6b7280'
        case InvoiceStatus.CANCELLED: return '#dc2626'
        default: return '#f59e0b'
      }
    }

    // Optimized HTML with critical CSS inline
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${invoiceNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;line-height:1.4;color:#333;background:#fff;font-size:13px}
.container{max-width:800px;margin:0 auto;padding:30px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:2px solid #0066cc;padding-bottom:15px}
.business-info{flex:1}
.business-name{font-size:22px;font-weight:bold;color:#0066cc;margin-bottom:5px}
.business-details{font-size:12px;color:#666;line-height:1.3}
.logo-placeholder{width:60px;height:60px;background:#0066cc;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:20px;font-weight:bold;margin-bottom:8px}
.invoice-meta{text-align:right}
.invoice-title{font-size:28px;font-weight:bold;margin-bottom:8px}
.invoice-number{font-size:16px;color:#666;margin-bottom:5px}
.invoice-status{display:inline-block;padding:6px 12px;border-radius:15px;font-size:10px;font-weight:bold;text-transform:uppercase;color:#fff;background:${getStatusColor(status)}}
.details{display:flex;justify-content:space-between;margin-bottom:30px}
.client-info,.invoice-dates{flex:1}
.client-info{margin-right:30px}
.section-title{font-size:13px;font-weight:bold;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.client-details,.date-details{font-size:12px;color:#666;line-height:1.4}
.items{width:100%;border-collapse:collapse;margin-bottom:30px;border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.items th{background:#f8f9fa;color:#333;font-weight:bold;padding:12px 10px;text-align:left;border-bottom:1px solid #dee2e6;font-size:12px;text-transform:uppercase;letter-spacing:0.3px}
.items td{padding:12px 10px;border-bottom:1px solid #f1f3f4;font-size:12px}
.items tr:nth-child(even){background:#fafbfc}
.text-right{text-align:right}
.text-center{text-align:center}
.totals{margin-left:auto;width:250px;background:#f8f9fa;padding:15px;border-radius:6px;border-left:3px solid #0066cc}
.totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
.totals-row.total{border-top:1px solid #dee2e6;margin-top:8px;padding-top:12px;font-size:16px;font-weight:bold;color:#0066cc}
.notes{margin-top:30px}
.notes-content{background:#f8f9fa;padding:15px;border-radius:6px;border-left:3px solid #28a745;font-size:12px;color:#555;line-height:1.5}
.footer{margin-top:40px;padding-top:15px;border-top:1px solid #dee2e6;text-align:center;color:#666;font-size:11px}
</style></head><body>
<div class="container">
<div class="header">
  <div class="business-info">
    ${business.logo ? 
      `<img src="${business.logo}" style="width:80px;height:60px;object-fit:contain;margin-bottom:8px"/>` :
      `<div class="logo-placeholder">${business.name ? business.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'CO'}</div>`
    }
    <div class="business-name">${business.name || 'Your Business'}</div>
    <div class="business-details">
      ${business.address ? `${business.address}<br>` : ''}
      ${business.phone ? `${business.phone}<br>` : ''}
      ${business.email ? `${business.email}<br>` : ''}
      ${business.taxId ? `Tax ID: ${business.taxId}` : ''}
    </div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-title">INVOICE</div>
    <div class="invoice-number">#${invoiceNumber}</div>
    <div class="invoice-status">${status}</div>
  </div>
</div>
<div class="details">
  <div class="client-info">
    <div class="section-title">Bill To</div>
    <div class="client-details">
      <strong>${clientName}</strong><br>
      ${clientEmail ? `${clientEmail}<br>` : ''}
      ${clientAddress ? clientAddress.split('\n').join('<br>') : ''}
    </div>
  </div>
  <div class="invoice-dates">
    <div class="section-title">Invoice Details</div>
    <div class="date-details">
      <strong>Issue Date:</strong> ${formatDate(issueDate)}<br>
      <strong>Due Date:</strong> ${formatDate(dueDate)}<br>
      <strong>Payment Terms:</strong> ${paymentTerms}
    </div>
  </div>
</div>
<table class="items">
  <thead>
    <tr>
      <th style="width:50%">Description</th>
      <th class="text-center" style="width:15%">Qty</th>
      <th class="text-right" style="width:15%">Rate</th>
      <th class="text-right" style="width:20%">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(item => `
      <tr>
        <td><strong>${item.name || item.description}</strong></td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.unitPrice)}</td>
        <td class="text-right">${formatCurrency(item.quantity * item.unitPrice)}</td>
      </tr>
    `).join('')}
  </tbody>
</table>
<div class="totals">
  <div class="totals-row">
    <span>Subtotal:</span>
    <span>${formatCurrency(calculatedSubtotal)}</span>
  </div>
  ${calculatedTax > 0 ? `
    <div class="totals-row">
      <span>Tax:</span>
      <span>${formatCurrency(calculatedTax)}</span>
    </div>
  ` : ''}
  <div class="totals-row total">
    <span>Total:</span>
    <span>${formatCurrency(calculatedTotal)}</span>
  </div>
</div>
${notes ? `
  <div class="notes">
    <div class="section-title">Notes</div>
    <div class="notes-content">${notes}</div>
  </div>
` : ''}
<div class="footer">
  <p>Thank you for your business!</p>
  ${business.email ? `<p>Questions? Contact us at ${business.email}</p>` : ''}
</div>
</div></body></html>`
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    this.isShuttingDown = true
    
    // Close all pooled pages
    await Promise.all(this.pagePool.map(page => page.close().catch(console.error)))
    this.pagePool.length = 0 // Clear array without reassigning
    
    // Close browser
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.browserPromise = null
    }
    
    // Clear cache
    this.pdfCache.clear()
    
    console.log('🚀 FastPDF: Shutdown complete')
  }
}

// Singleton instance
export const fastPDFGenerator = FastPDFGenerator.getInstance()

// Global flag to prevent duplicate listeners
declare global {
  var __pdfProcessListeners: boolean
}

// Initialize on import for instant first use (only once)
if (!global.__pdfProcessListeners) {
  global.__pdfProcessListeners = true
  
  // Increase max listeners to prevent warnings in development
  process.setMaxListeners(30)
  
  // Graceful shutdown on process exit (only register once)
  process.on('beforeExit', () => {
    fastPDFGenerator.shutdown().catch(console.error)
  })

  process.on('SIGTERM', () => {
    fastPDFGenerator.shutdown().then(() => process.exit(0)).catch(() => process.exit(1))
  })

  process.on('SIGINT', () => {
    fastPDFGenerator.shutdown().then(() => process.exit(0)).catch(() => process.exit(1))
  })
}

// Main export function
export const generateInvoicePDF = async (
  invoice: Invoice,
  business?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    logo?: string
    taxId?: string
  }
): Promise<Buffer> => {
  return fastPDFGenerator.generatePDF(invoice, business)
}

// Warmup function for immediate first PDF generation
export const warmupPDFGenerator = async (): Promise<void> => {
  try {
    console.log('🔥 FastPDF: Warming up generator...')
    await fastPDFGenerator.initializeBrowser()
    console.log('✅ FastPDF: Warmup complete - ready for instant PDFs')
  } catch (error) {
    console.error('❌ FastPDF: Warmup failed:', error)
  }
}

// Receipt PDF generator - returns jsPDF-compatible object for backward compatibility
export const generateReceiptPDF = (
  invoice: any,
  userProfile: any,
  payment: { amount: number; paymentDate: string; method: string }
) => {
  // Create a mock jsPDF-like object that can be used with the email route
  // The actual PDF generation happens when called via generateInvoicePDF
  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #28a745; margin: 0; }
    .receipt-table { width: 100%; margin: 20px 0; }
    .receipt-table tr { border-bottom: 1px solid #eee; }
    .receipt-table td { padding: 10px 0; }
    .label { font-weight: bold; color: #666; width: 40%; }
    .value { color: #333; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PAYMENT RECEIPT</h1>
      <p style="color: #666; margin: 10px 0 0 0;">Receipt for Invoice #${invoice?.number || 'N/A'}</p>
    </div>
    <table class="receipt-table">
      <tr>
        <td class="label">Business:</td>
        <td class="value">${userProfile?.businessName || userProfile?.username || 'Your Business'}</td>
      </tr>
      <tr>
        <td class="label">Invoice #:</td>
        <td class="value">${invoice?.number || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Customer:</td>
        <td class="value">${invoice?.customer?.displayName || 'Customer'}</td>
      </tr>
      <tr>
        <td class="label">Payment Date:</td>
        <td class="value">${new Date(payment.paymentDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td class="label">Amount Paid:</td>
        <td class="value"><strong>$${Number(payment.amount).toFixed(2)}</strong></td>
      </tr>
      <tr>
        <td class="label">Payment Method:</td>
        <td class="value">${payment.method}</td>
      </tr>
    </table>
    <div class="footer">
      <p>Thank you for your payment!</p>
    </div>
  </div>
</body>
</html>`

  // Return a mock jsPDF object for backward compatibility
  return {
    output: (type: string): ArrayBuffer => {
      // Convert HTML to buffer for email attachment
      return Buffer.from(receiptHTML).buffer
    }
  }
}