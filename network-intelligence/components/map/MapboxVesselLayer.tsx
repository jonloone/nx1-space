'use client'

/**
 * MapboxVesselLayer - Professional Vessel Visualization for Mapbox GL
 *
 * Features:
 * - Dynamic vessel icons by type (cargo, tanker, passenger, fishing, tug, yacht)
 * - Heading rotation for each vessel
 * - Status-based coloring (moving, anchored, moored, idle, offline)
 * - Zoom-based icon scaling
 * - Click and hover interactions
 * - Vessel track trails
 */

import { useEffect, useCallback, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { FleetVessel } from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface VesselMapData {
  mmsi: string
  name: string
  vesselType: string
  status: 'moving' | 'anchored' | 'moored' | 'idle' | 'offline' | 'active' | 'inactive' | 'unknown'
  lat: number
  lng: number
  heading: number
  speed: number
  lastUpdate?: Date
  anomalyCount?: number
  trackHistory?: [number, number][] // Array of [lng, lat] points for trail
}

export interface MapboxVesselLayerProps {
  map: mapboxgl.Map | null
  vessels: VesselMapData[]
  selectedVesselId?: string | null
  onVesselClick?: (vessel: VesselMapData) => void
  onVesselHover?: (vessel: VesselMapData | null) => void
  showTrails?: boolean
  trailMinutes?: number
}

// ============================================================================
// Constants
// ============================================================================

const VESSEL_TYPE_ICONS: Record<string, string> = {
  cargo: 'vessel-cargo',
  container: 'vessel-cargo',
  tanker: 'vessel-tanker',
  passenger: 'vessel-passenger',
  ferry: 'vessel-passenger',
  cruise: 'vessel-passenger',
  fishing: 'vessel-fishing',
  tug: 'vessel-tug',
  tugboat: 'vessel-tug',
  yacht: 'vessel-yacht',
  sailboat: 'vessel-yacht',
  unknown: 'vessel-unknown',
  other: 'vessel-unknown'
}

const STATUS_COLORS: Record<string, string> = {
  moving: '#3b82f6',     // Blue
  active: '#3b82f6',     // Blue (alias)
  anchored: '#8b5cf6',   // Purple
  moored: '#6366f1',     // Indigo
  idle: '#f59e0b',       // Amber
  inactive: '#6b7280',   // Gray
  offline: '#6b7280',    // Gray
  unknown: '#6b7280'     // Gray
}

const SOURCE_ID = 'vessels-source'
const LAYER_ID = 'vessels-layer'
const SELECTED_LAYER_ID = 'vessels-selected-layer'
const TRAIL_SOURCE_ID = 'vessel-trails-source'
const TRAIL_LAYER_ID = 'vessel-trails-layer'

// ============================================================================
// Helpers
// ============================================================================

function getVesselIcon(vesselType: string): string {
  const normalized = vesselType?.toLowerCase().trim() || 'unknown'
  return VESSEL_TYPE_ICONS[normalized] || 'vessel-unknown'
}

function getStatusColor(status: string): string {
  const normalized = status?.toLowerCase().trim() || 'unknown'
  return STATUS_COLORS[normalized] || STATUS_COLORS.unknown
}

function normalizeStatus(status: string): string {
  const s = status?.toLowerCase().trim() || 'unknown'
  if (s === 'active') return 'moving'
  if (s === 'inactive') return 'offline'
  return s
}

// ============================================================================
// Component
// ============================================================================

export default function MapboxVesselLayer({
  map,
  vessels,
  selectedVesselId,
  onVesselClick,
  onVesselHover,
  showTrails = false,
  trailMinutes = 10
}: MapboxVesselLayerProps) {
  const layersInitialized = useRef(false)
  const iconsLoaded = useRef(false)

  /**
   * Load vessel icons as images into Mapbox
   */
  const loadIcons = useCallback(async (mapInstance: mapboxgl.Map) => {
    if (iconsLoaded.current) return

    const iconTypes = ['cargo', 'tanker', 'passenger', 'fishing', 'tug', 'yacht', 'unknown']

    for (const type of iconTypes) {
      const iconName = `vessel-${type}`
      if (mapInstance.hasImage(iconName)) continue

      try {
        // Load SVG as image
        const response = await fetch(`/icons/${iconName}.svg`)
        const svgText = await response.text()

        // Create image from SVG
        const img = new Image(32, 32)
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            if (!mapInstance.hasImage(iconName)) {
              mapInstance.addImage(iconName, img, { sdf: true })
            }
            resolve()
          }
          img.onerror = reject
        })
      } catch (err) {
        console.warn(`Failed to load vessel icon: ${iconName}`, err)
      }
    }

    iconsLoaded.current = true
  }, [])

  /**
   * Convert vessels to GeoJSON
   */
  const vesselsToGeoJSON = useCallback((vesselData: VesselMapData[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: vesselData.map(vessel => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [vessel.lng, vessel.lat]
        },
        properties: {
          mmsi: vessel.mmsi,
          name: vessel.name,
          vesselType: vessel.vesselType,
          status: normalizeStatus(vessel.status),
          heading: vessel.heading || 0,
          speed: vessel.speed || 0,
          icon: getVesselIcon(vessel.vesselType),
          color: getStatusColor(vessel.status),
          anomalyCount: vessel.anomalyCount || 0,
          isSelected: vessel.mmsi === selectedVesselId
        }
      }))
    }
  }, [selectedVesselId])

  /**
   * Convert vessel trails to GeoJSON
   */
  const trailsToGeoJSON = useCallback((vesselData: VesselMapData[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: vesselData
        .filter(v => v.trackHistory && v.trackHistory.length > 1)
        .map(vessel => ({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: vessel.trackHistory!
          },
          properties: {
            mmsi: vessel.mmsi,
            color: getStatusColor(vessel.status)
          }
        }))
    }
  }, [])

  /**
   * Initialize map layers
   */
  const initializeLayers = useCallback(async (mapInstance: mapboxgl.Map) => {
    if (layersInitialized.current) return

    // Wait for icons to load first
    await loadIcons(mapInstance)

    // Add vessel trail source and layer
    if (!mapInstance.getSource(TRAIL_SOURCE_ID)) {
      mapInstance.addSource(TRAIL_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
    }

    if (!mapInstance.getLayer(TRAIL_LAYER_ID) && showTrails) {
      mapInstance.addLayer({
        id: TRAIL_LAYER_ID,
        type: 'line',
        source: TRAIL_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.6
        }
      })
    }

    // Add vessel source
    if (!mapInstance.getSource(SOURCE_ID)) {
      mapInstance.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
    }

    // Add main vessel layer
    if (!mapInstance.getLayer(LAYER_ID)) {
      mapInstance.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 0.4,
            8, 0.6,
            12, 0.9,
            16, 1.2
          ],
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': false,
          'symbol-sort-key': [
            'case',
            ['get', 'isSelected'], 0,
            ['>', ['get', 'anomalyCount'], 0], 1,
            2
          ]
        },
        paint: {
          'icon-color': ['get', 'color'],
          'icon-opacity': [
            'case',
            ['get', 'isSelected'], 1,
            0.85
          ]
        }
      })
    }

    // Add selected vessel highlight layer (larger glow effect)
    if (!mapInstance.getLayer(SELECTED_LAYER_ID)) {
      mapInstance.addLayer({
        id: SELECTED_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'isSelected'], true],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 12,
            8, 18,
            12, 24,
            16, 30
          ],
          'circle-color': '#3b82f6',
          'circle-opacity': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#3b82f6',
          'circle-stroke-opacity': 0.6
        }
      }, LAYER_ID) // Add below vessel icons
    }

    layersInitialized.current = true
  }, [loadIcons, showTrails])

  /**
   * Update vessel data on the map
   */
  const updateVessels = useCallback((mapInstance: mapboxgl.Map, vesselData: VesselMapData[]) => {
    const source = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(vesselsToGeoJSON(vesselData))
    }

    if (showTrails) {
      const trailSource = mapInstance.getSource(TRAIL_SOURCE_ID) as mapboxgl.GeoJSONSource
      if (trailSource) {
        trailSource.setData(trailsToGeoJSON(vesselData))
      }
    }
  }, [vesselsToGeoJSON, trailsToGeoJSON, showTrails])

  /**
   * Setup click handler
   */
  const setupClickHandler = useCallback((mapInstance: mapboxgl.Map) => {
    mapInstance.on('click', LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) return

      const feature = e.features[0]
      const properties = feature.properties

      if (onVesselClick && properties) {
        const vessel: VesselMapData = {
          mmsi: properties.mmsi,
          name: properties.name,
          vesselType: properties.vesselType,
          status: properties.status,
          lat: (feature.geometry as GeoJSON.Point).coordinates[1],
          lng: (feature.geometry as GeoJSON.Point).coordinates[0],
          heading: properties.heading,
          speed: properties.speed,
          anomalyCount: properties.anomalyCount
        }
        onVesselClick(vessel)
      }
    })

    // Change cursor on hover
    mapInstance.on('mouseenter', LAYER_ID, () => {
      mapInstance.getCanvas().style.cursor = 'pointer'
    })

    mapInstance.on('mouseleave', LAYER_ID, () => {
      mapInstance.getCanvas().style.cursor = ''
      if (onVesselHover) {
        onVesselHover(null)
      }
    })

    // Hover handler for tooltip
    if (onVesselHover) {
      mapInstance.on('mousemove', LAYER_ID, (e) => {
        if (!e.features || e.features.length === 0) return

        const feature = e.features[0]
        const properties = feature.properties

        if (properties) {
          const vessel: VesselMapData = {
            mmsi: properties.mmsi,
            name: properties.name,
            vesselType: properties.vesselType,
            status: properties.status,
            lat: (feature.geometry as GeoJSON.Point).coordinates[1],
            lng: (feature.geometry as GeoJSON.Point).coordinates[0],
            heading: properties.heading,
            speed: properties.speed,
            anomalyCount: properties.anomalyCount
          }
          onVesselHover(vessel)
        }
      })
    }
  }, [onVesselClick, onVesselHover])

  // Initialize layers when map is ready
  useEffect(() => {
    if (!map) return

    const handleStyleLoad = async () => {
      await initializeLayers(map)
      setupClickHandler(map)
      updateVessels(map, vessels)
    }

    if (map.isStyleLoaded()) {
      handleStyleLoad()
    } else {
      map.on('style.load', handleStyleLoad)
    }

    return () => {
      // Cleanup is handled by the parent component
    }
  }, [map, initializeLayers, setupClickHandler, updateVessels, vessels])

  // Update vessels when data changes
  useEffect(() => {
    if (!map || !layersInitialized.current) return
    updateVessels(map, vessels)
  }, [map, vessels, updateVessels])

  // Update selected vessel highlight
  useEffect(() => {
    if (!map || !layersInitialized.current) return

    // Force update to refresh selection state
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(vesselsToGeoJSON(vessels))
    }
  }, [map, selectedVesselId, vessels, vesselsToGeoJSON])

  // No visual output - this component adds layers to the map
  return null
}

// ============================================================================
// Utility Exports
// ============================================================================

export { VESSEL_TYPE_ICONS, STATUS_COLORS, getVesselIcon, getStatusColor }
