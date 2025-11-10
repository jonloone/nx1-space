'use client'

import React from 'react'
import type { TimelineArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, AlertTriangle, MapPin, Maximize2 } from 'lucide-react'
import { useTimelinePanelStore } from '@/lib/stores/timelinePanelStore'

interface TimelineCardProps {
  artifact: TimelineArtifact
}

/**
 * Timeline Card - Preview Card that Opens Bottom Panel
 *
 * Displays:
 * - Timeline summary with event count
 * - Period range
 * - Quick preview of event types
 * - Button to open full timeline in bottom panel
 */
export default function TimelineCard({ artifact }: TimelineCardProps) {
  const { data, actions = [] } = artifact
  const { openTimeline } = useTimelinePanelStore()

  // Check if we have events to display
  if (!data.events || data.events.length === 0) {
    return (
      <Card className="border border-border shadow-mundi-sm">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            No timeline events available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get icon for event type
  const getEventIcon = (significance: string) => {
    switch (significance) {
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
      default:
        return <MapPin className="w-4 h-4 text-[#10B981]" />
    }
  }

  // Handler to open timeline in bottom panel
  const handleOpenTimeline = () => {
    openTimeline(data.events, data.subject || data.title, undefined, data.title)
  }

  // Count event types
  const eventCounts = data.events.reduce((acc, event) => {
    const sig = event.significance || 'routine'
    acc[sig] = (acc[sig] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Card className="border border-border shadow-mundi-sm hover:shadow-mundi-md transition-all cursor-pointer">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mundi-200 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-mundi-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{data.title}</h3>
              <p className="text-xs text-muted-foreground">
                {data.period.start.toLocaleDateString()} - {data.period.end.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Event Count Badge */}
          <Badge variant="secondary" className="text-xs">
            {data.events.length} Event{data.events.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      {/* Preview Content */}
      <CardContent className="p-4 pt-0" onClick={handleOpenTimeline}>
        <div className="space-y-3">
          {/* Event Type Summary */}
          <div className="flex items-center gap-4 text-xs">
            {eventCounts.anomaly && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="text-gray-600">{eventCounts.anomaly} Anomal{eventCounts.anomaly > 1 ? 'ies' : 'y'}</span>
              </div>
            )}
            {eventCounts.suspicious && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="text-gray-600">{eventCounts.suspicious} Suspicious</span>
              </div>
            )}
            {eventCounts.routine && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-gray-600">{eventCounts.routine} Routine</span>
              </div>
            )}
          </div>

          {/* First few locations preview */}
          <div className="flex flex-wrap gap-1.5">
            {data.events.slice(0, 4).map((event) => (
              <Badge key={event.id} variant="outline" className="text-[10px] font-normal">
                {event.location.name}
              </Badge>
            ))}
            {data.events.length > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal text-gray-500">
                +{data.events.length - 4} more
              </Badge>
            )}
          </div>

          {/* Open Full Timeline Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 flex items-center gap-2"
            onClick={handleOpenTimeline}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>View Full Timeline</span>
          </Button>
        </div>
      </CardContent>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex gap-2 pt-4 border-t border-border">
            {actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => action.handler(data)}
              >
                {action.icon} {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
