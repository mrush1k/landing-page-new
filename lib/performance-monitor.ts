/**
 * Simple performance monitoring utility
 * Tracks page load times and authentication performance
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private startTimes: Map<string, number> = new Map()

  startTimer(name: string): void {
    this.startTimes.set(name, performance.now())
  }

  endTimer(name: string): number {
    const startTime = this.startTimes.get(name)
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    })

    this.startTimes.delete(name)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${name} completed in ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageTime(metricName: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === metricName)
    if (relevantMetrics.length === 0) return 0
    
    const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0)
    return total / relevantMetrics.length
  }

  clear(): void {
    this.metrics = []
    this.startTimes.clear()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Helper hooks for React components
export function usePerformanceTimer(name: string) {
  React.useEffect(() => {
    performanceMonitor.startTimer(name)
    return () => {
      performanceMonitor.endTimer(name)
    }
  }, [name])
}

// React import (only if using hooks)
import React from 'react'