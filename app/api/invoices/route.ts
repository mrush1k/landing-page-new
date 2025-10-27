import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'

import { prisma, withRetry } from '@/lib/prisma'

// Helper: resolve database user (try id -> fallback to email)
async function resolveDbUser(supabaseUser: any) {
  if (!supabaseUser) return null
  let dbUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } })
  if (!dbUser && supabaseUser.email) {
    dbUser = await prisma.user.findUnique({ where: { email: supabaseUser.email } })
  }
  return dbUser
}

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If no DATABASE_URL is configured, return empty invoices array
    if (!process.env.DATABASE_URL) {
      console.warn('Returning empty invoices list - DATABASE_URL not configured')
      return NextResponse.json([])
    }

    const dbUser = await resolveDbUser(user)
    if (!dbUser) {
      // No DB user found - behaves as no invoices
      return NextResponse.json([])
    }

    // Get pagination params from query
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Add cache headers for better performance  
    const headers = new Headers({
      'Cache-Control': 'private, max-age=180, stale-while-revalidate=60',
      'Content-Type': 'application/json'
    })

    // Optimized query with selective field fetching, pagination and retry logic
    const invoices = await withRetry(() =>
      prisma.invoice.findMany({
        where: {
          userId: dbUser.id,
          deletedAt: null, // Only show non-deleted invoices
        },
        select: {
        id: true,
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        currency: true,
        subtotal: true,
        taxAmount: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        // Use count instead of loading full arrays
        _count: {
          select: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
    )

    // Convert Decimal to number for JSON serialization
    const serializedInvoices = invoices.map(invoice => ({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
    }))

    return NextResponse.json(serializedInvoices, { headers })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    )
    const total = subtotal + (data.taxAmount || 0)

    const dbUser = await resolveDbUser(user)
    if (!dbUser) {
      // Try to create a DB user to attach invoices to (handle OAuth flows)
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || '',
            username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            country: 'US',
            currency: 'USD',
            displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          },
        })
      } catch (e) {
        // ignore unique errors
      }
    }

    const finalDbUser = (await resolveDbUser(user))
    if (!finalDbUser) {
      return NextResponse.json({ error: 'User account not properly set up' }, { status: 400 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: finalDbUser.id,
        customerId: data.customerId,
        number: data.number,
        issueDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        currency: data.currency,
        subtotal,
        taxAmount: data.taxAmount || 0,
        taxInclusive: data.taxInclusive || false,
        total: data.total,
        status: data.status,
        poNumber: data.poNumber,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    // Convert Decimal to number for JSON serialization
    const serializedInvoice = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      items: invoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      payments: invoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }

    return NextResponse.json(serializedInvoice)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}