/**
 * Timeline Data Transformation Utilities
 *
 * Transform timeline events to G6 graph format for temporal visualization
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import { CITIZENS360_COLORS } from '../config/styles'

// Event type to color mapping
export const EVENT_TYPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  movement: { fill: '#10b981', stroke: '#059669' }, // emerald
  communication: { fill: '#3b82f6', stroke: '#2563eb' }, // blue
  meeting: { fill: '#8b5cf6', stroke: '#7c3aed' }, // purple
  financial: { fill: '#f59e0b', stroke: '#d97706' }, // amber
  digital: { fill: '#06b6d4', stroke: '#0891b2' }, // cyan
  location: { fill: '#10b981', stroke: '#059669' }, // emerald
  status: { fill: '#6b7280', stroke: '#4b5563' } // gray
}

// Significance to color mapping
export const SIGNIFICANCE_COLORS: Record<string, { fill: string; stroke: string }> = {
  critical: { fill: '#dc2626', stroke: '#b91c1c' }, // red
  anomaly: { fill: '#f59e0b', stroke: '#d97706' }, // amber
  suspicious: { fill: '#f59e0b', stroke: '#d97706' }, // amber
  routine: { fill: '#6b7280', stroke: '#4b5563' } // gray
}

/**
 * Transform TimelineEvent to G6 NodeConfig
 */
export function transformTimelineEvent(
  event: TimelineEvent,
  index: number
): NodeConfig {
  // Use significance color if critical/anomaly, otherwise use type color
  const colors = event.significance === 'critical' || event.significance === 'anomaly'
    ? SIGNIFICANCE_COLORS[event.significance]
    : EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.status

  // Node size based on significance
  const size = event.significance === 'critical' ? 56 :
               event.significance === 'anomaly' ? 48 :
               40

  return {
    id: event.id,
    label: event.title,
    type: 'circle',
    size,
    style: {
      fill: colors.fill,
      stroke: colors.stroke,
      lineWidth: event.significance === 'critical' ? 4 : 3,
      cursor: 'pointer',
      ...(event.significance === 'critical' && {
        shadowColor: colors.fill,
        shadowBlur: 15
      })
    },
    labelCfg: {
      position: 'right',
      offset: 10,
      style: {
        fontSize: 11,
        fontWeight: 600,
        fill: CITIZENS360_COLORS.text,
        background: {
          fill: '#ffffff',
          padding: [4, 6, 4, 6],
          radius: 4
        }
      }
    },
    // Store original data
    originalData: event,
    // Add metadata for grouping
    clusterKey: event.type,
    timeValue: event.timestamp.getTime()
  }
}

/**
 * Detect causal relationships between events
 * Returns edges representing temporal and causal connections
 */
export function detectCausalRelationships(events: TimelineEvent[]): EdgeConfig[] {
  const edges: EdgeConfig[] = []

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i]
    const nextEvent = sortedEvents[i + 1]

    // Calculate time difference
    const timeDiff = nextEvent.timestamp.getTime() - currentEvent.timestamp.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)

    // Determine relationship type
    let relationship: 'temporal' | 'causal' | 'concurrent' = 'temporal'
    let confidence = 0.5

    // Events within 1 hour = concurrent
    if (hoursDiff < 1) {
      relationship = 'concurrent'
      confidence = 0.9
    }
    // Events with same location = likely causal
    else if (currentEvent.location && nextEvent.location &&
             currentEvent.location.name === nextEvent.location.name) {
      relationship = 'causal'
      confidence = 0.8
    }
    // Events with shared participants = likely related
    else if (currentEvent.participants && nextEvent.participants) {
      const sharedParticipants = currentEvent.participants.filter(p =>
        nextEvent.participants?.includes(p)
      )
      if (sharedParticipants.length > 0) {
        relationship = 'causal'
        confidence = 0.7
      }
    }
    // Events of same type within 24 hours = potentially causal
    else if (currentEvent.type === nextEvent.type && hoursDiff < 24) {
      relationship = 'causal'
      confidence = 0.6
    }

    // Create edge
    edges.push({
      source: currentEvent.id,
      target: nextEvent.id,
      id: `${currentEvent.id}-${nextEvent.id}`,
      type: 'line',
      style: {
        stroke: relationship === 'causal' ? '#3b82f6' :
                relationship === 'concurrent' ? '#8b5cf6' :
                '#d1d5db',
        lineWidth: relationship === 'causal' ? 3 :
                   relationship === 'concurrent' ? 2 : 1,
        opacity: confidence,
        lineDash: relationship === 'temporal' ? [5, 5] : [],
        endArrow: {
          path: 'M 0,0 L 8,4 L 8,-4 Z',
          fill: relationship === 'causal' ? '#3b82f6' :
                relationship === 'concurrent' ? '#8b5cf6' :
                '#d1d5db'
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
      label: hoursDiff < 1 ? 'concurrent' :
             hoursDiff < 24 ? `${Math.round(hoursDiff)}h` :
             `${Math.round(hoursDiff / 24)}d`,
      // Store metadata
      relationship,
      confidence,
      timeDiff: hoursDiff
    })
  }

  return edges
}

