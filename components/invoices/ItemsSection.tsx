import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { InvoiceItem } from '@/lib/types'
import { ItemRow } from './ItemRow'

interface ItemsSectionProps {
  items: Partial<InvoiceItem>[]
  onUpdateItem: (index: number, field: keyof InvoiceItem, value: string | number) => void
  onRemoveItem: (index: number) => void
  onAddItem: () => void
  onOpenSavedItems: () => void
  formatCurrency: (amount: number) => string
  getItemTotal: (quantity: number | undefined, unitPrice: number | undefined) => number
}

export function ItemsSection({
  items,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onOpenSavedItems,
  formatCurrency,
  getItemTotal,
}: ItemsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700 mb-4">
          <div className="col-span-2">Item Name</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-2">Line Total</div>
          <div className="col-span-1">Action</div>
        </div>
        
        {/* Items */}
        {items.map((item, index) => (
          <ItemRow
            key={index}
            item={item}
            index={index}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
            formatCurrency={formatCurrency}
            getItemTotal={getItemTotal}
            canRemove={items.length > 1}
          />
        ))}
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onAddItem}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-800 text-white hover:bg-gray-900"
            onClick={onOpenSavedItems}
          >
            <FileText className="w-4 h-4 mr-2" />
            Select Saved
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
