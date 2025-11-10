/**
 * Network Side Panel
 *
 * Wide side panel (900px) for network graph visualization
 * Slides in from right and pushes map to stay centered
 */

'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { G6NetworkGraph } from '@/components/g6/G6NetworkGraph'
import { cn } from '@/lib/utils'
import type { NetworkNode, NetworkConnection } from '@/components/investigation/NetworkAnalysisCard'

export interface NetworkSidePanelProps {
  isOpen: boolean
  centerNode: NetworkNode
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  onClose: () => void
  onNodeClick?: (node: NetworkNode) => void
  onEdgeClick?: (connection: NetworkConnection) => void
  onAction?: (action: string, data: any) => void
}

const PANEL_WIDTH = 900 // Twice the normal card width

export function NetworkSidePanel({
  isOpen,
  centerNode,
  nodes,
  connections,
  onClose,
  onNodeClick,
  onEdgeClick,
  onAction
}: NetworkSidePanelProps) {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<NetworkNode | null>(null)

  // Notify parent about map padding when panel opens/closes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dispatch custom event for map to adjust padding
      const event = new CustomEvent('network-panel-change', {
        detail: { isOpen, panelWidth: PANEL_WIDTH }
      })
      window.dispatchEvent(event)
    }
  }, [isOpen])

  // Get connections for a specific node
  const getNodeConnections = (nodeId: string) => {
    return (connections || []).filter(c => c.from === nodeId || c.to === nodeId)
  }

  // Count connection types (with safety check)
  const connectionStats = (connections || []).reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: PANEL_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: PANEL_WIDTH }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col"
            style={{ width: isMaximized ? '100vw' : PANEL_WIDTH }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Network Analysis
                    </h2>
                    <p className="text-sm text-gray-600">
                      {centerNode.name} • {nodes.length} nodes • {(connections || []).length} connections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="h-9 w-9 rounded-lg hover:bg-white/80"
                    title={isMaximized ? 'Restore' : 'Maximize'}
                  >
                    {isMaximized ? (
                      <Minimize2 className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-9 w-9 rounded-lg hover:bg-white/80"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Connection Stats Bar */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(connectionStats).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      type === 'communication' ? 'bg-blue-500' :
                      type === 'meeting' ? 'bg-purple-500' :
                      type === 'financial' ? 'bg-green-500' :
                      type === 'family' ? 'bg-pink-500' :
                      type === 'employment' ? 'bg-teal-500' :
                      type === 'ownership' ? 'bg-orange-500' :
                      'bg-gray-500'
                    )} />
                    <span className="text-gray-600 capitalize">{type}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Graph */}
            <div className="flex-1 p-6 overflow-hidden bg-gray-50/30">
              <G6NetworkGraph
                centerNode={centerNode}
                nodes={nodes}
                connections={connections}
                width={isMaximized ? window.innerWidth - 48 : PANEL_WIDTH - 48}
                height={typeof window !== 'undefined' ? window.innerHeight - 220 : 700}
                onNodeClick={(node) => {
                  setSelectedNode(node)
                  onNodeClick?.(node)
                }}
                onEdgeClick={onEdgeClick}
                className="rounded-lg"
              />
            </div>

            {/* Node Details Footer */}
            {selectedNode && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="border-t border-gray-200 bg-blue-50/30 backdrop-blur-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{selectedNode.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 capitalize">{selectedNode.type}</span>
                      {selectedNode.riskLevel && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className={cn(
                            'text-xs font-medium',
                            selectedNode.riskLevel === 'high' ? 'text-red-600' :
                            selectedNode.riskLevel === 'medium' ? 'text-amber-600' :
                            'text-green-600'
                          )}>
                            {selectedNode.riskLevel.toUpperCase()} RISK
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNode(null)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
                <div className="text-xs text-gray-700 mb-3">
                  {getNodeConnections(selectedNode.id).length} connections to {centerNode.name}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-gray-200 hover:bg-white"
                    onClick={() => onAction?.('view-profile', selectedNode)}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-gray-200 hover:bg-white"
                    onClick={() => onAction?.('expand-network', selectedNode)}
                  >
                    Expand Network
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-gray-200 hover:bg-white"
                    onClick={() => onAction?.('show-timeline', selectedNode)}
                  >
                    Show Timeline
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Actions Footer */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-9 text-xs border-gray-200 hover:bg-gray-50"
                  onClick={() => onAction?.('add-to-map', { nodes, connections })}
                >
                  Add to Map
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-xs border-gray-200 hover:bg-gray-50"
                  onClick={() => onAction?.('export-network', { nodes, connections })}
                >
                  Export Graph
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-xs border-gray-200 hover:bg-gray-50"
                  onClick={() => onAction?.('analyze-network', { centerNode, nodes, connections })}
                >
                  Run Analysis
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
