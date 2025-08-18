/**
 * Map Configuration
 * Manages PMTiles sources (local vs remote)
 */

export interface PMTilesConfig {
  base: string;
  buildings: string;
  places: string;
  transportation: string;
}

// Check if local PMTiles are available
const checkLocalPMTiles = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const response = await fetch('/pmtiles/index.json');
    if (response.ok) {
      const index = await response.json();
      return index.local === true;
    }
  } catch {
    // Local PMTiles not available
  }
  return false;
};

// Remote PMTiles URLs (Overture Maps CDN)
const REMOTE_PMTILES: PMTilesConfig = {
  base: 'https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20/base.pmtiles',
  buildings: 'https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20/buildings.pmtiles',
  places: 'https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20/places.pmtiles',
  transportation: 'https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20/transportation.pmtiles'
};

// Local PMTiles URLs (served from public directory)
const LOCAL_PMTILES: PMTilesConfig = {
  base: '/pmtiles/base.pmtiles',
  buildings: '/pmtiles/buildings.pmtiles',
  places: '/pmtiles/places.pmtiles',
  transportation: '/pmtiles/transportation.pmtiles'
};

/**
 * Get PMTiles configuration
 * Prefers local PMTiles if available, falls back to remote
 */
export const getPMTilesConfig = async (): Promise<PMTilesConfig> => {
  // Force local in development if env var is set
  if (process.env.NEXT_PUBLIC_USE_LOCAL_PMTILES === 'true') {
    console.log('Using local PMTiles (forced by environment)');
    return LOCAL_PMTILES;
  }
  
  // Check if local PMTiles are available
  const hasLocal = await checkLocalPMTiles();
  
  if (hasLocal) {
    console.log('Using local PMTiles for better performance');
    return LOCAL_PMTILES;
  }
  
  console.log('Using remote PMTiles from Overture CDN');
  return REMOTE_PMTILES;
};

/**
 * Get Overture map style configuration
 */
