/**
 * Use Case-Driven Layer Presets
 * Pre-configured layer combinations for common geospatial intelligence workflows
 *
 * Organized by real-world use cases rather than visual styles.
 * Each preset represents a specific intelligence workflow with appropriate layers.
 */

export interface LayerPreset {
  id: string
  name: string
  description: string
  icon: string
  basemap: string
  layers: Array<{
    id: string
    visible: boolean
  }>
  status: 'available' | 'coming-soon'
  phase: 1 | 2 | 3 // Development phase
  useCase: string // Detailed use case description
  developmentPriority?: 'high' | 'medium' | 'low'
  requiredLayers?: string[] // Layers that need implementation
}

/**
 * Phase 1: Available Now (with current layers)
 */

export const AVAILABLE_PRESETS: Record<string, LayerPreset> = {
  'urban-intelligence': {
    id: 'urban-intelligence',
    name: 'Urban Intelligence',
    description: 'Building footprints, infrastructure, and points of interest',
    icon: '🏙️',
    basemap: 'basemap-light',
    layers: [
      { id: 'infra-buildings-2d', visible: true },
      { id: 'infra-buildings-3d', visible: false },
      { id: 'infra-places', visible: true }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Urban planning, real estate analysis, site surveys, facility management, demographic studies'
  },

  'site-analysis': {
    id: 'site-analysis',
    name: 'Site Analysis',
    description: 'Location scouting with 3D terrain and satellite context',
    icon: '📍',
    basemap: 'basemap-satellite',
    layers: [
      { id: 'infra-buildings-3d', visible: true },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-places', visible: true }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Ground station site selection, facility placement, line-of-sight analysis, terrain evaluation'
  },

  'operations-view': {
    id: 'operations-view',
    name: 'Operations View',
    description: 'Clean operational map optimized for data overlay',
    icon: '🎯',
    basemap: 'basemap-dark',
    layers: [
      { id: 'infra-places', visible: true },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-buildings-3d', visible: false }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Real-time operations monitoring, network visualization, live data overlay, mission control'
  },

  'investigation-intelligence': {
    id: 'investigation-intelligence',
    name: 'Investigation Intelligence',
    description: 'Pattern-of-life analysis for authorized law enforcement investigations',
    icon: '🔍',
    basemap: 'basemap-satellite',
    layers: [
      { id: 'infra-buildings-3d', visible: true },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-places', visible: true },
      { id: 'infra-roads', visible: true },
      { id: 'intel-movement-path', visible: true },
      { id: 'intel-location-markers', visible: true },
      { id: 'intel-frequency-heatmap', visible: false }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Pattern-of-life analysis, movement tracking, location intelligence, predictive analysis for authorized investigations',
    requiredLayers: [
      'intel-movement-path',
      'intel-location-markers',
      'intel-frequency-heatmap'
    ]
  }
}

/**
 * Phase 2: Coming Soon (requires additional layers)
 */

export const COMING_SOON_PRESETS: Record<string, LayerPreset> = {
  'ground-station-ops': {
    id: 'ground-station-ops',
    name: 'Ground Station Operations',
    description: 'Satellite network operations and RF coverage analysis',
    icon: '📡',
    basemap: 'basemap-dark',
    layers: [
      { id: 'comms-ground-stations', visible: true },
      { id: 'comms-coverage', visible: true },
      { id: 'comms-orbits', visible: true },
      { id: 'comms-rf-footprints', visible: false },
      { id: 'infra-places', visible: true },
      { id: 'ops-critical-infra', visible: false },
      { id: 'weather-wind', visible: false },
      { id: 'weather-clouds', visible: false }
    ],
    status: 'coming-soon',
    phase: 2,
    developmentPriority: 'high',
    useCase: 'Ground station network planning, satellite pass predictions, RF link analysis, coverage optimization',
    requiredLayers: [
      'comms-ground-stations',
      'comms-coverage',
      'comms-orbits',
      'comms-rf-footprints'
    ]
  },

  'maritime-intelligence': {
    id: 'maritime-intelligence',
    name: 'Maritime Intelligence',
    description: 'Shipping operations, port logistics, and vessel tracking',
    icon: '🚢',
    basemap: 'basemap-satellite',
    layers: [
      { id: 'ops-ais-vessels', visible: true },
      { id: 'infra-ports', visible: true },
      { id: 'maritime-shipping-lanes', visible: true },
      { id: 'ops-port-congestion', visible: true },
      { id: 'maritime-boundaries', visible: false },
      { id: 'maritime-choke-points', visible: true },
      { id: 'weather-sst', visible: false },
      { id: 'weather-currents', visible: false },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-places', visible: true }
    ],
    status: 'coming-soon',
    phase: 2,
    developmentPriority: 'medium',
    useCase: 'Port operations monitoring, vessel traffic analysis, supply chain tracking, maritime security',
    requiredLayers: [
      'ops-ais-vessels',
      'infra-ports',
      'maritime-shipping-lanes',
      'ops-port-congestion',
      'maritime-boundaries',
      'maritime-choke-points'
    ]
  },

  'infrastructure-monitoring': {
    id: 'infrastructure-monitoring',
    name: 'Infrastructure Monitoring',
    description: 'Critical infrastructure and utility network analysis',
    icon: '⚡',
    basemap: 'basemap-light',
    layers: [
      { id: 'infra-buildings-3d', visible: true },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-places', visible: true },
      { id: 'ops-critical-infra', visible: true },
      { id: 'ops-pipelines', visible: true },
      { id: 'ops-cell-towers', visible: false },
      { id: 'ops-undersea-cables', visible: false },
      { id: 'ops-wind-farms', visible: false },
      { id: 'ops-oil-platforms', visible: false }
    ],
    status: 'coming-soon',
    phase: 2,
    developmentPriority: 'medium',
    useCase: 'Power grid monitoring, telecommunications infrastructure, pipeline safety, asset management',
    requiredLayers: [
      'ops-critical-infra',
      'ops-pipelines',
      'ops-cell-towers',
      'ops-undersea-cables'
    ]
  }
}

/**
 * Phase 3: Future Use Cases
 */

export const FUTURE_PRESETS: Record<string, LayerPreset> = {
  'disaster-response': {
    id: 'disaster-response',
    name: 'Disaster Response',
    description: 'Emergency management and crisis coordination',
    icon: '🔥',
    basemap: 'basemap-satellite',
    layers: [
      { id: 'ops-wildfires', visible: true },
      { id: 'ops-seismic', visible: true },
      { id: 'weather-precipitation', visible: true },
      { id: 'weather-wind', visible: true },
      { id: 'infra-roads', visible: true },
      { id: 'infra-places', visible: true },
      { id: 'ops-critical-infra', visible: true },
      { id: 'infra-buildings-2d', visible: false }
    ],
    status: 'coming-soon',
    phase: 3,
    developmentPriority: 'low',
    useCase: 'Wildfire tracking, earthquake monitoring, flood response, evacuation planning',
    requiredLayers: [
      'ops-wildfires',
      'ops-seismic',
      'weather-precipitation',
      'infra-roads'
    ]
  },

  'supply-chain-logistics': {
    id: 'supply-chain-logistics',
    name: 'Supply Chain & Logistics',
    description: 'Multimodal transportation and trade route analysis',
    icon: '🚂',
    basemap: 'basemap-light',
    layers: [
      { id: 'ops-trade-routes', visible: true },
      { id: 'infra-ports', visible: true },
      { id: 'ops-railways', visible: true },
      { id: 'ops-airports-major', visible: true },
      { id: 'infra-roads', visible: false },
      { id: 'maritime-shipping-lanes', visible: true },
      { id: 'ops-port-congestion', visible: true },
      { id: 'infra-places', visible: true }
    ],
    status: 'coming-soon',
    phase: 3,
    developmentPriority: 'low',
    useCase: 'Trade corridor optimization, logistics planning, bottleneck identification, freight routing',
    requiredLayers: [
      'ops-trade-routes',
      'ops-railways',
      'ops-airports-major',
      'infra-roads'
    ]
  }
}

/**
 * Combine all presets
 */
export const LAYER_PRESETS: Record<string, LayerPreset> = {
  ...AVAILABLE_PRESETS,
  ...COMING_SOON_PRESETS,
  ...FUTURE_PRESETS
}

/**
 * Default layer configuration (auto-loaded on app start)
 */
export const DEFAULT_LAYERS = {
  basemap: 'basemap-light',
  layers: [
    { id: 'infra-places', visible: false }, // Hidden by default - buildings get colored instead
    { id: 'infra-buildings-2d', visible: true } // Show buildings - they'll be colored on demand
  ]
}

/**
 * Helper functions
 */

export function getPreset(presetId: string): LayerPreset | undefined {
  return LAYER_PRESETS[presetId]
}

export function getAllPresets(): LayerPreset[] {
  return Object.values(LAYER_PRESETS)
}

export function getAvailablePresets(): LayerPreset[] {
  return Object.values(AVAILABLE_PRESETS)
}

export function getComingSoonPresets(): LayerPreset[] {
  return [...Object.values(COMING_SOON_PRESETS), ...Object.values(FUTURE_PRESETS)]
}

export function getPresetsByPhase(phase: 1 | 2 | 3): LayerPreset[] {
  return Object.values(LAYER_PRESETS).filter(preset => preset.phase === phase)
}
