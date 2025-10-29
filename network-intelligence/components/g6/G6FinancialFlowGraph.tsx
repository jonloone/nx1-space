/**
 * G6 Financial Flow Graph Component
 *
 * Visualizes financial transactions and money flows
 * Detects patterns like circular flows, layering, and structuring
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, Filter, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import {
  type FinancialAccount,
  type Transaction,
  type TransactionPattern,
  transformFinancialFlowToG6,
  filterByAccountType,
  filterByAmount,
  filterFlagged,
  getFinancialStats,
  detectCircularFlows,
  detectLayering,
  detectStructuring
} from '@/lib/g6/utils/financialFlowTransform'
import { FORCE_LAYOUT } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

export interface G6FinancialFlowGraphProps {
  accounts: FinancialAccount[]
  transactions: Transaction[]
  width?: number
  height?: number
  onAccountClick?: (account: FinancialAccount) => void
  onTransactionClick?: (transaction: Transaction) => void
  className?: string
}

export function G6FinancialFlowGraph({
  accounts,
  transactions,
  width = 800,
  height = 600,
  onAccountClick,
  onTransactionClick,
  className
}: G6FinancialFlowGraphProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [minAmount, setMinAmount] = useState(0)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)

  // Detect suspicious patterns
  const patterns = useMemo(() => {
    const circular = detectCircularFlows(transactions)
    const layering = detectLayering(transactions)
    const structuring = detectStructuring(transactions)
    return [...circular, ...layering, ...structuring]
  }, [transactions])

  // Transform to G6 format
  const baseGraphData = useMemo(() => {
    return transformFinancialFlowToG6(accounts, transactions)
  }, [accounts, transactions])

  // Apply filters
  const graphData = useMemo(() => {
    let filtered = baseGraphData

    if (selectedTypes.length > 0) {
      filtered = filterByAccountType(filtered, selectedTypes)
    }

    if (minAmount > 0) {
      filtered = filterByAmount(filtered, minAmount)
    }

    if (showFlaggedOnly) {
      filtered = filterFlagged(filtered)
    }

    return filtered
  }, [baseGraphData, selectedTypes, minAmount, showFlaggedOnly])

  // Force-directed layout for natural flow visualization
  const layout = useMemo(() => {
    return {
      ...FORCE_LAYOUT,
      linkDistance: (edge: any) => {
        // Shorter distance for large transactions (stronger pull)
        const amount = edge.originalData?.amount || 0
        return 200 - Math.min(Math.log10(amount) * 20, 100)
      },
      nodeStrength: (node: any) => {
        // High-risk accounts have stronger repulsion
        const riskScore = node.originalData?.riskScore || 0
        return riskScore > 70 ? -200 : -100
      }
    }
  }, [])

  // Initialize G6 graph
  const graph = useG6Graph({
    data: graphData,
    layout,
    width,
    height,
    fitView: true,
    animate: true,
    onNodeClick: (model) => {
      const originalData = (model as any).originalData as FinancialAccount
      if (originalData) {
        setSelectedAccountId(model.id as string)
        graph.selectNode(model.id as string)
        onAccountClick?.(originalData)

        // Highlight connected transactions
        graph.highlightNeighbors(model.id as string)
      }
    },
    onEdgeClick: (model) => {
      const originalData = (model as any).originalData as Transaction
      if (originalData) {
        onTransactionClick?.(originalData)
      }
    },
    onCanvasClick: () => {
      if (selectedAccountId) {
        graph.unselectNode(selectedAccountId)
        graph.clearHighlight()
        setSelectedAccountId(null)
      }
    }
  })

  // Calculate statistics
  const stats = useMemo(() => {
    return getFinancialStats(accounts, transactions)
  }, [accounts, transactions])

  // Get unique account types
  const accountTypes = useMemo(() => {
    return Array.from(new Set(accounts.map(a => a.type)))
  }, [accounts])

  // Get max transaction amount for slider
  const maxAmount = useMemo(() => {
    return Math.max(...transactions.map(tx => tx.amount), 1)
  }, [transactions])

  // Toggle account type filter
  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([])
    setMinAmount(0)
    setShowFlaggedOnly(false)
  }

  const handleFitView = () => {
    graph.fitView()
  }

  const handleZoomIn = () => {
    graph.zoomIn()
  }

  const handleZoomOut = () => {
    graph.zoomOut()
  }

  const handleDownload = () => {
    graph.downloadImage(`financial-flow-${Date.now()}`)
  }

  const hasFilters = selectedTypes.length > 0 || minAmount > 0 || showFlaggedOnly

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  return (
    <div className={className}>
      {/* Graph Container */}
      <div
        ref={graph.containerRef}
        className="relative bg-gray-50/30 rounded-lg border border-gray-200 overflow-hidden"
        style={{ width, height }}
      />

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {/* Pattern Detection Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPatterns(!showPatterns)}
          className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${patterns.length > 0 ? 'border-2 border-red-500' : ''}`}
          title="Suspicious Patterns Detected"
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs font-medium">
            {patterns.length} {patterns.length === 1 ? 'Pattern' : 'Patterns'}
          </span>
        </Button>

        {/* Filter Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${hasFilters ? 'border-2 border-blue-500' : ''}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-medium">
                {hasFilters ? `Filtered` : 'Filter'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">Account Type</DropdownMenuLabel>
            {accountTypes.map(type => (
              <DropdownMenuItem
                key={type}
                onClick={() => toggleType(type)}
                className="cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  readOnly
                  className="mr-2"
                />
                <span className="capitalize">{type}</span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">
              Min Amount: {formatCurrency(minAmount)}
            </DropdownMenuLabel>
            <div className="px-2 py-2">
              <Slider
                value={[minAmount]}
                onValueChange={(values) => setMinAmount(values[0])}
                min={0}
                max={maxAmount}
                step={1000}
                className="w-full"
              />
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className="cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={showFlaggedOnly}
                readOnly
                className="mr-2"
              />
              Flagged Transactions Only
            </DropdownMenuItem>

            {hasFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearFilters}
                  className="cursor-pointer text-xs text-red-600"
                >
                  Clear All Filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-7 w-7 hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-7 w-7 hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitView}
            className="h-7 w-7 hover:bg-gray-100"
            title="Fit to View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Export Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
          title="Download as Image"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Statistics Panel */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">
          Financial Flow
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span className="text-gray-700">{stats.totalTransactions} transactions</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span className="text-gray-700">{formatCurrency(stats.totalVolume)} total</span>
          </div>
          {stats.flaggedTransactions > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-gray-700">{stats.flaggedTransactions} flagged</span>
            </div>
          )}
          {stats.highRiskAccounts > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span className="text-gray-700">{stats.highRiskAccounts} high-risk</span>
            </div>
          )}
        </div>
      </div>

      {/* Patterns Panel */}
      {showPatterns && patterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-2 right-2 mt-12 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 border-2 border-red-500 shadow-lg max-w-xs max-h-80 overflow-y-auto"
        >
          <div className="text-xs font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Suspicious Patterns Detected
          </div>
          <div className="space-y-2">
            {patterns.slice(0, 5).map((pattern, idx) => (
              <div key={idx} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                <div className="font-semibold text-red-700 capitalize">{pattern.type.replace('-', ' ')}</div>
                <div className="text-gray-700 mt-1">{pattern.description}</div>
                <div className="text-gray-500 mt-1 text-[10px]">
                  {pattern.accounts.length} accounts • {pattern.transactions.length} transactions
                </div>
              </div>
            ))}
            {patterns.length > 5 && (
              <div className="text-[10px] text-gray-500 text-center">
                +{patterns.length - 5} more patterns
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Account Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" />
            <span className="text-gray-700">Personal</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600" />
            <span className="text-gray-700">Business</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-amber-500 border border-amber-600" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <span className="text-gray-700">Offshore</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-red-700" style={{ boxShadow: '0 0 8px #dc2626' }} />
            <span className="text-gray-700">High Risk / Unknown</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!selectedAccountId && !showPatterns && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm"
        >
          Click account to trace flows • Line thickness = transaction size • ⚠ = flagged
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">Analyzing financial flows...</div>
        </div>
      )}
    </div>
  )
}
