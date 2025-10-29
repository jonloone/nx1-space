/**
 * Alert Cluster Layer - Deck.gl + Supercluster
 * Progressive discovery with intelligent alert clustering
 *
 * Features:
 * - Supercluster-based grouping at low zoom levels
 * - Priority-weighted cluster sizing
 * - Color-coded by highest priority in cluster
 * - Automatic expansion on zoom
 * - Click to zoom into cluster
 * - Federal progressive discovery pattern
 */

'use client'

import Supercluster from 'supercluster'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

export interface AlertClusterLayerProps {
  alerts: IntelligenceAlert[]
  zoom: number
  bounds?: [number, number, number, number] // [west, south, east, north]
  visible?: boolean
  onClusterClick?: (
    clusterId: number,
    expansionZoom: number,
    clusterAlerts: IntelligenceAlert[],
    coordinates: [number, number]
  ) => void
  onAlertClick?: (alert: IntelligenceAlert) => void
}

// Cluster configuration (industry-standard settings)
// Following Google Maps/Mapbox best practices
const CLUSTER_CONFIG = {
  radius: 60, // Pixel radius for clustering (tighter grouping)
  maxZoom: 12, // Stop clustering at zoom 12 (neighborhood level)
  minZoom: 0,
  minPoints: 2, // Minimum points to form a cluster
  extent: 512, // Tile extent (default)
  nodeSize: 64 // Tree node size
}

// Priority weights for cluster sizing
const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
}

// Cluster size calculation (industry-standard sizing)
// Google Maps: 30-60px, Mapbox: 40-80px
// We use 25-55px for refined, professional appearance
const BASE_CLUSTER_SIZE = 25
const MAX_CLUSTER_SIZE = 55

// Color scheme by highest priority
const PRIORITY_COLORS: Record<string, [number, number, number]> = {
  critical: [227, 26, 28],   // Dark red
  high: [252, 78, 42],       // Red-orange
  medium: [253, 141, 60],    // Dark orange
  low: [254, 178, 76]        // Orange
}

/**
 * Convert IntelligenceAlert to Supercluster GeoJSON point
 */
function alertToGeoJSON(alert: IntelligenceAlert): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: {
      alert,
      priority: alert.priority,
      weight: PRIORITY_WEIGHTS[alert.priority] || 1
    },
    geometry: {
      type: 'Point',
      coordinates: alert.location!.coordinates
    }
  }
}

/**
 * Calculate cluster size based on point count and priority weights
 */
function calculateClusterSize(pointCount: number, totalWeight: number): number {
  // Use weighted count for sizing
  const weightedCount = totalWeight || pointCount

  // Logarithmic scaling for better visual distribution
  const scale = Math.log10(weightedCount + 1) / Math.log10(1000)
  const size = BASE_CLUSTER_SIZE + (MAX_CLUSTER_SIZE - BASE_CLUSTER_SIZE) * scale

  return Math.min(size, MAX_CLUSTER_SIZE)
}

/**
 * Get highest priority in cluster
 */
function getClusterPriority(properties: any): string {
  if (properties.criticalCount > 0) return 'critical'
  if (properties.highCount > 0) return 'high'
  if (properties.mediumCount > 0) return 'medium'
  return 'low'
}

/**
 * Pure function to create Supercluster instance and get clusters
 * No React hooks - computes everything inline
 */
