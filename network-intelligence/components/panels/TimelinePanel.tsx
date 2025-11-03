/**
 * Timeline Panel
 *
 * Narrative-driven horizontal timeline that pops from the bottom
 * Uses BottomSheet pattern with three detail levels
 */

'use client'

import React, { useState, useMemo } from 'react'
import { usePanelStore } from '@/lib/stores/panelStore'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import { Clock, Filter, ZoomIn, ZoomOut, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ImprovedHorizontalTimeline from '@/components/investigation/ImprovedHorizontalTimeline'

export default function TimelinePanel() {
  const { content, detent, closePanel } = usePanelStore()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [filterSignificance, setFilterSignificance] = useState<string[]>(['critical', 'anomaly', 'suspicious', 'routine'])
  const [filterType, setFilterType] = useState<string[]>([])
  const [zoomLevel, setZoomLevel] = useState(1)

  if (!content || content.type !== 'timeline') {
    return null
  }

  const { events = [], subjectName, period } = content.data || {}

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter((event: TimelineEvent) => {
      const matchesSignificance = filterSignificance.includes(event.significance)
      const matchesType = filterType.length === 0 || filterType.includes(event.type)
      return matchesSignificance && matchesType
    })
  }, [events, filterSignificance, filterType])

  // Stats for display
  const stats = useMemo(() => {
    const criticalCount = events.filter((e: TimelineEvent) => e.significance === 'critical').length
    const anomalyCount = events.filter((e: TimelineEvent) => e.significance === 'anomaly').length
    const suspiciousCount = events.filter((e: TimelineEvent) => e.significance === 'suspicious').length

    return {
      total: events.length,
      critical: criticalCount,
      anomaly: anomalyCount,
      suspicious: suspiciousCount,
      filtered: filteredEvents.length
    }
  }, [events, filteredEvents])

  // Get period info
  const periodInfo = useMemo(() => {
    if (!period || !period.start || !period.end) {
      return null
    }

    const start = new Date(period.start)
    const end = new Date(period.end)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    return {
      start,
      end,
      days,
      label: `${days} days`
    }
  }, [period])

  // Detent-specific rendering
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-blue-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {subjectName ? `${subjectName} - Timeline` : 'Timeline'}
            </h3>
            <div className="text-xs text-gray-600">
              {stats.filtered} of {stats.total} events
              {periodInfo && ` • ${periodInfo.label}`}
              {stats.critical > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 text-[10px]">
                  {stats.critical} critical
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick zoom controls */}
          {detent !== 'collapsed' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomLevel(z => Math.min(z * 1.5, 5))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomLevel(z => Math.max(z / 1.5, 0.5))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={closePanel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {renderHeader()}

      <div className="flex-1 overflow-hidden">
        <ImprovedHorizontalTimeline
          events={filteredEvents}
          detent={detent}
          zoomLevel={zoomLevel}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
          onEventAction={(action, event) => {
            console.log('Timeline event action:', action, event)
            // TODO: Handle actions (show on map, view details, etc.)
          }}
        />
      </div>
    </div>
  )
}
