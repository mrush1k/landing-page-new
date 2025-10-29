/**
 * Simple Invoice List Page - Working Version
 * Basic functionality without complex imports
 */

"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
 * Simple Invoice List Skeleton
 */
function SimpleInvoiceListSkeleton() {
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

export default function InvoicesPage() {
  const { user, getAuthHeaders } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  /**
   * Load invoices with error handling
   */
  const loadInvoices = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices?limit=50', { 
        headers,
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load invoices:', error)
      setInvoices([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders])

  // Load invoices on mount
  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  /**
   * Filter invoices with useMemo
   */
  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice => 
        (invoice.number || '').toLowerCase().includes(searchLower) ||
        (invoice.customer?.displayName || '').toLowerCase().includes(searchLower)
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
   * Format date safely
   */
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }, [])

  // Show loading state
  if (isLoading) {
    return <SimpleInvoiceListSkeleton />
  }

  // Main content
  return (
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
                      <h3 className="font-medium">{invoice.number || 'No Number'}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status || 'draft'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {invoice.customer?.displayName || 'No Customer'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(invoice.total || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button size="sm" variant="ghost" title="View Invoice">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                      <Button size="sm" variant="ghost" title="Edit Invoice">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      title="Download PDF"
                      onClick={() => {
                        window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      title="Send Email"
                      onClick={() => {
                        console.log('Send email for invoice:', invoice.id)
                        // TODO: Implement email functionality
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

      {/* Refresh button for debugging */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={loadInvoices} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
    </div>
  )
}