export function createAlertClusters(
  alerts: IntelligenceAlert[],
  zoom: number,
  bounds?: [number, number, number, number]
) {
  // Create GeoJSON features from alerts
  const features = alerts
    .filter(alert => alert.location)
    .map(alertToGeoJSON)

  // Initialize Supercluster
  const supercluster = new Supercluster({
    radius: CLUSTER_CONFIG.radius,
    maxZoom: CLUSTER_CONFIG.maxZoom,
    minZoom: CLUSTER_CONFIG.minZoom,
    minPoints: CLUSTER_CONFIG.minPoints,
    extent: CLUSTER_CONFIG.extent,
    nodeSize: CLUSTER_CONFIG.nodeSize,
    // Custom reduce function to track priority counts
    reduce: (accumulated: any, props: any) => {
      accumulated.totalWeight = (accumulated.totalWeight || 0) + props.weight
      accumulated.criticalCount = (accumulated.criticalCount || 0) + (props.priority === 'critical' ? 1 : 0)
      accumulated.highCount = (accumulated.highCount || 0) + (props.priority === 'high' ? 1 : 0)
      accumulated.mediumCount = (accumulated.mediumCount || 0) + (props.priority === 'medium' ? 1 : 0)
      accumulated.lowCount = (accumulated.lowCount || 0) + (props.priority === 'low' ? 1 : 0)
    },
    // Custom initial properties
    map: (props: any) => ({
      weight: props.weight,
      totalWeight: props.weight,
      criticalCount: props.priority === 'critical' ? 1 : 0,
      highCount: props.priority === 'high' ? 1 : 0,
      mediumCount: props.priority === 'medium' ? 1 : 0,
      lowCount: props.priority === 'low' ? 1 : 0
    })
  })

  supercluster.load(features)

  // Get clusters for current viewport
  const clusterBounds = bounds || [-180, -85, 180, 85]
  const clusters = supercluster.getClusters(clusterBounds, Math.floor(zoom))

  return { clusters, supercluster }
}

/**
 * Create Deck.gl layers for clustered alerts
 */
export function createAlertClusterLayers({
  alerts,
  zoom,
  bounds,
  visible = true,
  onClusterClick,
  onAlertClick
}: AlertClusterLayerProps) {
  // Create clusters using pure function (no hooks)
  const { clusters, supercluster } = createAlertClusters(alerts, zoom, bounds)

  // Separate clusters from individual points
  const clusterPoints = clusters.filter((c: any) => c.properties.cluster)
  const individualPoints = clusters.filter((c: any) => !c.properties.cluster)

  // Cluster circles layer
  const clusterLayer = new ScatterplotLayer({
    id: 'alert-cluster-layer',
    data: clusterPoints,

    // Position from GeoJSON
    getPosition: (d: any) => d.geometry.coordinates,

    // Dynamic sizing based on point count and priority
    getRadius: (d: any) => {
      const pointCount = d.properties.point_count
      const totalWeight = d.properties.totalWeight || pointCount
      return calculateClusterSize(pointCount, totalWeight)
    },
    radiusUnits: 'pixels',

    // Color by highest priority in cluster
    getFillColor: (d: any) => {
      const priority = getClusterPriority(d.properties)
      return [...PRIORITY_COLORS[priority], 230]
    },

    // White outline
    getLineColor: [255, 255, 255],
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 3,
    stroked: true,

    // Interactivity
    pickable: true,
    autoHighlight: true,

    visible,

    // Click to show cluster tooltip
    onClick: (info: any) => {
      if (info.object && onClusterClick) {
        const clusterId = info.object.properties.cluster_id
        const expansionZoom = supercluster.getClusterExpansionZoom(clusterId)

        // Get all alerts in this cluster
        const leaves = supercluster.getLeaves(clusterId, Infinity)
        const clusterAlerts = leaves.map((leaf: any) => leaf.properties.alert)

        console.log(`📦 Cluster clicked: ${clusterAlerts.length} alerts`)

        // Calculate actual center from alert coordinates (not supercluster centroid)
        // Supercluster centroid can be in wrong location (e.g., in water)
        const validCoords = clusterAlerts
          .filter((alert: any) => alert.location?.coordinates)
          .map((alert: any) => alert.location.coordinates)

        let centerCoords: [number, number]
        if (validCoords.length > 0) {
          // Calculate average of actual alert locations
          const avgLng = validCoords.reduce((sum: number, coords: number[]) => sum + coords[0], 0) / validCoords.length
          const avgLat = validCoords.reduce((sum: number, coords: number[]) => sum + coords[1], 0) / validCoords.length
          centerCoords = [avgLng, avgLat]
          console.log(`📍 Cluster center: [${centerCoords[0].toFixed(4)}, ${centerCoords[1].toFixed(4)}]`)
        } else {
          // Fallback to supercluster centroid if no valid coordinates
          centerCoords = info.object.geometry.coordinates
        }

        // Pass cluster info to handler
        onClusterClick(clusterId, expansionZoom, clusterAlerts, centerCoords)
      }
      return true
    }
  })

  // Cluster labels layer
  const labelLayer = new TextLayer({
    id: 'alert-cluster-labels',
    data: clusterPoints,

    // Position from GeoJSON
    getPosition: (d: any) => d.geometry.coordinates,

    // Display point count
    getText: (d: any) => {
      const count = d.properties.point_count
      const critical = d.properties.criticalCount || 0
      return critical > 0 ? `${count}\n⚠️` : `${count}`
    },

    // Text styling
    getSize: 14,
    getColor: [255, 255, 255, 255],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 700,

    // Background
    background: true,
    backgroundPadding: [4, 2],
    getBackgroundColor: [0, 0, 0, 100],

    visible,
    pickable: false
  })

  // Individual alert markers layer (shown when not clustered)
  const markersLayer = new ScatterplotLayer({
    id: 'alert-cluster-individuals',
    data: individualPoints,

    // Position from GeoJSON
    getPosition: (d: any) => d.geometry.coordinates,

    // Size by priority (subtle markers)
    getRadius: (d: any) => {
      const priority = d.properties.priority
      return priority === 'critical' ? 12 : priority === 'high' ? 10 : priority === 'medium' ? 8 : 6
    },
    radiusUnits: 'pixels',

    // Color by priority
    getFillColor: (d: any) => {
      const priority = d.properties.priority
      return [...PRIORITY_COLORS[priority], 230]
    },

    // White outline
    getLineColor: [255, 255, 255],
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 2,
    stroked: true,

    // Interactivity
    pickable: true,
    autoHighlight: true,

    visible,

    // Click individual alert
    onClick: (info: any) => {
      if (info.object && onAlertClick) {
        const alert = info.object.properties.alert
        console.log(`🎯 Alert clicked: ${alert.title}`)
        onAlertClick(alert)
      }
      return true
    },

    // Hover tooltip
    onHover: (info: any) => {
      if (info.object) {
        const alert = info.object.properties.alert
        console.log(`📍 ${alert.priority.toUpperCase()}: ${alert.title}`)
      }
    }
  })

  return [clusterLayer, labelLayer, markersLayer]
}

