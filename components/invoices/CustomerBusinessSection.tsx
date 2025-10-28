import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { Customer } from '@/lib/types'

interface CustomerBusinessSectionProps {
  customerId: string
  setCustomerId: (value: string) => void
  customers: Customer[]
  onAddCustomer: () => void
  businessInfo: string
  setBusinessInfo: (value: string) => void
}

export function CustomerBusinessSection({
  customerId,
  setCustomerId,
  customers,
  onAddCustomer,
  businessInfo,
  setBusinessInfo,
}: CustomerBusinessSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customerId">Customer</Label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={customers.length === 0 ? "No customers found" : "Select a customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-gray-500 text-center">
                      No customers found.<br />
                      Create your first customer to get started.
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.displayName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={onAddCustomer}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={businessInfo}
            onChange={(e) => setBusinessInfo(e.target.value)}
            placeholder="Your business details..."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>
    </div>
  )
}
