'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  X,
  MapPin,
  AlertTriangle,
  Palette,
  BarChart3,
  Clock,
  User,
  Tag,
  ExternalLink,
  Copy,
  Download,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RightPanelProps {
  mode: 'feature' | 'alert' | 'layer' | 'analysis' | null
  data?: any
  onClose: () => void
}

export default function RightPanel({ mode, data, onClose }: RightPanelProps) {
  if (!mode) return null

  const renderHeader = () => {
    let icon
    let title

    switch (mode) {
      case 'feature':
        icon = <MapPin className="h-4 w-4" />
        title = 'Feature Details'
        break
      case 'alert':
        icon = <AlertTriangle className="h-4 w-4" />
        title = 'Alert Details'
        break
      case 'layer':
        icon = <Palette className="h-4 w-4" />
        title = 'Layer Style'
        break
      case 'analysis':
        icon = <BarChart3 className="h-4 w-4" />
        title = 'Analysis Results'
        break
    }

    return (
      <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <div className="text-[#525252]">{icon}</div>
          <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-[#F5F5F5]"
        >
          <X className="h-4 w-4 text-[#525252]" />
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-[#E5E5E5]">
      {renderHeader()}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {mode === 'feature' && <FeatureDetailsPanel data={data} />}
          {mode === 'alert' && <AlertDetailsPanel data={data} />}
          {mode === 'layer' && <LayerStylePanel data={data} />}
          {mode === 'analysis' && <AnalysisResultsPanel data={data} />}
        </div>
      </ScrollArea>
    </div>
  )
}

// Feature Details Panel
function FeatureDetailsPanel({ data }: { data: any }) {
  const feature = data || {
    id: 'feature-1',
    type: 'Vehicle',
    name: 'Unit-247',
    coordinates: [-122.4194, 37.7749],
    properties: {
      status: 'Active',
      speed: '45 mph',
      heading: '180°',
      lastUpdate: '2 minutes ago',
      driver: 'John Doe',
      route: 'Route A',
      eta: '15 minutes'
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]">
          <ExternalLink className="h-3 w-3 mr-1" />
          Open
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]">
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]">
          <Share2 className="h-3 w-3 mr-1" />
          Share
        </Button>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Feature Info */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xl font-bold text-[#171717] mb-1">{feature.name}</h4>
          <Badge variant="outline" className="text-xs border-[#E5E5E5] text-[#525252]">
            {feature.type}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-[#737373]">ID</div>
          <div className="text-[#171717] font-mono">{feature.id}</div>

          <div className="text-[#737373]">Coordinates</div>
          <div className="text-[#171717] font-mono">
            {feature.coordinates[1].toFixed(4)}, {feature.coordinates[0].toFixed(4)}
          </div>
        </div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Properties */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#F5F5F5] border border-[#E5E5E5]">
          <TabsTrigger value="properties" className="text-xs text-[#525252] data-[state=active]:text-[#171717]">
            Properties
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs text-[#525252] data-[state=active]:text-[#171717]">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-4 space-y-2">
          {Object.entries(feature.properties).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1.5">
              <span className="text-xs text-[#737373] capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-xs text-[#171717] font-medium">{value as string}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-2">
            {[
              { time: '2 min ago', event: 'Status changed to Active' },
              { time: '15 min ago', event: 'Route updated' },
              { time: '1 hour ago', event: 'Started delivery' }
            ].map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Clock className="h-3 w-3 text-[#A3A3A3] mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-[#171717]">{item.event}</div>
                  <div className="text-[10px] text-[#737373]">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Alert Details Panel
function AlertDetailsPanel({ data }: { data: any }) {
  const alert = data || {
    id: 'alert-1',
    title: 'Vehicle Delayed',
    severity: 'high',
    type: 'delivery',
    timestamp: '2024-01-15 14:32:00',
    description: 'Vehicle Unit-247 is running 25 minutes behind schedule on Route A.',
    affectedEntities: ['Unit-247', 'Route A'],
    recommendations: [
      'Notify customer of delay',
      'Reassign next delivery',
      'Contact driver'
    ],
    status: 'active'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#EF4444]' // Error red (WCAG compliant)
      case 'high':
        return 'bg-[#F59E0B]' // Warning amber (WCAG compliant)
      case 'medium':
        return 'bg-[#F59E0B]' // Warning amber
      case 'low':
        return 'bg-[#176BF8]' // NexusOne Blue
      default:
        return 'bg-[#A3A3A3]' // Neutral gray
    }
  }

  return (
    <div className="space-y-4">
      {/* Alert Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', getSeverityColor(alert.severity))} />
          <h4 className="text-lg font-bold text-[#171717]">{alert.title}</h4>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs capitalize border-[#E5E5E5] text-[#525252]">
            {alert.severity}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize border-[#E5E5E5] text-[#525252]">
            {alert.type}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize border-[#E5E5E5] text-[#525252]">
            {alert.status}
          </Badge>
        </div>
        <div className="text-xs text-[#737373]">{alert.timestamp}</div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Description */}
      <div>
        <h5 className="text-xs font-semibold text-[#525252] mb-2">Description</h5>
        <p className="text-xs text-[#737373] leading-relaxed">{alert.description}</p>
      </div>

      {/* Affected Entities */}
      <div>
        <h5 className="text-xs font-semibold text-[#525252] mb-2">Affected Entities</h5>
        <div className="flex flex-wrap gap-1">
          {alert.affectedEntities.map((entity: string, i: number) => (
            <Badge key={i} variant="outline" className="text-xs border-[#E5E5E5] text-[#525252]">
              <Tag className="h-3 w-3 mr-1" />
              {entity}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h5 className="text-xs font-semibold text-[#525252] mb-2">Recommendations</h5>
        <div className="space-y-2">
          {alert.recommendations.map((rec: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#737373]">
              <div className="w-1 h-1 rounded-full bg-[#A3A3A3] mt-1.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full bg-[#176BF8] hover:bg-[#0D4DB8] text-white" size="sm">
          Acknowledge Alert
        </Button>
        <Button variant="outline" className="w-full border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]" size="sm">
          View on Map
        </Button>
        <Button
          variant="outline"
          className="w-full border-[#E5E5E5] text-[#EF4444] hover:bg-[#FEE2E2]"
          size="sm"
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}

// Layer Style Panel
function LayerStylePanel({ data }: { data: any }) {
  const layer = data || {
    id: 'layer-1',
    name: 'Vehicle Fleet',
    type: 'ScatterplotLayer',
    color: '#3b82f6',
    opacity: 0.8,
    size: 10
  }

  return (
    <div className="space-y-4">
      {/* Layer Info */}
      <div>
        <h4 className="text-lg font-bold text-[#171717] mb-1">{layer.name}</h4>
        <Badge variant="outline" className="text-xs border-[#E5E5E5] text-[#525252]">
          {layer.type}
        </Badge>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Style Controls */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#525252] mb-2 block">
            Fill Color
          </label>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded border border-[#E5E5E5]"
              style={{ backgroundColor: layer.color }}
            />
            <input
              type="color"
              value={layer.color}
              className="flex-1 h-10 rounded border border-[#E5E5E5] bg-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#525252] mb-2 block">
            Opacity: {Math.round(layer.opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={layer.opacity * 100}
            className="w-full accent-[#176BF8]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#525252] mb-2 block">
            Point Size: {layer.size}px
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={layer.size}
            className="w-full accent-[#176BF8]"
          />
        </div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full bg-[#176BF8] hover:bg-[#0D4DB8] text-white" size="sm">
          Apply Changes
        </Button>
        <Button variant="outline" className="w-full border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]" size="sm">
          Reset to Default
        </Button>
      </div>
    </div>
  )
}

// Analysis Results Panel
function AnalysisResultsPanel({ data }: { data: any }) {
  const results = data || {
    title: 'Spatial Clustering Analysis',
    timestamp: '2024-01-15 14:30:00',
    summary: 'Identified 5 clusters with high delivery density in the downtown area.',
    metrics: [
      { label: 'Total Points', value: '1,247' },
      { label: 'Clusters Found', value: '5' },
      { label: 'Average Cluster Size', value: '249' },
      { label: 'Processing Time', value: '2.3s' }
    ]
  }

  return (
    <div className="space-y-4">
      {/* Analysis Header */}
      <div>
        <h4 className="text-lg font-bold text-[#171717] mb-1">{results.title}</h4>
        <div className="text-xs text-[#737373]">{results.timestamp}</div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Summary */}
      <div>
        <h5 className="text-xs font-semibold text-[#525252] mb-2">Summary</h5>
        <p className="text-xs text-[#737373] leading-relaxed">{results.summary}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {results.metrics.map((metric: any, i: number) => (
          <Card key={i} className="bg-white border border-[#E5E5E5] shadow-sm">
            <CardContent className="p-3">
              <div className="text-xs text-[#737373] mb-1">{metric.label}</div>
              <div className="text-lg font-bold text-[#171717]">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full bg-[#176BF8] hover:bg-[#0D4DB8] text-white" size="sm">
          <Download className="h-3 w-3 mr-2" />
          Export Results
        </Button>
        <Button variant="outline" className="w-full border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]" size="sm">
          View Details
        </Button>
      </div>
    </div>
  )
}
