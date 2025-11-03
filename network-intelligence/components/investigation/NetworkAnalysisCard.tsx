/**
 * Network Analysis Card
 *
 * Displays network connections and relationships between subjects
 * Part of the progressive investigation drill-down workflow
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Network,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { G6NetworkGraph } from '@/components/g6/G6NetworkGraph'

export interface NetworkNode {
  id: string
  name: string
  type: 'subject' | 'associate' | 'location' | 'organization'
  riskLevel?: 'high' | 'medium' | 'low'
}

export interface NetworkConnection {
  from: string
  to: string
  type: 'communication' | 'meeting' | 'financial' | 'social'
  frequency: number
  lastContact?: Date
}

export interface NetworkAnalysisCardProps {
  centerNode: NetworkNode
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  onAction?: (action: string, data: any) => void
  onClose?: () => void
  className?: string
}

export function NetworkAnalysisCard({
  centerNode,
  nodes,
  connections,
  onAction,
  onClose,
  className
}: NetworkAnalysisCardProps) {
  console.log('🟢 NetworkAnalysisCard rendering with:', { centerNode: centerNode.name, nodesCount: nodes.length, connectionsCount: connections.length })

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [containerWidth, setContainerWidth] = useState(400)
  const [isLayoutReady, setIsLayoutReady] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Measure container width with proper timing for panel animations
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth

        // Use measured width if valid, otherwise use calculated fallback
        // Fallback: 600px (panel) - 1px (border) - 32px (card padding) = 567px
        const MIN_WIDTH = 567
        const effectiveWidth = width > 0 ? width - 32 : MIN_WIDTH

        console.log('📏 NetworkAnalysisCard width measurement:', {
          measured: width,
          effective: effectiveWidth,
          containerReady: !!containerRef.current
        })

        setContainerWidth(effectiveWidth)
        setIsLayoutReady(true)
      }
    }

    // Delay initial measurement to allow panel animation to complete (350ms)
    // This ensures stable dimensions before G6 initializes
    const initialTimer = setTimeout(() => {
      updateWidth()
    }, 350)

    // Also listen for window resizes
    window.addEventListener('resize', updateWidth)

    return () => {
      clearTimeout(initialTimer)
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  // Get connections for a specific node
  const getNodeConnections = (nodeId: string) => {
    return connections.filter(c => c.from === nodeId || c.to === nodeId)
  }

  // Count connection types
  const connectionStats = connections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-full bg-white rounded-lg border border-purple-200 shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-100 bg-purple-50/50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Network Analysis
              </h3>
              <div className="text-xs text-gray-600 mt-1">
                {nodes.length} nodes • {connections.length} connections
              </div>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 rounded hover:bg-white/50 shrink-0"
            >
              <X className="h-3.5 w-3.5 text-gray-500 hover:text-gray-900" />
            </Button>
          )}
        </div>
      </div>

      {/* Connection Stats */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(connectionStats).map(([type, count]) => (
            <div key={type} className="bg-white rounded-md p-2 border border-gray-100">
              <div className="text-[9px] text-gray-500 uppercase tracking-wide">{type}</div>
              <div className="text-sm font-bold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Visualization - G6 Graph */}
      <div className="p-4 bg-gray-50/30 relative">
        <G6NetworkGraph
          centerNode={centerNode}
          nodes={nodes}
          connections={connections}
          width={containerWidth}
          height={400}
          onNodeClick={(node) => {
            setSelectedNode(node)
          }}
          onEdgeClick={(connection) => {
            // Could show edge details if needed
            console.log('Edge clicked:', connection)
          }}
        />
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="p-3 border-t border-gray-200 bg-blue-50/30">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{selectedNode.name}</h4>
              <div className="text-xs text-gray-600 capitalize mt-0.5">{selectedNode.type}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
              className="h-6 text-xs"
            >
              Close
            </Button>
          </div>
          <div className="text-xs text-gray-700">
            {getNodeConnections(selectedNode.id).length} connections to {centerNode.name}
          </div>
          <div className="mt-2 space-x-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onAction?.('view-profile', selectedNode)}
            >
              View Profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onAction?.('expand-network', selectedNode)}
            >
              Expand Network
            </Button>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-8 text-xs border-gray-200 hover:bg-white"
            onClick={() => onAction?.('add-to-map', { nodes, connections })}
          >
            Add to Map
          </Button>
          <Button
            variant="outline"
            className="h-8 text-xs border-gray-200 hover:bg-white"
            onClick={() => onAction?.('export-network', { nodes, connections })}
          >
            Export Graph
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
