import SettingsNavigation from '@/components/settings/SettingsNavigation'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <SettingsNavigation />
      
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}