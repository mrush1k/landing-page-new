"use client"

import { useState } from 'react'
import SaveButton from '@/components/settings/SaveButton'
import { useToast } from '@/hooks/use-toast'
import { ColorPicker } from '@/components/color-picker'
import { useTheme } from '@/components/theme-provider'
import SettingsCard from '@/components/settings/SettingsCard'

export default function ThemeSettingsPage() {
  const { toast } = useToast()
  const { primaryColor, colorScheme, setPrimaryColor, setColorScheme, saveThemePreferences } = useTheme()
  const [loading, setLoading] = useState(false)

  const handleThemeSave = async () => {
    setLoading(true)
    try {
      await saveThemePreferences()
      toast({
        title: "Theme Updated",
        description: "Your theme preferences have been saved successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update theme preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ColorPicker
        selectedColor={primaryColor}
        onColorChange={setPrimaryColor}
        onSave={handleThemeSave}
        showPreview={true}
      />
      
      <SettingsCard title="Color Scheme" subtitle="Choose your preferred color scheme">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Light', description: 'Light backgrounds with dark text' },
              { value: 'dark', label: 'Dark', description: 'Dark backgrounds with light text' },
              { value: 'system', label: 'System', description: 'Follow your device settings' }
            ].map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value as any)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-gray-50 ${
                  colorScheme === scheme.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <h4 className="font-medium">{scheme.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{scheme.description}</p>
              </button>
            ))}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <SaveButton onClick={handleThemeSave} disabled={loading} loading={loading}>
              Save Theme Preferences
            </SaveButton>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}