/**
 * IC Domain Visualization Configuration
 * Domain-specific basemaps, layer defaults, and analysis controls
 *
 * Based on IC intelligence workflows and analyst requirements
 */

import { type ICDomainId } from './icDomains'

export type BasemapStyle = 'satellite' | 'satellite-streets' | 'light' | 'dark' | 'outdoors'

export interface LayerConfig {
  id: string
  enabled: boolean
  priority: number  // 1 = highest priority (essential), 5 = lowest (optional)
  opacity: number
  zIndex: number
}

export interface AnalysisControl {
  id: string
  label: string
  type: 'toggle' | 'slider' | 'select' | 'multi-select' | 'time-range' | 'radius' | 'custom'
  icon?: string
  options?: { value: string; label: string }[]
  defaultValue?: any
  description?: string
}

export interface DomainVisualizationConfig {
  domainId: ICDomainId

  // Basemap configuration
  defaultBasemap: BasemapStyle
  alternativeBasemaps: BasemapStyle[]

  // Layer configuration (priority-ordered)
  defaultLayers: LayerConfig[]

  // Analysis toolbar controls
  analysisControls: AnalysisControl[]

  // Visual emphasis notes
  visualEmphasis: {
    primaryFeatures: string[]    // What to highlight most
    colorScheme: string           // Overall color palette
    labelDensity: 'minimal' | 'moderate' | 'dense'
  }

  // Viewport defaults
  viewport: {
    pitch: number      // 0-85 degrees (0 = top-down, 85 = maximum tilt)
    bearing: number    // 0-360 degrees rotation
    zoom: number       // Default zoom level
  }
}

/**
 * Domain Visualization Configurations
 */
