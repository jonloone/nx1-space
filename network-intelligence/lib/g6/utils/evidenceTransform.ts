/**
 * Evidence Graph Transformation Utilities
 *
 * Transform evidence and chain of custody data to G6 graph format
 * Visualize evidence relationships, custody transfers, and integrity
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'

export interface Evidence {
  id: string
  title: string
  type: 'document' | 'physical' | 'digital' | 'testimony' | 'photo' | 'video'
  description?: string
  collectedAt: Date
  collectedBy: string
  location?: string
  integrityStatus: 'verified' | 'unverified' | 'compromised' | 'questionable'
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CustodyTransfer {
  from: string // Person/entity ID
  to: string // Person/entity ID
  evidenceId: string
  timestamp: Date
  reason: string
  verified: boolean
}

export interface EvidenceRelationship {
  from: string // Evidence ID
  to: string // Evidence ID
  type: 'derived-from' | 'related-to' | 'contradicts' | 'supports'
  description?: string
}

// Evidence type to color and icon mapping
const EVIDENCE_TYPE_STYLES: Record<string, { fill: string; stroke: string; shape: string }> = {
  document: { fill: '#3b82f6', stroke: '#2563eb', shape: 'rect' }, // blue
  physical: { fill: '#10b981', stroke: '#059669', shape: 'circle' }, // emerald
  digital: { fill: '#8b5cf6', stroke: '#7c3aed', shape: 'diamond' }, // purple
  testimony: { fill: '#f59e0b', stroke: '#d97706', shape: 'ellipse' }, // amber
  photo: { fill: '#06b6d4', stroke: '#0891b2', shape: 'rect' }, // cyan
  video: { fill: '#ec4899', stroke: '#db2777', shape: 'rect' } // pink
}

// Integrity status colors
const INTEGRITY_COLORS: Record<string, { fill: string; stroke: string }> = {
  verified: { fill: '#10b981', stroke: '#059669' }, // emerald
  unverified: { fill: '#6b7280', stroke: '#4b5563' }, // gray
  compromised: { fill: '#dc2626', stroke: '#991b1b' }, // red
  questionable: { fill: '#f59e0b', stroke: '#d97706' } // amber
}

/**
 * Transform Evidence to G6 NodeConfig
 */
