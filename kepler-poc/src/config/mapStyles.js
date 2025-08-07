/**
 * MapLibre-compatible map styles for Kepler.gl
 * No API keys required - uses open tile servers
 */

export const mapStyles = [
  {
    id: 'satellite',
    label: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    icon: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-122.3391,37.7922,9,0,0/400x300?access_token=pk.eyJ1IjoiYSIsImEiOiJjamJ5cW8zMWUxMHU4MzFudGs5N3FoemZhIn0.CXKuZiurf0XOmff0_rNthA',
    style: {
      version: 8,
      name: 'Satellite Imagery',
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '© Esri'
        }
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'satellite-tiles',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  },
  {
    id: 'dark',
    label: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v10',
    icon: 'https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-122.3391,37.7922,9,0,0/400x300?access_token=pk.eyJ1IjoiYSIsImEiOiJjamJ5cW8zMWUxMHU4MzFudGs5N3FoemZhIn0.CXKuZiurf0XOmff0_rNthA',
    style: {
      version: 8,
      name: 'Dark',
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© CARTO © OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'dark-base',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  },
  {
    id: 'light',
    label: 'Light',
    url: 'mapbox://styles/mapbox/light-v10',
    icon: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-122.3391,37.7922,9,0,0/400x300?access_token=pk.eyJ1IjoiYSIsImEiOiJjamJ5cW8zMWUxMHU4MzFudGs5N3FoemZhIn0.CXKuZiurf0XOmff0_rNthA',
    style: {
      version: 8,
      name: 'Light',
      sources: {
        'carto-light': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© CARTO © OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'light-base',
          type: 'raster',
          source: 'carto-light',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'mapbox://styles/mapbox/streets-v11',
    icon: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.3391,37.7922,9,0,0/400x300?access_token=pk.eyJ1IjoiYSIsImEiOiJjamJ5cW8zMWUxMHU4MzFudGs5N3FoemZhIn0.CXKuZiurf0XOmff0_rNthA',
    style: {
      version: 8,
      name: 'OpenStreetMap',
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
          id: 'osm-base',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  }
];

// Default map style config for Kepler.gl
export const defaultMapConfig = {
  mapStyle: {
    styleType: 'satellite',
    topLayerGroups: {},
    visibleLayerGroups: {
      label: true,
      road: true,
      border: false,
      building: true,
      water: true,
      land: true
    }
  }
};