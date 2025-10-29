/**
 * Alert Correlation Transformation Utilities
 *
 * Transform alert data to G6 graph format for correlation analysis
 * Detect patterns, clusters, and relationships between alerts
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'

export interface Alert {
  id: string
  title: string
  type: string // 'movement', 'communication', 'financial', 'anomaly'
  severity: 'critical' | 'high' | 'medium' | 'low'
  timestamp: Date
  location?: {
    name: string
    coordinates?: [number, number]
  }
  subjects?: string[]
  description?: string
  metadata?: Record<string, any>
}

export interface AlertCorrelation {
  from: string // Alert ID
  to: string // Alert ID
  correlationType: 'temporal' | 'spatial' | 'subject' | 'pattern'
  strength: number // 0-1
  reason: string
}

// Severity to color mapping
const SEVERITY_COLORS: Record<string, { fill: string; stroke: string }> = {
  critical: { fill: '#dc2626', stroke: '#991b1b' }, // red-600/red-800
  high: { fill: '#f59e0b', stroke: '#d97706' }, // amber-500/amber-600
  medium: { fill: '#3b82f6', stroke: '#2563eb' }, // blue-500/blue-600
  low: { fill: '#6b7280', stroke: '#4b5563' } // gray-500/gray-600
}

// Alert type to icon/shape mapping
const ALERT_TYPE_SHAPES: Record<string, string> = {
  movement: 'circle',
  communication: 'rect',
  financial: 'diamond',
  anomaly: 'triangle',
  default: 'circle'
}

/**
 * Transform Alert to G6 NodeConfig
 */
export function transformAlertNode(alert: Alert): NodeConfig {
  const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low
  const shape = ALERT_TYPE_SHAPES[alert.type] || ALERT_TYPE_SHAPES.default

  // Size based on severity
  const size = alert.severity === 'critical' ? 56 :
               alert.severity === 'high' ? 48 :
               alert.severity === 'medium' ? 40 : 32

  return {
    id: alert.id,
    label: alert.title,
    type: shape,
    size,
    style: {
      fill: colors.fill,
      stroke: colors.stroke,
      lineWidth: alert.severity === 'critical' ? 4 : 3,
      cursor: 'pointer',
      ...(alert.severity === 'critical' && {
        shadowColor: colors.fill,
        shadowBlur: 16
      })
    },
    labelCfg: {
      position: 'bottom',
      offset: 8,
      style: {
        fontSize: 10,
        fontWeight: 600,
        fill: '#111827',
        background: {
          fill: '#ffffff',
          padding: [3, 5, 3, 5],
          radius: 4
        }
      }
    },
    // Store original data and metadata
    originalData: alert,
    clusterKey: alert.type,
    timeValue: alert.timestamp.getTime(),
    severityValue: alert.severity
  }
}

/**
 * Transform AlertCorrelation to G6 EdgeConfig
 */
export function transformCorrelationEdge(correlation: AlertCorrelation): EdgeConfig {
  // Edge style based on correlation type
  const edgeStyles: Record<string, { color: string; dash?: number[] }> = {
    temporal: { color: '#3b82f6', dash: [5, 5] }, // blue, dashed
    spatial: { color: '#10b981', dash: [] }, // emerald, solid
    subject: { color: '#8b5cf6', dash: [] }, // purple, solid
    pattern: { color: '#f59e0b', dash: [2, 2] } // amber, dotted
  }

  const style = edgeStyles[correlation.correlationType] || edgeStyles.pattern
  const lineWidth = 1 + (correlation.strength * 3) // 1-4px based on strength

  return {
    source: correlation.from,
    target: correlation.to,
    id: `${correlation.from}-${correlation.to}`,
    type: 'line',
    style: {
      stroke: style.color,
      lineWidth,
      opacity: 0.5 + (correlation.strength * 0.5), // 0.5-1 opacity
      lineDash: style.dash,
      endArrow: false // Correlation is bidirectional
    },
    labelCfg: {
      autoRotate: true,
      style: {
        fontSize: 8,
        fill: '#6b7280',
        background: {
          fill: '#ffffff',
          padding: [2, 4, 2, 4],
          radius: 3
        }
      }
    },
    label: correlation.strength > 0.7 ? correlation.reason : undefined,
    // Store metadata
    correlationType: correlation.correlationType,
    strength: correlation.strength,
    reason: correlation.reason
  }
}

/**
 * Detect correlations between alerts
 */
