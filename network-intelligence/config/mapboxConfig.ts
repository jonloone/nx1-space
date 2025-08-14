// Mapbox configuration with 3D terrain support

export const MAPBOX_CONFIG = {
  accessToken: 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh1M2hoaDBmZXkydXEyODM3N2U0aGoifQ.cDThnvgRCd8YfFY8d6L3Mg',
  
  // 3D Terrain configuration
  terrain: {
    source: 'mapbox-dem',
    exaggeration: 1.5  // Exaggerate elevation for better visibility
  },
  
  // Style with satellite imagery and terrain
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  
  // Alternative styles
  styles: {
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12'
  },
  
  // Default view settings for different regions
  defaultViews: {
    northAmerica: {
      center: [-77.5, 38.9] as [number, number], // Virginia/Maryland area
      zoom: 7,
      pitch: 60,
      bearing: -45
    },
    europe: {
      center: [6.13, 49.61] as [number, number], // Luxembourg
      zoom: 7,
      pitch: 60,
      bearing: 30
    },
    asia: {
      center: [103.82, 1.35] as [number, number], // Singapore
      zoom: 8,
      pitch: 60,
      bearing: 0
    },
    global: {
      center: [-40, 30] as [number, number],
      zoom: 2,
      pitch: 0,
      bearing: 0
    }
  }
}