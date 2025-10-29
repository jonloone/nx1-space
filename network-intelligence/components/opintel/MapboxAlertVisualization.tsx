/**
 * Mapbox Native Alert Visualization
 * Uses Mapbox GL layers directly on the map (no floating Deck.gl overlay)
 *
 * Features:
 * - Native Mapbox clustering (no floating)
 * - Building coloring based on alert proximity
 * - Heatmap visualization at low zoom
 * - Circle markers at high zoom
 * - All rendered as part of the map itself
 */

'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { getCitizens360DataService } from '@/lib/services/citizens360DataService'
import { getBuildingPlaceMapper } from '@/lib/services/buildingPlaceMapper'

export interface MapboxAlertVisualizationProps {
  map: mapboxgl.Map
  autoUpdate?: boolean
  onAlertClick?: (alert: IntelligenceAlert) => void
}

// Priority colors (same as before)
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#e31a1c',  // Dark red
  high: '#fc4e2a',      // Red-orange
  medium: '#fd8d3c',    // Dark orange
  low: '#feb24c'        // Orange
}

// Cluster configuration
const CLUSTER_CONFIG = {
  radius: 60,
  maxZoom: 12
}

export default function MapboxAlertVisualization({
  map,
  autoUpdate = true,
  onAlertClick
}: MapboxAlertVisualizationProps) {
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Track if sources/layers have been added
  const layersInitialized = useRef(false)

  /**
   * Load alerts from Citizens 360 data service
   */
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const dataService = getCitizens360DataService()
      const generatedAlerts = await dataService.generateIntelligenceAlerts()

      console.log(`📊 Loaded ${generatedAlerts.length} intelligence alerts`)

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
    }, 30000)

    return () => clearInterval(interval)
  }, [autoUpdate, loadAlerts])

  /**
   * Convert alerts to GeoJSON for Mapbox
   */
  const alertsToGeoJSON = useCallback((alerts: IntelligenceAlert[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: alerts
        .filter(alert => alert.location)
        .map(alert => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: alert.location!.coordinates
          },
          properties: {
            id: alert.id,
            title: alert.title,
            priority: alert.priority,
            timestamp: alert.timestamp,
            // Priority weight for clustering
            weight: alert.priority === 'critical' ? 10 :
                   alert.priority === 'high' ? 5 :
                   alert.priority === 'medium' ? 2 : 1
          }
        }))
    }
  }, [])

  /**
   * Color nearby buildings based on alert proximity
   * Uses spatial queries to find buildings within radius of alerts
   */
  const colorBuildingsByAlerts = useCallback(async (alerts: IntelligenceAlert[]) => {
    if (!map || !alerts.length) return

    // Wait for map style to be loaded
    if (!map.getStyle || !map.getStyle()) {
      return
    }

    // Group alerts by priority
    const criticalAlerts = alerts.filter(a => a.priority === 'critical' && a.location)
    const highAlerts = alerts.filter(a => a.priority === 'high' && a.location)

    console.log(`🎨 Coloring buildings near ${criticalAlerts.length} critical and ${highAlerts.length} high priority alerts`)

    // Check if building layers exist before attempting to query them
    const has2DBuildings = map.getLayer('buildings-2d') !== undefined
    const has3DBuildings = map.getLayer('buildings-3d') !== undefined
    const buildingLayers = [
      ...(has2DBuildings ? ['buildings-2d'] : []),
      ...(has3DBuildings ? ['buildings-3d'] : [])
    ]

    // Skip building coloring if no building layers are available
    if (buildingLayers.length === 0) {
      console.log('⏭️ Skipping building coloring - no building layers available')
      return
    }

    try {
      // Create a map of building IDs to alert colors
      const buildingColors = new Map<string, string>()

      // Query buildings near each critical alert (100m radius)
      for (const alert of criticalAlerts) {
        try {
          const [lng, lat] = alert.location!.coordinates

          // Create a small bounding box around the alert
          const radius = 0.001 // ~100m in degrees
          const bounds = [
            [lng - radius, lat - radius],
            [lng + radius, lat + radius]
          ] as [[number, number], [number, number]]

          // Query buildings in this area
          const features = map.queryRenderedFeatures(bounds, {
            layers: buildingLayers
          })

          // Color these buildings red (critical)
          features.forEach(feature => {
            if (feature.id) {
              buildingColors.set(String(feature.id), PRIORITY_COLORS.critical)
            }
          })
        } catch (err) {
          // Building layers not available, skip
        }
      }

      // Query buildings near high priority alerts (smaller radius)
      for (const alert of highAlerts) {
        try {
          const [lng, lat] = alert.location!.coordinates

          const radius = 0.0005 // ~50m in degrees
          const bounds = [
            [lng - radius, lat - radius],
            [lng + radius, lat + radius]
          ] as [[number, number], [number, number]]

          const features = map.queryRenderedFeatures(bounds, {
            layers: buildingLayers
          })

          // Only color if not already colored by critical alert
          features.forEach(feature => {
            if (feature.id && !buildingColors.has(String(feature.id))) {
              buildingColors.set(String(feature.id), PRIORITY_COLORS.high)
            }
          })
        } catch (err) {
          // Building layers not available, skip
        }
      }

      console.log(`🏢 Found ${buildingColors.size} buildings near alerts`)

      // Apply feature-state based coloring for performance
      // This is the Mapbox-recommended approach for dynamic styling
      buildingColors.forEach((color, buildingId) => {
        map.setFeatureState(
          { source: 'overture-buildings', id: buildingId },
          { alertColor: color }
        )
      })

      // Update layer paint properties to use feature-state
      if (map.getLayer('buildings-3d')) {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-color', [
          'case',
          ['!=', ['feature-state', 'alertColor'], null],
          ['feature-state', 'alertColor'],
          '#d4d4d8' // Default gray
        ])

        // Add slight opacity to buildings with alerts
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', [
          'case',
          ['!=', ['feature-state', 'alertColor'], null],
          0.8,
          0.6
        ])
      }

      if (map.getLayer('buildings-2d')) {
        map.setPaintProperty('buildings-2d', 'fill-color', [
          'case',
          ['!=', ['feature-state', 'alertColor'], null],
          ['feature-state', 'alertColor'],
          '#d4d4d8' // Default gray
        ])

        map.setPaintProperty('buildings-2d', 'fill-opacity', [
          'case',
          ['!=', ['feature-state', 'alertColor'], null],
          0.8,
          0.6
        ])
      }

    } catch (err) {
      console.warn('Building layers not available for coloring:', err)
    }
  }, [map])

  /**
   * Initialize Mapbox layers
   */
  useEffect(() => {
    if (!map || layersInitialized.current || alerts.length === 0) return

    // Wait for map style to be loaded
    if (!map.getStyle || !map.getStyle()) {
      console.log('⏸️ Map style not loaded yet, waiting...')
      return
    }

    console.log('🗺️ Initializing Mapbox native alert layers...')

    try {
      const geojson = alertsToGeoJSON(alerts)

      // Add GeoJSON source for alerts
      if (!map.getSource('alerts')) {
        map.addSource('alerts', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: CLUSTER_CONFIG.maxZoom,
          clusterRadius: CLUSTER_CONFIG.radius,
          clusterProperties: {
            // Count alerts by priority in cluster
            critical: ['+', ['case', ['==', ['get', 'priority'], 'critical'], 1, 0]],
            high: ['+', ['case', ['==', ['get', 'priority'], 'high'], 1, 0]],
            medium: ['+', ['case', ['==', ['get', 'priority'], 'medium'], 1, 0]],
            low: ['+', ['case', ['==', ['get', 'priority'], 'low'], 1, 0]]
          }
        })

        console.log('✅ Added alerts GeoJSON source')
      }

      // Layer 1: Heatmap (low zoom - density overview)
      if (!map.getLayer('alerts-heatmap')) {
        map.addLayer({
          id: 'alerts-heatmap',
          type: 'heatmap',
          source: 'alerts',
          maxzoom: 10,
          filter: ['!', ['has', 'point_count']], // Only show unclustered points
          paint: {
            // Increase weight for critical alerts
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight'],
              0, 0,
              10, 1
            ],
            // Color gradient
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            // Radius
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              10, 20
            ],
            // Opacity
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 0.8,
              10, 0.5
            ]
          }
        })

        console.log('✅ Added heatmap layer')
      }

      // Layer 2: Cluster circles (zoom 0-12)
      if (!map.getLayer('alerts-clusters')) {
        map.addLayer({
          id: 'alerts-clusters',
          type: 'circle',
          source: 'alerts',
          filter: ['has', 'point_count'],
          paint: {
            // Color by highest priority in cluster
            'circle-color': [
              'case',
              ['>', ['get', 'critical'], 0], PRIORITY_COLORS.critical,
              ['>', ['get', 'high'], 0], PRIORITY_COLORS.high,
              ['>', ['get', 'medium'], 0], PRIORITY_COLORS.medium,
              PRIORITY_COLORS.low
            ],
            // Size by point count
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15,   // 1-9 alerts
              10, 20,  // 10-49 alerts
              50, 25,  // 50-99 alerts
              100, 30  // 100+ alerts
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.9
          }
        })

        console.log('✅ Added cluster circles layer')
      }

      // Layer 3: Cluster count labels
      if (!map.getLayer('alerts-cluster-count')) {
        map.addLayer({
          id: 'alerts-cluster-count',
          type: 'symbol',
          source: 'alerts',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': [
              'concat',
              ['get', 'point_count_abbreviated'],
              '\n',
              ['case', ['>', ['get', 'critical'], 0], '⚠️', '']
            ],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        })

        console.log('✅ Added cluster labels layer')
      }

      // Layer 4: Unclustered point circles (zoom 13+)
      if (!map.getLayer('alerts-unclustered-point')) {
        map.addLayer({
          id: 'alerts-unclustered-point',
          type: 'circle',
          source: 'alerts',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'priority'],
              'critical', PRIORITY_COLORS.critical,
              'high', PRIORITY_COLORS.high,
              'medium', PRIORITY_COLORS.medium,
              'low', PRIORITY_COLORS.low,
              '#999'
            ],
            'circle-radius': [
              'match',
              ['get', 'priority'],
              'critical', 10,
              'high', 8,
              'medium', 6,
              'low', 5,
              4
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.9
          }
        })

        console.log('✅ Added individual markers layer')
      }

      // Layer 5: Pulsing critical alerts (zoom 13+)
      if (!map.getLayer('alerts-critical-pulse')) {
        map.addLayer({
          id: 'alerts-critical-pulse',
          type: 'circle',
          source: 'alerts',
          filter: ['all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'priority'], 'critical']
          ],
          paint: {
            'circle-radius': 15,
            'circle-color': PRIORITY_COLORS.critical,
            'circle-opacity': 0.3,
            'circle-blur': 0.8
          }
        })

        console.log('✅ Added pulsing critical alerts layer')
      }

      layersInitialized.current = true
      console.log('✅ All alert layers initialized')

      // Color buildings based on alert locations
      colorBuildingsByAlerts(alerts)

    } catch (error) {
      console.error('❌ Failed to initialize alert layers:', error)
    }
  }, [map, alerts, alertsToGeoJSON, colorBuildingsByAlerts])

  /**
   * Update GeoJSON source when alerts change
   */
  useEffect(() => {
    if (!map || !layersInitialized.current) return

    // Wait for map style to be loaded
    if (!map.getStyle || !map.getStyle()) {
      return
    }

    const source = map.getSource('alerts') as mapboxgl.GeoJSONSource
    if (source) {
      const geojson = alertsToGeoJSON(alerts)
      source.setData(geojson)
      console.log(`🔄 Updated alerts source with ${alerts.length} alerts`)

      // Update building colors
      colorBuildingsByAlerts(alerts)
    }
  }, [alerts, map, alertsToGeoJSON, colorBuildingsByAlerts])

  /**
   * Click handlers for clusters and individual alerts
   */
  useEffect(() => {
    if (!map || !layersInitialized.current) {
      console.log('⏸️ Click handlers not initialized yet:', {
        map: !!map,
        layersInitialized: layersInitialized.current
      })
      return
    }

    // Wait for map style to be loaded
    if (!map.getStyle || !map.getStyle()) {
      return
    }

    console.log('🎯 Setting up click handlers for alerts')
    console.log('Available alert layers:', {
      'alerts-clusters': !!map.getLayer('alerts-clusters'),
      'alerts-unclustered-point': !!map.getLayer('alerts-unclustered-point')
    })
    console.log('Total alerts available:', alerts.length)

    // Click cluster to zoom
    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      console.log('📦 Cluster click handler triggered')
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['alerts-clusters']
      })

      if (features.length > 0) {
        const feature = features[0]
        const clusterId = feature.properties?.cluster_id
        const source = map.getSource('alerts') as mapboxgl.GeoJSONSource

        if (clusterId && source) {
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return

            const coordinates = (feature.geometry as any).coordinates
            map.flyTo({
              center: coordinates,
              zoom: zoom || 13,
              duration: 800
            })

            console.log(`📦 Cluster clicked, zooming to level ${zoom}`)
          })
        }
      }
    }

    // Click individual alert to open panel
    const handleAlertClick = (e: mapboxgl.MapMouseEvent) => {
      console.log('🎯 Alert click handler triggered at:', e.point)

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['alerts-unclustered-point']
      })

      console.log(`Found ${features.length} features at click point`)

      if (features.length > 0) {
        const props = features[0].properties
        console.log('Feature properties:', props)

        if (!props) {
          console.warn('⚠️ No properties found on feature')
          return
        }

        console.log(`🎯 Alert clicked: ${props.title}`)

        // Find full alert object
        const alert = alerts.find(a => a.id === props.id)
        if (!alert) {
          console.error(`❌ Could not find alert with id: ${props.id}`)
          return
        }

        console.log('✅ Alert clicked, injecting into chat:', alert.id)

        // Inject alert into chat interface (chat-first architecture)
        if (onAlertClick) {
          onAlertClick(alert)
        }

        console.log('✅ Panel state updated')
      } else {
        console.log('ℹ️ No features found at click point')
      }
    }

    // Hover cursor changes
    const handleMouseEnter = () => {
      console.log('🖱️ Mouse entered alert area')
      map.getCanvas().style.cursor = 'pointer'
    }

    const handleMouseLeave = () => {
      console.log('🖱️ Mouse left alert area')
      map.getCanvas().style.cursor = ''
    }

    // Add event listeners
    console.log('➕ Adding event listeners to layers')
    map.on('click', 'alerts-clusters', handleClusterClick)
    map.on('click', 'alerts-unclustered-point', handleAlertClick)
    map.on('mouseenter', 'alerts-clusters', handleMouseEnter)
    map.on('mouseleave', 'alerts-clusters', handleMouseLeave)
    map.on('mouseenter', 'alerts-unclustered-point', handleMouseEnter)
    map.on('mouseleave', 'alerts-unclustered-point', handleMouseLeave)

    return () => {
      console.log('➖ Removing event listeners from layers')
      map.off('click', 'alerts-clusters', handleClusterClick)
      map.off('click', 'alerts-unclustered-point', handleAlertClick)
      map.off('mouseenter', 'alerts-clusters', handleMouseEnter)
      map.off('mouseleave', 'alerts-clusters', handleMouseLeave)
      map.off('mouseenter', 'alerts-unclustered-point', handleMouseEnter)
      map.off('mouseleave', 'alerts-unclustered-point', handleMouseLeave)
    }
  }, [map, alerts, onAlertClick])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (!map) return

      // Remove layers
      const layers = [
        'alerts-critical-pulse',
        'alerts-unclustered-point',
        'alerts-cluster-count',
        'alerts-clusters',
        'alerts-heatmap'
      ]

      // Only remove layers if map style is loaded
      if (map.getStyle && map.getStyle()) {
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId)
          }
        })

        // Remove source
        if (map.getSource('alerts')) {
          map.removeSource('alerts')
        }
      }

      layersInitialized.current = false
      console.log('🧹 Cleaned up alert layers')
    }
  }, [map])

  // No overlay rendering - alerts are shown in the panel when clicked
  return null
}
