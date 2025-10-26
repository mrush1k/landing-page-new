/**
 * ItemRow Component
 * Single invoice item row with mobile and desktop layouts
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { InvoiceItem } from '@/lib/types'

interface ItemRowProps {
  item: Partial<InvoiceItem>
  index: number
  onUpdate: (index: number, field: keyof InvoiceItem, value: string | number) => void
  onRemove: (index: number) => void
  formatCurrency: (amount: number) => string
  getItemTotal: (quantity?: number, unitPrice?: number) => number
  canRemove: boolean
}

export const ItemRow = memo(function ItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  formatCurrency,
  getItemTotal,
  canRemove,
}: ItemRowProps) {
  const itemTotal = getItemTotal(item.quantity, item.unitPrice)

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-gray-700">Item #{index + 1}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="h-8 w-8"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium mb-1 block">Item Name</Label>
            <Input
              value={item.name || ''}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              placeholder="Item name"
              className="h-11"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1 block">Description</Label>
            <Input
              value={item.description || ''}
              onChange={(e) => onUpdate(index, 'description', e.target.value)}
              placeholder="Item description"
              className="h-11"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1 block">Quantity</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.quantity || ''}
                onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                placeholder="1"
                className="h-11"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-1 block">Unit Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice || ''}
                onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                placeholder="1000"
                className="h-11"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-1 block">Total</Label>
            <div className="h-11 px-3 py-2 bg-white border rounded-md flex items-center font-medium text-gray-800">
              {formatCurrency(itemTotal)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
        <div className="col-span-2">
          <Input
            value={item.name || ''}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Item name"
            className="h-11"
          />
        </div>
        <div className="col-span-3">
          <Input
            value={item.description || ''}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder="Item description"
            className="h-11"
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.quantity || ''}
            onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
            placeholder="1"
            className="h-11"
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice || ''}
            onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
            placeholder="1000"
            className="h-11"
          />
        </div>
        <div className="col-span-2">
          <div className="h-11 px-3 py-2 bg-white border rounded-md flex items-center font-medium text-gray-800">
            {formatCurrency(itemTotal)}
          </div>
        </div>
        <div className="col-span-1 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="h-11 w-11"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})
