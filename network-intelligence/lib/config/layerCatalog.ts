/**
 * Layer Catalog
 * Comprehensive layer definitions for maritime, satellite, and intelligence operations
 *
 * Organized into 6 categories:
 * - Base Maps
 * - Weather & Environment
 * - Earth Observation
 * - Infrastructure
 * - Maritime Data
 * - Communications
 */

export type LayerCategory =
  | 'basemaps'
  | 'weather'
  | 'earth-observation'
  | 'infrastructure'
  | 'maritime'
  | 'communications'
  | 'operations-intelligence'

export type LayerType =
  | 'raster'        // Raster tiles (imagery, weather)
  | 'vector'        // Vector tiles (roads, boundaries)
  | 'fill-extrusion' // 3D buildings
  | 'heatmap'       // Density visualization
  | 'symbol'        // Icons/markers
  | 'geojson'       // GeoJSON overlay

export type DataSource =
  | 'mapbox'
  | 'overture'
  | 'aws-open-data'
  | 'noaa'
  | 'nasa'
  | 'marine-regions'
  | 'celestrak'
  | 'custom'

export interface LayerDefinition {
  id: string
  name: string
  category: LayerCategory
  type: LayerType
  dataSource: DataSource
  description: string
  icon: string // Emoji or icon identifier
  thumbnailUrl?: string

  // Metadata
  coverage: 'global' | 'regional' | 'us-only'
  updateFrequency?: string // e.g., "real-time", "daily", "static"
  resolution?: string      // e.g., "10m", "30m", "1km"

  // Requirements
  requiresApiKey: boolean
  requiresGeneration: boolean // true if PMTiles needs to be generated
  apiKeyUrl?: string          // Where to get API key

  // Configuration
  defaultVisible: boolean
  defaultOpacity: number
  minZoom: number
  maxZoom: number
  isEssential?: boolean       // Mark as essential layer (always shown in UI)

  // Integration
  sourceUrl?: string          // Tile URL or API endpoint
  documentation?: string      // Link to integration docs

  // Status
  status: 'available' | 'coming-soon' | 'requires-setup'
}

/**
 * Category definitions with metadata
 */
export interface CategoryDefinition {
  id: LayerCategory
  name: string
  icon: string
  description: string
  order: number
}

export const LAYER_CATEGORIES: Record<LayerCategory, CategoryDefinition> = {
  'basemaps': {
    id: 'basemaps',
    name: 'Base Maps',
    icon: '🗺️',
    description: 'Foundational map styles and imagery',
    order: 1
  },
  'weather': {
    id: 'weather',
    name: 'Weather & Environment',
    icon: '🌦️',
    description: 'Weather data, ocean conditions, and environmental monitoring',
    order: 2
  },
  'earth-observation': {
    id: 'earth-observation',
    name: 'Earth Observation',
    icon: '🛰️',
    description: 'Satellite imagery from optical, SAR, and multi-spectral sensors',
    order: 3
  },
  'infrastructure': {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: '🏗️',
    description: 'Buildings, roads, ports, and points of interest',
    order: 4
  },
  'maritime': {
    id: 'maritime',
    name: 'Maritime Data',
    icon: '🌊',
    description: 'Bathymetry, boundaries, shipping lanes, and port infrastructure',
    order: 5
  },
  'communications': {
    id: 'communications',
    name: 'Communications',
    icon: '📡',
    description: 'Satellite coverage, ground stations, RF footprints, and orbit tracks',
    order: 6
  },
  'operations-intelligence': {
    id: 'operations-intelligence',
    name: 'Operations & Intelligence',
    icon: '🎯',
    description: 'AIS tracking, critical infrastructure, disasters, and security layers',
    order: 7
  }
}

/**
 * Complete layer catalog
 */
