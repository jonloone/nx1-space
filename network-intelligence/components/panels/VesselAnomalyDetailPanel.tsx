/**
 * Vessel Anomaly Detail Panel
 *
 * Right panel showing detailed vessel information, track statistics,
 * and anomaly history for a selected vessel
 */

'use client'

import React, { useState } from 'react'
import {
  X,
  Ship,
  Navigation,
  Clock,
  AlertTriangle,
  MapPin,
  Anchor,
  Gauge,
  Route,
  ChevronDown,
  ChevronRight,
  Flag,
  Radio,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type {
  VesselTrack,
  DetectedAnomaly,
  AnomalyType,
  AnomalySeverity,
  VesselType
} from '@/lib/types/ais-anomaly'
import { ANOMALY_COLORS, getSeverityColor } from '@/components/layers/AISAnomalyLayers'

export interface VesselAnomalyDetailPanelProps {
  vessel: {
    mmsi: string
    name?: string
    type?: VesselType
    flag?: string
    callSign?: string
    imo?: string
    dimensions?: { length: number; width: number }
  }
  track: VesselTrack
  anomalies: DetectedAnomaly[]
  onClose: () => void
  onAnomalyClick?: (anomaly: DetectedAnomaly) => void
  onFlyToPosition?: (lat: number, lng: number) => void
}

// Anomaly type labels and icons
const ANOMALY_TYPE_INFO: Record<AnomalyType, { label: string; description: string }> = {
  AIS_GAP: { label: 'AIS Gap', description: 'Transmission gap detected' },
  LOITERING: { label: 'Loitering', description: 'Prolonged stationary period' },
  RENDEZVOUS: { label: 'Rendezvous', description: 'Meeting with another vessel' },
  SPEED_ANOMALY: { label: 'Speed Anomaly', description: 'Unusual speed change' },
  COURSE_DEVIATION: { label: 'Course Deviation', description: 'Sudden heading change' }
}

// Vessel type icons (using Ship as fallback)
const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  CARGO: 'Cargo Vessel',
  TANKER: 'Tanker',
  PASSENGER: 'Passenger Ship',
  FISHING: 'Fishing Vessel',
  TUG: 'Tug Boat',
  MILITARY: 'Military Vessel',
  SAILING: 'Sailing Vessel',
  PLEASURE: 'Pleasure Craft',
  OTHER: 'Other Vessel',
  UNKNOWN: 'Unknown Type'
}

// Severity badge component
function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium border uppercase',
      colors[severity]
    )}>
      {severity}
    </span>
  )
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  subValue
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  subValue?: string
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-white">{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {subValue && (
        <div className="text-xs text-slate-500 mt-0.5">{subValue}</div>
      )}
    </div>
  )
}

