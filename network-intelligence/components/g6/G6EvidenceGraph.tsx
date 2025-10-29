/**
 * G6 Evidence Graph Component
 *
 * Visualizes evidence relationships and chain of custody
 * Uses tree/hierarchical layout for clear custody tracking
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, Filter, FileText, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import {
  type Evidence,
  type EvidenceRelationship,
  type CustodyTransfer,
  transformEvidenceToG6,
  transformCustodyChainToG6,
  filterByIntegrity,
  filterByEvidenceType,
  getEvidenceStats
} from '@/lib/g6/utils/evidenceTransform'
import { DAGRE_LAYOUT } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

export interface G6EvidenceGraphProps {
  evidenceItems: Evidence[]
  relationships?: EvidenceRelationship[]
  custodyTransfers?: CustodyTransfer[]
  mode?: 'evidence' | 'custody' // Switch between evidence relationships and custody chain
  focusEvidenceId?: string // For custody mode, which evidence to show chain for
  width?: number
  height?: number
  onEvidenceClick?: (evidence: Evidence) => void
  className?: string
}

export function G6EvidenceGraph({
  evidenceItems,
  relationships = [],
  custodyTransfers = [],
  mode = 'evidence',
  focusEvidenceId,
  width = 800,
  height = 600,
  onEvidenceClick,
  className
}: G6EvidenceGraphProps) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [selectedIntegrity, setSelectedIntegrity] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // Transform data based on mode
  const baseGraphData = useMemo(() => {
    if (mode === 'custody' && focusEvidenceId) {
      const evidence = evidenceItems.find(e => e.id === focusEvidenceId)
      if (evidence) {
        return transformCustodyChainToG6(evidence, custodyTransfers)
      }
    }
    return transformEvidenceToG6(evidenceItems, relationships)
  }, [mode, focusEvidenceId, evidenceItems, relationships, custodyTransfers])

  // Apply filters
  const graphData = useMemo(() => {
    let filtered = baseGraphData

    if (selectedIntegrity.length > 0) {
      filtered = filterByIntegrity(filtered, selectedIntegrity)
    }

    if (selectedTypes.length > 0) {
      filtered = filterByEvidenceType(filtered, selectedTypes)
    }

    return filtered
  }, [baseGraphData, selectedIntegrity, selectedTypes])

  // Layout: Tree/Dagre for custody chain, Dagre for evidence relationships
  const layout = useMemo(() => {
    if (mode === 'custody') {
      return {
        ...DAGRE_LAYOUT,
        rankdir: 'TB', // Top to bottom for custody chain
        ranksep: 70,
        nodesep: 50
      }
    }
    return {
      ...DAGRE_LAYOUT,
      rankdir: 'LR', // Left to right for evidence relationships
      ranksep: 100,
      nodesep: 60
    }
  }, [mode])

  // Initialize G6 graph
  const graph = useG6Graph({
    data: graphData,
    layout,
    width,
    height,
    fitView: true,
    animate: true,
    onNodeClick: (model) => {
      const originalData = (model as any).originalData as Evidence
      const nodeType = (model as any).nodeType as string

      // Only handle evidence nodes, not custodian nodes
      if (originalData && nodeType !== 'custodian') {
        setSelectedEvidenceId(model.id as string)
        graph.selectNode(model.id as string)
        onEvidenceClick?.(originalData)

        // Highlight related evidence
        graph.highlightNeighbors(model.id as string)
      }
    },
    onCanvasClick: () => {
      if (selectedEvidenceId) {
        graph.unselectNode(selectedEvidenceId)
        graph.clearHighlight()
        setSelectedEvidenceId(null)
      }
    }
  })

  // Calculate statistics
  const stats = useMemo(() => {
    return getEvidenceStats(evidenceItems, custodyTransfers)
  }, [evidenceItems, custodyTransfers])

  // Get unique integrity statuses and types
  const integrityStatuses = useMemo(() => {
    return Array.from(new Set(evidenceItems.map(e => e.integrityStatus)))
  }, [evidenceItems])

  const types = useMemo(() => {
    return Array.from(new Set(evidenceItems.map(e => e.type)))
  }, [evidenceItems])

  // Toggle filters
  const toggleIntegrity = (status: string) => {
    setSelectedIntegrity(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedIntegrity([])
    setSelectedTypes([])
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
    graph.downloadImage(`evidence-${mode}-${Date.now()}`)
  }

  const hasFilters = selectedIntegrity.length > 0 || selectedTypes.length > 0

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
        {/* Filter Menu */}
        {mode === 'evidence' && (
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">Integrity Status</DropdownMenuLabel>
              {integrityStatuses.map(status => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => toggleIntegrity(status)}
                  className="cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedIntegrity.includes(status)}
                    readOnly
                    className="mr-2"
                  />
                  <span className="capitalize">{status}</span>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs">Evidence Type</DropdownMenuLabel>
              {types.map(type => (
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
        )}

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
          {mode === 'custody' ? 'Chain of Custody' : 'Evidence Collection'}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-3 h-3 text-blue-600" />
            <span className="text-gray-700">{stats.totalEvidence} items</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span className="text-gray-700">{stats.integrityCounts.verified || 0} verified</span>
          </div>
          {stats.integrityCounts.compromised && stats.integrityCounts.compromised > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-gray-700">{stats.integrityCounts.compromised} compromised</span>
            </div>
          )}
          {mode === 'custody' && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-0.5 bg-emerald-500" />
              <span className="text-gray-700">{stats.custodyTransfers} transfers</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">
          {mode === 'custody' ? 'Transfer Types' : 'Relationships'}
        </div>
        <div className="space-y-1">
          {mode === 'custody' ? (
            <>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-emerald-500" />
                <span className="text-gray-700">Verified Transfer</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-amber-500" />
                <span className="text-gray-700">Unverified Transfer</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-blue-500" />
                <span className="text-gray-700">Derived From</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-purple-500 border-dashed border-t" />
                <span className="text-gray-700">Related To</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-emerald-500" />
                <span className="text-gray-700">Supports</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-0.5 bg-red-500 border-dotted border-t" />
                <span className="text-gray-700">Contradicts</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!selectedEvidenceId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm whitespace-nowrap"
        >
          {mode === 'custody'
            ? 'Custody flows from top to bottom • Click for details'
            : 'Click evidence to view relationships • ✓ = verified'}
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">
            Loading {mode === 'custody' ? 'custody chain' : 'evidence graph'}...
          </div>
        </div>
      )}
    </div>
  )
}
