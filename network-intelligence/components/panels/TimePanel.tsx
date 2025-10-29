/**
 * TimePanel Component
 *
 * Time range picker panel for temporal data filtering
 * Features:
 * - Quick time presets (Last Hour, 24h, 7d, 30d, etc.)
 * - Custom date range selection
 * - Live/real-time mode toggle
 * - Visual timeline display
 * - Current selection summary
 */

'use client'

import React, { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  X,
  Calendar,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Circle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TimePanelProps {
  onClose?: () => void
  onTimeRangeChange?: (timeRange: TimeRange) => void
  className?: string
}

export interface TimeRange {
  start: Date
  end: Date
  preset?: string
  isLive?: boolean
}

const TIME_PRESETS = [
  { id: 'last-hour', label: 'Last Hour', hours: 1 },
  { id: 'last-3h', label: 'Last 3 Hours', hours: 3 },
  { id: 'last-6h', label: 'Last 6 Hours', hours: 6 },
  { id: 'last-12h', label: 'Last 12 Hours', hours: 12 },
  { id: 'last-24h', label: 'Last 24 Hours', hours: 24 },
  { id: 'last-7d', label: 'Last 7 Days', hours: 24 * 7 },
  { id: 'last-30d', label: 'Last 30 Days', hours: 24 * 30 },
  { id: 'last-90d', label: 'Last 90 Days', hours: 24 * 90 }
]

const TimePanel = forwardRef<HTMLDivElement, TimePanelProps>(
  function TimePanel({ onClose, onTimeRangeChange, className }, ref) {
    const [selectedPreset, setSelectedPreset] = useState('last-24h')
    const [isLive, setIsLive] = useState(true)
    const [customStart, setCustomStart] = useState<Date | null>(null)
    const [customEnd, setCustomEnd] = useState<Date | null>(null)

    const now = new Date()
    const defaultPreset = TIME_PRESETS.find((p) => p.id === 'last-24h')
    const [startDate, setStartDate] = useState(
      new Date(now.getTime() - (defaultPreset?.hours || 24) * 60 * 60 * 1000)
    )
    const [endDate, setEndDate] = useState(now)

    const handlePresetSelect = (preset: typeof TIME_PRESETS[0]) => {
      const end = new Date()
      const start = new Date(end.getTime() - preset.hours * 60 * 60 * 1000)

      setSelectedPreset(preset.id)
      setStartDate(start)
      setEndDate(end)
      setCustomStart(null)
      setCustomEnd(null)

      onTimeRangeChange?.({
        start,
        end,
        preset: preset.id,
        isLive
      })
    }

    const toggleLiveMode = () => {
      const newIsLive = !isLive
      setIsLive(newIsLive)

      onTimeRangeChange?.({
        start: startDate,
        end: endDate,
        preset: selectedPreset,
        isLive: newIsLive
      })
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatDuration = () => {
      const diff = endDate.getTime() - startDate.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(hours / 24)

      if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
      return 'Less than 1 hour'
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn('panel-card w-[320px] flex flex-col', className)}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176BF8] flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Time Range
              </h2>
              <p className="text-xs text-[#737373]">
                {isLive ? 'Live mode' : 'Historical'}
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
              aria-label="Close Time Panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Live Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              {isLive ? (
                <>
                  <Circle className="w-2.5 h-2.5 text-red-500 fill-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-[#171717]">
                    Live Updates
                  </span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#737373]" />
                  <span className="text-xs font-semibold text-[#737373]">
                    Paused
                  </span>
                </>
              )}
            </div>
            <Button
              variant={isLive ? 'default' : 'outline'}
              size="sm"
              onClick={toggleLiveMode}
              className={cn(
                'h-8 text-xs',
                isLive
                  ? 'bg-[#176BF8] hover:bg-[#0D4DB8]'
                  : 'bg-white hover:bg-[#F5F5F5]'
              )}
            >
              {isLive ? <Pause className="w-3 h-3 mr-1.5" /> : <Play className="w-3 h-3 mr-1.5" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    'h-10 text-xs font-medium justify-start',
                    selectedPreset === preset.id
                      ? 'bg-[#176BF8] text-white hover:bg-[#0D4DB8]'
                      : 'bg-white hover:bg-[#F5F5F5] text-[#525252]'
                  )}
                >
                  <Clock className="w-3 h-3 mr-2" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Visual Timeline */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Timeline
            </label>
            <div className="bg-[#F5F5F5] rounded-lg p-4 border border-[#E5E5E5]">
              {/* Timeline bar */}
              <div className="relative h-2 bg-white rounded-full mb-4 overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#176BF8] to-[#0D4DB8]"
                  style={{ width: '100%' }}
                />
                {isLive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />
                )}
              </div>

              {/* Time markers */}
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-[10px] text-[#737373] uppercase mb-0.5">
                    Start
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#171717]">
                    {formatTime(startDate)}
                  </div>
                  <div className="text-[10px] text-[#525252]">
                    {formatDate(startDate)}
                  </div>
                </div>

                <div className="text-center px-4">
                  <div className="text-[10px] text-[#737373] uppercase mb-0.5">
                    Duration
                  </div>
                  <div className="text-xs font-semibold text-[#176BF8]">
                    {formatDuration()}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] text-[#737373] uppercase mb-0.5">
                    {isLive ? 'Now' : 'End'}
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#171717]">
                    {formatTime(endDate)}
                  </div>
                  <div className="text-[10px] text-[#525252]">
                    {formatDate(endDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Range (Simplified) */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Custom Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs bg-white hover:bg-[#F5F5F5]"
                disabled
              >
                <Calendar className="w-3 h-3 mr-2" />
                Set Start
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs bg-white hover:bg-[#F5F5F5]"
                disabled
              >
                <Calendar className="w-3 h-3 mr-2" />
                Set End
              </Button>
            </div>
            <p className="text-[10px] text-[#737373] mt-2 text-center">
              Custom date picker coming soon
            </p>
          </div>

          {/* Navigation Controls */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Navigate
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const preset = TIME_PRESETS.find((p) => p.id === selectedPreset)
                  if (preset) {
                    const newEnd = new Date(startDate.getTime())
                    const newStart = new Date(
                      newEnd.getTime() - preset.hours * 60 * 60 * 1000
                    )
                    setStartDate(newStart)
                    setEndDate(newEnd)
                    setIsLive(false)
                  }
                }}
                className="h-9 text-xs bg-white hover:bg-[#F5F5F5]"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const preset = TIME_PRESETS.find((p) => p.id === selectedPreset)
                  if (preset) {
                    const end = new Date()
                    const start = new Date(
                      end.getTime() - preset.hours * 60 * 60 * 1000
                    )
                    setStartDate(start)
                    setEndDate(end)
                    setIsLive(true)
                  }
                }}
                className="h-9 text-xs bg-white hover:bg-[#F5F5F5]"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Now
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const preset = TIME_PRESETS.find((p) => p.id === selectedPreset)
                  if (preset && !isLive) {
                    const newStart = new Date(endDate.getTime())
                    const newEnd = new Date(
                      newStart.getTime() + preset.hours * 60 * 60 * 1000
                    )
                    // Don't go past current time
                    const now = new Date()
                    if (newEnd > now) {
                      setStartDate(newStart)
                      setEndDate(now)
                      setIsLive(true)
                    } else {
                      setStartDate(newStart)
                      setEndDate(newEnd)
                    }
                  }
                }}
                disabled={isLive}
                className="h-9 text-xs bg-white hover:bg-[#F5F5F5]"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Current Selection Summary */}
          <div className="bg-[#176BF8]/5 rounded-lg p-3 border border-[#176BF8]/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-[#176BF8]" />
              <span className="text-[10px] font-semibold text-[#171717] uppercase tracking-wide">
                Current Selection
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#737373]">Mode:</span>
                <span className="font-semibold text-[#171717]">
                  {isLive ? 'Live' : 'Historical'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Preset:</span>
                <span className="font-semibold text-[#171717]">
                  {TIME_PRESETS.find((p) => p.id === selectedPreset)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Duration:</span>
                <span className="font-semibold text-[#171717]">
                  {formatDuration()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

export default TimePanel
