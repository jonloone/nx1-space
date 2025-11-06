/**
 * Satellite Intelligence Layer
 *
 * Visualizes satellite imagery analysis including:
 * - Base satellite imagery (Mapbox, Sentinel-2)
 * - Detected changes (construction, demolition, vegetation)
 * - Object detections (buildings, vehicles, infrastructure)
 * - Activity hotspots
 *
 * Use Cases:
 * - Infrastructure monitoring
 * - Change detection visualization
 * - Operational intelligence
 * - Site surveillance
 */

'use client'

import { useMemo, useEffect, useState } from 'react'
import { TileLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer, PolygonLayer, IconLayer } from '@deck.gl/layers'
import { BitmapLayer } from '@deck.gl/layers'
import type { DetectedChange, ObjectDetectionResult } from '@/lib/services/imageryAnalysisService'
import type { SatelliteImage } from '@/lib/services/satelliteImageryService'

export interface SatelliteIntelligenceLayerOptions {
  id?: string
  image?: SatelliteImage
  changes?: DetectedChange[]
  objects?: ObjectDetectionResult['objects']
  showImagery?: boolean
  showChanges?: boolean
  showObjects?: boolean
  visible?: boolean
  opacity?: number
  interactive?: boolean
  onHover?: (info: any) => void
  onClick?: (info: any) => void
}

/**
 * Create DeckGL layers for satellite intelligence visualization
 */
export function useSatelliteIntelligenceLayers(options: SatelliteIntelligenceLayerOptions) {
  const {
    id = 'satellite-intelligence',
    image,
    changes = [],
    objects = [],
    showImagery = true,
    showChanges = true,
    showObjects = true,
    visible = true,
    opacity = 1.0,
    interactive = true,
    onHover,
    onClick
  } = options

  const layers = useMemo(() => {
    if (!visible) {
      return []
    }

    const layerList: any[] = []

    // 1. Base Satellite Imagery Layer
    if (showImagery && image) {
      layerList.push(createImageryLayer(id, image, opacity))
    }

    // 2. Change Detection Layer (Polygons + Icons)
    if (showChanges && changes.length > 0) {
      layerList.push(...createChangeLayers(id, changes, interactive, onHover, onClick))
    }

    // 3. Object Detection Layer
    if (showObjects && objects.length > 0) {
      layerList.push(createObjectLayer(id, objects, interactive, onHover, onClick))
    }

    return layerList
  }, [
    id,
    visible,
    image,
    changes,
    objects,
    showImagery,
    showChanges,
    showObjects,
    opacity,
    interactive,
    onHover,
    onClick
  ])

  return {
    layers,
    hasImagery: !!image,
    changeCount: changes.length,
    objectCount: objects.length
  }
}

/**
 * Create satellite imagery tile layer
 */
function createImageryLayer(id: string, image: SatelliteImage, opacity: number) {
  const tileUrl = getTileUrl(image)

  return new TileLayer({
    id: `${id}-imagery`,
    data: tileUrl,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: (props: any) => {
      const {
        bbox: { west, south, east, north }
      } = props.tile

      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
        desaturate: 0, // 0 = full color, 1 = grayscale
        transparentColor: [0, 0, 0, 0],
        tintColor: [255, 255, 255, opacity * 255]
      })
    },
    pickable: false,
    opacity
  })
}

/**
 * Create change detection visualization layers
 */
function createChangeLayers(
  id: string,
  changes: DetectedChange[],
  interactive: boolean,
  onHover?: (info: any) => void,
  onClick?: (info: any) => void
) {
  const layers: any[] = []

  // 1. Change polygons (filled areas)
  layers.push(
    new PolygonLayer({
      id: `${id}-change-polygons`,
      data: changes,
      filled: true,
      stroked: true,
      extruded: false,
      wireframe: false,
      lineWidthMinPixels: 2,
      getPolygon: (d: DetectedChange) => [
        [
          [d.location.bounds.west, d.location.bounds.south],
          [d.location.bounds.east, d.location.bounds.south],
          [d.location.bounds.east, d.location.bounds.north],
          [d.location.bounds.west, d.location.bounds.north]
        ]
      ],
      getFillColor: (d: DetectedChange) => {
        const color = getChangeColor(d.type)
        const alpha = Math.min(255, (d.confidence / 100) * 180) // More confident = more opaque
        return [...color, alpha]
      },
      getLineColor: (d: DetectedChange) => getChangeColor(d.type),
      getLineWidth: 2,
      pickable: interactive,
      onHover,
      onClick,
      updateTriggers: {
        getFillColor: [changes],
        getLineColor: [changes]
      }
    })
  )

  // 2. Change center points (for labeling/interaction)
  layers.push(
    new ScatterplotLayer({
      id: `${id}-change-points`,
      data: changes.filter(c => c.confidence >= 70), // Only show high-confidence
      getPosition: (d: DetectedChange) => d.location.center,
      getRadius: (d: DetectedChange) => d.magnitude * 30, // Larger for bigger changes
      getFillColor: (d: DetectedChange) => {
        const color = getChangeColor(d.type)
        return [...color, 200]
      },
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      radiusMinPixels: 8,
      radiusMaxPixels: 40,
      pickable: interactive,
      onHover,
      onClick,
      updateTriggers: {
        getFillColor: [changes],
        getRadius: [changes]
      }
    })
  )

  return layers
}

