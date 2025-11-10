/**
 * Cell Tower Layer Service (SIGINT)
 * Visualizes telecommunications infrastructure for intelligence analysis
 *
 * Features:
 * - Cell tower locations with operator information
 * - Coverage range visualization
 * - SIGINT correlation capabilities
 * - Timeline event integration
 */

import mapboxgl from 'mapbox-gl'

export interface CellTowerFeature {
  id: string
  intel_category: 'SIGINT'
  intel_type: 'Communications Infrastructure'
  operator: string
  radio: 'LTE' | '5G' | 'UMTS' | 'GSM'
  mcc: string
  mnc: string
  range_meters: number
  coverage_area_sqkm: number
  samples: number
  significance_score: number
  surveillance_notes: string
  color: string
  longitude: number
  latitude: number
}

export interface CellTowerCorrelation {
  tower_id: string
  operator: string
  radio: string
  range_meters: number
  distance_meters: number
  signal_strength_estimate: 'strong' | 'medium' | 'weak'
  timestamp: string
}

export class CellTowerLayerService {
  private isInitialized = false
  private map: mapboxgl.Map | null = null
  private showCoverageRanges = false
  private showByOperator = true
  private visibleOperators: Set<string> = new Set(['Verizon', 'AT&T', 'T-Mobile', 'Sprint'])

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('✅ Cell Tower SIGINT service initialized')
    this.isInitialized = true
  }

  /**
   * Add cell tower layers to map
   */
  async addToMap(map: mapboxgl.Map): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.map = map

    try {
      // Add vector tile source using HTTP API endpoint
      const tileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/tiles/cell-towers/{z}/{x}/{y}.pbf`
        : '/api/tiles/cell-towers/{z}/{x}/{y}.pbf'

      map.addSource('cell-towers', {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 8,
        maxzoom: 16
      })

      // Add layers
      this.addCoverageRangeLayer(map)
      this.addTowerPointLayers(map)

      console.log('✅ Cell Tower SIGINT layers added to map')
    } catch (error) {
      console.error('❌ Failed to add Cell Tower layers:', error)
      throw error
    }
  }

  /**
   * Add coverage range circles (optional visualization)
   */
  private addCoverageRangeLayer(map: mapboxgl.Map): void {
    map.addLayer({
      id: 'cell-tower-coverage',
      type: 'circle',
      source: 'cell-towers',
      'source-layer': 'cell-towers',
      minzoom: 12, // Only show at street level
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, ['/', ['get', 'range_meters'], 50],
          16, ['/', ['get', 'range_meters'], 10]
        ],
        'circle-color': [
          'match',
          ['get', 'operator'],
          'Verizon', '#EE0000',
          'AT&T', '#0099FF',
          'T-Mobile', '#E20074',
          'Sprint', '#FFD400',
          '#888888'
        ],
        'circle-opacity': 0.1,
        'circle-stroke-width': 1,
        'circle-stroke-color': [
          'match',
          ['get', 'operator'],
          'Verizon', '#EE0000',
          'AT&T', '#0099FF',
          'T-Mobile', '#E20074',
          'Sprint', '#FFD400',
          '#888888'
        ],
        'circle-stroke-opacity': 0.3
      },
      layout: {
        visibility: this.showCoverageRanges ? 'visible' : 'none'
      }
    })
  }

  /**
   * Add cell tower point markers
   */
  private addTowerPointLayers(map: mapboxgl.Map): void {
    // Layer 1: All towers (small circles)
    map.addLayer({
      id: 'cell-towers-points',
      type: 'circle',
      source: 'cell-towers',
      'source-layer': 'cell-towers',
      minzoom: 8,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 3,
          12, 6,
          16, 10
        ],
        'circle-color': [
          'match',
          ['get', 'operator'],
          'Verizon', '#EE0000',
          'AT&T', '#0099FF',
          'T-Mobile', '#E20074',
          'Sprint', '#FFD400',
          '#888888'
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    })

    // Layer 2: Tower labels (at high zoom)
    map.addLayer({
      id: 'cell-towers-labels',
      type: 'symbol',
      source: 'cell-towers',
      'source-layer': 'cell-towers',
      minzoom: 14,
      layout: {
        'text-field': [
          'format',
          ['get', 'operator'], { 'font-scale': 0.9 },
          '\n', {},
          ['get', 'radio'], { 'font-scale': 0.7 }
        ],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-optional': true
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
        'text-halo-blur': 1
      }
    })
  }

  /**
   * Toggle coverage range visualization
   */
  toggleCoverageRanges(show: boolean): void {
    if (!this.map) return

    this.showCoverageRanges = show
    this.map.setLayoutProperty(
      'cell-tower-coverage',
      'visibility',
      show ? 'visible' : 'none'
    )

    console.log(`📡 Cell tower coverage ranges: ${show ? 'ON' : 'OFF'}`)
  }

  /**
   * Filter towers by operator
   */
  setVisibleOperators(operators: string[]): void {
    if (!this.map) return

    this.visibleOperators = new Set(operators)

    // Update filter for all layers
    const filter = operators.length > 0
      ? ['in', ['get', 'operator'], ['literal', operators]]
      : ['==', ['get', 'operator'], ''] // Hide all if empty

    this.map.setFilter('cell-towers-points', filter)
    this.map.setFilter('cell-towers-labels', filter)
    this.map.setFilter('cell-tower-coverage', filter)

    console.log(`📡 Visible operators:`, operators)
  }

  /**
   * Find nearby cell towers for a location (SIGINT correlation)
   */
  async findNearbyTowers(
    longitude: number,
    latitude: number,
    radiusMeters: number = 5000
  ): Promise<CellTowerCorrelation[]> {
    if (!this.map) return []

    try {
      // Query rendered features near the location
      const point = this.map.project([longitude, latitude])
      const features = this.map.queryRenderedFeatures(
        [
          [point.x - 50, point.y - 50],
          [point.x + 50, point.y + 50]
        ],
        {
          layers: ['cell-towers-points']
        }
      )

      const correlations: CellTowerCorrelation[] = []

      for (const feature of features) {
        if (feature.geometry.type !== 'Point') continue

        const props = feature.properties
        const [towerLng, towerLat] = feature.geometry.coordinates

        // Calculate distance (simplified Haversine)
        const distance = this.calculateDistance(latitude, longitude, towerLat, towerLng)

        if (distance <= radiusMeters) {
          // Estimate signal strength based on distance and tower range
          const tower_range = props.range_meters || 2000
          let signal_strength: 'strong' | 'medium' | 'weak'

          if (distance <= tower_range * 0.3) {
            signal_strength = 'strong'
          } else if (distance <= tower_range * 0.7) {
            signal_strength = 'medium'
          } else {
            signal_strength = 'weak'
          }

          correlations.push({
            tower_id: props.id,
            operator: props.operator,
            radio: props.radio,
            range_meters: props.range_meters,
            distance_meters: Math.round(distance),
            signal_strength_estimate: signal_strength,
            timestamp: new Date().toISOString()
          })
        }
      }

      // Sort by distance (closest first)
      correlations.sort((a, b) => a.distance_meters - b.distance_meters)

      return correlations
    } catch (error) {
      console.error('❌ Failed to find nearby towers:', error)
      return []
    }
  }

  /**
   * Calculate distance between two points (meters)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Generate SIGINT intelligence summary for a location
   */
  async generateSigintSummary(
    longitude: number,
    latitude: number,
    timestamp?: string
  ): Promise<string> {
    const towers = await this.findNearbyTowers(longitude, latitude, 5000)

    if (towers.length === 0) {
      return 'No cell towers detected within 5km radius. Limited SIGINT coverage.'
    }

    const primary = towers[0]
    const summary = `
**SIGINT ANALYSIS**

**Primary Cell Tower:**
- Operator: ${primary.operator}
- Technology: ${primary.radio}
- Distance: ${primary.distance_meters}m
- Signal Strength: ${primary.signal_strength_estimate.toUpperCase()}
- Coverage Range: ${primary.range_meters}m

**Additional Towers in Range:** ${towers.length - 1}

**Intelligence Notes:**
- Subject's device would ping Tower ID: ${primary.tower_id}
- ${primary.operator} ${primary.radio} network active
- Signal correlation: ${primary.signal_strength_estimate === 'strong' ? 'Confirmed indoor/stationary presence' : primary.signal_strength_estimate === 'medium' ? 'Likely in vicinity' : 'Edge of coverage area'}

${towers.length > 1 ? `
**Alternate Towers:**
${towers.slice(1, 4).map(t => `- ${t.operator} (${t.radio}): ${t.distance_meters}m away`).join('\n')}
` : ''}

**Recommendation:** ${primary.signal_strength_estimate === 'strong' ? 'Request FISA warrant for tower dump data.' : 'Monitor for sustained presence before requesting warrant.'}
    `.trim()

    return summary
  }

  /**
   * Highlight a specific cell tower
   */
  highlightTower(towerId: string): void {
    if (!this.map) return

    // Add a highlight layer
    if (!this.map.getLayer('cell-tower-highlight')) {
      this.map.addLayer({
        id: 'cell-tower-highlight',
        type: 'circle',
        source: 'cell-towers',
        'source-layer': 'cell-towers',
        filter: ['==', ['get', 'id'], towerId],
        paint: {
          'circle-radius': 20,
          'circle-color': '#FF0000',
          'circle-opacity': 0,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#FF0000',
          'circle-stroke-opacity': 1
        }
      })
    } else {
      this.map.setFilter('cell-tower-highlight', ['==', ['get', 'id'], towerId])
    }
  }

  /**
   * Remove tower highlight
   */
  clearHighlight(): void {
    if (!this.map) return

    if (this.map.getLayer('cell-tower-highlight')) {
      this.map.removeLayer('cell-tower-highlight')
    }
  }

  /**
   * Remove layers from map
   */
  removeFromMap(): void {
    if (!this.map) return

    const layers = [
      'cell-tower-coverage',
      'cell-towers-points',
      'cell-towers-labels',
      'cell-tower-highlight'
    ]

    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId)
      }
    })

    if (this.map.getSource('cell-towers')) {
      this.map.removeSource('cell-towers')
    }

    this.map = null
    console.log('✅ Cell Tower SIGINT layers removed from map')
  }
}

// Singleton instance
let cellTowerService: CellTowerLayerService | null = null

export function getCellTowerService(): CellTowerLayerService {
  if (!cellTowerService) {
    cellTowerService = new CellTowerLayerService()
  }
  return cellTowerService
}
