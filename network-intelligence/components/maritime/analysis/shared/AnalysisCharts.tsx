'use client'

/**
 * Analysis Chart Components
 * Lightweight chart components for maritime analytics dashboards
 *
 * Uses native SVG for minimal bundle size and consistent styling
 *
 * Components:
 * - MiniBarChart: Horizontal bar chart for category distribution
 * - MiniLineChart: Time series trend chart
 * - MiniPieChart: Donut/pie chart for type breakdown
 * - ActivityHeatmap: Hour-by-hour activity visualization
 */

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesPoint {
  time: Date | string
  value: number
}

// ============================================================================
// Color Palette
// ============================================================================

const DEFAULT_COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#38bdf8', // sky-400
  '#fb923c', // orange-400
  '#4ade80', // green-400
  '#f87171', // red-400
  '#94a3b8', // slate-400
]

// ============================================================================
// Mini Bar Chart
// ============================================================================

export interface MiniBarChartProps {
  data: ChartDataPoint[]
  width?: number
  height?: number
  showLabels?: boolean
  showValues?: boolean
  className?: string
}

export function MiniBarChart({
  data,
  width = 200,
  height = 120,
  showLabels = true,
  showValues = true,
  className
}: MiniBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))

  const barHeight = Math.min(24, (height - 20) / data.length - 4)
  const labelWidth = showLabels ? 60 : 0
  const valueWidth = showValues ? 40 : 0
  const barAreaWidth = width - labelWidth - valueWidth - 8

  return (
    <div className={cn('flex flex-col', className)} style={{ width, height }}>
      {data.map((item, index) => {
        const barWidth = maxValue > 0 ? (item.value / maxValue) * barAreaWidth : 0
        const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]

        return (
          <div key={item.label} className="flex items-center gap-2" style={{ height: barHeight + 4 }}>
            {/* Label */}
            {showLabels && (
              <span
                className="text-xs text-slate-400 truncate"
                style={{ width: labelWidth }}
                title={item.label}
              >
                {item.label}
              </span>
            )}

            {/* Bar */}
            <div
              className="flex-1 h-full rounded bg-slate-800/50 overflow-hidden"
              style={{ height: barHeight }}
            >
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color
                }}
              />
            </div>

            {/* Value */}
            {showValues && (
              <span
                className="text-xs text-slate-300 text-right"
                style={{ width: valueWidth }}
              >
                {item.value.toLocaleString()}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Mini Line Chart
// ============================================================================

export interface MiniLineChartProps {
  data: TimeSeriesPoint[] | number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  showDots?: boolean
  showGrid?: boolean
  className?: string
}

export function MiniLineChart({
  data,
  width = 200,
  height = 80,
  color = '#60a5fa',
  showArea = true,
  showDots = false,
  showGrid = false,
  className
}: MiniLineChartProps) {
  // Normalize data to number array
  const values = useMemo(() => {
    if (data.length === 0) return []
    if (typeof data[0] === 'number') return data as number[]
    return (data as TimeSeriesPoint[]).map(d => d.value)
  }, [data])

  if (values.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-slate-500 text-xs', className)}
        style={{ width, height }}
      >
        No data
      </div>
    )
  }

  const padding = { top: 4, right: 4, bottom: 4, left: 4 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  // Generate points
  const points = values.map((v, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartWidth
    const y = padding.top + chartHeight - ((v - min) / range) * chartHeight
    return { x, y, value: v }
  })

  // Line path
  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  // Area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`

  return (
    <svg
      width={width}
      height={height}
      className={className}
    >
      {/* Grid lines */}
      {showGrid && (
        <g className="text-slate-700">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity={0.3}
            />
          ))}
        </g>
      )}

      {/* Gradient definition */}
      <defs>
        <linearGradient id={`line-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#line-gradient-${color})`}
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
        />
      ))}

      {/* End dot (always shown) */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
      />
    </svg>
  )
}

// ============================================================================
// Mini Pie Chart
// ============================================================================

export interface MiniPieChartProps {
  data: ChartDataPoint[]
  size?: number
  innerRadius?: number // 0-1, 0 = pie, >0 = donut
  showLegend?: boolean
  className?: string
}