export function transformEvidenceNode(evidence: Evidence): NodeConfig {
  const typeStyle = EVIDENCE_TYPE_STYLES[evidence.type] || EVIDENCE_TYPE_STYLES.document
  const integrityStyle = INTEGRITY_COLORS[evidence.integrityStatus] || INTEGRITY_COLORS.unverified

  // Use integrity color if compromised or questionable
  const colors = evidence.integrityStatus === 'compromised' || evidence.integrityStatus === 'questionable'
    ? integrityStyle
    : typeStyle

  const size = evidence.type === 'physical' ? 52 :
               evidence.type === 'document' ? [60, 40] : // rect
               evidence.type === 'testimony' ? [56, 40] : // ellipse
               48

  return {
    id: evidence.id,
    label: evidence.title,
    type: typeStyle.shape,
    size,
    style: {
      fill: colors.fill,
      stroke: colors.stroke,
      lineWidth: 3,
      cursor: 'pointer',
      ...(evidence.integrityStatus === 'compromised' && {
        shadowColor: '#dc2626',
        shadowBlur: 12
      }),
      ...(evidence.integrityStatus === 'verified' && {
        shadowColor: '#10b981',
        shadowBlur: 8
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
    // Badge for integrity status
    icon: evidence.integrityStatus === 'verified' ? {
      show: true,
      text: '✓',
      fontSize: 16,
      fill: '#10b981'
    } : evidence.integrityStatus === 'compromised' ? {
      show: true,
      text: '⚠',
      fontSize: 16,
      fill: '#dc2626'
    } : undefined,
    originalData: evidence,
    evidenceType: evidence.type,
    integrityStatus: evidence.integrityStatus
  }
}

/**
 * Transform CustodyTransfer to G6 EdgeConfig
 */
export function transformCustodyEdge(
  transfer: CustodyTransfer,
  index: number
): EdgeConfig {
  return {
    source: transfer.from,
    target: transfer.to,
    id: `custody-${transfer.evidenceId}-${index}`,
    type: 'line',
    style: {
      stroke: transfer.verified ? '#10b981' : '#f59e0b',
      lineWidth: 2,
      opacity: 0.8,
      endArrow: {
        path: 'M 0,0 L 8,4 L 8,-4 Z',
        fill: transfer.verified ? '#10b981' : '#f59e0b'
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
    label: new Date(transfer.timestamp).toLocaleDateString(),
    originalData: transfer,
    transferType: 'custody',
    verified: transfer.verified
  }
}

/**
 * Transform EvidenceRelationship to G6 EdgeConfig
 */
export function transformEvidenceRelationship(relationship: EvidenceRelationship): EdgeConfig {
  const relationshipStyles: Record<string, { color: string; dash?: number[] }> = {
    'derived-from': { color: '#3b82f6', dash: [] }, // blue, solid
    'related-to': { color: '#8b5cf6', dash: [5, 5] }, // purple, dashed
    'contradicts': { color: '#dc2626', dash: [2, 2] }, // red, dotted
    'supports': { color: '#10b981', dash: [] } // emerald, solid
  }

  const style = relationshipStyles[relationship.type] || relationshipStyles['related-to']

  return {
    source: relationship.from,
    target: relationship.to,
    id: `rel-${relationship.from}-${relationship.to}`,
    type: 'line',
    style: {
      stroke: style.color,
      lineWidth: 2,
      opacity: 0.7,
      lineDash: style.dash,
      endArrow: relationship.type === 'derived-from' ? {
        path: 'M 0,0 L 8,4 L 8,-4 Z',
        fill: style.color
      } : false
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
    label: relationship.type.replace('-', ' '),
    originalData: relationship,
    relationshipType: relationship.type
  }
}

/**
 * Build chain of custody from transfers
 */
export function buildCustodyChain(
  evidence: Evidence,
  transfers: CustodyTransfer[]
): { people: string[]; chain: CustodyTransfer[] } {
  // Filter transfers for this evidence
  const evidenceTransfers = transfers
    .filter(t => t.evidenceId === evidence.id)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Build complete chain
  const people = new Set<string>()
  people.add(evidence.collectedBy) // Start with collector

  evidenceTransfers.forEach(transfer => {
    people.add(transfer.from)
    people.add(transfer.to)
  })

  return {
    people: Array.from(people),
    chain: evidenceTransfers
  }
}

/**
 * Validate chain of custody integrity
 */
export function validateCustodyChain(
  chain: CustodyTransfer[]
): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check for gaps in chain
  for (let i = 0; i < chain.length - 1; i++) {
    const current = chain[i]
    const next = chain[i + 1]

    if (current.to !== next.from) {
      issues.push(`Custody gap between ${current.to} and ${next.from}`)
    }
  }

  // Check for unverified transfers
  const unverified = chain.filter(t => !t.verified)
  if (unverified.length > 0) {
    issues.push(`${unverified.length} unverified transfer(s)`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Create custody nodes (people/entities who held evidence)
 */
export function createCustodyNodes(people: string[]): NodeConfig[] {
  return people.map(person => ({
    id: person,
    label: person,
    type: 'circle',
    size: 36,
    style: {
      fill: '#6b7280',
      stroke: '#4b5563',
      lineWidth: 2,
      cursor: 'pointer'
    },
    labelCfg: {
      position: 'bottom',
      offset: 6,
      style: {
        fontSize: 9,
        fontWeight: 600,
        fill: '#111827',
        background: {
          fill: '#ffffff',
          padding: [2, 4, 2, 4],
          radius: 3
        }
      }
    },
    nodeType: 'custodian'
  }))
}

/**
 * Transform evidence collection to G6 graph
 */
export function transformEvidenceToG6(
  evidenceItems: Evidence[],
  relationships: EvidenceRelationship[]
): GraphData {
  return {
    nodes: evidenceItems.map(evidence => transformEvidenceNode(evidence)),
    edges: relationships.map(rel => transformEvidenceRelationship(rel))
  }
}

/**
 * Transform custody chain to G6 graph
 */
export function transformCustodyChainToG6(
  evidence: Evidence,
  transfers: CustodyTransfer[]
): GraphData {
  const { people, chain } = buildCustodyChain(evidence, transfers)

  // Create evidence node + custodian nodes
  const nodes = [
    transformEvidenceNode(evidence),
    ...createCustodyNodes(people)
  ]

  // Create custody transfer edges
  const edges = chain.map((transfer, index) => transformCustodyEdge(transfer, index))

  return { nodes, edges }
}

/**
 * Get evidence statistics
 */
export function getEvidenceStats(
  evidenceItems: Evidence[],
  transfers: CustodyTransfer[]
) {
  const typeCounts = evidenceItems.reduce((acc, evidence) => {
    acc[evidence.type] = (acc[evidence.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const integrityCounts = evidenceItems.reduce((acc, evidence) => {
    acc[evidence.integrityStatus] = (acc[evidence.integrityStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const verifiedTransfers = transfers.filter(t => t.verified).length
  const totalTransfers = transfers.length

  return {
    totalEvidence: evidenceItems.length,
    typeCounts,
    integrityCounts,
    custodyTransfers: totalTransfers,
    verifiedTransfers,
    integrityRate: evidenceItems.length > 0
      ? (integrityCounts.verified || 0) / evidenceItems.length
      : 0
  }
}

/**
 * Filter evidence by integrity status
 */
export function filterByIntegrity(
  graphData: GraphData,
  statuses: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as Evidence
    return statuses.includes(originalData?.integrityStatus || '')
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
 * Filter evidence by type
 */
export function filterByEvidenceType(
  graphData: GraphData,
  types: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as Evidence
    return originalData ? types.includes(originalData.type) : true
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
