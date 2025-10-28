import React from 'react'
import { Button } from '../ui/button'

type ToggleButtonProps = {
  enabled: boolean
  onToggle: () => void
  // map to the Button component's supported sizes ('sm' | 'default' | 'lg' | 'icon')
  size?: 'sm' | 'default'
  children?: React.ReactNode
}

export default function ToggleButton({ enabled, onToggle, size = 'default', children }: ToggleButtonProps) {
  // ensure we only pass supported values to the Button component
  const btnSize: 'sm' | 'default' = size === 'sm' ? 'sm' : 'default'

  return (
    <Button
      size={btnSize}
      variant={enabled ? 'default' : 'outline'}
      onClick={onToggle}
    >
      {children ?? (enabled ? 'Enabled' : 'Disabled')}
    </Button>
  )
}
