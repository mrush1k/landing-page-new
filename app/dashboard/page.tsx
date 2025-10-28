 /**
 * Optimized Dashboard Page
 * Uses new unified API, instant skeletons, and progressive loading
 * Target: <200ms initial load, instant page switching
 */

"use client"

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useFetchOnce } from '@/hooks/use-fetch-once'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { 
  InstantDashboardSkeleton, 
  ProgressiveLoader 
} from '@/components/instant-skeletons'

// Dashboard data interface matching API response
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

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  'PARTIALLY_PAID': 'bg-orange-100 text-orange-800'
} as const

export default function DashboardPage() {
  const { user, userProfile, getAuthHeaders } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoized stats cards to prevent unnecessary re-renders
  const statsCards = useMemo(() => {
    if (!dashboardData?.stats) return []

    const { stats } = dashboardData
    
    return [
      {
        title: 'Total Invoices',
        value: stats.totalInvoices,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Customers',
        value: stats.totalCustomers,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Revenue',
        value: formatCurrency(stats.totalRevenue, userProfile?.currency || 'USD'),
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      },
      {
        title: 'Pending',
        value: formatCurrency(stats.pendingRevenue, userProfile?.currency || 'USD'),
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }, [dashboardData?.stats, userProfile?.currency])

  // Fast data fetching with error handling
  const fetchDashboardData = React.useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const headers = await getAuthHeaders()
      const response = await fetch('/api/dashboard', { 
        headers,
        // Add cache busting for development
        cache: process.env.NODE_ENV === 'development' ? 'no-cache' : 'default'
      })

      if (!response.ok) {
        throw new Error(`Dashboard API error: ${response.status}`)
      }

      const data: DashboardData = await response.json()
      setDashboardData(data)

    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard')
      
      // Set empty state to prevent complete failure
      setDashboardData({
        recentInvoices: [],
        stats: {
          totalInvoices: 0,
          totalCustomers: 0,
          totalEstimates: 0,
          overdueInvoices: 0,
          paidInvoices: 0,
          totalRevenue: 0,
          pendingRevenue: 0
        },
        recentActivity: []
      })
    } finally {
      setLoading(false)
    }
  }, [user, getAuthHeaders])

  // Fetch data on mount - prevent double fetch in strict mode
  useFetchOnce(fetchDashboardData, [fetchDashboardData])

  // Early return for unauthenticated state
  if (!user) {
    return <InstantDashboardSkeleton />
  }

  // Error state with retry option
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Dashboard Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProgressiveLoader
      loading={loading}
      skeleton={<InstantDashboardSkeleton />}
      minLoadTime={200} // Prevent flash of loading state
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back{userProfile?.firstName ? `, ${userProfile.firstName}` : ''}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/invoices">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData?.recentInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices yet</p>
                  <Button asChild className="mt-2">
                    <Link href="/dashboard/invoices/new">Create Your First Invoice</Link>
                  </Button>
                </div>
              ) : (
                dashboardData?.recentInvoices.map((invoice) => {
                  const isOverdue = isPast(new Date(invoice.dueDate)) && invoice.status !== 'PAID'
                  
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {isOverdue ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">#{invoice.number}</p>
                          <p className="text-sm text-gray-600">{invoice.customer.displayName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total, userProfile?.currency || 'USD')}</p>
                        <Badge className={`text-xs ${statusColors[invoice.status as keyof typeof statusColors] || statusColors.DRAFT}`}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/invoices/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Invoice
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/customers">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Customers
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/estimates/new">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Estimate
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/reports">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 text-sm">
                    <div className="p-1 rounded-full bg-gray-100">
                      {activity.type === 'invoice' && <FileText className="h-3 w-3" />}
                      {activity.type === 'customer' && <Users className="h-3 w-3" />}
                      {activity.type === 'estimate' && <FileText className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-gray-600 ml-1">{activity.details}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(activity.date), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProgressiveLoader>
  )
}