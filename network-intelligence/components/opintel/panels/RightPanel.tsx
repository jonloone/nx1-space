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
  Share2,
  Navigation,
  Phone,
  Users,
  DollarSign,
  Wifi,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { NetworkAnalysisCard } from '@/components/investigation/NetworkAnalysisCard'
import type { Network } from 'lucide-react'
import type mapboxgl from 'mapbox-gl'

interface RightPanelProps {
  mode: 'feature' | 'alert' | 'layer' | 'analysis' | 'cluster' | 'network-analysis' | 'timeline-detail' | null
  data?: any
  onClose: () => void
  onInjectAlert?: (alert: IntelligenceAlert) => void
  onAction?: (action: string, data: any) => void
  map?: mapboxgl.Map | null
}

export default function RightPanel({ mode, data, onClose, onInjectAlert, onAction, map }: RightPanelProps) {
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
      case 'cluster':
        icon = <AlertTriangle className="h-4 w-4" />
        title = 'Alert Cluster'
        break
      case 'layer':
        icon = <Palette className="h-4 w-4" />
        title = 'Layer Style'
        break
      case 'analysis':
        icon = <BarChart3 className="h-4 w-4" />
        title = 'Analysis Results'
        break
      case 'network-analysis':
        icon = <Navigation className="h-4 w-4" />
        title = 'Network Analysis'
        break
      case 'timeline-detail':
        icon = <Clock className="h-4 w-4" />
        title = 'Event Details'
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
        <div className={mode === 'network-analysis' ? 'p-0' : 'p-4'}>
          {mode === 'feature' && <FeatureDetailsPanel data={data} />}
          {mode === 'alert' && <AlertDetailsPanel data={data} />}
          {mode === 'cluster' && <ClusterAlertsPanel data={data} onInjectAlert={onInjectAlert} />}
          {mode === 'layer' && <LayerStylePanel data={data} />}
          {mode === 'analysis' && <AnalysisResultsPanel data={data} />}
          {mode === 'network-analysis' && data && (
            <NetworkAnalysisCard
              centerNode={data.centerNode}
              nodes={data.nodes}
              connections={data.connections}
              onAction={onAction}
            />
          )}
          {mode === 'timeline-detail' && <TimelineDetailPanel data={data} onAction={onAction} />}
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

// Cluster Alerts Panel
function ClusterAlertsPanel({ data, onInjectAlert }: { data: any; onInjectAlert?: (alert: IntelligenceAlert) => void }) {
  const { alerts = [], coordinates, onAlertClick, onFocusCluster } = data || {}

  // Sort alerts by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedAlerts = [...(alerts as IntelligenceAlert[])].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const criticalCount = alerts.filter((a: IntelligenceAlert) => a.priority === 'critical').length
  const highCount = alerts.filter((a: IntelligenceAlert) => a.priority === 'high').length

  const getSeverityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-[#EF4444]'
      case 'high':
        return 'bg-[#F59E0B]'
      case 'medium':
        return 'bg-[#F59E0B]'
      case 'low':
        return 'bg-[#176BF8]'
      default:
        return 'bg-[#A3A3A3]'
    }
  }

  const getSeverityTextColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-[#EF4444]'
      case 'high':
        return 'text-[#F59E0B]'
      case 'medium':
        return 'text-[#F59E0B]'
      case 'low':
        return 'text-[#176BF8]'
      default:
        return 'text-[#A3A3A3]'
    }
  }

  return (
    <div className="space-y-4">
      {/* Cluster Summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
          <h4 className="text-lg font-bold text-[#171717]">
            {alerts.length} Intelligence Alert{alerts.length !== 1 ? 's' : ''}
          </h4>
        </div>
        {(criticalCount > 0 || highCount > 0) && (
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="text-xs border-[#EF4444] text-[#EF4444]">
                {criticalCount} CRITICAL
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="outline" className="text-xs border-[#F59E0B] text-[#F59E0B]">
                {highCount} HIGH
              </Badge>
            )}
          </div>
        )}
        {coordinates && (
          <div className="text-xs text-[#737373] font-mono">
            {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
          </div>
        )}
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Focus Button */}
      {onFocusCluster && (
        <>
          <Button
            onClick={onFocusCluster}
            className="w-full bg-[#176BF8] hover:bg-[#0D4DB8] text-white"
            size="sm"
          >
            <Navigation className="h-3 w-3 mr-2" />
            Focus on Cluster
          </Button>
          <Separator className="bg-[#E5E5E5]" />
        </>
      )}

      {/* Alert List */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold text-[#525252]">Alerts in Cluster</h5>
        <div className="space-y-2">
          {sortedAlerts.map((alert: IntelligenceAlert) => (
            <Card
              key={alert.id}
              className="bg-white border border-[#E5E5E5] shadow-sm hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              onClick={() => {
                // Inject into chat if handler provided, otherwise use old behavior
                if (onInjectAlert) {
                  onInjectAlert(alert)
                } else {
                  onAlertClick?.(alert)
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5', getSeverityColor(alert.priority))} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-[#171717] leading-tight">
                        {alert.title}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] uppercase border-[#E5E5E5]',
                          getSeverityTextColor(alert.priority)
                        )}
                      >
                        {alert.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#737373]">
                      {alert.location?.name || 'Unknown location'}
                    </div>
                    {alert.description && (
                      <div className="text-xs text-[#737373] line-clamp-2 leading-relaxed">
                        {alert.description}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Timeline Event Detail Panel
function TimelineDetailPanel({ data, onAction }: { data: any; onAction?: (action: string, data: any) => void }) {
  if (!data) return <div className="p-4 text-sm text-gray-500">No event data available</div>

  const event = data

  // Event type to icon mapping
  const EVENT_ICONS_MAP: { [key: string]: typeof MapPin } = {
    movement: Navigation,
    communication: Phone,
    meeting: Users,
    financial: DollarSign,
    digital: Wifi,
    location: MapPin,
    status: Activity
  }

  // Significance colors
  const SIGNIFICANCE_COLORS_MAP: { [key: string]: string } = {
    critical: '#EF4444',     // red
    anomaly: '#F97316',      // orange
    suspicious: '#F59E0B',   // amber
    routine: '#6B7280'       // gray
  }

  // Event type colors
  const EVENT_COLORS_MAP: { [key: string]: string } = {
    movement: '#3B82F6',
    communication: '#10B981',
    meeting: '#8B5CF6',
    financial: '#059669',
    digital: '#06B6D4',
    location: '#EF4444',
    status: '#6B7280'
  }

  const Icon = EVENT_ICONS_MAP[event.type]
  const significanceColor = SIGNIFICANCE_COLORS_MAP[event.significance]
  const typeColor = EVENT_COLORS_MAP[event.type]

  return (
    <div className="space-y-4">
      {/* Event Header */}
      <div className="space-y-2">
        {/* Event type badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: typeColor }}
          >
            {Icon && <Icon className="w-4 h-4 text-white" />}
          </div>
          <div>
            <Badge variant="outline" className="text-xs capitalize border-[#E5E5E5] text-[#525252]">
              {event.type}
            </Badge>
          </div>
        </div>

        {/* Event title */}
        <h4 className="text-lg font-bold text-[#171717] leading-tight">{event.title}</h4>

        {/* Significance & confidence badges */}
        <div className="flex gap-2">
          <Badge
            className="text-xs font-bold text-white uppercase"
            style={{ backgroundColor: significanceColor }}
          >
            {event.significance}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize border-[#E5E5E5] text-[#525252]">
            {event.confidence.replace('-', ' ')}
          </Badge>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-[#737373]">
          <Clock className="w-3.5 h-3.5" />
          {new Date(event.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Description */}
      {event.description && (
        <div>
          <h5 className="text-xs font-semibold text-[#525252] mb-2">Description</h5>
          <p className="text-xs text-[#737373] leading-relaxed">{event.description}</p>
        </div>
      )}

      {/* Location */}
      {event.location && (
        <div>
          <h5 className="text-xs font-semibold text-[#525252] mb-2">Location</h5>
          <div className="bg-[#F5F5F5] rounded-md p-3 space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#525252] mt-0.5" />
              <div>
                <div className="text-xs font-medium text-[#171717]">{event.location.name}</div>
                {event.location.address && (
                  <div className="text-[10px] text-[#737373] mt-0.5">{event.location.address}</div>
                )}
                {event.location.coordinates && (
                  <div className="text-[10px] font-mono text-[#A3A3A3] mt-1">
                    {event.location.coordinates[1].toFixed(4)}, {event.location.coordinates[0].toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants */}
      {event.participants && event.participants.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-[#525252] mb-2">
            Participants ({event.participants.length})
          </h5>
          <div className="space-y-1.5">
            {event.participants.map((participant: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-[#A3A3A3]" />
                <span className="text-[#171717]">{participant}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-[#E5E5E5]" />

      {/* Metadata */}
      <div>
        <h5 className="text-xs font-semibold text-[#525252] mb-2">Metadata</h5>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-[#737373]">Source</span>
            <span className="text-xs text-[#171717] font-medium">{event.source}</span>
          </div>
          {event.mediaAttached && (
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-[#737373]">Media</span>
              <Badge variant="outline" className="text-xs border-[#E5E5E5] text-[#525252]">
                Attached
              </Badge>
            </div>
          )}
          {event.relatedEvents && event.relatedEvents.length > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-[#737373]">Related Events</span>
              <span className="text-xs text-[#171717] font-medium">{event.relatedEvents.length}</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      {/* Actions */}
      <div className="space-y-2">
        {event.location && (
          <Button
            onClick={() => onAction?.('show-on-map', event)}
            className="w-full bg-[#176BF8] hover:bg-[#0D4DB8] text-white"
            size="sm"
          >
            <MapPin className="h-3 w-3 mr-2" />
            Show on Map
          </Button>
        )}
        {event.relatedEvents && event.relatedEvents.length > 0 && (
          <Button
            onClick={() => onAction?.('show-network', event)}
            variant="outline"
            className="w-full border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
            size="sm"
          >
            <Navigation className="h-3 w-3 mr-2" />
            View Network
          </Button>
        )}
        <Button
          onClick={() => onAction?.('view-timeline', event)}
          variant="outline"
          className="w-full border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
          size="sm"
        >
          <Clock className="h-3 w-3 mr-2" />
          View Timeline Context
        </Button>
      </div>
    </div>
  )
}
