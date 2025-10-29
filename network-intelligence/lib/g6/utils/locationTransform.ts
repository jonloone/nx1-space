/**
 * Location Network Transformation Utilities
 *
 * Transform location and movement data to G6 graph format
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'

export interface LocationNode {
  id: string
  name: string
  type: 'location' | 'subject'
  coordinates?: [number, number]
  visitCount?: number
  subjects?: string[]
}

export interface MovementEdge {
  from: string
  to: string
  subjectId: string
  timestamp: Date
  frequency: number
}

/**
 * Transform location node to G6 format
 */
export function transformLocationNode(location: LocationNode): NodeConfig {
  const isHotspot = (location.visitCount || 0) > 3
  const size = location.type === 'subject' ? 48 :
               isHotspot ? 56 : 40

  return {
    id: location.id,
    label: location.name,
    type: 'circle',
    size,
    style: {
      fill: location.type === 'subject' ? '#3b82f6' :
            isHotspot ? '#ef4444' : '#10b981',
      stroke: location.type === 'subject' ? '#2563eb' :
              isHotspot ? '#dc2626' : '#059669',
      lineWidth: 3,
      cursor: 'pointer',
      ...(isHotspot && {
        shadowColor: '#ef4444',
        shadowBlur: 12
      })
    },
    labelCfg: {
      position: 'bottom',
      offset: 8,
      style: {
        fontSize: 11,
        fontWeight: 600,
        fill: '#111827',
        background: {
          fill: '#ffffff',
          padding: [4, 6, 4, 6],
          radius: 4
        }
      }
    },
    originalData: location
  }
}

/**
 * Transform movement edge to G6 format
 */
export function transformMovementEdge(movement: MovementEdge): EdgeConfig {
  const lineWidth = Math.min(2 + movement.frequency / 2, 6)

  return {
    source: movement.from,
    target: movement.to,
    id: `${movement.from}-${movement.to}-${movement.subjectId}`,
    type: 'line',
    style: {
      stroke: '#8b5cf6',
      lineWidth,
      opacity: 0.7,
      endArrow: {
        path: 'M 0,0 L 8,4 L 8,-4 Z',
        fill: '#8b5cf6'
      }
    },
    labelCfg: {
      autoRotate: true,
      style: {
        fontSize: 9,
        fill: '#6b7280',
        background: {
          fill: '#ffffff',
          padding: [2, 4, 2, 4],
          radius: 3
        }
      }
    },
    label: movement.frequency > 1 ? `${movement.frequency}x` : undefined,
    originalData: movement
  }
}

/**
 * Extract locations and movements from timeline events
 */
export function extractLocationsFromTimeline(
  events: TimelineEvent[],
  subjectId: string
): { locations: LocationNode[]; movements: MovementEdge[] } {
  const locationMap = new Map<string, LocationNode>()
  const movements: MovementEdge[] = []

  // Sort events chronologically
  const sortedEvents = [...events]
    .filter(e => e.location)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Extract locations
  sortedEvents.forEach(event => {
    if (event.location) {
      const locId = event.location.name

      if (!locationMap.has(locId)) {
        locationMap.set(locId, {
          id: locId,
          name: event.location.name,
          type: 'location',
          coordinates: event.location.coordinates,
          visitCount: 1,
          subjects: [subjectId]
        })
      } else {
        const loc = locationMap.get(locId)!
        loc.visitCount = (loc.visitCount || 0) + 1
      }
    }
  })

  // Extract movements
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i]
    const next = sortedEvents[i + 1]

    if (current.location && next.location) {
      const fromId = current.location.name
      const toId = next.location.name

      if (fromId !== toId) {
        // Check if movement already exists
        const existingMovement = movements.find(
          m => m.from === fromId && m.to === toId && m.subjectId === subjectId
        )

        if (existingMovement) {
          existingMovement.frequency++
        } else {
          movements.push({
            from: fromId,
            to: toId,
            subjectId,
            timestamp: next.timestamp,
            frequency: 1
          })
        }
      }
    }
  }

  return {
    locations: Array.from(locationMap.values()),
    movements
  }
}

/**
 * Detect co-location (subjects at same place)
 */
export function detectCoLocation(
  eventsMap: Map<string, TimelineEvent[]>
): Array<{ location: string; subjects: string[]; timeWindow: Date[] }> {
  const coLocations: Array<{ location: string; subjects: string[]; timeWindow: Date[] }> = []
  const locationTimestamps = new Map<string, Map<string, Date[]>>()

  // Build location -> subject -> timestamps map
  eventsMap.forEach((events, subjectId) => {
    events.forEach(event => {
      if (event.location) {
        const locName = event.location.name

        if (!locationTimestamps.has(locName)) {
          locationTimestamps.set(locName, new Map())
        }

        const subjectMap = locationTimestamps.get(locName)!
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, [])
        }

        subjectMap.get(subjectId)!.push(event.timestamp)
      }
    })
  })

  // Find co-locations (2+ subjects at same location within time window)
  locationTimestamps.forEach((subjectMap, location) => {
    if (subjectMap.size >= 2) {
      const subjects = Array.from(subjectMap.keys())
      const allTimestamps = Array.from(subjectMap.values()).flat()

      coLocations.push({
        location,
        subjects,
        timeWindow: [
          new Date(Math.min(...allTimestamps.map(t => t.getTime()))),
          new Date(Math.max(...allTimestamps.map(t => t.getTime())))
        ]
      })
    }
  })

  return coLocations
}

/**
 * Transform location data to G6 graph
 */
export function transformLocationNetworkToG6(
  locations: LocationNode[],
  movements: MovementEdge[]
): GraphData {
  return {
    nodes: locations.map(loc => transformLocationNode(loc)),
    edges: movements.map(mov => transformMovementEdge(mov))
  }
}
