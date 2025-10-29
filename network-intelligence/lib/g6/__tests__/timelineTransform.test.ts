/**
 * Timeline Transformation Tests
 *
 * Tests for timeline event to G6 graph transformation utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  transformTimelineEvent,
  detectCausalRelationships,
  transformTimelineToG6,
  filterBySignificance,
  filterByEventType,
  getTimelineStats
} from '../utils/timelineTransform'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'

// Mock timeline events
const mockEvents: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'Arrived at Location A',
    type: 'movement',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    significance: 'routine',
    location: { name: 'Location A', coordinates: [-74.006, 40.7128] },
    description: 'Subject arrived at Location A'
  },
  {
    id: 'evt-2',
    title: 'Met with Person B',
    type: 'meeting',
    timestamp: new Date('2024-01-01T10:30:00Z'),
    significance: 'high',
    location: { name: 'Location A', coordinates: [-74.006, 40.7128] },
    participants: ['Subject', 'Person B'],
    description: 'Meeting at same location'
  },
  {
    id: 'evt-3',
    title: 'Anomalous Activity Detected',
    type: 'anomaly',
    timestamp: new Date('2024-01-01T15:00:00Z'),
    significance: 'critical',
    location: { name: 'Location B', coordinates: [-73.9712, 40.7831] },
    description: 'Unusual behavior detected'
  },
  {
    id: 'evt-4',
    title: 'Communication with Person C',
    type: 'communication',
    timestamp: new Date('2024-01-02T09:00:00Z'),
    significance: 'medium',
    participants: ['Subject', 'Person C'],
    description: 'Phone call'
  }
]

describe('TimelineTransform', () => {
  describe('transformTimelineEvent', () => {
    it('should transform event to G6 node format', () => {
      const node = transformTimelineEvent(mockEvents[0], 0)

      expect(node).toHaveProperty('id', 'evt-1')
      expect(node).toHaveProperty('label', 'Arrived at Location A')
      expect(node).toHaveProperty('type', 'circle')
      expect(node).toHaveProperty('size')
      expect(node).toHaveProperty('style')
      expect(node).toHaveProperty('originalData', mockEvents[0])
    })

    it('should apply critical styling for critical events', () => {
      const node = transformTimelineEvent(mockEvents[2], 2)

      expect(node.size).toBe(56) // Critical events are larger
      expect(node.style).toHaveProperty('shadowBlur')
      expect(node.style?.lineWidth).toBe(4)
    })

    it('should apply anomaly styling', () => {
      const node = transformTimelineEvent(mockEvents[2], 2)

      expect(node.style?.fill).toBe('#dc2626') // red for critical/anomaly
    })
  })

  describe('detectCausalRelationships', () => {
    it('should detect temporal relationships', () => {
      const edges = detectCausalRelationships(mockEvents)

      expect(edges.length).toBeGreaterThan(0)
      edges.forEach(edge => {
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(edge).toHaveProperty('relationship')
        expect(['temporal', 'causal', 'concurrent']).toContain(edge.relationship)
      })
    })

    it('should detect concurrent relationships (events within 1 hour)', () => {
      const edges = detectCausalRelationships(mockEvents)
      const concurrentEdge = edges.find(e => e.relationship === 'concurrent')

      // Events 1 and 2 are 30 minutes apart
      expect(concurrentEdge).toBeDefined()
      expect(concurrentEdge?.confidence).toBeGreaterThan(0.8)
    })

    it('should detect causal relationships (same location)', () => {
      const edges = detectCausalRelationships(mockEvents)
      const causalEdge = edges.find(e => e.relationship === 'causal')

      // Events 1 and 2 are at same location
      expect(causalEdge).toBeDefined()
      expect(causalEdge?.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should create edges with correct structure', () => {
      const edges = detectCausalRelationships(mockEvents)
      const edge = edges[0]

      expect(edge).toHaveProperty('source')
      expect(edge).toHaveProperty('target')
      expect(edge).toHaveProperty('id')
      expect(edge).toHaveProperty('type', 'line')
      expect(edge).toHaveProperty('style')
      expect(edge.style).toHaveProperty('stroke')
      expect(edge.style).toHaveProperty('lineWidth')
    })
  })

  describe('transformTimelineToG6', () => {
    it('should transform events to complete graph data', () => {
      const graphData = transformTimelineToG6(mockEvents)

      expect(graphData).toHaveProperty('nodes')
      expect(graphData).toHaveProperty('edges')
      expect(graphData.nodes).toHaveLength(mockEvents.length)
      expect(graphData.edges).toHaveLength(mockEvents.length - 1) // N-1 sequential edges
    })

    it('should preserve original data in nodes', () => {
      const graphData = transformTimelineToG6(mockEvents)

      graphData.nodes?.forEach((node, index) => {
        expect((node as any).originalData).toEqual(mockEvents[index])
      })
    })
  })

  describe('filterBySignificance', () => {
    it('should filter nodes by significance', () => {
      const graphData = transformTimelineToG6(mockEvents)
      const filtered = filterBySignificance(graphData, ['critical', 'high'])

      expect(filtered.nodes?.length).toBe(2) // Only critical and high events
      filtered.nodes?.forEach(node => {
        const data = (node as any).originalData as TimelineEvent
        expect(['critical', 'high']).toContain(data.significance)
      })
    })

    it('should filter edges to match filtered nodes', () => {
      const graphData = transformTimelineToG6(mockEvents)
      const filtered = filterBySignificance(graphData, ['critical'])

      // Only 1 critical event, so no edges possible
      expect(filtered.edges?.length).toBe(0)
    })
  })

  describe('filterByEventType', () => {
    it('should filter nodes by event type', () => {
      const graphData = transformTimelineToG6(mockEvents)
      const filtered = filterByEventType(graphData, ['movement', 'meeting'])

      expect(filtered.nodes?.length).toBe(2)
      filtered.nodes?.forEach(node => {
        const data = (node as any).originalData as TimelineEvent
        expect(['movement', 'meeting']).toContain(data.type)
      })
    })
  })

  describe('getTimelineStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getTimelineStats(mockEvents)

      expect(stats.totalEvents).toBe(4)
      expect(stats.eventTypes).toHaveProperty('movement', 1)
      expect(stats.eventTypes).toHaveProperty('meeting', 1)
      expect(stats.eventTypes).toHaveProperty('anomaly', 1)
      expect(stats.eventTypes).toHaveProperty('communication', 1)
      expect(stats.significanceLevels).toHaveProperty('critical', 1)
      expect(stats.significanceLevels).toHaveProperty('high', 1)
      expect(stats.timespanDays).toBeGreaterThan(0)
    })

    it('should identify earliest and latest events', () => {
      const stats = getTimelineStats(mockEvents)

      expect(stats.earliestEvent).toEqual(mockEvents[0].timestamp)
      expect(stats.latestEvent).toEqual(mockEvents[3].timestamp)
    })
  })
})
