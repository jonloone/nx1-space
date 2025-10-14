/**
 * Retry Logic Utilities
 * Provides robust retry mechanisms for API calls and async operations
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryIf?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryIf: () => true,
  onRetry: () => {}
}

/**
 * Retry an async function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Promise resolving to function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let attempt = 0
  let lastError: any

  while (attempt < opts.maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempt++

      // Check if we should retry this error
      if (!opts.retryIf(error)) {
        throw error
      }

      // Don't delay on last attempt
      if (attempt >= opts.maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )

      // Call retry callback
      opts.onRetry(attempt, error)

      console.log(`[Retry] Attempt ${attempt}/${opts.maxAttempts} failed. Retrying in ${delay}ms...`, error)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  console.error(`[Retry] All ${opts.maxAttempts} attempts failed`, lastError)
  throw lastError
}

/**
 * Retry only on network errors
 */
export function retryOnNetworkError<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'retryIf'> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    retryIf: (error) => {
      // Retry on network errors, timeouts, 5xx errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return true
      }
      if (error.message?.includes('timeout')) {
        return true
      }
      if (error.status >= 500 && error.status < 600) {
        return true
      }
      // Don't retry on 4xx errors (client errors)
      if (error.status >= 400 && error.status < 500) {
        return false
      }
      return true
    }
  })
}

/**
 * Fetch with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryOnNetworkError(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
        error.status = response.status
        error.response = response
        throw error
      }

      return response
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }, retryOptions)
}

/**
 * Promise with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError = new Error('Operation timed out')
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(timeoutError), timeoutMs)
    )
  ])
}

/**
 * Batch requests with rate limiting
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private activeCount = 0
  private readonly maxConcurrent: number
  private readonly minInterval: number
  private lastCallTime = 0

  constructor(maxConcurrent = 5, minInterval = 100) {
    this.maxConcurrent = maxConcurrent
    this.minInterval = minInterval
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    // Respect minimum interval between calls
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCallTime
    if (timeSinceLastCall < this.minInterval) {
      setTimeout(() => this.process(), this.minInterval - timeSinceLastCall)
      return
    }

    this.activeCount++
    this.lastCallTime = Date.now()

    const fn = this.queue.shift()
    if (fn) {
      try {
        await fn()
      } finally {
        this.activeCount--
        this.process()
      }
    }
  }
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  private failures = 0
  private successCount = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private nextAttempt = 0

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000, // 1 minute
    private readonly monitoringPeriod = 10000 // 10 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= 2) {
        this.state = 'CLOSED'
        this.successCount = 0
      }
    }
  }

  private onFailure() {
    this.failures++
    this.successCount = 0

    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
      console.warn(`[CircuitBreaker] Circuit opened after ${this.failures} failures. Will retry at ${new Date(this.nextAttempt).toISOString()}`)
    }
  }

  getState() {
    return this.state
  }

  reset() {
    this.failures = 0
    this.successCount = 0
    this.state = 'CLOSED'
    this.nextAttempt = 0
  }
}

/**
 * Memoize async function with expiration
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyFn?: (...args: Parameters<T>) => string
    ttl?: number // Time to live in ms
  } = {}
): T {
  const cache = new Map<string, { value: any; expires: number }>()
  const { keyFn = (...args) => JSON.stringify(args), ttl = 60000 } = options

  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args)
    const cached = cache.get(key)

    if (cached && Date.now() < cached.expires) {
      return cached.value
    }

    const value = await fn(...args)
    cache.set(key, {
      value,
      expires: Date.now() + ttl
    })

    // Clean up expired entries
    setTimeout(() => {
      if (cache.get(key)?.expires && Date.now() >= cache.get(key)!.expires) {
        cache.delete(key)
      }
    }, ttl)

    return value
  }) as T
}

/**
 * Debounced async function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          const result = await fn(...args)
          resolve(result)
          pendingPromise = null
          timeoutId = null
        }, delay)
      })
    }

    return pendingPromise
  }
}

export default {
  retryWithBackoff,
  retryOnNetworkError,
  fetchWithRetry,
  withTimeout,
  RateLimiter,
  CircuitBreaker,
  memoizeAsync,
  debounceAsync
}
