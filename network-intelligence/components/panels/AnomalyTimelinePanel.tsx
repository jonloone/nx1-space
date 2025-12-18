/**
 * Anomaly Timeline Panel
 *
 * Bottom panel for temporal analysis of maritime anomalies
 * Features: Time buckets, playback controls, anomaly type indicators
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DetectedAnomaly, AnomalyType, AnomalySeverity } from '@/lib/types/ais-anomaly'
import { ANOMALY_COLORS, getSeverityColor } from '@/components/layers/AISAnomalyLayers'

export interface AnomalyTimelineEvent {
  id: string
  timestamp: Date
  type: AnomalyType
  severity: AnomalySeverity
  vesselName?: string
  mmsi: string
  description: string
  location?: { lat: number; lng: number }
}

export interface AnomalyTimelinePanelProps {
  anomalies: DetectedAnomaly[]
  timeRange: { start: Date; end: Date }
  isOpen: boolean
  onClose: () => void
  onAnomalyClick?: (anomaly: DetectedAnomaly) => void
  onTimeChange?: (time: Date) => void
  selectedAnomalyId?: string | null
}

// Time bucket for aggregation
interface TimeBucket {
  startTime: Date
  endTime: Date
  anomalies: DetectedAnomaly[]
  counts: Record<AnomalyType, number>
  maxSeverity: AnomalySeverity
}

// Severity order for comparison
const SEVERITY_ORDER: AnomalySeverity[] = ['low', 'medium', 'high', 'critical']

// Anomaly type labels
const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  AIS_GAP: 'AIS Gap',
  LOITERING: 'Loitering',
  RENDEZVOUS: 'Rendezvous',
  SPEED_ANOMALY: 'Speed',
  COURSE_DEVIATION: 'Course'
}

export function AnomalyTimelinePanel({
  anomalies,
  timeRange,
  isOpen,
  onClose,
  onAnomalyClick,
  onTimeChange,
  selectedAnomalyId
}: AnomalyTimelinePanelProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(timeRange.start)
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null)

  // Calculate time buckets (1-hour intervals)
  const buckets = useMemo(() => {
    const result: TimeBucket[] = []
    const bucketDurationMs = 60 * 60 * 1000 // 1 hour

    let bucketStart = new Date(timeRange.start)
    while (bucketStart < timeRange.end) {
      const bucketEnd = new Date(bucketStart.getTime() + bucketDurationMs)

      const bucketAnomalies = anomalies.filter(
        a => a.timestamp >= bucketStart && a.timestamp < bucketEnd
      )

      const counts: Record<AnomalyType, number> = {
        AIS_GAP: 0,
        LOITERING: 0,
        RENDEZVOUS: 0,
        SPEED_ANOMALY: 0,
        COURSE_DEVIATION: 0
      }

      let maxSeverity: AnomalySeverity = 'low'
      bucketAnomalies.forEach(a => {
        counts[a.type]++
        if (SEVERITY_ORDER.indexOf(a.severity) > SEVERITY_ORDER.indexOf(maxSeverity)) {
          maxSeverity = a.severity
        }
      })

      result.push({
        startTime: new Date(bucketStart),
        endTime: bucketEnd,
        anomalies: bucketAnomalies,
        counts,
        maxSeverity
      })

      bucketStart = bucketEnd
    }

    return result
  }, [anomalies, timeRange])

  // Get bucket height based on anomaly count
  const maxAnomaliesInBucket = useMemo(() => {
    return Math.max(...buckets.map(b => b.anomalies.length), 1)
  }, [buckets])

  // Playback controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const handleSkipBack = useCallback(() => {
    setCurrentTime(timeRange.start)
    onTimeChange?.(timeRange.start)
  }, [timeRange.start, onTimeChange])

  const handleSkipForward = useCallback(() => {
    setCurrentTime(timeRange.end)
    onTimeChange?.(timeRange.end)
  }, [timeRange.end, onTimeChange])

  const handleBucketClick = useCallback((bucket: TimeBucket) => {
    setCurrentTime(bucket.startTime)
    onTimeChange?.(bucket.startTime)

    // If bucket has anomalies, select the first one
    if (bucket.anomalies.length > 0 && onAnomalyClick) {
      onAnomalyClick(bucket.anomalies[0])
    }
  }, [onTimeChange, onAnomalyClick])

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  const panelHeight = isMinimized ? 60 : 280
  const contentHeight = panelHeight - 60

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300
        }}
        className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-orange-500 shadow-2xl z-40"
        style={{ height: `${panelHeight}px` }}
      >
        {/* Header */}
        <div className="h-[60px] px-6 flex items-center justify-between border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Anomaly Timeline
              </h3>
              <p className="text-xs text-slate-400">
                {formatDate(timeRange.start)} - {formatDate(timeRange.end)} • {anomalies.length} anomalies
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipBack}
              className="h-8 w-8 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-8 w-8 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipForward}
              className="h-8 w-8 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Panel Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 hover:bg-slate-700 text-slate-400 hover:text-white"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full overflow-hidden bg-slate-900/95"
            style={{ height: `${contentHeight}px` }}
          >
            <div className="flex flex-col h-full">
              {/* Legend */}
              <div className="px-6 py-2 flex items-center gap-4 border-b border-slate-700/30">
                {Object.entries(ANOMALY_TYPE_LABELS).map(([type, label]) => {
                  const color = ANOMALY_COLORS[type as AnomalyType]
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                      />
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Timeline Visualization */}
              <div className="flex-1 px-6 py-4">
                <div className="relative h-full">
                  {/* Time axis */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 flex items-end">
                    {buckets.filter((_, i) => i % 4 === 0).map((bucket, i) => (
                      <div
                        key={i}
                        className="flex-1 text-xs text-slate-500 text-center"
                      >
                        {formatTime(bucket.startTime)}
                      </div>
                    ))}
                  </div>

                  {/* Bucket bars */}
                  <div className="absolute inset-0 bottom-6 flex items-end gap-px">
                    {buckets.map((bucket, i) => {
                      const heightPercent = (bucket.anomalies.length / maxAnomaliesInBucket) * 100
                      const severityColor = getSeverityColor(bucket.maxSeverity)
                      const isHovered = hoveredBucket === i
                      const hasSelected = bucket.anomalies.some(a => a.id === selectedAnomalyId)

                      return (
                        <div
                          key={i}
                          className="flex-1 relative cursor-pointer group"
                          style={{ height: '100%' }}
                          onMouseEnter={() => setHoveredBucket(i)}
                          onMouseLeave={() => setHoveredBucket(null)}
                          onClick={() => handleBucketClick(bucket)}
                        >
                          {/* Stacked bars by type */}
                          <div
                            className={cn(
                              'absolute bottom-0 left-0 right-0 rounded-t transition-all duration-150',
                              isHovered && 'ring-2 ring-white/30',
                              hasSelected && 'ring-2 ring-blue-400'
                            )}
                            style={{
                              height: `${Math.max(heightPercent, bucket.anomalies.length > 0 ? 8 : 0)}%`,
                              minHeight: bucket.anomalies.length > 0 ? '4px' : '0',
                              backgroundColor: `rgba(${severityColor[0]}, ${severityColor[1]}, ${severityColor[2]}, ${isHovered ? 1 : 0.7})`
                            }}
                          >
                            {/* Type indicator dots */}
                            {bucket.anomalies.length > 0 && (
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {Object.entries(bucket.counts).map(([type, count]) => {
                                  if (count === 0) return null
                                  const typeColor = ANOMALY_COLORS[type as AnomalyType]
                                  return (
                                    <div
                                      key={type}
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: `rgb(${typeColor[0]}, ${typeColor[1]}, ${typeColor[2]})` }}
                                    />
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Hover tooltip */}
                          {isHovered && bucket.anomalies.length > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                              <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl min-w-[160px]">
                                <div className="text-xs font-medium text-white mb-1">
                                  {formatTime(bucket.startTime)} - {formatTime(bucket.endTime)}
                                </div>
                                <div className="space-y-0.5">
                                  {Object.entries(bucket.counts).map(([type, count]) => {
                                    if (count === 0) return null
                                    const typeColor = ANOMALY_COLORS[type as AnomalyType]
                                    return (
                                      <div key={type} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">{ANOMALY_TYPE_LABELS[type as AnomalyType]}</span>
                                        <span
                                          className="font-medium"
                                          style={{ color: `rgb(${typeColor[0]}, ${typeColor[1]}, ${typeColor[2]})` }}
                                        >
                                          {count}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 bottom-6 w-0.5 bg-blue-400 z-10"
                    style={{
                      left: `${((currentTime.getTime() - timeRange.start.getTime()) /
                        (timeRange.end.getTime() - timeRange.start.getTime())) * 100}%`
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="px-6 py-2 border-t border-slate-700/30 flex items-center gap-6">
                <div className="text-xs text-slate-400">
                  <span className="text-white font-medium">{anomalies.length}</span> total anomalies
                </div>
                <div className="flex items-center gap-4">
                  {(['critical', 'high', 'medium', 'low'] as AnomalySeverity[]).map(severity => {
                    const count = anomalies.filter(a => a.severity === severity).length
                    if (count === 0) return null
                    const color = getSeverityColor(severity)
                    return (
                      <div key={severity} className="flex items-center gap-1 text-xs">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                        />
                        <span className="text-slate-400 capitalize">{severity}:</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default AnomalyTimelinePanel
