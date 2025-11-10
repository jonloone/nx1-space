/**
 * Horizontal Timeline Component
 *
 * Left-to-right swimlane timeline visualization
 * Displays events chronologically with visual significance indicators
 */

'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, AlertTriangle, Clock } from 'lucide-react'
import type { TimelineEvent } from '@/lib/stores/timelinePanelStore'

export interface HorizontalTimelineProps {
  events: TimelineEvent[]
  subjectName?: string
  width?: number
  height?: number
  onEventClick?: (event: TimelineEvent) => void
  selectedEventId?: string | null
  className?: string
}

export function HorizontalTimeline({
  events,
  subjectName,
  width = 800,
  height = 300,
  onEventClick,
  selectedEventId = null,
  className
}: HorizontalTimelineProps) {
  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [events])

  // Calculate time range
  const timeRange = useMemo(() => {
    if (sortedEvents.length === 0) return { start: new Date(), end: new Date() }

    return {
      start: new Date(sortedEvents[0].timestamp),
      end: new Date(sortedEvents[sortedEvents.length - 1].timestamp)
    }
  }, [sortedEvents])

  // Calculate position for each event (0-100%)
  const getEventPosition = (timestamp: Date) => {
    const total = timeRange.end.getTime() - timeRange.start.getTime()
    if (total === 0) return 50 // Single event, center it

    const elapsed = timestamp.getTime() - timeRange.start.getTime()
    return (elapsed / total) * 100
  }

  // Get color based on significance
  const getSignificanceColor = (significance?: string) => {
    switch (significance) {
      case 'anomaly':
        return '#EF4444' // red
      case 'suspicious':
        return '#F59E0B' // orange
      default:
        return '#10B981' // green
    }
  }

  // Get icon based on significance
  const getSignificanceIcon = (significance?: string) => {
    switch (significance) {
      case 'anomaly':
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Timeline dimensions
  const padding = 60
  const timelineY = height / 2
  const timelineWidth = width - (padding * 2)

  return (
    <div className={`relative ${className || ''}`} style={{ width, height }}>
      <svg width={width} height={height} className="absolute inset-0">
        {/* Timeline base line */}
        <line
          x1={padding}
          y1={timelineY}
          x2={width - padding}
          y2={timelineY}
          stroke="#D1D5DB"
          strokeWidth={2}
        />

        {/* Start and end markers */}
        <circle
          cx={padding}
          cy={timelineY}
          r={4}
          fill="#9CA3AF"
        />
        <circle
          cx={width - padding}
          cy={timelineY}
          r={4}
          fill="#9CA3AF"
        />

        {/* Event markers */}
        {sortedEvents.map((event, index) => {
          const x = padding + (getEventPosition(new Date(event.timestamp)) / 100) * timelineWidth
          const color = getSignificanceColor(event.significance)
          const isAbove = index % 2 === 0
          const isSelected = event.id === selectedEventId

          return (
            <g key={event.id}>
              {/* Selection ring (blue pulse for selected event) */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={timelineY}
                  r={12}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  opacity={0.6}
                >
                  <animate
                    attributeName="r"
                    from="12"
                    to="16"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Vertical line to event */}
              <line
                x1={x}
                y1={timelineY}
                x2={x}
                y2={isAbove ? timelineY - 40 : timelineY + 40}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                strokeDasharray={event.significance === 'routine' ? '4,4' : '0'}
                opacity={selectedEventId && !isSelected ? 0.4 : 1}
              />

              {/* Event marker circle */}
              <circle
                cx={x}
                cy={timelineY}
                r={isSelected ? 8 : 6}
                fill={color}
                stroke={isSelected ? "#3B82F6" : "white"}
                strokeWidth={isSelected ? 3 : 2}
                opacity={selectedEventId && !isSelected ? 0.5 : 1}
                className="cursor-pointer hover:r-8 transition-all"
                onClick={() => onEventClick?.(event)}
              />
            </g>
          )
        })}
      </svg>

      {/* Event labels and details */}
      {sortedEvents.map((event, index) => {
        const x = padding + (getEventPosition(new Date(event.timestamp)) / 100) * timelineWidth
        const isAbove = index % 2 === 0
        const color = getSignificanceColor(event.significance)
        const isSelected = event.id === selectedEventId
        const hasSelection = selectedEventId !== null

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: isAbove ? 10 : -10 }}
            animate={{
              opacity: hasSelection && !isSelected ? 0.5 : 1,
              y: 0,
              scale: isSelected ? 1.1 : 1
            }}
            transition={{ delay: index * 0.1 }}
            className="absolute cursor-pointer hover:scale-105 transition-transform"
            style={{
              left: `${x}px`,
              top: isAbove ? `${timelineY - 100}px` : `${timelineY + 50}px`,
              transform: 'translateX(-50%)',
              width: '140px',
              zIndex: isSelected ? 10 : 1
            }}
            onClick={() => onEventClick?.(event)}
          >
            <div
              className={`bg-white rounded-lg shadow-md border-2 p-3 text-xs ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              style={{ borderColor: isSelected ? '#3B82F6' : color }}
            >
              {/* Icon and timestamp */}
              <div className="flex items-center gap-2 mb-1.5">
                <div style={{ color }}>
                  {getSignificanceIcon(event.significance)}
                </div>
                <div className="text-gray-500 font-medium flex-1 truncate">
                  {formatTimestamp(new Date(event.timestamp))}
                </div>
              </div>

              {/* Location */}
              <div className="font-semibold text-gray-900 mb-1 truncate">
                {event.location.name}
              </div>

              {/* Description */}
              <div className="text-gray-600 text-[10px] line-clamp-2">
                {event.description}
              </div>

              {/* Dwell time if available */}
              {event.dwellTime && (
                <div className="flex items-center gap-1 mt-1.5 text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px]">{event.dwellTime} min</span>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Time labels */}
      <div
        className="absolute text-xs text-gray-500 font-medium"
        style={{ left: `${padding}px`, top: `${timelineY + 15}px`, transform: 'translateX(-50%)' }}
      >
        {formatTimestamp(timeRange.start)}
      </div>
      <div
        className="absolute text-xs text-gray-500 font-medium"
        style={{ left: `${width - padding}px`, top: `${timelineY + 15}px`, transform: 'translateX(-50%)' }}
      >
        {formatTimestamp(timeRange.end)}
      </div>
    </div>
  )
}
