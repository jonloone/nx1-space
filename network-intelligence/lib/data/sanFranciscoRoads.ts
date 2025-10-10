/**
 * San Francisco Major Road Network
 *
 * Pre-defined major streets for realistic vehicle placement
 * Vehicles will be snapped to these roads and travel along them
 */

export interface RoadSegment {
  id: string
  name: string
  coordinates: [number, number][] // LineString coordinates
  type: 'highway' | 'arterial' | 'collector' | 'local'
  speedLimit: number // mph
}

/**
 * Major roads in San Francisco
 * These form a realistic street grid for vehicle simulation
 */
export const sanFranciscoRoads: RoadSegment[] = [
  // North-South arterials
  {
    id: 'van-ness',
    name: 'Van Ness Avenue',
    type: 'arterial',
    speedLimit: 35,
    coordinates: [
      [-122.4222, 37.7749], // South end
      [-122.4222, 37.7849],
      [-122.4222, 37.7949],
      [-122.4222, 37.8049]  // North end
    ]
  },
  {
    id: 'polk-street',
    name: 'Polk Street',
    type: 'arterial',
    speedLimit: 30,
    coordinates: [
      [-122.4194, 37.7749],
      [-122.4194, 37.7849],
      [-122.4194, 37.7949],
      [-122.4194, 37.8049]
    ]
  },
  {
    id: 'divisadero',
    name: 'Divisadero Street',
    type: 'arterial',
    speedLimit: 30,
    coordinates: [
      [-122.4394, 37.7649],
      [-122.4394, 37.7749],
      [-122.4394, 37.7849],
      [-122.4394, 37.7949]
    ]
  },
  {
    id: '19th-ave',
    name: '19th Avenue',
    type: 'arterial',
    speedLimit: 40,
    coordinates: [
      [-122.4744, 37.7549],
      [-122.4744, 37.7649],
      [-122.4744, 37.7749],
      [-122.4744, 37.7849]
    ]
  },
  {
    id: 'mission-st',
    name: 'Mission Street',
    type: 'arterial',
    speedLimit: 30,
    coordinates: [
      [-122.4094, 37.7549],
      [-122.4094, 37.7649],
      [-122.4094, 37.7749],
      [-122.4094, 37.7849]
    ]
  },

  // East-West arterials
  {
    id: 'geary-blvd',
    name: 'Geary Boulevard',
    type: 'arterial',
    speedLimit: 35,
    coordinates: [
      [-122.5094, 37.7849], // West
      [-122.4744, 37.7849],
      [-122.4394, 37.7849],
      [-122.4094, 37.7849]  // East
    ]
  },
  {
    id: 'market-st',
    name: 'Market Street',
    type: 'arterial',
    speedLimit: 25,
    coordinates: [
      [-122.4294, 37.7649],
      [-122.4194, 37.7749],
      [-122.4094, 37.7849],
      [-122.3994, 37.7949]
    ]
  },
  {
    id: 'california-st',
    name: 'California Street',
    type: 'arterial',
    speedLimit: 30,
    coordinates: [
      [-122.4594, 37.7899],
      [-122.4294, 37.7899],
      [-122.3994, 37.7899]
    ]
  },
  {
    id: 'fulton-st',
    name: 'Fulton Street',
    type: 'arterial',
    speedLimit: 35,
    coordinates: [
      [-122.5094, 37.7749],
      [-122.4744, 37.7749],
      [-122.4394, 37.7749],
      [-122.4094, 37.7749]
    ]
  },
  {
    id: 'oak-st',
    name: 'Oak Street',
    type: 'collector',
    speedLimit: 30,
    coordinates: [
      [-122.4694, 37.7699],
      [-122.4494, 37.7699],
      [-122.4294, 37.7699],
      [-122.4094, 37.7699]
    ]
  },

  // Diagonal streets
  {
    id: 'lombard-st',
    name: 'Lombard Street',
    type: 'arterial',
    speedLimit: 30,
    coordinates: [
      [-122.4494, 37.8000],
      [-122.4294, 37.8020],
      [-122.4094, 37.8040]
    ]
  },

  // Additional collectors
  {
    id: '3rd-st',
    name: '3rd Street',
    type: 'collector',
    speedLimit: 30,
    coordinates: [
      [-122.3894, 37.7549],
      [-122.3894, 37.7649],
      [-122.3894, 37.7749],
      [-122.3894, 37.7849]
    ]
  },
  {
    id: 'haight-st',
    name: 'Haight Street',
    type: 'collector',
    speedLimit: 25,
    coordinates: [
      [-122.4594, 37.7699],
      [-122.4394, 37.7699],
      [-122.4194, 37.7699]
    ]
  }
]

/**
 * Get all road network as GeoJSON LineString collection
 */
export function getRoadNetwork() {
  return {
    type: 'FeatureCollection' as const,
    features: sanFranciscoRoads.map(road => ({
      type: 'Feature' as const,
      properties: {
        id: road.id,
        name: road.name,
        type: road.type,
        speedLimit: road.speedLimit
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: road.coordinates
      }
    }))
  }
}

/**
 * Get random road segment
 */
export function getRandomRoad(): RoadSegment {
  return sanFranciscoRoads[Math.floor(Math.random() * sanFranciscoRoads.length)]
}

/**
 * Get roads by type
 */
export function getRoadsByType(type: RoadSegment['type']): RoadSegment[] {
  return sanFranciscoRoads.filter(road => road.type === type)
}
