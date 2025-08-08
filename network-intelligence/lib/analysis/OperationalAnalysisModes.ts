/**
 * Operational Analysis Modes
 * 
 * Reality-based visualization modes that show actual operational conditions
 * instead of abstract grid representations
 */

export interface AnalysisMode {
  id: string
  name: string
  description: string
  icon: string
  layers: string[]
  dataRequirements: string[]
  colorScheme: any
  metrics: string[]
}

export const OperationalAnalysisModes: Record<string, AnalysisMode> = {
  
  'coverage': {
    id: 'coverage',
    name: 'Coverage Analysis',
    description: 'Actual satellite visibility, signal quality, and coverage gaps',
    icon: 'fa-satellite-dish',
    layers: [
      'coverage-footprints',      // Real satellite footprints
      'station-coverage-radius',  // Effective operational range
      'coverage-gaps',            // Areas with no coverage
      'ground-stations'           // Station points
    ],
    dataRequirements: [
      'satellite-tle',
      'station-locations',
      'elevation-data'
    ],
    colorScheme: {
      excellent: [34, 197, 94, 200],   // Green
      good: [59, 130, 246, 200],       // Blue
      poor: [255, 100, 100, 200],      // Red
      gap: [255, 200, 0, 200]          // Orange
    },
    metrics: [
      'coverage_percentage',
      'signal_quality',
      'visibility_hours',
      'elevation_angle'
    ]
  },
  
  'maritime': {
    id: 'maritime',
    name: 'Maritime Operations',
    description: 'Vessel density, shipping lanes, and maritime coverage opportunities',
    icon: 'fa-ship',
    layers: [
      'maritime-heatmap',         // Kernel density of vessels
      'shipping-flows',           // Major shipping corridors
      'station-coverage-radius',  // Station maritime reach
      'ground-stations',          // Station points
      'port-markers'             // Major port locations
    ],
    dataRequirements: [
      'ais-vessel-data',
      'shipping-routes',
      'port-locations',
      'maritime-traffic-stats'
    ],
    colorScheme: {
      highDensity: [0, 200, 255, 255],
      mediumDensity: [0, 150, 200, 178],
      lowDensity: [0, 100, 150, 128],
      noTraffic: [25, 25, 35, 0]
    },
    metrics: [
      'vessels_in_coverage',
      'route_coverage_percentage',
      'monthly_maritime_value',
      'uncovered_vessels'
    ]
  },
  
  'competition': {
    id: 'competition',
    name: 'Competitive Landscape',
    description: 'Service areas, market overlap, and competitive positioning',
    icon: 'fa-chess',
    layers: [
      'competition-zones',        // Voronoi service areas
      'ground-stations',         // All operator stations
      'overlap-indicators',      // Areas with multiple operators
      'market-share-contours'    // Market dominance visualization
    ],
    dataRequirements: [
      'competitor-stations',
      'service-contracts',
      'market-share-data'
    ],
    colorScheme: {
      ses: [34, 197, 94, 150],
      intelsat: [255, 100, 100, 150],
      eutelsat: [100, 100, 255, 150],
      viasat: [255, 200, 0, 150],
      other: [150, 150, 150, 150]
    },
    metrics: [
      'market_share',
      'competitive_overlap',
      'exclusive_coverage_area',
      'competitive_advantage_score'
    ]
  },
  
  'opportunity': {
    id: 'opportunity',
    name: 'Opportunity Identification',
    description: 'Scored opportunities based on all operational factors',
    icon: 'fa-lightbulb',
    layers: [
      'opportunity-contours',     // Continuous opportunity surface
      'opportunity-markers',      // High-value specific locations
      'ground-stations',         // Existing infrastructure
      'proposed-stations'        // Potential new locations
    ],
    dataRequirements: [
      'opportunity-scores',
      'market-analysis',
      'coverage-analysis',
      'competition-analysis'
    ],
    colorScheme: {
      veryHigh: [34, 197, 94, 200],
      high: [251, 191, 36, 150],
      medium: [59, 130, 246, 100],
      low: [100, 100, 120, 50]
    },
    metrics: [
      'opportunity_score',
      'revenue_potential',
      'roi_estimate',
      'implementation_cost'
    ]
  },
  
  'financial': {
    id: 'financial',
    name: 'Financial Performance',
    description: 'Revenue generation, profitability, and financial metrics',
    icon: 'fa-dollar-sign',
    layers: [
      'revenue-heatmap',         // Revenue density map
      'ground-stations',         // Sized by revenue
      'profitable-routes',       // High-margin connections
      'investment-zones'         // Areas needing investment
    ],
    dataRequirements: [
      'station-revenue',
      'operating-costs',
      'service-contracts',
      'pricing-data'
    ],
    colorScheme: {
      highProfit: [0, 255, 0, 200],
      profitable: [100, 200, 100, 150],
      breakeven: [255, 255, 0, 150],
      loss: [255, 0, 0, 200]
    },
    metrics: [
      'total_revenue',
      'profit_margin',
      'revenue_per_station',
      'cost_per_coverage_km2'
    ]
  },
  
  'technical': {
    id: 'technical',
    name: 'Technical Performance',
    description: 'Signal quality, bandwidth utilization, and technical metrics',
    icon: 'fa-signal',
    layers: [
      'signal-quality-contours',  // EIRP and G/T contours
      'interference-zones',       // Areas with interference
      'ground-stations',         // With technical specs
      'bandwidth-utilization'    // Spectrum usage
    ],
    dataRequirements: [
      'link-budgets',
      'antenna-specs',
      'frequency-plans',
      'interference-reports'
    ],
    colorScheme: {
      excellent: [0, 255, 0, 200],
      good: [0, 200, 255, 150],
      acceptable: [255, 255, 0, 150],
      poor: [255, 100, 0, 200],
      unusable: [255, 0, 0, 255]
    },
    metrics: [
      'average_eirp',
      'g_t_ratio',
      'bandwidth_utilization',
      'interference_level'
    ]
  }
}

/**
 * Get layers for a specific analysis mode
 */
export function getAnalysisLayers(modeId: string): string[] {
  const mode = OperationalAnalysisModes[modeId]
  return mode ? mode.layers : []
}

/**
 * Get required data sources for an analysis mode
 */
export function getRequiredData(modeId: string): string[] {
  const mode = OperationalAnalysisModes[modeId]
  return mode ? mode.dataRequirements : []
}

/**
 * Get color scheme for visualization
 */
export function getColorScheme(modeId: string): any {
  const mode = OperationalAnalysisModes[modeId]
  return mode ? mode.colorScheme : {}
}

/**
 * Check if all required data is available for a mode
 */
export function isDataAvailable(modeId: string, availableData: string[]): boolean {
  const required = getRequiredData(modeId)
  return required.every(req => availableData.includes(req))
}

/**
 * Get recommended analysis mode based on available data
 */
export function getRecommendedMode(availableData: string[]): string {
  // Priority order of modes
  const priorityOrder = ['opportunity', 'maritime', 'coverage', 'competition', 'financial', 'technical']
  
  for (const modeId of priorityOrder) {
    if (isDataAvailable(modeId, availableData)) {
      return modeId
    }
  }
  
  // Default to coverage if no complete data
  return 'coverage'
}

export default OperationalAnalysisModes