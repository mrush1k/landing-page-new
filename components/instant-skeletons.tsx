/**
 * Instant Loading Skeletons
 * Provides immediate UI feedback while data loads in the background
 * Optimized for perceived performance and smooth user experience
 */

import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
}

/**
 * Base skeleton component with smooth animation
 */
export function Skeleton({ className = '', width, height, rounded = false }: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div 
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
    />
  )
}

/**
 * Instant Dashboard Skeleton - Shows immediately while data loads
 */
export function InstantDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton width={80} height={16} />
                <Skeleton width={60} height={24} />
              </div>
              <Skeleton width={40} height={40} rounded />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={16} />
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton width={32} height={32} rounded />
                  <div className="space-y-1">
                    <Skeleton width={100} height={16} />
                    <Skeleton width={80} height={12} />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton width={60} height={16} />
                  <Skeleton width={40} height={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <Skeleton width={100} height={20} />
          </div>
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <Skeleton width={24} height={24} />
                <Skeleton width={120} height={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Instant Invoice List Skeleton
 */
export function InstantInvoiceListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Skeleton width={200} height={40} />
        <div className="flex gap-2">
          <Skeleton width={120} height={40} />
          <Skeleton width={120} height={40} />
          <Skeleton width={100} height={40} />
        </div>
      </div>

      {/* Invoice cards/table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-hidden">
          {/* Table header */}
          <div className="border-b bg-gray-50 p-4">
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width="80%" height={16} />
              ))}
            </div>
          </div>
          
          {/* Table rows */}
          <div className="divide-y">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <Skeleton width={24} height={24} rounded />
                  <Skeleton width="70%" height={16} />
                  <Skeleton width="80%" height={16} />
                  <Skeleton width={60} height={16} />
                  <Skeleton width={80} height={16} />
                  <div className="flex gap-2">
                    <Skeleton width={32} height={32} rounded />
                    <Skeleton width={32} height={32} rounded />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Instant Customer List Skeleton
 */
export function InstantCustomerListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={150} height={32} />
        <Skeleton width={120} height={40} />
      </div>

      {/* Customer grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton width={48} height={48} rounded />
                <div className="space-y-2">
                  <Skeleton width={120} height={18} />
                  <Skeleton width={100} height={14} />
                  <Skeleton width={80} height={14} />
                </div>
              </div>
              <div className="flex gap-1">
                <Skeleton width={28} height={28} rounded />
                <Skeleton width={28} height={28} rounded />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Progressive Loading Wrapper
 * Shows skeleton immediately, then progressively loads content
 */
interface ProgressiveLoaderProps {
  loading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  minLoadTime?: number // Minimum time to show skeleton (prevents flashing)
}

export function ProgressiveLoader({ 
  loading, 
  skeleton, 
  children, 
  minLoadTime = 300 
}: ProgressiveLoaderProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(true)
  const [startTime] = React.useState(Date.now())

  React.useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadTime - elapsed)
      
      setTimeout(() => {
        setShowSkeleton(false)
      }, remainingTime)
    }
  }, [loading, startTime, minLoadTime])

  if (showSkeleton || loading) {
    return <>{skeleton}</>
  }

  return <>{children}</>
}

/**
 * Instant Page Skeleton for route transitions
 */
export function InstantPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation skeleton */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Skeleton width={120} height={32} />
              <div className="hidden md:flex space-x-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} width={80} height={16} />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton width={32} height={32} rounded />
              <Skeleton width={32} height={32} rounded />
            </div>
          </div>
        </div>
      </div>

      {/* Page content skeleton */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton width={200} height={32} />
            <Skeleton width={120} height={40} />
          </div>
          <InstantDashboardSkeleton />
        </div>
      </div>
    </div>
  )
}

/**
 * Optimized skeleton for mobile devices
 */
export function MobileOptimizedSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Mobile-first skeleton design */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <Skeleton width={40} height={40} rounded />
              <div className="flex-1 space-y-2">
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={14} />
              </div>
              <Skeleton width={60} height={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}