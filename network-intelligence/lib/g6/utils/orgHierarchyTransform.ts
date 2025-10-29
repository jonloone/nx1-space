/**
 * Organization Hierarchy Transformation Utilities
 *
 * Transform organizational structure data to G6 graph format
 * Visualize reporting relationships, departments, and authority flows
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'

export interface OrgMember {
  id: string
  name: string
  title: string
  department: string
  level: number // 1 = executive, 2 = senior, 3 = mid, 4 = junior
  reportsTo?: string // Manager's ID
  email?: string
  phone?: string
  location?: string
  status?: 'active' | 'inactive' | 'suspended'
  metadata?: Record<string, any>
}

export interface OrgRelationship {
  from: string // Manager ID
  to: string // Report ID
  type: 'direct-report' | 'dotted-line' | 'temporary'
  strength?: number
}

export interface Department {
  id: string
  name: string
  color: string
  memberCount?: number
}

// Level-based styling
const LEVEL_STYLES: Record<number, { size: number | number[]; fill: string; stroke: string }> = {
  1: { size: [100, 60], fill: '#7c3aed', stroke: '#6d28d9' }, // Executive - purple
  2: { size: [90, 55], fill: '#3b82f6', stroke: '#2563eb' }, // Senior - blue
  3: { size: [80, 50], fill: '#10b981', stroke: '#059669' }, // Mid - emerald
  4: { size: [70, 45], fill: '#6b7280', stroke: '#4b5563' } // Junior - gray
}

// Department colors (can be customized)
const DEPARTMENT_COLORS: Record<string, string> = {
  'Executive': '#7c3aed',
  'Engineering': '#3b82f6',
  'Operations': '#10b981',
  'Finance': '#f59e0b',
  'Legal': '#dc2626',
  'HR': '#ec4899',
  'Marketing': '#06b6d4',
  'Sales': '#8b5cf6'
}

/**
 * Transform OrgMember to G6 NodeConfig
 */
export function transformOrgMemberNode(member: OrgMember): NodeConfig {
  const levelStyle = LEVEL_STYLES[member.level] || LEVEL_STYLES[4]
  const deptColor = DEPARTMENT_COLORS[member.department] || '#6b7280'

  // Use department color if available, otherwise level color
  const fill = DEPARTMENT_COLORS[member.department] || levelStyle.fill
  const stroke = DEPARTMENT_COLORS[member.department]
    ? adjustColor(deptColor, -20) // Darker shade
    : levelStyle.stroke

  return {
    id: member.id,
    label: `${member.name}\n${member.title}`,
    type: 'rect',
    size: levelStyle.size,
    style: {
      fill,
      stroke,
      lineWidth: member.level === 1 ? 4 : 3,
      cursor: 'pointer',
      radius: 6,
      ...(member.level === 1 && {
        shadowColor: fill,
        shadowBlur: 12
      }),
      ...(member.status === 'inactive' && {
        opacity: 0.5,
        lineDash: [5, 5]
      }),
      ...(member.status === 'suspended' && {
        opacity: 0.7,
        stroke: '#dc2626',
        lineWidth: 3
      })
    },
    labelCfg: {
      style: {
        fontSize: member.level === 1 ? 13 : member.level === 2 ? 11 : 10,
        fontWeight: member.level === 1 ? 700 : 600,
        fill: '#ffffff',
        lineHeight: member.level === 1 ? 18 : 16
      }
    },
    // Store original data
    originalData: member,
    level: member.level,
    department: member.department
  }
}

/**
 * Transform OrgRelationship to G6 EdgeConfig
 */
export function transformOrgRelationship(relationship: OrgRelationship): EdgeConfig {
  const relationshipStyles: Record<string, { color: string; width: number; dash?: number[] }> = {
    'direct-report': { color: '#3b82f6', width: 2, dash: [] },
    'dotted-line': { color: '#8b5cf6', width: 2, dash: [5, 5] },
    'temporary': { color: '#f59e0b', width: 1.5, dash: [2, 2] }
  }

  const style = relationshipStyles[relationship.type] || relationshipStyles['direct-report']

  return {
    source: relationship.from,
    target: relationship.to,
    id: `${relationship.from}-${relationship.to}`,
    type: 'line',
    style: {
      stroke: style.color,
      lineWidth: style.width,
      opacity: 0.8,
      lineDash: style.dash,
      endArrow: {
        path: 'M 0,0 L 8,4 L 8,-4 Z',
        fill: style.color
      }
    },
    // Store metadata
    relationshipType: relationship.type,
    strength: relationship.strength
  }
}

