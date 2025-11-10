/**
 * Bubble Timeline - Event Density Chart
 *
 * Filled line chart showing event density over time
 * - Focus on temporal patterns, not individual events
 * - Scrubbing and time range filtering
 * - Stacked density by significance level
 * - Smooth, professional visualization
 */

'use client'

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { scaleTime, scaleLinear } from '@visx/scale'
import { Group } from '@visx/group'
import { AxisBottom } from '@visx/axis'
import { timeFormat } from 'd3-time-format'
import { extent, bin, max } from 'd3-array'
import { area, curveMonotoneX } from 'd3-shape'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import { usePanelStore } from '@/lib/stores/panelStore'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface BubbleTimelineProps {
  events: TimelineEvent[]
  onEventSelect?: (eventId: string) => void
  selectedEventId?: string | null
}

interface DensityBin {
  x0: Date
  x1: Date
  critical: number
  anomaly: number
  suspicious: number
  routine: number
  total: number
}

// Significance colors
const SIGNIFICANCE_COLORS = {
  critical: '#EF4444',     // red
  anomaly: '#F97316',      // orange
  suspicious: '#F59E0B',   // amber
  routine: '#6B7280'       // gray
}

export default function BubbleTimeline({
  events,
  onEventSelect,
  selectedEventId
}: BubbleTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [containerWidth, setContainerWidth] = useState(400)
  const [rangeSelection, setRangeSelection] = useState<[Date, Date] | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [hoverTime, setHoverTime] = useState<Date | null>(null)

  // Panel store for opening detail panel
  const { openRightPanel } = usePanelStore()

  // Timeline dimensions
  const height = 100
  const padding = { top: 12, right: 16, bottom: 24, left: 16 }
  const plotHeight = height - padding.top - padding.bottom

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Sort events by timestamp
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }, [events])

  // Time scale
  const timeScale = useMemo(() => {
    if (sortedEvents.length === 0) return null
    const [minTime, maxTime] = extent(sortedEvents, d => d.timestamp)
    if (!minTime || !maxTime) return null

    const timeRange = maxTime.getTime() - minTime.getTime()
    const paddedMin = new Date(minTime.getTime() - timeRange * 0.05)
    const paddedMax = new Date(maxTime.getTime() + timeRange * 0.05)

    return scaleTime({
      domain: [paddedMin, paddedMax],
      range: [padding.left, containerWidth - padding.right]
    })
  }, [sortedEvents, containerWidth])

  // Create time bins and calculate event density
  const densityData = useMemo(() => {
    if (!timeScale || sortedEvents.length === 0) return []

    const domain = timeScale.domain()
    const numBins = Math.min(50, Math.max(20, Math.floor(containerWidth / 12)))

    // Create time bins
    const timeBinner = bin<TimelineEvent, Date>()
      .domain([domain[0], domain[1]] as [Date, Date])
      .value(d => d.timestamp)
      .thresholds(numBins)

    const bins = timeBinner(sortedEvents)

    // Calculate density by significance for each bin
    return bins.map(binEvents => {
      const counts = {
        critical: binEvents.filter(e => e.significance === 'critical').length,
        anomaly: binEvents.filter(e => e.significance === 'anomaly').length,
        suspicious: binEvents.filter(e => e.significance === 'suspicious').length,
        routine: binEvents.filter(e => e.significance === 'routine').length
      }

      return {
        x0: binEvents.x0!,
        x1: binEvents.x1!,
        ...counts,
        total: binEvents.length
      } as DensityBin
    })
  }, [sortedEvents, timeScale, containerWidth])

  // Y scale for density
  const yScale = useMemo(() => {
    const maxDensity = max(densityData, d => d.total) || 1

    return scaleLinear({
      domain: [0, maxDensity],
      range: [padding.top + plotHeight, padding.top],
      nice: true
    })
  }, [densityData, plotHeight])

  // Create stacked area paths
  const areaPaths = useMemo(() => {
    if (!timeScale || !yScale || densityData.length === 0) return null

    const createArea = (getValue: (d: DensityBin) => number, baseline: (d: DensityBin) => number = () => 0) => {
      return area<DensityBin>()
        .x(d => timeScale(new Date((+d.x0 + +d.x1) / 2)))
        .y0(d => yScale(baseline(d)))
        .y1(d => yScale(baseline(d) + getValue(d)))
        .curve(curveMonotoneX)(densityData)
    }

    return {
      critical: createArea(d => d.critical),
      anomaly: createArea(d => d.anomaly, d => d.critical),
      suspicious: createArea(d => d.suspicious, d => d.critical + d.anomaly),
      routine: createArea(d => d.routine, d => d.critical + d.anomaly + d.suspicious)
    }
  }, [densityData, timeScale, yScale])

  // Handle timeline click to show events at that time
  const handleTimelineClick = useCallback((clientX: number) => {
    if (!svgRef.current || !timeScale) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const x = clientX - svgRect.left
    const clickedTime = timeScale.invert(x)

    // Find events within 1 hour of clicked time
    const timeWindow = 60 * 60 * 1000 // 1 hour in ms
    const nearbyEvents = sortedEvents.filter(e =>
      Math.abs(e.timestamp.getTime() - clickedTime.getTime()) < timeWindow
    )

    if (nearbyEvents.length > 0) {
      // Open right panel with first nearby event
      openRightPanel('timeline-detail', nearbyEvents[0])
      console.log(`🎯 Found ${nearbyEvents.length} events near ${clickedTime.toISOString()}`)
    }
  }, [sortedEvents, timeScale, openRightPanel])

  // Handle drag start for range selection
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (!svgRef.current || !timeScale) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - svgRect.left

    setIsDragging(true)
    setDragStart(x)
    setRangeSelection(null)
    e.stopPropagation()
  }, [timeScale])

  // Handle drag move
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (!svgRef.current || !timeScale) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - svgRect.left
    const time = timeScale.invert(x)
    setHoverTime(time)

    if (isDragging && dragStart !== null) {
      // Calculate date range
      const x1 = Math.min(dragStart, x)
      const x2 = Math.max(dragStart, x)
      const date1 = timeScale.invert(x1)
      const date2 = timeScale.invert(x2)

      setRangeSelection([date1, date2])
    }
  }, [isDragging, dragStart, timeScale])

  // Handle drag end
  const handleMouseUp = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (isDragging) {
      setIsDragging(false)
      setDragStart(null)

      // If we have a range selection, apply it
      if (rangeSelection) {
        const durationMs = rangeSelection[1].getTime() - rangeSelection[0].getTime()
        // Only treat as range if dragged more than 500ms of time
        if (durationMs > 500) {
          console.log('📅 Time range selected:', rangeSelection)
          // TODO: Filter map by time range
        } else {
          // Short drag = click
          handleTimelineClick(e.clientX)
          setRangeSelection(null)
        }
      }
    } else {
      handleTimelineClick(e.clientX)
    }
  }, [isDragging, rangeSelection, handleTimelineClick])

  // Clear range selection
  const clearRangeSelection = useCallback(() => {
    setRangeSelection(null)
  }, [])

  if (!timeScale) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
        <div>No events to display</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Range selection indicator */}
      {rangeSelection && (
        <div className="absolute top-1 right-1 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRangeSelection}
            className="h-5 text-xs gap-1 px-2"
          >
            <X className="w-2.5 h-2.5" />
            Clear
          </Button>
        </div>
      )}

      <svg
        ref={svgRef}
        width={containerWidth}
        height={height}
        className="overflow-visible cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* Stacked area charts for event density */}
        {areaPaths && (
          <Group>
            {/* Routine (bottom layer) */}
            {areaPaths.routine && (
              <path
                d={areaPaths.routine}
                fill={SIGNIFICANCE_COLORS.routine}
                opacity={0.7}
                strokeWidth={0}
              />
            )}
            {/* Suspicious */}
            {areaPaths.suspicious && (
              <path
                d={areaPaths.suspicious}
                fill={SIGNIFICANCE_COLORS.suspicious}
                opacity={0.75}
                strokeWidth={0}
              />
            )}
            {/* Anomaly */}
            {areaPaths.anomaly && (
              <path
                d={areaPaths.anomaly}
                fill={SIGNIFICANCE_COLORS.anomaly}
                opacity={0.8}
                strokeWidth={0}
              />
            )}
            {/* Critical (top layer) */}
            {areaPaths.critical && (
              <path
                d={areaPaths.critical}
                fill={SIGNIFICANCE_COLORS.critical}
                opacity={0.85}
                strokeWidth={0}
              />
            )}
          </Group>
        )}

        {/* Range selection overlay */}
        {rangeSelection && timeScale && (
          <rect
            x={timeScale(rangeSelection[0])}
            y={padding.top}
            width={timeScale(rangeSelection[1]) - timeScale(rangeSelection[0])}
            height={plotHeight}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="4 2"
            pointerEvents="none"
          />
        )}

        {/* Hover line */}
        {hoverTime && timeScale && (
          <line
            x1={timeScale(hoverTime)}
            x2={timeScale(hoverTime)}
            y1={padding.top}
            y2={padding.top + plotHeight}
            stroke="#3B82F6"
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.5}
            pointerEvents="none"
          />
        )}

        {/* X-axis (time) */}
        <AxisBottom
          top={height - padding.bottom + 2}
          scale={timeScale}
          stroke="#E5E7EB"
          tickStroke="#E5E7EB"
          tickLabelProps={() => ({
            fill: '#6B7280',
            fontSize: 9,
            textAnchor: 'middle',
            fontWeight: 500
          })}
          tickFormat={(date) => {
            const domain = timeScale.domain()
            const daysDiff = (domain[1].getTime() - domain[0].getTime()) / (1000 * 60 * 60 * 24)
            if (daysDiff > 7) {
              return timeFormat('%b %d')(date)
            } else if (daysDiff > 1) {
              return timeFormat('%m/%d %H:%M')(date)
            }
            return timeFormat('%H:%M')(date)
          }}
          numTicks={6}
        />
      </svg>

      {/* Hover tooltip showing event count */}
      {hoverTime && (() => {
        if (!timeScale) return null

        // Find density bin at hover time
        const bin = densityData.find(d =>
          hoverTime >= d.x0 && hoverTime < d.x1
        )

        if (!bin || bin.total === 0) return null

        const x = timeScale(hoverTime)

        return (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: x,
              top: padding.top - 5,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 text-xs">
              <div className="font-semibold mb-1">{timeFormat('%b %d, %H:%M')(hoverTime)}</div>
              <div className="space-y-0.5">
                {bin.critical > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.critical }} />
                    <span className="opacity-90">{bin.critical} critical</span>
                  </div>
                )}
                {bin.anomaly > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.anomaly }} />
                    <span className="opacity-90">{bin.anomaly} anomaly</span>
                  </div>
                )}
                {bin.suspicious > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.suspicious }} />
                    <span className="opacity-90">{bin.suspicious} suspicious</span>
                  </div>
                )}
                {bin.routine > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.routine }} />
                    <span className="opacity-90">{bin.routine} routine</span>
                  </div>
                )}
              </div>
              <div className="text-[10px] opacity-75 mt-1 pt-1 border-t border-gray-700">
                Total: {bin.total} events
              </div>
            </div>
          </motion.div>
        )
      })()}
    </div>
  )
}
