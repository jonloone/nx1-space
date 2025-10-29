/**
 * Alert Network Tab
 * Subject connection visualization using graphology + force-directed layout
 */

'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Network, User, Building2, Phone, Mail, MapPin, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { getCitizens360DataService } from '@/lib/services/citizens360DataService'
import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'

export interface AlertNetworkTabProps {
  alert: IntelligenceAlert
  onSubjectClick?: (subjectId: string) => void
}

// Node types and colors
const NODE_COLORS = {
  subject: '#3b82f6',      // blue-600
  associate: '#8b5cf6',    // violet-600
  location: '#10b981',     // emerald-600
  organization: '#f59e0b', // amber-600
  contact: '#ec4899'       // pink-600
}

/**
 * Force-Directed Network Graph Visualization
 */
function NetworkGraphVisualization({
  graph,
  onNodeClick
}: {
  graph: Graph
  onNodeClick?: (nodeId: string, nodeData: any) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Run force-directed layout
    const positions = forceAtlas2(graph, {
      iterations: 100,
      settings: {
        gravity: 1,
        scalingRatio: 10,
        strongGravityMode: false,
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        slowDown: 1,
        linLogMode: false
      }
    })

    // Normalize positions to canvas bounds
    const nodeIds = graph.nodes()
    const xValues = nodeIds.map(id => positions[id].x)
    const yValues = nodeIds.map(id => positions[id].y)

    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)

    const padding = 40
    const scaleX = (width - 2 * padding) / (maxX - minX)
    const scaleY = (height - 2 * padding) / (maxY - minY)

    const normalizedPositions: Record<string, { x: number; y: number }> = {}
    nodeIds.forEach(id => {
      normalizedPositions[id] = {
        x: (positions[id].x - minX) * scaleX + padding,
        y: (positions[id].y - minY) * scaleY + padding
      }
    })

    // Rendering function
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw edges
      ctx.strokeStyle = '#d1d5db' // gray-300
      ctx.lineWidth = 1

      graph.forEachEdge((edge, attributes, source, target) => {
        const sourcePos = normalizedPositions[source]
        const targetPos = normalizedPositions[target]

        if (sourcePos && targetPos) {
          ctx.beginPath()
          ctx.moveTo(sourcePos.x, sourcePos.y)
          ctx.lineTo(targetPos.x, targetPos.y)
          ctx.stroke()
        }
      })

      // Draw nodes
      graph.forEachNode((node, attributes) => {
        const pos = normalizedPositions[node]
        if (!pos) return

        const radius = attributes.size || 8
        const color = attributes.color || '#6b7280'
        const isHovered = hoveredNode === node

        // Node circle
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, isHovered ? radius * 1.3 : radius, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()

        // White border
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()

        // Label
        if (attributes.label) {
          ctx.fillStyle = '#1f2937'
          ctx.font = '10px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(attributes.label, pos.x, pos.y + radius + 4)
        }
      })
    }

    render()

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let foundNode: string | null = null

      graph.forEachNode((node, attributes) => {
        const pos = normalizedPositions[node]
        if (!pos) return

        const radius = attributes.size || 8
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)

        if (distance <= radius) {
          foundNode = node
        }
      })

      if (foundNode !== hoveredNode) {
        setHoveredNode(foundNode)
        render()
      }

      canvas.style.cursor = foundNode ? 'pointer' : 'default'
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      graph.forEachNode((node, attributes) => {
        const pos = normalizedPositions[node]
        if (!pos) return

        const radius = attributes.size || 8
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)

        if (distance <= radius) {
          onNodeClick?.(node, attributes)
        }
      })
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [graph, hoveredNode, onNodeClick])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="border border-gray-200 rounded-lg bg-white"
    />
  )
}

/**
 * Alert Network Tab Component
 */
export function AlertNetworkTab({ alert, onSubjectClick }: AlertNetworkTabProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: any } | null>(null)

  // Build network graph
  const graph = useMemo(() => {
    const g = new Graph()

    try {
      // Add primary subject node
      g.addNode(alert.subjectId, {
        label: alert.subjectName.split(' ')[0], // First name only
        type: 'subject',
        color: NODE_COLORS.subject,
        size: 12,
        fullName: alert.subjectName
      })

      // Add location node if available
      if (alert.location) {
        const locationId = `loc-${alert.location.coordinates.join(',')}`
        g.addNode(locationId, {
          label: alert.location.name.split(',')[0], // First part of location
          type: 'location',
          color: NODE_COLORS.location,
          size: 10,
          fullName: alert.location.name,
          coordinates: alert.location.coordinates
        })

        g.addEdge(alert.subjectId, locationId, {
          type: 'visited'
        })
      }

      // Add case organization node
      const caseId = alert.caseNumber
      g.addNode(caseId, {
        label: alert.caseName.split(' ')[0], // First word
        type: 'organization',
        color: NODE_COLORS.organization,
        size: 10,
        fullName: alert.caseName
      })

      g.addEdge(alert.subjectId, caseId, {
        type: 'associated_with'
      })

      // Add mock associates (in real implementation, load from data service)
      const associates = [
        { id: 'assoc-1', name: 'Associate A', type: 'contact' },
        { id: 'assoc-2', name: 'Associate B', type: 'contact' }
      ]

      associates.forEach(assoc => {
        g.addNode(assoc.id, {
          label: assoc.name.split(' ')[0],
          type: assoc.type,
          color: NODE_COLORS.contact,
          size: 8,
          fullName: assoc.name
        })

        g.addEdge(alert.subjectId, assoc.id, {
          type: 'knows'
        })
      })

      setLoading(false)
      return g
    } catch (err) {
      console.error('Failed to build network graph:', err)
      setError(err instanceof Error ? err.message : 'Failed to build graph')
      setLoading(false)
      return g
    }
  }, [alert])

  const handleNodeClick = (nodeId: string, nodeData: any) => {
    console.log('Node clicked:', nodeId, nodeData)
    setSelectedNode({ id: nodeId, data: nodeData })

    if (nodeData.type === 'subject' && onSubjectClick) {
      onSubjectClick(nodeId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Building network graph...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <div className="text-sm text-gray-900 font-medium mb-1">Failed to build network</div>
          <div className="text-xs text-gray-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Network Statistics */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{graph.order}</div>
            <div className="text-xs text-gray-600">Nodes</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{graph.size}</div>
            <div className="text-xs text-gray-600">Connections</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{graph.degree(alert.subjectId)}</div>
            <div className="text-xs text-gray-600">Subject Links</div>
          </CardContent>
        </Card>
      </div>

      {/* Network Graph */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Connection Network
            </CardTitle>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Interactive visualization of subject relationships
          </p>
        </CardHeader>
        <CardContent className="pt-0 flex justify-center">
          <NetworkGraphVisualization graph={graph} onNodeClick={handleNodeClick} />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-gray-700">Legend</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.subject }} />
            <span className="text-gray-700">Subject</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.location }} />
            <span className="text-gray-700">Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.organization }} />
            <span className="text-gray-700">Case</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.contact }} />
            <span className="text-gray-700">Contact</span>
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="border-gray-200 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-blue-900">
                  Selected Node
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Name:</span>
              <span className="font-medium text-blue-900">{selectedNode.data.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Type:</span>
              <Badge className="bg-blue-600 text-white text-[10px]">
                {selectedNode.data.type}
              </Badge>
            </div>
            {selectedNode.data.type === 'subject' && onSubjectClick && (
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                onClick={() => onSubjectClick(selectedNode.id)}
              >
                View Subject Profile
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
