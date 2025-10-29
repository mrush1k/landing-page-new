import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FastUserCache } from '@/lib/fast-user-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Unified Invoice Creation Data API
 * Fetches customers, next invoice number, and saved items in single optimized request
 * Target: <200ms response time with caching
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Use same auth pattern as other APIs
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If no DATABASE_URL is configured, return empty data
    if (!process.env.DATABASE_URL) {
      console.warn('Returning empty creation data - DATABASE_URL not configured')
      return NextResponse.json({
        customers: [],
        nextInvoiceNumber: 'INV-0001',
        savedItems: [],
        serviceTemplates: [],
        metadata: { customersCount: 0, savedItemsCount: 0, templatesCount: 0, nextNumber: 1 }
      })
    }

    // Fast user resolution
    const { resolveDbUserFast } = await import('@/lib/fast-user-cache')
    const dbUser = await resolveDbUserFast(user)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const userId = dbUser.id

    // Parallel data fetching for maximum speed
    const [customers, invoiceCount, savedItems, serviceTemplates] = await Promise.all([
      // Customer list with recent activity
      prisma.customer.findMany({
        where: { userId },
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          businessName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          createdAt: true,
          _count: {
            select: { invoices: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: 100 // Limit for performance
      }),

      // Next invoice number calculation
      prisma.invoice.count({
        where: { userId }
      }),

      // Saved invoice items (if any exist)
      prisma.serviceTemplate.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          unitPrice: true,
          quantity: true,
          category: true
        },
        orderBy: { name: 'asc' },
        take: 50 // Most commonly used items
      }),

      // Service templates for quick add
      prisma.serviceTemplate.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          unitPrice: true,
          quantity: true,
          category: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ])

    // Generate next invoice number
    const nextNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`

    // Format response data
    const responseData = {
      customers: customers.map(customer => ({
        id: customer.id,
        name: customer.displayName,
        firstName: customer.firstName,
        lastName: customer.lastName,
        businessName: customer.businessName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country,
        invoiceCount: customer._count.invoices
      })),
      nextInvoiceNumber: nextNumber,
      savedItems: savedItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        rate: Number(item.unitPrice),
        quantity: Number(item.quantity),
        category: item.category
      })),
      serviceTemplates: serviceTemplates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        rate: Number(template.unitPrice),
        quantity: Number(template.quantity),
        category: template.category
      })),
      metadata: {
        customersCount: customers.length,
        savedItemsCount: savedItems.length,
        templatesCount: serviceTemplates.length,
        nextNumber: invoiceCount + 1
      }
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({
      customersHash: customers.map(c => `${c.id}-${c.displayName}`).join(''),
      itemsHash: savedItems.map(i => `${i.id}-${i.name}`).join(''),
      count: invoiceCount
    })
    
    const etag = Buffer.from(dataString).toString('base64').slice(0, 32)
    const clientETag = request.headers.get('if-none-match')

    // Check cache and return 304 if unchanged
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 })
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json(responseData, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'private, max-age=60',
        'X-Response-Time': `${responseTime}ms`,
        'X-Invoice-API': 'unified-v1'
      }
    })

  } catch (error) {
    console.error('Invoice creation data API error:', error)
    return NextResponse.json(
      { error: 'Failed to load invoice creation data' },
      { status: 500 }
    )
  }
}