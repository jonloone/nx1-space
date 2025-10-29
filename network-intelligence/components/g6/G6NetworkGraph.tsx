/**
 * G6 Network Graph Component
 *
 * Professional graph visualization using AntV G6
 * Replaces the basic SVG visualization in NetworkAnalysisCard
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import { transformNetworkToG6 } from '@/lib/g6/utils/dataTransform'
import { getLayoutByName, LAYOUT_OPTIONS } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Import network types
import type { NetworkNode, NetworkConnection } from '@/components/investigation/NetworkAnalysisCard'

export interface G6NetworkGraphProps {
  centerNode: NetworkNode
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  width?: number
  height?: number
  onNodeClick?: (node: NetworkNode) => void
  onEdgeClick?: (connection: NetworkConnection) => void
  className?: string
}

export function G6NetworkGraph({
  centerNode,
  nodes,
  connections,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
  className
}: G6NetworkGraphProps) {
  console.log('🟡 G6NetworkGraph rendering with:', { centerNode: centerNode.name, nodesCount: nodes.length, connectionsCount: connections.length, width, height })

  const [layoutType, setLayoutType] = useState('force')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Transform data to G6 format
  const graphData = useMemo(() => {
    const data = transformNetworkToG6(centerNode, nodes, connections)
    console.log('🟡 G6 transformed data:', { nodes: data.nodes?.length, edges: data.edges?.length })
    return data
  }, [centerNode, nodes, connections])

  // Get layout configuration
  const layout = useMemo(() => {
    return getLayoutByName(layoutType)
  }, [layoutType])

  // Initialize G6 graph
  const graph = useG6Graph({
    data: graphData,
    layout,
    width,
    height,
    fitView: true,
    animate: true,
    onNodeClick: (model) => {
      const originalData = (model as any).originalData as NetworkNode
      if (originalData) {
        setSelectedNodeId(model.id as string)
        graph.selectNode(model.id as string)
        graph.highlightNeighbors(model.id as string)
        onNodeClick?.(originalData)
      }
    },
    onEdgeClick: (model) => {
      const originalData = (model as any).originalData as NetworkConnection
      if (originalData) {
        onEdgeClick?.(originalData)
      }
    },
    onCanvasClick: () => {
      if (selectedNodeId) {
        graph.unselectNode(selectedNodeId)
        graph.clearHighlight()
        setSelectedNodeId(null)
      }
    }
  })

  const handleLayoutChange = (newLayout: string) => {
    setLayoutType(newLayout)
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
    graph.downloadImage(`network-${centerNode.name.replace(/\s+/g, '-').toLowerCase()}`)
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* Graph Container */}
      <div
        ref={graph.containerRef}
        className="bg-gray-50/30 rounded-lg border border-gray-200 overflow-hidden"
        style={{ width, height }}
      />

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        {/* Layout Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-medium">
                {LAYOUT_OPTIONS.find(opt => opt.value === layoutType)?.label || 'Layout'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {LAYOUT_OPTIONS.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleLayoutChange(option.value)}
                className="cursor-pointer"
              >
                <div>
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
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

      {/* Instructions */}
      {!selectedNodeId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm"
        >
          Click nodes to view details • Drag to pan • Scroll to zoom
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">Loading graph...</div>
        </div>
      )}
    </div>
  )
}
