'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Group } from '@visx/group'
import { Bar } from '@visx/shape'
import { scaleBand, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { GridRows } from '@visx/grid'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'

export interface OperatorData {
  operator: string
  utilization: number
  stationCount: number
  revenue: number
  color?: string
}

interface OperatorComparisonChartProps {
  data: OperatorData[]
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  title?: string
  metric?: 'utilization' | 'stationCount' | 'revenue'
}

const tooltipStyles = {
  ...defaultStyles,
  background: 'rgba(0, 0, 0, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white',
  borderRadius: '8px',
  padding: '12px',
  backdropFilter: 'blur(12px)',
}

const defaultColors: Record<string, string> = {
  SES: '#3B82F6',
  AWS: '#FF9900',
  Telesat: '#9C27B0',
  SpaceX: '#00BCD4',
  KSAT: '#FFEB3B',
  Intelsat: '#E91E63'
}

export default function OperatorComparisonChart({
  data,
  width = 600,
  height = 300,
  margin = { top: 20, right: 30, bottom: 60, left: 60 },
  title = 'Operator Comparison',
  metric = 'utilization'
}: OperatorComparisonChartProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<OperatorData>()

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  })

  // Bounds
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Accessors
  const getOperator = (d: OperatorData) => d.operator
  const getValue = (d: OperatorData) => {
    switch (metric) {
      case 'stationCount':
        return d.stationCount
      case 'revenue':
        return d.revenue
      default:
        return d.utilization
    }
  }

  // Scales
  const operatorScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, innerWidth],
        domain: data.map(getOperator),
        padding: 0.3,
      }),
    [innerWidth, data]
  )

  const valueScale = useMemo(() => {
    const maxValue = Math.max(...data.map(getValue))
    return scaleLinear<number>({
      range: [innerHeight, 0],
      domain: [0, maxValue * 1.1], // Add 10% padding
      nice: true,
    })
  }, [innerHeight, data, metric])

  // Format value
  const formatValue = (value: number) => {
    switch (metric) {
      case 'stationCount':
        return value.toString()
      case 'revenue':
        return `$${value.toFixed(1)}M`
      default:
        return `${value.toFixed(1)}%`
    }
  }

  // Get metric label
  const getMetricLabel = () => {
    switch (metric) {
      case 'stationCount':
        return 'Station Count'
      case 'revenue':
        return 'Revenue'
      default:
        return 'Utilization'
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <div className="text-sm text-gray-400">{getMetricLabel()}</div>
      </div>

      <div className="relative" ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            {/* Grid */}
            <GridRows
              scale={valueScale}
              width={innerWidth}
              strokeDasharray="3,3"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeOpacity={0.3}
              pointerEvents="none"
            />

            {/* Bars */}
            {data.map((d, index) => {
              const operator = getOperator(d)
              const barWidth = operatorScale.bandwidth()
              const barHeight = innerHeight - (valueScale(getValue(d)) ?? 0)
              const barX = operatorScale(operator)
              const barY = innerHeight - barHeight
              const barColor = d.color || defaultColors[operator] || '#9CA3AF'

              return (
                <motion.g
                  key={`bar-${operator}`}
                  initial={{ opacity: 0, y: innerHeight }}
                  animate={{ opacity: 1, y: barY }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                >
                  <Bar
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    opacity={0.8}
                    rx={4}
                    onMouseMove={(event) => {
                      const coords = localPoint(event) || { x: 0, y: 0 }
                      showTooltip({
                        tooltipData: d,
                        tooltipLeft: coords.x,
                        tooltipTop: coords.y,
                      })
                    }}
                    onMouseLeave={() => hideTooltip()}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                  {/* Value label on top of bar */}
                  <text
                    x={(barX ?? 0) + barWidth / 2}
                    y={(barY ?? 0) - 8}
                    fill="white"
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {formatValue(getValue(d))}
                  </text>
                </motion.g>
              )
            })}

            {/* Axes */}
            <AxisBottom
              top={innerHeight}
              scale={operatorScale}
              stroke="rgba(255, 255, 255, 0.2)"
              tickStroke="rgba(255, 255, 255, 0.2)"
              tickLabelProps={() => ({
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 11,
                textAnchor: 'middle',
                angle: -45,
                dx: -10,
                dy: 5,
              })}
            />
            <AxisLeft
              scale={valueScale}
              stroke="rgba(255, 255, 255, 0.2)"
              tickStroke="rgba(255, 255, 255, 0.2)"
              tickLabelProps={() => ({
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 11,
                textAnchor: 'end',
                dx: -4,
              })}
              tickFormat={formatValue}
            />
          </Group>
        </svg>

        {/* Tooltip */}
        {tooltipOpen && tooltipData && (
          <TooltipInPortal
            key={Math.random()}
            top={tooltipTop}
            left={tooltipLeft}
            style={tooltipStyles}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: tooltipData.color || defaultColors[tooltipData.operator] || '#9CA3AF'
                  }}
                />
                <div className="font-semibold">{tooltipData.operator}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Utilization:</span>
                  <span className="text-white font-medium">
                    {tooltipData.utilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Stations:</span>
                  <span className="text-white font-medium">
                    {tooltipData.stationCount}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Revenue:</span>
                  <span className="text-white font-medium">
                    ${tooltipData.revenue.toFixed(1)}M
                  </span>
                </div>
              </div>
            </div>
          </TooltipInPortal>
        )}
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-gray-400">Total Stations</div>
          <div className="text-white font-medium mt-1">
            {data.reduce((acc, d) => acc + d.stationCount, 0)}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Avg Utilization</div>
          <div className="text-white font-medium mt-1">
            {(data.reduce((acc, d) => acc + d.utilization, 0) / data.length).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-400">Total Revenue</div>
          <div className="text-white font-medium mt-1">
            ${data.reduce((acc, d) => acc + d.revenue, 0).toFixed(1)}M
          </div>
        </div>
      </div>
    </motion.div>
  )
}
