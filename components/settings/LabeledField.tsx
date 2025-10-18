import React from 'react'

type LabeledFieldProps = {
  label: string
  id?: string
  children: React.ReactNode
  hint?: string
}

export default function LabeledField({ label, id, children, hint }: LabeledFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}
