/**
 * Financial Flow Transformation Tests
 *
 * Tests for financial transaction data transformation and pattern detection
 */

import { describe, it, expect } from '@jest/globals'
import {
  transformAccountNode,
  transformTransactionEdge,
  detectCircularFlows,
  detectLayering,
  detectStructuring,
  transformFinancialFlowToG6,
  filterByAccountType,
  filterByAmount,
  getFinancialStats
} from '../utils/financialFlowTransform'
import type { FinancialAccount, Transaction } from '../utils/financialFlowTransform'

const mockAccounts: FinancialAccount[] = [
  {
    id: 'acc-1',
    name: 'John Doe Personal',
    type: 'personal',
    country: 'USA',
    riskScore: 20
  },
  {
    id: 'acc-2',
    name: 'Shell Company LLC',
    type: 'offshore',
    country: 'Panama',
    riskScore: 85
  },
  {
    id: 'acc-3',
    name: 'ABC Corp',
    type: 'business',
    country: 'USA',
    riskScore: 30
  }
]

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    from: 'acc-1',
    to: 'acc-2',
    amount: 50000,
    currency: 'USD',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    type: 'wire',
    flagged: false
  },
  {
    id: 'tx-2',
    from: 'acc-2',
    to: 'acc-3',
    amount: 45000,
    currency: 'USD',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    type: 'wire',
    flagged: false
  },
  {
    id: 'tx-3',
    from: 'acc-3',
    to: 'acc-1',
    amount: 40000,
    currency: 'USD',
    timestamp: new Date('2024-01-01T14:00:00Z'),
    type: 'wire',
    flagged: true,
    flagReason: 'Circular flow detected'
  }
]

