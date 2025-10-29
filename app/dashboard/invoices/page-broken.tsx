/**
 * Optimized Invoice List Page  
 * Uses instant skeletons and optimized loading
 * Target: <1s load time, instant UI feedback
 */

"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  InstantDashboardSkeleton, 
  ProgressiveLoader 
} from '@/components/instant-skeletons'
import { Search, Plus, Eye, Edit, Download, Mail } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

// Types
interface Invoice {
  id: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  total: number
  customer: {
    id: string
    displayName: string
  }
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  'partially-paid': 'bg-orange-100 text-orange-800'
}

/**
 * Invoice List Skeleton - matches the actual layout
 */
function InvoiceListSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Invoice cards */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-4">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OptimizedInvoicesPage() {
  const { user, getAuthHeaders } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  /**
   * Optimized invoice loading with caching
   */
  const loadInvoices = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices?limit=50', { 
        headers,
        // Add cache headers for browser caching
        cache: 'no-cache' // Force fresh on user action
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error('Failed to load invoices:', error)
      // Show error toast or fallback
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders])

  // Load invoices on mount
  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  /**
   * Optimized filtering with useMemo
   */
  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.number.toLowerCase().includes(searchLower) ||
        invoice.customer.displayName.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    return filtered
  }, [invoices, searchTerm, statusFilter])

  /**
   * Get status badge color
   */
  const getStatusColor = useCallback((status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.draft
  }, [])

  /**
   * Format date for display
   */
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }, [])

  /**
   * Main content (memoized for performance)
   */
  const InvoiceContent = useMemo(() => (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-600">{filteredInvoices.length} invoices found</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No invoices match your filters' 
                  : 'No invoices found. Create your first invoice to get started.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/dashboard/invoices/new" className="mt-4 inline-block">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-4">
                      <h3 className="font-medium">{invoice.number}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {invoice.customer.displayName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {formatDate(invoice.dueDate)}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        // Handle PDF download
                        window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        // Handle email send
                        console.log('Send email for invoice:', invoice.id)
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  ), [filteredInvoices, searchTerm, statusFilter, getStatusColor, formatDate])

  // Progressive loading with skeleton
  return (
    <ProgressiveLoader 
      loading={isLoading}
      skeleton={<div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}</div>}
    >
      {InvoiceContent}
    </ProgressiveLoader>
  )
}