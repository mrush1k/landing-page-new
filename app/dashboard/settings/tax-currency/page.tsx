"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SaveButton from '@/components/settings/SaveButton'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'

const countries = [
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'CA', name: 'Canada', currency: 'CAD' }
]

const currencies = ['USD', 'AUD', 'NZD', 'GBP', 'CAD', 'EUR']

export default function TaxCurrencySettingsPage() {
  const { userProfile: user, updateUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Tax & Currency settings state
  const [taxCurrencyData, setTaxCurrencyData] = useState({
    country: '',
    currency: '',
    defaultTaxRate: ''
  })
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false)
  const [oldCurrency, setOldCurrency] = useState('')

  useEffect(() => {
    if (user) {
      setTaxCurrencyData({
        country: user.country || '',
        currency: user.currency || '',
        defaultTaxRate: user.defaultTaxRate?.toString() || ''
      })
    }
  }, [user])

  const handleTaxCurrencySave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          country: taxCurrencyData.country,
          currency: taxCurrencyData.currency,
          defaultTaxRate: taxCurrencyData.defaultTaxRate ? parseFloat(taxCurrencyData.defaultTaxRate) : null
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        toast({
          title: "Tax & Currency Settings Updated",
          description: "Your tax and currency settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to update tax and currency settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tax and currency settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaxCurrencyCountryChange = (value: string) => {
    const country = countries.find(c => c.code === value)
    setTaxCurrencyData(prev => ({
      ...prev,
      country: value,
      currency: country?.currency || prev.currency
    }))
  }

  const handleCurrencyChange = (newCurrency: string) => {
    if (taxCurrencyData.currency && taxCurrencyData.currency !== newCurrency) {
      setOldCurrency(taxCurrencyData.currency)
      setShowCurrencyPrompt(true)
    }
    setTaxCurrencyData(prev => ({
      ...prev,
      currency: newCurrency
    }))
  }

  const handleUpdateExistingInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/update-currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newCurrency: taxCurrencyData.currency,
          oldCurrency: oldCurrency
        })
      })

      if (response.ok) {
        toast({
          title: "Currency Updated",
          description: "All existing draft invoices and estimates have been updated to the new currency."
        })
      } else {
        throw new Error('Failed to update existing invoices')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update existing invoices. Please try again.",
        variant: "destructive"
      })
    } finally {
      setShowCurrencyPrompt(false)
      setOldCurrency('')
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Tax & Currency Settings" subtitle="Manage your business location, currency, and tax rates">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxCountry">Country</Label>
              <Select value={taxCurrencyData.country} onValueChange={handleTaxCurrencyCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taxCurrency">Currency</Label>
              <Select value={taxCurrencyData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="defaultTaxRate">Default Tax Rate (optional)</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={taxCurrencyData.defaultTaxRate ?? ''}
                onChange={(e) => setTaxCurrencyData(prev => ({ ...prev, defaultTaxRate: e.target.value }))}
                className="w-32"
              />
              <span className="text-gray-500">%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              This will be applied as the default tax rate for new invoices and estimates
            </p>
          </div>

          <div className="flex justify-end">
            <SaveButton onClick={handleTaxCurrencySave} disabled={loading} loading={loading}>
              Save Tax & Currency Settings
            </SaveButton>
          </div>
        </div>
      </SettingsCard>

      {/* Currency Change Prompt */}
      {showCurrencyPrompt && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Currency Changed</CardTitle>
            <p className="text-sm text-amber-700">
              You've changed your currency from {oldCurrency} to {taxCurrencyData.currency}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 mb-4">
              Would you like to update all existing invoices and estimates to use this new currency?
            </p>
            <p className="text-xs text-amber-600 mb-4">
              Note: This will only update draft and sent invoices/estimates. Finalized invoices will remain unchanged.
            </p>
            <div className="flex space-x-2">
              <Button onClick={handleUpdateExistingInvoices} size="sm">
                Yes, Update Existing Items
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCurrencyPrompt(false)
                  setOldCurrency('')
                }} 
                size="sm"
              >
                No, Keep Existing Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}