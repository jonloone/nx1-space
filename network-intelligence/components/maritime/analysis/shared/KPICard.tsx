'use client'

/**
 * KPI Card Components
 * Reusable metric display cards for maritime analytics dashboards
 *
 * Features:
 * - Large number display with label
 * - Trend indicator (up/down/neutral)
 * - Sparkline mini-chart option
 * - Color variants (default, success, warning, danger, info)
 */

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KPIData, TrendDirection } from '@/lib/types/maritime-analysis'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface KPICardProps {
  /** KPI data */
  data: KPIData
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
  /** Click handler */
  onClick?: () => void
}

export interface KPIGridProps {
  /** Array of KPI data */
  kpis: KPIData[]
  /** Number of columns */
  columns?: 2 | 3 | 4 | 5 | 6
  /** Card size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a value based on format type
 */
function formatValue(value: number | string, format?: KPIData['format']): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'duration':
      if (value < 60) return `${Math.round(value)}m`
      const hours = Math.floor(value / 60)
      if (hours < 24) return `${hours}h`
      return `${Math.floor(hours / 24)}d`
    case 'number':
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toLocaleString()
  }
}

/**
 * Get color classes for KPI variant
 */
function getColorClasses(color: KPIData['color']): {
  border: string
  icon: string
  trend: string
} {
  switch (color) {
    case 'success':
      return {
        border: 'border-green-500/30',
        icon: 'text-green-400',
        trend: 'text-green-400'
      }
    case 'warning':
      return {
        border: 'border-yellow-500/30',
        icon: 'text-yellow-400',
        trend: 'text-yellow-400'
      }
    case 'danger':
      return {
        border: 'border-red-500/30',
        icon: 'text-red-400',
        trend: 'text-red-400'
      }
    case 'info':
      return {
        border: 'border-blue-500/30',
        icon: 'text-blue-400',
        trend: 'text-blue-400'
      }
    default:
      return {
        border: 'border-slate-700/50',
        icon: 'text-slate-400',
        trend: 'text-slate-400'
      }
  }
}

/**
 * Get trend colors
 */
function getTrendColors(trend: TrendDirection): string {
  switch (trend) {
    case 'up':
      return 'text-green-400'
    case 'down':
      return 'text-red-400'
    default:
      return 'text-slate-400'
  }
}

// ============================================================================
// Sparkline Component
// ============================================================================

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'currentColor',
  className
}: SparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  // Create gradient area
  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area */}
      <polygon
        points={areaPoints}
        fill="url(#sparkline-gradient)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End point dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2"
        fill={color}
      />
    </svg>
  )
}

// ============================================================================
// Trend Indicator Component
// ============================================================================

interface TrendIndicatorProps {
  direction: TrendDirection
  value?: string
  className?: string
}

function TrendIndicator({ direction, value, className }: TrendIndicatorProps) {
  const Icon = direction === 'up' ? TrendingUp :
               direction === 'down' ? TrendingDown : Minus

  return (
    <div className={cn(
      'flex items-center gap-0.5 text-xs',
      getTrendColors(direction),
      className
    )}>
      <Icon className="w-3 h-3" />
      {value && <span>{value}</span>}
    </div>
  )
}

// ============================================================================
// KPI Card Component
// ============================================================================

export function KPICard({
  data,
  size = 'md',
  className,
  onClick
}: KPICardProps) {
  const colors = getColorClasses(data.color)
  const Icon = data.icon

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  }

  const valueClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div
      className={cn(
        'bg-slate-900/90 rounded-lg border',
        colors.border,
        sizeClasses[size],
        onClick && 'cursor-pointer hover:bg-slate-800/90 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn('w-4 h-4', colors.icon)} />}
          <span className="text-xs text-slate-400 uppercase tracking-wide">
            {data.label}
          </span>
        </div>

        {data.trend && (
          <TrendIndicator
            direction={data.trend}
            value={data.trendValue}
          />
        )}
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between">
        <span className={cn('font-bold text-white', valueClasses[size])}>
          {formatValue(data.value, data.format)}
        </span>

        {data.sparklineData && (
          <Sparkline
            data={data.sparklineData}
            width={size === 'sm' ? 50 : size === 'lg' ? 100 : 70}
            height={size === 'sm' ? 16 : size === 'lg' ? 28 : 22}
            color={
              data.color === 'success' ? '#34d399' :
              data.color === 'warning' ? '#fbbf24' :
              data.color === 'danger' ? '#f87171' :
              data.color === 'info' ? '#60a5fa' : '#94a3b8'
            }
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// KPI Grid Component
// ============================================================================

export function KPIGrid({
  kpis,
  columns = 4,
  size = 'md',
  className
}: KPIGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  return (
    <div className={cn('grid gap-3', gridClasses[columns], className)}>
      {kpis.map(kpi => (
        <KPICard
          key={kpi.id}
          data={kpi}
          size={size}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Compact KPI Row Component
// ============================================================================

export interface CompactKPIProps {
  label: string
  value: number | string
  format?: KPIData['format']
  trend?: TrendDirection
  className?: string
}

export function CompactKPI({
  label,
  value,
  format,
  trend,
  className
}: CompactKPIProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">
          {formatValue(value, format)}
        </span>
        {trend && <TrendIndicator direction={trend} />}
      </div>
    </div>
  )
}

export default KPICard
