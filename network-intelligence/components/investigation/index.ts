/**
 * Investigation Intelligence Components
 *
 * Comprehensive suite of components for pattern-of-life analysis
 * and authorized law enforcement investigations.
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

// Main Integration Component
export { default as InvestigationMode } from './InvestigationMode'

// Core Panels
export { default as SubjectProfile } from './SubjectProfile'
export { default as LocationAnalysis } from './LocationAnalysis'
export { default as IntelligenceReport } from './IntelligenceReport'

// Visualization Layers
export {
  default as useRoutePlayerLayers,
  RoutePlayerControls
} from './RoutePlayer'

export {
  default as useLocationMarkersLayers,
  LocationMarkerLegend,
  type RenderQuality
} from './LocationMarkers'

export {
  default as useFrequencyHeatmapLayer,
  FrequencyHeatmapControl
} from './FrequencyHeatmap'

// Analysis Components
export { default as TemporalAnalysis } from './TemporalAnalysis'

/**
 * Usage Example:
 *
 * ```tsx
 * import {
 *   SubjectProfile,
 *   LocationAnalysis,
 *   useRoutePlayerLayers,
 *   useLocationMarkersLayers
 * } from '@/components/investigation'
 *
 * // In your component:
 * const routeLayers = useRoutePlayerLayers({
 *   trackingPoints,
 *   routeSegments,
 *   currentTime: new Date()
 * })
 *
 * const locationLayers = useLocationMarkersLayers({
 *   locations,
 *   onLocationClick: handleLocationClick
 * })
 * ```
 */
