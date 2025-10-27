import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth using server client
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Add cache headers for better performance
    const headers = new Headers({
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
      'Content-Type': 'application/json'
    })

    // Single optimized query to get all data at once
    const startDate = new Date(year, 0, 1) // January 1st of the year
    const endDate = new Date(year + 1, 0, 1) // January 1st of the next year
    const currentDate = new Date()

    // Optimized queries using Prisma methods (safer than raw SQL)
    const [paidInvoices, overdueInvoices, pendingInvoices] = await Promise.all([
      // Paid invoices for the year
      withRetry(() =>
        prisma.invoice.findMany({
          where: {
            userId: user.id,
            status: 'PAID',
            deletedAt: null,
            updatedAt: {
              gte: startDate,
              lt: endDate
            }
          },
          select: {
            total: true,
            updatedAt: true
          }
        })
      ),
      // Overdue invoices
      withRetry(() =>
        prisma.invoice.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            status: {
              in: ['SENT', 'READ']
            },
            dueDate: {
              lt: currentDate
            }
          },
          select: {
            total: true
          }
        })
      ),
      // Pending invoices
      withRetry(() =>
        prisma.invoice.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            status: {
              in: ['SENT', 'READ']
            },
            dueDate: {
              gte: currentDate
            }
          },
          select: {
            total: true
          }
        })
      )
    ])

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(year, index).toLocaleString('default', { month: 'short' }),
      income: 0,
      year: year
    }))

    // Process paid invoices by month
    paidInvoices.forEach(invoice => {
      const monthIndex = new Date(invoice.updatedAt).getMonth()
      monthlyData[monthIndex].income += Number(invoice.total || 0)
    })

    // Process outstanding balances
    const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    
    const overdueData = { count: overdueInvoices.length, total: overdueTotal }
    const pendingData = { count: pendingInvoices.length, total: pendingTotal }

    const response = {
      monthlyData,
      outstandingBalances: {
        overdue: {
          count: Number(overdueData.count || 0),
          total: Number(overdueData.total || 0)
        },
        pending: {
          count: Number(pendingData.count || 0),
          total: Number(pendingData.total || 0)
        },
        total: Number(overdueData.total || 0) + Number(pendingData.total || 0)
      }
    }

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Error fetching cashflow data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}