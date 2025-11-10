'use client'

/**
 * Context Actions Card
 *
 * Combined card showing current application context and quick actions
 * Replaces the separate ContextPanel and QuickActionsPanel components
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X, Brain, Loader2 } from 'lucide-react'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { usePanelStore } from '@/lib/stores/panelStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface QuickAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

export interface ContextActionsCardProps {
  className?: string
  isThinking?: boolean
  agentStatus?: 'idle' | 'analyzing' | 'monitoring'
  onAction?: (action: string, data: any) => void
}

export default function ContextActionsCard({
  className,
  isThinking = false,
  agentStatus = 'monitoring',
  onAction
}: ContextActionsCardProps) {
  const analysisStore = useAnalysisStore()
  const panelStore = usePanelStore()

  const { artifacts } = analysisStore
  const { rightPanelMode, rightPanelData } = panelStore

  const [expanded, setExpanded] = React.useState(true)
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())

  // Clear dismissed actions when panel changes (new context = fresh actions)
  React.useEffect(() => {
    setDismissed(new Set())
  }, [rightPanelMode])

  // Generate contextual quick actions based on panel state
  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = []

    // PRIORITY 1: Panel-based actions (most contextual)
    if (rightPanelMode === 'alert' && rightPanelData?.alert) {
      const alert = rightPanelData.alert

      // Action 1: View subject timeline
      if (!dismissed.has('view-timeline')) {
        actions.push({
          id: 'view-timeline',
          label: 'View Subject Timeline',
          onClick: () => {
            onAction?.('view-timeline', {
              subjectId: alert.subjectId,
              subjectName: alert.subjectName
            })
          },
          variant: 'outline'
        })
      }

      // Action 2: Analyze network connections
      if (!dismissed.has('show-network')) {
        actions.push({
          id: 'show-network',
          label: 'Analyze Network',
          onClick: () => {
            onAction?.('show-network', {
              subjectId: alert.subjectId,
              profile: alert
            })
          },
          variant: 'outline'
        })
      }

      // Action 3: Show on map
      if (alert.location?.coordinates && !dismissed.has('show-on-map')) {
        actions.push({
          id: 'show-on-map',
          label: 'Show on Map',
          onClick: () => {
            onAction?.('show-on-map', {
              location: alert.location,
              title: alert.title
            })
          },
          variant: 'outline'
        })
      }
    }
    // Network analysis panel
    else if (rightPanelMode === 'network-analysis' && rightPanelData?.centerNode) {
      if (!dismissed.has('export-network')) {
        actions.push({
          id: 'export-network',
          label: 'Export Network Data',
          onClick: () => {
            console.log('Export network data')
          },
          variant: 'outline'
        })
      }
    }
    // PRIORITY 2: Artifact-based actions
    else if (artifacts.length > 0) {
      const hasAlert = artifacts.some(a => a.type === 'intelligence-alert')

      if (hasAlert && !dismissed.has('view-profile')) {
        actions.push({
          id: 'view-profile',
          label: 'View Subject Profile',
          onClick: () => {
            console.log('View subject profile')
          },
          variant: 'secondary'
        })
      }
    }
    // PRIORITY 3: Default/empty state
    else if (artifacts.length === 0 && !rightPanelMode && !dismissed.has('start-investigation')) {
      actions.push({
        id: 'start-investigation',
        label: 'Load Investigation Preset',
        onClick: () => {
          console.log('Load investigation preset')
        },
        variant: 'outline'
      })
    }

    return actions.slice(0, 3) // Max 3 suggestions
  }, [rightPanelMode, rightPanelData, artifacts, dismissed, onAction])

  const handleDismiss = (actionId: string) => {
    setDismissed(prev => new Set([...prev, actionId]))
  }

  return (
    <Card className={cn('mx-3 mb-3 bg-white border-gray-200 shadow-sm', className)}>
      <CardHeader className="p-0">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            {/* Context Agent Indicator */}
            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              {/* Thinking Indicator */}
              {isThinking && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center"
                >
                  <Loader2 className="w-2 h-2 text-white animate-spin" />
                </motion.div>
              )}
            </div>

            {/* Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Suggested Actions
              </span>
            </div>

            {/* Status Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={agentStatus}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'text-[9px] font-medium',
                  agentStatus === 'idle' && 'text-gray-500',
                  agentStatus === 'analyzing' && 'text-blue-600',
                  agentStatus === 'monitoring' && 'text-green-600'
                )}
              >
                {agentStatus === 'idle' && 'Ready'}
                {agentStatus === 'analyzing' && 'Analyzing...'}
                {agentStatus === 'monitoring' && 'Monitoring'}
              </motion.div>
            </AnimatePresence>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-500 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </button>
      </CardHeader>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <CardContent className="p-0">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Actions List */}
              {quickActions.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {quickActions.map((action) => (
                      <motion.div
                        key={action.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="relative group"
                      >
                        <Button
                          variant={action.variant === 'primary' ? 'default' : action.variant === 'secondary' ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={action.onClick}
                          className={cn(
                            'w-full justify-start text-xs h-8 pr-8',
                            action.variant === 'primary' && 'bg-mundi-500 hover:bg-mundi-600'
                          )}
                        >
                          {action.icon && <action.icon className="w-3.5 h-3.5 mr-2" />}
                          {action.label}
                        </Button>

                        {/* Dismiss button */}
                        <button
                          onClick={() => handleDismiss(action.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Dismiss suggestion"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </CardContent>
        )}
      </AnimatePresence>
    </Card>
  )
}
