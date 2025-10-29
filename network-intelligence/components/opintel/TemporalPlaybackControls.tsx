/**
 * Temporal Playback Controls
 * Federal-grade timeline scrubber for animating subject movement and activity
 *
 * Features:
 * - Timeline scrubber with event markers
 * - Play/pause/skip controls
 * - Speed control (0.5x - 5x)
 * - Time range selector
 * - Event density visualization
 * - Jump to critical events
 * - Current time indicator with timestamp
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Calendar,
  Clock,
  AlertTriangle,
  MapPin,
  User,
  Gauge
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { TimelineEvent, IntelligenceAlert } from '@/lib/types/chatArtifacts'

export interface TemporalPlaybackControlsProps {
  events: TimelineEvent[]
  alerts?: IntelligenceAlert[]
  onTimeChange?: (timestamp: Date, activeEvents: TimelineEvent[]) => void
  onEventClick?: (event: TimelineEvent) => void
  onAlertClick?: (alert: IntelligenceAlert) => void
  onClose?: () => void
  autoPlay?: boolean
}

export type PlaybackSpeed = 0.5 | 1 | 2 | 5 | 10
export type PlaybackState = 'playing' | 'paused' | 'stopped'

interface TimeMarker {
  timestamp: Date
  events: TimelineEvent[]
  alerts: IntelligenceAlert[]
  significance: 'critical' | 'anomaly' | 'elevated' | 'routine'
}

const SIGNIFICANCE_COLORS = {
  critical: 'bg-red-600',
  anomaly: 'bg-orange-600',
  elevated: 'bg-yellow-500',
  routine: 'bg-green-600'
}

/**
 * Temporal Playback Controls Component
 */
