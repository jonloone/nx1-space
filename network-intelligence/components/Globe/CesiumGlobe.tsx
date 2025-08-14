'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import "cesium/Build/Cesium/Widgets/widgets.css"
import { useCesiumViewer } from '../../contexts/CesiumViewerContext'
import { WebGLFallback } from '../Fallback/WebGLFallback'
import { CesiumContextManager, type CesiumInitializationResult } from '../../lib/utils/cesiumContextManager'
import { detectWebGLCapabilities, generateWebGLReport } from '../../lib/utils/webglDetection'

// Set the base URL for Cesium's static assets
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium/'
  console.log('🔧 Set CESIUM_BASE_URL to /cesium/')
  
  // Set Cesium Ion token if available
  const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
  if (token) {
    Cesium.Ion.defaultAccessToken = token
    console.log('🔑 Cesium Ion token configured')
  } else {
    console.log('🔓 No Cesium Ion token - using free assets only')
  }
}

export interface CesiumGlobeProps {
  onViewerReady?: (viewer: Cesium.Viewer) => void
  children?: React.ReactNode
  performanceOverrides?: {
    forcePerformanceLevel?: 'high' | 'medium' | 'low' | 'minimal'
    disableTerrainProvider?: boolean
    disableIonImagery?: boolean
  }
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({ 
  onViewerReady, 
  children,
  performanceOverrides = {}
}) => {
  const cesiumContainer = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const contextManagerRef = useRef<CesiumContextManager | null>(null)
  const initializationAttemptRef = useRef<number>(0)
  
  const { setViewer, setState, setError, state, error } = useCesiumViewer()
  const [isContainerReady, setIsContainerReady] = useState(false)
  const [initializationProgress, setInitializationProgress] = useState<string>('')
  const [webglCapabilities, setWebglCapabilities] = useState<any>(null)

  // Wait for container to be ready
  useEffect(() => {
    if (cesiumContainer.current) {
      setIsContainerReady(true)
      console.log('📦 Container ready for Cesium initialization')
    }
  }, [])

  // Main initialization effect
  useEffect(() => {
    console.log('🔍 CesiumGlobe useEffect triggered:', {
      isContainerReady,
      hasContainer: !!cesiumContainer.current,
      hasViewer: !!viewerRef.current,
      state,
      attempt: initializationAttemptRef.current
    })
    
    // Prevent multiple simultaneous initializations
    if (!isContainerReady || 
        !cesiumContainer.current || 
        viewerRef.current || 
        state !== 'initializing' ||
        initializationAttemptRef.current > 0) {
      console.log('⏭️ Skipping initialization - preconditions not met')
      return
    }

    initializationAttemptRef.current += 1

    const initializeCesium = async () => {
      setState('loading')
      console.log('🚀 Starting advanced Cesium initialization...')
      
      try {
        // Check WebGL capabilities first
        setInitializationProgress('Detecting WebGL capabilities...')
        const capabilities = detectWebGLCapabilities()
        setWebglCapabilities(capabilities)
        
        console.log('📊 WebGL Report:', generateWebGLReport(capabilities))
        
        // Check if WebGL is supported at all
        if (!capabilities.hasWebGL) {
          throw new Error('WebGL is not supported in this browser. Please use a modern browser with WebGL enabled.')
        }
        
        // Initialize context manager
        setInitializationProgress('Initializing WebGL context...')
        if (!contextManagerRef.current) {
          contextManagerRef.current = new CesiumContextManager()
        }
        
        const contextManager = contextManagerRef.current
        
        // Find optimal WebGL configuration
        const webglConfig = await contextManager.initializeWebGLConfig()
        if (!webglConfig) {
          throw new Error('Unable to create a compatible WebGL context. Your graphics hardware may not support the required features.')
        }
        
        // Generate Cesium configuration based on capabilities and overrides
        setInitializationProgress('Generating optimal configuration...')
        const cesiumConfig = contextManager.generateCesiumConfig(cesiumContainer.current!, {
          performanceLevel: performanceOverrides.forcePerformanceLevel || capabilities.performanceLevel,
          useTerrainProvider: !performanceOverrides.disableTerrainProvider,
          useIonImagery: !performanceOverrides.disableIonImagery,
          webglConfig
        })
        
        console.log('⚙️  Using Cesium configuration:', {
          performanceLevel: cesiumConfig.performanceLevel,
          useTerrainProvider: cesiumConfig.useTerrainProvider,
          useIonImagery: cesiumConfig.useIonImagery,
          enableAntialiasing: cesiumConfig.enableAntialiasing,
          isVirtualized: capabilities.isVirtualized
        })
        
        // Initialize Cesium viewer with adaptive configuration
        setInitializationProgress('Creating Cesium viewer...')
        const result: CesiumInitializationResult = await contextManager.initializeCesiumViewer(cesiumConfig)
        
        if (!result.success || !result.viewer) {
          throw new Error(result.errorMessage || 'Failed to initialize Cesium viewer')
        }
        
        const viewer = result.viewer
        
        // Wait for initial tile loading to complete
        setInitializationProgress('Loading initial tiles...')
        await waitForInitialTileLoad(viewer)
        
        // Store references and update context
        viewerRef.current = viewer
        setViewer(viewer)
        
        // Log performance metrics
        console.log('📈 Performance Metrics:', result.performanceMetrics)
        console.log('✅ Cesium initialization completed successfully!')
        
        // Notify parent component
        if (onViewerReady) {
          onViewerReady(viewer)
        }
        
        setInitializationProgress('')
        
      } catch (error) {
        console.error('❌ Cesium initialization failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize 3D globe.'
        
        // Enhanced error categorization
        if (errorMessage.includes('WebGL') || errorMessage.includes('webgl')) {
          setError('WebGL initialization failed. Please ensure your browser supports WebGL and hardware acceleration is enabled.')
        } else if (errorMessage.includes('Ion') || errorMessage.includes('403')) {
          setError('Cesium Ion service unavailable. Using offline terrain and imagery.')
          // Retry without Ion services
          await retryWithoutIonServices()
        } else if (errorMessage.includes('context') || errorMessage.includes('Context')) {
          setError('Graphics context creation failed. This may be due to insufficient GPU memory or driver issues.')
        } else {
          setError(errorMessage)
        }
        
        viewerRef.current = null
        setInitializationProgress('')
      }
    }

    initializeCesium()

    // Cleanup function
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        console.log('🧹 Cleaning up Cesium viewer')
        viewerRef.current.destroy()
        setViewer(null)
        viewerRef.current = null
      }
    }
  }, [isContainerReady, state, onViewerReady, setState, setViewer, setError, performanceOverrides])

