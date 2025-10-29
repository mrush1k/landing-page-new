/**
 * Invoice Creation Instant Loading Skeletons
 * Provides immediate UI feedback for invoice form components
 * Target: <50ms render, smooth transitions
 */

"use client"

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
  
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div 
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
    />
  )
}

/**
 * Instant Invoice Form Skeleton
 * Shows immediate structure of invoice creation form
 */
export function InstantInvoiceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height={28} />
          <Skeleton width={150} height={16} />
        </div>
        <Skeleton width={120} height={40} />
      </div>

      {/* Invoice Details Card */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <Skeleton width={180} height={24} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton width={100} height={16} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className="space-y-2">
            <Skeleton width={120} height={16} />
            <Skeleton width="100%" height={40} />
          </div>
          <div className="space-y-2">
            <Skeleton width={100} height={16} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
      </div>

      {/* Customer Selection Card */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={150} height={24} />
          <Skeleton width={120} height={36} />
        </div>
        <Skeleton width="100%" height={40} />
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={120} height={24} />
          <Skeleton width={100} height={36} />
        </div>
        
        {/* Item rows */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center py-2">
            <div className="col-span-4">
              <Skeleton width="100%" height={36} />
            </div>
            <div className="col-span-2">
              <Skeleton width="100%" height={36} />
            </div>
            <div className="col-span-2">
              <Skeleton width="100%" height={36} />
            </div>
            <div className="col-span-2">
              <Skeleton width="100%" height={36} />
            </div>
            <div className="col-span-2">
              <Skeleton width="100%" height={36} />
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="bg-white rounded-lg border p-6 space-y-3">
        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between">
              <Skeleton width={80} height={16} />
              <Skeleton width={80} height={16} />
            </div>
            <div className="flex justify-between">
              <Skeleton width={60} height={16} />
              <Skeleton width={60} height={16} />
            </div>
            <div className="flex justify-between border-t pt-2">
              <Skeleton width={60} height={20} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Skeleton width={100} height={40} />
        <Skeleton width={120} height={40} />
        <Skeleton width={140} height={40} />
      </div>
    </div>
  )
}

/**
 * Customer Selection Skeleton
 * Specific for customer dropdown/selection
 */
export function CustomerSelectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width={180} height={20} />
        <Skeleton width={120} height={36} />
      </div>
      <Skeleton width="100%" height={44} />
      
      {/* Recent customers preview */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded border">
            <Skeleton width={32} height={32} rounded />
            <div className="flex-1 space-y-1">
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Form Field Skeleton
 * Reusable for individual form sections
 */
export function FormFieldSkeleton({ 
  label = true, 
  width = "100%", 
  height = 40 
}: { 
  label?: boolean
  width?: string | number
  height?: number 
}) {
  return (
    <div className="space-y-2">
      {label && <Skeleton width={120} height={16} />}
      <Skeleton width={width} height={height} />
    </div>
  )
}

/**
 * Progressive Invoice Loader
 * Smooth transition from skeleton to content
 */
export function ProgressiveInvoiceLoader({ 
  isLoading, 
  children 
}: { 
  isLoading: boolean
  children: React.ReactNode 
}) {
  return (
    <div className="relative">
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <InstantInvoiceSkeleton />
      </div>
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}