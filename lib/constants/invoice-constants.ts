/**
 * Invoice Constants
 * Centralized constants for invoice creation and management
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
] as const

export const TAX_PRESETS = [
  { label: 'No Tax', value: 0 },
  { label: 'GST 10%', value: 10 },
  { label: 'VAT 20%', value: 20 },
  { label: 'HST 13%', value: 13 },
  { label: 'Custom', value: null },
] as const

export const PAYMENT_TERMS = [
  { label: 'Due on Receipt', value: 0 },
  { label: 'Net 7', value: 7 },
  { label: 'Net 15', value: 15 },
  { label: 'Net 30', value: 30 },
  { label: 'Net 60', value: 60 },
  { label: 'Net 90', value: 90 },
] as const

// Type exports for TypeScript support
export type Currency = typeof CURRENCIES[number]
export type TaxPreset = typeof TAX_PRESETS[number]
export type PaymentTerm = typeof PAYMENT_TERMS[number]
