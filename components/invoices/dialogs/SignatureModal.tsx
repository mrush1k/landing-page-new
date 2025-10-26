/**
 * SignatureModal Component
 * Dialog for drawing/adding signatures
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface SignatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  signatureType: 'my' | 'client'
  onSave: (signatureData: string) => void
}

export function SignatureModal({
  open,
  onOpenChange,
  signatureType,
  onSave,
}: SignatureModalProps) {
  const { toast } = useToast()

  const handleSave = () => {
    onSave('signature-data')
    onOpenChange(false)
    toast({
      title: 'Signature saved',
      description: `${signatureType === 'my' ? 'Your' : 'Client'} signature has been saved.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {signatureType === 'my' ? 'My Signature' : 'Client Signature'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">Draw signature here</p>
            <p className="text-sm text-gray-400">Signature canvas would go here</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
