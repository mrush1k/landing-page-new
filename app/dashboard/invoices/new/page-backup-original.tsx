"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, UserPlus, FileText, PenTool, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Customer, InvoiceItem } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { CURRENCIES, TAX_PRESETS, PAYMENT_TERMS } from '@/lib/constants/invoice-constants'
import { CustomerFormData, SavedItem, emptyCustomerFormData } from '@/lib/types/invoice-types'
import { useInvoiceCalculations } from '@/hooks/useInvoiceCalculations'
import { generateBusinessInfo } from '@/lib/utils/invoice-helpers'

// Component imports
import { InvoiceHeader } from '@/components/invoices/InvoiceHeader'
import { ItemRow } from '@/components/invoices/ItemRow'
import { AdditionalInfoCard } from '@/components/invoices/AdditionalInfoCard'
import { CustomerDialog } from '@/components/invoices/dialogs/CustomerDialog'
import { SavedItemsDialog } from '@/components/invoices/dialogs/SavedItemsDialog'
import { SignatureModal } from '@/components/invoices/dialogs/SignatureModal'

export default function NewInvoicePage() {
  const router = useRouter()
  const { user, userProfile, getAuthHeaders } = useAuth()
  const { toast } = useToast()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('')
  
  // Customer creation modal state
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showSavedItemsDialog, setShowSavedItemsDialog] = useState(false)
  const [customerFormData, setCustomerFormData] = useState<CustomerFormData>(emptyCustomerFormData)
  
  // Header Section State
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [currency, setCurrency] = useState('')
  
  // Customer & Business Info State
  const [customerId, setCustomerId] = useState('')
  const [businessInfo, setBusinessInfo] = useState('')
  
  // Items Section State
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { name: '', description: '', quantity: undefined, unitPrice: undefined }
  ])
  
  // Tax & Discount Section State
  const [taxRate, setTaxRate] = useState(0)
  const [customTaxRate, setCustomTaxRate] = useState('')
  const [taxInclusive, setTaxInclusive] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  
  // Signature Section State
  const [mySignature, setMySignature] = useState('')
  const [clientSignature, setClientSignature] = useState('')
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureType, setSignatureType] = useState<'my' | 'client'>('my')
  const [mySignatureFile, setMySignatureFile] = useState<string | null>(null)
  const [clientSignatureFile, setClientSignatureFile] = useState<string | null>(null)
  
  // Additional fields
  const [poNumber, setPoNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<number | null>(null)

  // Use the calculations hook for all invoice calculations
  const calculations = useInvoiceCalculations({
    items,
    taxRate,
    taxInclusive,
    discountType,
    discountAmount,
    currency: currency || userProfile?.currency || 'USD',
  })

  useEffect(() => {
    if (user) {
      fetchCustomers()
      fetchSavedItems()
      generateNextInvoiceNumber()
    }
  }, [user])

  useEffect(() => {
    if (userProfile) {
      loadBusinessInfo()
      // Set default currency from user profile
      if (userProfile.currency && !currency) {
        setCurrency(userProfile.currency)
      }
    }
  }, [userProfile, user])

  const fetchCustomers = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/customers', { headers })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchSavedItems = async () => {
    // Mock saved items for now - implement API endpoint later
    setSavedItems([
      { id: '1', name: 'Consultation', description: 'Business consultation services', unitPrice: 150 },
      { id: '2', name: 'Design Work', description: 'Graphic design and branding', unitPrice: 100 },
      { id: '3', name: 'Development', description: 'Web development services', unitPrice: 125 },
    ])
  }

  const loadBusinessInfo = () => {
    if (userProfile) {
      const info = generateBusinessInfo(userProfile, user?.email)
      setBusinessInfo(info)
    }
  }

  const generateNextInvoiceNumber = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices/next-number', { headers })
      if (response.ok) {
        const data = await response.json()
        const nextNumber = data.nextNumber
        setNextInvoiceNumber(nextNumber)
        setInvoiceNumber(nextNumber)
      }
    } catch (error) {
      console.error('Error generating invoice number:', error)
      setInvoiceNumber('#0001')
      setNextInvoiceNumber('#0001')
    }
  }

  const resetCustomerForm = () => {
    setCustomerFormData(emptyCustomerFormData)
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...customerFormData, userId: user?.id }),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        await fetchCustomers()
        setCustomerId(newCustomer.id)
        setShowCustomerDialog(false)
        resetCustomerForm()
        toast({
          title: 'Customer created',
          description: `${customerFormData.displayName} has been added successfully.`,
        })
      } else {
        throw new Error('Failed to create customer')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const addItem = () => {
    setItems([...items, { name: '', description: '', quantity: undefined, unitPrice: undefined }])
  }

  const addSavedItem = (savedItem: SavedItem) => {
    setItems([...items, { 
      name: savedItem.name, 
      description: savedItem.description, 
      quantity: 1, 
      unitPrice: savedItem.unitPrice 
    }])
    setShowSavedItemsDialog(false)
    toast({
      title: 'Item added',
      description: `${savedItem.name} has been added to the invoice.`,
    })
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const validateForm = () => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return false
    }
    
    if (!currency) {
      toast({
        title: "Error", 
        description: "Please select a currency",
        variant: "destructive",
      })
      return false
    }
    
    if (!invoiceDate) {
      toast({
        title: "Error",
        description: "Please select an invoice date",
        variant: "destructive",
      })
      return false
    }
    
    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive",
      })
      return false
    }

    const validItems = items.filter(item => 
      item.description && item.quantity && item.unitPrice
    )
    
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one invoice item with description, quantity, and unit price",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const saveInvoice = async (status: 'DRAFT' | 'SENT') => {
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const validItems = items.filter(item => 
        item.description && item.quantity && item.unitPrice
      )

      const invoiceData = {
        number: invoiceNumber,
        customerId,
        currency,
        invoiceDate: invoiceDate!.toISOString(),
        dueDate: dueDate!.toISOString(),
        poNumber: poNumber || null,
        notes: notes || null,
        subtotal: calculations.subtotal,
        taxAmount: calculations.tax,
        taxInclusive,
        total: calculations.total,
        status,
        mySignature: mySignature || mySignatureFile || null,
        clientSignature: clientSignature || clientSignatureFile || null,
        items: validItems.map(item => ({
          name: item.name || '',
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          total: calculations.getItemTotal(item.quantity, item.unitPrice)
        }))
      }

      const headers = await getAuthHeaders()
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const invoice = await response.json()
        toast({
          title: "Success",
          description: `Invoice ${status === 'DRAFT' ? 'saved as draft' : 'sent to customer'}`,
        })
        router.push(`/dashboard/invoices/${invoice.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save invoice')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save invoice",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const previewPDF = () => {
    try {
      // Dynamically import jsPDF and generator to avoid SSR issues
      // @ts-ignore
      const { generateInvoicePDF } = require('@/lib/pdf-generator');
      // Build a minimal invoice object from current form state
      const invoiceData = {
        number: invoiceNumber || nextInvoiceNumber || 'Preview',
        issueDate: invoiceDate ? invoiceDate.toISOString() : new Date().toISOString(),
        dueDate: dueDate ? dueDate.toISOString() : new Date().toISOString(),
        currency: currency || 'USD',
        customer: customers.find(c => c.id === customerId) || {},
        items: items.map(item => ({
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0
        })),
        notes,
        poNumber,
        status: 'DRAFT',
        total: items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitPrice || 0)), 0),
        taxRate: taxRate || 0,
        discountAmount: discountAmount || 0,
        discountType: discountType || 'fixed',
        payments: [],
      };
      // Use userProfile for appearance
      const pdf = generateInvoicePDF(invoiceData, userProfile);
      // Get PDF as Blob
      const blob = pdf.output('blob');
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Optionally revoke after some time
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      toast({
        title: "PDF Preview Error",
        description: "Could not generate PDF preview.",
        variant: "destructive",
      });
    }
  }

  const handlePaymentTermsChange = (days: number) => {
    setSelectedPaymentTerms(days)
    if (invoiceDate) {
      const newDueDate = new Date(invoiceDate)
      newDueDate.setDate(newDueDate.getDate() + days)
      setDueDate(newDueDate)
    }
  }
  
  // Handle signature file uploads
  const handleSignatureUpload = (type: 'my' | 'client', file: File) => {
    if (!file) return
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPEG)",
        variant: "destructive",
      })
      return
    }
    
    // Create a URL for the image file
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === 'my') {
        setMySignatureFile(result)
      } else {
        setClientSignatureFile(result)
      }
      
      toast({
        title: "Signature uploaded",
        description: `${type === 'my' ? 'Your' : 'Client'} signature has been uploaded.`,
      })
    }
    reader.readAsDataURL(file)
  }
  
  // References for file inputs
  const mySignatureInputRef = useRef<HTMLInputElement>(null)
  const clientSignatureInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="container-mobile space-y-4 sm:space-y-6">
      {/* Header */}
      <InvoiceHeader
        onSaveDraft={() => saveInvoice('DRAFT')}
        onPreview={previewPDF}
        onSend={() => saveInvoice('SENT')}
        loading={loading}
      />

      <div className="space-y-4 sm:space-y-6">
        {/* A. Header Section */}
        <Card className="mobile-card">
          <CardHeader className="mobile-padding">
            <CardTitle className="mobile-h2">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="mobile-padding space-y-4">
            <div className="mobile-form-row">
              <div className="mobile-form-group">
                <Label htmlFor="invoiceNumber" className="mobile-text font-medium">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={nextInvoiceNumber}
                  className="mobile-input"
                />
              </div>
              
              <div className="mobile-form-group">
                <Label className="mobile-text font-medium">Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mobile-input justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mobile-form-group">
                <Label className="mobile-text font-medium">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mobile-input justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Payment Terms</Label>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_TERMS.map((term) => (
                    <Button
                      key={term.label}
                      variant={selectedPaymentTerms === term.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePaymentTermsChange(term.value)}
                      className={`text-xs ${
                        selectedPaymentTerms === term.value 
                          ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                          : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      }`}
                    >
                      {term.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* B. Customer & Business Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerId">Customer</Label>
                <div className="flex gap-2">
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={customers.length === 0 ? "No customers found" : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                          No customers found.<br />
                          Create your first customer to get started.
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.displayName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowCustomerDialog(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                placeholder="Your business details..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* C. Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700 mb-4">
              <div className="col-span-2">Item Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Line Total</div>
              <div className="col-span-1">Action</div>
            </div>
            
            {/* Items */}
            {items.map((item, index) => (
              <ItemRow
                key={index}
                item={item}
                index={index}
                onUpdate={updateItem}
                onRemove={removeItem}
                formatCurrency={calculations.formatCurrency}
                getItemTotal={calculations.getItemTotal}
                canRemove={items.length > 1}
              />
            ))}
            
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={addItem}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
              
              <Button 
                variant="outline" 
                className="flex-1 bg-gray-800 text-white hover:bg-gray-900"
                onClick={() => setShowSavedItemsDialog(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Select Saved
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* D. Tax & Discount Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tax, Discount & Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Tax Rate</Label>
                  <Select value={taxRate.toString()} onValueChange={(value) => {
                    if (value === 'custom') {
                      setTaxRate(parseFloat(customTaxRate) || 0)
                    } else {
                      setTaxRate(parseFloat(value))
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.value?.toString() || 'custom'}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {taxRate === 0 && (
                  <div>
                    <Label htmlFor="customTaxRate">Custom Tax Rate (%)</Label>
                    <Input
                      id="customTaxRate"
                      type="number"
                      min="0"
                      step="0.1"
                      value={customTaxRate}
                      onChange={(e) => {
                        setCustomTaxRate(e.target.value)
                        setTaxRate(parseFloat(e.target.value) || 0)
                      }}
                      placeholder="Enter tax rate"
                    />
                  </div>
                )}

                {taxRate > 0 && (
                  <div>
                    <Label>GST/Tax Method</Label>
                    <Select value={taxInclusive ? 'inclusive' : 'exclusive'} onValueChange={(value) => setTaxInclusive(value === 'inclusive')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive">Tax Exclusive (add tax on top)</SelectItem>
                        <SelectItem value="inclusive">Tax Inclusive (tax included in prices)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {taxInclusive 
                        ? "Tax is included in your item prices. Tax amount will be calculated as part of the total." 
                        : "Tax will be added on top of your subtotal."}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(value: 'fixed' | 'percentage') => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discountAmount">
                    Discount {discountType === 'percentage' ? '(%)' : `(${currency || 'USD'})`}
                  </Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="font-medium">{calculations.formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Tax ({taxRate}% - {taxInclusive ? 'Inclusive' : 'Exclusive'}):
                </span>
                <span className="font-medium">{calculations.formatCurrency(calculations.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">-{calculations.formatCurrency(calculations.discount)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">{calculations.formatCurrency(calculations.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* E. Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>My Signature (Invoice Creator)</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSignatureType('my')
                      setShowSignatureModal(true)
                    }}>
                      <PenTool className="w-4 h-4 mr-2" />
                      Draw
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => mySignatureInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm">
                      Use Saved
                    </Button>
                    <input 
                      type="file" 
                      ref={mySignatureInputRef} 
                      onChange={(e) => e.target.files && handleSignatureUpload('my', e.target.files[0])} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  {mySignature && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">Signature added ✓</p>
                    </div>
                  )}
                  {mySignatureFile && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <img 
                        src={mySignatureFile} 
                        alt="My signature" 
                        className="max-h-20 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Client Signature (Required on Payment)</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSignatureType('client')
                      setShowSignatureModal(true)
                    }}>
                      <PenTool className="w-4 h-4 mr-2" />
                      Draw
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => clientSignatureInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <input 
                      type="file" 
                      ref={clientSignatureInputRef} 
                      onChange={(e) => e.target.files && handleSignatureUpload('client', e.target.files[0])} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  {clientSignature && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">Client signature added ✓</p>
                    </div>
                  )}
                  {clientSignatureFile && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <img 
                        src={clientSignatureFile} 
                        alt="Client signature" 
                        className="max-h-20 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Client signature is required before marking invoice as Paid
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <AdditionalInfoCard
          poNumber={poNumber}
          setPoNumber={setPoNumber}
          notes={notes}
          setNotes={setNotes}
        />
      </div>

      {/* Dialogs */}
      <CustomerDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        formData={customerFormData}
        setFormData={setCustomerFormData}
        onSubmit={handleCustomerSubmit}
        onCancel={() => {
          setShowCustomerDialog(false)
          resetCustomerForm()
        }}
      />

      <SavedItemsDialog
        open={showSavedItemsDialog}
        onOpenChange={setShowSavedItemsDialog}
        savedItems={savedItems}
        onSelectItem={addSavedItem}
        formatCurrency={calculations.formatCurrency}
      />

      <SignatureModal
        open={showSignatureModal}
        onOpenChange={setShowSignatureModal}
        signatureType={signatureType}
        onSave={(data) => {
          if (signatureType === 'my') setMySignature(data)
          else setClientSignature(data)
        }}
      />
    </div>
  )
}