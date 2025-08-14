'use client'

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import * as Cesium from 'cesium'

// Viewer states
export type ViewerState = 'initializing' | 'loading' | 'ready' | 'error' | 'destroyed'

export interface CesiumViewerContextType {
  viewer: Cesium.Viewer | null
  state: ViewerState
  error: string | null
  isReady: boolean
  setViewer: (viewer: Cesium.Viewer | null) => void
  setState: (state: ViewerState) => void
  setError: (error: string | null) => void
  initializationAttempts: number
}

const CesiumViewerContext = createContext<CesiumViewerContextType | null>(null)

interface CesiumViewerProviderProps {
  children: ReactNode
}

export const CesiumViewerProvider: React.FC<CesiumViewerProviderProps> = ({ children }) => {
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null)
  const [state, setState] = useState<ViewerState>('initializing')
  const [error, setError] = useState<string | null>(null)
  const [initializationAttempts, setInitializationAttempts] = useState(0)
  const initializationLock = useRef(false)

  // Derived state
  const isReady = state === 'ready' && viewer !== null && !viewer.isDestroyed()

  // Enhanced setViewer with validation
  const setViewerSafely = (newViewer: Cesium.Viewer | null) => {
    // Prevent setting viewer during initialization lock
    if (initializationLock.current && newViewer !== null) {
      console.warn('Viewer initialization blocked - already in progress')
      return
    }

    // Validate viewer before setting
    if (newViewer && newViewer.isDestroyed()) {
      console.warn('Attempted to set destroyed viewer')
      return
    }

    // Update state based on viewer
    if (newViewer) {
      setViewer(newViewer)
      setState('ready')
      setError(null)
      console.log('✅ Cesium viewer successfully initialized')
    } else {
      setViewer(null)
      if (state !== 'destroyed') {
        setState('initializing')
      }
    }
  }

  // Enhanced setState with logging
  const setStateSafely = (newState: ViewerState) => {
    const oldState = state;
    setState(newState);
    console.log(`🔄 Cesium viewer state: ${oldState} → ${newState}`);
    
    if (newState === 'loading') {
      setInitializationAttempts(prev => {
        const newAttempts = prev + 1;
        console.log(`🔢 Initialization attempt: ${newAttempts}`);
        return newAttempts;
      });
      initializationLock.current = true;
    } else if (newState === 'ready' || newState === 'error') {
      initializationLock.current = false;
    }
  }

  // Enhanced setError with state management
  const setErrorSafely = (newError: string | null) => {
    setError(newError)
    if (newError) {
      setState('error')
      initializationLock.current = false
      console.error('❌ Cesium viewer error:', newError)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        console.log('🧹 Cleaning up Cesium viewer')
        viewer.destroy()
        setState('destroyed')
      }
    }
  }, [viewer])

  // Hot reload protection - detect rapid re-initialization
  useEffect(() => {
    if (initializationAttempts > 3 && state === 'loading') {
      console.warn('⚠️ Multiple initialization attempts detected - possible hot reload issue')
      setErrorSafely('Multiple initialization attempts detected. Please refresh the page.')
    }
  }, [initializationAttempts, state])

  const contextValue: CesiumViewerContextType = {
    viewer,
    state,
    error,
    isReady,
    setViewer: setViewerSafely,
    setState: setStateSafely,
    setError: setErrorSafely,
    initializationAttempts
  }

  return (
    <CesiumViewerContext.Provider value={contextValue}>
      {children}
    </CesiumViewerContext.Provider>
  )
}

// Custom hook with validation
export const useCesiumViewer = () => {
  const context = useContext(CesiumViewerContext)
  if (!context) {
    throw new Error('useCesiumViewer must be used within a CesiumViewerProvider')
  }
  return context
}

// Hook for safely accessing viewer properties
export const useSafeViewer = () => {
  const { viewer, isReady } = useCesiumViewer()
  
  const safeAccess = <T,>(accessor: (viewer: Cesium.Viewer) => T): T | null => {
    if (!isReady || !viewer || viewer.isDestroyed()) {
      return null
    }
    
    try {
      return accessor(viewer)
    } catch (error) {
      console.warn('Safe viewer access failed:', error)
      return null
    }
  }

  return {
    viewer: isReady ? viewer : null,
    isReady,
    safeAccess
  }
}