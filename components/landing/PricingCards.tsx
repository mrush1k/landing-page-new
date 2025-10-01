"use client"
import Link from 'next/link'
import { useState } from 'react'

const plans = [
  { id: 'trial', title: 'Free Trial', price: '30 Days', meta: 'No credit card required', features: ['Access to all features', 'Generate up to 15 invoices', 'Email & PDF export'] },
  { id: 'monthly', title: 'Premium', price: '$9.99', meta: 'per month', features: ['Everything in Trial', 'AI-generated invoices', 'Due date reminders'] },
  { id: 'yearly', title: 'Yearly', price: '$99.99', meta: 'per year', features: ['2 months free', 'Priority support', 'Full reports'] }
]

export default function PricingCards() {
  const [selected, setSelected] = useState('monthly')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map(p => (
        <div
          key={p.id}
          className={`rounded-xl p-6 border transition-shadow ${selected === p.id ? 'shadow-lg border-blue-300 scale-105' : 'shadow-sm border-gray-200 hover:shadow-md'}`}
          onClick={() => setSelected(p.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setSelected(p.id) }}
          aria-pressed={selected === p.id}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{p.title}</h3>
            {p.id === 'monthly' && <span className="text-sm text-blue-600 font-medium">Most popular</span>}
          </div>
          <div className="text-3xl font-bold mb-2">{p.price}</div>
          <div className="text-sm text-gray-500 mb-4">{p.meta}</div>
          <ul className="mb-6 space-y-2 text-sm text-gray-700">
            {p.features.map((f) => (
              <li key={f} className="flex items-center"><span className="mr-2">•</span>{f}</li>
            ))}
          </ul>
          <Link
            href="/signup"
            className={`inline-block w-full text-center rounded-md py-2 ${selected === p.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}
          >
            {p.id === 'trial' ? 'Start Free Trial' : p.id === 'monthly' ? 'Get Premium' : 'Choose Yearly'}
          </Link>
        </div>
      ))}
    </div>
  )
}
