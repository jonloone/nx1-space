'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Logs errors and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Update state with error details
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      this.logErrorToService(error, errorInfo)
    }
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Placeholder for external error logging
    // In production, integrate with services like:
    // - Sentry.captureException(error, { extra: errorInfo })
    // - LogRocket.captureException(error)
    // - Custom analytics endpoint

    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
    }

    console.log('[Production Error Log]', errorData)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
          >
            {/* Icon and Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                <p className="text-gray-400 text-sm mt-1">
                  An unexpected error occurred. Our team has been notified.
                </p>
              </div>
            </div>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="text-sm font-mono">
                  <div className="text-red-400 font-semibold mb-2">Error Message:</div>
                  <div className="text-white mb-4">{this.state.error.message}</div>

                  {this.state.error.stack && (
                    <>
                      <div className="text-red-400 font-semibold mb-2">Stack Trace:</div>
                      <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="text-red-400 font-semibold mb-2 mt-4">Component Stack:</div>
                      <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Production Error Message */}
            {process.env.NODE_ENV === 'production' && (
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-gray-300 text-sm">
                  We apologize for the inconvenience. The error has been logged and our team
                  will investigate the issue. Please try refreshing the page or returning home.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={this.handleReset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>

              <motion.button
                onClick={this.handleReload}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </motion.button>

              <motion.button
                onClick={() => typeof window !== 'undefined' && (window.location.href = '/')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Support Information */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                If this problem persists, please contact{' '}
                <a href="mailto:support@nexusone.earth" className="text-purple-400 hover:underline">
                  support@nexusone.earth
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary wrapper
 * For functional components that need error handling
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

export default ErrorBoundary
