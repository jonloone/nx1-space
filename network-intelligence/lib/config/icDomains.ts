/**
 * IC Domain Configuration
 * Defines Intelligence Community-aligned operational domains
 *
 * Domains represent physical operational environments:
 * - Subsurface: Underground infrastructure, tunnels, utilities
 * - Surface: Terrain, water bodies, vegetation, hydrology
 * - Maritime: Oceans, vessels, ports, shipping lanes
 * - Ground: Buildings, roads, infrastructure, terrestrial operations
 * - Air: Aviation, airspace, airports, flight operations
 * - Space: Satellites, orbits, imagery intelligence
 */

export type ICDomainId = 'subsurface' | 'surface' | 'maritime' | 'ground' | 'air' | 'space'

export type INTType = 'GEOINT' | 'SIGINT' | 'OSINT' | 'IMINT' | 'MASINT' | 'HUMINT' | 'TEMPORAL'

export type DomainStatus = 'available' | 'partial' | 'unavailable'

export type CapabilityLevel = 'strong' | 'moderate' | 'weak' | 'none'

export interface ICDomainCapabilities {
  GEOINT: CapabilityLevel      // Geographic Intelligence
  SIGINT: CapabilityLevel       // Signals Intelligence
  OSINT: CapabilityLevel        // Open Source Intelligence
  IMINT: CapabilityLevel        // Imagery Intelligence
  TEMPORAL: CapabilityLevel     // Pattern-of-life, temporal analysis
}

export interface ICDomain {
  id: ICDomainId
  name: string
  description: string
  icon: string  // Lucide icon name

  // Capability levels for this domain
  capabilities: ICDomainCapabilities

  // Available data layers
  dataLayers: string[]

  // Services that support this domain
  services: string[]

  // Availability status
  status: DomainStatus
  statusMessage?: string

  // Example queries for this domain
  examples: string[]
}

/**
 * IC Domain Definitions
 */
