"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Building, Bell, Lock, MessageCircle, HardDrive, Palette, DollarSign, HelpCircle, FileText, Wand2 } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User, href: '/dashboard/settings/profile' },
  { id: 'company', label: 'Company', icon: Building, href: '/dashboard/settings/company' },
  { id: 'branding', label: 'Branding', icon: Wand2, href: '/dashboard/settings/branding' },
  { id: 'invoice-appearance', label: 'Invoice Appearance', icon: FileText, href: '/dashboard/settings/invoice-appearance' },
  { id: 'tax-currency', label: 'Tax & Currency', icon: DollarSign, href: '/dashboard/settings/tax-currency' },
  { id: 'theme', label: 'Theme Preferences', icon: Palette, href: '/dashboard/settings/theme' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/dashboard/settings/notifications' },
  { id: 'help-support', label: 'Help & Support', icon: HelpCircle, href: '/dashboard/settings/help-support' },
  { id: 'chatbot-history', label: 'Chatbot History', icon: MessageCircle, href: '/dashboard/settings/chatbot-history' },
  { id: 'cache-management', label: 'Cache Management', icon: HardDrive, href: '/dashboard/settings/cache-management' },
  { id: 'security', label: 'Security', icon: Lock, href: '/dashboard/settings/security' }
]

export default function SettingsNavigation() {
  const pathname = usePathname()
  
  return (
    <div className="border-b overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
      <nav className="flex space-x-4 sm:space-x-8 py-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm flex-shrink-0 whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}