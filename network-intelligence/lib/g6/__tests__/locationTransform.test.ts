/**
 * Location Network Transformation Tests
 *
 * Tests for location and movement data transformation utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  transformLocationNode,
  transformMovementEdge,
  extractLocationsFromTimeline,
  detectCoLocation,
  transformLocationNetworkToG6
} from '../utils/locationTransform'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import type { LocationNode, MovementEdge } from '../utils/locationTransform'

const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'Arrived at Central Park',
    type: 'movement',
    timestamp: new Date('2024-01-01T09:00:00Z'),
    significance: 'routine',
    location: { name: 'Central Park', coordinates: [-73.9654, 40.7829] }
  },
  {
    id: 'evt-2',
    title: 'Meeting at Central Park',
    type: 'meeting',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    significance: 'high',
    location: { name: 'Central Park', coordinates: [-73.9654, 40.7829] }
  },
  {
    id: 'evt-3',
    title: 'Moved to Times Square',
    type: 'movement',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    significance: 'routine',
    location: { name: 'Times Square', coordinates: [-73.9855, 40.7580] }
  },
  {
    id: 'evt-4',
    title: 'Returned to Central Park',
    type: 'movement',
    timestamp: new Date('2024-01-01T15:00:00Z'),
    significance: 'suspicious',
    location: { name: 'Central Park', coordinates: [-73.9654, 40.7829] }
  }
]

describe('LocationTransform', () => {
  describe('transformLocationNode', () => {
    it('should transform location to G6 node', () => {
      const location: LocationNode = {
        id: 'central-park',
        name: 'Central Park',
        type: 'location',
        coordinates: [-73.9654, 40.7829],
        visitCount: 2
      }

      const node = transformLocationNode(location)

      expect(node).toHaveProperty('id', 'central-park')
      expect(node).toHaveProperty('label', 'Central Park')
      expect(node).toHaveProperty('type', 'circle')
      expect(node).toHaveProperty('originalData', location)
    })

    it('should identify hotspots (4+ visits)', () => {
      const hotspot: LocationNode = {
        id: 'hotspot',
        name: 'Hotspot Location',
        type: 'location',
        visitCount: 5
      }

      const node = transformLocationNode(hotspot)

      expect(node.size).toBe(56) // Hotspot size
      expect(node.style).toHaveProperty('shadowBlur', 12)
      expect(node.style?.fill).toBe('#ef4444') // red for hotspots
    })

    it('should style regular locations', () => {
      const location: LocationNode = {
        id: 'loc',
        name: 'Location',
        type: 'location',
        visitCount: 2
      }

      const node = transformLocationNode(location)

      expect(node.size).toBe(40) // Regular size
      expect(node.style?.fill).toBe('#10b981') // emerald for regular locations
    })
  })

  describe('transformMovementEdge', () => {
    it('should transform movement to G6 edge', () => {
      const movement: MovementEdge = {
        from: 'loc-a',
        to: 'loc-b',
        subjectId: 'subject-1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        frequency: 1
      }

      const edge = transformMovementEdge(movement)

      expect(edge).toHaveProperty('source', 'loc-a')
      expect(edge).toHaveProperty('target', 'loc-b')
      expect(edge).toHaveProperty('type', 'line')
      expect(edge).toHaveProperty('originalData', movement)
    })

    it('should scale line width with frequency', () => {
      const lowFreq: MovementEdge = {
        from: 'a',
        to: 'b',
        subjectId: 'subj',
        timestamp: new Date(),
        frequency: 1
      }

      const highFreq: MovementEdge = {
        from: 'a',
        to: 'b',
        subjectId: 'subj',
        timestamp: new Date(),
        frequency: 10
      }

      const lowEdge = transformMovementEdge(lowFreq)
      const highEdge = transformMovementEdge(highFreq)

      expect(highEdge.style?.lineWidth).toBeGreaterThan(lowEdge.style?.lineWidth || 0)
    })
  })

  describe('extractLocationsFromTimeline', () => {
    it('should extract unique locations from events', () => {
      const { locations, movements } = extractLocationsFromTimeline(
        mockTimelineEvents,
        'subject-1'
      )

      expect(locations.length).toBe(2) // Central Park and Times Square
      expect(locations.find(l => l.name === 'Central Park')).toBeDefined()
      expect(locations.find(l => l.name === 'Times Square')).toBeDefined()
    })

    it('should count visits correctly', () => {
      const { locations } = extractLocationsFromTimeline(
        mockTimelineEvents,
        'subject-1'
      )

      const centralPark = locations.find(l => l.name === 'Central Park')
      expect(centralPark?.visitCount).toBe(3) // Visited 3 times
    })

    it('should extract movements between locations', () => {
      const { movements } = extractLocationsFromTimeline(
        mockTimelineEvents,
        'subject-1'
      )

      expect(movements.length).toBeGreaterThan(0)
      expect(movements[0]).toHaveProperty('from')
      expect(movements[0]).toHaveProperty('to')
      expect(movements[0]).toHaveProperty('subjectId', 'subject-1')
    })

    it('should track movement frequency', () => {
      const { movements } = extractLocationsFromTimeline(
        mockTimelineEvents,
        'subject-1'
      )

      // Check if repeated movements have higher frequency
      const repeatedMovement = movements.find(
        m => m.from === 'Times Square' && m.to === 'Central Park'
      )

      expect(repeatedMovement?.frequency).toBeGreaterThanOrEqual(1)
    })
  })

  describe('detectCoLocation', () => {
    it('should detect when multiple subjects are at same location', () => {
      const eventsMap = new Map<string, TimelineEvent[]>([
        ['subject-1', mockTimelineEvents.slice(0, 2)],
        ['subject-2', [
          {
            id: 'evt-5',
            title: 'Subject 2 at Central Park',
            type: 'movement',
            timestamp: new Date('2024-01-01T09:30:00Z'),
            significance: 'routine',
            location: { name: 'Central Park', coordinates: [-73.9654, 40.7829] }
          }
        ]]
      ])

      const coLocations = detectCoLocation(eventsMap)

      expect(coLocations.length).toBeGreaterThan(0)
      const centralParkCoLoc = coLocations.find(c => c.location === 'Central Park')
      expect(centralParkCoLoc).toBeDefined()
      expect(centralParkCoLoc?.subjects).toContain('subject-1')
      expect(centralParkCoLoc?.subjects).toContain('subject-2')
    })
  })

  describe('transformLocationNetworkToG6', () => {
    it('should create complete graph data structure', () => {
      const locations: LocationNode[] = [
        { id: 'loc-1', name: 'Location 1', type: 'location', visitCount: 1 },
        { id: 'loc-2', name: 'Location 2', type: 'location', visitCount: 1 }
      ]

      const movements: MovementEdge[] = [
        {
          from: 'loc-1',
          to: 'loc-2',
          subjectId: 'subj',
          timestamp: new Date(),
          frequency: 1
        }
      ]

      const graphData = transformLocationNetworkToG6(locations, movements)

      expect(graphData).toHaveProperty('nodes')
      expect(graphData).toHaveProperty('edges')
      expect(graphData.nodes).toHaveLength(2)
      expect(graphData.edges).toHaveLength(1)
    })
  })
})
