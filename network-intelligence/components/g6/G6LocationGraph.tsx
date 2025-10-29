/**
 * G6 Location Network Graph Component
 *
 * Visualizes geographic movement patterns and location relationships
 * Shows location hotspots and subject movement flows
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, Filter, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import {
  type LocationNode,
  type MovementEdge,
  extractLocationsFromTimeline,
  transformLocationNetworkToG6,
  detectCoLocation
} from '@/lib/g6/utils/locationTransform'
import { FORCE_LAYOUT } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'

export interface G6LocationGraphProps {
  events: TimelineEvent[]
  subjectId: string
  subjectName?: string
  width?: number
  height?: number
  onLocationClick?: (location: LocationNode) => void
  className?: string
}

export function G6LocationGraph({
  events,
  subjectId,
  subjectName,
  width = 800,
  height = 600,
  onLocationClick,
  className
}: G6LocationGraphProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [showMovementPaths, setShowMovementPaths] = useState(true)
  const [minVisitCount, setMinVisitCount] = useState(1)

  // Extract locations and movements from timeline
  const { locations, movements } = useMemo(() => {
    return extractLocationsFromTimeline(events, subjectId)
  }, [events, subjectId])

  // Filter by visit count
  const filteredData = useMemo(() => {
    const filteredLocations = locations.filter(loc =>
      (loc.visitCount || 0) >= minVisitCount
    )
    const locationIds = new Set(filteredLocations.map(loc => loc.id))

    const filteredMovements = movements.filter(mov =>
      locationIds.has(mov.from) && locationIds.has(mov.to)
    )

    return { locations: filteredLocations, movements: filteredMovements }
  }, [locations, movements, minVisitCount])

  // Transform to G6 format
  const graphData = useMemo(() => {
    const data = transformLocationNetworkToG6(
      filteredData.locations,
      showMovementPaths ? filteredData.movements : []
    )
    return data
  }, [filteredData, showMovementPaths])

  // Force-directed layout for natural clustering
  const layout = useMemo(() => {
    return {
      ...FORCE_LAYOUT,
      linkDistance: (edge: any) => {
        // Longer distance for less frequent movements
        const frequency = edge.originalData?.frequency || 1
        return 150 - (frequency * 10)
      },
      nodeStrength: (node: any) => {
        // Stronger pull for hotspots
        const visitCount = node.originalData?.visitCount || 0
        return visitCount > 3 ? -150 : -100
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
      const originalData = (model as any).originalData as LocationNode
      if (originalData && originalData.type === 'location') {
        setSelectedLocationId(model.id as string)
        graph.selectNode(model.id as string)
        onLocationClick?.(originalData)

        // Highlight incoming and outgoing movements
        graph.highlightNeighbors(model.id as string)
      }
    },
    onCanvasClick: () => {
      if (selectedLocationId) {
        graph.unselectNode(selectedLocationId)
        graph.clearHighlight()
        setSelectedLocationId(null)
      }
    }
  })

  // Calculate statistics
  const stats = useMemo(() => {
    const hotspots = locations.filter(loc => (loc.visitCount || 0) > 3)
    const totalVisits = locations.reduce((sum, loc) => sum + (loc.visitCount || 0), 0)
    const totalMovements = movements.reduce((sum, mov) => sum + mov.frequency, 0)

    return {
      totalLocations: locations.length,
      hotspots: hotspots.length,
      totalVisits,
      totalMovements
    }
  }, [locations, movements])

  // Toggle movement paths
  const toggleMovementPaths = () => {
    setShowMovementPaths(!showMovementPaths)
  }

  // Handle zoom controls
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
    graph.downloadImage(`location-network-${subjectId}-${Date.now()}`)
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
        {/* Filter Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${minVisitCount > 1 ? 'border-2 border-emerald-500' : ''}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-medium">
                {minVisitCount > 1 ? `${minVisitCount}+ visits` : 'Filter'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Minimum Visits</DropdownMenuLabel>
            {[1, 2, 3, 5].map(count => (
              <DropdownMenuItem
                key={count}
                onClick={() => setMinVisitCount(count)}
                className="cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  checked={minVisitCount === count}
                  readOnly
                  className="mr-2"
                />
                {count === 1 ? 'All locations' : `${count}+ visits`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Movement Path Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleMovementPaths}
          className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${showMovementPaths ? 'border-2 border-purple-500' : ''}`}
          title={showMovementPaths ? 'Hide Movement Paths' : 'Show Movement Paths'}
        >
          <MapPin className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs font-medium">
            {showMovementPaths ? 'Paths On' : 'Paths Off'}
          </span>
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

      {/* Statistics Panel */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">
          {subjectName || 'Subject'} Movement
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span className="text-gray-700">{stats.totalLocations} locations</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-md" />
            <span className="text-gray-700">{stats.hotspots} hotspots</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-purple-500" style={{ width: '12px' }} />
            <span className="text-gray-700">{stats.totalMovements} movements</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Location Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-700" />
            <span className="text-gray-700">Visited Location</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-700" style={{ boxShadow: '0 0 12px #ef4444' }} />
            <span className="text-gray-700">Hotspot (4+ visits)</span>
          </div>
          {showMovementPaths && (
            <div className="flex items-center gap-2 text-xs">
              <div className="relative w-4 h-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="h-0.5 flex-1 bg-purple-500" />
                  <div className="w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent border-l-purple-500" style={{ marginLeft: '-2px' }} />
                </div>
              </div>
              <span className="text-gray-700">Movement Path</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!selectedLocationId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm"
        >
          Click a location to highlight movement paths • Drag to reposition
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">Loading location network...</div>
        </div>
      )}
    </div>
  )
}