export default function TemporalPlaybackControls({
  events,
  alerts = [],
  onTimeChange,
  onEventClick,
  onAlertClick,
  onClose,
  autoPlay = false
}: TemporalPlaybackControlsProps) {
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>(autoPlay ? 'playing' : 'paused')
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Animation frame reference
  const animationRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())

  // Sort events and get time bounds
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }, [events])

  const timeRange = useMemo(() => {
    if (sortedEvents.length === 0) {
      return { start: new Date(), end: new Date() }
    }
    return {
      start: sortedEvents[0].timestamp,
      end: sortedEvents[sortedEvents.length - 1].timestamp
    }
  }, [sortedEvents])

  const totalDuration = timeRange.end.getTime() - timeRange.start.getTime()

  // Initialize current time to start
  useEffect(() => {
    if (!currentTime && sortedEvents.length > 0) {
      setCurrentTime(timeRange.start)
    }
  }, [currentTime, sortedEvents, timeRange])

  // Create time markers (group events by proximity)
  const timeMarkers = useMemo(() => {
    const markers: TimeMarker[] = []
    const groupThreshold = totalDuration / 50 // Group events within 2% of total duration

    sortedEvents.forEach(event => {
      const eventTime = event.timestamp.getTime()

      // Find existing marker within threshold
      const existingMarker = markers.find(m =>
        Math.abs(m.timestamp.getTime() - eventTime) < groupThreshold
      )

      if (existingMarker) {
        existingMarker.events.push(event)
        // Update significance to highest
        const significanceOrder = { critical: 0, anomaly: 1, elevated: 2, routine: 3 }
        if (significanceOrder[event.significance] < significanceOrder[existingMarker.significance]) {
          existingMarker.significance = event.significance as any
        }
      } else {
        // Find alerts at this time
        const markerAlerts = alerts.filter(a =>
          Math.abs(a.timestamp.getTime() - eventTime) < groupThreshold
        )

        markers.push({
          timestamp: event.timestamp,
          events: [event],
          alerts: markerAlerts,
          significance: event.significance as any
        })
      }
    })

    return markers
  }, [sortedEvents, alerts, totalDuration])

  // Get active events at current time
  const activeEvents = useMemo(() => {
    if (!currentTime) return []
    const currentTimeValue = currentTime.getTime()
    const tolerance = totalDuration / 100 // 1% tolerance

    return sortedEvents.filter(event =>
      Math.abs(event.timestamp.getTime() - currentTimeValue) < tolerance
    )
  }, [currentTime, sortedEvents, totalDuration])

  // Calculate current position percentage
  const currentPosition = useMemo(() => {
    if (!currentTime || totalDuration === 0) return 0
    const elapsed = currentTime.getTime() - timeRange.start.getTime()
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }, [currentTime, timeRange, totalDuration])

  // Playback animation loop
  useEffect(() => {
    if (playbackState !== 'playing' || !currentTime) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const animate = () => {
      const now = Date.now()
      const deltaMs = now - lastUpdateRef.current
      lastUpdateRef.current = now

      // Advance time based on playback speed
      // 1x speed = real-time seconds become animation seconds
      // Compress timeline: entire duration plays in 60 seconds at 1x speed
      const compressionFactor = totalDuration / (60 * 1000) // ms per animation ms
      const advancement = deltaMs * playbackSpeed * compressionFactor

      setCurrentTime(prev => {
        if (!prev) return timeRange.start
        const newTime = new Date(prev.getTime() + advancement)

        // Loop back to start if we reach the end
        if (newTime.getTime() > timeRange.end.getTime()) {
          return timeRange.start
        }

        return newTime
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    lastUpdateRef.current = Date.now()
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [playbackState, playbackSpeed, currentTime, timeRange, totalDuration])

  // Notify parent of time changes
  useEffect(() => {
    if (currentTime) {
      onTimeChange?.(currentTime, activeEvents)
    }
  }, [currentTime, activeEvents, onTimeChange])

  // Playback controls
  const handlePlayPause = useCallback(() => {
    setPlaybackState(prev => prev === 'playing' ? 'paused' : 'playing')
  }, [])

  const handleStop = useCallback(() => {
    setPlaybackState('stopped')
    setCurrentTime(timeRange.start)
  }, [timeRange])

  const handleSkipBack = useCallback(() => {
    setCurrentTime(timeRange.start)
  }, [timeRange])

  const handleSkipForward = useCallback(() => {
    setCurrentTime(timeRange.end)
  }, [timeRange])

  const handleSpeedChange = useCallback((value: string) => {
    setPlaybackSpeed(parseFloat(value) as PlaybackSpeed)
  }, [])

  const handleScrub = useCallback((value: number[]) => {
    const percentage = value[0]
    const newTime = new Date(
      timeRange.start.getTime() + (totalDuration * percentage / 100)
    )
    setCurrentTime(newTime)
    setPlaybackState('paused')
  }, [timeRange, totalDuration])

  const handleJumpToEvent = useCallback((event: TimelineEvent) => {
    setCurrentTime(event.timestamp)
    setSelectedEventId(event.id)
    setPlaybackState('paused')
    onEventClick?.(event)
  }, [onEventClick])

  const handleJumpToNextCritical = useCallback(() => {
    if (!currentTime) return

    const criticalEvents = sortedEvents.filter(e =>
      e.significance === 'critical' &&
      e.timestamp.getTime() > currentTime.getTime()
    )

    if (criticalEvents.length > 0) {
      setCurrentTime(criticalEvents[0].timestamp)
      setSelectedEventId(criticalEvents[0].id)
      setPlaybackState('paused')
    }
  }, [currentTime, sortedEvents])

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  if (sortedEvents.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600">No timeline events available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main Playback Control */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <CardTitle className="text-sm font-semibold text-gray-700">
                Temporal Playback
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
              {sortedEvents.length} Events
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Time Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-700 font-medium mb-0.5">Current Time</div>
                <div className="text-lg font-bold text-blue-900">
                  {currentTime?.toLocaleString() || '--'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-700 font-medium mb-0.5">Speed</div>
                <div className="text-lg font-bold text-blue-900">{playbackSpeed}x</div>
              </div>
            </div>
            {activeEvents.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-300">
                <div className="text-xs text-blue-700 font-medium mb-1">Active Events</div>
                <div className="flex flex-wrap gap-1">
                  {activeEvents.map(event => (
                    <Badge
                      key={event.id}
                      className={cn(
                        'text-[10px] cursor-pointer',
                        SIGNIFICANCE_COLORS[event.significance],
                        'text-white'
                      )}
                      onClick={() => handleJumpToEvent(event)}
                    >
                      {event.type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Scrubber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{timeRange.start.toLocaleString()}</span>
              <span className="font-semibold">
                {formatDuration(totalDuration)} total
              </span>
              <span>{timeRange.end.toLocaleString()}</span>
            </div>

            {/* Scrubber with Event Markers */}
            <div className="relative">
              {/* Event markers */}
              <div className="absolute inset-x-0 top-0 h-6 pointer-events-none">
                {timeMarkers.map((marker, idx) => {
                  const position = ((marker.timestamp.getTime() - timeRange.start.getTime()) / totalDuration) * 100
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 -translate-x-1/2"
                      style={{ left: `${position}%` }}
                    >
                      <div className={cn(
                        'w-1.5 h-6 rounded-full',
                        SIGNIFICANCE_COLORS[marker.significance]
                      )} />
                      {marker.alerts.length > 0 && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Slider */}
              <div className="pt-8">
                <Slider
                  value={[currentPosition]}
                  onValueChange={handleScrub}
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Transport Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipBack}
                className="h-9 w-9 p-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant={playbackState === 'playing' ? 'default' : 'outline'}
                size="sm"
                onClick={handlePlayPause}
                className={cn(
                  'h-9 w-9 p-0',
                  playbackState === 'playing' && 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {playbackState === 'playing' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipForward}
                className="h-9 w-9 p-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Speed Control */}
            <Select value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
              <SelectTrigger className="h-9 w-24 text-xs">
                <Gauge className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="5">5x</SelectItem>
                <SelectItem value="10">10x</SelectItem>
              </SelectContent>
            </Select>

            {/* Jump to Critical */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToNextCritical}
              className="h-9 text-xs border-red-300 hover:bg-red-50"
            >
              <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
              Next Critical
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline List */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Event Timeline
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {timeMarkers.map((marker, idx) => {
                const isActive = currentTime &&
                  Math.abs(marker.timestamp.getTime() - currentTime.getTime()) < (totalDuration / 100)

                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-2.5 rounded-lg border cursor-pointer transition-all',
                      isActive
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                    onClick={() => handleJumpToEvent(marker.events[0])}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0 mt-1.5',
                          SIGNIFICANCE_COLORS[marker.significance]
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-900">
                            {marker.timestamp.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {marker.alerts.length > 0 && (
                              <Badge className="bg-red-600 text-white text-[9px] px-1 py-0">
                                {marker.alerts.length} ALERT{marker.alerts.length > 1 ? 'S' : ''}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] uppercase border-gray-300')}
                            >
                              {marker.significance}
                            </Badge>
                          </div>
                        </div>

                        {/* Event titles */}
                        <div className="space-y-0.5">
                          {marker.events.slice(0, 2).map(event => (
                            <div key={event.id} className="text-xs text-gray-700 line-clamp-1">
                              • {event.title}
                            </div>
                          ))}
                          {marker.events.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{marker.events.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        {marker.events[0].location && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {marker.events[0].location.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-gray-900">
              {sortedEvents.filter(e => e.significance === 'critical').length}
            </div>
            <div className="text-[10px] text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-gray-900">
              {sortedEvents.filter(e => e.significance === 'anomaly').length}
            </div>
            <div className="text-[10px] text-gray-600">Anomaly</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-gray-900">
              {sortedEvents.filter(e => e.significance === 'elevated').length}
            </div>
            <div className="text-[10px] text-gray-600">Elevated</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-gray-900">
              {alerts.length}
            </div>
            <div className="text-[10px] text-gray-600">Alerts</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
