/**
 * Invoice-specific Type Definitions
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 * These types are specific to invoice creation and management
 */

export interface CustomerFormData {
  displayName: string
  firstName: string
  lastName: string
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  businessRegNumber: string
}

export interface SavedItem {
  id: string
  name: string
  description: string
  unitPrice: number
}

export const emptyCustomerFormData: CustomerFormData = {
  displayName: '',
  firstName: '',
  lastName: '',
  businessName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  businessRegNumber: '',
}
