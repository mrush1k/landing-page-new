import React from 'react'
import { Save } from 'lucide-react'
import { Button } from '../ui/button'

type SaveButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  children?: React.ReactNode
}

export default function SaveButton({ loading, children = 'Save', ...rest }: SaveButtonProps) {
  return (
    <Button {...rest}>
      <Save className="w-4 h-4 mr-2" />
      {loading ? 'Saving...' : children}
    </Button>
  )
}
