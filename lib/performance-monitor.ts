// Performance monitoring utilities for production deployment
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(operation: string): () => void {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, [])
      }

      this.metrics.get(operation)!.push(duration)

      // Log slow operations in development
      if (process.env.NODE_ENV === "development" && duration > 1000) {
        console.warn(`[Performance] Slow operation: ${operation} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  getMetrics(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.metrics.get(operation)
    if (!times || times.length === 0) return null

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
    }
  }

  logAllMetrics(): void {
    console.group("[Performance Metrics]")
    for (const [operation, times] of this.metrics.entries()) {
      const metrics = this.getMetrics(operation)
      if (metrics) {
        console.log(`${operation}:`, {
          average: `${metrics.avg.toFixed(2)}ms`,
          min: `${metrics.min.toFixed(2)}ms`,
          max: `${metrics.max.toFixed(2)}ms`,
          calls: metrics.count,
        })
      }
    }
    console.groupEnd()
  }
}

// Hook for React components
export function usePerformanceTimer(operation: string) {
  const monitor = PerformanceMonitor.getInstance()
  return monitor.startTimer(operation)
}