  // Helper method to wait for initial tile loading
  const waitForInitialTileLoad = (viewer: Cesium.Viewer): Promise<void> => {
    return new Promise((resolve) => {
      let tilesLoaded = false
      let timeoutId: NodeJS.Timeout
      
      const handleTileLoadProgress = (queueLength: number) => {
        if (queueLength === 0 && !tilesLoaded) {
          tilesLoaded = true
          clearTimeout(timeoutId)
          viewer.scene.globe.tileLoadProgressEvent.removeEventListener(handleTileLoadProgress)
          console.log('🗺️  Initial tiles loaded successfully')
          resolve()
        }
      }
      
      // Listen for tile load completion
      viewer.scene.globe.tileLoadProgressEvent.addEventListener(handleTileLoadProgress)
      
      // Fallback timeout - don't wait forever
      timeoutId = setTimeout(() => {
        if (!tilesLoaded) {
          tilesLoaded = true
          viewer.scene.globe.tileLoadProgressEvent.removeEventListener(handleTileLoadProgress)
          console.log('⏰ Tile loading timeout - proceeding anyway')
          resolve()
        }
      }, 5000) // 5 second timeout
    })
  }

  // Retry initialization without Ion services
  const retryWithoutIonServices = async (): Promise<void> => {
    if (!cesiumContainer.current || !contextManagerRef.current) return
    
    console.log('🔄 Retrying initialization without Ion services...')
    
    try {
      const cesiumConfig = contextManagerRef.current.generateCesiumConfig(cesiumContainer.current, {
        useTerrainProvider: false, // Use ellipsoid terrain
        useIonImagery: false, // Use alternative imagery
        performanceLevel: 'medium' // Conservative settings
      })
      
      const result = await contextManagerRef.current.initializeCesiumViewer(cesiumConfig)
      
      if (result.success && result.viewer) {
        viewerRef.current = result.viewer
        setViewer(result.viewer)
        setError(null) // Clear the error
        
        if (onViewerReady) {
          onViewerReady(result.viewer)
        }
        
        console.log('✅ Retry successful - using fallback providers')
      }
    } catch (retryError) {
      console.error('❌ Retry also failed:', retryError)
      // Keep the original error message
    }
  }

  // Render error fallback
  if (error) {
    // Check if it's a WebGL error and show appropriate fallback
    if (error.includes('WebGL') || error.includes('webgl') || error.includes('context')) {
      return <WebGLFallback onRetry={() => {
        setError(null)
        initializationAttemptRef.current = 0 // Reset attempt counter
      }} />
    }
    
    // Generic error fallback with retry option
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center p-8 max-w-md">
          <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
          <p className="text-white text-lg mb-2">Globe Initialization Error</p>
          <p className="text-gray-400 mb-4 text-sm">{error}</p>
          
          {/* WebGL capabilities info */}
          {webglCapabilities && (
            <div className="bg-gray-800 rounded p-3 mb-4 text-xs text-left">
              <p className="text-gray-300 mb-1">Environment Info:</p>
              <p className="text-gray-400">Performance Level: {webglCapabilities.performanceLevel}</p>
              <p className="text-gray-400">Virtualized: {webglCapabilities.isVirtualized ? 'Yes' : 'No'}</p>
              <p className="text-gray-400">WebGL 2: {webglCapabilities.hasWebGL2 ? 'Yes' : 'No'}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null)
                initializationAttemptRef.current = 0
              }}
              className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="relative w-full h-full bg-black" suppressHydrationWarning>
      <div ref={cesiumContainer} className="w-full h-full" />
      
      {/* Render children only when viewer is ready */}
      {state === 'ready' && children}
      
      {/* Loading overlay with progress indicator */}
      {(state === 'initializing' || state === 'loading') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400 mb-2">
              {state === 'initializing' ? 'Preparing 3D Globe...' : 'Loading 3D Globe...'}
            </p>
            
            {/* Progress indicator */}
            {initializationProgress && (
              <p className="text-gray-500 text-sm">{initializationProgress}</p>
            )}
            
            {/* WebGL info */}
            {webglCapabilities && (
              <div className="mt-4 text-xs text-gray-500">
                Performance Level: {webglCapabilities.performanceLevel} | 
                WebGL {webglCapabilities.hasWebGL2 ? '2.0' : '1.0'} | 
                {webglCapabilities.isVirtualized ? 'Virtualized' : 'Native'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}