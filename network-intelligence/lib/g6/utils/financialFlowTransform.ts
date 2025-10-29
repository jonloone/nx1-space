/**
 * Financial Flow Transformation Utilities
 *
 * Transform financial transaction data to G6 graph format
 * Visualize money flows, detect patterns, and identify anomalies
 */

import type { NodeConfig, EdgeConfig, GraphData } from '@antv/g6'

export interface FinancialAccount {
  id: string
  name: string
  type: 'personal' | 'business' | 'offshore' | 'crypto' | 'cash' | 'unknown'
  country?: string
  institution?: string
  balance?: number
  riskScore?: number // 0-100
  status?: 'active' | 'frozen' | 'closed'
  metadata?: Record<string, any>
}

export interface Transaction {
  id: string
  from: string // Account ID
  to: string // Account ID
  amount: number
  currency: string
  timestamp: Date
  type?: 'wire' | 'cash' | 'crypto' | 'check' | 'other'
  description?: string
  flagged?: boolean
  flagReason?: string
  metadata?: Record<string, any>
}

export interface TransactionPattern {
  type: 'circular' | 'layering' | 'rapid-movement' | 'structuring'
  accounts: string[]
  transactions: string[]
  severity: 'high' | 'medium' | 'low'
  description: string
}

// Account type styling
const ACCOUNT_TYPE_STYLES: Record<string, { fill: string; stroke: string; shape: string }> = {
  personal: { fill: '#3b82f6', stroke: '#2563eb', shape: 'circle' }, // blue
  business: { fill: '#10b981', stroke: '#059669', shape: 'rect' }, // emerald
  offshore: { fill: '#f59e0b', stroke: '#d97706', shape: 'diamond' }, // amber - higher scrutiny
  crypto: { fill: '#8b5cf6', stroke: '#7c3aed', shape: 'hexagon' }, // purple
  cash: { fill: '#6b7280', stroke: '#4b5563', shape: 'ellipse' }, // gray
  unknown: { fill: '#dc2626', stroke: '#991b1b', shape: 'triangle' } // red - suspicious
}

/**
 * Transform FinancialAccount to G6 NodeConfig
 */