/**
 * Group events by time clusters (same day, nearby times)
 */
export function clusterEventsByTime(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  const clusters: Record<string, TimelineEvent[]> = {}

  events.forEach(event => {
    const dateKey = event.timestamp.toDateString()
    if (!clusters[dateKey]) {
      clusters[dateKey] = []
    }
    clusters[dateKey].push(event)
  })

  return clusters
}

/**
 * Transform timeline events to G6 GraphData
 */
export function transformTimelineToG6(events: TimelineEvent[]): GraphData {
  console.log('🟣 transformTimelineToG6 called with', events.length, 'events')

  if (!events || events.length === 0) {
    console.warn('⚠️ No events to transform!')
    return { nodes: [], edges: [] }
  }

  // Transform nodes
  const nodes = events.map((event, index) => transformTimelineEvent(event, index))
  console.log('🟣 Transformed', nodes.length, 'timeline nodes')

  // Detect causal relationships
  const edges = detectCausalRelationships(events)
  console.log('🟣 Detected', edges.length, 'causal relationships')

  return {
    nodes,
    edges
  }
}

/**
 * Find event chains - paths from one event to another
 */
export function findEventChains(
  graphData: GraphData,
  startEventId: string,
  endEventId?: string
): string[][] {
  const edges = graphData.edges || []
  const paths: string[][] = []

  // Build adjacency list
  const adjacency = new Map<string, string[]>()
  edges.forEach(edge => {
    const source = edge.source as string
    const target = edge.target as string

    if (!adjacency.has(source)) {
      adjacency.set(source, [])
    }
    adjacency.get(source)!.push(target)
  })

  // DFS to find all paths
  function dfs(currentId: string, visited: Set<string>, path: string[]) {
    visited.add(currentId)
    path.push(currentId)

    // If we're looking for a specific end and found it
    if (endEventId && currentId === endEventId) {
      paths.push([...path])
      visited.delete(currentId)
      path.pop()
      return
    }

    // If no specific end, consider this a valid path if it's not just the start
    if (!endEventId && path.length > 1) {
      paths.push([...path])
    }

    // Explore neighbors
    const neighbors = adjacency.get(currentId) || []
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        dfs(neighborId, visited, path)
      }
    }

    visited.delete(currentId)
    path.pop()
  }

  dfs(startEventId, new Set(), [])

  return paths
}

/**
 * Get timeline statistics
 */
export function getTimelineStats(events: TimelineEvent[]) {
  const eventTypes = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const significanceLevels = events.reduce((acc, event) => {
    acc[event.significance] = (acc[event.significance] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedEvents = [...events].sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  const timespan = sortedEvents.length > 0
    ? sortedEvents[sortedEvents.length - 1].timestamp.getTime() - sortedEvents[0].timestamp.getTime()
    : 0

  return {
    totalEvents: events.length,
    eventTypes,
    significanceLevels,
    timespanDays: Math.ceil(timespan / (1000 * 60 * 60 * 24)),
    earliestEvent: sortedEvents[0]?.timestamp,
    latestEvent: sortedEvents[sortedEvents.length - 1]?.timestamp
  }
}

/**
 * Filter timeline by significance
 */
export function filterBySignificance(
  graphData: GraphData,
  significance: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as TimelineEvent
    return significance.includes(originalData?.significance || '')
  })

  const nodeIds = new Set(filteredNodes.map(n => n.id))

  const filteredEdges = (graphData.edges || []).filter(
    edge => nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string)
  )

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  }
}

/**
 * Filter timeline by event type
 */
export function filterByEventType(
  graphData: GraphData,
  types: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as TimelineEvent
    return types.includes(originalData?.type || '')
  })

  const nodeIds = new Set(filteredNodes.map(n => n.id))

  const filteredEdges = (graphData.edges || []).filter(
    edge => nodeIds.has(edge.source as string) && nodeIds.has(edge.target as string)
  )

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  }
}
