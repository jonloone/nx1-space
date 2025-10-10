/**
 * Road-Aware Fleet Generator
 *
 * Uses Turf.js to place vehicles on actual roads and simulate realistic movement
 */

import * as turf from '@turf/turf'
import type { SpatialEntity, EntityStatus } from '@/lib/models/SpatialEntity'
import { createVehicleEntity } from '@/lib/models/SpatialEntity'
import { sanFranciscoRoads, getRandomRoad, type RoadSegment } from '@/lib/data/sanFranciscoRoads'

export interface VehicleRoute {
  vehicleId: string
  roadSegment: RoadSegment
  currentPosition: number // 0-1 along the route
  direction: 1 | -1 // forward or backward
  targetSpeed: number // mph
}

// Store vehicle routes
const vehicleRoutes = new Map<string, VehicleRoute>()

/**
 * Generate fleet with vehicles placed on actual roads
 */
export function generateRoadAwareFleet(count: number): SpatialEntity[] {
  const vehicles: SpatialEntity[] = []
  vehicleRoutes.clear()

  for (let i = 0; i < count; i++) {
    try {
      const vehicleId = `VEH-${String(i + 1).padStart(4, '0')}`

      // Pick a random road
      const road = getRandomRoad()
      const roadLine = turf.lineString(road.coordinates)

      // Validate road has sufficient length
      const roadLength = turf.length(roadLine, { units: 'kilometers' })
      if (roadLength < 0.001) {
        console.warn(`Road ${road.name} has invalid length, skipping vehicle ${i}`)
        continue
      }

      // Place vehicle at random position along road (0-1)
      const position = Math.random()
      const point = turf.along(roadLine, position * roadLength, { units: 'kilometers' })

      // Validate point coordinates
      if (!point || !point.geometry || !point.geometry.coordinates || point.geometry.coordinates.length !== 2) {
        console.warn(`Invalid point generated for vehicle ${i}, skipping`)
        continue
      }

      // Random direction
      const direction = Math.random() > 0.5 ? 1 : -1

      // Speed based on road type and randomness
      const baseSpeed = road.speedLimit
      const speedVariation = baseSpeed * 0.3 // ±30%
      const targetSpeed = baseSpeed + (Math.random() - 0.5) * speedVariation

      // Random status
      const status = getRandomStatus()

      // Get vehicle type and properties
      const vehicleType = getRandomVehicleType()
      const driver = generateRandomDriver()

      // Calculate heading safely
      const heading = calculateHeading(roadLine, position, direction)

      // Create vehicle entity
      const vehicle = createVehicleEntity(
        vehicleId,
        `Vehicle ${i + 1}`,
        point.geometry.coordinates[0],
        point.geometry.coordinates[1],
        {
          driver,
          vehicleType,
          speed: Math.round(targetSpeed),
          heading,
          route: road.name,
          odometer: Math.floor(Math.random() * 100000),
          fuelLevel: Math.floor(Math.random() * 100),
          capacity: getVehicleCapacity(vehicleType),
          currentLoad: Math.floor(Math.random() * 100),
          roadName: road.name,
          roadType: road.type
        }
      )

      vehicle.status = status
      vehicle.motion = {
        speed: Math.round(targetSpeed),
        heading,
        course: heading
      }

      vehicle.style = {
        color: getStatusColor(status),
        size: 8,
        opacity: 1
      }

      // Store route info
      vehicleRoutes.set(vehicleId, {
        vehicleId,
        roadSegment: road,
        currentPosition: position,
        direction,
        targetSpeed
      })

      vehicles.push(vehicle)
    } catch (error) {
      console.error(`Error generating vehicle ${i}:`, error)
      // Continue to next vehicle
    }
  }

  return vehicles
}

/**
 * Update vehicle positions along roads
 */
