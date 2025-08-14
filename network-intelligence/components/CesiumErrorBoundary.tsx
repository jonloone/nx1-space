'use client'

import React, { Component, ReactNode } from 'react'
import { detectWebGLCapabilities, generateWebGLReport, type WebGLCapabilities } from '../lib/utils/webglDetection'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableDiagnostics?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  webglCapabilities: WebGLCapabilities | null
  errorCategory: 'webgl' | 'cesium' | 'network' | 'memory' | 'unknown'
  retryCount: number
  lastRetryTime: number
}

interface ErrorPattern {
  pattern: RegExp
  category: 'webgl' | 'cesium' | 'network' | 'memory' | 'unknown'
  description: string
  suggestedAction: string
}

class CesiumErrorBoundary extends Component<Props, State> {
  private readonly errorPatterns: ErrorPattern[] = [
    {
      pattern: /webgl|WebGL|gl\.getContext|CONTEXT_LOST|BindToCurrentSequence/i,
      category: 'webgl',
      description: 'WebGL context creation or management error',
      suggestedAction: 'Check browser WebGL support and hardware acceleration'
    },
    {
      pattern: /cesium|Cesium|CesiumWidget|TerrainProvider|ImageryProvider/i,
      category: 'cesium',
      description: 'Cesium library initialization or configuration error',
      suggestedAction: 'Verify Cesium configuration and asset availability'
    },
    {
      pattern: /fetch|network|NETWORK_ERROR|ERR_NETWORK|Failed to load resource/i,
      category: 'network',
      description: 'Network connectivity or resource loading error',
      suggestedAction: 'Check internet connection and firewall settings'
    },
    {
      pattern: /memory|MEMORY|out of memory|insufficient|heap/i,
      category: 'memory',
      description: 'Memory allocation or management error',
      suggestedAction: 'Close other applications or use a device with more memory'
    }
  ]

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      webglCapabilities: null,
      errorCategory: 'unknown',
      retryCount: 0,
      lastRetryTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 CesiumErrorBoundary caught an error:', error, errorInfo)
    
    // Detect WebGL capabilities for diagnostics
    const webglCapabilities = detectWebGLCapabilities()
    
    // Categorize the error
    const errorCategory = this.categorizeError(error)
    
