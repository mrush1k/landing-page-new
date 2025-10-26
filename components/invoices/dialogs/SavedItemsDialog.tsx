/**
 * SavedItemsDialog Component
 * Dialog for selecting pre-saved invoice items
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SavedItem } from '@/lib/types/invoice-types'

interface SavedItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  savedItems: SavedItem[]
  onSelectItem: (item: SavedItem) => void
  formatCurrency: (amount: number) => string
}

export function SavedItemsDialog({
  open,
  onOpenChange,
  savedItems,
  onSelectItem,
  formatCurrency,
}: SavedItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Saved Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {savedItems.map((savedItem) => (
            <div key={savedItem.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{savedItem.name}</h4>
                <p className="text-sm text-gray-600">{savedItem.description}</p>
                <p className="text-sm font-medium">{formatCurrency(savedItem.unitPrice)}</p>
              </div>
              <Button size="sm" onClick={() => onSelectItem(savedItem)}>
                Add
              </Button>
            </div>
          ))}
          {savedItems.length === 0 && (
            <p className="text-center text-gray-500 py-4">No saved items found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
