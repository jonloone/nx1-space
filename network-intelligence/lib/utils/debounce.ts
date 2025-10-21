/**
 * Debounce Utility
 * Delays function execution until after a specified wait time has elapsed
 * since the last time it was invoked
 */

export interface DebounceOptions {
  leading?: boolean // Execute on the leading edge (immediate)
  trailing?: boolean // Execute on the trailing edge (after delay)
  maxWait?: number // Maximum time function can be delayed
}

export type DebouncedFunction<T extends (...args: any[]) => any> = T & {
  cancel: () => void
  flush: () => void
  pending: () => boolean
}

/**
 * Create a debounced function
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Additional options (leading, trailing, maxWait)
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching:', query)
 * }, 300)
 *
 * debouncedSearch('hello') // Will execute after 300ms
 * debouncedSearch('hello world') // Previous call is cancelled
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options

  let timeoutId: NodeJS.Timeout | null = null
  let maxTimeoutId: NodeJS.Timeout | null = null
  let lastCallTime: number | null = null
  let lastInvokeTime = 0
  let lastArgs: Parameters<T> | null = null
  let lastThis: any = null
  let result: ReturnType<T> | undefined

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = null
    lastThis = null
    lastInvokeTime = time

    result = func.apply(thisArg, args)
    return result
  }

  function leadingEdge(time: number): ReturnType<T> | undefined {
    // Reset max wait timer
    lastInvokeTime = time

    // Start timer for trailing edge
    timeoutId = setTimeout(timerExpired, wait)

    // Invoke immediately if leading edge
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - lastCallTime!
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - lastCallTime!
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either first call or wait time has elapsed or max wait has elapsed
    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    )
  }

  function timerExpired(): void {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }

    // Restart the timer
    timeoutId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number): ReturnType<T> | undefined {
    timeoutId = null

    // Only invoke if we have `lastArgs` which means `debounced` was invoked
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }

    lastArgs = null
    lastThis = null
    return result
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId)
      maxTimeoutId = null
    }

    lastCallTime = null
    lastInvokeTime = 0
    lastArgs = null
    lastThis = null
  }

  function flush(): ReturnType<T> | undefined {
    if (timeoutId === null) {
      return result
    }

    const time = Date.now()
    return trailingEdge(time)
  }

  function pending(): boolean {
    return timeoutId !== null
  }

  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args as Parameters<T>
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime)
      }

      if (maxWait !== undefined) {
        // Handle invocations in a tight loop
        timeoutId = setTimeout(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait)
    }

    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced as DebouncedFunction<T>
}

/**
 * Create a throttled function (executes at most once per specified time)
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('Scrolling')
 * }, 100)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  return debounce(func, wait, { leading: true, trailing: true, maxWait: wait })
}
