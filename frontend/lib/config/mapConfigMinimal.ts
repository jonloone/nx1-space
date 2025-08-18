/**
 * Minimal Map Configuration for Testing
 * This is a simplified version to identify issues
 */

export interface PMTilesConfig {
  base: string;
  buildings: string;
  places: string;
  transportation: string;
}

// Remote PMTiles URLs (Overture Maps CDN)
// Using a single combined tile source for testing
const REMOTE_PMTILES: PMTilesConfig = {
  base: 'https://data.source.coop/smartmaps/overture-2024-07-22/overture.pmtiles',
  buildings: 'https://data.source.coop/smartmaps/overture-2024-07-22/overture.pmtiles',
  places: 'https://data.source.coop/smartmaps/overture-2024-07-22/overture.pmtiles',
  transportation: 'https://data.source.coop/smartmaps/overture-2024-07-22/overture.pmtiles'
};

export const getPMTilesConfig = async (): Promise<PMTilesConfig> => {
  console.log('Using remote PMTiles from Overture CDN');
  return REMOTE_PMTILES;
};

/**
 * Minimal working map style
 */
export const getMapStyle = (pmtilesConfig: PMTilesConfig) => ({
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    'overture-base': {
      type: 'vector',
      url: `pmtiles://${pmtilesConfig.base}`,
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
        'fill-color': '#0d1117'
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
    }
  ]
});