export function transformAccountNode(account: FinancialAccount): NodeConfig {
  const typeStyle = ACCOUNT_TYPE_STYLES[account.type] || ACCOUNT_TYPE_STYLES.unknown

  // Risk-based color override
  const isHighRisk = (account.riskScore || 0) > 70
  const colors = isHighRisk
    ? { fill: '#dc2626', stroke: '#991b1b' }
    : typeStyle

  // Size based on balance or risk
  const baseSize = account.type === 'business' ? [80, 50] :
                   account.type === 'personal' ? 48 :
                   account.type === 'offshore' ? 56 : 44

  const size = isHighRisk && typeof baseSize === 'number' ? baseSize + 8 : baseSize

  return {
    id: account.id,
    label: account.name,
    type: typeStyle.shape,
    size,
    style: {
      fill: colors.fill,
      stroke: colors.stroke,
      lineWidth: isHighRisk ? 4 : 3,
      cursor: 'pointer',
      ...(typeStyle.shape === 'rect' && { radius: 8 }),
      ...(isHighRisk && {
        shadowColor: '#dc2626',
        shadowBlur: 14
      }),
      ...(account.status === 'frozen' && {
        opacity: 0.6,
        lineDash: [5, 5]
      }),
      ...(account.status === 'closed' && {
        opacity: 0.4
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
    // Badge for high risk
    icon: isHighRisk ? {
      show: true,
      text: '⚠',
      fontSize: 18,
      fill: '#dc2626'
    } : undefined,
    originalData: account,
    accountType: account.type,
    riskScore: account.riskScore || 0
  }
}

/**
 * Transform Transaction to G6 EdgeConfig
 */
export function transformTransactionEdge(transaction: Transaction): EdgeConfig {
  // Edge width based on transaction amount
  const logAmount = Math.log10(Math.max(transaction.amount, 1))
  const lineWidth = Math.min(Math.max(logAmount / 2, 1), 8)

  // Color based on flagged status or amount
  const isLargeAmount = transaction.amount > 100000
  const color = transaction.flagged ? '#dc2626' :
                isLargeAmount ? '#f59e0b' :
                '#3b82f6'

  return {
    source: transaction.from,
    target: transaction.to,
    id: transaction.id,
    type: 'line',
    style: {
      stroke: color,
      lineWidth,
      opacity: transaction.flagged ? 0.9 : 0.7,
      lineDash: transaction.type === 'cash' ? [5, 5] : [],
      endArrow: {
        path: 'M 0,0 L 10,5 L 10,-5 Z',
        fill: color
      },
      ...(transaction.flagged && {
        shadowColor: '#dc2626',
        shadowBlur: 8
      })
    },
    labelCfg: {
      autoRotate: true,
      style: {
        fontSize: 9,
        fontWeight: 600,
        fill: transaction.flagged ? '#dc2626' : '#6b7280',
        background: {
          fill: '#ffffff',
          padding: [2, 4, 2, 4],
          radius: 3
        }
      }
    },
    label: formatAmount(transaction.amount, transaction.currency),
    originalData: transaction,
    amount: transaction.amount,
    flagged: transaction.flagged
  }
}

/**
 * Detect circular transaction patterns (money laundering indicator)
 */
export function detectCircularFlows(transactions: Transaction[]): TransactionPattern[] {
  const patterns: TransactionPattern[] = []
  const graph = new Map<string, string[]>()

  // Build adjacency list
  transactions.forEach(tx => {
    if (!graph.has(tx.from)) {
      graph.set(tx.from, [])
    }
    graph.get(tx.from)!.push(tx.to)
  })

  // DFS to find cycles
  function findCycles(start: string, visited: Set<string>, path: string[]): string[][] {
    const cycles: string[][] = []

    function dfs(current: string) {
      if (path.includes(current)) {
        const cycleStart = path.indexOf(current)
        cycles.push(path.slice(cycleStart))
        return
      }

      if (visited.has(current)) return
      visited.add(current)
      path.push(current)

      const neighbors = graph.get(current) || []
      for (const neighbor of neighbors) {
        dfs(neighbor)
      }

      path.pop()
      visited.delete(current)
    }

    dfs(start)
    return cycles
  }

  // Check each account for cycles
  const checked = new Set<string>()
  graph.forEach((_, account) => {
    if (!checked.has(account)) {
      const cycles = findCycles(account, new Set(), [])
      cycles.forEach(cycle => {
        if (cycle.length >= 3) { // Cycles of 3+ accounts
          const cycleTransactions = transactions.filter(tx =>
            cycle.includes(tx.from) && cycle.includes(tx.to)
          )

          patterns.push({
            type: 'circular',
            accounts: cycle,
            transactions: cycleTransactions.map(tx => tx.id),
            severity: cycle.length >= 5 ? 'high' : 'medium',
            description: `Circular flow detected involving ${cycle.length} accounts`
          })

          cycle.forEach(acc => checked.add(acc))
        }
      })
    }
  })

  return patterns
}

/**
 * Detect layering patterns (multiple rapid transactions)
 */
export function detectLayering(transactions: Transaction[]): TransactionPattern[] {
  const patterns: TransactionPattern[] = []

  // Group transactions by account within short time windows
  const accountActivity = new Map<string, Transaction[]>()

  transactions.forEach(tx => {
    if (!accountActivity.has(tx.from)) {
      accountActivity.set(tx.from, [])
    }
    accountActivity.get(tx.from)!.push(tx)
  })

  accountActivity.forEach((txs, account) => {
    // Sort by timestamp
    const sorted = txs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Find rapid sequences (5+ transactions within 24 hours)
    for (let i = 0; i < sorted.length; i++) {
      const window: Transaction[] = []
      const startTime = sorted[i].timestamp.getTime()

      for (let j = i; j < sorted.length; j++) {
        const timeDiff = sorted[j].timestamp.getTime() - startTime
        if (timeDiff <= 24 * 60 * 60 * 1000) { // 24 hours
          window.push(sorted[j])
        } else {
          break
        }
      }

      if (window.length >= 5) {
        const uniqueAccounts = new Set([account, ...window.map(tx => tx.to)])

        patterns.push({
          type: 'layering',
          accounts: Array.from(uniqueAccounts),
          transactions: window.map(tx => tx.id),
          severity: window.length >= 10 ? 'high' : 'medium',
          description: `${window.length} transactions in 24 hours from ${account}`
        })

        i += window.length - 1 // Skip processed window
      }
    }
  })

  return patterns
}

/**
 * Detect structuring (breaking large amounts into smaller ones)
 */
export function detectStructuring(transactions: Transaction[]): TransactionPattern[] {
  const patterns: TransactionPattern[] = []
  const REPORTING_THRESHOLD = 10000 // Typical cash reporting threshold

  // Group by from-to pair and time window
  const pairActivity = new Map<string, Transaction[]>()

  transactions.forEach(tx => {
    const pairKey = `${tx.from}-${tx.to}`
    if (!pairActivity.has(pairKey)) {
      pairActivity.set(pairKey, [])
    }
    pairActivity.get(pairKey)!.push(tx)
  })

  pairActivity.forEach((txs, pairKey) => {
    const sorted = txs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Find sequences where multiple transactions just below threshold
    for (let i = 0; i < sorted.length; i++) {
      const window: Transaction[] = []
      const startTime = sorted[i].timestamp.getTime()
      let totalAmount = 0

      for (let j = i; j < sorted.length; j++) {
        const timeDiff = sorted[j].timestamp.getTime() - startTime
        if (timeDiff <= 7 * 24 * 60 * 60 * 1000) { // 7 days
          if (sorted[j].amount < REPORTING_THRESHOLD && sorted[j].amount > REPORTING_THRESHOLD * 0.7) {
            window.push(sorted[j])
            totalAmount += sorted[j].amount
          }
        } else {
          break
        }
      }

      // If 3+ transactions just below threshold, total exceeds threshold significantly
      if (window.length >= 3 && totalAmount > REPORTING_THRESHOLD * 2) {
        const [from, to] = pairKey.split('-')

        patterns.push({
          type: 'structuring',
          accounts: [from, to],
          transactions: window.map(tx => tx.id),
          severity: 'high',
          description: `${window.length} transactions totaling ${formatAmount(totalAmount, window[0].currency)} just below reporting threshold`
        })

        i += window.length - 1
      }
    }
  })

  return patterns
}

/**
 * Calculate financial flow statistics
 */
export function getFinancialStats(
  accounts: FinancialAccount[],
  transactions: Transaction[]
) {
  const accountTypeCounts = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const avgTransactionSize = transactions.length > 0 ? totalVolume / transactions.length : 0
  const flaggedCount = transactions.filter(tx => tx.flagged).length

  const highRiskAccounts = accounts.filter(acc => (acc.riskScore || 0) > 70).length

  return {
    totalAccounts: accounts.length,
    accountTypeCounts,
    totalTransactions: transactions.length,
    totalVolume,
    avgTransactionSize,
    flaggedTransactions: flaggedCount,
    highRiskAccounts
  }
}

/**
 * Transform financial data to G6 graph
 */
export function transformFinancialFlowToG6(
  accounts: FinancialAccount[],
  transactions: Transaction[]
): GraphData {
  return {
    nodes: accounts.map(account => transformAccountNode(account)),
    edges: transactions.map(tx => transformTransactionEdge(tx))
  }
}

/**
 * Filter by account type
 */
export function filterByAccountType(
  graphData: GraphData,
  types: string[]
): GraphData {
  const filteredNodes = (graphData.nodes || []).filter(node => {
    const originalData = (node as any).originalData as FinancialAccount
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
 * Filter by minimum transaction amount
 */
export function filterByAmount(
  graphData: GraphData,
  minAmount: number
): GraphData {
  const filteredEdges = (graphData.edges || []).filter(edge => {
    const amount = (edge as any).amount as number
    return amount >= minAmount
  })

  // Keep only nodes that have edges
  const activeNodeIds = new Set<string>()
  filteredEdges.forEach(edge => {
    activeNodeIds.add(edge.source as string)
    activeNodeIds.add(edge.target as string)
  })

  const filteredNodes = (graphData.nodes || []).filter(node =>
    activeNodeIds.has(node.id as string)
  )

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  }
}

/**
 * Show only flagged transactions
 */
export function filterFlagged(graphData: GraphData): GraphData {
  const filteredEdges = (graphData.edges || []).filter(edge => {
    return (edge as any).flagged === true
  })

  const activeNodeIds = new Set<string>()
  filteredEdges.forEach(edge => {
    activeNodeIds.add(edge.source as string)
    activeNodeIds.add(edge.target as string)
  })

  const filteredNodes = (graphData.nodes || []).filter(node =>
    activeNodeIds.has(node.id as string)
  )

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  }
}

/**
 * Format currency amount
 */
function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)

  // Abbreviate large amounts
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K ${currency}`
  }

  return formatted
}
