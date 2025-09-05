'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  FastForward, 
  Rewind, 
  Calendar,
  Activity,
  Clock,
  BarChart3
} from 'lucide-react';

interface TimelineControllerProps {
  startDate: Date;
  endDate: Date;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTimeChange: (time: number) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  activityData?: ActivityHeatmapData[];
}

interface ActivityHeatmapData {
  timestamp: number;
  vesselCount: number;
  encounterCount: number;
  intensity: number; // 0-1 scale
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8];

export const TimelineController: React.FC<TimelineControllerProps> = ({
  startDate,
  endDate,
  currentTime,
  isPlaying,
  playbackSpeed,
  onTimeChange,
  onPlayToggle,
  onSpeedChange,
  onDateRangeChange,
  activityData = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null);

  const totalDuration = endDate.getTime() - startDate.getTime();
  const progressPercent = ((currentTime - startDate.getTime()) / totalDuration) * 100;

  // Format timestamp for display
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      })
    };
  }, []);

  // Handle timeline scrubbing
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newTime = startDate.getTime() + (totalDuration * percent);
    onTimeChange(newTime);
  }, [startDate, totalDuration, onTimeChange]);

  // Generate activity heatmap segments
  const generateHeatmapSegments = useCallback(() => {
    if (!activityData.length) return [];

    const segments = [];
    const segmentWidth = 100 / Math.max(1, activityData.length);

    activityData.forEach((data, index) => {
      const left = index * segmentWidth;
      const intensity = Math.max(0.1, data.intensity); // Minimum visibility
      const color = `rgba(59, 130, 246, ${intensity})`; // Blue with varying opacity
      
      segments.push(
        <div
          key={data.timestamp}
          className="absolute h-full transition-colors duration-200 hover:brightness-150 cursor-pointer"
          style={{
            left: `${left}%`,
            width: `${segmentWidth}%`,
            backgroundColor: color,
          }}
          onMouseEnter={() => setHoveredTimestamp(data.timestamp)}
          onMouseLeave={() => setHoveredTimestamp(null)}
          onClick={handleTimelineClick}
          title={`${data.vesselCount} vessels, ${data.encounterCount} encounters`}
        />
      );
    });

    return segments;
  }, [activityData, handleTimelineClick]);

  const currentTimeDisplay = formatTime(currentTime);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 min-w-[800px] max-w-4xl"
      >
        {/* Header with current time and controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="text-lg font-mono">
                {currentTimeDisplay.date} {currentTimeDisplay.time}
              </div>
            </div>
            
            {hoveredTimestamp && (
              <div className="text-sm text-gray-400 ml-4">
                Hover: {formatTime(hoveredTimestamp).date} {formatTime(hoveredTimestamp).time}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              title="Date Range"
            >
              <Calendar className="w-4 h-4" />
            </button>
            
            <div className="h-6 w-px bg-white/20 mx-1" />
            
            {/* Activity indicator */}
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </div>
          </div>
        </div>

        {/* Timeline with activity heatmap */}
        <div className="mb-4">
          <div 
            className="relative h-8 bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
            onClick={handleTimelineClick}
          >
            {/* Activity heatmap background */}
            <div className="absolute inset-0">
              {generateHeatmapSegments()}
            </div>

            {/* Progress bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />

            {/* Current time indicator */}
            <div 
              className="absolute top-0 w-0.5 h-full bg-white shadow-lg transition-all duration-200"
              style={{ left: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full border-2 border-blue-500" />
            </div>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>{formatTime(startDate.getTime()).date}</span>
            <span>{formatTime(endDate.getTime()).date}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Speed control */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
                const newIndex = Math.max(0, currentIndex - 1);
                onSpeedChange(SPEED_OPTIONS[newIndex]);
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
              disabled={playbackSpeed <= SPEED_OPTIONS[0]}
            >
              <Rewind className="w-4 h-4" />
            </button>
            
            <div className="text-sm text-white min-w-[3rem] text-center font-mono">
              {playbackSpeed}x
            </div>
            
            <button
              onClick={() => {
                const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
                const newIndex = Math.min(SPEED_OPTIONS.length - 1, currentIndex + 1);
                onSpeedChange(SPEED_OPTIONS[newIndex]);
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
              disabled={playbackSpeed >= SPEED_OPTIONS[SPEED_OPTIONS.length - 1]}
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Play/Pause */}
          <button
            onClick={onPlayToggle}
            className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          {/* Timeline stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {activityData.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>
                    {activityData.reduce((sum, d) => sum + d.vesselCount, 0).toLocaleString()} vessels
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span>
                    {activityData.reduce((sum, d) => sum + d.encounterCount, 0).toLocaleString()} encounters
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date picker (collapsed by default) */}
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={startDate.toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value);
                    onDateRangeChange(newStart, endDate);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={endDate.toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value);
                    onDateRangeChange(startDate, newEnd);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};