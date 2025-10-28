/**
 * Simple Invoice Creation Page - Working Version
 * Minimal imports, basic functionality
 */

"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

// Basic UI components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Essential icons
import { Plus, Save, FileText, ArrowLeft } from 'lucide-react'

// Simple types
interface Customer {
  id: string
  name: string
  displayName?: string
  firstName?: string
  lastName?: string
  businessName?: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface CreationData {
  customers: Customer[]
  nextInvoiceNumber: string
  savedItems: any[]
  serviceTemplates: any[]
  metadata: {
    customersCount: number
    savedItemsCount: number
    templatesCount: number
    nextNumber: number
  }
}

// Simple loading skeleton
function SimpleLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { user, getAuthHeaders } = useAuth()
  const { toast } = useToast()

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Data
  const [creationData, setCreationData] = useState<CreationData | null>(null)

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [notes, setNotes] = useState('')

  /**
   * Load creation data - try unified API first, fallback to separate calls
   */
  const loadCreationData = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create an invoice.",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    try {
      const headers = await getAuthHeaders()
      
      // Try unified API first
      try {
        const response = await fetch('/api/invoices/creation-data', { headers })
        
        if (response.ok) {
          const data = await response.json()
          setCreationData(data)
          setInvoiceNumber(data.nextInvoiceNumber)
          
          // Set default due date (30 days from now)
          const defaultDueDate = new Date()
          defaultDueDate.setDate(defaultDueDate.getDate() + 30)
          setDueDate(defaultDueDate.toISOString().split('T')[0])
          
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.log('Unified API failed, trying fallback...')
      }

      // Fallback to separate API calls
      const [customersRes, nextNumberRes] = await Promise.all([
        fetch('/api/customers', { headers }),
        fetch('/api/invoices/next-number', { headers })
      ])

      const customers = customersRes.ok ? await customersRes.json() : []
      const nextNumberData = nextNumberRes.ok ? await nextNumberRes.json() : null

      const fallbackData: CreationData = {
        customers: customers,
        nextInvoiceNumber: nextNumberData?.nextNumber || 'INV-0001',
        savedItems: [],
        serviceTemplates: [],
        metadata: {
          customersCount: customers.length,
          savedItemsCount: 0,
          templatesCount: 0,
          nextNumber: 1
        }
      }

      setCreationData(fallbackData)
      setInvoiceNumber(fallbackData.nextInvoiceNumber)

      // Set default due date
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split('T')[0])

    } catch (error) {
      console.error('Failed to load creation data:', error)
      toast({
        title: "Error",
        description: "Failed to load invoice data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders, toast, router])

  // Load data on mount
  useEffect(() => {
    loadCreationData()
  }, [loadCreationData])

  /**
   * Calculate totals
   */
  const calculations = React.useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const tax = subtotal * 0.1 // 10% tax
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }, [items])

  /**
   * Add new item
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
   * Update item
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
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }, [items.length])

  /**
   * Save invoice
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

    const validItems = items.filter(item => item.description.trim())
    if (validItems.length === 0) {
      toast({
        title: "Items Required", 
        description: "Please add at least one item to the invoice.",
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
        invoiceDate,
        dueDate,
        items: validItems,
        subtotal: calculations.subtotal,
        taxAmount: calculations.tax,
        totalAmount: calculations.total,
        notes,
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
  }, [selectedCustomer, invoiceNumber, invoiceDate, dueDate, items, calculations, notes, getAuthHeaders, toast, router])

  // Show loading state
  if (isLoading) {
    return <SimpleLoadingSkeleton />
  }

  // Main form
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Invoice</h1>
            <p className="text-gray-600">Invoice #{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={saveInvoice} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Invoice'}
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
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">
                  {selectedCustomer.displayName || selectedCustomer.name || 
                   `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() ||
                   selectedCustomer.businessName}
                </h4>
                <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                {selectedCustomer.address && (
                  <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCustomer(null)}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Customer</Label>
              {creationData?.customers && creationData.customers.length > 0 ? (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {creationData.customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="font-medium">
                        {customer.displayName || customer.name || 
                         `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                         customer.businessName}
                      </div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No customers found.</p>
                  <Button 
                    className="mt-2"
                    onClick={() => router.push('/dashboard/customers')}
                  >
                    Add Customer
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
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
                    placeholder="Item description"
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
                    step="0.01"
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

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes or terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
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
          {isSaving ? 'Saving...' : 'Save Invoice'}
        </Button>
      </div>
    </div>
  )
}