export const DOMAIN_VISUALIZATIONS: Record<ICDomainId, DomainVisualizationConfig> = {
  ground: {
    domainId: 'ground',

    defaultBasemap: 'light',  // Clean street map for urban infrastructure analysis
    alternativeBasemaps: ['satellite-streets', 'dark', 'outdoors'],

    defaultLayers: [
      { id: 'overture-buildings-2d', enabled: true, priority: 1, opacity: 0.8, zIndex: 6 },  // 2D for facility identification
      { id: 'overture-transportation', enabled: true, priority: 2, opacity: 0.7, zIndex: 4 },
      { id: 'overture-places', enabled: true, priority: 2, opacity: 0.9, zIndex: 7 },
      { id: 'cell-towers', enabled: true, priority: 3, opacity: 1.0, zIndex: 10 },
      { id: 'overture-addresses', enabled: false, priority: 3, opacity: 0.7, zIndex: 5 },
      { id: 'landuse', enabled: false, priority: 4, opacity: 0.5, zIndex: 2 },
      { id: 'maritime-routes', enabled: false, priority: 5, opacity: 0.7, zIndex: 8 },
      { id: 'hex-coverage', enabled: false, priority: 5, opacity: 0.6, zIndex: 5 }
    ],

    analysisControls: [
      {
        id: 'time-playback',
        label: 'Time Playback',
        type: 'time-range',
        icon: 'Clock',
        description: 'Temporal analysis for pattern-of-life studies'
      },
      {
        id: 'building-filter',
        label: 'Building Type',
        type: 'multi-select',
        icon: 'Building2',
        options: [
          { value: 'residential', label: 'Residential' },
          { value: 'commercial', label: 'Commercial' },
          { value: 'government', label: 'Government' },
          { value: 'industrial', label: 'Industrial' },
          { value: 'religious', label: 'Religious' }
        ],
        description: 'Filter buildings by type'
      },
      {
        id: 'poi-categories',
        label: 'POI Categories',
        type: 'multi-select',
        icon: 'MapPin',
        options: [
          { value: 'government', label: 'Government Facilities' },
          { value: 'transportation', label: 'Transportation Hubs' },
          { value: 'commercial', label: 'Commercial Centers' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'religious', label: 'Religious/Cultural' }
        ],
        description: 'Select POI categories to display'
      },
      {
        id: 'movement-heatmap',
        label: 'Movement Heatmap',
        type: 'toggle',
        icon: 'Flame',
        defaultValue: false,
        description: 'Display frequency heatmap of subject activity'
      },
      {
        id: 'radius-analysis',
        label: 'Radius Buffer',
        type: 'radius',
        icon: 'Circle',
        options: [
          { value: '100', label: '100m' },
          { value: '250', label: '250m' },
          { value: '500', label: '500m' },
          { value: '1000', label: '1km' },
          { value: '5000', label: '5km' }
        ],
        description: 'Draw radius from point of interest'
      },
      {
        id: 'cell-tower-coverage',
        label: 'Cell Coverage',
        type: 'toggle',
        icon: 'Radio',
        defaultValue: false,
        description: 'Show cell tower coverage areas'
      },
      {
        id: 'threat-level',
        label: 'Threat Overlay',
        type: 'select',
        icon: 'AlertTriangle',
        options: [
          { value: 'none', label: 'None' },
          { value: 'low', label: 'Low Risk Areas' },
          { value: 'medium', label: 'Medium Risk' },
          { value: 'high', label: 'High Risk' },
          { value: 'all', label: 'All Levels' }
        ],
        defaultValue: 'none'
      },
      {
        id: '3d-buildings',
        label: '3D Buildings',
        type: 'toggle',
        icon: 'Box',
        defaultValue: false,
        description: 'Enable 3D building extrusion (2D better for facility ID)'
      }
    ],

    visualEmphasis: {
      primaryFeatures: ['buildings', 'roads', 'places'],
      colorScheme: 'earth-tones',
      labelDensity: 'dense'
    },

    viewport: {
      pitch: 45,
      bearing: 0,
      zoom: 14
    }
  },

  maritime: {
    domainId: 'maritime',

    defaultBasemap: 'satellite',
    alternativeBasemaps: ['dark', 'light'],

    defaultLayers: [
      { id: 'maritime-routes', enabled: true, priority: 1, opacity: 0.7, zIndex: 8 },
      { id: 'overture-places', enabled: true, priority: 2, opacity: 0.9, zIndex: 7 },  // Ports
      { id: 'overture-transportation', enabled: false, priority: 3, opacity: 0.5, zIndex: 4 },
      { id: 'overture-buildings', enabled: false, priority: 4, opacity: 0.6, zIndex: 6 },
      { id: 'landuse', enabled: false, priority: 5, opacity: 0.4, zIndex: 2 }
    ],

    analysisControls: [
      {
        id: 'vessel-filter',
        label: 'Vessel Type',
        type: 'multi-select',
        icon: 'Ship',
        options: [
          { value: 'cargo', label: 'Cargo' },
          { value: 'tanker', label: 'Tanker' },
          { value: 'passenger', label: 'Passenger' },
          { value: 'fishing', label: 'Fishing' },
          { value: 'military', label: 'Military' },
          { value: 'unknown', label: 'Unknown' }
        ],
        description: 'Filter vessels by type'
      },
      {
        id: 'time-window',
        label: 'Time Window',
        type: 'select',
        icon: 'Clock',
        options: [
          { value: 'live', label: 'Live (Real-time)' },
          { value: '1h', label: 'Last 1 Hour' },
          { value: '6h', label: 'Last 6 Hours' },
          { value: '24h', label: 'Last 24 Hours' },
          { value: '7d', label: 'Last 7 Days' }
        ],
        defaultValue: 'live'
      },
      {
        id: 'route-analysis',
        label: 'Route Analysis',
        type: 'toggle',
        icon: 'Route',
        defaultValue: false,
        description: 'Display historical vessel tracks'
      },
      {
        id: 'maritime-boundaries',
        label: 'Maritime Boundaries',
        type: 'toggle',
        icon: 'Waves',
        defaultValue: true,
        description: 'Show territorial waters and EEZ'
      },
      {
        id: 'port-activity',
        label: 'Port Activity',
        type: 'toggle',
        icon: 'Anchor',
        defaultValue: true,
        description: 'Monitor vessel arrivals/departures'
      },
      {
        id: 'shipping-density',
        label: 'Shipping Density',
        type: 'toggle',
        icon: 'Flame',
        defaultValue: false,
        description: 'Heatmap of vessel traffic'
      }
    ],

    visualEmphasis: {
      primaryFeatures: ['vessels', 'ports', 'shipping-lanes'],
      colorScheme: 'ocean-blues',
      labelDensity: 'moderate'
    },

    viewport: {
      pitch: 0,
      bearing: 0,
      zoom: 8
    }
  },

  space: {
    domainId: 'space',

    defaultBasemap: 'dark',
    alternativeBasemaps: ['satellite'],

    defaultLayers: [
      { id: 'ground-stations', enabled: true, priority: 1, opacity: 1.0, zIndex: 10 },
      { id: 'overture-places', enabled: false, priority: 3, opacity: 0.8, zIndex: 7 },
      { id: 'overture-buildings', enabled: false, priority: 4, opacity: 0.6, zIndex: 6 }
    ],

    analysisControls: [
      {
        id: 'satellite-selector',
        label: 'Satellite',
        type: 'select',
        icon: 'Satellite',
        options: [
          { value: 'sentinel-2', label: 'Sentinel-2 (Optical)' },
          { value: 'sentinel-1', label: 'Sentinel-1 (SAR)' },
          { value: 'landsat-8', label: 'Landsat-8' },
          { value: 'commercial', label: 'Commercial Sats' }
        ],
        defaultValue: 'sentinel-2'
      },
      {
        id: 'temporal-slider',
        label: 'Imagery Date',
        type: 'time-range',
        icon: 'Calendar',
        description: 'Select imagery date range'
      },
      {
        id: 'change-detection',
        label: 'Change Detection',
        type: 'toggle',
        icon: 'Diff',
        defaultValue: false,
        description: 'Compare imagery across dates'
      },
      {
        id: 'orbital-pass',
        label: 'Orbital Passes',
        type: 'toggle',
        icon: 'Orbit',
        defaultValue: false,
        description: 'Show satellite pass predictions'
      },
      {
        id: 'ground-station-coverage',
        label: 'GS Coverage',
        type: 'toggle',
        icon: 'Radio',
        defaultValue: false,
        description: 'Display ground station visibility cones'
      },
      {
        id: 'spectral-bands',
        label: 'Spectral Bands',
        type: 'select',
        icon: 'Palette',
        options: [
          { value: 'true-color', label: 'True Color (RGB)' },
          { value: 'false-color', label: 'False Color (NIR)' },
          { value: 'ndvi', label: 'NDVI (Vegetation)' },
          { value: 'ndwi', label: 'NDWI (Water)' }
        ],
        defaultValue: 'true-color'
      }
    ],

    visualEmphasis: {
      primaryFeatures: ['satellite-imagery', 'ground-stations', 'orbital-tracks'],
      colorScheme: 'dark-theme-bright-accents',
      labelDensity: 'minimal'
    },

    viewport: {
      pitch: 0,
      bearing: 0,
      zoom: 6
    }
  },

  surface: {
    domainId: 'surface',

    defaultBasemap: 'satellite',  // Satellite imagery provides better context for terrain
    alternativeBasemaps: ['outdoors', 'light'],

    defaultLayers: [
      { id: 'terrain-3d', enabled: true, priority: 1, opacity: 1.0, zIndex: 1 },  // 3D terrain elevation
      { id: 'hillshading', enabled: true, priority: 1, opacity: 0.6, zIndex: 2 },  // Terrain shading (higher for visibility)
      { id: 'contour-lines', enabled: true, priority: 1, opacity: 0.7, zIndex: 3 },  // Elevation contours
      { id: 'overture-buildings-3d', enabled: true, priority: 2, opacity: 0.8, zIndex: 6 },  // 3D buildings as terrain obstacles
      { id: 'landuse', enabled: true, priority: 2, opacity: 0.3, zIndex: 4 },  // Reduced further to show terrain
      { id: 'hydrology', enabled: true, priority: 3, opacity: 0.7, zIndex: 5 },  // Rivers, lakes
      { id: 'overture-transportation', enabled: false, priority: 4, opacity: 0.5, zIndex: 7 },
      { id: 'overture-places', enabled: false, priority: 5, opacity: 0.7, zIndex: 8 }
    ],

    analysisControls: [
      {
        id: 'terrain-3d-toggle',
        label: '3D Terrain',
        type: 'toggle',
        icon: 'Mountain',
        defaultValue: true,
        description: 'Enable 3D terrain rendering'
      },
      {
        id: '3d-terrain-exaggeration',
        label: 'Terrain Exaggeration',
        type: 'slider',
        icon: 'Maximize2',
        description: 'Vertical exaggeration (1x to 5x)',
        defaultValue: 2.0
      },
      {
        id: 'hillshading-toggle',
        label: 'Hillshading',
        type: 'toggle',
        icon: 'Sun',
        defaultValue: true,
        description: 'Show terrain relief shading'
      },
      {
        id: 'hillshading-opacity',
        label: 'Hillshade Intensity',
        type: 'slider',
        icon: 'Contrast',
        description: 'Hillshading opacity (0 to 1)',
        defaultValue: 0.5
      },
      {
        id: 'elevation-query',
        label: 'Elevation Query',
        type: 'toggle',
        icon: 'MapPin',
        defaultValue: false,
        description: 'Click map to query elevation'
      },
      {
        id: 'contour-lines',
        label: 'Contour Lines',
        type: 'toggle',
        icon: 'Layers',
        defaultValue: true,
        description: 'Show elevation contour lines'
      },
      {
        id: 'contour-interval',
        label: 'Contour Interval',
        type: 'select',
        icon: 'Hash',
        options: [
          { value: '5', label: '5 meters' },
          { value: '10', label: '10 meters' },
          { value: '20', label: '20 meters' },
          { value: '50', label: '50 meters' },
          { value: '100', label: '100 meters' }
        ],
        defaultValue: '20'
      },
      {
        id: 'buildings-3d-toggle',
        label: '3D Buildings',
        type: 'toggle',
        icon: 'Building2',
        defaultValue: true,
        description: 'Show buildings as terrain obstacles'
      },
      {
        id: 'hydrology-toggle',
        label: 'Hydrology',
        type: 'toggle',
        icon: 'Waves',
        defaultValue: true,
        description: 'Show rivers, lakes, and water bodies'
      },
      {
        id: 'slope-analysis',
        label: 'Slope Analysis',
        type: 'toggle',
        icon: 'TrendingUp',
        defaultValue: false,
        description: 'Color-code terrain by slope angle (0-90°)'
      },
      {
        id: 'aspect-analysis',
        label: 'Aspect Analysis',
        type: 'toggle',
        icon: 'Compass',
        defaultValue: false,
        description: 'Color-code by slope direction (N/E/S/W)'
      },
      {
        id: 'viewshed',
        label: 'Viewshed Analysis',
        type: 'custom',
        icon: 'Eye',
        description: 'Calculate visible area from observation point'
      },
      {
        id: 'line-of-sight',
        label: 'Line of Sight',
        type: 'custom',
        icon: 'GitBranch',
        description: 'Check if two points can see each other'
      },
      {
        id: 'elevation-profile',
        label: 'Elevation Profile',
        type: 'custom',
        icon: 'Activity',
        description: 'Display elevation graph along line'
      },
      {
        id: 'land-cover',
        label: 'Land Cover',
        type: 'toggle',
        icon: 'Trees',
        defaultValue: false,
        description: 'Show vegetation and land use classification'
      }
    ],

    visualEmphasis: {
      primaryFeatures: ['terrain-elevation', 'hillshading', 'contours', 'hydrology'],
      colorScheme: 'topographic',
      labelDensity: 'minimal'  // Less clutter for terrain analysis
    },

    viewport: {
      pitch: 65,  // Steeper angle for better 3D terrain viewing
      bearing: -30,
      zoom: 12
    }
  },

  air: {
    domainId: 'air',

    defaultBasemap: 'light',
    alternativeBasemaps: ['outdoors', 'dark'],

    defaultLayers: [
      { id: 'overture-places', enabled: true, priority: 1, opacity: 0.9, zIndex: 7 },  // Airports
      { id: 'overture-transportation', enabled: true, priority: 2, opacity: 0.6, zIndex: 4 },
      { id: 'overture-buildings', enabled: false, priority: 4, opacity: 0.5, zIndex: 6 }
    ],

    analysisControls: [
      {
        id: 'aircraft-filter',
        label: 'Aircraft Type',
        type: 'multi-select',
        icon: 'Plane',
        options: [
          { value: 'commercial', label: 'Commercial' },
          { value: 'cargo', label: 'Cargo' },
          { value: 'private', label: 'Private' },
          { value: 'military', label: 'Military' },
          { value: 'helicopter', label: 'Helicopter' }
        ],
        description: 'Filter aircraft by type'
      },
      {
        id: 'altitude-filter',
        label: 'Altitude Range',
        type: 'select',
        icon: 'MoveVertical',
        options: [
          { value: 'all', label: 'All Altitudes' },
          { value: 'ground', label: 'On Ground' },
          { value: 'low', label: 'Low (<10,000 ft)' },
          { value: 'medium', label: 'Medium (10-30k ft)' },
          { value: 'high', label: 'High (>30k ft)' }
        ],
        defaultValue: 'all'
      },
      {
        id: 'airspace-toggle',
        label: 'Airspace Boundaries',
        type: 'toggle',
        icon: 'Hexagon',
        defaultValue: true,
        description: 'Show controlled airspace'
      },
      {
        id: 'flight-tracks',
        label: 'Flight Tracks',
        type: 'toggle',
        icon: 'Route',
        defaultValue: true,
        description: 'Display historical flight paths'
      },
      {
        id: 'airport-activity',
        label: 'Airport Activity',
        type: 'toggle',
        icon: 'Radio',
        defaultValue: false,
        description: 'Monitor departures/arrivals'
      }
    ],

    visualEmphasis: {
      primaryFeatures: ['aircraft', 'airports', 'airspace'],
      colorScheme: 'aviation-chart',
      labelDensity: 'moderate'
    },

    viewport: {
      pitch: 0,
      bearing: 0,
      zoom: 9
    }
  },

  subsurface: {
    domainId: 'subsurface',

    defaultBasemap: 'satellite',
    alternativeBasemaps: ['outdoors', 'light'],

    defaultLayers: [
      { id: 'overture-transportation', enabled: false, priority: 3, opacity: 0.5, zIndex: 4 },
      { id: 'overture-buildings', enabled: false, priority: 3, opacity: 0.5, zIndex: 6 },
      { id: 'landuse', enabled: true, priority: 2, opacity: 0.6, zIndex: 2 }
    ],

    analysisControls: [
      {
        id: 'geological-layers',
        label: 'Geological Layers',
        type: 'toggle',
        icon: 'Layers',
        defaultValue: false,
        description: 'Show rock formations and structures'
      },
      {
        id: 'facility-database',
        label: 'Underground Facilities',
        type: 'multi-select',
        icon: 'FileBox',
        options: [
          { value: 'tunnels', label: 'Tunnels' },
          { value: 'mines', label: 'Mines' },
          { value: 'caves', label: 'Caves' },
          { value: 'bunkers', label: 'Bunkers' },
          { value: 'utilities', label: 'Utilities' }
        ],
        description: 'Filter by facility type'
      },
      {
        id: 'surface-indicators',
        label: 'Surface Indicators',
        type: 'toggle',
        icon: 'Search',
        defaultValue: true,
        description: 'Detect spoil piles, vents, access roads'
      },
      {
        id: 'geophysical-anomalies',
        label: 'Geophysical Anomalies',
        type: 'toggle',
        icon: 'Zap',
        defaultValue: false,
        description: 'Magnetic, gravity, seismic anomalies'
      },
      {
        id: 'cross-section',
        label: 'Cross-Section',
        type: 'custom',
        icon: 'SplitSquareVertical',
        description: 'Display vertical geological slice'
      }
    ],

    visualEmphasis: {
      primaryFeatures: ['surface-indicators', 'geological-features', 'tunnel-entrances'],
      colorScheme: 'geological',
      labelDensity: 'minimal'
    },

    viewport: {
      pitch: 30,
      bearing: 0,
      zoom: 13
    }
  }
}

