/**
 * GIS Selection Manager
 * Spatial selection tools using Turf.js for geospatial analysis
 *
 * Features:
 * - Point selection (click to select places)
 * - Radius selection (circle around a point)
 * - Box selection (rectangular area)
 * - Polygon selection (custom polygon)
 * - Multi-selection support
 */

import * as turf from '@turf/turf'
import type { GERSPlace } from './gersDemoService'

export type SelectionMode = 'point' | 'radius' | 'box' | 'polygon' | 'none'

export interface SelectionOptions {
  mode: SelectionMode
  radius?: number // in kilometers for radius selection
  tolerance?: number // in kilometers for point selection tolerance
  multiSelect?: boolean // allow multiple selections
}

export interface Selection {
  id: string
  mode: SelectionMode
  geometry: GeoJSON.Geometry
  places: GERSPlace[]
  timestamp: number
}

export class GISSelectionManager {
  private selections: Selection[] = []
  private currentMode: SelectionMode = 'none'
  private options: SelectionOptions = {
    mode: 'none',
    radius: 1, // 1km default
    tolerance: 0.1, // 100m tolerance for point selection
    multiSelect: false
  }

  /**
   * Set selection mode
   */
  setMode(mode: SelectionMode, options?: Partial<SelectionOptions>): void {
    this.currentMode = mode
    this.options = { ...this.options, mode, ...options }
  }

  /**
   * Get current selection mode
   */
  getMode(): SelectionMode {
    return this.currentMode
  }

  /**
   * Point selection - select places at a specific coordinate
   */
  selectAtPoint(
    longitude: number,
    latitude: number,
    places: GERSPlace[],
    tolerance: number = this.options.tolerance || 0.1
  ): GERSPlace[] {
    const point = turf.point([longitude, latitude])

    // Find places within tolerance distance
    const selected = places.filter((place) => {
      const placePoint = turf.point(place.location.coordinates)
      const distance = turf.distance(point, placePoint, { units: 'kilometers' })
      return distance <= tolerance
    })

    // Sort by distance (closest first)
    selected.sort((a, b) => {
      const distA = turf.distance(point, turf.point(a.location.coordinates), {
        units: 'kilometers'
      })
      const distB = turf.distance(point, turf.point(b.location.coordinates), {
        units: 'kilometers'
      })
      return distA - distB
    })

    // Store selection
    if (selected.length > 0) {
      this.addSelection({
        id: `point-${Date.now()}`,
        mode: 'point',
        geometry: point.geometry,
        places: selected,
        timestamp: Date.now()
      })
    }

    return selected
  }

  /**
   * Radius selection - select places within a circular radius
   */
  selectWithinRadius(
    longitude: number,
    latitude: number,
    radius: number, // in kilometers
    places: GERSPlace[]
  ): GERSPlace[] {
    const center = turf.point([longitude, latitude])
    const circle = turf.circle(center, radius, { units: 'kilometers' })

    // Find places within the circle
    const selected = places.filter((place) => {
      const placePoint = turf.point(place.location.coordinates)
      return turf.booleanPointInPolygon(placePoint, circle)
    })

    // Store selection
    if (selected.length > 0) {
      this.addSelection({
        id: `radius-${Date.now()}`,
        mode: 'radius',
        geometry: circle.geometry,
        places: selected,
        timestamp: Date.now()
      })
    }

    return selected
  }

  /**
   * Box selection - select places within a rectangular bounding box
   */
  selectWithinBox(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    places: GERSPlace[]
  ): GERSPlace[] {
    // Create bounding box polygon
    const bbox = turf.bboxPolygon([minLng, minLat, maxLng, maxLat])

    // Find places within the box
    const selected = places.filter((place) => {
      const placePoint = turf.point(place.location.coordinates)
      return turf.booleanPointInPolygon(placePoint, bbox)
    })

    // Store selection
    if (selected.length > 0) {
      this.addSelection({
        id: `box-${Date.now()}`,
        mode: 'box',
        geometry: bbox.geometry,
        places: selected,
        timestamp: Date.now()
      })
    }

    return selected
  }

