'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
  Clock,
  Calendar,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface TimelineStop {
  id: string
  name: string
  time: string
  day: number
  timestamp: Date
  significance?: 'normal' | 'notable' | 'critical'
}

interface TimelineControlProps {
  stops: TimelineStop[]
  currentIndex: number
  onIndexChange: (index: number) => void
  isPlaying?: boolean
  onPlayPause?: () => void
  playbackSpeed?: number
  onSpeedChange?: (speed: number) => void
}

/**
 * Timeline Control Component
 *
 * Modern timeline playback for exploration view
 * - Glassmorphism design
 * - Playback controls
 * - Speed adjustment
 * - Time scrubbing
 * - Expandable details
 */
export default function TimelineControl({
  stops,
  currentIndex,
  onIndexChange,
  isPlaying = false,
  onPlayPause,
  playbackSpeed = 1,
  onSpeedChange
}: TimelineControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localPlaying, setLocalPlaying] = useState(isPlaying)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentStop = stops[currentIndex]
  const progress = stops.length > 0 ? (currentIndex / (stops.length - 1)) * 100 : 0

  // Handle playback
  useEffect(() => {
    setLocalPlaying(isPlaying)
  }, [isPlaying])

  useEffect(() => {
    if (localPlaying && currentIndex < stops.length - 1) {
      const baseInterval = 2000 // 2 seconds per stop
      const interval = baseInterval / playbackSpeed

      intervalRef.current = setInterval(() => {
        const nextIndex = currentIndex + 1
        if (nextIndex >= stops.length) {
          setLocalPlaying(false)
          onPlayPause?.()
        } else {
          onIndexChange(nextIndex)
        }
      }, interval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [localPlaying, currentIndex, stops.length, playbackSpeed, onIndexChange, onPlayPause])

  const handlePlayPause = () => {
    const newPlaying = !localPlaying
    setLocalPlaying(newPlaying)
    onPlayPause?.()
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < stops.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }

  const handleSliderChange = (value: number[]) => {
    onIndexChange(value[0])
  }

  const getSignificanceColor = (significance?: string) => {
    switch (significance) {
      case 'critical':
        return 'text-red-500'
      case 'notable':
        return 'text-orange-500'
      default:
        return 'text-blue-500'
    }
  }

  const getSignificanceBg = (significance?: string) => {
    switch (significance) {
      case 'critical':
        return 'bg-red-500/20'
      case 'notable':
        return 'bg-orange-500/20'
      default:
        return 'bg-blue-500/20'
    }
  }

  if (!currentStop) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Compact Timeline Bar */}
      <div className="glass-panel rounded-lg overflow-hidden">
        {/* Main Control Bar */}
        <div className="p-4 flex items-center gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-8 w-8 rounded-lg hover:bg-muted transition-smooth"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition-smooth"
            >
              {localPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === stops.length - 1}
              className="h-8 w-8 rounded-lg hover:bg-muted transition-smooth"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Stop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-caption font-medium">
                {currentStop.time} • Day {currentStop.day}
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${getSignificanceColor(currentStop.significance)}`} />
            </div>
            <div className="text-sm font-medium text-foreground truncate">
              {currentStop.name}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-caption">
              {currentIndex + 1} / {stops.length}
            </div>

            {/* Speed Control */}
            <Select
              value={playbackSpeed.toString()}
              onValueChange={(value) => onSpeedChange?.(parseFloat(value))}
            >
              <SelectTrigger className="h-8 w-20 rounded-lg glass-control border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel rounded-lg">
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="4">4x</SelectItem>
              </SelectContent>
            </Select>

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 rounded-lg hover:bg-muted transition-smooth"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Slider
              value={[currentIndex]}
              min={0}
              max={stops.length - 1}
              step={1}
              onValueChange={handleSliderChange}
              className="cursor-pointer"
            />
            {/* Progress bar background */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-muted rounded-full -z-10" />
          </div>

          {/* Timeline markers */}
          <div className="flex justify-between mt-2">
            {stops.map((stop, index) => (
              <button
                key={stop.id}
                onClick={() => onIndexChange(index)}
                className={`w-2 h-2 rounded-full transition-smooth ${
                  index === currentIndex
                    ? `${getSignificanceBg(stop.significance)} scale-125`
                    : 'bg-muted hover:bg-muted-foreground/30'
                }`}
                title={`${stop.name} - ${stop.time}`}
              />
            ))}
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* All Stops List */}
                <div className="space-y-2">
                  <div className="text-caption font-medium flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Journey Timeline
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {stops.map((stop, index) => (
                      <button
                        key={stop.id}
                        onClick={() => onIndexChange(index)}
                        className={`w-full text-left p-2 rounded-lg transition-smooth ${
                          index === currentIndex
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${getSignificanceColor(stop.significance)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {stop.name}
                            </div>
                            <div className="text-caption">
                              {stop.time} • Day {stop.day}
                            </div>
                          </div>
                          {stop.significance === 'critical' && (
                            <Zap className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
