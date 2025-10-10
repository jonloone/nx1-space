/**
 * Fleet Data Generator
 *
 * Generates realistic demo data for fleet tracking operations
 */

import type { SpatialEntity, EntityStatus } from '@/lib/models/SpatialEntity'
import { createVehicleEntity } from '@/lib/models/SpatialEntity'

export interface FleetGeneratorOptions {
  count: number
  centerLat: number
  centerLng: number
  radius: number // km
  speedRange?: [number, number] // km/h
  statuses?: EntityStatus[]
}

/**
 * Generate random fleet of vehicles
 */
export function generateFleetData(options: FleetGeneratorOptions): SpatialEntity[] {
  const {
    count,
    centerLat,
    centerLng,
    radius,
    speedRange = [0, 80],
    statuses = ['active', 'idle', 'maintenance']
  } = options

  const vehicles: SpatialEntity[] = []

  for (let i = 0; i < count; i++) {
    const vehicleId = `VEH-${String(i + 1).padStart(4, '0')}`
    const position = generateRandomPosition(centerLat, centerLng, radius)
    const speed = randomInRange(speedRange[0], speedRange[1])
    const heading = Math.floor(Math.random() * 360)
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const vehicle = createVehicleEntity(
      vehicleId,
      `Vehicle ${i + 1}`,
      position.lng,
      position.lat,
      {
        driver: generateRandomDriver(),
        vehicleType: getRandomVehicleType(),
        speed: Math.round(speed),
        heading,
        route: `Route ${String.fromCharCode(65 + (i % 26))}`,
        odometer: Math.floor(Math.random() * 100000),
        fuelLevel: Math.floor(Math.random() * 100),
        capacity: getVehicleCapacity(getRandomVehicleType()),
        currentLoad: Math.floor(Math.random() * 100)
      }
    )

    vehicle.status = status
    vehicle.motion = {
      speed,
      heading,
      course: heading
    }

    vehicle.style = {
      color: getStatusColor(status),
      size: 8,
      opacity: 1
    }

    vehicles.push(vehicle)
  }

  return vehicles
}

/**
 * Generate San Francisco demo fleet (200 vehicles)
 */
export function generateSanFranciscoFleet(): SpatialEntity[] {
  return generateFleetData({
    count: 200,
    centerLat: 37.7749,
    centerLng: -122.4194,
    radius: 15, // 15km radius
    speedRange: [0, 70],
    statuses: ['active', 'idle', 'alert']
  })
}

/**
 * Generate New York demo fleet (150 vehicles)
 */
export function generateNewYorkFleet(): SpatialEntity[] {
  return generateFleetData({
    count: 150,
    centerLat: 40.7128,
    centerLng: -74.0060,
    radius: 20,
    speedRange: [0, 60],
    statuses: ['active', 'idle', 'maintenance', 'alert']
  })
}

/**
 * Update vehicle positions (simulate movement)
 */
export function updateVehiclePositions(
  vehicles: SpatialEntity[],
  deltaTime: number // seconds
): SpatialEntity[] {
  return vehicles.map((vehicle) => {
    if (!vehicle.motion || vehicle.status !== 'active') {
      return vehicle
    }

    const { speed = 0, heading = 0 } = vehicle.motion
    const speedMs = (speed * 1000) / 3600 // Convert km/h to m/s
    const distance = speedMs * deltaTime // meters

    // Calculate new position
    const newPosition = movePosition(
      vehicle.position.latitude,
      vehicle.position.longitude,
      distance,
      heading
    )

    return {
      ...vehicle,
      position: {
        ...vehicle.position,
        latitude: newPosition.lat,
        longitude: newPosition.lng,
        timestamp: new Date()
      },
      lastUpdate: new Date()
    }
  })
}

/**
 * Helper functions
 */

function generateRandomPosition(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { lat: number; lng: number } {
  const radiusDeg = radiusKm / 111 // Rough conversion: 1 degree ≈ 111 km
  const angle = Math.random() * 2 * Math.PI
  const r = Math.sqrt(Math.random()) * radiusDeg

  return {
    lat: centerLat + r * Math.cos(angle),
    lng: centerLng + r * Math.sin(angle)
  }
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

const driverNames = [
  'John Smith',
  'Sarah Johnson',
  'Mike Davis',
  'Emily Wilson',
  'David Brown',
  'Lisa Anderson',
  'James Taylor',
  'Maria Garcia',
  'Robert Martinez',
  'Jennifer Lee'
]

function generateRandomDriver(): string {
  return driverNames[Math.floor(Math.random() * driverNames.length)]
}

const vehicleTypes = ['van', 'truck', 'semi', 'bike']

function getRandomVehicleType(): string {
  return vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
}

function getVehicleCapacity(type: string): number {
  switch (type) {
    case 'bike':
      return 50
    case 'van':
      return 1000
    case 'truck':
      return 5000
    case 'semi':
      return 20000
    default:
      return 1000
  }
}

function getStatusColor(status: EntityStatus): string {
  switch (status) {
    case 'active':
      return '#10b981' // green
    case 'idle':
      return '#fbbf24' // yellow
    case 'maintenance':
      return '#f97316' // orange
    case 'offline':
      return '#6b7280' // gray
    case 'alert':
    case 'warning':
    case 'critical':
      return '#ef4444' // red
    default:
      return '#3b82f6' // blue
  }
}

/**
 * Move a position by distance and bearing
 */
function movePosition(
  lat: number,
  lng: number,
  distanceMeters: number,
  bearingDegrees: number
): { lat: number; lng: number } {
  const R = 6371000 // Earth's radius in meters
  const bearing = (bearingDegrees * Math.PI) / 180
  const lat1 = (lat * Math.PI) / 180
  const lng1 = (lng * Math.PI) / 180

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) +
      Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(bearing)
  )

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distanceMeters / R) * Math.cos(lat1),
      Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
    )

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI
  }
}
