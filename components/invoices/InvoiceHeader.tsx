/**
 * InvoiceHeader Component
 * Top header with back button and action buttons (Save Draft, Preview, Send)
 * Extracted from app/dashboard/invoices/new/page.tsx for modularity
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Eye, Send } from 'lucide-react'

interface InvoiceHeaderProps {
  onSaveDraft: () => void
  onPreview: () => void
  onSend: () => void
  loading: boolean
}

export function InvoiceHeader({
  onSaveDraft,
  onPreview,
  onSend,
  loading,
}: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="mobile-button w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="mobile-h1">New Invoice</h1>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:space-x-2">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={loading}
          className="mobile-button"
        >
          <Save className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Save Draft</span>
          <span className="xs:hidden">Save</span>
        </Button>
        <Button
          variant="outline"
          onClick={onPreview}
          disabled={loading}
          className="mobile-button"
        >
          <Eye className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Preview PDF</span>
          <span className="xs:hidden">Preview</span>
        </Button>
        <Button
          onClick={onSend}
          disabled={loading}
          className="mobile-button"
        >
          <Send className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Send Invoice</span>
          <span className="xs:hidden">Send</span>
        </Button>
      </div>
    </div>
  )
}
