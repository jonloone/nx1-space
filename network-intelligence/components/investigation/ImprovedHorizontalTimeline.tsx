/**
 * Improved Horizontal Timeline
 *
 * Narrative-driven horizontal timeline with D3 time scales
 * Adapts to different detail levels (collapsed, medium, expanded)
 */

'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { scaleTime } from 'd3-scale'
import { timeFormat, timeDay, timeHour } from 'd3-time-format'
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
  Clock
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
  const [containerWidth, setContainerWidth] = useState(800)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)

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

  // Calculate time scale
  const timeScale = useMemo(() => {
    if (events.length === 0) return null

    const [minTime, maxTime] = extent(events, d => d.timestamp)
    if (!minTime || !maxTime) return null

    // Add padding to the time range (10% on each side)
    const timeRange = maxTime.getTime() - minTime.getTime()
    const paddedMin = new Date(minTime.getTime() - timeRange * 0.1)
    const paddedMax = new Date(maxTime.getTime() + timeRange * 0.1)

    // Apply zoom level
    const effectiveWidth = containerWidth * zoomLevel

    return scaleTime()
      .domain([paddedMin, paddedMax])
      .range([0, effectiveWidth])
  }, [events, containerWidth, zoomLevel])

  // Group events by proximity (simple clustering)
  const eventClusters = useMemo(() => {
    if (!timeScale || events.length === 0) return []

    // For now, just return individual events (clustering can be added later)
    return events.map(event => ({
      events: [event],
      x: timeScale(event.timestamp),
      timestamp: event.timestamp
    }))
  }, [events, timeScale])

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
        {/* Timeline axis with SVG */}
        <svg width={containerWidth * zoomLevel} height={height} className="absolute top-0 left-0 pointer-events-none">
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
            {eventClusters.map((cluster) => {
              const event = cluster.events[0]
              const Icon = EVENT_ICONS[event.type]
              const isSelected = selectedEventId === event.id
              const isHovered = hoveredEventId === event.id
              const significanceColor = SIGNIFICANCE_COLORS[event.significance]
              const typeColor = EVENT_COLORS[event.type]

              // Position event card above or below axis
              const isAbove = Math.random() > 0.5 // TODO: Smarter positioning to avoid overlaps
              const yOffset = isAbove ? -120 : 20

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.8, y: yOffset + (isAbove ? -20 : 20) }}
                  animate={{ opacity: 1, scale: isSelected ? 1.05 : 1, y: yOffset }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute"
                  style={{
                    left: cluster.x - 80, // Center the card on the event
                    top: height / 2,
                    width: 160,
                    zIndex: isSelected ? 20 : isHovered ? 15 : 10
                  }}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  onClick={() => onEventSelect?.(event.id)}
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
                      strokeDasharray={event.significance === 'routine' ? '3 3' : '0'}
                    />
                  </svg>

                  {/* Event card */}
                  <div
                    className={`
                      relative bg-white rounded-lg shadow-md border-2 p-3
                      cursor-pointer transition-all duration-200
                      hover:shadow-xl hover:scale-105
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    `}
                    style={{ borderColor: significanceColor }}
                  >
                    {/* Event type icon */}
                    <div
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: typeColor }}
                    >
                      {Icon && <Icon className="w-4 h-4 text-white" />}
                    </div>

                    {/* Event time */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Clock className="w-3 h-3" />
                      {timeFormat('%H:%M')(event.timestamp)}
                    </div>

                    {/* Event title */}
                    <div className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                      {event.title}
                    </div>

                    {/* Event location */}
                    {event.location && (
                      <div className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location.name}
                      </div>
                    )}

                    {/* Significance badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <div
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: significanceColor }}
                      >
                        {event.significance}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
