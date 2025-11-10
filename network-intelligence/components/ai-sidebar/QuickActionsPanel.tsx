'use client'

/**
 * Quick Actions Panel
 *
 * Context-aware suggestions for common analyst workflows
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useMapStore } from '@/lib/stores/mapStore'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface QuickAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

export interface QuickActionsPanelProps {
  className?: string
}

export default function QuickActionsPanel({
  className
}: QuickActionsPanelProps) {
  const { selectedFeature } = useMapStore()
  const { artifacts } = useAnalysisStore()

  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())

  // Generate contextual quick actions
  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = []

    // Workflow-based: If no artifacts, suggest starting investigation
    if (artifacts.length === 0 && !dismissed.has('start-investigation')) {
      actions.push({
        id: 'start-investigation',
        label: 'Load Investigation Preset',
        onClick: () => {
          // TODO: Implement preset loading
          console.log('Load investigation preset')
        },
        variant: 'primary'
      })
    }

    // Artifact-based: If alert is open, suggest profile
    const hasAlert = artifacts.some(a => a.type === 'intelligence-alert')
    if (hasAlert && !dismissed.has('view-profile')) {
      actions.push({
        id: 'view-profile',
        label: 'View Subject Profile',
        onClick: () => {
          // TODO: Implement profile view
          console.log('View subject profile')
        },
        variant: 'secondary'
      })
    }

    // Layer-based: If feature selected, suggest nearby search
    if (selectedFeature && !dismissed.has('show-nearby')) {
      actions.push({
        id: 'show-nearby',
        label: 'Show Nearby Places',
        onClick: () => {
          // TODO: Implement nearby search
          console.log('Show nearby places')
        },
        variant: 'outline'
      })
    }

    return actions.slice(0, 3) // Max 3 suggestions
  }, [artifacts, selectedFeature, dismissed])

  const handleDismiss = (actionId: string) => {
    setDismissed(prev => new Set([...prev, actionId]))
  }

  if (quickActions.length === 0) return null

  return (
    <div className={cn('px-4 py-3 border-b border-gray-100 bg-white', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-gray-700">Quick Actions</span>
      </div>

      <div className="space-y-2">
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
    </div>
  )
}
