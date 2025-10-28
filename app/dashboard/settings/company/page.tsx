"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import SaveButton from '@/components/settings/SaveButton'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'

export default function CompanySettingsPage() {
  const { userProfile: user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Company settings state
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyPostalCode: '',
    companyWebsite: '',
    logoUrl: '',
    invoiceTerms: '',
    invoiceNotes: '',
    emailSignature: ''
  })

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const settings = await response.json()
        if (settings.company) setCompanyData(settings.company)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleCompanySave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(companyData)
      })

      if (response.ok) {
        toast({
          title: "Company Settings Updated",
          description: "Your company settings have been updated successfully."
        })
      } else {
        throw new Error('Failed to update company settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Company Settings" subtitle="These details will appear on your invoices and receipts">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyData.companyName}
                onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyData.companyEmail}
                onChange={(e) => setCompanyData(prev => ({ ...prev, companyEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={companyData.companyPhone}
                onChange={(e) => setCompanyData(prev => ({ ...prev, companyPhone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input
                id="companyWebsite"
                value={companyData.companyWebsite}
                onChange={(e) => setCompanyData(prev => ({ ...prev, companyWebsite: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company Address</h3>
            <div>
              <Label htmlFor="companyAddress">Street Address</Label>
              <Input
                id="companyAddress"
                value={companyData.companyAddress}
                onChange={(e) => setCompanyData(prev => ({ ...prev, companyAddress: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="companyCity">City</Label>
                <Input
                  id="companyCity"
                  value={companyData.companyCity}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, companyCity: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="companyState">State/Province</Label>
                <Input
                  id="companyState"
                  value={companyData.companyState}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, companyState: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="companyPostalCode">Postal Code</Label>
                <Input
                  id="companyPostalCode"
                  value={companyData.companyPostalCode}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, companyPostalCode: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invoice Defaults</h3>
            <div>
              <Label htmlFor="invoiceTerms">Default Payment Terms</Label>
              <Textarea
                id="invoiceTerms"
                placeholder="e.g., Payment due within 30 days of invoice date"
                value={companyData.invoiceTerms}
                onChange={(e) => setCompanyData(prev => ({ ...prev, invoiceTerms: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="invoiceNotes">Default Invoice Notes</Label>
              <Textarea
                id="invoiceNotes"
                placeholder="Additional notes that will appear on invoices"
                value={companyData.invoiceNotes}
                onChange={(e) => setCompanyData(prev => ({ ...prev, invoiceNotes: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="emailSignature">Email Signature</Label>
              <Textarea
                id="emailSignature"
                placeholder="Signature for invoice emails"
                value={companyData.emailSignature}
                onChange={(e) => setCompanyData(prev => ({ ...prev, emailSignature: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <SaveButton onClick={handleCompanySave} disabled={loading} loading={loading}>
              Save Company Settings
            </SaveButton>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}