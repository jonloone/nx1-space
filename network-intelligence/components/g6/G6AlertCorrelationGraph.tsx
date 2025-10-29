/**
 * G6 Alert Correlation Graph Component
 *
 * Visualizes relationships and patterns between security alerts
 * Uses circular layout for clear cluster visualization
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, Filter, AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import {
  type Alert,
  type AlertCorrelation,
  detectAlertCorrelations,
  transformAlertCorrelationToG6,
  filterAlertsBySeverity,
  filterAlertsByType,
  filterCorrelationsByStrength,
  getAlertCorrelationStats
} from '@/lib/g6/utils/alertCorrelationTransform'
import { CIRCULAR_LAYOUT } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

export interface G6AlertCorrelationGraphProps {
  alerts: Alert[]
  width?: number
  height?: number
  onAlertClick?: (alert: Alert) => void
  className?: string
}

export function G6AlertCorrelationGraph({
  alerts,
  width = 800,
  height = 600,
  onAlertClick,
  className
}: G6AlertCorrelationGraphProps) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [minStrength, setMinStrength] = useState(0.3)

  // Detect correlations between alerts
  const baseCorrelations = useMemo(() => {
    return detectAlertCorrelations(alerts)
  }, [alerts])

  // Transform to G6 format
  const baseGraphData = useMemo(() => {
    return transformAlertCorrelationToG6(alerts, baseCorrelations)
  }, [alerts, baseCorrelations])

  // Apply filters
  const graphData = useMemo(() => {
    let filtered = baseGraphData

    if (selectedSeverities.length > 0) {
      filtered = filterAlertsBySeverity(filtered, selectedSeverities)
    }

    if (selectedTypes.length > 0) {
      filtered = filterAlertsByType(filtered, selectedTypes)
    }

    filtered = filterCorrelationsByStrength(filtered, minStrength)

    return filtered
  }, [baseGraphData, selectedSeverities, selectedTypes, minStrength])

  // Circular layout for cluster visualization
  const layout = useMemo(() => {
    return {
      ...CIRCULAR_LAYOUT,
      radius: Math.min(width, height) / 3,
      divisions: 4, // Group by severity
      ordering: 'degree' // High-correlation alerts near center
    }
  }, [width, height])

  // Initialize G6 graph
  const graph = useG6Graph({
    data: graphData,
    layout,
    width,
    height,
    fitView: true,
    animate: true,
    onNodeClick: (model) => {
      const originalData = (model as any).originalData as Alert
      if (originalData) {
        setSelectedAlertId(model.id as string)
        graph.selectNode(model.id as string)
        onAlertClick?.(originalData)

        // Highlight correlated alerts
        graph.highlightNeighbors(model.id as string)
      }
    },
    onCanvasClick: () => {
      if (selectedAlertId) {
        graph.unselectNode(selectedAlertId)
        graph.clearHighlight()
        setSelectedAlertId(null)
      }
    }
  })

  // Calculate statistics
  const stats = useMemo(() => {
    return getAlertCorrelationStats(alerts, baseCorrelations)
  }, [alerts, baseCorrelations])

  // Get unique severities and types
  const severities = useMemo(() => {
    return Array.from(new Set(alerts.map(a => a.severity)))
  }, [alerts])

  const types = useMemo(() => {
    return Array.from(new Set(alerts.map(a => a.type)))
  }, [alerts])

  // Toggle severity filter
  const toggleSeverity = (severity: string) => {
    setSelectedSeverities(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
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
    setSelectedSeverities([])
    setSelectedTypes([])
    setMinStrength(0.3)
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
    graph.downloadImage(`alert-correlation-${Date.now()}`)
  }

  const hasFilters = selectedSeverities.length > 0 || selectedTypes.length > 0 || minStrength > 0.3

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
              className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${hasFilters ? 'border-2 border-red-500' : ''}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-medium">
                {hasFilters ? `Filtered` : 'Filter'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">Severity</DropdownMenuLabel>
            {severities.map(severity => (
              <DropdownMenuItem
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className="cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedSeverities.includes(severity)}
                  readOnly
                  className="mr-2"
                />
                <span className="capitalize">{severity}</span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">Alert Type</DropdownMenuLabel>
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

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">
              Correlation Strength: {minStrength.toFixed(1)}
            </DropdownMenuLabel>
            <div className="px-2 py-2">
              <Slider
                value={[minStrength]}
                onValueChange={(values) => setMinStrength(values[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

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
          Alert Correlations
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-gray-700">{stats.totalAlerts} alerts</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span className="text-gray-700">{stats.totalCorrelations} correlations</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-gray-700">{stats.severityCounts.critical || 0} critical</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-700">{stats.severityCounts.high || 0} high</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Correlation Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span className="text-gray-700">Temporal</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-emerald-500" />
            <span className="text-gray-700">Spatial</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-purple-500" />
            <span className="text-gray-700">Subject</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-amber-500 border-dashed border-t" />
            <span className="text-gray-700">Pattern</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!selectedAlertId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm"
        >
          Click an alert to view correlations • Line thickness indicates strength
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">Analyzing alert correlations...</div>
        </div>
      )}
    </div>
  )
}
