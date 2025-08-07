import { H3HexagonLayer } from '@deck.gl/geo-layers'
import { h3GridService, type H3HexagonOpportunity, generateGroundStationOpportunities } from '@/lib/services/h3GridService'

interface H3OpportunityLayerProps {
  /** Whether to show the H3 hexagon layer */
  visible: boolean
  /** Display mode for the hexagons */
  mode: 'opportunities' | 'revenue' | 'competition' | 'risk'
  /** H3 resolution levels to display (4-7) */
  resolutions?: number[]
  /** Maximum number of opportunities to display */
  maxOpportunities?: number
  /** Callback when hexagon is clicked */
  onHexagonClick?: (opportunity: H3HexagonOpportunity) => void
  /** Callback when hexagon is hovered */
  onHexagonHover?: (opportunity: H3HexagonOpportunity | null, coords?: { x: number; y: number }) => void
}

// Cache for generated opportunities to avoid regeneration on every render
let cachedOpportunities: ReturnType<typeof generateGroundStationOpportunities> | null = null
let cachedParams: string | null = null

export const createH3OpportunityLayer = ({
  visible,
  mode,
  resolutions = [5, 6],
  maxOpportunities = 500,
  onHexagonClick,
  onHexagonHover
}: H3OpportunityLayerProps) => {
  if (!visible) {
    return null
  }

  // Generate cache key
  const cacheKey = `${resolutions.join(',')}-${maxOpportunities}`
  
  // Generate H3 opportunity data (use cache if params haven't changed)
  if (cacheKey !== cachedParams || !cachedOpportunities) {
    console.log('Generating H3 opportunities...')
    cachedOpportunities = generateGroundStationOpportunities({
      resolutions,
      maxOpportunities,
      globalAnalysis: true
    })
    cachedParams = cacheKey
  }

  const { topOpportunities } = cachedOpportunities

  // Create layer data from top opportunities
  const layerData = topOpportunities.filter(opp => 
    // Only show opportunities with significant land coverage
    opp.landCoverage >= 75 && 
    // Filter out very low scores to reduce clutter
    opp.overallScore >= 40
  )
  
  console.log(`H3 Layer: Displaying ${layerData.length} opportunities`)

  if (layerData.length === 0) {
    return null
  }

  // Color function based on mode
  const getHexagonColor = (opportunity: H3HexagonOpportunity): [number, number, number, number] => {
    switch (mode) {
      case 'opportunities':
        // Color by overall opportunity score
        if (opportunity.overallScore >= 80) return [34, 197, 94, 180] // Green - excellent
        if (opportunity.overallScore >= 70) return [234, 179, 8, 160] // Yellow - good  
        if (opportunity.overallScore >= 60) return [249, 115, 22, 140] // Orange - moderate
        return [239, 68, 68, 120] // Red - poor

      case 'revenue':
        // Color by projected revenue
        const maxRevenue = 5000000 // $5M
        const revenueRatio = opportunity.projectedAnnualRevenue / maxRevenue
        if (revenueRatio >= 0.8) return [16, 185, 129, 180] // Emerald - high revenue
        if (revenueRatio >= 0.6) return [34, 197, 94, 160] // Green - good revenue
        if (revenueRatio >= 0.4) return [234, 179, 8, 140] // Yellow - moderate revenue
        return [239, 68, 68, 120] // Red - low revenue

      case 'competition':
        // Color by competition level (inverse - less competition = better)
        if (opportunity.competitionScore >= 80) return [34, 197, 94, 180] // Green - low competition
        if (opportunity.competitionScore >= 60) return [234, 179, 8, 160] // Yellow - moderate competition
        if (opportunity.competitionScore >= 40) return [249, 115, 22, 140] // Orange - high competition
        return [239, 68, 68, 120] // Red - very high competition

      case 'risk':
        // Color by risk level
        switch (opportunity.riskLevel) {
          case 'low': return [34, 197, 94, 180] // Green
          case 'medium': return [234, 179, 8, 160] // Yellow
          case 'high': return [249, 115, 22, 140] // Orange
          case 'very_high': return [239, 68, 68, 120] // Red
          default: return [156, 163, 175, 120] // Gray
        }

      default:
        return [99, 102, 241, 120] // Default blue
    }
  }

  // Elevation based on score for 3D effect
  const getElevation = (opportunity: H3HexagonOpportunity): number => {
    switch (mode) {
      case 'opportunities':
        return opportunity.overallScore * 200 // Max elevation ~20k meters
      case 'revenue':
        return (opportunity.projectedAnnualRevenue / 5000000) * 15000
      case 'competition':
        return opportunity.competitionScore * 150
      case 'risk':
        // Lower elevation for higher risk
        const riskMultiplier = {
          'low': 1.0,
          'medium': 0.7,
          'high': 0.4,
          'very_high': 0.2
        }[opportunity.riskLevel] || 0.5
        return opportunity.overallScore * 150 * riskMultiplier
      default:
        return opportunity.overallScore * 100
    }
  }

  const layer = new H3HexagonLayer({
    id: 'h3-opportunity-layer',
    data: layerData,
    
    // H3 hexagon properties
    // CRITICAL: Must use 'hexagon' property name for H3HexagonLayer
    getHexagon: (d: H3HexagonOpportunity) => {
      const hexValue = d.hexagon || d.h3Index
      if (!hexValue) {
        console.error('Missing hexagon/h3Index property in:', d)
      }
      return hexValue
    },
    getFillColor: getHexagonColor,
    getLineColor: [255, 255, 255, 80],
    getLineWidth: 2,
    
    // 3D properties
    getElevation,
    elevationScale: 1,
    extruded: true,
    
    // Visual properties
    filled: true,
    stroked: true,
    pickable: true,
    
    // Interaction
    onHover: ({ object, x, y }) => {
      if (onHexagonHover) {
        onHexagonHover(object || null, x !== undefined && y !== undefined ? { x, y } : undefined)
      }
    },
    
    onClick: ({ object }) => {
      if (object && onHexagonClick) {
        onHexagonClick(object)
      }
    },

    // Update triggers
    updateTriggers: {
      getFillColor: mode,
      getElevation: mode,
    },

    // Performance optimizations
    coordinateSystem: 0, // COORDINATE_SYSTEM.LNGLAT
    highlightColor: [255, 255, 255, 100],
  })

  return layer
}

// For backward compatibility
export const H3OpportunityLayer = createH3OpportunityLayer
export default createH3OpportunityLayer