/**
 * Robust Map Configuration with Multiple Fallbacks
 * Handles PMTiles issues by providing reliable fallback options
 */

export interface PMTilesConfig {
  base: string;
  buildings: string;
  places: string;
  transportation: string;
}

/**
 * Map style with OpenStreetMap raster tiles as reliable fallback
 */
export const getOpenStreetMapStyle = () => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    'osm': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0a0a0f'
      }
    },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-opacity': 0.7,
        'raster-brightness-max': 0.8,
        'raster-contrast': 0.2
      }
    }
  ]
});

/**
 * Simplified PMTiles style (single source)
 */
export const getPMTilesStyle = (pmtilesUrl: string) => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    'overture': {
      type: 'vector',
      url: `pmtiles://${pmtilesUrl}`,
      attribution: 'Overture Maps Foundation'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0a0a0f'
      }
    },
    {
      id: 'water',
      type: 'fill',
      source: 'overture',
      'source-layer': 'water',
      paint: {
        'fill-color': '#0d1117',
        'fill-outline-color': '#1a1f2e'
      }
    },
    {
      id: 'land',
      type: 'fill',
      source: 'overture',
      'source-layer': 'land',
      paint: {
        'fill-color': '#161b22'
      }
    },
    {
      id: 'roads',
      type: 'line',
      source: 'overture',
      'source-layer': 'transportation',
      minzoom: 10,
      paint: {
        'line-color': '#2a2e37',
        'line-width': {
          'base': 1.5,
          'stops': [[10, 0.5], [14, 2], [18, 10]]
        }
      }
    }
  ]
});

/**
 * Get map configuration with intelligent fallback system
 */
export const getMapStyle = async () => {
  console.log('[MapConfig] Determining best map style...');
  
  // Option 1: Try single AWS PMTiles (most basic layers)
  const singlePMTilesUrl = 'https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20/base.pmtiles';
  
  try {
    console.log('[MapConfig] Testing PMTiles availability...');
    
    // Quick test if PMTiles is accessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(singlePMTilesUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('[MapConfig] Using PMTiles style');
      return getPMTilesStyle(singlePMTilesUrl);
    } else {
      throw new Error(`PMTiles not accessible: ${response.status}`);
    }
  } catch (error) {
    console.warn('[MapConfig] PMTiles failed, using OpenStreetMap fallback:', error.message);
    return getOpenStreetMapStyle();
  }
};

/**
 * Legacy interface for backward compatibility
 */
export const getPMTilesConfig = async (): Promise<PMTilesConfig> => {
  const baseUrl = 'https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20/base.pmtiles';
  return {
    base: baseUrl,
    buildings: baseUrl,
    places: baseUrl,
    transportation: baseUrl
  };
};