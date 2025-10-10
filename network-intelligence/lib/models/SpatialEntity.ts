/**
 * SpatialEntity - Universal data model for operational intelligence
 *
 * Represents any entity with a location (moving or stationary):
 * - Vehicles (fleet tracking)
 * - Ships (maritime)
 * - Aircraft (aviation)
 * - Satellites (space operations)
 * - Ground stations (infrastructure)
 * - Personnel (field operations)
 * - Assets (IoT devices, sensors)
 */

export type EntityType =
  | 'vehicle'
  | 'vessel'
  | 'aircraft'
  | 'satellite'
  | 'ground-station'
  | 'personnel'
  | 'sensor'
  | 'zone'
  | 'route'
  | 'waypoint'
  | 'custom'

export type EntityStatus =
  | 'active'
  | 'inactive'
  | 'idle'
  | 'maintenance'
  | 'offline'
  | 'alert'
  | 'warning'
  | 'critical'
  | 'unknown'

export interface Position {
  longitude: number
  latitude: number
  altitude?: number // meters above sea level
  accuracy?: number // meters
  timestamp: Date
}

export interface Motion {
  speed?: number // km/h or knots
  heading?: number // degrees (0-360)
  course?: number // degrees (0-360)
  verticalSpeed?: number // m/s
  acceleration?: number // m/s²
}

export interface GeometryData {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
  coordinates: number[] | number[][] | number[][][]
}

/**
 * Core SpatialEntity interface
 * All operational intelligence entities must implement this
 */
export interface SpatialEntity {
  // Identity
  id: string
  type: EntityType
  name: string
  category?: string // e.g., "Delivery Van", "Container Ship", "LEO Satellite"

  // Location & Motion
  position: Position
  motion?: Motion
  geometry?: GeometryData // For zones, routes, etc.

  // Status
  status: EntityStatus
  lastUpdate: Date

  // Metadata
  properties: Record<string, any>
  tags?: string[]

  // Relationships
  parentId?: string // Parent entity (e.g., fleet ID)
  childIds?: string[] // Child entities

  // Visual styling
  style?: {
    color?: string
    icon?: string
    size?: number
    opacity?: number
    zIndex?: number
  }
}

/**
 * Extended entity with history tracking
 */
export interface TrackedEntity extends SpatialEntity {
  history: {
    positions: Position[]
    events: EntityEvent[]
  }
  predictions?: {
    futurePositions: Position[]
    estimatedArrival?: Date
    confidence?: number
  }
}

/**
 * Entity event (for history tracking)
 */
export interface EntityEvent {
  id: string
  timestamp: Date
  type: 'status_change' | 'alert' | 'geofence' | 'maintenance' | 'custom'
  description: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

/**
 * Entity collection (e.g., fleet, convoy, constellation)
 */
export interface EntityCollection {
  id: string
  name: string
  type: string
  entityIds: string[]
  properties: Record<string, any>
  created: Date
  updated: Date
}

/**
 * Type guards
 */
export function isMovingEntity(entity: SpatialEntity): boolean {
  return !!(entity.motion && (entity.motion.speed || entity.motion.heading))
}

export function isStationaryEntity(entity: SpatialEntity): boolean {
  return !isMovingEntity(entity)
}

export function isAlertStatus(entity: SpatialEntity): boolean {
  return ['alert', 'warning', 'critical'].includes(entity.status)
}

/**
 * Entity factory helpers
 */
export function createSpatialEntity(
  id: string,
  type: EntityType,
  name: string,
  position: Position,
  properties: Record<string, any> = {}
): SpatialEntity {
  return {
    id,
    type,
    name,
    position,
    status: 'active',
    lastUpdate: new Date(),
    properties
  }
}

export function createVehicleEntity(
  id: string,
  name: string,
  lng: number,
  lat: number,
  properties: Record<string, any> = {}
): SpatialEntity {
  return createSpatialEntity(
    id,
    'vehicle',
    name,
    { longitude: lng, latitude: lat, timestamp: new Date() },
    {
      ...properties,
      category: properties.category || 'Vehicle'
    }
  )
}

export function createVesselEntity(
  id: string,
  name: string,
  lng: number,
  lat: number,
  properties: Record<string, any> = {}
): SpatialEntity {
  return createSpatialEntity(
    id,
    'vessel',
    name,
    { longitude: lng, latitude: lat, timestamp: new Date() },
    {
      ...properties,
      category: properties.category || 'Vessel'
    }
  )
}

/**
 * Position utilities
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  // Haversine formula - returns distance in km
  const R = 6371 // Earth's radius in km
  const dLat = toRad(pos2.latitude - pos1.latitude)
  const dLon = toRad(pos2.longitude - pos1.longitude)
  const lat1 = toRad(pos1.latitude)
  const lat2 = toRad(pos2.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function calculateBearing(pos1: Position, pos2: Position): number {
  // Returns bearing in degrees (0-360)
  const dLon = toRad(pos2.longitude - pos1.longitude)
  const lat1 = toRad(pos1.latitude)
  const lat2 = toRad(pos2.latitude)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const bearing = toDeg(Math.atan2(y, x))
  return (bearing + 360) % 360
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI
}