export const getMapStyle = (pmtilesConfig: PMTilesConfig) => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    'overture-base': {
      type: 'vector',
      url: `pmtiles://${pmtilesConfig.base}`,
      attribution: 'Overture Maps Foundation'
    },
    'overture-buildings': {
      type: 'vector', 
      url: `pmtiles://${pmtilesConfig.buildings}`,
      attribution: 'Overture Maps Foundation'
    },
    'overture-places': {
      type: 'vector',
      url: `pmtiles://${pmtilesConfig.places}`,
      attribution: 'Overture Maps Foundation'
    },
    'overture-transportation': {
      type: 'vector',
      url: `pmtiles://${pmtilesConfig.transportation}`,
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
      source: 'overture-base',
      'source-layer': 'water',
      paint: {
        'fill-color': '#0d1117',
        'fill-outline-color': '#1a1f2e'
      }
    },
    // Rivers and waterways
    {
      id: 'waterways',
      type: 'line',
      source: 'overture-base',
      'source-layer': 'water',
      filter: ['==', ['geometry-type'], 'LineString'],
      minzoom: 5,
      paint: {
        'line-color': '#1a2332',
        'line-width': {
          base: 1.4,
          stops: [[5, 0.5], [10, 1], [15, 2]]
        }
      }
    },
    {
      id: 'land',
      type: 'fill',
      source: 'overture-base',
      'source-layer': 'land',
      paint: {
        'fill-color': '#161b22'
      }
    },
    // State/Province boundaries
    {
      id: 'admin-state-province',
      type: 'line',
      source: 'overture-base',
      'source-layer': 'boundary',
      filter: ['==', ['get', 'admin_level'], 4],
      minzoom: 3,
      paint: {
        'line-color': 'rgba(255, 255, 255, 0.15)',
        'line-width': {
          base: 1.2,
          stops: [[3, 0.5], [10, 1.5]]
        },
        'line-dasharray': [2, 1]
      }
    },
    // Country boundaries
    {
      id: 'admin-country',
      type: 'line',
      source: 'overture-base',
      'source-layer': 'boundary',
      filter: ['==', ['get', 'admin_level'], 2],
      minzoom: 0,
      paint: {
        'line-color': 'rgba(255, 255, 255, 0.25)',
        'line-width': {
          base: 1.5,
          stops: [[0, 0.5], [10, 2]]
        }
      }
    },
    {
      id: 'roads',
      type: 'line',
      source: 'overture-transportation',
      'source-layer': 'segment',
      minzoom: 10,
      paint: {
        'line-color': '#2a2e37',
        'line-width': {
          'base': 1.5,
          'stops': [[10, 0.5], [14, 2], [18, 10]]
        }
      }
    },
    {
      id: 'buildings',
      type: 'fill-extrusion',
      source: 'overture-buildings',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#2a2e37',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-opacity': 0.7
      }
    },
    // Country labels
    {
      id: 'country-labels',
      type: 'symbol',
      source: 'overture-places',
      'source-layer': 'place',
      filter: ['==', ['get', 'type'], 'country'],
      minzoom: 2,
      maxzoom: 8,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': {
          stops: [[2, 12], [6, 16]]
        },
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
        'text-max-width': 10
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.7)',
        'text-halo-color': 'rgba(0, 0, 0, 0.8)',
        'text-halo-width': 2,
        'text-halo-blur': 1
      }
    },
    // State/Province labels
    {
      id: 'state-labels',
      type: 'symbol',
      source: 'overture-places',
      'source-layer': 'place',
      filter: ['in', ['get', 'type'], 'region', 'state', 'province'],
      minzoom: 4,
      maxzoom: 10,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': {
          stops: [[4, 10], [8, 14]]
        },
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
        'text-max-width': 8
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.5)',
        'text-halo-color': 'rgba(0, 0, 0, 0.7)',
        'text-halo-width': 1.5
      }
    },
    // Major city labels
    {
      id: 'city-labels-major',
      type: 'symbol',
      source: 'overture-places',
      'source-layer': 'place',
      filter: [
        'all',
        ['==', ['get', 'type'], 'locality'],
        ['has', 'population']
      ],
      minzoom: 4,
      maxzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': {
          stops: [[4, 11], [10, 14], [14, 16]]
        },
        'text-anchor': 'center',
        'text-offset': [0, 0.5]
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.8)',
        'text-halo-color': 'rgba(0, 0, 0, 0.8)',
        'text-halo-width': 1.5,
        'text-halo-blur': 0.5
      }
    },
    // Medium city labels
    {
      id: 'city-labels-medium',
      type: 'symbol',
      source: 'overture-places',
      'source-layer': 'place',
      filter: ['==', ['get', 'type'], 'locality'],
      minzoom: 6,
      maxzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': {
          stops: [[6, 10], [12, 13]]
        },
        'text-anchor': 'center'
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.6)',
        'text-halo-color': 'rgba(0, 0, 0, 0.7)',
        'text-halo-width': 1
      }
    },
    // Water body labels (rivers, lakes)
    {
      id: 'water-labels',
      type: 'symbol',
      source: 'overture-base',
      'source-layer': 'water',
      filter: ['has', 'name'],
      minzoom: 6,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Italic', 'Arial Unicode MS Regular'],
        'text-size': {
          stops: [[6, 10], [12, 12]]
        },
        'symbol-placement': 'line',
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'viewport'
      },
      paint: {
        'text-color': 'rgba(100, 150, 200, 0.8)',
        'text-halo-color': 'rgba(0, 0, 0, 0.6)',
        'text-halo-width': 1
      }
    },
    // General place labels
    {
      id: 'places-labels',
      type: 'symbol',
      source: 'overture-places',
      'source-layer': 'place',
      filter: ['!', ['in', ['get', 'type'], 'country', 'region', 'state', 'province', 'locality']],
      minzoom: 12,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    }
  ]
});