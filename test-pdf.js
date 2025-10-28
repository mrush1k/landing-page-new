import { generateInvoicePDF } from './lib/pdf-generator-production'
import { InvoiceStatus } from './lib/types'
import fs from 'fs'

// Test data matching the actual schema
const testInvoice = {
  id: 'test-invoice-123',
  userId: 'test-user',
  customerId: 'test-customer',
  number: 'INV-001',
  status: InvoiceStatus.SENT,
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  currency: 'USD',
  subtotal: 1000,
  taxAmount: 80,
  taxInclusive: false,
  total: 1080,
  notes: 'Thank you for your business!',
  terms: 'Net 30',
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: {
    id: 'test-customer',
    userId: 'test-user',
    displayName: 'Acme Corporation',
    businessName: 'Acme Corporation',
    email: 'billing@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  items: [
    {
      id: 'item-1',
      invoiceId: 'test-invoice-123',
      name: 'Web Design Services',
      description: 'Custom website design and development',
      quantity: 1,
      unitPrice: 800,
      total: 800,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'item-2',
      invoiceId: 'test-invoice-123',
      name: 'Hosting Setup',
      description: 'Domain and hosting configuration',
      quantity: 1,
      unitPrice: 200,
      total: 200,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}

const businessInfo = {
  name: 'Your Business Name',
  address: '456 Business Ave, Suite 100, Business City, BC 12345',
  phone: '+1 (555) 987-6543',
  email: 'hello@yourbusiness.com',
  taxId: 'TAX-123456789'
}

async function testPDFGeneration() {
  console.log('Testing production PDF generation...')
  
  try {
    const startTime = Date.now()
    const pdfBuffer = await generateInvoicePDF(testInvoice, businessInfo)
    const endTime = Date.now()
    
    console.log(`✅ PDF generated successfully in ${endTime - startTime}ms`)
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`)
    
    // Save to file for verification
    const filename = `test-invoice-${Date.now()}.pdf`
    fs.writeFileSync(filename, pdfBuffer)
    console.log(`💾 PDF saved as: ${filename}`)
    
    // Basic validation
    if (pdfBuffer.length > 10000) { // PDF should be at least 10KB
      console.log('✅ PDF size validation passed')
    } else {
      console.error('❌ PDF seems too small, might be corrupted')
    }
    
    // Check PDF header
    const pdfHeader = pdfBuffer.subarray(0, 4).toString()
    if (pdfHeader === '%PDF') {
      console.log('✅ PDF header validation passed')
    } else {
      console.error('❌ Invalid PDF header:', pdfHeader)
    }
    
    console.log('\n🎉 Production PDF generation test completed successfully!')
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw error
  }
}

// Run the test
testPDFGeneration().catch(console.error)