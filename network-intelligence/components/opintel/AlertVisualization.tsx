/**
 * Alert Visualization Component
 * Main component for federal-grade alert visualization on the map
 *
 * Features:
 * - Automatic alert loading from Citizens 360 data service
 * - Multi-layer rendering (heat map, clusters, markers, pulsing)
 * - Real-time updates every 30 seconds
 * - Click handlers for right panel integration
 * - Performance monitoring
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DeckGL } from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { getCitizens360DataService } from '@/lib/services/citizens360DataService'
import { createAlertLayers, getAlertLayerStats, checkAlertLayerPerformance } from '@/components/deck-layers/AlertLayerManager'
import { PULSING_CONFIG } from '@/components/deck-layers/PulsingAlertLayer'
import { usePanelStore } from '@/lib/stores/panelStore'

export interface AlertVisualizationProps {
  mapRef?: any // Mapbox GL map reference
  viewport?: {
    zoom: number
    latitude: number
    longitude: number
    bearing?: number
    pitch?: number
  }
  autoUpdate?: boolean // Enable 30-second auto-refresh
  onAlertClick?: (alert: IntelligenceAlert) => void
}

/**
 * Alert Visualization Component
 * Renders Deck.gl layers on top of Mapbox GL map
 */
export default function AlertVisualization({
  mapRef,
  viewport: externalViewport,
  autoUpdate = true,
  onAlertClick
}: AlertVisualizationProps) {
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Animation state for pulsing alerts (0-1 phase in animation cycle)
  const [pulsePhase, setPulsePhase] = useState(0)
  const animationFrameRef = useRef<number | null>(null)

  // Store cluster coordinates and zoom for "Focus on Cluster" functionality
  const clusterCoordinatesRef = useRef<[number, number] | null>(null)
  const clusterExpansionZoomRef = useRef<number>(12)

  // Internal viewport state (fallback if external not provided)
  const [internalViewport, setInternalViewport] = useState({
    zoom: 4,
    latitude: 39.8283,
    longitude: -98.5795,
    bearing: 0,
    pitch: 0
  })

  const viewport = externalViewport || internalViewport

  // Panel store for right panel integration
  const { setRightPanelData, setRightPanelMode } = usePanelStore()

  /**
   * Load alerts from Citizens 360 data service
   */
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dataService = getCitizens360DataService()
      const generatedAlerts = await dataService.generateIntelligenceAlerts()

      console.log(`📊 Loaded ${generatedAlerts.length} intelligence alerts`)

      // Log statistics
      const byPriority = {
        critical: generatedAlerts.filter(a => a.priority === 'critical').length,
        high: generatedAlerts.filter(a => a.priority === 'high').length,
        medium: generatedAlerts.filter(a => a.priority === 'medium').length,
        low: generatedAlerts.filter(a => a.priority === 'low').length
      }

      console.log('Alert breakdown:', byPriority)

      setAlerts(generatedAlerts)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Failed to load alerts:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoUpdate) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing alerts...')
      loadAlerts()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoUpdate, loadAlerts])

  /**
   * Pulsing animation loop (60fps)
   * Only runs when zoomed in enough and critical alerts exist
   */
  useEffect(() => {
    // Check if pulsing should be enabled
    const shouldAnimate =
      viewport.zoom >= PULSING_CONFIG.minZoomForPulsing &&
      alerts.some(alert => alert.priority === 'critical' && alert.location)

    if (!shouldAnimate) {
      // Stop animation if running
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setPulsePhase(0)
      return
    }

    // Start animation loop
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const phase = (elapsed % PULSING_CONFIG.pulseRate) / PULSING_CONFIG.pulseRate
      setPulsePhase(phase)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    // Cleanup on unmount or when animation should stop
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [viewport.zoom, alerts])

  /**
   * Handle alert click - open right panel WITHOUT moving map
   */
  const handleAlertClick = useCallback((alert: IntelligenceAlert) => {
    console.log('🎯 Alert clicked:', alert.title)

    // Open right panel with alert data (NO map movement)
    setRightPanelMode('alert')
    setRightPanelData({
      alert,
      timestamp: new Date()
    })

    // Call custom handler if provided
    if (onAlertClick) {
      onAlertClick(alert)
    }
  }, [setRightPanelMode, setRightPanelData, onAlertClick])

  /**
   * Handle cluster click - auto-zoom for progressive disclosure
   * Industry pattern: clicking cluster zooms in to reveal individual alerts
   */
  const handleClusterClick = useCallback((
    clusterId: number,
    expansionZoom: number,
    clusterAlerts: IntelligenceAlert[],
    coordinates: [number, number]
  ) => {
    console.log(`📦 Cluster clicked: ${clusterAlerts.length} alerts at [${coordinates}]`)
    console.log(`🔍 Auto-zooming to level ${expansionZoom} (progressive disclosure)`)

    // Auto-zoom to expansion level (Google Maps/Mapbox pattern)
    if (mapRef?.current) {
      mapRef.current.flyTo({
        center: coordinates,
        zoom: expansionZoom,
        duration: 800,
        essential: true
      })
    }
  }, [mapRef])

  /**
   * Handle "Focus on Cluster" button - center and zoom to cluster
   */
  const handleFocusCluster = useCallback(() => {
    if (mapRef?.current && clusterCoordinatesRef.current) {
      const [lng, lat] = clusterCoordinatesRef.current
      const targetZoom = clusterExpansionZoomRef.current
      console.log(`🎯 Focusing on cluster at [${lng}, ${lat}], zoom: ${targetZoom}`)

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: targetZoom,
        duration: 800,
        essential: true
      })
    }
  }, [mapRef])

  // Calculate viewport bounds for clustering
  const bounds = useMemo(() => {
    if (!mapRef?.current) return undefined

    try {
      const map = mapRef.current
      const mapBounds = map.getBounds()

      return [
        mapBounds.getWest(),
        mapBounds.getSouth(),
        mapBounds.getEast(),
        mapBounds.getNorth()
      ] as [number, number, number, number]
    } catch (err) {
      return undefined
    }
  }, [mapRef, viewport.zoom, viewport.latitude, viewport.longitude])

  /**
   * Generate Deck.gl layers using pure functions
   * All animation state managed at this component level
   */
  const layers = useMemo(() => {
    return createAlertLayers({
      alerts,
      viewport: {
        zoom: viewport.zoom,
        latitude: viewport.latitude,
        longitude: viewport.longitude,
        bounds
      },
      pulsePhase, // Animation state passed to pure function
      onAlertClick: handleAlertClick,
      onClusterClick: handleClusterClick
    })
  }, [alerts, viewport.zoom, viewport.latitude, viewport.longitude, bounds, pulsePhase, handleAlertClick, handleClusterClick])

  /**
   * Get statistics using pure function
   */
  const stats = useMemo(
    () => getAlertLayerStats(alerts, viewport.zoom),
    [alerts, viewport.zoom]
  )

  // Performance check
  const performance = useMemo(
    () => checkAlertLayerPerformance(alerts.length, viewport.zoom),
    [alerts.length, viewport.zoom]
  )

  // Log performance warnings
  useEffect(() => {
    if (performance.performanceLevel === 'degraded' || performance.performanceLevel === 'poor') {
      console.warn(`⚠️ Alert visualization performance: ${performance.performanceLevel}`)
      console.warn(`Estimated FPS: ${performance.estimatedFPS}`)
      console.warn('Recommendations:', performance.recommendations)
    }
  }, [performance])

  // Show loading state
  if (loading && alerts.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        zIndex: 1000
      }}>
        Loading intelligence alerts...
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(220, 38, 38, 0.95)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '6px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        zIndex: 1000
      }}>
        ❌ Failed to load alerts: {error}
      </div>
    )
  }

  // Render Deck.gl layers (these will overlay on Mapbox)
  return (
    <>
      {/* Performance indicator (only show if degraded) */}
      {performance.performanceLevel !== 'excellent' && performance.performanceLevel !== 'good' && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: performance.performanceLevel === 'poor' ? '#ef4444' : '#f59e0b',
          padding: '8px 12px',
          borderRadius: '6px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          zIndex: 1000
        }}>
          ⚠️ Performance: {performance.performanceLevel.toUpperCase()} ({performance.estimatedFPS} FPS)
        </div>
      )}

      {/* Alert statistics overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
          Intelligence Alerts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>Total: <strong>{stats.totalAlerts}</strong></div>
          <div>
            <span style={{ color: '#ef4444' }}>●</span> Critical: <strong>{stats.byPriority.critical}</strong>
          </div>
          <div>
            <span style={{ color: '#f97316' }}>●</span> High: <strong>{stats.byPriority.high}</strong>
          </div>
          <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
            Zoom: {viewport.zoom.toFixed(1)} | Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Deck.gl layers rendered on top of Mapbox */}
      {mapRef?.current && (
        <DeckGL
          layers={layers}
          viewState={{
            longitude: viewport.longitude,
            latitude: viewport.latitude,
            zoom: viewport.zoom,
            pitch: 0,
            bearing: 0
          }}
          controller={false}
          glOptions={{
            preserveDrawingBuffer: true
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none' // Let map handle zoom/pan, layers handle their own clicks
          }}
          getTooltip={() => null}
        />
      )}
    </>
  )
}