export function MiniPieChart({
  data,
  size = 120,
  innerRadius = 0.6,
  showLegend = true,
  className
}: MiniPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = size / 2 - 4
  const inner = radius * innerRadius

  // Calculate pie segments
  const segments = useMemo(() => {
    let startAngle = -Math.PI / 2 // Start at top
    return data.map((item, index) => {
      const angle = (item.value / total) * 2 * Math.PI
      const endAngle = startAngle + angle
      const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]

      // Calculate arc path
      const x1 = Math.cos(startAngle) * radius
      const y1 = Math.sin(startAngle) * radius
      const x2 = Math.cos(endAngle) * radius
      const y2 = Math.sin(endAngle) * radius
      const xi1 = Math.cos(startAngle) * inner
      const yi1 = Math.sin(startAngle) * inner
      const xi2 = Math.cos(endAngle) * inner
      const yi2 = Math.sin(endAngle) * inner

      const largeArc = angle > Math.PI ? 1 : 0

      const path = innerRadius > 0
        ? `M ${xi1} ${yi1} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${largeArc} 0 ${xi1} ${yi1} Z`
        : `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

      const segment = {
        path,
        color,
        label: item.label,
        value: item.value,
        percent: ((item.value / total) * 100).toFixed(1)
      }

      startAngle = endAngle
      return segment
    })
  }, [data, total, radius, inner, innerRadius])

  if (total === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-slate-500 text-xs', className)}
        style={{ width: size, height: size }}
      >
        No data
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Chart */}
      <svg width={size} height={size}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {segments.map((segment, i) => (
            <path
              key={i}
              d={segment.path}
              fill={segment.color}
              stroke="rgb(15, 23, 42)"
              strokeWidth="2"
              className="transition-opacity hover:opacity-80"
            />
          ))}

          {/* Center text for donut */}
          {innerRadius > 0 && (
            <>
              <text
                y="-4"
                textAnchor="middle"
                className="fill-white text-lg font-bold"
              >
                {total.toLocaleString()}
              </text>
              <text
                y="12"
                textAnchor="middle"
                className="fill-slate-400 text-xs"
              >
                Total
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-1">
          {segments.map((segment, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-slate-400 truncate max-w-[80px]" title={segment.label}>
                {segment.label}
              </span>
              <span className="text-xs text-slate-300 ml-auto">
                {segment.percent}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Activity Heatmap (24-hour)
// ============================================================================

export interface ActivityHeatmapProps {
  /** Activity counts by hour (0-23) */
  data: number[]
  width?: number
  height?: number
  showLabels?: boolean
  className?: string
}

export function ActivityHeatmap({
  data,
  width = 280,
  height = 40,
  showLabels = true,
  className
}: ActivityHeatmapProps) {
  const max = Math.max(...data, 1)
  const cellWidth = (width - (showLabels ? 40 : 0)) / 24
  const cellHeight = height - (showLabels ? 16 : 0)

  return (
    <div className={className}>
      <div className="flex">
        {/* Y-axis label */}
        {showLabels && (
          <div className="w-10 flex flex-col justify-center">
            <span className="text-xs text-slate-500">Activity</span>
          </div>
        )}

        {/* Heatmap cells */}
        <svg width={width - (showLabels ? 40 : 0)} height={cellHeight}>
          {data.map((value, hour) => {
            const intensity = value / max
            const color = `rgba(96, 165, 250, ${0.1 + intensity * 0.8})`

            return (
              <rect
                key={hour}
                x={hour * cellWidth + 1}
                y={0}
                width={cellWidth - 2}
                height={cellHeight - 2}
                fill={color}
                rx="2"
                className="transition-colors"
              >
                <title>{`${hour}:00 - ${value} events`}</title>
              </rect>
            )
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      {showLabels && (
        <div className="flex" style={{ marginLeft: showLabels ? 40 : 0 }}>
          {[0, 6, 12, 18, 23].map(hour => (
            <span
              key={hour}
              className="text-xs text-slate-500"
              style={{
                position: 'absolute',
                left: (showLabels ? 40 : 0) + hour * cellWidth + cellWidth / 2
              }}
            >
              {hour}h
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Stacked Bar Chart
// ============================================================================

export interface StackedBarData {
  label: string
  segments: { name: string; value: number; color?: string }[]
}

export interface StackedBarChartProps {
  data: StackedBarData[]
  width?: number
  height?: number
  showLabels?: boolean
  className?: string
}

export function StackedBarChart({
  data,
  width = 200,
  height = 120,
  showLabels = true,
  className
}: StackedBarChartProps) {
  const maxTotal = Math.max(...data.map(d => d.segments.reduce((s, seg) => s + seg.value, 0)))

  const barHeight = Math.min(20, (height - 8) / data.length - 4)
  const labelWidth = showLabels ? 50 : 0
  const barAreaWidth = width - labelWidth - 8

  return (
    <div className={cn('flex flex-col gap-1', className)} style={{ width }}>
      {data.map((item, rowIndex) => {
        const total = item.segments.reduce((s, seg) => s + seg.value, 0)

        return (
          <div key={item.label} className="flex items-center gap-2" style={{ height: barHeight + 4 }}>
            {/* Label */}
            {showLabels && (
              <span
                className="text-xs text-slate-400 truncate"
                style={{ width: labelWidth }}
                title={item.label}
              >
                {item.label}
              </span>
            )}

            {/* Stacked bar */}
            <div
              className="flex-1 flex rounded overflow-hidden bg-slate-800/50"
              style={{ height: barHeight, width: barAreaWidth }}
            >
              {item.segments.map((segment, segIndex) => {
                const segmentWidth = (segment.value / maxTotal) * barAreaWidth
                const color = segment.color || DEFAULT_COLORS[segIndex % DEFAULT_COLORS.length]

                return (
                  <div
                    key={segment.name}
                    className="h-full transition-all duration-500"
                    style={{
                      width: segmentWidth,
                      backgroundColor: color
                    }}
                    title={`${segment.name}: ${segment.value}`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default {
  MiniBarChart,
  MiniLineChart,
  MiniPieChart,
  ActivityHeatmap,
  StackedBarChart
}
