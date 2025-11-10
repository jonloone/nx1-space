/**
 * AI Context Service
 *
 * Gathers and formats current application state for AI awareness.
 * Provides context about map view, selections, artifacts, and panels.
 */

import type { MapStore } from '@/lib/stores/mapStore'
import type { AnalysisStore } from '@/lib/stores/analysisStore'
import type { PanelStore } from '@/lib/stores/panelStore'

export interface AIContext {
  map: {
    center: [number, number] | null
    zoom: number | null
    bounds: any | null
  }
  selection: {
    feature: any | null
    featureName: string | null
  }
  artifacts: {
    total: number
    expanded: number
    types: string[]
    currentNames: string[]
  }
  panel: {
    active: string | null
    mode: string | null
  }
  places: {
    visible: number
  }
  timestamp: Date
}

/**
 * Gather AI context from all stores
 */
export function getAIContext(
  mapStore: Partial<MapStore>,
  analysisStore: Partial<AnalysisStore>,
  panelStore: Partial<PanelStore>
): AIContext {
  const map = mapStore.map

  // Map context
  const mapCenter = map ? [map.getCenter().lng, map.getCenter().lat] as [number, number] : null
  const mapZoom = map ? map.getZoom() : null
  const mapBounds = map ? map.getBounds() : null

  // Selection context
  const selectedFeature = mapStore.selectedFeature || null
  const featureName = selectedFeature?.properties?.name || null

  // Artifacts context
  const artifacts = analysisStore.artifacts || []
  const expandedArtifacts = artifacts.filter(a => !a.isMinimized)
  const artifactTypes = [...new Set(artifacts.map(a => a.type))]
  const currentNames = expandedArtifacts
    .map(a => a.title || getArtifactTypeName(a.type))
    .filter(Boolean)

  // Panel context
  const rightPanelMode = panelStore.rightPanelMode || null

  // Places context
  const visiblePlaces = mapStore.visiblePlaces?.length || 0

  return {
    map: {
      center: mapCenter,
      zoom: mapZoom,
      bounds: mapBounds
    },
    selection: {
      feature: selectedFeature,
      featureName
    },
    artifacts: {
      total: artifacts.length,
      expanded: expandedArtifacts.length,
      types: artifactTypes,
      currentNames
    },
    panel: {
      active: rightPanelMode,
      mode: rightPanelMode
    },
    places: {
      visible: visiblePlaces
    },
    timestamp: new Date()
  }
}

/**
 * Format context for AI consumption (human-readable string)
 */
export function formatContextForAI(context: AIContext): string {
  const parts: string[] = []

  // Map viewport
  if (context.map.center && context.map.zoom) {
    const [lng, lat] = context.map.center
    parts.push(`Map centered at [${lat.toFixed(4)}, ${lng.toFixed(4)}], zoom level ${Math.round(context.map.zoom)}`)
  }

  // Selected feature
  if (context.selection.featureName) {
    parts.push(`Selected: "${context.selection.featureName}"`)
  }

  // Open artifacts
  if (context.artifacts.expanded > 0) {
    const artifactList = context.artifacts.currentNames.join(', ')
    parts.push(`Open artifacts (${context.artifacts.expanded}): ${artifactList}`)
  }

  // Active panel
  if (context.panel.active) {
    parts.push(`${formatPanelName(context.panel.active)} panel is open`)
  }

  // Visible places
  if (context.places.visible > 0) {
    parts.push(`${context.places.visible} places visible in viewport`)
  }

  // If no context, return default message
  if (parts.length === 0) {
    return "No specific context - user is viewing the map"
  }

  return `Current context: ${parts.join('; ')}.`
}

/**
 * Format context as structured data (for API payload)
 */
export function formatContextAsData(context: AIContext): Record<string, any> {
  return {
    map: {
      center: context.map.center,
      zoom: context.map.zoom ? Math.round(context.map.zoom) : null
    },
    selection: context.selection.featureName,
    artifacts: context.artifacts.currentNames,
    panel: context.panel.active,
    places_count: context.places.visible,
    timestamp: context.timestamp.toISOString()
  }
}

/**
 * Helper: Get human-readable artifact type name
 */
function getArtifactTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    'intelligence-alert': 'Intelligence Alert',
    'subject-profile': 'Subject Profile',
    'timeline': 'Timeline',
    'network-graph': 'Network Graph',
    'network-analysis': 'Network Analysis'
  }
  return typeMap[type] || type
}

/**
 * Helper: Format panel name for display
 */
function formatPanelName(panelMode: string): string {
  return panelMode
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if context has changed significantly (for update triggers)
 */
export function hasSignificantContextChange(
  oldContext: AIContext | null,
  newContext: AIContext
): boolean {
  if (!oldContext) return true

  // Check for significant changes
  const significantChanges = [
    // New selection
    oldContext.selection.featureName !== newContext.selection.featureName,
    // Artifact count changed
    oldContext.artifacts.expanded !== newContext.artifacts.expanded,
    // Panel opened/closed
    (oldContext.panel.active === null) !== (newContext.panel.active === null),
    // Large map movement (> 0.5 zoom levels)
    oldContext.map.zoom && newContext.map.zoom &&
      Math.abs(oldContext.map.zoom - newContext.map.zoom) > 0.5
  ]

  return significantChanges.some(changed => changed)
}
