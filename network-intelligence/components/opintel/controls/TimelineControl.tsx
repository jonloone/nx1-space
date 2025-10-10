'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Calendar,
  Clock,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TimelineControlProps {
  isPlaying?: boolean
  currentTime?: Date
  startTime?: Date
  endTime?: Date
  playbackSpeed?: number
  isExpanded?: boolean
  onPlayPause?: () => void
  onSkipBack?: () => void
  onSkipForward?: () => void
  onTimeChange?: (time: Date) => void
  onSpeedChange?: (speed: number) => void
  onExpandToggle?: () => void
}

export default function TimelineControl({
  isPlaying = false,
  currentTime = new Date(),
  startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  endTime = new Date(),
  playbackSpeed = 1,
  isExpanded = false,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onTimeChange,
  onSpeedChange,
  onExpandToggle
}: TimelineControlProps) {
  const [sliderValue, setSliderValue] = useState(50)
  const [hoveredTime, setHoveredTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch by only rendering times on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calculate position percentage
  const totalDuration = endTime.getTime() - startTime.getTime()
  const currentPosition =
    ((currentTime.getTime() - startTime.getTime()) / totalDuration) * 100

  useEffect(() => {
    setSliderValue(currentPosition)
  }, [currentPosition])

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0]
    setSliderValue(newValue)
    const newTime = new Date(
      startTime.getTime() + (totalDuration * newValue) / 100
    )
    onTimeChange?.(newTime)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getSpeedLabel = (speed: number) => {
    if (speed === 1) return '1x'
    if (speed < 1) return `${speed}x`
    return `${speed}x`
  }

  return (
    <motion.div
      className={cn(
        'w-full bg-black/40 backdrop-blur-sm border-t border-white/10',
        isExpanded ? 'h-[200px]' : 'h-[60px]'
      )}
      animate={{ height: isExpanded ? 200 : 60 }}
      transition={{ duration: 0.2 }}
    >
      {/* Compact View */}
      {!isExpanded && (
        <div className="h-full px-4 flex items-center gap-4">
          {/* Expand Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpandToggle}
            className="h-8 w-8 shrink-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkipBack}
              className="h-8 w-8"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              className="h-9 w-9 bg-white/10 hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onSkipForward}
              className="h-8 w-8"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="flex-1 flex items-center gap-3">
            <div className="text-xs text-white/60 font-mono shrink-0">
              {isMounted ? formatTime(currentTime) : '--:--:--'}
            </div>

            <Slider
              value={[sliderValue]}
              onValueChange={handleSliderChange}
              max={100}
              step={0.1}
              className="flex-1"
            />

            <div className="text-xs text-white/40 font-mono shrink-0">
              {isMounted ? formatTime(endTime) : '--:--:--'}
            </div>
          </div>

          {/* Speed Control */}
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(value) => onSpeedChange?.(parseFloat(value))}
          >
            <SelectTrigger className="w-20 h-8 text-xs border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.25">0.25x</SelectItem>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="5">5x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
            </SelectContent>
          </Select>

          {/* Live Indicator */}
          {Math.abs(currentTime.getTime() - endTime.getTime()) < 5000 && (
            <Badge variant="outline" className="shrink-0 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />
              LIVE
            </Badge>
          )}
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="h-full flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/60" />
              <span className="text-sm font-semibold text-white">
                Timeline Control
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Live Indicator */}
              {Math.abs(currentTime.getTime() - endTime.getTime()) < 5000 && (
                <Badge variant="outline" className="text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />
                  LIVE
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Settings className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Set Time Range</DropdownMenuItem>
                  <DropdownMenuItem>Export Timeline</DropdownMenuItem>
                  <DropdownMenuItem>Reset View</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={onExpandToggle}
                className="h-7 w-7"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2 text-xs" suppressHydrationWarning>
              <Calendar className="h-3 w-3 text-white/40" />
              <span className="text-white/60">{formatDate(startTime)}</span>
              <span className="text-white/40">→</span>
              <span className="text-white/60">{formatDate(endTime)}</span>
            </div>

            <div className="flex-1" />

            <div className="text-xs text-white/40" suppressHydrationWarning>
              Duration: {Math.round(totalDuration / (1000 * 60 * 60))}h
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="flex-1 mb-3 relative">
            <div className="absolute inset-0 bg-white/5 rounded">
              {/* Time markers */}
              <div className="absolute inset-0 flex justify-between px-2 py-1">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div key={percent} className="flex flex-col items-center">
                    <div className="w-px h-2 bg-white/20" />
                    <div className="text-[10px] text-white/40 mt-1 font-mono" suppressHydrationWarning>
                      {formatTime(
                        new Date(
                          startTime.getTime() + (totalDuration * percent) / 100
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current position indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                style={{ left: `${sliderValue}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
              </div>

              {/* Event markers (example) */}
              {[15, 35, 62, 88].map((percent, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
                  style={{ left: `${percent}%` }}
                  title="Event"
                />
              ))}
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onSkipBack}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onPlayPause}
                className="h-10 w-10 bg-white/10 hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onSkipForward}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Time Display */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-white font-mono" suppressHydrationWarning>
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-white/40" suppressHydrationWarning>
                / {formatTime(endTime)}
              </div>
            </div>

            <div className="flex-1" />

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Speed:</span>
              <Select
                value={playbackSpeed.toString()}
                onValueChange={(value) => onSpeedChange?.(parseFloat(value))}
              >
                <SelectTrigger className="w-24 h-8 text-xs border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1x</SelectItem>
                  <SelectItem value="0.25">0.25x</SelectItem>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x (Real-time)</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                  <SelectItem value="50">50x</SelectItem>
                  <SelectItem value="100">100x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Slider */}
          <div className="mt-3 px-2">
            <Slider
              value={[sliderValue]}
              onValueChange={handleSliderChange}
              max={100}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