/**
 * Build reporting relationships from org members
 */
export function buildReportingRelationships(members: OrgMember[]): OrgRelationship[] {
  const relationships: OrgRelationship[] = []

  members.forEach(member => {
    if (member.reportsTo) {
      relationships.push({
        from: member.reportsTo,
        to: member.id,
        type: 'direct-report',
        strength: 1.0
      })
    }
  })

  return relationships
}

/**
 * Find all direct reports for a member
 */
export function findDirectReports(
  memberId: string,
  members: OrgMember[]
): OrgMember[] {
  return members.filter(m => m.reportsTo === memberId)
}

/**
 * Find all members in a reporting chain
 */
export function findReportingChain(
  memberId: string,
  members: OrgMember[]
): OrgMember[] {
  const chain: OrgMember[] = []
  const visited = new Set<string>()

  function traverse(currentId: string) {
    if (visited.has(currentId)) return

    const member = members.find(m => m.id === currentId)
    if (!member) return

    visited.add(currentId)
    chain.push(member)

    // Find all reports
    const reports = findDirectReports(currentId, members)
    reports.forEach(report => traverse(report.id))
  }

  traverse(memberId)
  return chain
}

/**
 * Group members by department
 */
export function groupByDepartment(members: OrgMember[]): Record<string, OrgMember[]> {
  const groups: Record<string, OrgMember[]> = {}

  members.forEach(member => {
    if (!groups[member.department]) {
      groups[member.department] = []
    }
    groups[member.department].push(member)
  })

  return groups
}

/**
 * Calculate organization statistics
 */
export function getOrgStats(members: OrgMember[]) {
  const levelCounts = members.reduce((acc, member) => {
    acc[member.level] = (acc[member.level] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const deptCounts = members.reduce((acc, member) => {
    acc[member.department] = (acc[member.department] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusCounts = members.reduce((acc, member) => {
    const status = member.status || 'active'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate average reports per manager
  const managersWithReports = new Set<string>()
  members.forEach(m => {
    if (m.reportsTo) {
      managersWithReports.add(m.reportsTo)
    }
  })

  const totalReports = members.filter(m => m.reportsTo).length
  const avgReportsPerManager = managersWithReports.size > 0
    ? totalReports / managersWithReports.size
    : 0

  return {
    totalMembers: members.length,
    levelCounts,
    deptCounts,
    statusCounts,
    managersCount: managersWithReports.size,
    avgReportsPerManager: Math.round(avgReportsPerManager * 10) / 10
  }
}

/**
 * Transform organization to G6 graph
 */
export function transformOrgHierarchyToG6(
  members: OrgMember[],
  customRelationships?: OrgRelationship[]
): GraphData {
  // Build reporting relationships if not provided
  const relationships = customRelationships || buildReportingRelationships(members)

  return {
    nodes: members.map(member => transformOrgMemberNode(member)),
    edges: relationships.map(rel => transformOrgRelationship(rel))
  }
}

/**
 * Filter by department
 */
export function filterByDepartment(
  graphData: GraphData,
  departments: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as OrgMember
    return departments.includes(originalData?.department || '')
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
 * Filter by level
 */
export function filterByLevel(
  graphData: GraphData,
  levels: number[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as OrgMember
    return levels.includes(originalData?.level || 0)
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
 * Find root members (those without managers)
 */
export function findRootMembers(members: OrgMember[]): OrgMember[] {
  return members.filter(m => !m.reportsTo)
}

/**
 * Calculate reporting depth for each member
 */
export function calculateReportingDepth(
  member: OrgMember,
  members: OrgMember[]
): number {
  let depth = 0
  let current = member

  while (current.reportsTo) {
    depth++
    const manager = members.find(m => m.id === current.reportsTo)
    if (!manager) break
    current = manager
  }

  return depth
}

/**
 * Helper: Adjust color brightness
 */
function adjustColor(color: string, amount: number): string {
  // Simple hex color adjustment
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
