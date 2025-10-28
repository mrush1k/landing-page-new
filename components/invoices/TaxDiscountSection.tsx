import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TAX_PRESETS } from '@/lib/constants/invoice-constants'

interface TaxDiscountSectionProps {
  taxRate: number
  setTaxRate: (value: number) => void
  customTaxRate: string
  setCustomTaxRate: (value: string) => void
  taxInclusive: boolean
  setTaxInclusive: (value: boolean) => void
  discountType: 'fixed' | 'percentage'
  setDiscountType: (value: 'fixed' | 'percentage') => void
  discountAmount: number
  setDiscountAmount: (value: number) => void
  currency: string
  subtotal: number
  tax: number
  discount: number
  total: number
  formatCurrency: (amount: number) => string
}

export function TaxDiscountSection({
  taxRate,
  setTaxRate,
  customTaxRate,
  setCustomTaxRate,
  taxInclusive,
  setTaxInclusive,
  discountType,
  setDiscountType,
  discountAmount,
  setDiscountAmount,
  currency,
  subtotal,
  tax,
  discount,
  total,
  formatCurrency,
}: TaxDiscountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax, Discount & Shipping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Tax Rate</Label>
              <Select value={taxRate.toString()} onValueChange={(value) => {
                if (value === 'custom') {
                  setTaxRate(parseFloat(customTaxRate) || 0)
                } else {
                  setTaxRate(parseFloat(value))
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax rate" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.value?.toString() || 'custom'}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {taxRate === 0 && (
              <div>
                <Label htmlFor="customTaxRate">Custom Tax Rate (%)</Label>
                <Input
                  id="customTaxRate"
                  type="number"
                  min="0"
                  step="0.1"
                  value={customTaxRate}
                  onChange={(e) => {
                    setCustomTaxRate(e.target.value)
                    setTaxRate(parseFloat(e.target.value) || 0)
                  }}
                  placeholder="Enter tax rate"
                />
              </div>
            )}

            {taxRate > 0 && (
              <div>
                <Label>GST/Tax Method</Label>
                <Select value={taxInclusive ? 'inclusive' : 'exclusive'} onValueChange={(value) => setTaxInclusive(value === 'inclusive')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Tax Exclusive (add tax on top)</SelectItem>
                    <SelectItem value="inclusive">Tax Inclusive (tax included in prices)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {taxInclusive 
                    ? "Tax is included in your item prices. Tax amount will be calculated as part of the total." 
                    : "Tax will be added on top of your subtotal."}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(value: 'fixed' | 'percentage') => setDiscountType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="discountAmount">
                Discount {discountType === 'percentage' ? '(%)' : `(${currency || 'USD'})`}
              </Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">
              Tax ({taxRate}% - {taxInclusive ? 'Inclusive' : 'Exclusive'}):
            </span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Discount:</span>
            <span className="font-medium text-red-600">-{formatCurrency(discount)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
