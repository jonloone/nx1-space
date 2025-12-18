'use client'

/**
 * FloatingStatsCard - Minimal Stats Display
 *
 * Glassmorphism floating card for displaying key metrics.
 * Positioned top-left by default, showing summary statistics.
 *
 * Features:
 * - Premium glassmorphism design
 * - Compact, minimal display
 * - Animated value changes
 * - Expandable detail view
 * - Auto-hide on scroll (optional)
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Ship, AlertTriangle, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface StatItem {
  id: string
  label: string
  value: number | string
  icon?: React.ElementType
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  change?: number
  suffix?: string
}

export interface FloatingStatsCardProps {
  stats: StatItem[]
  title?: string
  subtitle?: string
  visible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
  onStatClick?: (stat: StatItem) => void
}

// ============================================================================
// Constants
// ============================================================================

const POSITION_CLASSES: Record<string, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-20 left-4', // Account for chat bar
  'bottom-right': 'bottom-20 right-4'
}

const COLOR_CLASSES: Record<string, string> = {
  default: 'text-slate-300',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  info: 'text-blue-400'
}

const ICON_BG_CLASSES: Record<string, string> = {
  default: 'bg-slate-700/50',
  success: 'bg-emerald-500/20',
  warning: 'bg-amber-500/20',
  danger: 'bg-red-500/20',
  info: 'bg-blue-500/20'
}

// ============================================================================
// Component
// ============================================================================

export default function FloatingStatsCard({
  stats,
  title,
  subtitle,
  visible = true,
  position = 'top-left',
  collapsible = true,
  defaultExpanded = true,
  className,
  onStatClick
}: FloatingStatsCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsExpanded(prev => !prev)
    }
  }, [collapsible])

  if (!visible || stats.length === 0) return null

  // Show first 2 stats when collapsed, all when expanded
  const visibleStats = isExpanded ? stats : stats.slice(0, 2)
  const hasMore = stats.length > 2

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed z-40 pointer-events-auto',
        POSITION_CLASSES[position],
        className
      )}
    >
      <div className="glass-stats-card overflow-hidden min-w-[200px] max-w-[280px]">
        {/* Header */}
        {(title || collapsible) && (
          <div
            className={cn(
              'flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50',
              collapsible && 'cursor-pointer hover:bg-slate-800/30 transition-colors'
            )}
            onClick={toggleExpanded}
          >
            <div>
              {title && (
                <h3 className="text-sm font-medium text-slate-200">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
            {collapsible && hasMore && (
              <button className="p-1 rounded hover:bg-slate-700/50 transition-colors">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="p-3">
          <AnimatePresence mode="sync">
            <div className={cn(
              'grid gap-2',
              visibleStats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'
            )}>
              {visibleStats.map((stat, index) => {
                const Icon = stat.icon
                const colorClass = COLOR_CLASSES[stat.color || 'default']
                const iconBgClass = ICON_BG_CLASSES[stat.color || 'default']

                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-2.5 rounded-lg bg-slate-800/40',
                      onStatClick && 'cursor-pointer hover:bg-slate-800/60 transition-colors'
                    )}
                    onClick={() => onStatClick?.(stat)}
                  >
                    <div className="flex items-start gap-2">
                      {Icon && (
                        <div className={cn('p-1.5 rounded-lg', iconBgClass)}>
                          <Icon className={cn('w-3.5 h-3.5', colorClass)} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate">
                          {stat.label}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className={cn('text-lg font-semibold', colorClass)}>
                            {typeof stat.value === 'number'
                              ? stat.value.toLocaleString()
                              : stat.value}
                          </span>
                          {stat.suffix && (
                            <span className="text-xs text-slate-500">{stat.suffix}</span>
                          )}
                        </div>
                        {stat.change !== undefined && stat.change !== 0 && (
                          <div className={cn(
                            'text-[10px] flex items-center gap-0.5',
                            stat.change > 0 ? 'text-emerald-400' : 'text-red-400'
                          )}>
                            {stat.change > 0 ? '+' : ''}{stat.change}%
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>

          {/* Expand hint when collapsed */}
          {!isExpanded && hasMore && (
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-500">
                +{stats.length - 2} more
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Create maritime stats from vessel data
 */
export function createMaritimeStats(data: {
  totalVessels: number
  activeVessels: number
  anomalyCount: number
  avgSpeed: number
}): StatItem[] {
  return [
    {
      id: 'vessels',
      label: 'Vessels',
      value: data.totalVessels,
      icon: Ship,
      color: 'info'
    },
    {
      id: 'active',
      label: 'Active',
      value: data.activeVessels,
      icon: Activity,
      color: 'success'
    },
    {
      id: 'anomalies',
      label: 'Anomalies',
      value: data.anomalyCount,
      icon: AlertTriangle,
      color: data.anomalyCount > 0 ? 'warning' : 'default'
    },
    {
      id: 'avgSpeed',
      label: 'Avg Speed',
      value: data.avgSpeed.toFixed(1),
      suffix: 'kn',
      icon: Clock,
      color: 'default'
    }
  ]
}
