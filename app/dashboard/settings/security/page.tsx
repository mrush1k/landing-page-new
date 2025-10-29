"use client"

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'

export default function SecuritySettingsPage() {
  const { userProfile: user } = useAuth()
  const { toast } = useToast()

  const exportData = async () => {
    try {
      const response = await fetch('/api/users/export', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-pro-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Data Exported",
          description: "Your data has been exported successfully."
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Account Security" subtitle="Manage your account security and data">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-gray-600">Last changed: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <Button variant="outline" className="flex-shrink-0 w-full sm:w-auto">
                Change Password
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <Badge variant="outline" className="flex-shrink-0 w-fit">Coming Soon</Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-gray-600">Download all your account data</p>
              </div>
              <Button variant="outline" onClick={exportData} className="flex-shrink-0 w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg border-red-200 gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" className="flex-shrink-0 w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}