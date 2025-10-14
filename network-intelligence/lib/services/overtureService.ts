/**
 * Overture Maps Service
 * Handles integration with Overture Maps data via PMTiles
 * https://docs.overturemaps.org/examples/overture-tiles/
 */

import { PMTiles } from 'pmtiles'

export type OvertureTheme = 'buildings' | 'places' | 'transportation' | 'base'

export interface OvertureLayerConfig {
  theme: OvertureTheme
  url: string
  minZoom: number
  maxZoom: number
  type: 'fill' | 'fill-extrusion' | 'line' | 'symbol' | 'circle'
  paint?: any
  layout?: any
}

export interface OvertureFeature {
  type: 'Feature'
  geometry: any
  properties: any
}

/**
 * Overture Maps Service
 * Provides access to Overture Maps data layers
 */
export class OvertureService {
  private pmtilesCache: Map<string, PMTiles> = new Map()

  /**
   * Get predefined layer configurations for Overture Maps
   */
  getLayerConfigs(): OvertureLayerConfig[] {
    return [
      {
        theme: 'buildings',
        url: 'https://overturemaps.blob.core.windows.net/release/2024-09-18.0/theme=buildings/type=building/{z}/{x}/{y}.mvt',
        minZoom: 14,
        maxZoom: 19,
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'height'],
            0, '#e0e0e0',
            50, '#c0c0c0',
            100, '#a0a0a0',
            200, '#808080'
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7
        }
      },
      {
        theme: 'places',
        url: 'https://overturemaps.blob.core.windows.net/release/2024-09-18.0/theme=places/type=place/{z}/{x}/{y}.mvt',
        minZoom: 10,
        maxZoom: 19,
        type: 'circle',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2,
            15, 6,
            19, 12
          ],
          'circle-color': [
            'match',
            ['get', 'categories'],
            'restaurant', '#ff6b6b',
            'hotel', '#4ecdc4',
            'shop', '#45b7d1',
            'education', '#f7b731',
            'healthcare', '#5f27cd',
            '#95afc0' // default
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      },
      {
        theme: 'transportation',
        url: 'https://overturemaps.blob.core.windows.net/release/2024-09-18.0/theme=transportation/type=segment/{z}/{x}/{y}.mvt',
        minZoom: 5,
        maxZoom: 19,
        type: 'line',
        paint: {
          'line-color': [
            'match',
            ['get', 'class'],
            'motorway', '#e74c3c',
            'trunk', '#e67e22',
            'primary', '#f39c12',
            'secondary', '#f1c40f',
            'tertiary', '#95a5a6',
            '#bdc3c7' // default
          ],
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            5, 0.5,
            10, 1,
            15, 3,
            19, 8
          ],
          'line-opacity': 0.7
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        }
      }
    ]
  }

  /**
   * Get Mapbox style specification for an Overture layer
   */
  getMapboxStyle(config: OvertureLayerConfig): any {
    return {
      id: `overture-${config.theme}`,
      type: config.type,
      source: `overture-${config.theme}-source`,
      'source-layer': config.theme,
      minzoom: config.minZoom,
      maxzoom: config.maxZoom,
      paint: config.paint || this.getDefaultPaint(config.type),
      layout: config.layout || {}
    }
  }

  /**
   * Get source specification for Mapbox
   */
  getMapboxSource(config: OvertureLayerConfig): any {
    return {
      type: 'vector',
      tiles: [config.url],
      minzoom: config.minZoom,
      maxzoom: config.maxZoom,
      attribution: '© Overture Maps Foundation'
    }
  }

  /**
   * Load PMTiles archive for a specific theme
   */
  async loadPMTiles(theme: OvertureTheme, url: string): Promise<PMTiles> {
    if (this.pmtilesCache.has(theme)) {
      return this.pmtilesCache.get(theme)!
    }

    const pmtiles = new PMTiles(url)
    this.pmtilesCache.set(theme, pmtiles)
    return pmtiles
  }

  /**
   * Get metadata for an Overture theme
   */
  async getMetadata(theme: OvertureTheme): Promise<any> {
    const config = this.getLayerConfigs().find(c => c.theme === theme)
    if (!config) {
      throw new Error(`Unknown theme: ${theme}`)
    }

    try {
      const pmtiles = await this.loadPMTiles(theme, config.url)
      const header = await pmtiles.getHeader()
      return {
        theme,
        minZoom: header.minZoom,
        maxZoom: header.maxZoom,
        bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
        center: [
          (header.minLon + header.maxLon) / 2,
          (header.minLat + header.maxLat) / 2
        ]
      }
    } catch (error) {
      console.warn(`Could not load metadata for ${theme}:`, error)
      return {
        theme,
        minZoom: config.minZoom,
        maxZoom: config.maxZoom
      }
    }
  }

  /**
   * Get default paint properties for a layer type
   */
  private getDefaultPaint(type: string): any {
    switch (type) {
      case 'fill':
        return {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5
        }
      case 'fill-extrusion':
        return {
          'fill-extrusion-color': '#0080ff',
          'fill-extrusion-height': 50,
          'fill-extrusion-opacity': 0.7
        }
      case 'line':
        return {
          'line-color': '#0080ff',
          'line-width': 2,
          'line-opacity': 0.7
        }
      case 'circle':
        return {
          'circle-radius': 5,
          'circle-color': '#0080ff',
          'circle-opacity': 0.7
        }
      case 'symbol':
        return {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      default:
        return {}
    }
  }

  /**
   * Clear PMTiles cache
   */
  clearCache(): void {
    this.pmtilesCache.clear()
  }

  /**
   * Get human-readable name for theme
   */
  getThemeName(theme: OvertureTheme): string {
    const names: Record<OvertureTheme, string> = {
      buildings: 'Buildings',
      places: 'Places of Interest',
      transportation: 'Transportation Network',
      base: 'Base Features'
    }
    return names[theme] || theme
  }

  /**
   * Get description for theme
   */
  getThemeDescription(theme: OvertureTheme): string {
    const descriptions: Record<OvertureTheme, string> = {
      buildings: 'Building footprints and 3D structures from Overture Maps',
      places: 'Points of interest including restaurants, shops, and services',
      transportation: 'Road network and transportation infrastructure',
      base: 'Base map features and administrative boundaries'
    }
    return descriptions[theme] || 'Overture Maps data layer'
  }
}

// Singleton instance
let serviceInstance: OvertureService | null = null

export function getOvertureService(): OvertureService {
  if (!serviceInstance) {
    serviceInstance = new OvertureService()
  }
  return serviceInstance
}
