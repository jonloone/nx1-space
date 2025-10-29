'use client'

import React from 'react'
import type { NetworkGraphArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from 'lucide-react'
import { NetworkAnalysisCard } from '@/components/investigation/NetworkAnalysisCard'
import type { NetworkNode, NetworkConnection } from '@/components/investigation/NetworkAnalysisCard'

interface NetworkGraphCardProps {
  artifact: NetworkGraphArtifact
}

export default function NetworkGraphCard({ artifact }: NetworkGraphCardProps) {
  const { data } = artifact

  // Transform NetworkGraphData to NetworkAnalysisCard props
  // NetworkGraphData has: { title, nodes: NetworkNode[], edges: NetworkEdge[], centerNode: string }
  // NetworkAnalysisCard expects: { centerNode: NetworkNode, nodes: NetworkNode[], connections: NetworkConnection[] }

  // Find the center node object
  const centerNodeObj = data.nodes.find(n => n.id === data.centerNode)

  if (!centerNodeObj) {
    return (
      <Card className="border border-border shadow-mundi-sm">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Network data incomplete - center node not found
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform nodes from NetworkGraphData format to NetworkAnalysisCard format
  // NetworkGraphData.nodes have 'label', NetworkAnalysisCard needs 'name'
  const transformedNodes: NetworkNode[] = data.nodes
    .filter(n => n.id !== data.centerNode) // Exclude center node from nodes array
    .map(node => ({
      id: node.id,
      name: node.label, // Map 'label' to 'name'
      type: node.type as 'subject' | 'associate' | 'location' | 'organization',
      riskLevel: node.riskScore && node.riskScore > 70 ? 'high' as const :
                 node.riskScore && node.riskScore > 40 ? 'medium' as const : 'low' as const
    }))

  // Transform center node
  const transformedCenterNode: NetworkNode = {
    id: centerNodeObj.id,
    name: centerNodeObj.label, // Map 'label' to 'name'
    type: centerNodeObj.type as 'subject' | 'associate' | 'location' | 'organization',
    riskLevel: centerNodeObj.riskScore && centerNodeObj.riskScore > 70 ? 'high' as const :
               centerNodeObj.riskScore && centerNodeObj.riskScore > 40 ? 'medium' as const : 'low' as const
  }

  // Transform edges to connections
  // NetworkEdge has: { source, target, type, weight, timestamp?, label? }
  // NetworkConnection has: { from, to, type, frequency, lastContact? }
  const transformedConnections: NetworkConnection[] = data.edges.map(edge => ({
    from: edge.source,
    to: edge.target,
    type: edge.type as 'communication' | 'meeting' | 'financial' | 'social',
    frequency: edge.weight || 1,
    lastContact: edge.timestamp
  }))

  return (
    <Card className="border border-border shadow-mundi-sm hover:shadow-mundi-md transition-all">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mundi-200 flex items-center justify-center">
              <Network className="w-5 h-5 text-mundi-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{data.title}</h3>
              <p className="text-xs text-muted-foreground">
                {data.nodes.length} nodes | {data.edges.length} connections
              </p>
            </div>
          </div>

          {/* Badge */}
          <Badge variant="secondary" className="text-xs">
            Network
          </Badge>
        </div>
      </CardHeader>

      {/* G6 Network Visualization */}
      <CardContent className="p-0">
        <NetworkAnalysisCard
          centerNode={transformedCenterNode}
          nodes={transformedNodes}
          connections={transformedConnections}
          className="border-0 shadow-none"
        />
      </CardContent>
    </Card>
  )
}
