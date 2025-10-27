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

    // Single query with all conditions using raw SQL for better performance
    const [paidInvoicesRaw, outstandingInvoicesRaw] = await Promise.all([
      // Paid invoices for the year with monthly aggregation
      withRetry(() => 
        prisma.$queryRaw<Array<{month: number, total: number}>>`
          SELECT 
            EXTRACT(MONTH FROM "updatedAt")::integer as month,
            SUM("total")::float as total
          FROM "Invoice"
          WHERE "userId" = ${user.id}
            AND "status" = 'PAID'
            AND "deletedAt" IS NULL
            AND "updatedAt" >= ${startDate}
            AND "updatedAt" < ${endDate}
          GROUP BY EXTRACT(MONTH FROM "updatedAt")
          ORDER BY month
        `
      ),
      // Outstanding invoices (overdue and pending)
      withRetry(() =>
        prisma.$queryRaw<Array<{status: string, count: number, total: number}>>`
          SELECT 
            CASE 
              WHEN "dueDate" < ${currentDate} THEN 'overdue'
              ELSE 'pending'
            END as status,
            COUNT(*)::integer as count,
            SUM("total")::float as total
          FROM "Invoice"
          WHERE "userId" = ${user.id}
            AND "deletedAt" IS NULL
            AND "status" IN ('SENT', 'READ')
          GROUP BY (CASE WHEN "dueDate" < ${currentDate} THEN 'overdue' ELSE 'pending' END)
        `
      )
    ])

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(year, index).toLocaleString('default', { month: 'short' }),
      income: 0,
      year: year
    }))

    // Populate monthly data from query results
    paidInvoicesRaw.forEach(row => {
      if (row.month >= 1 && row.month <= 12) {
        monthlyData[row.month - 1].income = Number(row.total || 0)
      }
    })

    // Process outstanding balances
    const overdueData = outstandingInvoicesRaw.find(row => row.status === 'overdue') || { count: 0, total: 0 }
    const pendingData = outstandingInvoicesRaw.find(row => row.status === 'pending') || { count: 0, total: 0 }

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