  /**
   * Polygon selection - select places within a custom polygon
   */
  selectWithinPolygon(
    coordinates: [number, number][],
    places: GERSPlace[]
  ): GERSPlace[] {
    // Close the polygon if not already closed
    const coords = [...coordinates]
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0])
    }

    // Create polygon
    const polygon = turf.polygon([coords])

    // Find places within the polygon
    const selected = places.filter((place) => {
      const placePoint = turf.point(place.location.coordinates)
      return turf.booleanPointInPolygon(placePoint, polygon)
    })

    // Store selection
    if (selected.length > 0) {
      this.addSelection({
        id: `polygon-${Date.now()}`,
        mode: 'polygon',
        geometry: polygon.geometry,
        places: selected,
        timestamp: Date.now()
      })
    }

    return selected
  }

  /**
   * Add selection to history
   */
  private addSelection(selection: Selection): void {
    if (this.options.multiSelect) {
      this.selections.push(selection)
    } else {
      this.selections = [selection]
    }
  }

  /**
   * Get all selections
   */
  getSelections(): Selection[] {
    return this.selections
  }

  /**
   * Get latest selection
   */
  getLatestSelection(): Selection | null {
    return this.selections[this.selections.length - 1] || null
  }

  /**
   * Get all selected places (deduplicated)
   */
  getAllSelectedPlaces(): GERSPlace[] {
    const allPlaces = this.selections.flatMap((s) => s.places)
    // Deduplicate by gersId
    const uniquePlaces = Array.from(
      new Map(allPlaces.map((p) => [p.gersId, p])).values()
    )
    return uniquePlaces
  }

  /**
   * Clear all selections
   */
  clearSelections(): void {
    this.selections = []
  }

  /**
   * Remove a specific selection by ID
   */
  removeSelection(id: string): void {
    this.selections = this.selections.filter((s) => s.id !== id)
  }

  /**
   * Calculate selection statistics
   */
  getSelectionStats(): {
    totalSelections: number
    totalPlaces: number
    uniquePlaces: number
    modeBreakdown: Record<SelectionMode, number>
  } {
    const totalPlaces = this.selections.reduce((sum, s) => sum + s.places.length, 0)
    const uniquePlaces = this.getAllSelectedPlaces().length

    const modeBreakdown: Record<SelectionMode, number> = {
      point: 0,
      radius: 0,
      box: 0,
      polygon: 0,
      none: 0
    }

    this.selections.forEach((s) => {
      modeBreakdown[s.mode]++
    })

    return {
      totalSelections: this.selections.length,
      totalPlaces,
      uniquePlaces,
      modeBreakdown
    }
  }

  /**
   * Export selections as GeoJSON
   */
  exportSelectionsAsGeoJSON(): GeoJSON.FeatureCollection {
    const features = this.selections.map((selection) => {
      return turf.feature(selection.geometry, {
        id: selection.id,
        mode: selection.mode,
        placesCount: selection.places.length,
        timestamp: selection.timestamp,
        placeIds: selection.places.map((p) => p.gersId)
      })
    })

    return turf.featureCollection(features)
  }

  /**
   * Export selected places as GeoJSON
   */
  exportPlacesAsGeoJSON(): GeoJSON.FeatureCollection {
    const places = this.getAllSelectedPlaces()
    const features = places.map((place) => {
      return turf.feature(place.location, {
        id: place.gersId,
        name: place.name,
        categories: place.categories,
        levelOfDetail: place.levelOfDetail,
        address: place.address
      })
    })

    return turf.featureCollection(features)
  }

  /**
   * Calculate area of selection (for polygon and box)
   */
  getSelectionArea(selectionId: string): number | null {
    const selection = this.selections.find((s) => s.id === selectionId)
    if (!selection) return null

    if (selection.mode === 'polygon' || selection.mode === 'box') {
      return turf.area(turf.feature(selection.geometry))
    }

    if (selection.mode === 'radius') {
      return turf.area(turf.feature(selection.geometry))
    }

    return null
  }
}

// Singleton instance
let selectionManagerInstance: GISSelectionManager | null = null

export function getGISSelectionManager(): GISSelectionManager {
  if (!selectionManagerInstance) {
    selectionManagerInstance = new GISSelectionManager()
  }
  return selectionManagerInstance
}
