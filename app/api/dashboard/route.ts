/**
 * Optimized Dashboard API Endpoint
 * Single endpoint that fetches all dashboard data in parallel
 * Replaces multiple separate API calls with one ultra-fast query
 */

import { GET as createGET } from '@/lib/api-handler'
import { dbOperation, QueryBuilders } from '@/lib/db-operations'
import { CacheConfigs } from '@/lib/api-cache'
import { prisma } from '@/lib/prisma'

// Define the dashboard data structure
interface DashboardData {
  recentInvoices: Array<{
    id: string
    number: string
    status: string
    total: number
    dueDate: Date
    updatedAt: Date
    customer: {
      displayName: string
    }
  }>
  stats: {
    totalInvoices: number
    totalCustomers: number
    totalEstimates: number
    overdueInvoices: number
    paidInvoices: number
    totalRevenue: number
    pendingRevenue: number
  }
  recentActivity: Array<{
    id: string
    type: 'invoice' | 'customer' | 'estimate'
    action: string
    date: Date
    details: string
  }>
}

export const GET = createGET(
  async ({ dbUser }) => {
    const userId = dbUser!.id

    // Parallel data fetching with retry logic
    const [recentInvoices, stats, recentActivity] = await dbOperation(
      async () => Promise.all([
      // Recent invoices (only last 10 for dashboard)
      prisma.invoice.findMany({
        ...QueryBuilders.userScoped(prisma.invoice, userId),
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          dueDate: true,
          updatedAt: true,
          customer: {
            select: {
              displayName: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10 // Only recent items for dashboard
      }),

      // Stats in a single optimized query using aggregation
      prisma.$transaction(async (tx) => {
        const [invoiceStats, customerCount, estimateCount] = await Promise.all([
          // Invoice aggregations
          tx.invoice.aggregate({
            where: QueryBuilders.userScoped(prisma.invoice, userId).where,
            _count: { id: true },
            _sum: { total: true }
          }),
          
          // Customer count
          tx.customer.count({
            where: { userId }
          }),
          
          // Estimate count  
          tx.estimate.count({
            where: { userId }
          })
        ])

        const [overdueCount, paidStats] = await Promise.all([
          // Overdue invoices count
          tx.invoice.count({
            where: {
              ...QueryBuilders.userScoped(prisma.invoice, userId).where,
              status: 'OVERDUE'
            }
          }),
          
          // Paid invoice stats
          tx.invoice.aggregate({
            where: {
              ...QueryBuilders.userScoped(prisma.invoice, userId).where,
              status: 'PAID'
            },
            _count: { id: true },
            _sum: { total: true }
          })
        ])

        const totalRevenue = Number(paidStats._sum.total || 0)
        const totalPending = Number(invoiceStats._sum.total || 0) - totalRevenue

        return {
          totalInvoices: invoiceStats._count.id,
          totalCustomers: customerCount,
          totalEstimates: estimateCount,
          overdueInvoices: overdueCount,
          paidInvoices: paidStats._count.id,
          totalRevenue,
          pendingRevenue: totalPending
        }
      }),

      // Recent activity (simplified - using separate queries for type safety)
      Promise.all([
        // Recent invoices activity
        prisma.invoice.findMany({
          ...QueryBuilders.userScoped(prisma.invoice, userId),
          select: {
            id: true,
            number: true,
            updatedAt: true,
            createdAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        }),
        // Recent customers activity  
        prisma.customer.findMany({
          where: { userId },
          select: {
            id: true,
            displayName: true,
            updatedAt: true,
            createdAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 3
        })
      ]).then(([invoices, customers]) => {
        const invoiceActivity = invoices.map(inv => ({
          id: inv.id,
          type: 'invoice' as const,
          action: inv.createdAt.getTime() === inv.updatedAt.getTime() ? 'created' : 'updated',
          date: inv.updatedAt,
          details: `Invoice #${inv.number}`
        }))
        
        const customerActivity = customers.map(cust => ({
          id: cust.id,
          type: 'customer' as const,
          action: cust.createdAt.getTime() === cust.updatedAt.getTime() ? 'created' : 'updated',
          date: cust.updatedAt,
          details: cust.displayName
        }))
        
        return [...invoiceActivity, ...customerActivity]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 8)
      })
    ]),
      { operationName: 'Dashboard data fetch' }
    )

      // Serialize Decimal values for JSON
      const serializedInvoices = recentInvoices.map(invoice => ({
        ...invoice,
        total: Number(invoice.total)
      }))

    const dashboardData: DashboardData = {
      recentInvoices: serializedInvoices,
      stats,
      recentActivity
    }

    return dashboardData
  },
  { cache: CacheConfigs.DYNAMIC }
)