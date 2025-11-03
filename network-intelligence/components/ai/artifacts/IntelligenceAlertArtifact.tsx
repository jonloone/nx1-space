/**
 * Intelligence Alert Artifact - Simplified Design
 *
 * Clean, minimal alert card with essential information only
 * - Light theme only (no dark mode)
 * - 380px width
 * - Progressive disclosure
 * - Professional styling
 */

'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, MapPin, User, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

export interface IntelligenceAlertArtifactProps {
  alert: IntelligenceAlert
  onAction?: (action: string, data: any) => void
  onClose?: () => void
  className?: string
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp: Date): string {
  const now = Date.now()
  const diff = now - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

/**
 * Get priority color scheme
 */
function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500'
      }
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500'
      }
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500'
      }
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        dot: 'bg-gray-500'
      }
  }
}

export function IntelligenceAlertArtifact({
  alert,
  onAction,
  onClose,
  className
}: IntelligenceAlertArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const colors = getPriorityColor(alert.priority)

  return (
    <div
      className={cn(
        'w-full min-w-[380px] bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow',
        colors.border,
        className
      )}
    >
      {/* Header - Priority Badge */}
      <div className={cn('px-4 py-2.5 border-b flex items-center justify-between', colors.bg, colors.border)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
          <span className={cn('text-xs font-bold uppercase tracking-wide', colors.text)}>
            {alert.priority}
          </span>
          {alert.caseName && (
            <>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-600 font-medium truncate">
                {alert.caseName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-500">
            {getRelativeTime(alert.timestamp)}
          </span>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded hover:bg-white/50 text-gray-500 hover:text-gray-900"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-tight">
          {alert.title}
        </h3>

        {/* Metadata Row */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {alert.subjectName && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium">{alert.subjectName}</span>
            </div>
          )}
          {alert.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{alert.location.name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {alert.description && (
          <p className={cn(
            'text-sm text-gray-700 leading-relaxed',
            !isExpanded && 'line-clamp-2'
          )}>
            {alert.description}
          </p>
        )}

        {/* Quick Stats & Visualizations - Always Visible */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {/* Confidence Meter */}
          {alert.confidence && (
            <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
              <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Confidence</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      alert.confidence === 'high' ? 'bg-green-500 w-[85%]' :
                      alert.confidence === 'medium' ? 'bg-amber-500 w-[60%]' :
                      'bg-red-500 w-[35%]'
                    )}
                  />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 capitalize">
                  {alert.confidence === 'high' ? '85%' : alert.confidence === 'medium' ? '60%' : '35%'}
                </span>
              </div>
            </div>
          )}

          {/* Event Count */}
          <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
            <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Events</div>
            <div className="text-base font-bold text-gray-900">
              {alert.relatedEvents?.length || 7}
            </div>
          </div>

          {/* Risk Level */}
          <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
            <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Risk</div>
            <div className={cn(
              'text-[10px] font-bold uppercase',
              alert.priority === 'critical' ? 'text-red-600' :
              alert.priority === 'high' ? 'text-orange-600' :
              alert.priority === 'medium' ? 'text-amber-600' :
              'text-blue-600'
            )}>
              {alert.priority}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            {/* Quick Facts Grid */}
            <div className="grid grid-cols-2 gap-2">
              {alert.caseNumber && (
                <div className="bg-gray-50 rounded-md p-2.5 border border-gray-100">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Case #</div>
                  <div className="text-xs font-mono font-semibold text-gray-900">{alert.caseNumber}</div>
                </div>
              )}
              {alert.confidence && (
                <div className="bg-gray-50 rounded-md p-2.5 border border-gray-100">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Confidence</div>
                  <div className="text-xs font-semibold text-gray-900 capitalize">{alert.confidence}</div>
                </div>
              )}
            </div>

            {/* Tags */}
            {alert.tags && alert.tags.length > 0 && (
              <div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {alert.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded border border-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progressive Investigation Actions */}
            <div className="pt-2 space-y-2">
              <Button
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                onClick={() => onAction?.('view-subject-profile', alert)}
              >
                <User className="w-3.5 h-3.5 mr-2" />
                View Subject Profile
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-8 text-xs border-gray-200 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction?.('view-timeline', alert)
                  }}
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Timeline
                </Button>
                <Button
                  variant="outline"
                  className="h-8 text-xs border-gray-200 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction?.('show-network', alert)
                  }}
                >
                  Network
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Expand/Collapse */}
      <div className="border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-9 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-none rounded-b-lg"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
              Show More
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
