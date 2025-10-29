/**
 * Alert Queue Component
 * Federal-grade FIFO alert review system with triage workflow
 *
 * Features:
 * - Chronological queue (newest first)
 * - Priority filtering
 * - Triage actions (acknowledge, escalate, dismiss, assign)
 * - Progress tracking
 * - Keyboard shortcuts
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { X, CheckCircle2, AlertTriangle, ArrowUpCircle, Trash2, User, Filter, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { getPriorityColor } from './panels/IntelligenceAlertPanel'

export interface AlertQueueProps {
  alerts: IntelligenceAlert[]
  onAlertClick: (alert: IntelligenceAlert) => void
  onClose: () => void
  onTriageAction?: (alertId: string, action: TriageAction) => void
}

export type TriageAction = 'acknowledge' | 'escalate' | 'dismiss' | 'assign'

export interface AlertTriageState {
  alertId: string
  action: TriageAction
  timestamp: Date
  analyst?: string
  notes?: string
}

/**
 * Alert Queue Component
 */
export default function AlertQueue({
  alerts,
  onAlertClick,
  onClose,
  onTriageAction
}: AlertQueueProps) {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [triageStates, setTriageStates] = useState<Map<string, AlertTriageState>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts]

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(a => a.priority === priorityFilter)
    }

    // Sort by priority then timestamp (newest first)
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    return filtered
  }, [alerts, priorityFilter])

  // Current alert
  const currentAlert = filteredAlerts[currentIndex]

  // Calculate progress
  const triaged = useMemo(() => {
    return filteredAlerts.filter(a => triageStates.has(a.id)).length
  }, [filteredAlerts, triageStates])

  const progress = filteredAlerts.length > 0 ? (triaged / filteredAlerts.length) * 100 : 0

  // Handle triage action
  const handleTriage = useCallback((action: TriageAction) => {
    if (!currentAlert) return

    const state: AlertTriageState = {
      alertId: currentAlert.id,
      action,
      timestamp: new Date(),
      analyst: 'Current Analyst' // Would come from auth context
    }

    setTriageStates(prev => new Map(prev).set(currentAlert.id, state))

    // Callback
    onTriageAction?.(currentAlert.id, action)

    // Auto-advance to next alert
    if (currentIndex < filteredAlerts.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentAlert, currentIndex, filteredAlerts.length, onTriageAction])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a') handleTriage('acknowledge')
      if (e.key === 'e') handleTriage('escalate')
      if (e.key === 'd') handleTriage('dismiss')
      if (e.key === 'ArrowRight' && currentIndex < filteredAlerts.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, filteredAlerts.length, handleTriage])

  if (!currentAlert) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-bold text-gray-900">Alert Queue</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-gray-900 mb-2">Queue Complete</h4>
            <p className="text-sm text-gray-600">All alerts have been reviewed</p>
          </div>
        </div>
      </div>
    )
  }

  const priorityColors = getPriorityColor(currentAlert.priority)

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-900">Alert Queue</h3>
          <Badge variant="outline" className="text-xs border-gray-300">
            {currentIndex + 1} / {filteredAlerts.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
          <span>Triage Progress</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-200">
        <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
          <SelectTrigger className="h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical Only</SelectItem>
            <SelectItem value="high">High Only</SelectItem>
            <SelectItem value="medium">Medium Only</SelectItem>
            <SelectItem value="low">Low Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Alert */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Alert Header */}
          <Card className={cn('border-2', priorityColors.border, priorityColors.bg)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn('w-2.5 h-2.5 rounded-full mt-1.5', priorityColors.dot)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-bold uppercase', priorityColors.text)}>
                      {currentAlert.priority} PRIORITY
                    </span>
                    {currentAlert.actionRequired && (
                      <Badge className="bg-red-600 text-white text-[9px] px-1 py-0">
                        ACTION REQUIRED
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-2">{currentAlert.title}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{currentAlert.description}</p>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="h-3 w-3" />
                  {currentAlert.timestamp.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <User className="h-3 w-3" />
                  {currentAlert.subjectName}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Triage Actions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700 mb-2">Triage Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-green-300 hover:bg-green-50 hover:text-green-700"
                onClick={() => handleTriage('acknowledge')}
              >
                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                Acknowledge (A)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-red-300 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleTriage('escalate')}
              >
                <ArrowUpCircle className="h-3 w-3 mr-1.5" />
                Escalate (E)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-gray-300"
                onClick={() => handleTriage('assign')}
              >
                <User className="h-3 w-3 mr-1.5" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-gray-300 hover:bg-gray-50"
                onClick={() => handleTriage('dismiss')}
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Dismiss (D)
              </Button>
            </div>
          </div>

          {/* View Details */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onAlertClick(currentAlert)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            View Full Intelligence
          </Button>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={currentIndex >= filteredAlerts.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              Next →
            </Button>
          </div>

          {/* Keyboard Shortcuts */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">Keyboard Shortcuts</div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-600">
                <div><kbd className="px-1 bg-white border border-gray-300 rounded">A</kbd> Acknowledge</div>
                <div><kbd className="px-1 bg-white border border-gray-300 rounded">E</kbd> Escalate</div>
                <div><kbd className="px-1 bg-white border border-gray-300 rounded">D</kbd> Dismiss</div>
                <div><kbd className="px-1 bg-white border border-gray-300 rounded">→</kbd> Next</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Status Summary */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-lg font-bold text-gray-900">{triaged}</div>
            <div className="text-gray-600">Triaged</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{filteredAlerts.length - triaged}</div>
            <div className="text-gray-600">Remaining</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{filteredAlerts.length}</div>
            <div className="text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  )
}
