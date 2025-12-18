/**
 * Anomaly Alert Panel
 *
 * Real-time anomaly feed with filters
 * Click to focus on map, AI analysis integration
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  AlertTriangle,
  Filter,
  Search,
  X,
  ChevronRight,
  Ship,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type {
  DetectedAnomaly,
  AnomalyType,
  AnomalySeverity
} from '@/lib/types/ais-anomaly'
import { ANOMALY_COLORS, getSeverityColor } from '@/components/layers/AISAnomalyLayers'

// Helper functions to extract lat/lng from various location formats
function getLocationLat(location: any): number | undefined {
  if (!location) return undefined
  if (typeof location.lat === 'number') return location.lat
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[1] // GeoJSON format: [lng, lat]
  }
  return undefined
}

function getLocationLng(location: any): number | undefined {
  if (!location) return undefined
  if (typeof location.lng === 'number') return location.lng
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[0] // GeoJSON format: [lng, lat]
  }
  return undefined
}

export interface AnomalyAlertPanelProps {
  anomalies: DetectedAnomaly[]
  vesselNames?: Map<string, string>
  selectedAnomalyId?: string | null
  isLoading?: boolean
  onAnomalyClick?: (anomaly: DetectedAnomaly) => void
  onAnomalyHover?: (anomaly: DetectedAnomaly | null) => void
  onAnalyzeAnomaly?: (anomaly: DetectedAnomaly) => void
  onRefresh?: () => void
}

// Anomaly type configuration
const ANOMALY_TYPE_CONFIG: Record<AnomalyType, {
  label: string
  shortLabel: string
  icon: string
}> = {
  AIS_GAP: { label: 'AIS Gap / Dark Vessel', shortLabel: 'AIS Gap', icon: '📡' },
  LOITERING: { label: 'Loitering', shortLabel: 'Loiter', icon: '⏱️' },
  RENDEZVOUS: { label: 'Vessel Rendezvous', shortLabel: 'Meet', icon: '🤝' },
  SPEED_ANOMALY: { label: 'Speed Anomaly', shortLabel: 'Speed', icon: '⚡' },
  COURSE_DEVIATION: { label: 'Course Deviation', shortLabel: 'Course', icon: '🧭' }
}

// Severity configuration
const SEVERITY_CONFIG: Record<AnomalySeverity, {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
}> = {
  critical: {
    label: 'Critical',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30'
  },
  high: {
    label: 'High',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30'
  },
  medium: {
    label: 'Medium',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/30'
  },
  low: {
    label: 'Low',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30'
  }
}

// Filter chip component
function FilterChip({
  label,
  isActive,
  color,
  onClick
}: {
  label: string
  isActive: boolean
  color?: [number, number, number, number]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
        'border flex items-center gap-1.5',
        isActive
          ? 'bg-white/10 border-white/30 text-white'
          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
      )}
    >
      {color && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
        />
      )}
      {label}
    </button>
  )
}

// Single alert item
function AlertItem({
  anomaly,
  vesselName,
  isSelected,
  onClick,
  onHover,
  onAnalyze
}: {
  anomaly: DetectedAnomaly
  vesselName?: string
  isSelected: boolean
  onClick: () => void
  onHover: (hovered: boolean) => void
  onAnalyze?: () => void
}) {
  const typeConfig = ANOMALY_TYPE_CONFIG[anomaly.type]
  const severityConfig = SEVERITY_CONFIG[anomaly.severity]
  const color = ANOMALY_COLORS[anomaly.type]

  // Format relative time
  const getRelativeTime = (timestamp: Date) => {
    const now = Date.now()
    const diff = now - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) return `${Math.floor(hours / 24)}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer',
        'bg-slate-800/30 border-slate-700/30',
        'hover:bg-slate-800/50 hover:border-slate-600/50',
        isSelected && 'ring-2 ring-blue-400 bg-blue-500/10 border-blue-500/30'
      )}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)` }}
          >
            {typeConfig.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-white">
              {typeConfig.label}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(anomaly.timestamp)}
            </div>
          </div>
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium uppercase',
          severityConfig.bgClass,
          severityConfig.textClass,
          'border',
          severityConfig.borderClass
        )}>
          {severityConfig.label}
        </span>
      </div>

      {/* Vessel info */}
      <div className="flex items-center gap-2 mb-2">
        <Ship className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-sm text-slate-300">
          {vesselName || anomaly.affectedVessels[0]}
        </span>
        {anomaly.affectedVessels.length > 1 && (
          <span className="text-xs text-slate-500">
            +{anomaly.affectedVessels.length - 1} vessel{anomaly.affectedVessels.length > 2 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
        {anomaly.description}
      </p>

      {/* Location */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          <span>
            {getLocationLat(anomaly.location)?.toFixed(3)}°N, {getLocationLng(anomaly.location)?.toFixed(3)}°E
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onAnalyze && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              onClick={(e) => {
                e.stopPropagation()
                onAnalyze()
              }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Analyze
            </Button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  )
}

export function AnomalyAlertPanel({
  anomalies,
  vesselNames = new Map(),
  selectedAnomalyId,
  isLoading = false,
  onAnomalyClick,
  onAnomalyHover,
  onAnalyzeAnomaly,
  onRefresh
}: AnomalyAlertPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTypes, setActiveTypes] = useState<Set<AnomalyType>>(new Set())
  const [activeSeverities, setActiveSeverities] = useState<Set<AnomalySeverity>>(new Set())
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Toggle type filter
  const toggleTypeFilter = useCallback((type: AnomalyType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  // Toggle severity filter
  const toggleSeverityFilter = useCallback((severity: AnomalySeverity) => {
    setActiveSeverities(prev => {
      const next = new Set(prev)
      if (next.has(severity)) {
        next.delete(severity)
      } else {
        next.add(severity)
      }
      return next
    })
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveTypes(new Set())
    setActiveSeverities(new Set())
    setSearchQuery('')
  }, [])

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    let result = [...anomalies]

    // Filter by type
    if (activeTypes.size > 0) {
      result = result.filter(a => activeTypes.has(a.type))
    }

    // Filter by severity
    if (activeSeverities.size > 0) {
      result = result.filter(a => activeSeverities.has(a.severity))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(a => {
        const vesselName = vesselNames.get(a.affectedVessels[0])?.toLowerCase() || ''
        return (
          a.description.toLowerCase().includes(query) ||
          a.affectedVessels.some(v => v.includes(query)) ||
          vesselName.includes(query) ||
          ANOMALY_TYPE_CONFIG[a.type].label.toLowerCase().includes(query)
        )
      })
    }

    // Sort by timestamp (newest first)
    result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return result
  }, [anomalies, activeTypes, activeSeverities, searchQuery, vesselNames])

  // Calculate counts
  const typeCounts = useMemo(() => {
    const counts: Record<AnomalyType, number> = {
      AIS_GAP: 0,
      LOITERING: 0,
      RENDEZVOUS: 0,
      SPEED_ANOMALY: 0,
      COURSE_DEVIATION: 0
    }
    anomalies.forEach(a => counts[a.type]++)
    return counts
  }, [anomalies])

  const severityCounts = useMemo(() => {
    const counts: Record<AnomalySeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
    anomalies.forEach(a => counts[a.severity]++)
    return counts
  }, [anomalies])

  const hasActiveFilters = activeTypes.size > 0 || activeSeverities.size > 0 || searchQuery.trim() !== ''

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Anomaly Alerts</h3>
              <p className="text-xs text-slate-400">
                {filteredAnomalies.length} of {anomalies.length} anomalies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                notificationsEnabled
                  ? 'text-green-400 hover:bg-green-500/10'
                  : 'text-slate-500 hover:bg-slate-700'
              )}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search anomalies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs',
              showFilters ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white'
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded text-xs">
                {activeTypes.size + activeSeverities.size}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="mt-3 space-y-2">
            {/* Type filters */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ANOMALY_TYPE_CONFIG) as AnomalyType[]).map(type => (
                <FilterChip
                  key={type}
                  label={`${ANOMALY_TYPE_CONFIG[type].shortLabel} (${typeCounts[type]})`}
                  isActive={activeTypes.has(type)}
                  color={ANOMALY_COLORS[type]}
                  onClick={() => toggleTypeFilter(type)}
                />
              ))}
            </div>

            {/* Severity filters */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(SEVERITY_CONFIG) as AnomalySeverity[]).map(severity => {
                const config = SEVERITY_CONFIG[severity]
                return (
                  <FilterChip
                    key={severity}
                    label={`${config.label} (${severityCounts[severity]})`}
                    isActive={activeSeverities.has(severity)}
                    color={getSeverityColor(severity)}
                    onClick={() => toggleSeverityFilter(severity)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Alert list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">
                {hasActiveFilters ? 'No anomalies match your filters' : 'No anomalies detected'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredAnomalies.map(anomaly => (
              <AlertItem
                key={anomaly.id}
                anomaly={anomaly}
                vesselName={vesselNames.get(anomaly.affectedVessels[0])}
                isSelected={selectedAnomalyId === anomaly.id}
                onClick={() => onAnomalyClick?.(anomaly)}
                onHover={(hovered) => onAnomalyHover?.(hovered ? anomaly : null)}
                onAnalyze={onAnalyzeAnomaly ? () => onAnalyzeAnomaly(anomaly) : undefined}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Summary footer */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {severityCounts.critical > 0 && (
              <span className="text-red-400 font-medium mr-2">
                {severityCounts.critical} critical
              </span>
            )}
            {severityCounts.high > 0 && (
              <span className="text-orange-400 font-medium mr-2">
                {severityCounts.high} high
              </span>
            )}
          </span>
          <span>Last updated: Just now</span>
        </div>
      </div>
    </div>
  )
}

export default AnomalyAlertPanel