export function VesselAnomalyDetailPanel({
  vessel,
  track,
  anomalies,
  onClose,
  onAnomalyClick,
  onFlyToPosition
}: VesselAnomalyDetailPanelProps) {
  const [expandedAnomalyId, setExpandedAnomalyId] = useState<string | null>(null)
  const [showAllAnomalies, setShowAllAnomalies] = useState(false)

  // Calculate statistics
  const lastPosition = track.positions[track.positions.length - 1]
  const trackDurationHours = (track.endTime.getTime() - track.startTime.getTime()) / (1000 * 60 * 60)

  // Get relative time
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

  // Sort anomalies by timestamp (newest first)
  const sortedAnomalies = [...anomalies].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  // Display limited anomalies unless expanded
  const displayedAnomalies = showAllAnomalies
    ? sortedAnomalies
    : sortedAnomalies.slice(0, 5)

  // Count anomalies by type
  const anomalyCounts = anomalies.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {} as Record<AnomalyType, number>)

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Ship className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {vessel.name || 'Unknown Vessel'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>MMSI: {vessel.mmsi}</span>
                {vessel.flag && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      <span>{vessel.flag}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick info badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {vessel.type && (
            <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/50 text-slate-300 border border-slate-600/50">
              {VESSEL_TYPE_LABELS[vessel.type]}
            </span>
          )}
          {vessel.callSign && (
            <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/50 text-slate-300 border border-slate-600/50">
              <Radio className="w-3 h-3 inline mr-1" />
              {vessel.callSign}
            </span>
          )}
          {anomalies.length > 0 && (
            <span className="px-2 py-1 rounded-lg text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Last Position */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                Last Known Position
              </h4>
              <span className="text-xs text-slate-500">
                {getRelativeTime(lastPosition.timestamp)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-400">Coordinates</div>
                <div className="text-sm text-white font-mono">
                  {lastPosition.position.lat.toFixed(5)}°N
                </div>
                <div className="text-sm text-white font-mono">
                  {lastPosition.position.lng.toFixed(5)}°E
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Speed / Course</div>
                <div className="text-sm text-white">
                  {lastPosition.sog?.toFixed(1) || '—'} kn
                </div>
                <div className="text-sm text-white">
                  {lastPosition.cog?.toFixed(0) || '—'}° COG
                </div>
              </div>
            </div>
            {onFlyToPosition && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30"
                onClick={() => onFlyToPosition(lastPosition.position.lat, lastPosition.position.lng)}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Fly to Position
              </Button>
            )}
          </div>

          {/* Track Statistics */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-400" />
              Track Statistics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={Clock}
                label="Duration"
                value={trackDurationHours.toFixed(1)}
                unit="hours"
              />
              <StatCard
                icon={Route}
                label="Distance"
                value={track.totalDistanceKm.toFixed(1)}
                unit="km"
              />
              <StatCard
                icon={Gauge}
                label="Avg Speed"
                value={track.avgSpeedKnots.toFixed(1)}
                unit="kn"
              />
              <StatCard
                icon={Activity}
                label="Max Speed"
                value={track.maxSpeedKnots.toFixed(1)}
                unit="kn"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <StatCard
                icon={Anchor}
                label="Positions"
                value={track.positions.length}
                subValue={`Quality: ${track.trackQuality}`}
              />
              <StatCard
                icon={AlertTriangle}
                label="Anomalies"
                value={anomalies.length}
                subValue={anomalies.length > 0 ? `${anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length} high priority` : 'None detected'}
              />
            </div>
          </div>

          {/* Anomaly Summary */}
          {anomalies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Anomaly Summary
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(anomalyCounts).map(([type, count]) => {
                  const color = ANOMALY_COLORS[type as AnomalyType]
                  const info = ANOMALY_TYPE_INFO[type as AnomalyType]
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                      />
                      <span className="text-xs text-white">{info.label}</span>
                      <span className="text-xs text-slate-400">×{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Anomaly History */}
          {anomalies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3">
                Anomaly History
              </h4>
              <div className="space-y-2">
                {displayedAnomalies.map((anomaly) => {
                  const color = ANOMALY_COLORS[anomaly.type]
                  const info = ANOMALY_TYPE_INFO[anomaly.type]
                  const isExpanded = expandedAnomalyId === anomaly.id

                  return (
                    <div
                      key={anomaly.id}
                      className={cn(
                        'bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden transition-all',
                        'hover:border-slate-600/50 cursor-pointer'
                      )}
                      onClick={() => {
                        setExpandedAnomalyId(isExpanded ? null : anomaly.id)
                        onAnomalyClick?.(anomaly)
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                            />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {info.label}
                              </div>
                              <div className="text-xs text-slate-400">
                                {anomaly.timestamp.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={anomaly.severity} />
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-sm text-slate-300 mb-2">
                              {anomaly.description}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500">Position:</span>
                                <span className="text-slate-300 ml-1">
                                  {anomaly.location.lat.toFixed(4)}°N, {anomaly.location.lng.toFixed(4)}°E
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500">Confidence:</span>
                                <span className="text-slate-300 ml-1">
                                  {(anomaly.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                              <div className="mt-2 text-xs text-slate-400">
                                {anomaly.metadata.durationMinutes && (
                                  <span>Duration: {anomaly.metadata.durationMinutes.toFixed(0)} min</span>
                                )}
                                {anomaly.metadata.gapMinutes && (
                                  <span>Gap: {anomaly.metadata.gapMinutes.toFixed(0)} min</span>
                                )}
                                {anomaly.metadata.speedChange && (
                                  <span>Speed Δ: {anomaly.metadata.speedChange.toFixed(1)} kn</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Show more/less button */}
                {sortedAnomalies.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllAnomalies(!showAllAnomalies)
                    }}
                  >
                    {showAllAnomalies
                      ? `Show less`
                      : `Show ${sortedAnomalies.length - 5} more anomalies`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* No anomalies message */}
          {anomalies.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No anomalies detected for this vessel</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        <Button
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
          onClick={() => {
            if (onFlyToPosition && lastPosition) {
              onFlyToPosition(lastPosition.position.lat, lastPosition.position.lng)
            }
          }}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Track Vessel
        </Button>
        <Button
          variant="ghost"
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
        >
          Export Report
        </Button>
      </div>
    </div>
  )
}

export default VesselAnomalyDetailPanel
