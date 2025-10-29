/**
 * AdditionalInfoCard Component
 * Purchase Order Number and Notes section for invoice creation
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AdditionalInfoCardProps {
  poNumber: string
  setPoNumber: (value: string) => void
  notes: string
  setNotes: (value: string) => void
}

export function AdditionalInfoCard({
  poNumber,
  setPoNumber,
  notes,
  setNotes,
}: AdditionalInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="poNumber">Purchase Order Number</Label>
          <Input
            id="poNumber"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Purchase Order Number (optional)"
          />
        </div>
        
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes or terms for the customer"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
