/**
 * useInvoiceCalculations Hook
 * Centralized invoice calculation logic with memoization
 * Extracted from app/dashboard/invoices/new/page.tsx for optimization
 */

import { useMemo, useCallback } from 'react'
import { InvoiceItem } from '@/lib/types'
import {
  calculateSubtotal as calcSubtotal,
  calculateTax as calcTax,
  calculateDiscount as calcDiscount,
  calculateTotal as calcTotal,
  formatInvoiceCurrency,
  calculateItemTotal,
} from '@/lib/utils/invoice-calculations'

interface UseInvoiceCalculationsProps {
  items: Partial<InvoiceItem>[]
  taxRate: number
  taxInclusive: boolean
  discountType: 'fixed' | 'percentage'
  discountAmount: number
  currency: string
}

export function useInvoiceCalculations({
  items,
  taxRate,
  taxInclusive,
  discountType,
  discountAmount,
  currency,
}: UseInvoiceCalculationsProps) {
  // Memoize subtotal calculation
  const subtotal = useMemo(() => calcSubtotal(items), [items])

  // Memoize tax calculation
  const tax = useMemo(
    () => calcTax(subtotal, taxRate, taxInclusive),
    [subtotal, taxRate, taxInclusive]
  )

  // Memoize discount calculation
  const discount = useMemo(
    () => calcDiscount(subtotal, discountType, discountAmount),
    [subtotal, discountType, discountAmount]
  )

  // Memoize total calculation
  const total = useMemo(
    () => calcTotal(subtotal, tax, discount, taxInclusive),
    [subtotal, tax, discount, taxInclusive]
  )

  // Memoize currency formatter
  const formatCurrency = useCallback(
    (amount: number) => formatInvoiceCurrency(amount, currency),
    [currency]
  )

  // Memoize item total calculator
  const getItemTotal = useCallback(
    (quantity?: number, unitPrice?: number) => calculateItemTotal(quantity, unitPrice),
    []
  )

  return {
    subtotal,
    tax,
    discount,
    total,
    formatCurrency,
    getItemTotal,
  }
}
