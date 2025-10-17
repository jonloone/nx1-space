'use client'

/**
 * Temporal Analysis Component
 *
 * Time-based pattern detection and visualization for investigation intelligence.
 * Analyzes daily activity, time-of-day patterns, and routine vs anomaly detection.
 *
 * Features:
 * - Daily activity timeline
 * - 24-hour activity heatmap
 * - Day of week patterns
 * - Routine vs anomaly timeline
 * - Activity level graphs
 * - Sleep/wake pattern analysis
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Calendar,
  TrendingUp,
  Moon,
  Sun,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { LocationStop, TrackingPoint } from '@/lib/demo/investigation-demo-data'

interface TemporalAnalysisProps {
  trackingPoints: TrackingPoint[]
  locations: LocationStop[]
}

export default function TemporalAnalysis({ trackingPoints, locations }: TemporalAnalysisProps) {
  // Analyze time-of-day distribution
  const hourlyActivity = analyzeHourlyActivity(trackingPoints)
  const dayOfWeekActivity = analyzeDayOfWeekActivity(trackingPoints)
  const sleepWakePattern = analyzeSleepWakePattern(trackingPoints)
  const anomalyTimes = analyzeAnomalyTimes(locations)

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-[#176BF8]" />
        <h2 className="text-lg font-bold text-[#171717]">Temporal Analysis</h2>
      </div>

      {/* 24-Hour Activity Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sun className="h-4 w-4 text-[#F59E0B]" />
            24-Hour Activity Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HourlyActivityChart data={hourlyActivity} />
        </CardContent>
      </Card>

      {/* Day of Week Pattern */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#176BF8]" />
            Weekly Activity Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DayOfWeekChart data={dayOfWeekActivity} />
        </CardContent>
      </Card>

      {/* Sleep/Wake Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-[#8B5CF6]" />
            Sleep/Wake Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SleepWakeAnalysis data={sleepWakePattern} />
        </CardContent>
      </Card>

      {/* Anomaly Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
            Anomaly Detection Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnomalyTimeline anomalies={anomalyTimes} />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 24-Hour Activity Chart
 */
function HourlyActivityChart({ data }: { data: number[] }) {
  const maxActivity = Math.max(...data)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-24 gap-0.5">
        {data.map((activity, hour) => {
          const height = maxActivity > 0 ? (activity / maxActivity) * 100 : 0
          const isNightTime = hour >= 22 || hour < 6
          const isAnomalousTime = (hour >= 0 && hour < 5) && activity > 0

          return (
            <div key={hour} className="flex flex-col items-center gap-1">
              <div className="w-full h-20 flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t transition-all',
                    isAnomalousTime
                      ? 'bg-[#EF4444]'
                      : isNightTime
                      ? 'bg-[#8B5CF6]'
                      : 'bg-[#176BF8]'
                  )}
                  style={{ height: `${height}%` }}
                  title={`${hour}:00 - ${activity} points`}
                />
              </div>
              <div className="text-[8px] text-[#737373] font-mono">
                {hour.toString().padStart(2, '0')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#176BF8] rounded" />
          <span className="text-[#737373]">Daytime</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#8B5CF6] rounded" />
          <span className="text-[#737373]">Nighttime</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#EF4444] rounded" />
          <span className="text-[#737373]">Late Night</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Day of Week Chart
 */
function DayOfWeekChart({ data }: { data: { [key: string]: number } }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxActivity = Math.max(...Object.values(data))

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => {
        const activity = data[day] || 0
        const height = maxActivity > 0 ? (activity / maxActivity) * 100 : 0

        return (
          <div key={day} className="flex flex-col items-center gap-2">
            <div className="w-full h-24 flex items-end">
              <div
                className="w-full bg-[#176BF8] rounded-t"
                style={{ height: `${height}%` }}
                title={`${day}: ${activity} points`}
              />
            </div>
            <div className="text-xs font-medium text-[#171717]">{day}</div>
            <div className="text-[10px] text-[#737373]">{activity}</div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Sleep/Wake Analysis
 */
function SleepWakeAnalysis({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#171717]">{data.wakeTime}</div>
          <div className="text-xs text-[#737373]">Average Wake Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#171717]">{data.sleepTime}</div>
          <div className="text-xs text-[#737373]">Average Sleep Time</div>
        </div>
      </div>

      <Separator className="bg-[#E5E5E5]" />

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-[#737373]">Active Hours:</span>
          <span className="text-[#171717] font-medium">{data.activeHours}h/day</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#737373]">Rest Period:</span>
          <span className="text-[#171717] font-medium">{data.restHours}h/day</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#737373]">Late Night Activity:</span>
          <Badge variant="outline" className={cn(
            'text-xs',
            data.lateNightActivity > 0 ? 'border-[#EF4444] text-[#EF4444]' : 'border-[#10B981] text-[#10B981]'
          )}>
            {data.lateNightActivity > 0 ? `${data.lateNightActivity} events` : 'None'}
          </Badge>
        </div>
      </div>
    </div>
  )
}

/**
 * Anomaly Timeline
 */
function AnomalyTimeline({ anomalies }: { anomalies: any[] }) {
  return (
    <div className="space-y-2">
      {anomalies.length === 0 ? (
        <div className="text-center text-sm text-[#737373] py-4">
          No temporal anomalies detected
        </div>
      ) : (
        anomalies.map((anomaly, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-[#EF4444]">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-medium text-[#171717]">{anomaly.location}</div>
                  <Badge variant="outline" className="text-xs border-[#EF4444] text-[#EF4444]">
                    Anomaly
                  </Badge>
                </div>
                <div className="text-xs text-[#737373]">{anomaly.time}</div>
                <div className="text-xs text-[#EF4444] mt-1">{anomaly.reason}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  )
}

/**
 * Analysis Helper Functions
 */
function analyzeHourlyActivity(points: TrackingPoint[]): number[] {
  const hourly = new Array(24).fill(0)
  points.forEach(point => {
    const hour = point.timestamp.getHours()
    hourly[hour]++
  })
  return hourly
}

function analyzeDayOfWeekActivity(points: TrackingPoint[]): { [key: string]: number } {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daily: { [key: string]: number } = {}
  days.forEach(day => daily[day] = 0)

  points.forEach(point => {
    const day = days[point.timestamp.getDay()]
    daily[day]++
  })

  return daily
}

function analyzeSleepWakePattern(points: TrackingPoint[]) {
  // Simplified analysis - would be more sophisticated in production
  const lateNightPoints = points.filter(p => {
    const hour = p.timestamp.getHours()
    return hour >= 0 && hour < 5
  })

  return {
    wakeTime: '07:00',
    sleepTime: '22:30',
    activeHours: 15.5,
    restHours: 8.5,
    lateNightActivity: lateNightPoints.length
  }
}

function analyzeAnomalyTimes(locations: LocationStop[]) {
  return locations
    .filter(loc => loc.significance === 'anomaly')
    .map(loc => {
      const hour = loc.arrivalTime.getHours()
      const isLateNight = hour >= 0 && hour < 5

      return {
        location: loc.name,
        time: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(loc.arrivalTime),
        reason: isLateNight
          ? 'Unusual late-night activity (2-5 AM)'
          : loc.notes || 'Suspicious location or behavior pattern'
      }
    })
}
