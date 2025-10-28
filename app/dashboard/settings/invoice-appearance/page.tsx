"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import SaveButton from '@/components/settings/SaveButton'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'

export default function InvoiceAppearanceSettingsPage() {
  const { userProfile: user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Invoice appearance settings state
  const [invoiceAppearanceData, setInvoiceAppearanceData] = useState({
    invoiceTemplate: 'default',
    invoiceColorScheme: 'blue',
    alwaysCcSelf: false,
    defaultPaymentInstructions: ''
  })

  useEffect(() => {
    if (user) {
      setInvoiceAppearanceData({
        invoiceTemplate: user.invoiceTemplate || 'default',
        invoiceColorScheme: user.invoiceColorScheme || 'blue',
        alwaysCcSelf: user.alwaysCcSelf || false,
        defaultPaymentInstructions: user.defaultPaymentInstructions || ''
      })
    }
  }, [user])

  const handleInvoiceAppearanceSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceTemplate: invoiceAppearanceData.invoiceTemplate,
          invoiceColorScheme: invoiceAppearanceData.invoiceColorScheme,
          alwaysCcSelf: invoiceAppearanceData.alwaysCcSelf,
          defaultPaymentInstructions: invoiceAppearanceData.defaultPaymentInstructions || null
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUserProfile(updatedUser)
        toast({
          title: "Invoice Appearance Updated",
          description: "Your invoice appearance settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to update invoice appearance settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice appearance settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Invoice Templates" subtitle="Choose from pre-designed invoice templates">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'default', label: 'Default', description: 'Clean and professional template' },
              { value: 'modern', label: 'Modern', description: 'Contemporary design with bold headers' },
              { value: 'minimal', label: 'Minimal', description: 'Simple and clean design' }
            ].map((template) => (
              <button
                key={template.value}
                onClick={() => setInvoiceAppearanceData(prev => ({ ...prev, invoiceTemplate: template.value }))}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-gray-50 ${
                  invoiceAppearanceData.invoiceTemplate === template.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <h4 className="font-medium">{template.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                {invoiceAppearanceData.invoiceTemplate === template.value && (
                  <Badge className="mt-2">Active</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Color Scheme" subtitle="Choose a color scheme for your invoices">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
              { value: 'green', label: 'Green', color: 'bg-green-500' },
              { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
              { value: 'red', label: 'Red', color: 'bg-red-500' }
            ].map((colorScheme) => (
              <button
                key={colorScheme.value}
                onClick={() => setInvoiceAppearanceData(prev => ({ ...prev, invoiceColorScheme: colorScheme.value }))}
                className={`p-3 border-2 rounded-lg text-center transition-all hover:bg-gray-50 ${
                  invoiceAppearanceData.invoiceColorScheme === colorScheme.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 ${colorScheme.color} rounded mx-auto mb-2`}></div>
                <span className="text-sm font-medium">{colorScheme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Email Settings" subtitle="Configure default email behavior">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium">Always CC Myself</h4>
              <p className="text-sm text-gray-600">Automatically CC yourself on all invoice emails</p>
            </div>
            <Button
              variant={invoiceAppearanceData.alwaysCcSelf ? "default" : "outline"}
              size="sm"
              onClick={() => setInvoiceAppearanceData(prev => ({
                ...prev,
                alwaysCcSelf: !prev.alwaysCcSelf
              }))}
              className="flex-shrink-0 w-full sm:w-auto"
            >
              {invoiceAppearanceData.alwaysCcSelf ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Default Payment Instructions" subtitle="Set default payment instructions for all new invoices">
        <div>
          <Textarea
            value={invoiceAppearanceData.defaultPaymentInstructions}
            onChange={(e) => setInvoiceAppearanceData(prev => ({ 
              ...prev, 
              defaultPaymentInstructions: e.target.value 
            }))}
            placeholder="Enter default payment instructions (e.g., bank account details, payment terms)"
            rows={4}
          />
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <SaveButton onClick={handleInvoiceAppearanceSave} disabled={loading} loading={loading}>
          Save Invoice Appearance
        </SaveButton>
      </div>
    </div>
  )
}