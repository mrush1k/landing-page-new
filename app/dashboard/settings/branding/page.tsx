"use client"

import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'
import SettingsCard from '@/components/settings/SettingsCard'

export default function BrandingSettingsPage() {
  return (
    <div className="space-y-6">
      <SettingsCard title="Logo & Branding" subtitle="Manage your AI-generated and custom logos">
        <div className="py-8">
          <div className="text-center">
            <Wand2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Branding Management</h3>
            <p className="text-gray-600 mb-4">
              Access the full branding suite to manage your AI-generated logos, upload custom logos, and download assets.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/settings/branding'}>
              <Wand2 className="h-4 w-4 mr-2" />
              Open Branding Manager
            </Button>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}