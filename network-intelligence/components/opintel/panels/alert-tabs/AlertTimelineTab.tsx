/**
 * Alert Timeline Tab
 * Temporal activity visualization using visx AreaChart
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, MapPin, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IntelligenceAlert, TimelineEvent } from '@/lib/types/chatArtifacts'
import { getCitizens360DataService } from '@/lib/services/citizens360DataService'

// Visx imports
import { AreaClosed, Line, Bar } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { GridRows, GridColumns } from '@visx/grid'
import { scaleTime, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Group } from '@visx/group'
import { LinearGradient } from '@visx/gradient'
import { Tooltip, withTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { bisector } from 'd3-array'

export interface AlertTimelineTabProps {
  alert: IntelligenceAlert
}

// Significance colors
const SIGNIFICANCE_COLORS = {
  critical: '#dc2626',
  anomaly: '#ea580c',
  elevated: '#d97706',
  routine: '#059669'
}

/**
 * Temporal Activity Chart using Visx
 */
function TemporalActivityChart({ events }: { events: TimelineEvent[] }) {
  // Group events by day and count by significance
  const data = useMemo(() => {
    if (events.length === 0) return []

    // Sort by timestamp
    const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Group by day
    const grouped = new Map<string, { date: Date; critical: number; anomaly: number; elevated: number; routine: number }>()

    sorted.forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0]

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: new Date(event.timestamp.toISOString().split('T')[0]),
          critical: 0,
          anomaly: 0,
          elevated: 0,
          routine: 0
        })
      }

      const day = grouped.get(dateKey)!
      day[event.significance as keyof Omit<typeof day, 'date'>]++
    })

    return Array.from(grouped.values())
  }, [events])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No timeline data available
      </div>
    )
  }

  // Chart dimensions
  const width = 400
  const height = 180
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }

  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  // Accessors
  const getDate = (d: any) => d.date
  const getTotal = (d: any) => d.critical + d.anomaly + d.elevated + d.routine

  // Scales
  const xScale = scaleTime({
    domain: [Math.min(...data.map(d => d.date.getTime())), Math.max(...data.map(d => d.date.getTime()))],
    range: [0, xMax]
  })

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map(getTotal), 1)],
    range: [yMax, 0],
    nice: true
  })

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height}>
        <LinearGradient id="area-gradient" from="#3b82f6" to="#93c5fd" />
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          <GridRows
            scale={yScale}
            width={xMax}
            height={yMax}
            stroke="#e5e7eb"
            strokeOpacity={0.5}
          />
          <GridColumns
            scale={xScale}
            width={xMax}
            height={yMax}
            stroke="#e5e7eb"
            strokeOpacity={0.5}
          />

          {/* Area chart */}
          <AreaClosed
            data={data}
            x={d => xScale(getDate(d)) ?? 0}
            y={d => yScale(getTotal(d)) ?? 0}
            yScale={yScale}
            strokeWidth={2}
            stroke="#3b82f6"
            fill="url(#area-gradient)"
            curve={curveMonotoneX}
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xScale(getDate(d))}
              cy={yScale(getTotal(d))}
              r={4}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={2}
            />
          ))}

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={xScale}
            numTicks={5}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 10,
              textAnchor: 'middle'
            })}
          />
          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 10,
              textAnchor: 'end',
              dx: -4
            })}
          />
        </Group>
      </svg>
    </div>
  )
}

/**
 * Timeline Event List Item
 */
function TimelineEventItem({ event }: { event: TimelineEvent }) {
  const significanceColor = SIGNIFICANCE_COLORS[event.significance] || '#6b7280'

  return (
    <div className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
      <div className="flex flex-col items-center">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: significanceColor }}
        />
        <div className="w-px h-full bg-gray-200 mt-1" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{event.title}</h4>
          <Badge variant="outline" className="text-[10px] shrink-0 border-gray-300 text-gray-700">
            {event.significance}
          </Badge>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-2">{event.description}</p>

        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.timestamp.toLocaleString()}
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location.name}
            </div>
          )}
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {event.confidence}
          </div>
        </div>

        {/* Entities */}
        {event.entities && event.entities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.entities.map((entity, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200"
              >
                {entity}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Alert Timeline Tab Component
 */
export function AlertTimelineTab({ alert }: AlertTimelineTabProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load timeline data
  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true)
        setError(null)

        const dataService = getCitizens360DataService()
        const events = await dataService.loadTimeline(alert.caseNumber, alert.subjectId)

        console.log(`📅 Loaded ${events.length} timeline events for ${alert.subjectId}`)
        setTimelineEvents(events)
      } catch (err) {
        console.error('Failed to load timeline:', err)
        setError(err instanceof Error ? err.message : 'Failed to load timeline')
      } finally {
        setLoading(false)
      }
    }

    loadTimeline()
  }, [alert.caseNumber, alert.subjectId])

  // Calculate statistics
  const stats = useMemo(() => {
    const bySignificance = {
      critical: timelineEvents.filter(e => e.significance === 'critical').length,
      anomaly: timelineEvents.filter(e => e.significance === 'anomaly').length,
      elevated: timelineEvents.filter(e => e.significance === 'elevated').length,
      routine: timelineEvents.filter(e => e.significance === 'routine').length
    }

    const byType = timelineEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { bySignificance, byType }
  }, [timelineEvents])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Loading timeline...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <div className="text-sm text-gray-900 font-medium mb-1">Failed to load timeline</div>
          <div className="text-xs text-gray-600">{error}</div>
        </div>
      </div>
    )
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600">No timeline events available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Temporal Activity Chart */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Temporal Activity Pattern
            </CardTitle>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {timelineEvents.length} events tracked over time
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <TemporalActivityChart events={timelineEvents} />
        </CardContent>
      </Card>

      {/* Significance Breakdown */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-gray-700">Event Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.critical }} />
            <span className="text-xs text-gray-700">
              <strong>{stats.bySignificance.critical}</strong> Critical
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.anomaly }} />
            <span className="text-xs text-gray-700">
              <strong>{stats.bySignificance.anomaly}</strong> Anomaly
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.elevated }} />
            <span className="text-xs text-gray-700">
              <strong>{stats.bySignificance.elevated}</strong> Elevated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SIGNIFICANCE_COLORS.routine }} />
            <span className="text-xs text-gray-700">
              <strong>{stats.bySignificance.routine}</strong> Routine
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Events List */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Event History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {timelineEvents
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((event) => (
                <TimelineEventItem key={event.id} event={event} />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
