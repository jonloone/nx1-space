/**
 * Satellite Orbit Visualization Layer
 * Renders satellites and their ground tracks on Mapbox
 */

import type mapboxgl from 'mapbox-gl'
import type { TrackedSatellite } from '../stores/satelliteTrackingStore'
import type { GroundTrackPoint } from '../services/orbitalMechanicsService'

const SATELLITE_LAYER_ID = 'satellite-positions'
const SATELLITE_SOURCE_ID = 'satellite-positions'
const ORBIT_LAYER_ID = 'satellite-orbits'
const ORBIT_SOURCE_ID = 'satellite-orbits'
const FOOTPRINT_LAYER_ID = 'satellite-footprints'
const FOOTPRINT_SOURCE_ID = 'satellite-footprints'
const LABEL_LAYER_ID = 'satellite-labels'

export interface SatelliteOrbitLayerOptions {
  showOrbits?: boolean
  showFootprints?: boolean
  showLabels?: boolean
  orbitColor?: string
  satelliteSize?: number
}

/**
 * Initialize satellite orbit visualization layers
 */
export function initializeSatelliteOrbitLayers(
  map: mapboxgl.Map,
  options: SatelliteOrbitLayerOptions = {}
): void {
  const {
    showOrbits = true,
    showFootprints = false,
    showLabels = true,
    orbitColor = '#3b82f6',
    satelliteSize = 8
  } = options

  // Clean up existing layers
  removeSatelliteOrbitLayers(map)

  // Add satellite positions source and layer
  map.addSource(SATELLITE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  })

  // Satellite icons layer
  map.addLayer({
    id: SATELLITE_LAYER_ID,
    type: 'circle',
    source: SATELLITE_SOURCE_ID,
    paint: {
      'circle-radius': satelliteSize,
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#3b82f6', // Blue for selected
        '#8b5cf6'  // Purple for others
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.9
    }
  })

  // Satellite labels layer
  if (showLabels) {
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SATELLITE_SOURCE_ID,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': [0, 1.2],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    })
  }

  // Add orbit ground tracks source and layer
  if (showOrbits) {
    map.addSource(ORBIT_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.addLayer({
      id: ORBIT_LAYER_ID,
      type: 'line',
      source: ORBIT_SOURCE_ID,
      paint: {
        'line-color': orbitColor,
        'line-width': 2,
        'line-opacity': 0.7
      }
    })
  }

  // Add footprint circles source and layer
  if (showFootprints) {
    map.addSource(FOOTPRINT_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.addLayer({
      id: FOOTPRINT_LAYER_ID,
      type: 'fill',
      source: FOOTPRINT_SOURCE_ID,
      paint: {
        'fill-color': orbitColor,
        'fill-opacity': 0.1
      }
    })
  }

  console.log('🛰️ Satellite orbit layers initialized')
}

/**
 * Update satellite positions on map
 */
export function updateSatellitePositions(
  map: mapboxgl.Map,
  satellites: TrackedSatellite[],
  selectedCatalogNumber: string | null = null
): void {
  const source = map.getSource(SATELLITE_SOURCE_ID) as mapboxgl.GeoJSONSource

  if (!source) {
    console.warn('⚠️ Satellite source not found')
    return
  }

  // Create GeoJSON features for each satellite
  const features = satellites
    .filter(sat => sat.position !== null)
    .map(sat => ({
      type: 'Feature' as const,
      id: sat.catalogNumber,
      geometry: {
        type: 'Point' as const,
        coordinates: [sat.position!.longitude, sat.position!.latitude]
      },
      properties: {
        name: sat.name,
        catalogNumber: sat.catalogNumber,
        altitude: Math.round(sat.position!.altitude),
        velocity: sat.velocity.toFixed(2),
        selected: sat.catalogNumber === selectedCatalogNumber
      }
    }))

  source.setData({
    type: 'FeatureCollection',
    features
  })

  // Update feature states for selection
  features.forEach(feature => {
    map.setFeatureState(
      { source: SATELLITE_SOURCE_ID, id: feature.id },
      { selected: feature.properties.selected }
    )
  })
}

/**
 * Update orbit ground tracks
 */
export function updateOrbitGroundTracks(
  map: mapboxgl.Map,
  groundTracks: Map<string, GroundTrackPoint[]>,
  selectedCatalogNumber: string | null = null
): void {
  const source = map.getSource(ORBIT_SOURCE_ID) as mapboxgl.GeoJSONSource

  if (!source) {
    return // Orbits not enabled
  }

  // Only show orbit for selected satellite (or all if none selected)
  const tracksToShow = selectedCatalogNumber
    ? new Map([[selectedCatalogNumber, groundTracks.get(selectedCatalogNumber)!]])
    : groundTracks

  const features: any[] = []

  tracksToShow.forEach((points, catalogNumber) => {
    if (!points || points.length === 0) return

    // Split track into segments at date line crossing
    const segments = splitTrackAtDateLine(points)

    segments.forEach((segment, index) => {
      features.push({
        type: 'Feature',
        id: `${catalogNumber}-${index}`,
        geometry: {
          type: 'LineString',
          coordinates: segment.map(p => [p.longitude, p.latitude])
        },
        properties: {
          catalogNumber,
          segment: index
        }
      })
    })
  })

  source.setData({
    type: 'FeatureCollection',
    features
  })
}

/**
 * Split ground track at date line crossings to avoid visual artifacts
 */
function splitTrackAtDateLine(points: GroundTrackPoint[]): GroundTrackPoint[][] {
  const segments: GroundTrackPoint[][] = []
  let currentSegment: GroundTrackPoint[] = []

  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const prevPoint = i > 0 ? points[i - 1] : null

    // Check for date line crossing (longitude jumps from ~180 to ~-180 or vice versa)
    if (prevPoint && Math.abs(point.longitude - prevPoint.longitude) > 180) {
      // Date line crossed - start new segment
      if (currentSegment.length > 0) {
        segments.push(currentSegment)
      }
      currentSegment = [point]
    } else {
      currentSegment.push(point)
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
}

/**
 * Update footprint circles (visibility regions)
 */
export function updateSatelliteFootprints(
  map: mapboxgl.Map,
  satellites: TrackedSatellite[],
  selectedCatalogNumber: string | null = null
): void {
  const source = map.getSource(FOOTPRINT_SOURCE_ID) as mapboxgl.GeoJSONSource

  if (!source) {
    return // Footprints not enabled
  }

  // Only show footprint for selected satellite
  const satellitesToShow = selectedCatalogNumber
    ? satellites.filter(sat => sat.catalogNumber === selectedCatalogNumber)
    : satellites

  const features = satellitesToShow
    .filter(sat => sat.position !== null)
    .map(sat => {
      const radiusKm = sat.position!.footprintRadius || 3000 // Default 3000km
      const radiusDegrees = radiusKm / 111 // Rough conversion (1 degree ≈ 111km)

      return {
        type: 'Feature' as const,
        id: sat.catalogNumber,
        geometry: {
          type: 'Point' as const,
          coordinates: [sat.position!.longitude, sat.position!.latitude]
        },
        properties: {
          catalogNumber: sat.catalogNumber,
          radius: radiusDegrees
        }
      }
    })

  source.setData({
    type: 'FeatureCollection',
    features: features.map(f => ({
      ...f,
      geometry: createCircleGeometry(
        f.geometry.coordinates,
        f.properties.radius
      )
    }))
  })
}

/**
 * Create circle polygon geometry
 */
function createCircleGeometry(
  center: [number, number],
  radiusDegrees: number
): any {
  const points = 64
  const coordinates: number[][] = []

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const lat = center[1] + radiusDegrees * Math.sin(angle)
    const lon = center[0] + radiusDegrees * Math.cos(angle)
    coordinates.push([lon, lat])
  }

  return {
    type: 'Polygon',
    coordinates: [coordinates]
  }
}

/**
 * Remove all satellite orbit layers
 */
export function removeSatelliteOrbitLayers(map: mapboxgl.Map): void {
  const layersToRemove = [
    SATELLITE_LAYER_ID,
    ORBIT_LAYER_ID,
    FOOTPRINT_LAYER_ID,
    LABEL_LAYER_ID
  ]

  const sourcesToRemove = [
    SATELLITE_SOURCE_ID,
    ORBIT_SOURCE_ID,
    FOOTPRINT_SOURCE_ID
  ]

  layersToRemove.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
    }
  })

  sourcesToRemove.forEach(sourceId => {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }
  })
}

