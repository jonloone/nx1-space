/**
 * QuickActions Component
 *
 * Displays contextual quick action buttons for common tasks.
 * Appears in the CommandPaletteBar for easy access.
 */

'use client'

import React from 'react'
import { Target, Filter, Clock, MapPin, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
}

export interface QuickActionsProps {
  onAction?: (actionId: string) => void
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const defaultActions: QuickAction[] = [
    {
      id: 'focus-location',
      label: 'Focus',
      icon: <Target className="w-3.5 h-3.5" />,
      action: () => onAction?.('focus-location')
    },
    {
      id: 'filter-data',
      label: 'Filter',
      icon: <Filter className="w-3.5 h-3.5" />,
      action: () => onAction?.('filter-data')
    },
    {
      id: 'time-range',
      label: 'Time',
      icon: <Clock className="w-3.5 h-3.5" />,
      action: () => onAction?.('time-range')
    },
    {
      id: 'layers',
      label: 'Layers',
      icon: <Layers className="w-3.5 h-3.5" />,
      action: () => onAction?.('layers')
    }
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {defaultActions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={action.action}
          className="h-7 px-2.5 text-xs font-medium border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
        >
          {action.icon}
          <span className="ml-1.5">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