/**
 * Get visualization config for domain
 */
export function getDomainVisualization(domainId: ICDomainId): DomainVisualizationConfig {
  return DOMAIN_VISUALIZATIONS[domainId]
}

/**
 * Get default layers for domain (sorted by priority)
 */
export function getDomainDefaultLayers(domainId: ICDomainId): LayerConfig[] {
  const config = DOMAIN_VISUALIZATIONS[domainId]
  return config.defaultLayers.sort((a, b) => a.priority - b.priority)
}

/**
 * Get analysis controls for domain
 */
export function getDomainAnalysisControls(domainId: ICDomainId): AnalysisControl[] {
  const config = DOMAIN_VISUALIZATIONS[domainId]
  return config.analysisControls
}

/**
 * Get basemap style for domain
 */
export function getDomainBasemap(domainId: ICDomainId): BasemapStyle {
  const config = DOMAIN_VISUALIZATIONS[domainId]
  return config.defaultBasemap
}

/**
 * Convert basemap style to Mapbox style URL
 */
export function basemapToMapboxStyle(basemap: BasemapStyle): string {
  const styleMap: Record<BasemapStyle, string> = {
    'satellite': 'mapbox://styles/mapbox/satellite-v9',
    'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12',
    'light': 'mapbox://styles/mapbox/light-v11',
    'dark': 'mapbox://styles/mapbox/dark-v11',
    'outdoors': 'mapbox://styles/mapbox/outdoors-v12'
  }

  return styleMap[basemap]
}