export function updateRoadAwarePositions(
  vehicles: SpatialEntity[],
  deltaTimeSeconds: number
): SpatialEntity[] {
  return vehicles.map((vehicle) => {
    if (vehicle.status !== 'active' || !vehicle.motion) {
      return vehicle
    }

    const route = vehicleRoutes.get(vehicle.id)
    if (!route) {
      return vehicle // No route info, don't move
    }

    const { roadSegment, currentPosition, direction, targetSpeed } = route
    const roadLine = turf.lineString(roadSegment.coordinates)
    const roadLength = turf.length(roadLine, { units: 'kilometers' })

    // Calculate distance moved (speed is in mph, convert to km)
    const speedKmh = targetSpeed * 1.60934
    const distanceKm = (speedKmh / 3600) * deltaTimeSeconds

    // Update position along road (0-1)
    const positionDelta = (distanceKm / roadLength) * direction
    let newPosition = currentPosition + positionDelta

    // Handle road endpoints (reverse direction or switch roads)
    if (newPosition > 1 || newPosition < 0) {
      // For now, reverse direction at endpoints
      route.direction *= -1
      newPosition = Math.max(0, Math.min(1, newPosition))

      // TODO: In future, switch to connected road segment
    }

    // Update route position
    route.currentPosition = newPosition
    vehicleRoutes.set(vehicle.id, route)

    // Get new coordinates along road
    const newPoint = turf.along(roadLine, newPosition * roadLength, { units: 'kilometers' })
    const heading = calculateHeading(roadLine, newPosition, direction)

    return {
      ...vehicle,
      position: {
        longitude: newPoint.geometry.coordinates[0],
        latitude: newPoint.geometry.coordinates[1],
        timestamp: new Date()
      },
      motion: {
        ...vehicle.motion,
        speed: Math.round(targetSpeed),
        heading,
        course: heading
      },
      lastUpdate: new Date()
    }
  })
}

/**
 * Calculate heading (bearing) at a point along a line
 */
function calculateHeading(line: turf.Feature<turf.LineString>, position: number, direction: number): number {
  const length = turf.length(line, { units: 'kilometers' })
  const currentDist = position * length

  // Get a small distance ahead/behind for bearing calculation
  const delta = 0.01 // 10 meters

  // Clamp the distances to valid range [0, length]
  const dist1 = Math.max(0, Math.min(length, currentDist))
  const dist2 = Math.max(0, Math.min(length, currentDist + (delta * direction)))

  // If both points are the same, use a slightly different approach
  if (Math.abs(dist1 - dist2) < 0.001) {
    // Use the line's first and last point to get general direction
    const coords = line.geometry.coordinates
    if (coords.length < 2) return 0

    const bearing = turf.bearing(
      coords[0],
      coords[coords.length - 1]
    )
    return (bearing + 360) % 360
  }

  const point1 = turf.along(line, dist1, { units: 'kilometers' })
  const point2 = turf.along(line, dist2, { units: 'kilometers' })

  const bearing = turf.bearing(
    point1.geometry.coordinates,
    point2.geometry.coordinates
  )

  // Convert to 0-360
  return (bearing + 360) % 360
}

/**
 * Helper functions
 */

function getRandomStatus(): EntityStatus {
  const rand = Math.random()
  if (rand < 0.70) return 'active'  // 70% active
  if (rand < 0.85) return 'idle'    // 15% idle
  if (rand < 0.95) return 'alert'   // 10% alert
  return 'maintenance'                // 5% maintenance
}

const driverNames = [
  'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Wilson',
  'David Brown', 'Lisa Anderson', 'James Taylor', 'Maria Garcia',
  'Robert Martinez', 'Jennifer Lee', 'Chris Wang', 'Amanda Chen',
  'Michael Rodriguez', 'Jessica Kim', 'Daniel Nguyen', 'Laura Patel'
]

function generateRandomDriver(): string {
  return driverNames[Math.floor(Math.random() * driverNames.length)]
}

const vehicleTypes = ['van', 'truck', 'semi', 'bike']

function getRandomVehicleType(): string {
  const rand = Math.random()
  if (rand < 0.50) return 'van'   // 50% vans
  if (rand < 0.80) return 'truck' // 30% trucks
  if (rand < 0.95) return 'bike'  // 15% bikes
  return 'semi'                    // 5% semis
}

function getVehicleCapacity(type: string): number {
  switch (type) {
    case 'bike': return 50
    case 'van': return 1000
    case 'truck': return 5000
    case 'semi': return 20000
    default: return 1000
  }
}

function getStatusColor(status: EntityStatus): string {
  switch (status) {
    case 'active': return '#10b981'    // green
    case 'idle': return '#fbbf24'      // yellow
    case 'maintenance': return '#f97316' // orange
    case 'offline': return '#6b7280'   // gray
    case 'alert':
    case 'warning':
    case 'critical': return '#ef4444' // red
    default: return '#3b82f6'         // blue
  }
}