export const IC_DOMAINS: Record<string, ICDomain> = {
  GROUND: {
    id: 'ground',
    name: 'Ground Domain',
    description: 'Surface infrastructure, buildings, roads, facilities, terrestrial operations',
    icon: 'Building2',

    capabilities: {
      GEOINT: 'strong',     // Buildings, roads, addresses, 3D visualization
      SIGINT: 'strong',     // Cell towers, network infrastructure
      OSINT: 'strong',      // Business data, ownership records
      IMINT: 'moderate',    // Satellite overhead imagery
      TEMPORAL: 'strong'    // Pattern-of-life, time-based analysis
    },

    dataLayers: [
      'buildings-3d',
      'buildings-2d',
      'roads',
      'addresses',
      'cell-towers',
      'places',
      'landuse',
      'transportation'
    ],

    services: [
      'routeAnalysisService',
      'cellTowerLayerService',
      'osintEnrichmentService',
      'overturePlacesService',
      'multiIntReportService'
    ],

    status: 'available',

    examples: [
      'Analyze route from Central Park to Times Square',
      'Show cell tower coverage for Manhattan',
      'Find all businesses owned by subject',
      'Route analysis with SIGINT and OSINT layers',
      'Pattern-of-life analysis for Brooklyn'
    ]
  },

  MARITIME: {
    id: 'maritime',
    name: 'Maritime Domain',
    description: 'Oceans, vessels, ports, shipping lanes, maritime operations',
    icon: 'Ship',

    capabilities: {
      GEOINT: 'strong',      // Ports, coastlines, maritime infrastructure
      SIGINT: 'moderate',    // Maritime communications, AIS
      OSINT: 'strong',       // Vessel registrations, port data, ownership
      IMINT: 'strong',       // SAR imagery, ship detection
      TEMPORAL: 'strong'     // Vessel movement patterns, traffic analysis
    },

    dataLayers: [
      'maritime-shipping-lanes',
      'maritime-boundaries',
      'ports',
      'vessel-density-heatmap',
      'ais-tracks'
    ],

    services: [
      'maritimeDataService',
      'maritimeIntelligenceIntegrationService'
    ],

    status: 'available',

    examples: [
      'Show vessel density near Los Angeles port',
      'Analyze shipping lanes in Pacific Ocean',
      'Maritime traffic analysis for last 30 days',
      'Port congestion assessment',
      'Vessel ownership investigation'
    ]
  },

  SPACE: {
    id: 'space',
    name: 'Space Domain',
    description: 'Satellites, orbital mechanics, space-based imagery intelligence',
    icon: 'Satellite',

    capabilities: {
      GEOINT: 'moderate',    // Ground station locations
      SIGINT: 'moderate',    // RF intercept, satellite comms
      OSINT: 'moderate',     // Orbital data (TLEs), launch schedules
      IMINT: 'strong',       // Primary domain for satellite imagery
      TEMPORAL: 'strong'     // Orbital passes, revisit times, change detection
    },

    dataLayers: [
      'satellite-imagery',
      'sentinel-2',
      'landsat-8',
      'orbit-tracks',
      'ground-stations',
      'coverage-footprints'
    ],

    services: [
      'satelliteImageryService',
      'imageryAnalysisService',
      'googleEarthEngineService'
    ],

    status: 'partial',
    statusMessage: 'Imagery available, orbital tracking limited',

    examples: [
      'Analyze satellite imagery for Buenos Aires',
      'Change detection analysis over last 90 days',
      'Multi-spectral imagery analysis',
      'Activity monitoring at location',
      'Time-series imagery comparison'
    ]
  },

  SURFACE: {
    id: 'surface',
    name: 'Surface Level',
    description: 'Terrain, water bodies, vegetation, hydrology, surface conditions',
    icon: 'Mountain',

    capabilities: {
      GEOINT: 'moderate',    // Terrain data, elevation
      SIGINT: 'none',        // Not applicable
      OSINT: 'weak',         // Limited surface-specific OSINT
      IMINT: 'strong',       // Satellite imagery of surface features
      TEMPORAL: 'moderate'   // Vegetation changes, water levels
    },

    dataLayers: [
      'terrain-elevation',
      'water-bodies',
      'vegetation-cover',
      'land-use',
      'hydrology'
    ],

    services: [
      'imageryAnalysisService',
      'googleEarthEngineService'
    ],

    status: 'partial',
    statusMessage: 'Terrain available, dedicated analysis limited',

    examples: [
      'Terrain elevation analysis',
      'Water body identification',
      'Vegetation cover assessment',
      'Hydrology and drainage analysis',
      'Land use classification'
    ]
  },

  AIR: {
    id: 'air',
    name: 'Air Domain',
    description: 'Aviation, airspace, airports, flight operations',
    icon: 'Plane',

    capabilities: {
      GEOINT: 'moderate',    // Airport locations, airspace boundaries
      SIGINT: 'weak',        // ADS-B tracking (not implemented)
      OSINT: 'moderate',     // Flight schedules, airline data
      IMINT: 'weak',         // Limited aircraft detection
      TEMPORAL: 'weak'       // Flight patterns (not implemented)
    },

    dataLayers: [
      'airports',
      'airspace-boundaries',
      'flight-tracks'
    ],

    services: [],

    status: 'unavailable',
    statusMessage: 'Airport locations only, no flight tracking',

    examples: [
      'Show major airports in region',
      'Airspace boundary analysis',
      'Flight tracking (not available)',
      'Aviation weather (not available)',
      'Air traffic patterns (not available)'
    ]
  },

  SUBSURFACE: {
    id: 'subsurface',
    name: 'Subsurface Domain',
    description: 'Underground infrastructure, tunnels, utilities, geological features',
    icon: 'ArrowDownToLine',

    capabilities: {
      GEOINT: 'none',        // No underground mapping
      SIGINT: 'none',        // No underground SIGINT
      OSINT: 'none',         // Limited utility records
      IMINT: 'none',         // Cannot image underground
      TEMPORAL: 'none'       // No subsurface temporal data
    },

    dataLayers: [],

    services: [],

    status: 'unavailable',
    statusMessage: 'No subsurface capabilities implemented',

    examples: [
      'Subway/metro network analysis (not available)',
      'Underground utilities mapping (not available)',
      'Tunnel system analysis (not available)',
      'Underground facilities (not available)',
      'Geological data (not available)'
    ]
  }
}

/**
 * Get domain by ID
 */
export function getICDomain(domainId: ICDomainId): ICDomain | null {
  return IC_DOMAINS[domainId.toUpperCase()] || null
}

/**
 * Get all IC domains
 */
export function getAllICDomains(): ICDomain[] {
  return Object.values(IC_DOMAINS)
}

/**
 * Get available domains (status = 'available')
 */
export function getAvailableICDomains(): ICDomain[] {
  return Object.values(IC_DOMAINS).filter(domain => domain.status === 'available')
}

/**
 * Get domains by status
 */
export function getICDomainsByStatus(status: DomainStatus): ICDomain[] {
  return Object.values(IC_DOMAINS).filter(domain => domain.status === status)
}

/**
 * Get domains supporting specific INT type at specified capability level or higher
 */
export function getICDomainsByCapability(
  intType: keyof ICDomainCapabilities,
  minLevel: CapabilityLevel = 'moderate'
): ICDomain[] {
  const levelOrder: CapabilityLevel[] = ['none', 'weak', 'moderate', 'strong']
  const minLevelIndex = levelOrder.indexOf(minLevel)

  return Object.values(IC_DOMAINS).filter(domain => {
    const domainLevel = domain.capabilities[intType]
    const domainLevelIndex = levelOrder.indexOf(domainLevel)
    return domainLevelIndex >= minLevelIndex
  })
}

/**
 * Get primary INT types for a domain (capability level = 'strong')
 */
export function getPrimaryINTTypes(domainId: ICDomainId): INTType[] {
  const domain = getICDomain(domainId)
  if (!domain) return []

  return (Object.entries(domain.capabilities) as [INTType, CapabilityLevel][])
    .filter(([, level]) => level === 'strong')
    .map(([intType]) => intType)
}
