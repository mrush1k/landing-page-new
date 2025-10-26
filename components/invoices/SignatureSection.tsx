import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PenTool, Upload } from 'lucide-react'
import { RefObject } from 'react'

interface SignatureSectionProps {
  mySignature: string
  mySignatureFile: string | null
  clientSignature: string
  clientSignatureFile: string | null
  onDrawSignature: (type: 'my' | 'client') => void
  mySignatureInputRef: RefObject<HTMLInputElement>
  clientSignatureInputRef: RefObject<HTMLInputElement>
  onSignatureUpload: (type: 'my' | 'client', file: File) => void
}

export function SignatureSection({
  mySignature,
  mySignatureFile,
  clientSignature,
  clientSignatureFile,
  onDrawSignature,
  mySignatureInputRef,
  clientSignatureInputRef,
  onSignatureUpload,
}: SignatureSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>My Signature (Invoice Creator)</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onDrawSignature('my')}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Draw
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => mySignatureInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" size="sm">
                  Use Saved
                </Button>
                <input 
                  type="file" 
                  ref={mySignatureInputRef} 
                  onChange={(e) => e.target.files && onSignatureUpload('my', e.target.files[0])} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              {mySignature && (
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">Signature added ✓</p>
                </div>
              )}
              {mySignatureFile && (
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <img 
                    src={mySignatureFile} 
                    alt="My signature" 
                    className="max-h-20 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Client Signature (Required on Payment)</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onDrawSignature('client')}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Draw
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => clientSignatureInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input 
                  type="file" 
                  ref={clientSignatureInputRef} 
                  onChange={(e) => e.target.files && onSignatureUpload('client', e.target.files[0])} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              {clientSignature && (
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">Client signature added ✓</p>
                </div>
              )}
              {clientSignatureFile && (
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <img 
                    src={clientSignatureFile} 
                    alt="Client signature" 
                    className="max-h-20 object-contain mx-auto"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Note: Client signature is required before marking invoice as Paid
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
