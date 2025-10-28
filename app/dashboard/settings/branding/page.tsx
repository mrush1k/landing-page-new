"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SaveButton from '@/components/settings/SaveButton'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'
import { Wand2, Upload, Download, Trash2, Eye, ImageIcon } from 'lucide-react'

export default function BrandingSettingsPage() {
  const { userProfile: user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  
  // Branding state
  const [logoData, setLogoData] = useState({
    logoUrl: '',
    aiLogoUrl: '',
    businessName: ''
  })

  useEffect(() => {
    if (user) {
      setLogoData({
        logoUrl: user.logoUrl || '',
        aiLogoUrl: user.aiLogoUrl || '',
        businessName: user.businessName || user.displayName || ''
      })
    }
  }, [user])

  const handleGenerateAILogo = async () => {
    if (!logoData.businessName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a business name to generate a logo.",
        variant: "destructive"
      })
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName: logoData.businessName
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setLogoData(prev => ({ ...prev, aiLogoUrl: data.logoUrl }))
        
        // Update user profile
        if (user) {
          updateUserProfile({ ...user, aiLogoUrl: data.logoUrl })
        }
        
        toast({
          title: "AI Logo Generated",
          description: "Your AI logo has been generated successfully!"
        })
      } else {
        throw new Error('Failed to generate AI logo')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI logo. Please try again.",
        variant: "destructive"
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload a valid image file.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB.",
        variant: "destructive"
      })
      return
    }

    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/users/logo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setLogoData(prev => ({ ...prev, logoUrl: data.logoUrl }))
        
        // Update user profile
        if (user) {
          updateUserProfile({ ...user, logoUrl: data.logoUrl })
        }
        
        toast({
          title: "Logo Uploaded",
          description: "Your custom logo has been uploaded successfully!"
        })
      } else {
        throw new Error('Failed to upload logo')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleRemoveLogo = async (type: 'custom' | 'ai') => {
    setLoading(true)
    try {
      const updateData = type === 'custom' 
        ? { logoUrl: '' }
        : { aiLogoUrl: '' }

      if (user) {
        updateUserProfile({ 
          ...user, 
          ...(type === 'custom' ? { logoUrl: '' } : { aiLogoUrl: '' })
        })
      }
      
      setLogoData(prev => ({
        ...prev,
        [type === 'custom' ? 'logoUrl' : 'aiLogoUrl']: ''
      }))

      toast({
        title: "Logo Removed",
        description: `Your ${type} logo has been removed successfully.`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadLogo = (logoUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = logoUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* AI Logo Generation */}
      <SettingsCard title="AI Logo Generator" subtitle="Generate a professional logo using AI">
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={logoData.businessName}
              onChange={(e) => setLogoData(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Enter your business name"
            />
          </div>
          
          <Button 
            onClick={handleGenerateAILogo}
            disabled={aiLoading || !logoData.businessName.trim()}
            className="w-full sm:w-auto"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {aiLoading ? 'Generating...' : 'Generate AI Logo'}
          </Button>

          {logoData.aiLogoUrl && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Generated AI Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img 
                    src={logoData.aiLogoUrl} 
                    alt="AI Generated Logo" 
                    className="h-16 w-16 rounded border object-contain bg-gray-50"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">AI-generated logo for {logoData.businessName}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(logoData.aiLogoUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadLogo(logoData.aiLogoUrl, `${logoData.businessName}-logo-ai.png`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveLogo('ai')}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SettingsCard>

      {/* Custom Logo Upload */}
      <SettingsCard title="Custom Logo" subtitle="Upload your own logo file">
        <div className="space-y-4">
          <div>
            <Label htmlFor="logoUpload">Logo File</Label>
            <div className="mt-2">
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadLoading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500">
                PNG, JPG, or SVG up to 5MB. Recommended size: 512x512px
              </p>
            </div>
          </div>

          {logoData.logoUrl && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Custom Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img 
                    src={logoData.logoUrl} 
                    alt="Custom Logo" 
                    className="h-16 w-16 rounded border object-contain bg-gray-50"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Your uploaded logo</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(logoData.logoUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadLogo(logoData.logoUrl, `${logoData.businessName}-logo-custom.png`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveLogo('custom')}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SettingsCard>

      {/* Brand Assets Preview */}
      <SettingsCard title="Brand Preview" subtitle="See how your branding looks in invoices">
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            {(logoData.logoUrl || logoData.aiLogoUrl) ? (
              <div className="space-y-4">
                <img 
                  src={logoData.logoUrl || logoData.aiLogoUrl} 
                  alt="Brand Logo" 
                  className="h-20 w-20 mx-auto rounded border object-contain bg-white"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{logoData.businessName}</h3>
                  <p className="text-sm text-gray-500">This is how your logo will appear on invoices</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">No Logo Set</h3>
                  <p className="text-sm text-gray-500">Upload a logo or generate one with AI to see the preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}