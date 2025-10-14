/**
 * Error Logging Service
 * Centralized error tracking and reporting
 */

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  RENDERING = 'rendering',
  DATA_PROCESSING = 'data_processing',
  USER_INPUT = 'user_input',
  AUTHENTICATION = 'authentication',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  category?: ErrorCategory
  severity?: ErrorSeverity
  user?: {
    id?: string
    email?: string
  }
  metadata?: Record<string, any>
  tags?: string[]
  timestamp?: Date
}

export interface ErrorLog {
  id: string
  message: string
  stack?: string
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  timestamp: Date
  userAgent?: string
  url?: string
  resolved: boolean
}

class ErrorLoggingService {
  private logs: ErrorLog[] = []
  private readonly maxLogs = 1000
  private errorHandlers: Array<(log: ErrorLog) => void> = []

  constructor() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this))
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
    }
  }

  /**
   * Log an error
   */
  logError(
    error: Error | string,
    context: ErrorContext = {}
  ): ErrorLog {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    const log: ErrorLog = {
      id: this.generateId(),
      message: errorMessage,
      stack: errorStack,
      category: context.category || ErrorCategory.UNKNOWN,
      severity: context.severity || ErrorSeverity.ERROR,
      context: {
        ...context,
        timestamp: context.timestamp || new Date()
      },
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      resolved: false
    }

    // Add to logs
    this.logs.push(log)

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(log)
    }

    // Call custom handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(log)
      } catch (e) {
        console.error('[ErrorLoggingService] Handler error:', e)
      }
    })

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(log)
    }

    return log
  }

  /**
   * Log warning
   */
  logWarning(message: string, context: ErrorContext = {}): ErrorLog {
    return this.logError(message, {
      ...context,
      severity: ErrorSeverity.WARNING
    })
  }

  /**
   * Log info
   */
  logInfo(message: string, context: ErrorContext = {}): ErrorLog {
    return this.logError(message, {
      ...context,
      severity: ErrorSeverity.INFO
    })
  }

  /**
   * Log network error
   */
  logNetworkError(error: Error | string, context: ErrorContext = {}): ErrorLog {
    return this.logError(error, {
      ...context,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR
    })
  }

  /**
   * Log API error
   */
  logApiError(
    endpoint: string,
    error: Error | string,
    context: ErrorContext = {}
  ): ErrorLog {
    return this.logError(error, {
      ...context,
      category: ErrorCategory.API,
      metadata: {
        ...context.metadata,
        endpoint
      }
    })
  }

  /**
   * Log rendering error
   */
  logRenderingError(
    component: string,
    error: Error | string,
    context: ErrorContext = {}
  ): ErrorLog {
    return this.logError(error, {
      ...context,
      category: ErrorCategory.RENDERING,
      metadata: {
        ...context.metadata,
        component
      }
    })
  }

  /**
   * Log data processing error
   */
  logDataProcessingError(
    operation: string,
    error: Error | string,
    context: ErrorContext = {}
  ): ErrorLog {
    return this.logError(error, {
      ...context,
      category: ErrorCategory.DATA_PROCESSING,
      metadata: {
        ...context.metadata,
        operation
      }
    })
  }

  /**
   * Handle global window errors
   */
  private handleGlobalError(event: ErrorEvent) {
    this.logError(event.error || event.message, {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.logError(event.reason, {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      metadata: {
        type: 'unhandledRejection'
      }
    })
  }

  /**
   * Console log with color coding
   */
  private consoleLog(log: ErrorLog) {
    const colors = {
      [ErrorSeverity.DEBUG]: 'color: gray',
      [ErrorSeverity.INFO]: 'color: blue',
      [ErrorSeverity.WARNING]: 'color: orange',
      [ErrorSeverity.ERROR]: 'color: red',
      [ErrorSeverity.CRITICAL]: 'color: red; font-weight: bold'
    }

    console.group(`%c[${log.severity.toUpperCase()}] ${log.category}`, colors[log.severity])
    console.log('Message:', log.message)
    if (log.stack) console.log('Stack:', log.stack)
    if (log.context.metadata) console.log('Metadata:', log.context.metadata)
    console.log('Timestamp:', log.timestamp.toISOString())
    console.groupEnd()
  }

  /**
   * Send error to external logging service
   */
  private async sendToExternalService(log: ErrorLog) {
    try {
      // TODO: Integrate with external services:
      // - Sentry: Sentry.captureException(error, { extra: log })
      // - LogRocket: LogRocket.captureException(error, { extra: log })
      // - Custom endpoint: fetch('/api/errors', { method: 'POST', body: JSON.stringify(log) })

      // For now, just log to console in production
      console.error('[Production Error]', {
        id: log.id,
        message: log.message,
        category: log.category,
        severity: log.severity,
        timestamp: log.timestamp
      })
    } catch (error) {
      console.error('[ErrorLoggingService] Failed to send error to external service:', error)
    }
  }

  /**
   * Get all logs
   */
  getLogs(filters?: {
    category?: ErrorCategory
    severity?: ErrorSeverity
    resolved?: boolean
  }): ErrorLog[] {
    let logs = this.logs

    if (filters) {
      if (filters.category) {
        logs = logs.filter(log => log.category === filters.category)
      }
      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity)
      }
      if (filters.resolved !== undefined) {
        logs = logs.filter(log => log.resolved === filters.resolved)
      }
    }

    return logs
  }

  /**
   * Mark error as resolved
   */
  resolveError(id: string) {
    const log = this.logs.find(l => l.id === id)
    if (log) {
      log.resolved = true
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Register custom error handler
   */
  onError(handler: (log: ErrorLog) => void) {
    this.errorHandlers.push(handler)

    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler)
      if (index > -1) {
        this.errorHandlers.splice(index, 1)
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const total = this.logs.length
    const bySeverity = this.logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const resolved = this.logs.filter(log => log.resolved).length
    const unresolved = total - resolved

    return {
      total,
      bySeverity,
      byCategory,
      resolved,
      unresolved
    }
  }
}

// Singleton instance
let errorLoggingService: ErrorLoggingService | null = null

export function getErrorLoggingService(): ErrorLoggingService {
  if (!errorLoggingService) {
    errorLoggingService = new ErrorLoggingService()
  }
  return errorLoggingService
}

export default ErrorLoggingService
