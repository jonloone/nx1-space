import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers'

// Maritime traffic density data (sample - would come from AIS or similar)
const MARITIME_TRAFFIC_ZONES = [
  // Atlantic shipping lanes
  { coordinates: [-40, 40], intensity: 0.9, vesselCount: 450, avgSpeed: 16.5, route: 'North Atlantic' },
  { coordinates: [-35, 35], intensity: 0.85, vesselCount: 380, avgSpeed: 15.2, route: 'Mid Atlantic' },
  { coordinates: [-25, 25], intensity: 0.7, vesselCount: 280, avgSpeed: 14.8, route: 'Equatorial Atlantic' },
  
  // Pacific shipping lanes
  { coordinates: [-120, 35], intensity: 0.95, vesselCount: 520, avgSpeed: 18.2, route: 'US West Coast' },
  { coordinates: [-140, 25], intensity: 0.8, vesselCount: 340, avgSpeed: 16.8, route: 'Trans-Pacific' },
  { coordinates: [140, 35], intensity: 0.88, vesselCount: 410, avgSpeed: 17.1, route: 'Japan Approaches' },
  
  // Indian Ocean
  { coordinates: [65, 20], intensity: 0.82, vesselCount: 360, avgSpeed: 15.8, route: 'Arabian Sea' },
  { coordinates: [80, 10], intensity: 0.75, vesselCount: 320, avgSpeed: 14.9, route: 'Bay of Bengal' },
  { coordinates: [95, 5], intensity: 0.78, vesselCount: 290, avgSpeed: 15.3, route: 'Malacca Strait' },
  
  // Mediterranean
  { coordinates: [15, 35], intensity: 0.85, vesselCount: 380, avgSpeed: 16.2, route: 'Mediterranean' },
  
  // North Sea / Baltic
  { coordinates: [5, 55], intensity: 0.9, vesselCount: 420, avgSpeed: 15.5, route: 'North Sea' },
  { coordinates: [20, 58], intensity: 0.72, vesselCount: 260, avgSpeed: 14.2, route: 'Baltic Sea' },
  
  // Caribbean
  { coordinates: [-65, 18], intensity: 0.68, vesselCount: 240, avgSpeed: 13.8, route: 'Caribbean' },
  
  // South China Sea
  { coordinates: [115, 15], intensity: 0.92, vesselCount: 480, avgSpeed: 17.5, route: 'South China Sea' },
  
  // Red Sea / Suez
  { coordinates: [35, 25], intensity: 0.88, vesselCount: 400, avgSpeed: 16.8, route: 'Red Sea' },
]

// Major shipping routes (simplified paths)
const SHIPPING_ROUTES = [
  {
    id: 'trans-atlantic',
    name: 'Trans-Atlantic Route',
    path: [[-74, 40.7], [-40, 40], [-10, 50], [0, 51.5]],
    traffic: 0.9,
    type: 'major'
  },
  {
    id: 'trans-pacific',
    name: 'Trans-Pacific Route', 
    path: [[-118, 34], [-140, 30], [-160, 25], [140, 35], [120, 25]],
    traffic: 0.85,
    type: 'major'
  },
  {
    id: 'suez-route',
    name: 'Europe-Asia via Suez',
    path: [[0, 51], [15, 35], [32, 31], [35, 25], [60, 25], [95, 5]],
    traffic: 0.95,
    type: 'critical'
  },
  {
    id: 'cape-route',
    name: 'Cape of Good Hope',
    path: [[0, 51], [-10, 40], [-20, 20], [20, -35], [60, -30], [95, 5]],
    traffic: 0.6,
    type: 'alternative'
  }
]

// Satellite coverage quality zones for maritime
const MARITIME_COVERAGE_ZONES = [
  // Excellent coverage (near shores, major routes)
  { coordinates: [-74, 40], coverageQuality: 95, latency: 45, name: 'North Atlantic High' },
  { coordinates: [0, 51], coverageQuality: 98, latency: 42, name: 'North Sea Premium' },
  { coordinates: [140, 35], coverageQuality: 96, latency: 44, name: 'Japan Maritime' },
  { coordinates: [115, 15], coverageQuality: 92, latency: 48, name: 'South China Sea' },
  
  // Good coverage (mid-ocean, established routes)
  { coordinates: [-40, 40], coverageQuality: 85, latency: 55, name: 'Mid-Atlantic' },
  { coordinates: [-140, 25], coverageQuality: 80, latency: 60, name: 'Mid-Pacific' },
  { coordinates: [65, 20], coverageQuality: 88, latency: 52, name: 'Arabian Sea' },
  
  // Moderate coverage (remote areas)
  { coordinates: [-120, -30], coverageQuality: 70, latency: 75, name: 'South Pacific Remote' },
  { coordinates: [90, -40], coverageQuality: 68, latency: 78, name: 'Southern Indian Ocean' },
  { coordinates: [-30, -40], coverageQuality: 72, latency: 72, name: 'South Atlantic Remote' },
]

interface MaritimeHeatmapLayerProps {
  /** Whether to show the maritime layer */
  visible: boolean
  /** Display mode for maritime data */
  mode: 'traffic' | 'coverage' | 'routes' | 'opportunities'
  /** Whether to show shipping routes */
  showRoutes?: boolean
  /** Callback when maritime zone is clicked */
  onZoneClick?: (zone: any) => void
  /** Callback when zone is hovered */
  onZoneHover?: (zone: any, coords?: { x: number; y: number }) => void
}

