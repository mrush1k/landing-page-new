/**
 * Invoice Calculation Utilities
 * Pure functions for invoice calculations
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity and testability
 */

import { InvoiceItem } from '@/lib/types'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'

/**
 * Calculate the total for a single invoice item
 * @param quantity - Number of units
 * @param unitPrice - Price per unit
 * @returns Total amount for the item
 */
export const calculateItemTotal = (quantity?: number, unitPrice?: number): number => {
  if (!quantity || !unitPrice) return 0
  return quantity * unitPrice
}

/**
 * Calculate subtotal from all invoice items
 * @param items - Array of invoice items
 * @returns Subtotal amount
 */
export const calculateSubtotal = (items: Partial<InvoiceItem>[]): number => {
  return items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.quantity, item.unitPrice)
  }, 0)
}

/**
 * Calculate tax amount based on subtotal and tax settings
 * @param subtotal - Subtotal amount
 * @param taxRate - Tax rate percentage
 * @param taxInclusive - Whether tax is included in the subtotal
 * @returns Tax amount
 */
export const calculateTax = (
  subtotal: number,
  taxRate: number,
  taxInclusive: boolean
): number => {
  if (taxInclusive) {
    // For inclusive tax, the tax is already included in the subtotal
    // Tax = subtotal * (taxRate / (100 + taxRate))
    return subtotal * (taxRate / (100 + taxRate))
  } else {
    // For exclusive tax, add tax on top of subtotal
    return subtotal * (taxRate / 100)
  }
}

/**
 * Calculate discount amount
 * @param subtotal - Subtotal amount
 * @param discountType - Type of discount (fixed or percentage)
 * @param discountAmount - Discount amount or percentage
 * @returns Discount amount
 */
export const calculateDiscount = (
  subtotal: number,
  discountType: 'fixed' | 'percentage',
  discountAmount: number
): number => {
  if (discountType === 'percentage') {
    return subtotal * (discountAmount / 100)
  }
  return discountAmount
}

/**
 * Calculate final total amount
 * @param subtotal - Subtotal amount
 * @param tax - Tax amount
 * @param discount - Discount amount
 * @param taxInclusive - Whether tax is included in the subtotal
 * @returns Final total amount
 */
export const calculateTotal = (
  subtotal: number,
  tax: number,
  discount: number,
  taxInclusive: boolean
): number => {
  if (taxInclusive) {
    // For inclusive tax, subtotal already includes tax
    // Total = subtotal - discount (tax is already in subtotal)
    return subtotal - discount
  } else {
    // For exclusive tax, add tax on top
    return subtotal + tax - discount
  }
}

/**
 * Format currency with proper symbol and locale
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted currency string
 */
export const formatInvoiceCurrency = (amount: number, currency: string): string => {
  return formatCurrencyUtil(amount, currency || 'USD')
}
