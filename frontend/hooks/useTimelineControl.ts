'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { temporalDataService, ActivityHeatmapData, VesselEncounter } from '@/lib/services/temporalDataService';

interface TimelineState {
  startDate: Date;
  endDate: Date;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  activityData: ActivityHeatmapData[];
  encounters: VesselEncounter[];
  isLoading: boolean;
}

interface UseTimelineControlReturn extends TimelineState {
  onTimeChange: (time: number) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  getCurrentVessels: () => any[];
  getEncountersAtTime: (time: number) => VesselEncounter[];
  refreshData: () => void;
}

export const useTimelineControl = (initialTimeRange?: { start: Date; end: Date }): UseTimelineControlReturn => {
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

  const [state, setState] = useState<TimelineState>(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      startDate: initialTimeRange?.start || weekAgo,
      endDate: initialTimeRange?.end || now,
      currentTime: initialTimeRange?.start?.getTime() || weekAgo.getTime(),
      isPlaying: false,
      playbackSpeed: 1,
      activityData: [],
      encounters: [],
      isLoading: true
    };
  });

  // Load initial data
  const loadTimelineData = useCallback(async (startDate: Date, endDate: Date) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Generate activity heatmap data
      const heatmapData = temporalDataService.generateTimelineHeatmap(
        { start: startDate, end: endDate },
        100 // 100 time bins
      );
      
      // Detect encounters
      const encounters = temporalDataService.detectEncounters({
        start: startDate,
        end: endDate
      });
      
      setState(prev => ({
        ...prev,
        activityData: heatmapData,
        encounters,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load timeline data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadTimelineData(state.startDate, state.endDate);
  }, [loadTimelineData, state.startDate, state.endDate]);

  // Animation loop for playback
  const animate = useCallback(() => {
    if (!state.isPlaying) return;
    
    const now = Date.now();
    const deltaTime = (now - lastUpdateRef.current) * state.playbackSpeed;
    lastUpdateRef.current = now;
    
    setState(prev => {
      const newTime = prev.currentTime + deltaTime;
      const maxTime = prev.endDate.getTime();
      
      // Loop back to start if we exceed the end
      if (newTime > maxTime) {
        return { ...prev, currentTime: prev.startDate.getTime() };
      }
      
      return { ...prev, currentTime: newTime };
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [state.isPlaying, state.playbackSpeed]);

  // Start/stop animation
  useEffect(() => {
    if (state.isPlaying) {
      lastUpdateRef.current = Date.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, animate]);

  // Control functions
  const onTimeChange = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const onPlayToggle = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const onSpeedChange = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const onDateRangeChange = useCallback((start: Date, end: Date) => {
    setState(prev => ({
      ...prev,
      startDate: start,
      endDate: end,
      currentTime: start.getTime(), // Reset to start
      isPlaying: false // Stop playback during range change
    }));
  }, []);

  const getCurrentVessels = useCallback(() => {
    return temporalDataService.getVesselsAtTime(new Date(state.currentTime));
  }, [state.currentTime]);

  const getEncountersAtTime = useCallback((time: number) => {
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    return state.encounters.filter(encounter => 
      Math.abs(encounter.timestamp - time) <= timeWindow
    );
  }, [state.encounters]);

  const refreshData = useCallback(() => {
    loadTimelineData(state.startDate, state.endDate);
  }, [loadTimelineData, state.startDate, state.endDate]);

  return {
    ...state,
    onTimeChange,
    onPlayToggle,
    onSpeedChange,
    onDateRangeChange,
    getCurrentVessels,
    getEncountersAtTime,
    refreshData
  };
};