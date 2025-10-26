"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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

const workTypes = [
  'Trades & Construction',
  'Creative & Digital', 
  'Freelance & Consulting',
  'Landscaping & Outdoor Work',
  'Retail & Sales Services',
  'Solo Operator / Small Business',
  'Other'
]

export default function ProfileSettingsPage() {
  const { userProfile: user, updateUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    country: '',
    currency: '',
    workType: '',
    customWorkType: '',
    businessName: '',
    businessRegNumber: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
    dateFormat: '',
    logoUrl: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        country: user.country || '',
        currency: user.currency || '',
        workType: user.workType || '',
        customWorkType: user.customWorkType || '',
        businessName: user.businessName || '',
        businessRegNumber: user.businessRegNumber || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        postalCode: user.postalCode || '',
        website: user.website || '',
        dateFormat: user.dateFormat || 'DD/MM/YYYY',
        logoUrl: user.logoUrl || ''
      })
    }
  }, [user])

  const handleProfileSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully."
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCountryChange = (value: string) => {
    const country = countries.find(c => c.code === value)
    setProfileData(prev => ({
      ...prev,
      country: value,
      currency: country?.currency || prev.currency
    }))
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Personal Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={profileData.country} onValueChange={handleCountryChange}>
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
              <Label htmlFor="currency">Currency</Label>
              <Select value={profileData.currency} onValueChange={(value) => 
                setProfileData(prev => ({ ...prev, currency: value }))}>
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
            <div>
              <Label htmlFor="workType">Work Type</Label>
              <Select value={profileData.workType} onValueChange={(value) => 
                setProfileData(prev => ({ ...prev, workType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          
          {profileData.workType === 'Other' && (
            <div>
              <Label htmlFor="customWorkType">Custom Work Type</Label>
              <Input
                id="customWorkType"
                placeholder="Describe your work type"
                value={profileData.customWorkType}
                onChange={(e) => setProfileData(prev => ({ ...prev, customWorkType: e.target.value }))}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={profileData.businessName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="businessRegNumber">Business Registration Number</Label>
                <Input
                  id="businessRegNumber"
                  value={profileData.businessRegNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, businessRegNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={profileData.dateFormat} onValueChange={(value) => 
                  setProfileData(prev => ({ ...prev, dateFormat: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={profileData.state}
                  onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={profileData.postalCode}
                  onChange={(e) => setProfileData(prev => ({ ...prev, postalCode: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveButton onClick={handleProfileSave} disabled={loading} loading={loading}>
              Save Profile
            </SaveButton>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}