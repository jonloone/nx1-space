/**
 * Analysis Drawer
 *
 * Collapsible analysis section within chat interface.
 * Shows detailed information about alerts, features, clusters.
 *
 * Features:
 * - Expand/collapse with smooth animation
 * - Tabbed interface (Details | AI Analysis | Network | Timeline)
 * - Reuses existing alert/analysis components
 * - Integrates seamlessly into chat flow
 */

'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Brain, Network, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { AlertAIAnalysisTab } from '@/components/opintel/panels/alert-tabs/AlertAIAnalysisTab'

export interface AnalysisDrawerProps {
  alert?: IntelligenceAlert
  allAlerts?: IntelligenceAlert[]
  initialExpanded?: boolean
  onAlertClick?: (alertId: string) => void
}

/**
 * Get priority styling
 */
function getPriorityStyles(priority: string) {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-900',
        text: 'text-red-700 dark:text-red-400',
        dot: 'bg-red-600'
      }
    case 'high':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-900',
        text: 'text-orange-700 dark:text-orange-400',
        dot: 'bg-orange-600'
      }
    case 'medium':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-900',
        text: 'text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-600'
      }
    case 'low':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-900',
        text: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-600'
      }
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-700 dark:text-gray-400',
        dot: 'bg-gray-600'
      }
  }
}

export function AnalysisDrawer({
  alert,
  allAlerts = [],
  initialExpanded = true,
  onAlertClick
}: AnalysisDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)

  if (!alert) {
    return null
  }

  const priorityStyles = getPriorityStyles(alert.priority)

  return (
    <div
      className={cn(
        'border-t border-[#E5E5E5] dark:border-gray-700',
        'bg-[#FAFAFA] dark:bg-gray-900/50',
        'transition-all duration-200'
      )}
    >
      {/* Drawer Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'hover:bg-[#F5F5F5] dark:hover:bg-gray-800/50 transition-colors',
          'text-left group'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Priority Indicator */}
          <div className={cn('w-2 h-2 rounded-full shrink-0', priorityStyles.dot)} />

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-[#525252] dark:text-gray-400 shrink-0" />
              <span className="text-xs font-semibold text-[#171717] dark:text-gray-100 uppercase tracking-wide">
                Analysis Details
              </span>
              <Badge
                variant="secondary"
                className={cn('text-[10px] px-1.5 py-0', priorityStyles.text, priorityStyles.bg)}
              >
                {alert.priority}
              </Badge>
            </div>
            <p className="text-xs text-[#525252] dark:text-gray-400 truncate">
              {alert.title}
            </p>
          </div>

          {/* Expand/Collapse Icon */}
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#737373] dark:text-gray-400 group-hover:text-[#171717] dark:group-hover:text-gray-100 transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#737373] dark:text-gray-400 group-hover:text-[#171717] dark:group-hover:text-gray-100 transition-colors" />
            )}
          </div>
        </div>
      </button>

      {/* Drawer Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-3 bg-white dark:bg-gray-800 h-9">
              <TabsTrigger value="ai" className="text-[10px] px-2 gap-1">
                <Brain className="h-3 w-3" />
                <span>AI</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="text-[10px] px-2 gap-1">
                <FileText className="h-3 w-3" />
                <span>Details</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="text-[10px] px-2 gap-1">
                <Network className="h-3 w-3" />
                <span>Network</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-[10px] px-2 gap-1">
                <Clock className="h-3 w-3" />
                <span>Timeline</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Analysis Tab */}
            <TabsContent value="ai" className="mt-0 bg-white dark:bg-gray-900 rounded-lg border border-[#E5E5E5] dark:border-gray-700 p-3">
              <AlertAIAnalysisTab
                alert={alert}
                allAlerts={allAlerts}
                onAlertClick={onAlertClick}
              />
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 bg-white dark:bg-gray-900 rounded-lg border border-[#E5E5E5] dark:border-gray-700 p-3 space-y-3">
              {/* Quick Facts */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F5F5F5] dark:bg-gray-800 rounded-lg p-2.5 border border-[#E5E5E5] dark:border-gray-700">
                  <div className="text-[10px] text-[#737373] dark:text-gray-400 uppercase tracking-wide mb-1">Case</div>
                  <div className="font-mono text-xs text-[#171717] dark:text-gray-100 font-semibold truncate">{alert.caseNumber}</div>
                </div>

                <div className="bg-[#F5F5F5] dark:bg-gray-800 rounded-lg p-2.5 border border-[#E5E5E5] dark:border-gray-700">
                  <div className="text-[10px] text-[#737373] dark:text-gray-400 uppercase tracking-wide mb-1">Subject</div>
                  <div className="text-xs text-[#171717] dark:text-gray-100 font-semibold truncate">{alert.subjectName}</div>
                </div>

                <div className="bg-[#F5F5F5] dark:bg-gray-800 rounded-lg p-2.5 border border-[#E5E5E5] dark:border-gray-700">
                  <div className="text-[10px] text-[#737373] dark:text-gray-400 uppercase tracking-wide mb-1">Location</div>
                  <div className="text-xs text-[#171717] dark:text-gray-100 font-semibold truncate">{alert.location?.name}</div>
                </div>

                <div className="bg-[#F5F5F5] dark:bg-gray-800 rounded-lg p-2.5 border border-[#E5E5E5] dark:border-gray-700">
                  <div className="text-[10px] text-[#737373] dark:text-gray-400 uppercase tracking-wide mb-1">Confidence</div>
                  <div className="text-xs text-[#171717] dark:text-gray-100 font-semibold capitalize">{alert.confidence}</div>
                </div>
              </div>

              {/* Description */}
              {alert.description && (
                <div>
                  <h4 className="text-[10px] font-bold text-[#171717] dark:text-gray-100 uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-xs text-[#525252] dark:text-gray-400 leading-relaxed">{alert.description}</p>
                </div>
              )}

              {/* Tags */}
              {alert.tags && alert.tags.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-[#171717] dark:text-gray-100 uppercase tracking-wider mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#F5F5F5] dark:bg-gray-800 text-[#525252] dark:text-gray-400 text-[10px] font-medium rounded border border-[#E5E5E5] dark:border-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network" className="mt-0 bg-white dark:bg-gray-900 rounded-lg border border-[#E5E5E5] dark:border-gray-700 p-3">
              <div className="text-center py-8 text-sm text-[#737373] dark:text-gray-400">
                Network graph visualization coming soon
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0 bg-white dark:bg-gray-900 rounded-lg border border-[#E5E5E5] dark:border-gray-700 p-3">
              <div className="text-center py-8 text-sm text-[#737373] dark:text-gray-400">
                Timeline visualization coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

export default AnalysisDrawer
