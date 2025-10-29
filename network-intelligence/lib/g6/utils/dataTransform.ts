/**
 * Data Transformation Utilities
 *
 * Transform Citizens 360 data formats to G6 graph format
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'
import { getNodeStyleByType, getNodeStyleByRisk, getEdgeStyleByType } from '../config/styles'

// Import our existing network types
import type { NetworkNode, NetworkConnection } from '@/components/investigation/NetworkAnalysisCard'

/**
 * Transform NetworkNode to G6 NodeConfig
 */
export function transformNode(node: NetworkNode, isCenterNode = false): NodeConfig {
  // Get base style by type
  const typeStyle = getNodeStyleByType(node.type)

  // Get risk style (overrides type if risk level present)
  const riskStyle = getNodeStyleByRisk(node.riskLevel)

  // Merge styles
  const mergedStyle = {
    ...typeStyle.style,
    ...riskStyle.style
  }

  // Center node should be larger
  if (isCenterNode) {
    return {
      id: node.id,
      label: node.name,
      type: 'circle',
      size: 64, // Larger for center
      style: {
        ...mergedStyle,
        lineWidth: (mergedStyle.lineWidth || 2) + 2
      },
      labelCfg: typeStyle.labelCfg
    }
  }

  return {
    id: node.id,
    label: node.name,
    type: 'circle',
    size: typeStyle.size || 48,
    style: mergedStyle,
    labelCfg: typeStyle.labelCfg,
    // Store original data for tooltips/actions
    originalData: node
  }
}

/**
 * Transform NetworkConnection to G6 EdgeConfig
 */
export function transformEdge(connection: NetworkConnection): EdgeConfig {
  const edgeStyle = getEdgeStyleByType(connection.type, connection.frequency)

  return {
    source: connection.from,
    target: connection.to,
    id: `${connection.from}-${connection.to}`,
    type: 'line',
    style: edgeStyle.style,
    labelCfg: edgeStyle.labelCfg,
    // Show frequency if > 1
    label: connection.frequency > 1 ? `${connection.frequency}x` : undefined,
    // Store original data
    originalData: connection
  }
}

/**
 * Transform our network data to G6 GraphData format
 */
export function transformNetworkToG6(
  centerNode: NetworkNode,
  nodes: NetworkNode[],
  connections: NetworkConnection[]
): GraphData {
  // Transform nodes
  const g6Nodes = nodes.map(node =>
    transformNode(node, node.id === centerNode.id)
  )

  // Transform edges
  const g6Edges = connections.map(connection =>
    transformEdge(connection)
  )

  return {
    nodes: g6Nodes,
    edges: g6Edges
  }
}

/**
 * Add node to existing graph data
 */
export function addNodeToGraph(
  graphData: GraphData,
  node: NetworkNode
): GraphData {
  return {
    nodes: [...(graphData.nodes || []), transformNode(node)],
    edges: graphData.edges || []
  }
}

/**
 * Add edge to existing graph data
 */
export function addEdgeToGraph(
  graphData: GraphData,
  connection: NetworkConnection
): GraphData {
  return {
    nodes: graphData.nodes || [],
    edges: [...(graphData.edges || []), transformEdge(connection)]
  }
}

/**
 * Remove node and its connected edges from graph
 */
export function removeNodeFromGraph(
  graphData: GraphData,
  nodeId: string
): GraphData {
  return {
    nodes: (graphData.nodes || []).filter(n => n.id !== nodeId),
    edges: (graphData.edges || []).filter(
      e => e.source !== nodeId && e.target !== nodeId
    )
  }
}

/**
 * Filter graph by node types
 */
export function filterGraphByNodeType(
  graphData: GraphData,
  nodeTypes: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as NetworkNode
    return nodeTypes.includes(originalData?.type || '')
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
 * Filter graph by edge types
 */
export function filterGraphByEdgeType(
  graphData: GraphData,
  edgeTypes: string[]
): GraphData {
  const filteredEdges = (graphData.edges || []).filter(edge => {
    const originalData = (edge as any).originalData as NetworkConnection
    return edgeTypes.includes(originalData?.type || '')
  })

  return {
    nodes: graphData.nodes || [],
    edges: filteredEdges
  }
}

/**
 * Get graph statistics
 */
export function getGraphStats(graphData: GraphData) {
  const nodes = graphData.nodes || []
  const edges = graphData.edges || []

  // Count node types
  const nodeTypes = nodes.reduce((acc, node) => {
    const originalData = (node as any).originalData as NetworkNode
    const type = originalData?.type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count edge types
  const edgeTypes = edges.reduce((acc, edge) => {
    const originalData = (edge as any).originalData as NetworkConnection
    const type = originalData?.type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count risk levels
  const riskLevels = nodes.reduce((acc, node) => {
    const originalData = (node as any).originalData as NetworkNode
    const risk = originalData?.riskLevel || 'none'
    acc[risk] = (acc[risk] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeTypes,
    edgeTypes,
    riskLevels,
    avgDegree: nodes.length > 0 ? (edges.length * 2) / nodes.length : 0
  }
}

/**
 * Find connected subgraph from a node
 */
export function getConnectedSubgraph(
  graphData: GraphData,
  startNodeId: string,
  maxDepth = 2
): GraphData {
  const edges = graphData.edges || []
  const nodes = graphData.nodes || []

  const visitedNodes = new Set<string>()
  const visitedEdges = new Set<string>()
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }]

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!

    if (visitedNodes.has(nodeId) || depth > maxDepth) {
      continue
    }

    visitedNodes.add(nodeId)

    // Find connected edges
    edges.forEach(edge => {
      const edgeId = edge.id as string
      if (visitedEdges.has(edgeId)) return

      if (edge.source === nodeId) {
        visitedEdges.add(edgeId)
        queue.push({ nodeId: edge.target as string, depth: depth + 1 })
      } else if (edge.target === nodeId) {
        visitedEdges.add(edgeId)
        queue.push({ nodeId: edge.source as string, depth: depth + 1 })
      }
    })
  }

  return {
    nodes: nodes.filter(n => visitedNodes.has(n.id as string)),
    edges: edges.filter(e => visitedEdges.has(e.id as string))
  }
}