export const LAYER_CATALOG: Record<string, LayerDefinition> = {
  // ===========================================
  // BASE MAPS
  // ===========================================
  'basemap-satellite': {
    id: 'basemap-satellite',
    name: 'Satellite',
    category: 'basemaps',
    type: 'raster',
    dataSource: 'mapbox',
    description: 'High-resolution satellite imagery with roads and labels',
    icon: '🛰️',
    coverage: 'global',
    updateFrequency: 'monthly',
    resolution: '~50cm',
    requiresApiKey: false, // Using existing Mapbox token
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 22,
    sourceUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
    documentation: 'https://docs.mapbox.com/api/maps/styles/#mapbox-styles',
    status: 'available'
  },

  'basemap-dark': {
    id: 'basemap-dark',
    name: 'Dark',
    category: 'basemaps',
    type: 'vector',
    dataSource: 'mapbox',
    description: 'Dark mode basemap optimized for data overlays',
    icon: '🌙',
    coverage: 'global',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 22,
    sourceUrl: 'mapbox://styles/mapbox/dark-v11',
    status: 'available'
  },

  'basemap-streets': {
    id: 'basemap-streets',
    name: 'Streets',
    category: 'basemaps',
    type: 'vector',
    dataSource: 'mapbox',
    description: 'Detailed street map with comprehensive road network',
    icon: '🚗',
    coverage: 'global',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 22,
    sourceUrl: 'mapbox://styles/mapbox/streets-v12',
    status: 'available'
  },

  'basemap-terrain': {
    id: 'basemap-terrain',
    name: 'Terrain',
    category: 'basemaps',
    type: 'raster',
    dataSource: 'mapbox',
    description: 'Topographic map with elevation shading',
    icon: '⛰️',
    coverage: 'global',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 22,
    sourceUrl: 'mapbox://styles/mapbox/outdoors-v12',
    status: 'available'
  },

  'basemap-navigation': {
    id: 'basemap-navigation',
    name: 'Navigation',
    category: 'basemaps',
    type: 'vector',
    dataSource: 'mapbox',
    description: 'Navigation-optimized map with turn-by-turn guidance styling',
    icon: '🧭',
    coverage: 'global',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 22,
    sourceUrl: 'mapbox://styles/mapbox/navigation-day-v1',
    status: 'available'
  },

  'basemap-light': {
    id: 'basemap-light',
    name: 'Light',
    category: 'basemaps',
    type: 'vector',
    dataSource: 'mapbox',
    description: 'Clean, minimalist light basemap ideal for data visualization',
    icon: '☀️',
    coverage: 'global',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: true,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 22,
    sourceUrl: 'mapbox://styles/mapbox/light-v11',
    status: 'available'
  },

  // ===========================================
  // WEATHER & ENVIRONMENT
  // ===========================================
  'weather-wind': {
    id: 'weather-wind',
    name: 'Wind Speed & Direction',
    category: 'weather',
    type: 'raster',
    dataSource: 'mapbox',
    description: 'Real-time wind speed and direction visualization',
    icon: '💨',
    coverage: 'global',
    updateFrequency: 'hourly',
    resolution: '5km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 0,
    maxZoom: 12,
    documentation: 'https://docs.mapbox.com/api/maps/weather/',
    status: 'coming-soon' // Requires Mapbox Weather API setup
  },

  'weather-temperature': {
    id: 'weather-temperature',
    name: 'Temperature',
    category: 'weather',
    type: 'raster',
    dataSource: 'mapbox',
    description: 'Current air temperature',
    icon: '🌡️',
    coverage: 'global',
    updateFrequency: 'hourly',
    resolution: '5km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 0,
    maxZoom: 12,
    status: 'coming-soon'
  },

  'weather-precipitation': {
    id: 'weather-precipitation',
    name: 'Precipitation',
    category: 'weather',
    type: 'raster',
    dataSource: 'mapbox',
    description: 'Real-time precipitation radar',
    icon: '🌧️',
    coverage: 'global',
    updateFrequency: 'real-time',
    resolution: '1km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 0,
    maxZoom: 12,
    status: 'coming-soon'
  },

  'weather-sst': {
    id: 'weather-sst',
    name: 'Sea Surface Temperature',
    category: 'weather',
    type: 'raster',
    dataSource: 'noaa',
    description: 'Global sea surface temperature from NOAA satellites',
    icon: '🌊',
    coverage: 'global',
    updateFrequency: 'daily',
    resolution: '1km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 0,
    maxZoom: 10,
    sourceUrl: 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41',
    documentation: 'https://coastwatch.pfeg.noaa.gov/erddap/info/jplMURSST41/index.html',
    status: 'coming-soon'
  },

  'weather-currents': {
    id: 'weather-currents',
    name: 'Ocean Currents',
    category: 'weather',
    type: 'vector',
    dataSource: 'noaa',
    description: 'Ocean surface current velocity and direction',
    icon: '〰️',
    coverage: 'global',
    updateFrequency: 'daily',
    resolution: '5km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 0,
    maxZoom: 10,
    status: 'coming-soon'
  },

  'weather-clouds': {
    id: 'weather-clouds',
    name: 'Cloud Cover',
    category: 'weather',
    type: 'raster',
    dataSource: 'mapbox',
    description: 'Current cloud coverage',
    icon: '☁️',
    coverage: 'global',
    updateFrequency: 'hourly',
    resolution: '5km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.6,
    minZoom: 0,
    maxZoom: 12,
    status: 'coming-soon'
  },

  // ===========================================
  // EARTH OBSERVATION
  // ===========================================
  'eo-sentinel-2': {
    id: 'eo-sentinel-2',
    name: 'Sentinel-2 Optical',
    category: 'earth-observation',
    type: 'raster',
    dataSource: 'aws-open-data',
    description: 'Free 10m optical satellite imagery (EU Copernicus)',
    icon: '🛰️',
    coverage: 'global',
    updateFrequency: 'every 5 days',
    resolution: '10m',
    requiresApiKey: false, // AWS Open Data is free
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 8,
    maxZoom: 16,
    sourceUrl: 'https://earth-search.aws.element84.com/v1',
    documentation: 'https://registry.opendata.aws/sentinel-2-l2a-cogs/',
    status: 'coming-soon'
  },

  'eo-landsat-8': {
    id: 'eo-landsat-8',
    name: 'Landsat-8',
    category: 'earth-observation',
    type: 'raster',
    dataSource: 'aws-open-data',
    description: 'Free 30m optical/thermal imagery (NASA/USGS)',
    icon: '🛰️',
    coverage: 'global',
    updateFrequency: 'every 16 days',
    resolution: '30m',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 8,
    maxZoom: 14,
    sourceUrl: 'https://landsatlook.usgs.gov/stac-server',
    documentation: 'https://registry.opendata.aws/landsat-8/',
    status: 'coming-soon'
  },

  'eo-viirs': {
    id: 'eo-viirs',
    name: 'VIIRS Day/Night Band',
    category: 'earth-observation',
    type: 'raster',
    dataSource: 'nasa',
    description: 'Nighttime lights and daytime imagery from NOAA/NASA satellites',
    icon: '🌃',
    coverage: 'global',
    updateFrequency: 'daily',
    resolution: '750m',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 10,
    sourceUrl: 'https://earthdata.nasa.gov/earth-observation-data/near-real-time/download-nrt-data/viirs-nrt',
    status: 'coming-soon'
  },

  'eo-modis': {
    id: 'eo-modis',
    name: 'MODIS True Color',
    category: 'earth-observation',
    type: 'raster',
    dataSource: 'nasa',
    description: 'Daily true-color global imagery from NASA Terra/Aqua',
    icon: '🌍',
    coverage: 'global',
    updateFrequency: 'daily',
    resolution: '250m',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 10,
    sourceUrl: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor',
    status: 'coming-soon'
  },

  // ===========================================
  // INFRASTRUCTURE
  // ===========================================
  'infra-buildings-3d': {
    id: 'infra-buildings-3d',
    name: 'Buildings (3D)',
    category: 'infrastructure',
    type: 'fill-extrusion',
    dataSource: 'overture',
    description: '3D extruded buildings with height data for major US port cities',
    icon: '🏗️',
    coverage: 'us-only',
    updateFrequency: 'quarterly',
    resolution: 'building-level',
    requiresApiKey: false,
    requiresGeneration: false, // Already generated
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 12,
    maxZoom: 16,
    isEssential: true,
    sourceUrl: '/tiles/buildings-usa.pmtiles',
    documentation: '/docs/BUILDINGS_LAYER_QUICKSTART.md',
    status: 'available'
  },

  'infra-buildings-2d': {
    id: 'infra-buildings-2d',
    name: 'Buildings (2D)',
    category: 'infrastructure',
    type: 'vector',
    dataSource: 'overture',
    description: 'Building footprints color-coded by type',
    icon: '🏢',
    coverage: 'us-only',
    updateFrequency: 'quarterly',
    resolution: 'building-level',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 12,
    maxZoom: 16,
    isEssential: true,
    sourceUrl: '/tiles/buildings-usa.pmtiles',
    status: 'available'
  },

  'infra-places': {
    id: 'infra-places',
    name: 'Places & POIs',
    category: 'infrastructure',
    type: 'symbol',
    dataSource: 'overture',
    description: '1M global points of interest (airports, hospitals, universities, etc.)',
    icon: '📍',
    coverage: 'global',
    updateFrequency: 'quarterly',
    resolution: 'point',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 6,
    maxZoom: 14,
    isEssential: true,
    sourceUrl: '/tiles/places-global.pmtiles',
    status: 'available'
  },

  'infra-roads': {
    id: 'infra-roads',
    name: 'Roads',
    category: 'infrastructure',
    type: 'vector',
    dataSource: 'overture',
    description: 'Road network for 7 US port cities (highways, streets, residential roads)',
    icon: '🛣️',
    coverage: 'us-only',
    updateFrequency: 'quarterly',
    resolution: 'street-level',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 8,
    maxZoom: 14,
    sourceUrl: '/tiles/roads-usa.pmtiles',
    documentation: '/scripts/generate-roads-tiles.sh',
    status: 'requires-setup'
  },

  'infra-ports': {
    id: 'infra-ports',
    name: 'Ports & Harbors',
    category: 'infrastructure',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Major seaports and harbor infrastructure',
    icon: '⚓',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 4,
    maxZoom: 14,
    status: 'requires-setup'
  },

  // ===========================================
  // MARITIME DATA
  // ===========================================
  'maritime-boundaries': {
    id: 'maritime-boundaries',
    name: 'Maritime Boundaries',
    category: 'maritime',
    type: 'vector',
    dataSource: 'marine-regions',
    description: 'EEZ, territorial waters, and international boundaries',
    icon: '🗺️',
    coverage: 'global',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 0,
    maxZoom: 12,
    sourceUrl: 'https://www.marineregions.org/downloads.php',
    documentation: 'https://www.marineregions.org/',
    status: 'coming-soon'
  },

  'maritime-bathymetry': {
    id: 'maritime-bathymetry',
    name: 'Bathymetry',
    category: 'maritime',
    type: 'raster',
    dataSource: 'noaa',
    description: 'Ocean depth contours and seafloor topography',
    icon: '🌊',
    coverage: 'global',
    updateFrequency: 'static',
    resolution: '1km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 0,
    maxZoom: 10,
    sourceUrl: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    status: 'coming-soon'
  },

  'maritime-shipping-lanes': {
    id: 'maritime-shipping-lanes',
    name: 'Shipping Lanes',
    category: 'maritime',
    type: 'vector',
    dataSource: 'custom',
    description: 'Major international shipping routes',
    icon: '🚢',
    coverage: 'global',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 4,
    maxZoom: 10,
    status: 'requires-setup'
  },

  'maritime-anchorages': {
    id: 'maritime-anchorages',
    name: 'Anchorage Areas',
    category: 'maritime',
    type: 'vector',
    dataSource: 'noaa',
    description: 'Designated anchorage and waiting areas',
    icon: '⚓',
    coverage: 'us-only',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 8,
    maxZoom: 14,
    status: 'coming-soon'
  },

  // ===========================================
  // COMMUNICATIONS
  // ===========================================
  'comms-ground-stations': {
    id: 'comms-ground-stations',
    name: 'Ground Station Locations',
    category: 'communications',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Satellite ground station locations worldwide',
    icon: '📡',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 0,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'comms-coverage': {
    id: 'comms-coverage',
    name: 'Satellite Coverage',
    category: 'communications',
    type: 'vector',
    dataSource: 'custom',
    description: 'Ground station coverage ranges and visibility zones',
    icon: '📶',
    coverage: 'global',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.5,
    minZoom: 0,
    maxZoom: 10,
    status: 'requires-setup'
  },

  'comms-orbits': {
    id: 'comms-orbits',
    name: 'Orbit Tracks',
    category: 'communications',
    type: 'vector',
    dataSource: 'celestrak',
    description: 'LEO/GEO satellite orbit visualization from TLE data',
    icon: '🛰️',
    coverage: 'global',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 0,
    maxZoom: 10,
    sourceUrl: 'https://celestrak.org/NORAD/elements/',
    documentation: 'https://celestrak.org/',
    status: 'coming-soon'
  },

  'comms-rf-footprints': {
    id: 'comms-rf-footprints',
    name: 'RF Footprints',
    category: 'communications',
    type: 'vector',
    dataSource: 'custom',
    description: 'Radio frequency coverage footprints for GEO satellites',
    icon: '📻',
    coverage: 'global',
    updateFrequency: 'static',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.6,
    minZoom: 0,
    maxZoom: 8,
    status: 'requires-setup'
  },

  // ===========================================
  // OPERATIONS & INTELLIGENCE
  // ===========================================
  'ops-ais-vessels': {
    id: 'ops-ais-vessels',
    name: 'AIS Vessel Tracking',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Real-time vessel positions from AIS transponders',
    icon: '🚢',
    coverage: 'global',
    updateFrequency: 'real-time',
    requiresApiKey: true,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 4,
    maxZoom: 18,
    apiKeyUrl: 'https://www.marinetraffic.com/en/ais-api-services',
    documentation: 'https://www.marinetraffic.com/en/ais-api-services/documentation',
    status: 'requires-setup'
  },

  'ops-port-congestion': {
    id: 'ops-port-congestion',
    name: 'Port Congestion',
    category: 'operations-intelligence',
    type: 'heatmap',
    dataSource: 'custom',
    description: 'Port wait times and congestion levels',
    icon: '⚓',
    coverage: 'global',
    updateFrequency: 'hourly',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 6,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-exclusion-zones': {
    id: 'ops-exclusion-zones',
    name: 'Exclusion Zones',
    category: 'operations-intelligence',
    type: 'vector',
    dataSource: 'custom',
    description: 'Restricted areas, no-go zones, and military exclusion areas',
    icon: '🚫',
    coverage: 'global',
    updateFrequency: 'weekly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.6,
    minZoom: 4,
    maxZoom: 12,
    status: 'requires-setup'
  },

  'ops-trade-routes': {
    id: 'ops-trade-routes',
    name: 'Trade Routes',
    category: 'operations-intelligence',
    type: 'vector',
    dataSource: 'custom',
    description: 'Major global trade corridors and shipping routes',
    icon: '🌐',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 2,
    maxZoom: 10,
    status: 'requires-setup'
  },

  'ops-critical-infra': {
    id: 'ops-critical-infra',
    name: 'Critical Infrastructure',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Power plants, substations, data centers, refineries',
    icon: '⚡',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 6,
    maxZoom: 16,
    status: 'requires-setup'
  },

  'ops-pipelines': {
    id: 'ops-pipelines',
    name: 'Pipelines & Energy',
    category: 'operations-intelligence',
    type: 'vector',
    dataSource: 'custom',
    description: 'Oil, gas, and water pipeline networks',
    icon: '🛢️',
    coverage: 'global',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 6,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-wildfires': {
    id: 'ops-wildfires',
    name: 'Active Wildfires',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'nasa',
    description: 'Real-time wildfire detection from FIRMS/MODIS',
    icon: '🔥',
    coverage: 'global',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 2,
    maxZoom: 12,
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/',
    documentation: 'https://firms.modaps.eosdis.nasa.gov/api/',
    status: 'coming-soon'
  },

  'ops-night-lights': {
    id: 'ops-night-lights',
    name: 'Night Lights (Economic Activity)',
    category: 'operations-intelligence',
    type: 'raster',
    dataSource: 'noaa',
    description: 'VIIRS night lights showing economic activity and power outages',
    icon: '💡',
    coverage: 'global',
    updateFrequency: 'daily',
    resolution: '750m',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 2,
    maxZoom: 10,
    sourceUrl: 'https://www.ngdc.noaa.gov/eog/viirs/download_dnb_composites.html',
    status: 'coming-soon'
  },

  'ops-seismic': {
    id: 'ops-seismic',
    name: 'Seismic Activity',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'noaa',
    description: 'Recent earthquakes from USGS',
    icon: '🌋',
    coverage: 'global',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 2,
    maxZoom: 12,
    sourceUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/',
    documentation: 'https://earthquake.usgs.gov/fdsnws/event/1/',
    status: 'coming-soon'
  },

  'ops-military-bases': {
    id: 'ops-military-bases',
    name: 'Military Facilities',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Military bases and strategic installations',
    icon: '🎖️',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 6,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-undersea-cables': {
    id: 'ops-undersea-cables',
    name: 'Undersea Cables',
    category: 'operations-intelligence',
    type: 'vector',
    dataSource: 'custom',
    description: 'Submarine telecommunications cables',
    icon: '🔌',
    coverage: 'global',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 2,
    maxZoom: 10,
    sourceUrl: 'https://www.submarinecablemap.com/',
    status: 'coming-soon'
  },

  'ops-cell-towers': {
    id: 'ops-cell-towers',
    name: 'Cell Towers',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Cellular network infrastructure',
    icon: '📱',
    coverage: 'regional',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 10,
    maxZoom: 16,
    status: 'requires-setup'
  },

  'ops-wind-farms': {
    id: 'ops-wind-farms',
    name: 'Wind Farms',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Offshore and onshore wind energy installations',
    icon: '💨',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 6,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-oil-platforms': {
    id: 'ops-oil-platforms',
    name: 'Oil & Gas Platforms',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Offshore drilling platforms and production facilities',
    icon: '🛢️',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 6,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-railways': {
    id: 'ops-railways',
    name: 'Railway Networks',
    category: 'operations-intelligence',
    type: 'vector',
    dataSource: 'custom',
    description: 'Rail infrastructure for multimodal transport',
    icon: '🚂',
    coverage: 'global',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.8,
    minZoom: 6,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-airports-major': {
    id: 'ops-airports-major',
    name: 'Major Airports',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'International airports and cargo hubs',
    icon: '✈️',
    coverage: 'global',
    updateFrequency: 'quarterly',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 4,
    maxZoom: 14,
    status: 'requires-setup'
  },

  'ops-air-quality': {
    id: 'ops-air-quality',
    name: 'Air Quality (PM2.5)',
    category: 'operations-intelligence',
    type: 'heatmap',
    dataSource: 'noaa',
    description: 'Air pollution and particulate matter levels',
    icon: '😷',
    coverage: 'global',
    updateFrequency: 'hourly',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 4,
    maxZoom: 10,
    status: 'coming-soon'
  },

  // Investigation Intelligence Layers (Pattern-of-Life Analysis)
  'intel-movement-path': {
    id: 'intel-movement-path',
    name: 'Movement Path',
    category: 'operations-intelligence',
    type: 'vector',
    dataSource: 'custom',
    description: 'Subject movement routes with temporal analysis (authorized investigations only)',
    icon: '🛤️',
    coverage: 'us-only',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: true,
    defaultOpacity: 0.9,
    minZoom: 10,
    maxZoom: 18,
    status: 'requires-setup'
  },

  'intel-location-markers': {
    id: 'intel-location-markers',
    name: 'Location Markers',
    category: 'operations-intelligence',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Key locations with dwell time analysis (authorized investigations only)',
    icon: '📍',
    coverage: 'us-only',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: true,
    defaultOpacity: 1.0,
    minZoom: 10,
    maxZoom: 18,
    status: 'requires-setup'
  },

  'intel-frequency-heatmap': {
    id: 'intel-frequency-heatmap',
    name: 'Frequency Heatmap',
    category: 'operations-intelligence',
    type: 'heatmap',
    dataSource: 'custom',
    description: 'Location frequency analysis for pattern detection (authorized investigations only)',
    icon: '🔥',
    coverage: 'us-only',
    updateFrequency: 'real-time',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 8,
    maxZoom: 16,
    status: 'requires-setup'
  },

  // Additional Maritime Layers
  'maritime-fishing-zones': {
    id: 'maritime-fishing-zones',
    name: 'Fishing Zones & Quotas',
    category: 'maritime',
    type: 'vector',
    dataSource: 'custom',
    description: 'Fishing zones, quotas, and restricted areas',
    icon: '🎣',
    coverage: 'global',
    updateFrequency: 'annual',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.6,
    minZoom: 4,
    maxZoom: 10,
    status: 'requires-setup'
  },

  'maritime-piracy-risk': {
    id: 'maritime-piracy-risk',
    name: 'Piracy Risk Zones',
    category: 'maritime',
    type: 'heatmap',
    dataSource: 'custom',
    description: 'High-risk areas for maritime piracy',
    icon: '🏴‍☠️',
    coverage: 'global',
    updateFrequency: 'monthly',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 4,
    maxZoom: 10,
    status: 'requires-setup'
  },

  'maritime-choke-points': {
    id: 'maritime-choke-points',
    name: 'Strategic Choke Points',
    category: 'maritime',
    type: 'symbol',
    dataSource: 'custom',
    description: 'Strategic maritime passages (Suez, Panama, Malacca, etc.)',
    icon: '🌐',
    coverage: 'global',
    updateFrequency: 'static',
    requiresApiKey: false,
    requiresGeneration: true,
    defaultVisible: false,
    defaultOpacity: 1.0,
    minZoom: 4,
    maxZoom: 12,
    status: 'requires-setup'
  },

  'maritime-ice-cover': {
    id: 'maritime-ice-cover',
    name: 'Sea Ice Coverage',
    category: 'maritime',
    type: 'raster',
    dataSource: 'noaa',
    description: 'Arctic and Antarctic sea ice extent',
    icon: '🧊',
    coverage: 'regional',
    updateFrequency: 'daily',
    resolution: '1km',
    requiresApiKey: false,
    requiresGeneration: false,
    defaultVisible: false,
    defaultOpacity: 0.7,
    minZoom: 2,
    maxZoom: 10,
    sourceUrl: 'https://nsidc.org/data/seaice_index',
    status: 'coming-soon'
  }
}

/**
 * Helper functions
 */

export function getLayersByCategory(category: LayerCategory): LayerDefinition[] {
  return Object.values(LAYER_CATALOG).filter(layer => layer.category === category)
}

export function getAvailableLayers(): LayerDefinition[] {
  return Object.values(LAYER_CATALOG).filter(layer => layer.status === 'available')
}

export function getLayerById(id: string): LayerDefinition | undefined {
  return LAYER_CATALOG[id]
}

export function searchLayers(query: string): LayerDefinition[] {
  const lowerQuery = query.toLowerCase()
  return Object.values(LAYER_CATALOG).filter(layer =>
    layer.name.toLowerCase().includes(lowerQuery) ||
    layer.description.toLowerCase().includes(lowerQuery) ||
    layer.category.includes(lowerQuery)
  )
}
