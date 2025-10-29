/**
 * G6 Timeline Graph Component
 *
 * Hierarchical timeline visualization using Dagre layout
 * Shows temporal flow and causal relationships between events
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, Filter, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import { transformTimelineToG6, filterBySignificance, filterByEventType, findEventChains } from '@/lib/g6/utils/timelineTransform'
import { DAGRE_LAYOUT } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'

export interface G6TimelineGraphProps {
  events: TimelineEvent[]
  width?: number
  height?: number
  onEventClick?: (event: TimelineEvent) => void
  className?: string
}

export function G6TimelineGraph({
  events,
  width = 800,
  height = 600,
  onEventClick,
  className
}: G6TimelineGraphProps) {
  const [selectedSignificance, setSelectedSignificance] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showPaths, setShowPaths] = useState(false)

  // Transform data to G6 format
  const baseGraphData = useMemo(() => {
    return transformTimelineToG6(events)
  }, [events])

  // Apply filters
  const graphData = useMemo(() => {
    let filtered = baseGraphData

    if (selectedSignificance.length > 0) {
      filtered = filterBySignificance(filtered, selectedSignificance)
    }

    if (selectedTypes.length > 0) {
      filtered = filterByEventType(filtered, selectedTypes)
    }

    return filtered
  }, [baseGraphData, selectedSignificance, selectedTypes])

  // Dagre layout for chronological flow (top to bottom)
  const layout = useMemo(() => {
    return {
      ...DAGRE_LAYOUT,
      rankdir: 'TB', // Top to bottom for chronological flow
      ranksep: 80,
      nodesep: 60
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
      const originalData = (model as any).originalData as TimelineEvent
      if (originalData) {
        setSelectedEventId(model.id as string)
        graph.selectNode(model.id as string)
        onEventClick?.(originalData)

        // Show path from this event forward if enabled
        if (showPaths) {
          graph.highlightNeighbors(model.id as string)
        }
      }
    },
    onCanvasClick: () => {
      if (selectedEventId) {
        graph.unselectNode(selectedEventId)
        graph.clearHighlight()
        setSelectedEventId(null)
      }
    }
  })

  // Toggle significance filter
  const toggleSignificance = (sig: string) => {
    setSelectedSignificance(prev =>
      prev.includes(sig)
        ? prev.filter(s => s !== sig)
        : [...prev, sig]
    )
  }

  // Toggle type filter
  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedSignificance([])
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
    graph.downloadImage(`timeline-${Date.now()}`)
  }

  const togglePaths = () => {
    setShowPaths(!showPaths)
    if (!showPaths && selectedEventId) {
      graph.highlightNeighbors(selectedEventId)
    } else {
      graph.clearHighlight()
    }
  }

  // Get unique event types and significance levels
  const eventTypes = useMemo(() => {
    return Array.from(new Set(events.map(e => e.type)))
  }, [events])

  const significanceLevels = useMemo(() => {
    return Array.from(new Set(events.map(e => e.significance)))
  }, [events])

  const hasFilters = selectedSignificance.length > 0 || selectedTypes.length > 0

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${hasFilters ? 'border-2 border-blue-500' : ''}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-medium">
                {hasFilters ? `Filtered (${selectedSignificance.length + selectedTypes.length})` : 'Filter'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Significance</DropdownMenuLabel>
            {significanceLevels.map(sig => (
              <DropdownMenuItem
                key={sig}
                onClick={() => toggleSignificance(sig)}
                className="cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedSignificance.includes(sig)}
                  readOnly
                  className="mr-2"
                />
                {sig}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">Event Type</DropdownMenuLabel>
            {eventTypes.map(type => (
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
                {type}
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

        {/* Path Highlighting Toggle */}
        <Button
          variant="secondary"
          size="icon"
          onClick={togglePaths}
          className={`h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${showPaths ? 'border-2 border-blue-500' : ''}`}
          title={showPaths ? 'Hide Paths' : 'Show Paths'}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>

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

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Event Flow</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span className="text-gray-700">Causal Link</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-purple-500" />
            <span className="text-gray-700">Concurrent</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-gray-300 border-dashed border border-gray-400" />
            <span className="text-gray-700">Temporal</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!selectedEventId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-2 left-2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm"
        >
          Events flow chronologically from top to bottom • Click to view details
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">Loading timeline...</div>
        </div>
      )}
    </div>
  )
}
