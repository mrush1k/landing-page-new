/**
 * Invoice Helper Utilities
 * Helper functions for invoice operations
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

import { COUNTRIES } from '@/lib/types'

/**
 * Get country configuration by country code
 * @param countryCode - ISO country code
 * @returns Country configuration or undefined
 */
export const getCountryConfig = (countryCode: string) => {
  return COUNTRIES.find(c => c.code === countryCode)
}

/**
 * Generate business info string from user profile
 * @param userProfile - User profile object
 * @param userEmail - User email address
 * @returns Formatted business info string
 */
export const generateBusinessInfo = (userProfile: any, userEmail?: string): string => {
  if (!userProfile) return ''
  
  const info = `${userProfile.displayName || 'Your Business'}\n${userProfile.address || ''}\n${userProfile.city ? `${userProfile.city}, ${userProfile.state || ''} ${userProfile.zipCode || ''}` : ''}\n${userProfile.phone || ''}\n${userEmail || ''}`
  return info.replace(/\n+/g, '\n').trim()
}