/**
 * Create object detection visualization layer
 */
function createObjectLayer(
  id: string,
  objects: ObjectDetectionResult['objects'],
  interactive: boolean,
  onHover?: (info: any) => void,
  onClick?: (info: any) => void
) {
  return new ScatterplotLayer({
    id: `${id}-objects`,
    data: objects,
    getPosition: (d) => d.location,
    getRadius: (d) => Math.sqrt(d.size.width * d.size.height), // Size based on area
    getFillColor: (d) => {
      const color = getObjectColor(d.type)
      const alpha = Math.min(255, (d.confidence / 100) * 200)
      return [...color, alpha]
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 1,
    lineWidthMinPixels: 1,
    radiusMinPixels: 4,
    radiusMaxPixels: 20,
    pickable: interactive,
    onHover,
    onClick,
    updateTriggers: {
      getFillColor: [objects],
      getRadius: [objects]
    }
  })
}

/**
 * Get tile URL for satellite image
 */
function getTileUrl(image: SatelliteImage): string {
  if (image.url) {
    return image.url
  }

  // Default to Mapbox satellite
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'
  return `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${mapboxToken}`
}

/**
 * Get color for change type
 */
function getChangeColor(type: string): [number, number, number] {
  switch (type) {
    case 'construction':
      return [255, 165, 0] // Orange - New construction
    case 'demolition':
      return [255, 69, 0] // Red-Orange - Removal
    case 'vegetation_loss':
      return [139, 69, 19] // Brown - Deforestation
    case 'vegetation_gain':
      return [34, 139, 34] // Green - Growth
    case 'infrastructure':
      return [70, 130, 180] // Steel Blue - Infrastructure
    default:
      return [128, 128, 128] // Gray - Unknown
  }
}

/**
 * Get color for object type
 */
function getObjectColor(type: string): [number, number, number] {
  switch (type) {
    case 'building':
      return [255, 215, 0] // Gold
    case 'vehicle':
      return [255, 0, 0] // Red
    case 'aircraft':
      return [0, 191, 255] // Deep Sky Blue
    case 'ship':
      return [0, 128, 255] // Blue
    case 'infrastructure':
      return [148, 0, 211] // Purple
    default:
      return [192, 192, 192] // Silver
  }
}

/**
 * Get legend data for change visualization
 */
export function getChangeLegend() {
  return [
    { label: 'Construction', color: '#FFA500', type: 'construction' },
    { label: 'Demolition', color: '#FF4500', type: 'demolition' },
    { label: 'Vegetation Loss', color: '#8B4513', type: 'vegetation_loss' },
    { label: 'Vegetation Growth', color: '#228B22', type: 'vegetation_gain' },
    { label: 'Infrastructure', color: '#4682B4', type: 'infrastructure' }
  ]
}

/**
 * Get legend data for object visualization
 */
export function getObjectLegend() {
  return [
    { label: 'Building', color: '#FFD700', type: 'building' },
    { label: 'Vehicle', color: '#FF0000', type: 'vehicle' },
    { label: 'Aircraft', color: '#00BFFF', type: 'aircraft' },
    { label: 'Ship', color: '#0080FF', type: 'ship' },
    { label: 'Infrastructure', color: '#9400D3', type: 'infrastructure' }
  ]
}

/**
 * Format change data for tooltip/panel display
 */
export function formatChangeInfo(change: DetectedChange): string {
  const confidenceLevel = change.confidence >= 85 ? 'Very High' : change.confidence >= 70 ? 'High' : change.confidence >= 50 ? 'Medium' : 'Low'
  const lines = [
    `Type: ${change.type.replace('_', ' ')}`,
    `Confidence: ${change.confidence.toFixed(1)}% (${confidenceLevel})`,
    `Magnitude: ${change.magnitude.toFixed(1)}`,
    `Timespan: ${change.timespan.daysBetween} days`,
    ``,
    change.description
  ]
  return lines.join('\n')
}

/**
 * Format object data for tooltip/panel display
 */
export function formatObjectInfo(object: ObjectDetectionResult['objects'][0]): string {
  const lines = [
    `Type: ${object.type}`,
    `Confidence: ${object.confidence.toFixed(1)}%`,
    `Size: ${object.size.width.toFixed(1)}m × ${object.size.height.toFixed(1)}m`,
    object.orientation !== undefined ? `Orientation: ${object.orientation.toFixed(0)}°` : null
  ].filter(Boolean)

  return lines.join('\n')
}