describe('FinancialFlowTransform', () => {
  describe('transformAccountNode', () => {
    it('should transform account to G6 node', () => {
      const node = transformAccountNode(mockAccounts[0])

      expect(node).toHaveProperty('id', 'acc-1')
      expect(node).toHaveProperty('label', 'John Doe Personal')
      expect(node).toHaveProperty('type')
      expect(node).toHaveProperty('originalData', mockAccounts[0])
    })

    it('should apply high-risk styling for accounts with risk score > 70', () => {
      const node = transformAccountNode(mockAccounts[1])

      expect(node.style).toHaveProperty('shadowBlur')
      expect(node.style?.fill).toBe('#dc2626') // red for high risk
      expect(node.style?.lineWidth).toBe(4)
    })

    it('should use account type shapes', () => {
      const personalNode = transformAccountNode(mockAccounts[0])
      const offshoreNode = transformAccountNode(mockAccounts[1])
      const businessNode = transformAccountNode(mockAccounts[2])

      expect(personalNode.type).toBe('circle')
      expect(offshoreNode.type).toBe('diamond')
      expect(businessNode.type).toBe('rect')
    })
  })

  describe('transformTransactionEdge', () => {
    it('should transform transaction to G6 edge', () => {
      const edge = transformTransactionEdge(mockTransactions[0])

      expect(edge).toHaveProperty('source', 'acc-1')
      expect(edge).toHaveProperty('target', 'acc-2')
      expect(edge).toHaveProperty('id', 'tx-1')
      expect(edge).toHaveProperty('type', 'line')
      expect(edge).toHaveProperty('originalData', mockTransactions[0])
    })

    it('should scale line width with transaction amount', () => {
      const smallTx: Transaction = {
        id: 'tx-small',
        from: 'a',
        to: 'b',
        amount: 100,
        currency: 'USD',
        timestamp: new Date()
      }

      const largeTx: Transaction = {
        id: 'tx-large',
        from: 'a',
        to: 'b',
        amount: 1000000,
        currency: 'USD',
        timestamp: new Date()
      }

      const smallEdge = transformTransactionEdge(smallTx)
      const largeEdge = transformTransactionEdge(largeTx)

      expect(largeEdge.style?.lineWidth).toBeGreaterThan(smallEdge.style?.lineWidth || 0)
    })

    it('should highlight flagged transactions', () => {
      const edge = transformTransactionEdge(mockTransactions[2])

      expect(edge.style?.stroke).toBe('#dc2626') // red for flagged
      expect(edge.style).toHaveProperty('shadowBlur')
    })
  })

  describe('detectCircularFlows', () => {
    it('should detect circular money flows', () => {
      const patterns = detectCircularFlows(mockTransactions)

      expect(patterns.length).toBeGreaterThan(0)
      const circularPattern = patterns.find(p => p.type === 'circular')
      expect(circularPattern).toBeDefined()
      expect(circularPattern?.accounts.length).toBeGreaterThanOrEqual(3)
    })

    it('should classify pattern severity', () => {
      const patterns = detectCircularFlows(mockTransactions)

      patterns.forEach(pattern => {
        expect(['high', 'medium', 'low']).toContain(pattern.severity)
      })
    })
  })

  describe('detectLayering', () => {
    it('should detect rapid sequential transactions', () => {
      // Create mock transactions with rapid sequences
      const rapidTxs: Transaction[] = Array.from({ length: 6 }, (_, i) => ({
        id: `rapid-tx-${i}`,
        from: 'acc-1',
        to: `acc-${i + 2}`,
        amount: 5000,
        currency: 'USD',
        timestamp: new Date(`2024-01-01T10:${i.toString().padStart(2, '0')}:00Z`)
      }))

      const patterns = detectLayering(rapidTxs)

      expect(patterns.length).toBeGreaterThan(0)
      const layeringPattern = patterns.find(p => p.type === 'layering')
      expect(layeringPattern).toBeDefined()
    })

    it('should calculate severity based on transaction count', () => {
      const rapidTxs: Transaction[] = Array.from({ length: 12 }, (_, i) => ({
        id: `tx-${i}`,
        from: 'acc-1',
        to: `acc-${i + 2}`,
        amount: 5000,
        currency: 'USD',
        timestamp: new Date(`2024-01-01T10:${i.toString().padStart(2, '0')}:00Z`)
      }))

      const patterns = detectLayering(rapidTxs)
      const pattern = patterns[0]

      expect(pattern.severity).toBe('high') // 10+ transactions
    })
  })

  describe('detectStructuring', () => {
    it('should detect structuring (amounts just below reporting threshold)', () => {
      // Create transactions just below $10,000 threshold
      const structuredTxs: Transaction[] = Array.from({ length: 3 }, (_, i) => ({
        id: `struct-tx-${i}`,
        from: 'acc-1',
        to: 'acc-2',
        amount: 9500, // Just below $10k threshold
        currency: 'USD',
        timestamp: new Date(`2024-01-0${i + 1}T10:00:00Z`)
      }))

      const patterns = detectStructuring(structuredTxs)

      expect(patterns.length).toBeGreaterThan(0)
      const structPattern = patterns.find(p => p.type === 'structuring')
      expect(structPattern).toBeDefined()
      expect(structPattern?.severity).toBe('high')
    })
  })

  describe('transformFinancialFlowToG6', () => {
    it('should create complete graph data', () => {
      const graphData = transformFinancialFlowToG6(mockAccounts, mockTransactions)

      expect(graphData).toHaveProperty('nodes')
      expect(graphData).toHaveProperty('edges')
      expect(graphData.nodes).toHaveLength(3)
      expect(graphData.edges).toHaveLength(3)
    })
  })

  describe('filterByAccountType', () => {
    it('should filter accounts by type', () => {
      const graphData = transformFinancialFlowToG6(mockAccounts, mockTransactions)
      const filtered = filterByAccountType(graphData, ['personal', 'business'])

      expect(filtered.nodes?.length).toBe(2)
      filtered.nodes?.forEach(node => {
        const data = (node as any).originalData as FinancialAccount
        expect(['personal', 'business']).toContain(data.type)
      })
    })

    it('should filter edges to match filtered nodes', () => {
      const graphData = transformFinancialFlowToG6(mockAccounts, mockTransactions)
      const filtered = filterByAccountType(graphData, ['personal'])

      // Only 1 personal account, no valid edges
      expect(filtered.edges?.length).toBe(0)
    })
  })

  describe('filterByAmount', () => {
    it('should filter transactions by minimum amount', () => {
      const graphData = transformFinancialFlowToG6(mockAccounts, mockTransactions)
      const filtered = filterByAmount(graphData, 45000)

      expect(filtered.edges?.length).toBe(2) // Only 2 transactions >= 45000
    })
  })

  describe('getFinancialStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getFinancialStats(mockAccounts, mockTransactions)

      expect(stats.totalAccounts).toBe(3)
      expect(stats.totalTransactions).toBe(3)
      expect(stats.totalVolume).toBe(135000) // Sum of all transactions
      expect(stats.flaggedTransactions).toBe(1)
      expect(stats.highRiskAccounts).toBe(1) // acc-2 with risk score 85
    })

    it('should calculate average transaction size', () => {
      const stats = getFinancialStats(mockAccounts, mockTransactions)

      expect(stats.avgTransactionSize).toBe(45000) // 135000 / 3
    })

    it('should count account types', () => {
      const stats = getFinancialStats(mockAccounts, mockTransactions)

      expect(stats.accountTypeCounts).toHaveProperty('personal', 1)
      expect(stats.accountTypeCounts).toHaveProperty('offshore', 1)
      expect(stats.accountTypeCounts).toHaveProperty('business', 1)
    })
  })
})