export function detectAlertCorrelations(alerts: Alert[]): AlertCorrelation[] {
  const correlations: AlertCorrelation[] = []

  for (let i = 0; i < alerts.length; i++) {
    for (let j = i + 1; j < alerts.length; j++) {
      const alert1 = alerts[i]
      const alert2 = alerts[j]

      // Temporal correlation (within 24 hours)
      const timeDiff = Math.abs(alert1.timestamp.getTime() - alert2.timestamp.getTime())
      const hoursDiff = timeDiff / (1000 * 60 * 60)

      if (hoursDiff < 24) {
        const strength = Math.max(0.3, 1 - (hoursDiff / 24))
        correlations.push({
          from: alert1.id,
          to: alert2.id,
          correlationType: 'temporal',
          strength,
          reason: hoursDiff < 1 ? 'Same hour' : `${Math.round(hoursDiff)}h apart`
        })
        continue // Only add one correlation per pair
      }

      // Spatial correlation (same location)
      if (alert1.location && alert2.location &&
          alert1.location.name === alert2.location.name) {
        correlations.push({
          from: alert1.id,
          to: alert2.id,
          correlationType: 'spatial',
          strength: 0.8,
          reason: `Both at ${alert1.location.name}`
        })
        continue
      }

      // Subject correlation (shared subjects)
      if (alert1.subjects && alert2.subjects) {
        const sharedSubjects = alert1.subjects.filter(s =>
          alert2.subjects?.includes(s)
        )
        if (sharedSubjects.length > 0) {
          const strength = Math.min(0.9, 0.5 + (sharedSubjects.length * 0.2))
          correlations.push({
            from: alert1.id,
            to: alert2.id,
            correlationType: 'subject',
            strength,
            reason: `${sharedSubjects.length} shared subject${sharedSubjects.length > 1 ? 's' : ''}`
          })
          continue
        }
      }

      // Pattern correlation (same type, medium time proximity)
      if (alert1.type === alert2.type && hoursDiff < 168) { // Within 1 week
        const strength = Math.max(0.3, 0.6 - (hoursDiff / 336))
        correlations.push({
          from: alert1.id,
          to: alert2.id,
          correlationType: 'pattern',
          strength,
          reason: `Similar ${alert1.type} alerts`
        })
      }
    }
  }

  return correlations
}

/**
 * Group alerts into clusters
 */
export function clusterAlerts(alerts: Alert[]): Record<string, Alert[]> {
  const clusters: Record<string, Alert[]> = {
    critical: [],
    high: [],
    medium: [],
    low: []
  }

  alerts.forEach(alert => {
    clusters[alert.severity].push(alert)
  })

  return clusters
}

/**
 * Find alert chains (cascading alerts)
 */
export function findAlertChains(
  alerts: Alert[],
  correlations: AlertCorrelation[]
): string[][] {
  const chains: string[][] = []

  // Build adjacency list
  const adjacency = new Map<string, string[]>()
  correlations
    .filter(c => c.strength > 0.6) // Only strong correlations
    .forEach(corr => {
      if (!adjacency.has(corr.from)) {
        adjacency.set(corr.from, [])
      }
      adjacency.get(corr.from)!.push(corr.to)
    })

  // DFS to find chains
  function dfs(currentId: string, visited: Set<string>, chain: string[]) {
    visited.add(currentId)
    chain.push(currentId)

    if (chain.length >= 2) {
      chains.push([...chain])
    }

    const neighbors = adjacency.get(currentId) || []
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        dfs(neighborId, visited, chain)
      }
    }

    visited.delete(currentId)
    chain.pop()
  }

  // Find chains starting from each alert
  alerts.forEach(alert => {
    dfs(alert.id, new Set(), [])
  })

  // Remove duplicates
  const uniqueChains = chains.filter((chain, index) => {
    const chainStr = chain.join(',')
    return chains.findIndex(c => c.join(',') === chainStr) === index
  })

  return uniqueChains
}

/**
 * Calculate alert statistics
 */
export function getAlertCorrelationStats(
  alerts: Alert[],
  correlations: AlertCorrelation[]
) {
  const severityCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const correlationTypes = correlations.reduce((acc, corr) => {
    acc[corr.correlationType] = (acc[corr.correlationType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgStrength = correlations.length > 0
    ? correlations.reduce((sum, c) => sum + c.strength, 0) / correlations.length
    : 0

  const strongCorrelations = correlations.filter(c => c.strength > 0.7).length

  return {
    totalAlerts: alerts.length,
    severityCounts,
    totalCorrelations: correlations.length,
    correlationTypes,
    avgCorrelationStrength: avgStrength,
    strongCorrelations
  }
}

/**
 * Transform alert data to G6 graph
 */
export function transformAlertCorrelationToG6(
  alerts: Alert[],
  correlations: AlertCorrelation[]
): GraphData {
  return {
    nodes: alerts.map(alert => transformAlertNode(alert)),
    edges: correlations.map(corr => transformCorrelationEdge(corr))
  }
}

/**
 * Filter alerts by severity
 */
export function filterAlertsBySeverity(
  graphData: GraphData,
  severities: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as Alert
    return severities.includes(originalData?.severity || '')
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
 * Filter alerts by type
 */
export function filterAlertsByType(
  graphData: GraphData,
  types: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as Alert
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

/**
 * Filter correlations by minimum strength
 */
export function filterCorrelationsByStrength(
  graphData: GraphData,
  minStrength: number
): GraphData {
  const filteredEdges = (graphData.edges || []).filter(edge => {
    const strength = (edge as any).strength as number
    return strength >= minStrength
  })

  // Keep all nodes, just filter edges
  return {
    nodes: graphData.nodes,
    edges: filteredEdges
  }
}
