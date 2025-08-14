'use client'

import { ScatterplotLayer, PathLayer, TextLayer, PolygonLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'
import { MEOEnterpriseScorer, type EnterpriseLocation } from '@/lib/scoring/meo-enterprise-scorer'
import { mlOpportunityScorer } from '@/lib/scoring/ml-opportunity-scorer'

interface EnterpriseLayerProps {
  visible: boolean
  mode: 'data_centers' | 'government' | 'telecom' | 'economic'
  onHover?: (object: any) => void
  onClick?: (object: any) => void
  showLabels?: boolean
}

// Major data center locations with capacity and importance
const DATA_CENTERS: EnterpriseLocation[] = [
  // North America
  { latitude: 38.95, longitude: -77.45, type: 'data_center', name: 'Northern Virginia', importance: 1.0 },
  { latitude: 37.37, longitude: -121.92, type: 'data_center', name: 'Silicon Valley', importance: 0.9 },
  { latitude: 41.88, longitude: -87.63, type: 'data_center', name: 'Chicago', importance: 0.7 },
  { latitude: 45.60, longitude: -121.18, type: 'data_center', name: 'Oregon', importance: 0.8 },
  { latitude: 39.04, longitude: -77.49, type: 'data_center', name: 'Ashburn', importance: 1.0 },
  { latitude: 33.93, longitude: -118.40, type: 'data_center', name: 'Los Angeles', importance: 0.7 },
  { latitude: 32.72, longitude: -96.80, type: 'data_center', name: 'Dallas', importance: 0.7 },
  { latitude: 39.74, longitude: -104.99, type: 'data_center', name: 'Denver', importance: 0.6 },
  { latitude: 47.61, longitude: -122.33, type: 'data_center', name: 'Seattle', importance: 0.8 },
  { latitude: 25.76, longitude: -80.19, type: 'data_center', name: 'Miami', importance: 0.6 },
  
  // Europe
  { latitude: 50.11, longitude: 8.68, type: 'data_center', name: 'Frankfurt', importance: 0.95 },
  { latitude: 51.51, longitude: -0.13, type: 'data_center', name: 'London', importance: 0.9 },
  { latitude: 52.30, longitude: 4.94, type: 'data_center', name: 'Amsterdam', importance: 0.85 },
  { latitude: 48.86, longitude: 2.35, type: 'data_center', name: 'Paris', importance: 0.8 },
  { latitude: 53.35, longitude: -6.26, type: 'data_center', name: 'Dublin', importance: 0.8 },
  { latitude: 52.52, longitude: 13.40, type: 'data_center', name: 'Berlin', importance: 0.7 },
  { latitude: 59.33, longitude: 18.06, type: 'data_center', name: 'Stockholm', importance: 0.6 },
  { latitude: 47.37, longitude: 8.54, type: 'data_center', name: 'Zurich', importance: 0.65 },
  { latitude: 40.42, longitude: -3.70, type: 'data_center', name: 'Madrid', importance: 0.6 },
  { latitude: 45.46, longitude: 9.19, type: 'data_center', name: 'Milan', importance: 0.6 },
  
  // Asia Pacific
  { latitude: 1.29, longitude: 103.85, type: 'data_center', name: 'Singapore', importance: 0.9 },
  { latitude: 35.68, longitude: 139.69, type: 'data_center', name: 'Tokyo', importance: 0.85 },
  { latitude: 22.28, longitude: 114.16, type: 'data_center', name: 'Hong Kong', importance: 0.8 },
  { latitude: -33.87, longitude: 151.21, type: 'data_center', name: 'Sydney', importance: 0.75 },
  { latitude: 37.57, longitude: 126.98, type: 'data_center', name: 'Seoul', importance: 0.7 },
  { latitude: 19.08, longitude: 72.88, type: 'data_center', name: 'Mumbai', importance: 0.65 },
  { latitude: 31.23, longitude: 121.47, type: 'data_center', name: 'Shanghai', importance: 0.7 },
  { latitude: 39.90, longitude: 116.40, type: 'data_center', name: 'Beijing', importance: 0.7 },
  { latitude: 12.97, longitude: 77.59, type: 'data_center', name: 'Bangalore', importance: 0.6 },
  { latitude: -37.81, longitude: 144.96, type: 'data_center', name: 'Melbourne', importance: 0.6 }
]

// Government facilities (federal/military)
const GOVERNMENT_FACILITIES: EnterpriseLocation[] = [
  // US Government
  { latitude: 38.89, longitude: -77.04, type: 'government', name: 'Washington DC', importance: 1.0 },
  { latitude: 38.87, longitude: -77.01, type: 'government', name: 'Pentagon', importance: 1.0 },
  { latitude: 38.95, longitude: -77.06, type: 'government', name: 'NSA Fort Meade', importance: 0.9 },
  { latitude: 39.13, longitude: -77.16, type: 'government', name: 'NIST Gaithersburg', importance: 0.7 },
  { latitude: 28.47, longitude: -80.58, type: 'government', name: 'Cape Canaveral', importance: 0.8 },
  { latitude: 32.89, longitude: -117.15, type: 'government', name: 'San Diego Naval Base', importance: 0.8 },
  { latitude: 36.59, longitude: -121.85, type: 'government', name: 'Fort Ord', importance: 0.6 },
  { latitude: 36.08, longitude: -115.17, type: 'government', name: 'Nevada Test Site', importance: 0.7 },
  
  // European Government
  { latitude: 51.50, longitude: -0.12, type: 'government', name: 'London Whitehall', importance: 0.8 },
  { latitude: 48.87, longitude: 2.32, type: 'government', name: 'Paris Defense', importance: 0.7 },
  { latitude: 52.52, longitude: 13.38, type: 'government', name: 'Berlin Government', importance: 0.7 },
  { latitude: 50.85, longitude: 4.35, type: 'government', name: 'Brussels NATO', importance: 0.8 },
  
  // Asia Pacific Government
  { latitude: 35.69, longitude: 139.69, type: 'government', name: 'Tokyo Government', importance: 0.7 },
  { latitude: 39.90, longitude: 116.40, type: 'government', name: 'Beijing Government', importance: 0.7 },
  { latitude: 28.61, longitude: 77.20, type: 'government', name: 'New Delhi', importance: 0.6 },
  { latitude: -35.28, longitude: 149.13, type: 'government', name: 'Canberra', importance: 0.6 }
]

// Telecom infrastructure (carrier hotels, internet exchanges)
const TELECOM_HUBS: EnterpriseLocation[] = [
  // Major IXPs
  { latitude: 50.11, longitude: 8.68, type: 'telecom_hub', name: 'DE-CIX Frankfurt', importance: 1.0 },
  { latitude: 52.30, longitude: 4.94, type: 'telecom_hub', name: 'AMS-IX Amsterdam', importance: 0.95 },
  { latitude: 51.51, longitude: -0.09, type: 'telecom_hub', name: 'LINX London', importance: 0.9 },
  { latitude: 37.44, longitude: -122.17, type: 'telecom_hub', name: 'Equinix San Jose', importance: 0.85 },
  { latitude: 1.29, longitude: 103.85, type: 'telecom_hub', name: 'Singapore IX', importance: 0.85 },
  { latitude: 35.68, longitude: 139.76, type: 'telecom_hub', name: 'JPIX Tokyo', importance: 0.8 },
  { latitude: 22.28, longitude: 114.16, type: 'telecom_hub', name: 'HKIX', importance: 0.8 },
  { latitude: -23.55, longitude: -46.63, type: 'telecom_hub', name: 'IX.br São Paulo', importance: 0.7 },
  { latitude: 40.71, longitude: -74.01, type: 'telecom_hub', name: 'NY-IX', importance: 0.85 },
  { latitude: 48.86, longitude: 2.35, type: 'telecom_hub', name: 'France-IX Paris', importance: 0.75 }
]

// Financial centers
const FINANCIAL_CENTERS: EnterpriseLocation[] = [
  { latitude: 40.71, longitude: -74.01, type: 'financial_center', name: 'New York', importance: 1.0 },
  { latitude: 51.51, longitude: -0.13, type: 'financial_center', name: 'London City', importance: 0.95 },
  { latitude: 35.68, longitude: 139.69, type: 'financial_center', name: 'Tokyo', importance: 0.9 },
  { latitude: 22.28, longitude: 114.16, type: 'financial_center', name: 'Hong Kong', importance: 0.85 },
  { latitude: 1.29, longitude: 103.85, type: 'financial_center', name: 'Singapore', importance: 0.85 },
  { latitude: 50.11, longitude: 8.68, type: 'financial_center', name: 'Frankfurt', importance: 0.8 },
  { latitude: 47.37, longitude: 8.54, type: 'financial_center', name: 'Zurich', importance: 0.75 },
  { latitude: 31.23, longitude: 121.47, type: 'financial_center', name: 'Shanghai', importance: 0.7 },
  { latitude: 41.88, longitude: -87.63, type: 'financial_center', name: 'Chicago', importance: 0.75 },
  { latitude: 37.79, longitude: -122.42, type: 'financial_center', name: 'San Francisco', importance: 0.7 }
]

export function createEnterpriseLayers({
  visible,
  mode,
  onHover,
  onClick,
  showLabels = true
}: EnterpriseLayerProps): Layer[] {
  if (!visible) return []
  
  const layers: Layer[] = []
  const scorer = new MEOEnterpriseScorer()
  
  // Select data based on mode
  let locations: EnterpriseLocation[] = []
  let color: [number, number, number, number] = [255, 255, 255, 200]
  let glowColor: [number, number, number, number] = [255, 255, 255, 100]
  
  switch (mode) {
    case 'data_centers':
      locations = DATA_CENTERS
      color = [59, 130, 246, 200] // Blue
      glowColor = [59, 130, 246, 50]
      break
    case 'government':
      locations = GOVERNMENT_FACILITIES
      color = [34, 197, 94, 200] // Green
      glowColor = [34, 197, 94, 50]
      break
    case 'telecom':
      locations = TELECOM_HUBS
      color = [168, 85, 247, 200] // Purple
      glowColor = [168, 85, 247, 50]
      break
    case 'economic':
      locations = FINANCIAL_CENTERS
      color = [251, 146, 60, 200] // Orange
      glowColor = [251, 146, 60, 50]
      break
  }
  
  // Create heat zones around enterprise locations using ML scorer
  locations.forEach(location => {
    // Get ML-based score for the location
    const mlScore = mlOpportunityScorer.scoreOpportunity(
      location.latitude, 
      location.longitude, 
      {
        gdpPerCapita: 75000, // Assume high GDP for enterprise areas
        populationDensity: 500, // Urban density
        infrastructureScore: 0.9, // High infrastructure
        competitorCount: 2, // Moderate competition
        maritimeDensity: 10, // Low maritime relevance
        elevation: 100,
        weatherReliability: 0.85,
        regulatoryScore: 0.8
      }
    )
    
    // Use ML confidence and score to determine heat intensity
    const heatIntensity = (mlScore.score / 100) * mlScore.confidence
    const adjustedImportance = (location.importance || 0.5) * heatIntensity
    
    // Create layered circles for heat effect with ML-based intensity
    for (let i = 3; i >= 0; i--) {
      const radiusMultiplier = adjustedImportance * (1 + mlScore.score / 200)
      layers.push(
        new ScatterplotLayer({
          id: `enterprise-heat-${location.name}-${i}`,
          data: [location],
          getPosition: d => [d.longitude, d.latitude],
          getRadius: (50000 * (i + 1)) * radiusMultiplier,
          getFillColor: [...glowColor.slice(0, 3), glowColor[3] * (0.2 + i * 0.1) * heatIntensity] as [number, number, number, number],
          radiusMinPixels: 10 + i * 5,
          radiusMaxPixels: 50 + i * 20,
          pickable: false
        })
      )
    }
  })
  
  // Main enterprise location markers
  layers.push(
    new ScatterplotLayer({
      id: 'enterprise-locations',
      data: locations,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: 5000, // 5km visual radius
      radiusMinPixels: 8,
      radiusMaxPixels: 20,
      getFillColor: color,
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      filled: true,
      pickable: true,
      onHover,
      onClick
    })
  )
  
  // Add importance rings for major locations
  const majorLocations = locations.filter(l => (l.importance || 0) >= 0.8)
  layers.push(
    new ScatterplotLayer({
      id: 'enterprise-importance-rings',
      data: majorLocations,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: d => 100000 * (d.importance || 1), // 100km * importance
      radiusMinPixels: 20,
      radiusMaxPixels: 80,
      getFillColor: [0, 0, 0, 0],
      getLineColor: [...color.slice(0, 3), 150] as [number, number, number, number],
      lineWidthMinPixels: 2,
      stroked: true,
      filled: false,
      pickable: false
    })
  )
  
  // Labels for enterprise locations
  if (showLabels) {
    layers.push(
      new TextLayer({
        id: 'enterprise-labels',
        data: locations,
        getPosition: d => [d.longitude, d.latitude],
        getText: d => d.name || '',
        getSize: 14,
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 200],
        backgroundPadding: [6, 3],
        getPixelOffset: [0, -20],
        fontFamily: 'monospace',
        fontWeight: 600,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        billboard: false,
        pickable: false
      })
    )
  }
  
  // Add connectivity lines between major hubs (for telecom mode)
  if (mode === 'telecom' && locations.length > 1) {
    const connections: any[] = []
    
    // Connect major telecom hubs
    const majorHubs = locations.filter(l => (l.importance || 0) >= 0.85)
    for (let i = 0; i < majorHubs.length; i++) {
      for (let j = i + 1; j < majorHubs.length; j++) {
        const distance = Math.sqrt(
          Math.pow(majorHubs[i].latitude - majorHubs[j].latitude, 2) +
          Math.pow(majorHubs[i].longitude - majorHubs[j].longitude, 2)
        )
        
        // Only connect reasonably close hubs
        if (distance < 50) {
          connections.push({
            from: [majorHubs[i].longitude, majorHubs[i].latitude],
            to: [majorHubs[j].longitude, majorHubs[j].latitude],
            importance: Math.min(majorHubs[i].importance || 0, majorHubs[j].importance || 0)
          })
        }
      }
    }
    
    layers.push(
      new PathLayer({
        id: 'telecom-connections',
        data: connections,
        getPath: d => [d.from, d.to],
        getColor: d => [...color.slice(0, 3), 100 * d.importance] as [number, number, number, number],
        getWidth: d => 2 * d.importance,
        widthMinPixels: 1,
        widthMaxPixels: 3,
        capRounded: true,
        jointRounded: true,
        pickable: false
      })
    )
  }
  
  return layers
}

// Export location data for use in scoring
export { DATA_CENTERS, GOVERNMENT_FACILITIES, TELECOM_HUBS, FINANCIAL_CENTERS }