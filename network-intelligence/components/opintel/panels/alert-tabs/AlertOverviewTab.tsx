/**
 * Alert Overview Tab
 * Priority distribution and key metrics using visx
 */

'use client'

import React, { useMemo } from 'react'
import { BarChart, TrendingUp, AlertTriangle, Clock, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

// Visx imports
import { Bar } from '@visx/shape'
import { Group } from '@visx/group'
import { scaleBand, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Grid } from '@visx/grid'
import { Text } from '@visx/text'

export interface AlertOverviewTabProps {
  alert: IntelligenceAlert
  relatedAlerts?: IntelligenceAlert[]
}

// Priority colors for chart
const PRIORITY_COLORS = {
  critical: '#dc2626', // red-600
  high: '#ea580c',     // orange-600
  medium: '#d97706',   // amber-600
  low: '#2563eb'       // blue-600
}

/**
 * Priority Distribution Bar Chart using Visx
 */
function PriorityDistributionChart({ alerts }: { alerts: IntelligenceAlert[] }) {
  const data = useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    alerts.forEach(alert => {
      counts[alert.priority] = (counts[alert.priority] || 0) + 1
    })

    return [
      { priority: 'Critical', count: counts.critical, color: PRIORITY_COLORS.critical },
      { priority: 'High', count: counts.high, color: PRIORITY_COLORS.high },
      { priority: 'Medium', count: counts.medium, color: PRIORITY_COLORS.medium },
      { priority: 'Low', count: counts.low, color: PRIORITY_COLORS.low }
    ]
  }, [alerts])

  // Chart dimensions
  const width = 400
  const height = 200
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }

  const xMax = width - margin.left - margin.right
  const yMax = height - margin.top - margin.bottom

  // Accessors
  const getPriority = (d: any) => d.priority
  const getCount = (d: any) => d.count

  // Scales
  const xScale = scaleBand<string>({
    domain: data.map(getPriority),
    range: [0, xMax],
    padding: 0.3
  })

  const yScale = scaleLinear<number>({
    domain: [0, Math.max(...data.map(getCount), 1)],
    range: [yMax, 0],
    nice: true
  })

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Grid lines */}
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            stroke="#e5e7eb"
            strokeOpacity={0.5}
            numTicksRows={5}
          />

          {/* Bars */}
          {data.map((d) => {
            const barWidth = xScale.bandwidth()
            const barHeight = yMax - (yScale(getCount(d)) ?? 0)
            const barX = xScale(getPriority(d))
            const barY = yMax - barHeight

            return (
              <Bar
                key={`bar-${getPriority(d)}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={d.color}
                rx={4}
              />
            )
          })}

          {/* Bar labels */}
          {data.map((d) => {
            const barWidth = xScale.bandwidth()
            const barX = xScale(getPriority(d))
            const barY = yMax - (yMax - (yScale(getCount(d)) ?? 0))

            return (
              <Text
                key={`label-${getPriority(d)}`}
                x={(barX ?? 0) + barWidth / 2}
                y={barY - 8}
                fontSize={12}
                fontWeight="bold"
                fill="#1f2937"
                textAnchor="middle"
              >
                {getCount(d)}
              </Text>
            )
          })}

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 11,
              textAnchor: 'middle'
            })}
          />
          <AxisLeft
            scale={yScale}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            numTicks={5}
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 10,
              textAnchor: 'end',
              dx: -4
            })}
          />
        </Group>
      </svg>
    </div>
  )
}

/**
 * Alert Overview Tab Component
 */
export function AlertOverviewTab({ alert, relatedAlerts = [] }: AlertOverviewTabProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const allAlerts = [alert, ...relatedAlerts]

    const criticalCount = allAlerts.filter(a => a.priority === 'critical').length
    const actionRequiredCount = allAlerts.filter(a => a.actionRequired).length

    const categories = new Set(allAlerts.map(a => a.category))

    // Time since alert
    const timeSinceAlert = Date.now() - alert.timestamp.getTime()
    const hoursAgo = Math.floor(timeSinceAlert / (1000 * 60 * 60))
    const minutesAgo = Math.floor((timeSinceAlert % (1000 * 60 * 60)) / (1000 * 60))

    return {
      totalAlerts: allAlerts.length,
      criticalCount,
      actionRequiredCount,
      categoriesCount: categories.size,
      timeSinceAlert: hoursAgo > 0 ? `${hoursAgo}h ${minutesAgo}m ago` : `${minutesAgo}m ago`
    }
  }, [alert, relatedAlerts])

  return (
    <div className="space-y-4">
      {/* Alert Description */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Alert Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-800 leading-relaxed">{alert.description}</p>

          {/* Tags */}
          {alert.tags && alert.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {alert.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded border border-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.criticalCount}</div>
                <div className="text-xs text-gray-600">Critical Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.actionRequiredCount}</div>
                <div className="text-xs text-gray-600">Action Required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</div>
                <div className="text-xs text-gray-600">Total Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{stats.timeSinceAlert}</div>
                <div className="text-xs text-gray-600">Time Since Alert</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-gray-200" />

      {/* Priority Distribution Chart */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Priority Distribution
            </CardTitle>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Alert breakdown across priority levels
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <PriorityDistributionChart alerts={[alert, ...relatedAlerts]} />
        </CardContent>
      </Card>

      {/* Location Details */}
      {alert.location && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{alert.location.name}</span>
            </div>
            {alert.location.address && (
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-gray-900 text-right">{alert.location.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Coordinates:</span>
              <span className="font-mono text-xs text-gray-900">
                {alert.location.coordinates[1].toFixed(4)}, {alert.location.coordinates[0].toFixed(4)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
