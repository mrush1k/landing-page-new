import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SettingsCardProps = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  headerRight?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export default function SettingsCard({ title, subtitle, headerRight, className, children }: SettingsCardProps) {
  return (
    <Card className={`max-w-full overflow-x-hidden ${className || ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between w-full min-w-0">
          <div className="flex-1 min-w-0">
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {headerRight && <div className="ml-4 flex-shrink-0">{headerRight}</div>}
        </div>
      </CardHeader>

      <CardContent className="max-w-full overflow-x-hidden">
        {children}
      </CardContent>
    </Card>
  )
}
