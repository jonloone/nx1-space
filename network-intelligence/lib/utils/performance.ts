/**
 * Performance Optimization Utilities
 * Tools for monitoring and optimizing application performance
 */

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private marks: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  start(label: string) {
    this.marks.set(label, performance.now())
  }

  /**
   * End timing and record duration
   */
  end(label: string): number {
    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`[Performance] No start mark found for: ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)

    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      return result
    } finally {
      this.end(label)
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(label: string) {
    const durations = this.metrics.get(label) || []
    if (durations.length === 0) {
      return null
    }

    const sorted = [...durations].sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)

    return {
      count: durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  /**
   * Get all metrics
   */
  getAllStats() {
    const stats: Record<string, any> = {}
    this.metrics.forEach((_, label) => {
      stats[label] = this.getStats(label)
    })
    return stats
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear()
    this.marks.clear()
  }

  /**
   * Log all stats to console
   */
  logStats() {
    console.table(this.getAllStats())
  }
}

/**
 * Chunk large arrays for processing
 */
export function* chunkArray<T>(array: T[], size: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size)
  }
}

/**
 * Process large arrays in chunks with yield to event loop
 */
export async function processInChunks<T, R>(
  array: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  options: {
    chunkSize?: number
    onProgress?: (processed: number, total: number) => void
    yieldInterval?: number
  } = {}
): Promise<R[]> {
  const {
    chunkSize = 100,
    onProgress,
    yieldInterval = 10
  } = options

  const results: R[] = []
  let processed = 0
  let lastYield = Date.now()

  for (const chunk of chunkArray(array, chunkSize)) {
    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i]
      const result = await processor(item, processed + i)
      results.push(result)

      // Yield to event loop periodically
      if (Date.now() - lastYield > yieldInterval) {
        await new Promise(resolve => setTimeout(resolve, 0))
        lastYield = Date.now()
      }
    }

    processed += chunk.length
    onProgress?.(processed, array.length)
  }

  return results
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let lastRan: number = 0

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now()

    if (!lastRan || now - lastRan >= wait) {
      func(...args)
      lastRan = now
    } else {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        func(...args)
        lastRan = Date.now()
      }, wait - (now - lastRan))
    }
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Request idle callback wrapper
 */
export function requestIdleTask(
  callback: () => void,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  // Fallback to setTimeout
  return setTimeout(callback, 1) as any
}

/**
 * Batch DOM reads/writes to avoid layout thrashing
 */
export class DOMBatcher {
  private readQueue: Array<() => void> = []
  private writeQueue: Array<() => void> = []
  private scheduled = false

  read(fn: () => void) {
    this.readQueue.push(fn)
    this.schedule()
  }

  write(fn: () => void) {
    this.writeQueue.push(fn)
    this.schedule()
  }

  private schedule() {
    if (this.scheduled) return
    this.scheduled = true

    requestAnimationFrame(() => {
      // Execute all reads first
      while (this.readQueue.length) {
        const fn = this.readQueue.shift()!
        fn()
      }

      // Then execute all writes
      while (this.writeQueue.length) {
        const fn = this.writeQueue.shift()!
        fn()
      }

      this.scheduled = false
    })
  }
}

/**
 * Memory-efficient large dataset handler
 */
export class VirtualDataset<T> {
  private data: T[]
  private pageSize: number
  private cache: Map<number, T[]> = new Map()

  constructor(data: T[], pageSize = 100) {
    this.data = data
    this.pageSize = pageSize
  }

  /**
   * Get page of data
   */
  getPage(pageIndex: number): T[] {
    if (this.cache.has(pageIndex)) {
      return this.cache.get(pageIndex)!
    }

    const start = pageIndex * this.pageSize
    const end = start + this.pageSize
    const page = this.data.slice(start, end)

    this.cache.set(pageIndex, page)

    // Limit cache size
    if (this.cache.size > 10) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    return page
  }

  /**
   * Get total pages
   */
  getTotalPages(): number {
    return Math.ceil(this.data.length / this.pageSize)
  }

  /**
   * Get item by index
   */
  getItem(index: number): T | undefined {
    return this.data[index]
  }

  /**
   * Get data length
   */
  get length(): number {
    return this.data.length
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }
}

/**
 * Web Worker pool for heavy computation
 */
export class WorkerPool {
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private taskQueue: Array<{
    data: any
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  constructor(workerScript: string, poolSize = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript)
      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }
  }

  /**
   * Execute task in worker
   */
  execute<T>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.availableWorkers.pop()

      if (worker) {
        this.runTask(worker, data, resolve, reject)
      } else {
        // Queue task if no workers available
        this.taskQueue.push({ data, resolve, reject })
      }
    })
  }

  private runTask(
    worker: Worker,
    data: any,
    resolve: (value: any) => void,
    reject: (error: any) => void
  ) {
    const handleMessage = (event: MessageEvent) => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      this.releaseWorker(worker)
      resolve(event.data)
    }

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      this.releaseWorker(worker)
      reject(error)
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)
    worker.postMessage(data)
  }

  private releaseWorker(worker: Worker) {
    this.availableWorkers.push(worker)

    // Process queued tasks
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!
      const nextWorker = this.availableWorkers.pop()!
      this.runTask(nextWorker, task.data, task.resolve, task.reject)
    }
  }

  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
  }
}

/**
 * Lazy load component or resource
 */
export function lazyLoad<T>(
  loader: () => Promise<T>,
  options: {
    preload?: boolean
    timeout?: number
  } = {}
): () => Promise<T> {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  const load = async (): Promise<T> => {
    if (cached) return cached

    if (loading) return loading

    loading = (async () => {
      try {
        const loaded = await (options.timeout
          ? Promise.race([
              loader(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Load timeout')), options.timeout)
              )
            ])
          : loader())

        cached = loaded
        return loaded
      } finally {
        loading = null
      }
    })()

    return loading
  }

  // Preload if requested
  if (options.preload) {
    requestIdleTask(() => load())
  }

  return load
}

// Singleton performance monitor
let perfMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!perfMonitor) {
    perfMonitor = new PerformanceMonitor()
  }
  return perfMonitor
}

export default {
  PerformanceMonitor,
  getPerformanceMonitor,
  chunkArray,
  processInChunks,
  throttle,
  debounce,
  requestIdleTask,
  DOMBatcher,
  VirtualDataset,
  WorkerPool,
  lazyLoad
}