export const createMaritimeHeatmapLayers = ({
  visible,
  mode,
  showRoutes = true,
  onZoneClick,
  onZoneHover
}: MaritimeHeatmapLayerProps) => {
  if (!visible) {
    return []
  }

  // Select data based on mode
  const heatmapData = (() => {
    switch (mode) {
      case 'traffic':
        return MARITIME_TRAFFIC_ZONES
      case 'coverage':
        return MARITIME_COVERAGE_ZONES.map(zone => ({
          ...zone,
          intensity: zone.coverageQuality / 100
        }))
      case 'opportunities':
        // Combine traffic and coverage for opportunity analysis
        return MARITIME_TRAFFIC_ZONES.map(zone => {
          const coverage = MARITIME_COVERAGE_ZONES.find(c => 
            Math.abs(c.coordinates[0] - zone.coordinates[0]) < 10 &&
            Math.abs(c.coordinates[1] - zone.coordinates[1]) < 10
          )
          return {
            ...zone,
            intensity: (zone.intensity + (coverage?.coverageQuality || 70) / 100) / 2
          }
        })
      default:
        return MARITIME_TRAFFIC_ZONES
    }
  })()

  // Color scheme based on mode
  const colorRange = (() => {
    switch (mode) {
      case 'traffic':
        return [
          [0, 0, 0, 0],           // Transparent
          [59, 130, 246, 60],     // Blue - light traffic
          [168, 85, 247, 120],    // Purple - moderate traffic  
          [234, 179, 8, 180],     // Yellow - heavy traffic
          [239, 68, 68, 240]      // Red - extreme traffic
        ]
      case 'coverage':
        return [
          [0, 0, 0, 0],           // Transparent
          [239, 68, 68, 60],      // Red - poor coverage
          [234, 179, 8, 120],     // Yellow - moderate coverage
          [34, 197, 94, 180],     // Green - good coverage
          [16, 185, 129, 240]     // Emerald - excellent coverage
        ]
      case 'opportunities':
        return [
          [0, 0, 0, 0],           // Transparent
          [99, 102, 241, 60],     // Indigo - low opportunity
          [168, 85, 247, 120],    // Purple - moderate opportunity
          [234, 179, 8, 180],     // Yellow - good opportunity
          [34, 197, 94, 240]      // Green - excellent opportunity
        ]
      default:
        return [
          [0, 0, 0, 0],
          [59, 130, 246, 60],
          [168, 85, 247, 120],
          [234, 179, 8, 180],
          [34, 197, 94, 240]
        ]
    }
  })()

  const layers = []

  // Main heatmap layer
  layers.push(
    new HeatmapLayer({
      id: `maritime-heatmap-${mode}`,
      data: heatmapData,
      getPosition: (d: any) => d.coordinates,
      getWeight: (d: any) => d.intensity,
      radiusPixels: mode === 'routes' ? 40 : 60,
      intensity: mode === 'coverage' ? 0.8 : 1.2,
      threshold: 0.02,
      colorRange,
      pickable: true,
      onHover: ({ object, x, y }) => {
        if (onZoneHover) {
          onZoneHover(object || null, x !== undefined && y !== undefined ? { x, y } : undefined)
        }
      },
      onClick: ({ object }) => {
        if (object && onZoneClick) {
          onZoneClick(object)
        }
      }
    })
  )

  // Shipping routes overlay
  if (showRoutes && (mode === 'routes' || mode === 'traffic')) {
    layers.push(
      new PathLayer({
        id: 'shipping-routes',
        data: SHIPPING_ROUTES,
        getPath: (d: any) => d.path,
        getWidth: (d: any) => {
          switch (d.type) {
            case 'critical': return 8
            case 'major': return 6
            case 'alternative': return 4
            default: return 3
          }
        },
        getColor: (d: any) => {
          switch (d.type) {
            case 'critical': return [239, 68, 68, 200]    // Red - critical route
            case 'major': return [234, 179, 8, 180]       // Yellow - major route
            case 'alternative': return [59, 130, 246, 160] // Blue - alternative route
            default: return [156, 163, 175, 140]          // Gray - minor route
          }
        },
        pickable: true,
        onHover: ({ object, x, y }) => {
          if (onZoneHover) {
            onZoneHover(object || null, x !== undefined && y !== undefined ? { x, y } : undefined)
          }
        },
        onClick: ({ object }) => {
          if (object && onZoneClick) {
            onZoneClick(object)
          }
        },
        widthMinPixels: 2,
        widthMaxPixels: 12,
        capRounded: true,
        jointRounded: true,
      })
    )
  }

  // Coverage quality points for detailed view
  if (mode === 'coverage') {
    layers.push(
      new ScatterplotLayer({
        id: 'coverage-points',
        data: MARITIME_COVERAGE_ZONES,
        getPosition: (d: any) => d.coordinates,
        getRadius: (d: any) => d.coverageQuality * 300,
        getFillColor: (d: any) => {
          if (d.coverageQuality >= 95) return [16, 185, 129, 120] // Excellent
          if (d.coverageQuality >= 85) return [34, 197, 94, 100]  // Good  
          if (d.coverageQuality >= 75) return [234, 179, 8, 80]   // Moderate
          return [239, 68, 68, 80] // Poor
        },
        getLineColor: [255, 255, 255, 150],
        getLineWidth: 2,
        stroked: true,
        filled: true,
        radiusMinPixels: 8,
        radiusMaxPixels: 40,
        pickable: true,
        onHover: ({ object, x, y }) => {
          if (onZoneHover) {
            onZoneHover(object || null, x !== undefined && y !== undefined ? { x, y } : undefined)
          }
        }
      })
    )
  }

  return layers
}

// For backward compatibility
export const MaritimeHeatmapLayer = createMaritimeHeatmapLayers
export default createMaritimeHeatmapLayers