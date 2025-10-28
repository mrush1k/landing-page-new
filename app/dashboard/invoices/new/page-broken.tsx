/**
 * Optimized Invoice Creation Page
 * Uses unified API, instant skeletons, and lazy loading
 * Target: <1s initial load, <50KB bundle size
 */

"use client"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

// Instant UI components (small bundles)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  InstantInvoiceSkeleton, 
  ProgressiveInvoiceLoader,
  CustomerSelectionSkeleton,
  FormFieldSkeleton 
} from '@/components/invoice-skeletons'

// Essential icons only
import { Plus, Save, Send, FileText } from 'lucide-react'

// Keep essential imports static for initial render
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Only lazy load the heaviest components if they exist
// const CustomerDialog = dynamic(() => import('@/components/invoices/dialogs/CustomerDialog'), {
//   loading: () => <div>Loading...</div>
// })

// Types for unified API response
interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  invoiceCount?: number
}

interface SavedItem {
  id: string
  name: string
  description?: string
  rate: number
  unit?: string
  category?: string
}

interface InvoiceCreationData {
  customers: Customer[]
  nextInvoiceNumber: string
  savedItems: SavedItem[]
  serviceTemplates: SavedItem[]
  metadata: {
    customersCount: number
    savedItemsCount: number
    templatesCount: number
    nextNumber: number
  }
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function OptimizedNewInvoicePage() {
  const router = useRouter()
  const { user, getAuthHeaders } = useAuth()
  const { toast } = useToast()

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Data from unified API
  const [creationData, setCreationData] = useState<InvoiceCreationData | null>(null)

  // Form state (minimal)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ])

  // Modal states
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showSavedItemsDialog, setShowSavedItemsDialog] = useState(false)

  /**
   * Load all invoice creation data in single API call
   */
  const loadCreationData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices/creation-data', { headers })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: InvoiceCreationData = await response.json()
      
      setCreationData(data)
      setInvoiceNumber(data.nextInvoiceNumber)
      
      // Set default due date (30 days from now)
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate)
      
    } catch (error) {
      console.error('Failed to load creation data:', error)
      toast({
        title: "Error",
        description: "Failed to load invoice data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInitialLoading(false)
    }
  }, [getAuthHeaders, toast])

  // Load data on mount
  useEffect(() => {
    loadCreationData()
  }, [loadCreationData])

  /**
   * Optimized calculations with useMemo
   */
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const tax = subtotal * 0.1 // 10% tax
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }, [items])

  /**
   * Add new item row
   */
  const addItem = useCallback(() => {
    const newId = (items.length + 1).toString()
    setItems(prev => [...prev, {
      id: newId,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }])
  }, [items.length])

  /**
   * Update item with optimized re-render
   */
  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate
        }
        return updated
      }
      return item
    }))
  }, [])

  /**
   * Remove item
   */
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  /**
   * Save invoice (optimized)
   */
  const saveInvoice = useCallback(async () => {
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this invoice.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const headers = await getAuthHeaders()
      const invoiceData = {
        invoiceNumber,
        customerId: selectedCustomer.id,
        invoiceDate: invoiceDate.toISOString(),
        dueDate: dueDate?.toISOString(),
        items: items.filter(item => item.description.trim()),
        subtotal: calculations.subtotal,
        taxAmount: calculations.tax,
        totalAmount: calculations.total,
        currency: 'USD',
        status: 'draft'
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        throw new Error('Failed to save invoice')
      }

      const savedInvoice = await response.json()
      
      toast({
        title: "Success",
        description: "Invoice saved successfully!",
      })
      
      router.push(`/dashboard/invoices/${savedInvoice.id}`)
      
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [selectedCustomer, invoiceNumber, invoiceDate, dueDate, items, calculations, getAuthHeaders, toast, router])

  /**
   * Render form content (memoized for performance)
   */
  const FormContent = useMemo(() => (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          <p className="text-gray-600">Invoice #{invoiceNumber}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={saveInvoice} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate.toISOString().split('T')[0]}
                onChange={(e) => setInvoiceDate(new Date(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setDueDate(new Date(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Customer
            <Button 
              size="sm" 
              onClick={() => toast({ title: "Feature", description: "Add customer dialog coming soon" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Customer
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCustomer ? (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">{selectedCustomer.name}</h4>
              <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
              {selectedCustomer.address && (
                <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
              )}
            </div>
          ) : (
            <Suspense fallback={<CustomerSelectionSkeleton />}>
              <div className="space-y-2">
                <Label>Select Customer</Label>
                {creationData?.customers && creationData.customers.length > 0 ? (
                  <div className="grid gap-2">
                    {creationData.customers.slice(0, 5).map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No customers found. Add a customer to get started.</p>
                )}
              </div>
            </Suspense>
          )}
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Items
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-right font-medium">
                    {formatCurrency(item.quantity * item.rate)}
                  </div>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>{formatCurrency(calculations.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calculations.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={saveInvoice} disabled={isSaving}>
          <FileText className="h-4 w-4 mr-2" />
          Save Invoice
        </Button>
      </div>
    </div>
  ), [
    invoiceNumber, selectedCustomer, creationData, items, calculations, 
    isSaving, saveInvoice, addItem, updateItem, removeItem, router
  ])

  // Main render with progressive loading
  return (
    <ProgressiveInvoiceLoader isLoading={isInitialLoading}>
      {FormContent}
      
      {/* Dialogs would go here when components are available */}
    </ProgressiveInvoiceLoader>
  )
}