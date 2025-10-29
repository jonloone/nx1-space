'use client'

import React from 'react'
import type { TimelineArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { G6TimelineGraph } from '@/components/g6/G6TimelineGraph'

interface TimelineCardProps {
  artifact: TimelineArtifact
}

/**
 * Timeline Card - Visual Movement Timeline with G6 Visualization
 *
 * Displays:
 * - Interactive G6 timeline graph
 * - Chronological event list with visual timeline
 * - Event significance indicators (routine, suspicious, anomaly)
 * - Location names and coordinates
 * - Timestamps and dwell times
 */
export default function TimelineCard({ artifact }: TimelineCardProps) {
  const { data, actions = [] } = artifact

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

      {/* G6 Timeline Visualization */}
      <CardContent className="p-0">
        <G6TimelineGraph
          events={data.events}
          width={420}
          height={500}
          onEventClick={(event) => {
            console.log('Timeline event clicked:', event)
          }}
        />
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
