/**
 * Route Analysis Panel
 * Intelligence-grade route analysis with multi-INT assessment
 *
 * Features:
 * - Route overview and statistics
 * - Risk assessment visualization
 * - Anomaly detection
 * - Waypoint-level intelligence
 * - Recommended actions
 */

'use client'

import React, { useState } from 'react'
import { X, MapPin, Clock, AlertTriangle, Shield, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { RouteAnalysisData } from '@/lib/types/chatArtifacts'

export interface RouteAnalysisPanelProps {
  data: RouteAnalysisData
  onClose: () => void
  onFlyToWaypoint?: (coordinates: [number, number]) => void
  onShowFullRoute?: () => void
}

/**
 * Risk level color mapping
 */
function getRiskLevelColor(level: string): {
  bg: string
  border: string
  text: string
  dot: string
} {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-600'
      }
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-600'
      }
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-600'
      }
    case 'low':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        dot: 'bg-green-600'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        dot: 'bg-gray-600'
      }
  }
}

/**
 * Format distance (meters to km)
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Format duration (seconds to human readable)
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Mode icon and label
 */
function getModeDisplay(mode: string): { label: string; emoji: string } {
  switch (mode) {
    case 'driving':
      return { label: 'Driving', emoji: '🚗' }
    case 'walking':
      return { label: 'Walking', emoji: '🚶' }
    case 'cycling':
      return { label: 'Cycling', emoji: '🚴' }
    default:
      return { label: 'Unknown', emoji: '🗺️' }
  }
}

export default function RouteAnalysisPanel({
  data,
  onClose,
  onFlyToWaypoint,
  onShowFullRoute
}: RouteAnalysisPanelProps) {
  const [showWaypoints, setShowWaypoints] = useState(false)
  const riskColors = getRiskLevelColor(data.riskAssessment.riskLevel)
  const modeDisplay = getModeDisplay(data.mode)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-4">
          {/* Risk Level Indicator */}
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-1.5 h-1.5 rounded-full', riskColors.dot)} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', riskColors.text)}>
              {data.riskAssessment.riskLevel} RISK
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{modeDisplay.emoji} {modeDisplay.label}</span>
          </div>

          {/* Route Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
            {data.title}
          </h2>

          {/* From → To */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-green-600" />
            <span>{data.from.name}</span>
            <span className="text-gray-400">→</span>
            <MapPin className="h-3.5 w-3.5 text-red-600" />
            <span>{data.to.name}</span>
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5 space-y-6">
          {/* Overview Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {formatDistance(data.statistics.totalDistance)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Distance</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {formatDuration(data.statistics.totalDuration)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Duration</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.analyzedWaypoints.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Waypoints</div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Assessment
            </h3>
            <div className={cn('border rounded-lg p-4', riskColors.border, riskColors.bg)}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className={cn('text-xs font-semibold uppercase mb-1', riskColors.text)}>
                    Overall Risk Score
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {data.riskAssessment.overallRiskScore}
                    <span className="text-lg text-gray-500">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 mb-1">Intelligence Confidence</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.statistics.averageConfidence}%
                  </div>
                </div>
              </div>

              {/* High-Risk Segments */}
              {data.riskAssessment.highRiskSegments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {data.riskAssessment.highRiskSegments.length} High-Risk Segment(s) Detected
                  </div>
                  {data.riskAssessment.highRiskSegments.map((segment, idx) => (
                    <div key={idx} className="text-xs text-gray-600 mb-1">
                      • Waypoints {segment.startIndex + 1}-{segment.endIndex + 1}: {segment.reason} (Score: {segment.riskScore})
                    </div>
                  ))}
                </div>
              )}

              {/* SIGINT Coverage */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">SIGINT Coverage:</span>
                  <span className="font-semibold text-gray-900">{data.statistics.sigintCoverage}%</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-600">High-Risk Areas:</span>
                  <span className="font-semibold text-gray-900">{data.statistics.highRiskPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Anomaly Detection */}
          {data.anomalyDetection.hasAnomalies && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Anomalies Detected ({data.anomalyDetection.anomalyCount})
              </h3>
              <div className="space-y-2">
                {data.anomalyDetection.anomalies.map((anomaly, idx) => {
                  const severityColors = getRiskLevelColor(anomaly.severity)
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-lg border-l-2',
                        severityColors.bg,
                        severityColors.border
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={cn('text-xs font-semibold uppercase', severityColors.text)}>
                          {anomaly.severity} Severity
                        </div>
                        <button
                          onClick={() => {
                            const waypoint = data.analyzedWaypoints[anomaly.waypointIndex]
                            if (waypoint && onFlyToWaypoint) {
                              onFlyToWaypoint(waypoint.coordinates)
                            }
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View on map
                        </button>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Waypoint {anomaly.waypointIndex + 1}: {anomaly.location}
                      </div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {anomaly.reasons.map((reason, ridx) => (
                          <li key={ridx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {data.riskAssessment.recommendedActions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {data.riskAssessment.recommendedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-500"
                  >
                    <div className="text-blue-600 font-semibold text-xs mt-0.5">ACTION</div>
                    <p className="text-sm text-gray-800 leading-relaxed flex-1">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waypoint Intelligence Details (Collapsible) */}
          <div>
            <button
              onClick={() => setShowWaypoints(!showWaypoints)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Waypoint Intelligence ({data.analyzedWaypoints.length})
              </h3>
              {showWaypoints ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {showWaypoints && (
              <div className="mt-3 space-y-3">
                {data.analyzedWaypoints.map((waypoint, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Waypoint {idx + 1}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistance(waypoint.distanceFromStart)} from start
                        </div>
                      </div>
                      <button
                        onClick={() => onFlyToWaypoint?.(waypoint.coordinates)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </div>

                    {/* Multi-INT Mini Summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {waypoint.analysis.geoint && (
                        <div>
                          <span className="text-gray-600">GEOINT:</span>
                          <span className="ml-1 text-gray-900">
                            {waypoint.analysis.geoint.buildingType || 'N/A'}
                          </span>
                        </div>
                      )}
                      {waypoint.analysis.sigint && (
                        <div>
                          <span className="text-gray-600">SIGINT:</span>
                          <span className="ml-1 text-gray-900">
                            {waypoint.analysis.sigint.operator}
                          </span>
                        </div>
                      )}
                      {waypoint.analysis.osint && (
                        <div className="col-span-2">
                          <span className="text-gray-600">OSINT Risk:</span>
                          <span className={cn(
                            'ml-1 font-semibold',
                            waypoint.analysis.osint.riskScore >= 70 ? 'text-red-600' :
                            waypoint.analysis.osint.riskScore >= 40 ? 'text-orange-600' :
                            'text-green-600'
                          )}>
                            {waypoint.analysis.osint.riskScore}/100
                          </span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-gray-600">Temporal:</span>
                        <span className="ml-1 text-gray-900">
                          {waypoint.analysis.temporal.timeOfDay.replace('_', ' ')}
                        </span>
                        {waypoint.analysis.temporal.isAnomalous && (
                          <span className="ml-2 text-red-600 font-semibold">⚠️ Anomaly</span>
                        )}
                      </div>
                    </div>

                    {/* Risk Indicators for this waypoint */}
                    {waypoint.analysis.riskIndicators.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          {waypoint.analysis.riskIndicators.length} risk indicator(s)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Timestamp */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>Start Time: {new Date(data.startTime).toLocaleString()}</div>
              {onShowFullRoute && (
                <button
                  onClick={onShowFullRoute}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Show full route on map
                </button>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
