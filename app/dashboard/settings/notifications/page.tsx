"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import SaveButton from '@/components/settings/SaveButton'
import { useToast } from '@/hooks/use-toast'
import SettingsCard from '@/components/settings/SettingsCard'

export default function NotificationsSettingsPage() {
  const { userProfile: user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    overdueReminders: true,
    paymentNotifications: true,
    invoiceUpdates: true
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
        if (settings.notifications) setNotificationSettings(settings.notifications)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleNotificationSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationSettings)
      })

      if (response.ok) {
        toast({
          title: "Notification Settings Updated",
          description: "Your notification preferences have been updated successfully."
        })
      } else {
        throw new Error('Failed to update notification settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Notification Preferences" subtitle="Choose which notifications you'd like to receive">
        <div className="space-y-4">
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
              { key: 'overdueReminders', label: 'Overdue Reminders', description: 'Get notified when invoices become overdue' },
              { key: 'paymentNotifications', label: 'Payment Notifications', description: 'Receive alerts when payments are received' },
              { key: 'invoiceUpdates', label: 'Invoice Updates', description: 'Get notified about invoice status changes' }
            ].map((setting) => (
              <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{setting.label}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant={notificationSettings[setting.key as keyof typeof notificationSettings] ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({
                      ...prev,
                      [setting.key]: !prev[setting.key as keyof typeof prev]
                    }))}
                    className="w-full sm:w-auto"
                  >
                    {notificationSettings[setting.key as keyof typeof notificationSettings] ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <SaveButton onClick={handleNotificationSave} disabled={loading} loading={loading}>
              Save Notification Settings
            </SaveButton>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}