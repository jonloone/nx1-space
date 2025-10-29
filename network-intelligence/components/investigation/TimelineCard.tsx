/**
 * Timeline Card
 *
 * Displays chronological timeline of subject events with visualization
 * Part of the progressive investigation drill-down workflow
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  X,
  Calendar,
  MapPin,
  AlertTriangle,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  List,
  GitBranch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import { G6TimelineGraph } from '@/components/g6/G6TimelineGraph'

export interface TimelineCardProps {
  events: TimelineEvent[]
  subjectName?: string
  subjectId?: string // Add subjectId for network loading
  onAction?: (action: string, data: any) => void
  onClose?: () => void
  className?: string
}

function getSignificanceColor(significance: string) {
  switch (significance) {
    case 'critical':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'medium':
      return 'bg-amber-500'
    case 'low':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'travel':
    case 'movement':
      return MapPin
    case 'meeting':
    case 'contact':
      return User
    case 'alert':
    case 'anomaly':
      return AlertTriangle
    default:
      return Calendar
  }
}

function formatEventDate(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TimelineCard({
  events,
  subjectName,
  subjectId,
  onAction,
  onClose,
  className
}: TimelineCardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph') // Default to graph view
  const [selectedSignificance, setSelectedSignificance] = useState<string | null>(null)
  const [expandedEvents, setExpandedEvents] = useState<string[]>([])

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const filteredEvents = selectedSignificance
    ? events.filter(e => e.significance === selectedSignificance)
    : events

  // Group events by date for visualization
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const date = event.timestamp.toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {} as Record<string, TimelineEvent[]>)

  const dates = Object.keys(eventsByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-full min-w-[420px] bg-white rounded-lg border border-green-200 shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-green-100 bg-green-50/50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Timeline Analysis
              </h3>
              {subjectName && (
                <div className="text-xs text-gray-600 mt-1">
                  {subjectName} • {filteredEvents.length} events
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-md p-1 border border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('graph')}
                className={cn(
                  'h-6 w-6 rounded',
                  viewMode === 'graph' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-900'
                )}
                title="Graph View"
              >
                <GitBranch className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-6 w-6 rounded',
                  viewMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-900'
                )}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 rounded hover:bg-white/50"
              >
                <X className="h-3.5 w-3.5 text-gray-500 hover:text-gray-900" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="p-4 bg-gray-50/30 relative">
          <G6TimelineGraph
            events={events}
            width={388} // Card width minus padding
            height={500}
            onEventClick={(event) => {
              console.log('Timeline event clicked:', event)
              // Optionally show event details or trigger an action
              onAction?.('event-selected', event)
            }}
          />
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Timeline Visualization */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] text-gray-500 uppercase tracking-wide">Activity Distribution</span>
              <span className="text-[9px] text-gray-500">Last 7 Days</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {dates.slice(0, 7).reverse().map((date, i) => {
                const count = eventsByDate[date].length
                const maxCount = Math.max(...Object.values(eventsByDate).map(e => e.length))
                const height = (count / maxCount) * 100

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-t transition-all hover:opacity-80 cursor-help',
                        getSignificanceColor(eventsByDate[date][0]?.significance || 'low')
                      )}
                      style={{ height: `${height}%`, minHeight: '8px' }}
                      title={`${count} events on ${formatEventDate(new Date(date))}`}
                    />
                    <span className="text-[8px] text-gray-500">
                      {formatEventDate(new Date(date)).split(' ')[1] || formatEventDate(new Date(date))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filter Options */}
          <div className="p-3 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wide mr-1">Filter:</span>
              {['critical', 'high', 'medium', 'low'].map(sig => (
                <button
                  key={sig}
                  onClick={() => setSelectedSignificance(selectedSignificance === sig ? null : sig)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                    selectedSignificance === sig
                      ? `${getSignificanceColor(sig)} text-white`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No events match the selected filter
              </div>
            ) : (
              filteredEvents.map((event, index) => {
                const Icon = getEventIcon(event.type)
                const isExpanded = expandedEvents.includes(event.id)

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'border rounded-lg overflow-hidden transition-all',
                      isExpanded ? 'border-gray-300 shadow-sm' : 'border-gray-200'
                    )}
                  >
                    {/* Event Header */}
                    <button
                      onClick={() => toggleEvent(event.id)}
                      className="w-full px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors flex items-start gap-3"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        getSignificanceColor(event.significance),
                        'bg-opacity-10'
                      )}>
                        <Icon className={cn('w-4 h-4', getSignificanceColor(event.significance).replace('bg-', 'text-'))} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold text-gray-900 leading-tight">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatEventDate(event.timestamp)}</span>
                          {event.location && (
                            <>
                              <span>•</span>
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>

                    {/* Event Details */}
                    {isExpanded && (
                      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs space-y-2">
                        {event.description && (
                          <p className="text-gray-700 leading-relaxed">{event.description}</p>
                        )}
                        {event.associatedSubjects && event.associatedSubjects.length > 0 && (
                          <div>
                            <span className="text-gray-500">Associated:</span>
                            <span className="ml-2 text-gray-900 font-medium">
                              {event.associatedSubjects.join(', ')}
                            </span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs mt-2"
                          onClick={() => onAction?.('show-on-map', event)}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Show on Map
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Actions Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-8 text-xs border-gray-200 hover:bg-white"
            onClick={() => onAction?.('show-network', {
              subjectId: subjectId || events[0]?.associatedSubjects?.[0],
              subjectName
            })}
          >
            Show Network
          </Button>
          <Button
            variant="outline"
            className="h-8 text-xs border-gray-200 hover:bg-white"
            onClick={() => onAction?.('export-timeline', { events: filteredEvents })}
          >
            Export Data
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
