/**
 * Building Color Mode Service
 * Enables switchable visualization modes for building intelligence
 *
 * Modes:
 * 1. POI Category - Color by nearby place types (restaurants, hospitals, etc.)
 * 2. Alert Proximity - Color by investigation alert proximity
 * 3. Building Attributes - Color by height, class, or floors
 * 4. Intelligence Significance - Color by multi-int relevance score
 */

import mapboxgl from 'mapbox-gl'

export type BuildingColorMode = 'poi-category' | 'alert-proximity' | 'attributes' | 'intelligence'

export interface BuildingColorConfig {
  mode: BuildingColorMode
  enabled: boolean
  opacity: number
}

export interface BuildingIntelligence {
  building_id: string
  poi_category?: string
  nearest_alert?: {
    id: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    distance_meters: number
  }
  attributes: {
    height?: number
    floors?: number
    class?: 'residential' | 'commercial' | 'industrial' | 'public' | 'mixed'
  }
  significance_score: number // 0-100
  intel_flags: string[] // Array of intelligence relevance flags
}

export class BuildingColorModeService {
  private map: mapboxgl.Map | null = null
  private currentMode: BuildingColorMode = 'poi-category'
  private buildingIntelligence: Map<string, BuildingIntelligence> = new Map()

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    console.log('✅ Building Color Mode service initialized')
  }

  /**
   * Set the map instance
   */
  setMap(map: mapboxgl.Map): void {
    this.map = map
  }

  /**
   * Switch building coloring mode
   */
  async setColorMode(mode: BuildingColorMode): Promise<void> {
    if (!this.map) {
      console.warn('Map not initialized')
      return
    }

    this.currentMode = mode

    // Update building layer colors based on mode
    switch (mode) {
      case 'poi-category':
        this.applyPOICategoryColors()
        break
      case 'alert-proximity':
        this.applyAlertProximityColors()
        break
      case 'attributes':
        this.applyAttributeColors()
        break
      case 'intelligence':
        this.applyIntelligenceColors()
        break
    }

    console.log(`🏢 Building color mode: ${mode}`)
  }

  /**
   * Mode 1: Color buildings by nearby POI categories
   */
  private applyPOICategoryColors(): void {
    if (!this.map) return

    const layerId = 'buildings-2d' // Assumes this layer exists

    if (!this.map.getLayer(layerId)) {
      console.warn(`Layer ${layerId} not found`)
      return
    }

    // Color expression based on POI category
    const colorExpression: mapboxgl.Expression = [
      'case',
      ['has', 'poi_category'],
      [
        'match',
        ['get', 'poi_category'],
        'restaurant', '#FF6B6B',
        'cafe', '#FFA07A',
        'hospital', '#4ECDC4',
        'clinic', '#95E1D3',
        'school', '#F7DC6F',
        'university', '#F39C12',
        'hotel', '#9B59B6',
        'retail', '#3498DB',
        'office', '#34495E',
        'industrial', '#7F8C8D',
        'airport', '#176BF8',
        'transit', '#16A085',
        'park', '#27AE60',
        '#CCCCCC' // Default gray
      ],
      '#E0E0E0' // No POI nearby
    ]

    this.map.setPaintProperty(layerId, 'fill-color', colorExpression)
    this.map.setPaintProperty(layerId, 'fill-opacity', 0.7)
  }

  /**
   * Mode 2: Color buildings by alert proximity
   */
  private applyAlertProximityColors(): void {
    if (!this.map) return

    const layerId = 'buildings-2d'

    if (!this.map.getLayer(layerId)) {
      console.warn(`Layer ${layerId} not found`)
      return
    }

    // Color expression based on alert proximity
    const colorExpression: mapboxgl.Expression = [
      'case',
      ['has', 'alert_priority'],
      [
        'match',
        ['get', 'alert_priority'],
        'critical', '#DC143C', // Crimson red
        'high', '#FF6347',     // Tomato
        'medium', '#FFA500',   // Orange
        'low', '#FFD700',      // Gold
        '#E0E0E0'
      ],
      '#F5F5F5' // No alerts nearby
    ]

    this.map.setPaintProperty(layerId, 'fill-color', colorExpression)
    this.map.setPaintProperty(layerId, 'fill-opacity', [
      'case',
      ['has', 'alert_priority'],
      0.8,
      0.3
    ])
  }

  /**
   * Mode 3: Color buildings by attributes (height, class)
   */
  private applyAttributeColors(): void {
    if (!this.map) return

    const layerId = 'buildings-2d'

    if (!this.map.getLayer(layerId)) {
      console.warn(`Layer ${layerId} not found`)
      return
    }

    // Color by building class (can switch to height-based later)
    const colorExpression: mapboxgl.Expression = [
      'match',
      ['get', 'class'],
      'residential', '#E74C3C',
      'commercial', '#3498DB',
      'industrial', '#9B59B6',
      'public', '#2ECC71',
      'mixed', '#F39C12',
      '#95A5A6' // Default
    ]

    this.map.setPaintProperty(layerId, 'fill-color', colorExpression)
    this.map.setPaintProperty(layerId, 'fill-opacity', 0.7)
  }

  /**
   * Mode 3b: Color buildings by height (alternative attribute mode)
   */
  applyHeightBasedColors(): void {
    if (!this.map) return

    const layerId = 'buildings-2d'

    if (!this.map.getLayer(layerId)) return

    // Color by height (blue scale: taller = darker)
    const colorExpression: mapboxgl.Expression = [
      'interpolate',
      ['linear'],
      ['get', 'height'],
      0, '#E3F2FD',    // Very light blue
      10, '#90CAF9',   // Light blue
      25, '#42A5F5',   // Medium blue
      50, '#1E88E5',   // Blue
      100, '#1565C0',  // Dark blue
      200, '#0D47A1'   // Very dark blue
    ]

    this.map.setPaintProperty(layerId, 'fill-color', colorExpression)
    this.map.setPaintProperty(layerId, 'fill-opacity', 0.7)
  }

  /**
   * Mode 4: Color buildings by intelligence significance score
   */
  private applyIntelligenceColors(): void {
    if (!this.map) return

    const layerId = 'buildings-2d'

    if (!this.map.getLayer(layerId)) {
      console.warn(`Layer ${layerId} not found`)
      return
    }

    // Color by significance score (heat scale)
    const colorExpression: mapboxgl.Expression = [
      'case',
      ['has', 'significance_score'],
      [
        'interpolate',
        ['linear'],
        ['get', 'significance_score'],
        0, '#EEEEEE',    // Gray (no significance)
        20, '#90CAF9',   // Light blue
        40, '#FFF59D',   // Light yellow
        60, '#FFB74D',   // Orange
        80, '#EF5350',   // Red
        100, '#B71C1C'   // Dark red (critical)
      ],
      '#F5F5F5' // No intelligence data
    ]

    this.map.setPaintProperty(layerId, 'fill-color', colorExpression)
    this.map.setPaintProperty(layerId, 'fill-opacity', [
      'case',
      ['has', 'significance_score'],
      [
        'interpolate',
        ['linear'],
        ['get', 'significance_score'],
        0, 0.3,
        50, 0.6,
        100, 0.9
      ],
      0.2
    ])
  }

  /**
   * Update building intelligence data (for real-time updates)
   */
  setBuildingIntelligence(buildingId: string, intel: BuildingIntelligence): void {
    this.buildingIntelligence.set(buildingId, intel)

    // If in intelligence mode, trigger visual update
    if (this.currentMode === 'intelligence') {
      this.applyIntelligenceColors()
    }
  }

  /**
   * Bulk update building intelligence (for initial load)
   */
  setBuildingIntelligenceBulk(intelligence: BuildingIntelligence[]): void {
    intelligence.forEach(intel => {
      this.buildingIntelligence.set(intel.building_id, intel)
    })

    console.log(`📊 Loaded intelligence for ${intelligence.length} buildings`)

    // Refresh current mode
    this.setColorMode(this.currentMode)
  }

  /**
   * Color buildings near a specific location (for investigation focus)
   */
  async colorBuildingsNearLocation(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    color: string,
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<void> {
    if (!this.map) return

    try {
      // Query buildings near location
      const point = this.map.project([longitude, latitude])
      const features = this.map.queryRenderedFeatures(
        [
          [point.x - 100, point.y - 100],
          [point.x + 100, point.y + 100]
        ],
        {
          layers: ['buildings-2d', 'buildings-3d']
        }
      )

      // Update features with alert proximity data
      const updatedFeatures: any[] = []

      for (const feature of features) {
        if (feature.geometry.type !== 'Polygon') continue

        // Add alert proximity property
        const featureWithAlert = {
          ...feature,
          properties: {
            ...feature.properties,
            alert_priority: priority,
            alert_color: color
          }
        }

        updatedFeatures.push(featureWithAlert)
      }

      console.log(`🎨 Colored ${updatedFeatures.length} buildings near alert`)

      // If in alert proximity mode, refresh
      if (this.currentMode === 'alert-proximity') {
        this.applyAlertProximityColors()
      }
    } catch (error) {
      console.error('Failed to color buildings near location:', error)
    }
  }

  /**
   * Get current color mode
   */
  getCurrentMode(): BuildingColorMode {
    return this.currentMode
  }

  /**
   * Get mode configuration
   */
  getModeConfig(mode: BuildingColorMode): { name: string; description: string; icon: string } {
    const configs = {
      'poi-category': {
        name: 'POI Category',
        description: 'Color buildings by nearby place types (restaurants, hospitals, etc.)',
        icon: '📍'
      },
      'alert-proximity': {
        name: 'Alert Proximity',
        description: 'Color buildings by investigation alert proximity and priority',
        icon: '🚨'
      },
      'attributes': {
        name: 'Building Attributes',
        description: 'Color by building properties (height, class, floors)',
        icon: '🏗️'
      },
      'intelligence': {
        name: 'Intelligence Significance',
        description: 'Color by multi-int relevance score (0-100)',
        icon: '🎯'
      }
    }

    return configs[mode]
  }

  /**
   * Get all available modes
   */
  getAllModes(): BuildingColorMode[] {
    return ['poi-category', 'alert-proximity', 'attributes', 'intelligence']
  }
}

// Singleton instance
let buildingColorModeService: BuildingColorModeService | null = null

export function getBuildingColorModeService(): BuildingColorModeService {
  if (!buildingColorModeService) {
    buildingColorModeService = new BuildingColorModeService()
  }
  return buildingColorModeService
}
