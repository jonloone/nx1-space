'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Group } from '@visx/group'
import { AreaClosed, Line, LinePath } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { GridRows, GridColumns } from '@visx/grid'
import { scaleTime, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { LinearGradient } from '@visx/gradient'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { bisector } from 'd3-array'
import { timeFormat } from 'd3-time-format'

export interface UtilizationDataPoint {
  date: Date
  utilization: number
  station?: string
}

interface UtilizationTrendChartProps {
  data: UtilizationDataPoint[]
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  title?: string
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

// Accessors
const getDate = (d: UtilizationDataPoint) => d.date
const getUtilization = (d: UtilizationDataPoint) => d.utilization
const bisectDate = bisector<UtilizationDataPoint, Date>(d => d.date).left

export default function UtilizationTrendChart({
  data,
  width = 600,
  height = 300,
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
  title = 'Utilization Trend'
}: UtilizationTrendChartProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<UtilizationDataPoint>()

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  })

  // Bounds
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Scales
  const dateScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: [
          Math.min(...data.map(getDate).map(d => d.getTime())),
          Math.max(...data.map(getDate).map(d => d.getTime())),
        ],
      }),
    [innerWidth, data]
  )

  const utilizationScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [0, 100],
        nice: true,
      }),
    [innerHeight]
  )

  // Tooltip handler
  const handleTooltip = (
    event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
  ) => {
    const { x } = localPoint(event) || { x: 0 }
    const x0 = dateScale.invert(x - margin.left)
    const index = bisectDate(data, x0, 1)
    const d0 = data[index - 1]
    const d1 = data[index]
    let d = d0
    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: x,
      tooltipTop: utilizationScale(getUtilization(d)),
    })
  }

  // Format date for display
  const formatDate = timeFormat('%b %d, %Y')
  const formatTime = timeFormat('%I:%M %p')

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
      className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
            <span className="text-gray-400">Utilization</span>
          </div>
        </div>
      </div>

      <div className="relative" ref={containerRef}>
        <svg width={width} height={height}>
          <LinearGradient
            id="area-gradient"
            from="#3B82F6"
            to="#06B6D4"
            toOpacity={0.1}
          />
          <LinearGradient
            id="line-gradient"
            from="#3B82F6"
            to="#06B6D4"
          />

          <Group left={margin.left} top={margin.top}>
            {/* Grid */}
            <GridRows
              scale={utilizationScale}
              width={innerWidth}
              strokeDasharray="3,3"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeOpacity={0.3}
              pointerEvents="none"
            />
            <GridColumns
              scale={dateScale}
              height={innerHeight}
              strokeDasharray="3,3"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeOpacity={0.3}
              pointerEvents="none"
            />

            {/* Area */}
            <AreaClosed<UtilizationDataPoint>
              data={data}
              x={d => dateScale(getDate(d)) ?? 0}
              y={d => utilizationScale(getUtilization(d)) ?? 0}
              yScale={utilizationScale}
              strokeWidth={0}
              fill="url(#area-gradient)"
              curve={curveMonotoneX}
            />

            {/* Line */}
            <LinePath<UtilizationDataPoint>
              data={data}
              x={d => dateScale(getDate(d)) ?? 0}
              y={d => utilizationScale(getUtilization(d)) ?? 0}
              stroke="url(#line-gradient)"
              strokeWidth={3}
              curve={curveMonotoneX}
            />

            {/* Axes */}
            <AxisBottom
              top={innerHeight}
              scale={dateScale}
              numTicks={6}
              stroke="rgba(255, 255, 255, 0.2)"
              tickStroke="rgba(255, 255, 255, 0.2)"
              tickLabelProps={() => ({
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 11,
                textAnchor: 'middle',
              })}
            />
            <AxisLeft
              scale={utilizationScale}
              numTicks={5}
              stroke="rgba(255, 255, 255, 0.2)"
              tickStroke="rgba(255, 255, 255, 0.2)"
              tickLabelProps={() => ({
                fill: 'rgba(255, 255, 255, 0.6)',
                fontSize: 11,
                textAnchor: 'end',
                dx: -4,
              })}
              tickFormat={(value) => `${value}%`}
            />

            {/* Tooltip crosshair */}
            {tooltipData && (
              <>
                <Line
                  from={{ x: tooltipLeft ? tooltipLeft - margin.left : 0, y: 0 }}
                  to={{ x: tooltipLeft ? tooltipLeft - margin.left : 0, y: innerHeight }}
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth={1}
                  pointerEvents="none"
                  strokeDasharray="4,4"
                />
                <circle
                  cx={dateScale(getDate(tooltipData))}
                  cy={utilizationScale(getUtilization(tooltipData))}
                  r={6}
                  fill="white"
                  stroke="url(#line-gradient)"
                  strokeWidth={3}
                  pointerEvents="none"
                />
              </>
            )}

            {/* Invisible overlay for tooltip */}
            <rect
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              onTouchStart={handleTooltip}
              onTouchMove={handleTooltip}
              onMouseMove={handleTooltip}
              onMouseLeave={() => hideTooltip()}
            />
          </Group>
        </svg>

        {/* Tooltip */}
        {tooltipOpen && tooltipData && (
          <TooltipInPortal
            key={Math.random()}
            top={tooltipTop ? tooltipTop + margin.top : 0}
            left={tooltipLeft}
            style={tooltipStyles}
          >
            <div className="space-y-1">
              <div className="text-xs text-gray-400">
                {formatDate(getDate(tooltipData))}
              </div>
              <div className="text-lg font-bold text-white">
                {getUtilization(tooltipData).toFixed(1)}%
              </div>
              {tooltipData.station && (
                <div className="text-xs text-gray-300">
                  {tooltipData.station}
                </div>
              )}
            </div>
          </TooltipInPortal>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <div>
          Avg: {(data.reduce((acc, d) => acc + getUtilization(d), 0) / data.length).toFixed(1)}%
        </div>
        <div>
          Peak: {Math.max(...data.map(getUtilization)).toFixed(1)}%
        </div>
        <div>
          Low: {Math.min(...data.map(getUtilization)).toFixed(1)}%
        </div>
      </div>
    </motion.div>
  )
}
