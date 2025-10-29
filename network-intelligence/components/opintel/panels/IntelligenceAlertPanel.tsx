/**
 * Intelligence Alert Panel
 * Federal-grade alert details with advanced visualizations
 *
 * Features:
 * - Overview: Priority distribution chart (visx)
 * - Timeline: Temporal activity visualization (visx)
 * - Network: Subject connection graph (graphology)
 * - Analysis: Related events table (TanStack)
 */

'use client'

import React from 'react'
import { X, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

// Import AI analysis tab component
import { AlertAIAnalysisTab } from './alert-tabs/AlertAIAnalysisTab'

export interface IntelligenceAlertPanelProps {
  alert: IntelligenceAlert
  relatedAlerts?: IntelligenceAlert[]
  onClose: () => void
  onAlertClick?: (alertId: string) => void
  onSubjectClick?: (subjectId: string) => void
}

/**
 * Priority color mapping (federal standard)
 */
export function getPriorityColor(priority: string): {
  bg: string
  border: string
  text: string
  dot: string
} {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-600'
      }
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-600'
      }
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-600'
      }
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-600'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        dot: 'bg-gray-600'
      }
  }
}

/**
 * Confidence badge styling
 */
export function getConfidenceBadge(confidence: string): {
  color: string
  label: string
} {
  switch (confidence) {
    case 'confirmed':
      return { color: 'bg-green-100 text-green-800 border-green-300', label: 'CONFIRMED' }
    case 'high':
      return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'HIGH CONFIDENCE' }
    case 'medium':
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'MEDIUM CONFIDENCE' }
    case 'low':
      return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'LOW CONFIDENCE' }
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'UNKNOWN' }
  }
}

export default function IntelligenceAlertPanel({
  alert,
  relatedAlerts = [],
  onClose,
  onAlertClick,
  onSubjectClick
}: IntelligenceAlertPanelProps) {
  // Debug: Verify new panel version is loaded
  console.log('🎨 IntelligenceAlertPanel v3.0 - AI-First Single-Scroll Design')

  const priorityColors = getPriorityColor(alert.priority)

  // Calculate relative time
  const getRelativeTime = (timestamp: Date) => {
    const now = Date.now()
    const diff = now - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Ultra-Minimal Header - Intelligence Best Practice */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex-1 min-w-0 pr-4">
          {/* Priority | Case Name - Single line context */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn('text-xs font-bold uppercase tracking-wider', priorityColors.text)}>
              {alert.priority}
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs font-medium text-gray-600">
              {alert.caseName}
            </span>
          </div>

          {/* Alert Title - Main focus */}
          <h2 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
            {alert.title}
          </h2>

          {/* Subject • Location • Time - Story in one line */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">{alert.subjectName}</span>
            {alert.location && (
              <>
                <span>•</span>
                <span>{alert.location.name}</span>
              </>
            )}
            <span>•</span>
            <span>{getRelativeTime(alert.timestamp)}</span>
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 rounded-full hover:bg-gray-50"
        >
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      {/* Single Scroll Content - No Tabs */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          {/* AI Analysis Hero Section - Most Critical Info First */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">AI Assessment</h3>
            </div>

            <AlertAIAnalysisTab alert={alert} allAlerts={relatedAlerts} onAlertClick={onAlertClick} />
          </div>

          <Separator className="bg-gray-200" />

          {/* Quick Facts - Compact 3-column grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Quick Facts
            </h4>

            <div className="grid grid-cols-3 gap-3">
              {/* Case */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Case</div>
                <div className="font-mono text-xs text-gray-900 font-semibold">{alert.caseNumber}</div>
              </div>

              {/* Subject */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Subject</div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  onClick={() => onSubjectClick?.(alert.subjectId)}
                >
                  {alert.subjectName.split(' ')[0]}
                </Button>
              </div>

              {/* Confidence */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Confidence</div>
                <div className="text-xs text-gray-900 font-semibold capitalize">{alert.confidence}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {alert.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Details
              </h4>
              <p className="text-sm text-gray-800 leading-relaxed">{alert.description}</p>

              {/* Tags */}
              {alert.tags && alert.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {alert.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded border border-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Contextual Action Bar */}
      <div className="border-t border-gray-200 p-4 space-y-2.5 bg-white">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 rounded-lg text-sm">
          Review Timeline
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" className="h-9 border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-sm">
            View Network
          </Button>
          <Button variant="outline" className="h-9 border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-sm">
            Cross-Reference
          </Button>
        </div>
      </div>
    </div>
  )
}
