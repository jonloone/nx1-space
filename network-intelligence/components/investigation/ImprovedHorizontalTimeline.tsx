/**
 * Improved Horizontal Timeline
 *
 * Narrative-driven horizontal timeline with D3 time scales
 * Adapts to different detail levels (collapsed, medium, expanded)
 */

'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { scaleTime, scaleLinear } from '@visx/scale'
import { Brush } from '@visx/brush'
import type { Bounds } from '@visx/brush/lib/types'
import type BaseBrush from '@visx/brush/lib/BaseBrush'
import { PatternLines } from '@visx/pattern'
import { Group } from '@visx/group'
import { timeFormat } from 'd3-time-format'
import { extent } from 'd3-array'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import type { PanelDetent } from '@/lib/stores/panelStore'
import {
  MapPin,
  Phone,
  Users,
  DollarSign,
  Wifi,
  Activity,
  ArrowRight,
  Clock,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImprovedHorizontalTimelineProps {
  events: TimelineEvent[]
  detent: PanelDetent
  zoomLevel?: number
  selectedEventId?: string | null
  onEventSelect?: (eventId: string | null) => void
  onEventAction?: (action: string, event: TimelineEvent) => void
}

// Event type to icon mapping
const EVENT_ICONS = {
  movement: ArrowRight,
  communication: Phone,
  meeting: Users,
  financial: DollarSign,
  digital: Wifi,
  location: MapPin,
  status: Activity
}

// Event type to color mapping
const EVENT_COLORS = {
  movement: '#3B82F6',    // blue
  communication: '#10B981', // green
  meeting: '#8B5CF6',      // purple
  financial: '#059669',    // emerald
  digital: '#06B6D4',      // cyan
  location: '#EF4444',     // red
  status: '#6B7280'        // gray
}

// Significance to color mapping
const SIGNIFICANCE_COLORS = {
  critical: '#EF4444',     // red
  anomaly: '#F97316',      // orange
  suspicious: '#F59E0B',   // amber
  routine: '#6B7280'       // gray
}

export default function ImprovedHorizontalTimeline({
  events,
  detent,
  zoomLevel = 1,
  selectedEventId,
  onEventSelect,
  onEventAction
}: ImprovedHorizontalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const brushRef = useRef<BaseBrush | null>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [pinnedEventId, setPinnedEventId] = useState<string | null>(null)
  const [filteredDomain, setFilteredDomain] = useState<[Date, Date] | null>(null)
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set())

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 48) // Subtract padding
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Overview scale (full time range for brush)
  const overviewScale = useMemo(() => {
    if (events.length === 0) return null

    const [minTime, maxTime] = extent(events, d => d.timestamp)
    if (!minTime || !maxTime) return null

    // Add padding to the time range (5% on each side for overview)
    const timeRange = maxTime.getTime() - minTime.getTime()
    const paddedMin = new Date(minTime.getTime() - timeRange * 0.05)
    const paddedMax = new Date(maxTime.getTime() + timeRange * 0.05)

    return scaleTime({
      domain: [paddedMin, paddedMax],
      range: [0, containerWidth]
    })
  }, [events, containerWidth])

  // Detail scale (filtered time range for main timeline)
  const timeScale = useMemo(() => {
    if (!overviewScale) return null

    const domain = filteredDomain || overviewScale.domain()
    const effectiveWidth = containerWidth * zoomLevel

    return scaleTime({
      domain,
      range: [0, effectiveWidth]
    })
  }, [overviewScale, filteredDomain, containerWidth, zoomLevel])

  // Filter events based on brush selection
  const visibleEvents = useMemo(() => {
    if (!filteredDomain) return events

    return events.filter(e =>
      e.timestamp >= filteredDomain[0] && e.timestamp <= filteredDomain[1]
    )
  }, [events, filteredDomain])

  // Group events by proximity (time-based clustering)
  const eventClusters = useMemo(() => {
    if (!timeScale || visibleEvents.length === 0) return []

    // Sort events by timestamp
    const sortedEvents = [...visibleEvents].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    )

    const clusters: Array<{
      id: number
      events: TimelineEvent[]
      x: number
      timestamp: Date
      startTime: Date
      endTime: Date
    }> = []

    // Clustering threshold: 30 minutes
    const CLUSTER_THRESHOLD_MS = 30 * 60 * 1000

    sortedEvents.forEach((event) => {
      const lastCluster = clusters[clusters.length - 1]

      // Check if this event should be added to the last cluster
      if (
        lastCluster &&
        event.timestamp.getTime() - lastCluster.endTime.getTime() <= CLUSTER_THRESHOLD_MS
      ) {
        // Add to existing cluster
        lastCluster.events.push(event)
        lastCluster.endTime = event.timestamp
        // Update cluster position to midpoint
        const midTime = new Date(
          (lastCluster.startTime.getTime() + lastCluster.endTime.getTime()) / 2
        )
        lastCluster.x = timeScale(midTime)
        lastCluster.timestamp = midTime
      } else {
        // Create new cluster
        clusters.push({
          id: clusters.length,
          events: [event],
          x: timeScale(event.timestamp),
          timestamp: event.timestamp,
          startTime: event.timestamp,
          endTime: event.timestamp
        })
      }
    })

    return clusters
  }, [visibleEvents, timeScale])

  // Brush change handler
  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return
    setFilteredDomain([new Date(domain.x0), new Date(domain.x1)])
  }

  // Reset filter handler
  const resetFilter = () => {
    setFilteredDomain(null)
    brushRef.current?.reset()
  }

  // Brush dimensions
  const brushMargin = { top: 10, bottom: 15, left: 24, right: 24 }
  const brushHeight = 80
  const chartSeparation = 30

  // Height calculations based on detent
  const heights = {
    collapsed: 80,
    medium: 300,
    expanded: 500
  }
  const height = heights[detent === 'hidden' ? 'collapsed' : detent] || heights.medium

  // Render collapsed view (overview strip)
  if (detent === 'collapsed') {
    return (
      <div ref={containerRef} className="h-full p-4 bg-gradient-to-b from-blue-50/30 to-transparent">
        <div className="relative h-full">
          {/* Simple density visualization */}
          <svg width={containerWidth} height={60} className="mx-auto">
            {/* Timeline axis */}
            <line
              x1={0}
              y1={30}
              x2={containerWidth}
              y2={30}
              stroke="#CBD5E1"
              strokeWidth={2}
            />

            {/* Critical event markers only */}
            {events
              .filter(e => e.significance === 'critical')
              .map(event => {
                if (!timeScale) return null
                const x = timeScale(event.timestamp)

                return (
                  <g key={event.id}>
                    <circle
                      cx={x}
                      cy={30}
                      r={6}
                      fill="#EF4444"
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-pointer hover:r-8 transition-all"
                      onClick={() => onEventSelect?.(event.id)}
                    />
                  </g>
                )
              })}

            {/* Time labels */}
            {timeScale && (
              <>
                <text x={0} y={55} fontSize={10} fill="#64748B" fontFamily="monospace">
                  {timeFormat('%b %d')(timeScale.domain()[0])}
                </text>
                <text x={containerWidth} y={55} fontSize={10} fill="#64748B" fontFamily="monospace" textAnchor="end">
                  {timeFormat('%b %d')(timeScale.domain()[1])}
                </text>
              </>
            )}
          </svg>
        </div>
      </div>
    )
  }

  // Render medium/expanded view (event cards)
  return (
    <div ref={containerRef} className="h-full overflow-x-auto overflow-y-hidden bg-gradient-to-b from-blue-50/30 to-transparent">
      <div className="relative p-6" style={{ width: containerWidth * zoomLevel, minWidth: '100%' }}>
        {/* Filter info bar */}
        {filteredDomain && (
          <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-sm text-blue-900">
              Showing <strong>{visibleEvents.length}</strong> of <strong>{events.length}</strong> events
              <span className="text-blue-600 ml-2">
                ({timeFormat('%b %d %H:%M')(filteredDomain[0])} → {timeFormat('%b %d %H:%M')(filteredDomain[1])})
              </span>
            </span>
            <button
              onClick={resetFilter}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              <X className="w-4 h-4" />
              Reset filter
            </button>
          </div>
        )}

        {/* Timeline axis with SVG */}
        <svg width={containerWidth * zoomLevel} height={height} className="absolute top-0 left-0 pointer-events-none" style={{ marginTop: filteredDomain ? 56 : 0 }}>
          {/* Main timeline axis */}
          <line
            x1={24}
            y1={height / 2}
            x2={containerWidth * zoomLevel - 24}
            y2={height / 2}
            stroke="#CBD5E1"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Time ticks and labels */}
          {timeScale && (
            <>
              {/* Generate ticks based on time range */}
              {timeScale.ticks(10).map((tick, i) => {
                const x = timeScale(tick)
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={height / 2 - 8}
                      x2={x}
                      y2={height / 2 + 8}
                      stroke="#94A3B8"
                      strokeWidth={2}
                    />
                    <text
                      x={x}
                      y={height / 2 + 24}
                      fontSize={11}
                      fill="#64748B"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {timeFormat('%b %d %H:%M')(tick)}
                    </text>
                  </g>
                )
              })}
            </>
          )}
        </svg>

        {/* Event markers and cards */}
        <div className="relative" style={{ height }}>
          <AnimatePresence>
            {eventClusters.map((cluster, clusterIndex) => {
              const isClusterExpanded = expandedClusters.has(cluster.id)
              const isMultiEvent = cluster.events.length > 1
              const shouldShowCluster = isMultiEvent && !isClusterExpanded

              // Smart positioning: alternate above/below based on index to avoid overlaps
              const isAbove = clusterIndex % 2 === 0
              const yOffset = isAbove ? -120 : 20

              if (shouldShowCluster) {
                // Render cluster marker
                const highestSignificance = cluster.events.reduce((highest, event) => {
                  const priorities = { critical: 4, anomaly: 3, suspicious: 2, routine: 1 }
                  return (priorities[event.significance] > priorities[highest.significance]) ? event : highest
                })
                const significanceColor = SIGNIFICANCE_COLORS[highestSignificance.significance]

                return (
                  <motion.div
                    key={`cluster-${cluster.id}`}
                    initial={{ opacity: 0, scale: 0.8, y: yOffset + (isAbove ? -20 : 20) }}
                    animate={{ opacity: 1, scale: 1, y: yOffset }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute"
                    style={{
                      left: cluster.x - 40,
                      top: height / 2,
                      width: 80,
                      zIndex: 15
                    }}
                    onClick={() => {
                      const newExpanded = new Set(expandedClusters)
                      newExpanded.add(cluster.id)
                      setExpandedClusters(newExpanded)
                    }}
                  >
                    {/* Connection line to axis */}
                    <svg
                      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                      style={{
                        top: isAbove ? '100%' : 'auto',
                        bottom: isAbove ? 'auto' : '100%',
                        height: Math.abs(yOffset),
                        width: 2
                      }}
                    >
                      <line
                        x1={1}
                        y1={0}
                        x2={1}
                        y2={Math.abs(yOffset)}
                        stroke={significanceColor}
                        strokeWidth={2}
                      />
                    </svg>

                    {/* Cluster marker */}
                    <div
                      className="relative bg-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg border-3 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-110"
                      style={{ borderColor: significanceColor, borderWidth: 3 }}
                    >
                      <div className="text-2xl font-bold text-gray-900">{cluster.events.length}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-wide">events</div>

                      {/* Count badge by significance */}
                      <div className="absolute -bottom-2 flex gap-0.5">
                        {['critical', 'anomaly', 'suspicious'].map(sig => {
                          const count = cluster.events.filter(e => e.significance === sig).length
                          if (count === 0) return null
                          return (
                            <div
                              key={sig}
                              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: SIGNIFICANCE_COLORS[sig] }}
                            >
                              {count}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )
              }

              // Render individual events (either from expanded cluster or single event)
              return cluster.events.map((event, eventIndex) => {
                const Icon = EVENT_ICONS[event.type]
                const isSelected = selectedEventId === event.id
                const isHovered = hoveredEventId === event.id
                const significanceColor = SIGNIFICANCE_COLORS[event.significance]
                const typeColor = EVENT_COLORS[event.type]

                // For expanded clusters, position events in a fan pattern
                let eventXOffset = 0
                if (isClusterExpanded && isMultiEvent) {
                  const spread = 180
                  const step = spread / (cluster.events.length - 1 || 1)
                  eventXOffset = (eventIndex - (cluster.events.length - 1) / 2) * step
                }

                const isPinned = pinnedEventId === event.id
                const showTooltip = isHovered || isPinned

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute"
                    style={{
                      left: cluster.x + eventXOffset - 8,
                      top: height / 2 - 8,
                      zIndex: isPinned ? 25 : showTooltip ? 20 : isSelected ? 15 : 10
                    }}
                    onMouseEnter={() => setHoveredEventId(event.id)}
                    onMouseLeave={() => {
                      if (!isPinned) setHoveredEventId(null)
                    }}
                  >
                    {/* Minimal event marker (dot) */}
                    <div
                      className="relative w-4 h-4 rounded-full cursor-pointer transition-all duration-200 hover:scale-150"
                      style={{
                        backgroundColor: significanceColor,
                        boxShadow: `0 0 0 ${isSelected || showTooltip ? '3px' : '0px'} ${significanceColor}33`,
                        border: `2px solid white`
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isPinned) {
                          setPinnedEventId(null)
                        } else {
                          setPinnedEventId(event.id)
                          onEventSelect?.(event.id)
                        }
                      }}
                    />

                    {/* Tooltip - shows on hover or when pinned */}
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: isAbove ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)',
                          [isAbove ? 'bottom' : 'top']: '20px',
                          width: 220,
                          pointerEvents: 'auto'
                        }}
                      >
                        {/* Connection line to marker */}
                        <svg
                          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                          style={{
                            [isAbove ? 'top' : 'bottom']: '100%',
                            height: 20,
                            width: 2
                          }}
                        >
                          <line
                            x1={1}
                            y1={0}
                            x2={1}
                            y2={20}
                            stroke={significanceColor}
                            strokeWidth={2}
                            strokeDasharray={event.significance === 'routine' ? '3 3' : '0'}
                          />
                        </svg>

                        {/* Tooltip card */}
                        <div
                          className={`
                            relative bg-white rounded-lg shadow-xl border-2 p-3
                            transition-all duration-200
                            ${isPinned ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                          `}
                          style={{ borderColor: significanceColor }}
                        >
                          {/* Close button for pinned tooltips */}
                          {isPinned && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPinnedEventId(null)
                                setHoveredEventId(null)
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-900 transition-colors z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* Event type icon */}
                          <div
                            className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                            style={{ backgroundColor: typeColor }}
                          >
                            {Icon && <Icon className="w-4 h-4 text-white" />}
                          </div>

                          {/* Event time */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5 mt-1">
                            <Clock className="w-3 h-3" />
                            {timeFormat('%H:%M')(event.timestamp)}
                          </div>

                          {/* Event title */}
                          <div className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5">
                            {event.title}
                          </div>

                          {/* Event location */}
                          {event.location && (
                            <div className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3" />
                              {event.location.name}
                            </div>
                          )}

                          {/* Event description preview */}
                          {event.description && (
                            <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {event.description}
                            </div>
                          )}

                          {/* Significance badge and actions */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <div
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: significanceColor }}
                            >
                              {event.significance}
                            </div>

                            {/* Quick action hint */}
                            <div className="text-[9px] text-gray-400 italic">
                              {isPinned ? 'Pinned' : 'Click to pin'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              }) // Close cluster.events.map()
            }) // Close eventClusters.map()
          }
          </AnimatePresence>
        </div>

        {/* Brush Navigator - Overview with scrubbing */}
        {overviewScale && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2 font-medium">Timeline Navigator</div>
            <svg width={containerWidth} height={brushHeight}>
              {/* Pattern for brush selection */}
              <PatternLines
                id="brush_pattern"
                height={8}
                width={8}
                stroke="#3B82F6"
                strokeWidth={1}
                orientation={['diagonal']}
              />

              <Group top={0}>
                {/* Density visualization - mini bars for all events */}
                {events.map((event, i) => {
                  const x = overviewScale(event.timestamp)
                  return (
                    <rect
                      key={`density-${event.id}`}
                      x={x - 1}
                      y={brushMargin.top}
                      width={2}
                      height={brushHeight - brushMargin.top - brushMargin.bottom}
                      fill={SIGNIFICANCE_COLORS[event.significance]}
                      opacity={0.5}
                    />
                  )
                })}

                {/* Brush component */}
                <Brush
                  xScale={overviewScale}
                  yScale={scaleLinear({
                    domain: [0, 1],
                    range: [brushMargin.top, brushHeight - brushMargin.bottom]
                  })}
                  width={containerWidth}
                  height={brushHeight}
                  margin={brushMargin}
                  handleSize={8}
                  innerRef={brushRef}
                  resizeTriggerAreas={['left', 'right']}
                  brushDirection="horizontal"
                  initialBrushPosition={
                    events.length > 15
                      ? {
                          start: { x: overviewScale(events[0].timestamp) },
                          end: { x: overviewScale(events[Math.min(15, events.length - 1)].timestamp) }
                        }
                      : undefined
                  }
                  onChange={onBrushChange}
                  onClick={() => setFilteredDomain(null)}
                  selectedBoxStyle={{
                    fill: 'url(#brush_pattern)',
                    stroke: '#3B82F6',
                    strokeWidth: 2,
                  }}
                  useWindowMoveEvents
                />

                {/* Time labels */}
                <text
                  x={brushMargin.left}
                  y={brushHeight - 2}
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="monospace"
                >
                  {timeFormat('%b %d')(overviewScale.domain()[0])}
                </text>
                <text
                  x={containerWidth - brushMargin.right}
                  y={brushHeight - 2}
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {timeFormat('%b %d')(overviewScale.domain()[1])}
                </text>
              </Group>
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
