'use client'

import React from 'react'
import type { TimelineArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { getSignificanceColor, formatDuration } from '@/lib/utils/artifactHelpers'

interface TimelineCardProps {
  artifact: TimelineArtifact
}

/**
 * Timeline Card - Visual Movement Timeline
 *
 * Displays:
 * - Chronological event list with visual timeline
 * - Event significance indicators (routine, suspicious, anomaly)
 * - Location names and coordinates
 * - Timestamps and dwell times
 * - Quick action buttons (Play Route)
 */
export default function TimelineCard({ artifact }: TimelineCardProps) {
  const { data, actions = [] } = artifact

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

  return (
    <Card className="border border-border shadow-mundi-sm hover:shadow-mundi-md transition-all">
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

      <CardContent className="space-y-0">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Events */}
          <div className="space-y-4">
            {data.events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline Dot */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    event.significance === 'anomaly'
                      ? 'bg-[#EF4444]/10 border-2 border-[#EF4444]'
                      : event.significance === 'suspicious'
                      ? 'bg-[#F59E0B]/10 border-2 border-[#F59E0B]'
                      : 'bg-[#10B981]/10 border-2 border-[#10B981]'
                  }`}
                >
                  {getEventIcon(event.significance)}
                </div>

                {/* Event Content */}
                <div className="flex-1 pb-4">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{event.location.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Significance Badge */}
                    <Badge className={`${getSignificanceColor(event.significance)} text-xs`}>
                      {event.significance.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-1 mt-2">
                    {event.dwellTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Dwell: {formatDuration(event.dwellTime * 60)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {event.location.coordinates[1].toFixed(4)}, {event.location.coordinates[0].toFixed(4)}
                      </span>
                    </div>

                    {event.notes && (
                      <div className="text-xs text-foreground mt-2 p-2 rounded-lg bg-muted/50">
                        {event.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2 pt-4 border-t border-border mt-4">
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
        )}
      </CardContent>
    </Card>
  )
}
