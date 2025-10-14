'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pie } from '@visx/shape'
import { Group } from '@visx/group'
import { scaleOrdinal } from '@visx/scale'
import { LegendOrdinal } from '@visx/legend'
import { animated, useTransition, interpolate } from '@react-spring/web'

export interface ServiceData {
  service: string
  percentage: number
  revenue?: number
  color?: string
}

interface ServiceDistributionChartProps {
  data: ServiceData[]
  width?: number
  height?: number
  title?: string
}

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
]

// Animated pie slice
const AnimatedPie = animated(Pie)

export default function ServiceDistributionChart({
  data,
  width = 400,
  height = 400,
  title = 'Service Distribution'
}: ServiceDistributionChartProps) {
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null)

  // Calculate dimensions
  const centerY = height / 2
  const centerX = width / 2
  const outerRadius = Math.min(width, height) / 2 - 40
  const innerRadius = outerRadius * 0.5 // Donut chart

  // Color scale
  const colorScale = scaleOrdinal({
    domain: data.map(d => d.service),
    range: data.map((d, i) => d.color || defaultColors[i % defaultColors.length])
  })

  // Accessor
  const getPercentage = (d: ServiceData) => d.percentage

  // Calculate total for validation
  const total = data.reduce((acc, d) => acc + d.percentage, 0)

  // Transitions for pie slices
  const transitions = useTransition(
    data.map((d, i) => ({ ...d, index: i })),
    {
      keys: (d) => d.service,
      from: { opacity: 0, scale: 0 },
      enter: { opacity: 1, scale: 1 },
      update: { opacity: 1, scale: 1 },
      leave: { opacity: 0, scale: 0 },
    }
  )

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
      transition={{ delay: 0.2 }}
      className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
    >
      <h3 className="text-white font-semibold mb-4">{title}</h3>

      <div className="flex items-center justify-center gap-8">
        {/* Pie Chart */}
        <div className="relative">
          <svg width={width} height={height}>
            <Group top={centerY} left={centerX}>
              <Pie
                data={data}
                pieValue={getPercentage}
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                cornerRadius={4}
                padAngle={0.02}
              >
                {(pie) => (
                  <AnimatePresence>
                    {pie.arcs.map((arc, index) => {
                      const [centroidX, centroidY] = pie.path.centroid(arc)
                      const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.1
                      const arcPath = pie.path(arc) || ''
                      const arcFill = colorScale(arc.data.service)
                      const isSelected = selectedSlice === arc.data.service

                      return (
                        <motion.g
                          key={`arc-${arc.data.service}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: 1,
                            scale: isSelected ? 1.05 : 1,
                          }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{
                            delay: index * 0.05,
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <path
                            d={arcPath}
                            fill={arcFill}
                            opacity={selectedSlice && !isSelected ? 0.5 : 0.9}
                            onMouseEnter={() => setSelectedSlice(arc.data.service)}
                            onMouseLeave={() => setSelectedSlice(null)}
                            className="cursor-pointer transition-opacity duration-200"
                          />
                          {hasSpaceForLabel && (
                            <text
                              x={centroidX}
                              y={centroidY}
                              dy=".33em"
                              fill="white"
                              fontSize={14}
                              fontWeight="bold"
                              textAnchor="middle"
                              pointerEvents="none"
                              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                              {arc.data.percentage.toFixed(0)}%
                            </text>
                          )}
                        </motion.g>
                      )
                    })}
                  </AnimatePresence>
                )}
              </Pie>

              {/* Center text */}
              <text
                textAnchor="middle"
                fill="white"
                fontSize={16}
                fontWeight="bold"
                dy="-0.5em"
              >
                Total
              </text>
              <text
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.6)"
                fontSize={14}
                dy="1em"
              >
                {total.toFixed(0)}%
              </text>
            </Group>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {data.map((d, index) => {
            const isSelected = selectedSlice === d.service
            return (
              <motion.div
                key={d.service}
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: selectedSlice && !isSelected ? 0.5 : 1,
                  x: 0,
                  scale: isSelected ? 1.05 : 1,
                }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setSelectedSlice(d.service)}
                onMouseLeave={() => setSelectedSlice(null)}
                className="flex items-center gap-3 cursor-pointer transition-all"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: d.color || defaultColors[index % defaultColors.length]
                  }}
                />
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {d.service}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {d.percentage.toFixed(1)}%
                    {d.revenue && ` • $${d.revenue.toFixed(1)}M`}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Additional stats */}
      {data.some(d => d.revenue) && (
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-gray-400">Services</div>
            <div className="text-white font-medium mt-1">{data.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Top Service</div>
            <div className="text-white font-medium mt-1">
              {data.reduce((max, d) => d.percentage > max.percentage ? d : max).service}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Total Revenue</div>
            <div className="text-white font-medium mt-1">
              ${data.reduce((acc, d) => acc + (d.revenue || 0), 0).toFixed(1)}M
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
