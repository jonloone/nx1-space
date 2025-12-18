'use client'

/**
 * QuickInfoPanel - Right Slide-In Context Panel
 *
 * Appears when a vessel or entity is clicked on the map.
 * Provides quick access to key information and actions.
 *
 * Features:
 * - Slide-in animation from right
 * - Glassmorphism design
 * - Vessel/entity details
 * - Quick actions
 * - Link to full analysis
 */

import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Ship,
  Navigation,
  Clock,
  AlertTriangle,
  MapPin,
  Anchor,
  Activity,
  ExternalLink,
  Route,
  History,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VesselMapData } from '@/components/map/MapboxVesselLayer'

// ============================================================================
// Types
// ============================================================================

export interface VesselDetails extends VesselMapData {
  flag?: string
  imo?: string
  callSign?: string
  destination?: string
  eta?: Date
  riskScore?: number
}

export interface QuickInfoPanelProps {
  data: VesselDetails | null
  isOpen: boolean
  onClose: () => void
  onShowDetails?: (vessel: VesselDetails) => void
  onShowTrack?: (vessel: VesselDetails) => void
  onShowAnomalies?: (vessel: VesselDetails) => void
  className?: string
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_LABELS: Record<string, string> = {
  moving: 'Underway',
  active: 'Active',
  anchored: 'At Anchor',
  moored: 'Moored',
  idle: 'Idle',
  inactive: 'Inactive',
  offline: 'Offline',
  unknown: 'Unknown'
}

const STATUS_COLORS: Record<string, string> = {
  moving: 'vessel-status-moving',
  active: 'vessel-status-moving',
  anchored: 'vessel-status-anchored',
  moored: 'vessel-status-moored',
  idle: 'vessel-status-idle',
  inactive: 'vessel-status-offline',
  offline: 'vessel-status-offline',
  unknown: 'vessel-status-offline'
}

function formatCoordinate(value: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W')
  return `${Math.abs(value).toFixed(4)}° ${direction}`
}

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)} kn`
}

function formatHeading(heading: number): string {
  return `${Math.round(heading)}°`
}

// ============================================================================
// Component
// ============================================================================

export default function QuickInfoPanel({
  data,
  isOpen,
  onClose,
  onShowDetails,
  onShowTrack,
  onShowAnomalies,
  className
}: QuickInfoPanelProps) {
  const handleShowDetails = useCallback(() => {
    if (data && onShowDetails) {
      onShowDetails(data)
    }
  }, [data, onShowDetails])

  const handleShowTrack = useCallback(() => {
    if (data && onShowTrack) {
      onShowTrack(data)
    }
  }, [data, onShowTrack])

  const handleShowAnomalies = useCallback(() => {
    if (data && onShowAnomalies) {
      onShowAnomalies(data)
    }
  }, [data, onShowAnomalies])

  return (
    <AnimatePresence>
      {isOpen && data && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 bottom-0 z-50 w-full md:w-[380px]',
              'glass-info-panel overflow-hidden flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <Ship className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-100 truncate">
                    {data.name || 'Unknown Vessel'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    MMSI: {data.mmsi}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  STATUS_COLORS[data.status] || STATUS_COLORS.unknown
                )}>
                  {STATUS_LABELS[data.status] || 'Unknown'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                  {data.vesselType || 'Unknown Type'}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* Speed */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wide">Speed</span>
                  </div>
                  <p className="text-xl font-semibold text-slate-200">
                    {formatSpeed(data.speed)}
                  </p>
                </div>

                {/* Heading */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wide">Heading</span>
                  </div>
                  <p className="text-xl font-semibold text-slate-200">
                    {formatHeading(data.heading)}
                  </p>
                </div>

                {/* Position */}
                <div className="col-span-2 p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs uppercase tracking-wide">Position</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    {formatCoordinate(data.lat, 'lat')}, {formatCoordinate(data.lng, 'lng')}
                  </p>
                </div>
              </div>

              {/* Anomaly Alert */}
              {data.anomalyCount && data.anomalyCount > 0 && (
                <div
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer
                           hover:bg-amber-500/15 transition-colors"
                  onClick={handleShowAnomalies}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-400">
                        {data.anomalyCount} Anomal{data.anomalyCount === 1 ? 'y' : 'ies'} Detected
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {(data.destination || data.flag || data.imo) && (
                <div className="space-y-2">
                  <h3 className="text-xs text-slate-500 uppercase tracking-wide">Details</h3>
                  <div className="space-y-2">
                    {data.destination && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">Destination</span>
                        <span className="text-sm text-slate-200">{data.destination}</span>
                      </div>
                    )}
                    {data.flag && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">Flag</span>
                        <span className="text-sm text-slate-200">{data.flag}</span>
                      </div>
                    )}
                    {data.imo && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">IMO</span>
                        <span className="text-sm text-slate-200">{data.imo}</span>
                      </div>
                    )}
                    {data.callSign && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">Call Sign</span>
                        <span className="text-sm text-slate-200">{data.callSign}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-700/50 space-y-2">
              <button
                onClick={handleShowTrack}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-slate-700/50 hover:bg-slate-700/70 text-slate-200
                         transition-colors text-sm font-medium"
              >
                <Route className="w-4 h-4" />
                Show Track History
              </button>
              <button
                onClick={handleShowDetails}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-blue-600 hover:bg-blue-500 text-white
                         transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Full Analysis
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
