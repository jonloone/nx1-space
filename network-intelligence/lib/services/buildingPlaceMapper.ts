/**
 * Building-Place Mapper Service
 * Spatially joins POI data with building polygons to enable colored building visualization
 *
 * Instead of showing dots for POIs, this colors the actual building polygons
 */

import mapboxgl from 'mapbox-gl'
import type { GERSPlace } from './gersDemoService'

interface BuildingColorRule {
  buildingId: string
  category: string
  color: string
  name: string
}

// Category to color mapping (matching the existing place markers)
const CATEGORY_COLORS: Record<string, string> = {
  // Medical
  'hospital': '#EF4444',
  'clinic': '#EF4444',
  'emergency_room': '#EF4444',

  // Education
  'university': '#8B5CF6',
  'college': '#8B5CF6',
  'school': '#8B5CF6',

  // Transportation
  'airport': '#176BF8',
  'seaport': '#0EA5E9',
  'bus_station': '#0EA5E9',
  'train_station': '#0EA5E9',
  'ferry_terminal': '#0EA5E9',

  // Cultural
  'museum': '#F59E0B',
  'library': '#F59E0B',
  'theater': '#F59E0B',
  'stadium': '#F59E0B',
  'arena': '#F59E0B',

  // Commercial
  'restaurant': '#10B981',
  'cafe': '#10B981',
  'coffee_shop': '#10B981',
  'fast_food': '#10B981',
  'gas_station': '#F59E0B',
  'fuel': '#F59E0B',

  // Default
  'default': '#A3A3A3'
}

export class BuildingPlaceMapper {
  private map: mapboxgl.Map | null = null
  private coloredBuildings: Map<string, BuildingColorRule> = new Map()
  private originalBuildingLayer: any = null

  /**
   * Initialize with map instance
   */
  initialize(map: mapboxgl.Map): void {
    this.map = map
    console.log('✅ Building-Place Mapper initialized')
  }

  /**
   * Color buildings based on place categories
   * @param places - Array of places to visualize
   * @param categories - Filter to specific categories (optional)
   */
  async colorBuildingsByPlaces(places: GERSPlace[], categories?: string[]): Promise<void> {
    if (!this.map) {
      console.error('Map not initialized')
      return
    }

    console.log(`🎨 Coloring buildings for ${places.length} places`)

    // Clear previous coloring
    this.clearBuildingColors()

    // Filter places by category if specified
    const filteredPlaces = categories && categories.length > 0
      ? places.filter(p => p.categories.some(cat => categories.includes(cat)))
      : places

    console.log(`📍 Filtered to ${filteredPlaces.length} places`)

    // For each place, find nearby buildings and color them
    const buildingMatches: BuildingColorRule[] = []

    for (const place of filteredPlaces) {
      const [lng, lat] = place.location.coordinates
      const category = place.categories[0]
      const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['default']

      // Query buildings near this place (using a small buffer)
      const buildingsNearby = this.map.queryRenderedFeatures(
        this.map.project([lng, lat]),
        {
          layers: ['buildings-2d', 'buildings-3d']
        }
      )

      if (buildingsNearby.length > 0) {
        // Color the closest building
        const building = buildingsNearby[0]
        const buildingId = building.id || `building-${lng}-${lat}`

        buildingMatches.push({
          buildingId: buildingId.toString(),
          category,
          color,
          name: place.name
        })

        this.coloredBuildings.set(buildingId.toString(), {
          buildingId: buildingId.toString(),
          category,
          color,
          name: place.name
        })
      }
    }

    console.log(`✅ Matched ${buildingMatches.length} buildings to places`)

    // Apply coloring using data-driven styling
    this.applyBuildingColors()
  }

  /**
   * Apply colors to buildings using data-driven expressions
   */
  private applyBuildingColors(): void {
    if (!this.map) return

    // Get the 2D or 3D building layer
    const layerId = this.map.getLayer('buildings-3d') ? 'buildings-3d' : 'buildings-2d'

    if (!this.map.getLayer(layerId)) {
      console.warn(`Building layer ${layerId} not found`)
      return
    }

    // Build an expression for data-driven coloring
    // Format: ['match', ['id'], id1, color1, id2, color2, ..., defaultColor]
    const colorExpression: any = ['match', ['id']]

    this.coloredBuildings.forEach((rule, buildingId) => {
      colorExpression.push(buildingId)
      colorExpression.push(rule.color)
    })

    // Add default color
    colorExpression.push('#D4D4D4')

    // Apply the expression
    if (layerId === 'buildings-3d') {
      this.map.setPaintProperty(layerId, 'fill-extrusion-color', colorExpression)
      this.map.setPaintProperty(layerId, 'fill-extrusion-opacity', 0.9)
    } else {
      this.map.setPaintProperty(layerId, 'fill-color', colorExpression)
      this.map.setPaintProperty(layerId, 'fill-opacity', 0.85)
    }

    console.log(`🎨 Applied colors to ${this.coloredBuildings.size} buildings`)
  }

  /**
   * Clear all building colors and return to default
   */
  clearBuildingColors(): void {
    if (!this.map) return

    this.coloredBuildings.clear()

    // Reset to default building colors
    const layerId = this.map.getLayer('buildings-3d') ? 'buildings-3d' : 'buildings-2d'

    if (this.map.getLayer(layerId)) {
      if (layerId === 'buildings-3d') {
        this.map.setPaintProperty(layerId, 'fill-extrusion-color', [
          'match',
          ['get', 'class'],
          'residential', '#EF4444',
          'commercial', '#3B82F6',
          'industrial', '#8B5CF6',
          'public', '#10B981',
          'mixed', '#F59E0B',
          '#A3A3A3'
        ])
        this.map.setPaintProperty(layerId, 'fill-extrusion-opacity', 0.8)
      } else {
        this.map.setPaintProperty(layerId, 'fill-color', [
          'match',
          ['get', 'class'],
          'residential', '#FCA5A5',
          'commercial', '#93C5FD',
          'industrial', '#C4B5FD',
          'public', '#86EFAC',
          'mixed', '#FDE68A',
          '#D4D4D4'
        ])
        this.map.setPaintProperty(layerId, 'fill-opacity', 0.7)
      }
    }

    console.log('🧹 Cleared building colors')
  }

  /**
   * Get color for a specific category
   */
  getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS['default']
  }

  /**
   * Get all colored buildings
   */
  getColoredBuildings(): BuildingColorRule[] {
    return Array.from(this.coloredBuildings.values())
  }
}

// Singleton instance
let mapperInstance: BuildingPlaceMapper | null = null

export function getBuildingPlaceMapper(): BuildingPlaceMapper {
  if (!mapperInstance) {
    mapperInstance = new BuildingPlaceMapper()
  }
  return mapperInstance
}