    // Log comprehensive error information
    this.logErrorDetails(error, errorInfo, webglCapabilities, errorCategory)
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
      webglCapabilities,
      errorCategory
    })

    // Call external error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to external monitoring service (if available)
    this.reportError(error, errorInfo, webglCapabilities, errorCategory)
  }

  private categorizeError(error: Error): 'webgl' | 'cesium' | 'network' | 'memory' | 'unknown' {
    const errorMessage = error.message + ' ' + (error.stack || '')
    
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern.category
      }
    }
    
    return 'unknown'
  }

  private logErrorDetails(
    error: Error, 
    errorInfo: React.ErrorInfo, 
    webglCapabilities: WebGLCapabilities,
    category: string
  ) {
    console.group(`🌍 Cesium Error Boundary - ${category.toUpperCase()} Error`)
    
    console.error('Error Details:', {
      message: error.message,
      name: error.name,
      category,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      webglSupported: webglCapabilities.hasWebGL,
      webgl2Supported: webglCapabilities.hasWebGL2,
      performanceLevel: webglCapabilities.performanceLevel,
      isVirtualized: webglCapabilities.isVirtualized,
      renderer: webglCapabilities.renderer,
      vendor: webglCapabilities.vendor
    })
    
    console.error('Stack Trace:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    
    if (this.props.enableDiagnostics) {
      console.log('WebGL Environment Report:')
      console.log(generateWebGLReport(webglCapabilities))
    }
    
    console.groupEnd()
  }

  private reportError(
    error: Error, 
    errorInfo: React.ErrorInfo, 
    webglCapabilities: WebGLCapabilities,
    category: string
  ) {
    // Example: Send to monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        custom_map: {
          error_category: category,
          webgl_supported: webglCapabilities.hasWebGL,
          performance_level: webglCapabilities.performanceLevel,
          is_virtualized: webglCapabilities.isVirtualized
        }
      })
    }
  }

  private canRetry(): boolean {
    const now = Date.now()
    const timeSinceLastRetry = now - this.state.lastRetryTime
    const retryLimit = this.state.errorCategory === 'webgl' ? 2 : 5 // Limit WebGL retries
    
    return this.state.retryCount < retryLimit && timeSinceLastRetry > 5000 // 5 second cooldown
  }

  private getErrorPattern(): ErrorPattern | null {
    if (!this.state.error) return null
    
    const errorMessage = this.state.error.message + ' ' + (this.state.error.stack || '')
    
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern
      }
    }
    
    return null
  }

  private handleRetry = () => {
    if (!this.canRetry()) {
      console.warn('Retry limit reached or cooldown active')
      return
    }

    console.log(`🔄 Retrying after ${this.state.errorCategory} error (attempt ${this.state.retryCount + 1})`)
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      lastRetryTime: Date.now()
    })
  }

  private handleForceRefresh = () => {
    // Clear any cached state before refresh
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cesium-viewer-state')
      sessionStorage.clear()
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorPattern = this.getErrorPattern()
      const canRetry = this.canRetry()

      // Enhanced error UI with diagnostics
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-center p-8 max-w-lg">
            {/* Error icon based on category */}
            <div className="text-6xl mb-6">
              {this.state.errorCategory === 'webgl' && '🎮'}
              {this.state.errorCategory === 'cesium' && '🌍'}
              {this.state.errorCategory === 'network' && '🌐'}
              {this.state.errorCategory === 'memory' && '💾'}
              {this.state.errorCategory === 'unknown' && '⚠️'}
            </div>
            
            <h2 className="text-white text-xl font-bold mb-4">
              {this.state.errorCategory === 'webgl' && 'WebGL Error'}
              {this.state.errorCategory === 'cesium' && 'Globe Initialization Error'}
              {this.state.errorCategory === 'network' && 'Network Error'}
              {this.state.errorCategory === 'memory' && 'Memory Error'}
              {this.state.errorCategory === 'unknown' && 'Application Error'}
            </h2>
            
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              {errorPattern?.description || 'An unexpected error occurred with the 3D globe.'}
            </p>

            {/* Specific guidance based on error category */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-gray-300 text-sm font-medium mb-2">Recommended Action:</p>
              <p className="text-gray-400 text-sm">
                {errorPattern?.suggestedAction || 'Try refreshing the page or contact support if the issue persists.'}
              </p>
            </div>

            {/* Environment info */}
            {this.state.webglCapabilities && (
              <div className="bg-gray-900 rounded-lg p-3 mb-4 text-xs text-left">
                <p className="text-gray-300 mb-2 font-medium">Environment:</p>
                <div className="space-y-1 text-gray-400">
                  <p>WebGL: {this.state.webglCapabilities.hasWebGL ? 
                    (this.state.webglCapabilities.hasWebGL2 ? '2.0' : '1.0') : 'Not supported'}</p>
                  <p>Performance: {this.state.webglCapabilities.performanceLevel}</p>
                  <p>Environment: {this.state.webglCapabilities.isVirtualized ? 'Virtualized' : 'Native'}</p>
                  <p>Renderer: {this.state.webglCapabilities.renderer}</p>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 
                           transition-colors font-medium"
                >
                  Try Again {this.state.retryCount > 0 && `(${this.state.retryCount + 1}/5)`}
                </button>
              )}
              
              <button
                onClick={this.handleForceRefresh}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 
                         transition-colors font-medium"
              >
                Refresh Page
              </button>

              {/* Fallback to 2D mode */}
              {this.state.errorCategory === 'webgl' && (
                <button
                  onClick={() => {
                    // Navigate to a 2D fallback route if available
                    window.location.href = window.location.pathname + '?mode=2d'
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors font-medium"
                >
                  Use 2D Map Mode
                </button>
              )}
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 cursor-pointer text-xs mb-2">
                  Debug Information (Development)
                </summary>
                <div className="bg-gray-900 p-3 rounded text-xs text-red-400 overflow-auto max-h-40">
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold">Error:</span> {this.state.error.message}
                    </div>
                    <div>
                      <span className="font-bold">Category:</span> {this.state.errorCategory}
                    </div>
                    <div>
                      <span className="font-bold">Retry Count:</span> {this.state.retryCount}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <span className="font-bold">Component Stack:</span>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {this.state.errorInfo}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CesiumErrorBoundary