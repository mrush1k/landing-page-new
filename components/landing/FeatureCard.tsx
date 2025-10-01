"use client"
import React from 'react'

type FeatureCardProps = {
  title: string
  description: string
  icon?: React.ReactNode
  highlight?: boolean
}

export default function FeatureCard({ title, description, icon, highlight = false }: FeatureCardProps) {
  return (
    <article
      className={`group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow focus-within:shadow-lg ${highlight ? 'ring-2 ring-emerald-300' : ''}`}
      tabIndex={0}
      aria-labelledby={`feature-${title.replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900 flex items-center justify-center text-emerald-600">
          {icon ?? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div>
          <h3 id={`feature-${title.replace(/\s+/g, '-')}`} className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
    </article>
  )
}