/**
 * Hook to use alert visualization layers directly
 * For integration with existing DeckGL setups
 */
export function useAlertVisualizationLayers(
  viewport: { zoom: number; latitude: number; longitude: number; bounds?: [number, number, number, number] },
  onAlertClick?: (alert: IntelligenceAlert) => void
) {
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([])
  const [pulsePhase, setPulsePhase] = useState(0)
  const animationFrameRef = useRef<number | null>(null)

  // Load alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const dataService = getCitizens360DataService()
        const generatedAlerts = await dataService.generateIntelligenceAlerts()
        setAlerts(generatedAlerts)
      } catch (err) {
        console.error('Failed to load alerts:', err)
      }
    }

    loadAlerts()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Pulsing animation loop
  useEffect(() => {
    const shouldAnimate =
      viewport.zoom >= PULSING_CONFIG.minZoomForPulsing &&
      alerts.some(alert => alert.priority === 'critical' && alert.location)

    if (!shouldAnimate) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setPulsePhase(0)
      return
    }

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const phase = (elapsed % PULSING_CONFIG.pulseRate) / PULSING_CONFIG.pulseRate
      setPulsePhase(phase)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [viewport.zoom, alerts])

  // Generate layers using pure function
  return useMemo(
    () =>
      createAlertLayers({
        alerts,
        viewport,
        pulsePhase,
        onAlertClick
      }),
    [alerts, viewport, pulsePhase, onAlertClick]
  )
}