/**
 * Configuration export (industry-standard clustering)
 */
export const CLUSTERING_CONFIG = {
  enabledZoomRange: [0, 12], // Cluster from country to neighborhood level
  transitionZoom: 13, // Switch to individual markers at street level
  clusterRadius: 60, // pixels (tighter grouping)
  minClusterSize: 25, // Industry-standard minimum
  maxClusterSize: 55, // Refined maximum size
  autoZoomOnClick: true // Progressive disclosure pattern
}

/**
 * Helper: Check if clustering should be active at zoom level
 */
export function shouldCluster(zoom: number): boolean {
  return zoom <= CLUSTER_CONFIG.maxZoom
}

/**
 * Helper: Get cluster statistics
 */
export function getClusterStatistics(clusters: any[]): {
  totalClusters: number
  totalIndividuals: number
  largestCluster: number
  criticalClusters: number
} {
  const clusterPoints = clusters.filter((c: any) => c.properties.cluster)
  const individuals = clusters.filter((c: any) => !c.properties.cluster)

  const largestCluster = Math.max(
    ...clusterPoints.map((c: any) => c.properties.point_count),
    0
  )

  const criticalClusters = clusterPoints.filter(
    (c: any) => (c.properties.criticalCount || 0) > 0
  ).length

  return {
    totalClusters: clusterPoints.length,
    totalIndividuals: individuals.length,
    largestCluster,
    criticalClusters
  }
}