/**
 * Set up click handlers for satellites
 */
export function setupSatelliteClickHandlers(
  map: mapboxgl.Map,
  onSatelliteClick: (catalogNumber: string) => void
): void {
  // Change cursor on hover
  map.on('mouseenter', SATELLITE_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', SATELLITE_LAYER_ID, () => {
    map.getCanvas().style.cursor = ''
  })

  // Handle click
  map.on('click', SATELLITE_LAYER_ID, (e) => {
    if (!e.features || e.features.length === 0) return

    const feature = e.features[0]
    const catalogNumber = feature.properties?.catalogNumber

    if (catalogNumber) {
      onSatelliteClick(catalogNumber)
    }
  })
}

/**
 * Fly to satellite position
 */
export function flyToSatellite(
  map: mapboxgl.Map,
  satellite: TrackedSatellite,
  zoom: number = 4
): void {
  if (!satellite.position) return

  map.flyTo({
    center: [satellite.position.longitude, satellite.position.latitude],
    zoom,
    essential: true,
    duration: 2000
  })
}

/**
 * Toggle layer visibility
 */
export function toggleLayerVisibility(
  map: mapboxgl.Map,
  layerType: 'orbits' | 'footprints' | 'labels',
  visible: boolean
): void {
  const layerIds = {
    orbits: ORBIT_LAYER_ID,
    footprints: FOOTPRINT_LAYER_ID,
    labels: LABEL_LAYER_ID
  }

  const layerId = layerIds[layerType]

  if (map.getLayer(layerId)) {
    map.setLayoutProperty(
      layerId,
      'visibility',
      visible ? 'visible' : 'none'
    )
  }
}
