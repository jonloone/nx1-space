'use client'

/**
 * Space Domain Toolbar
 * Floating toolbar for Space domain operations
 * Contains: Satellite Imagery, Orbit Tracking controls
 */

import { useState } from 'react'
import type mapboxgl from 'mapbox-gl'
import { Satellite, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { SpaceImageryControlPanel } from '@/components/space/SpaceImageryControlPanel'
import { SatelliteTrackingPanel } from '@/components/space/SatelliteTrackingPanel'

interface SpaceDomainToolbarProps {
  map: mapboxgl.Map | null
  isVisible: boolean
  onClose?: () => void
  className?: string
}

type SpaceMode = 'observation' | 'tracking'

export function SpaceDomainToolbar({ map, isVisible, onClose, className = '' }: SpaceDomainToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [mode, setMode] = useState<SpaceMode>('observation')

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-20 right-4 z-32 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      } ${className}`}
    >
      <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2">
                <Satellite className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Space Domain</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                  title="Collapse"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 hover:bg-gray-800 rounded transition-colors w-full flex justify-center"
              title="Expand"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content - Only show when not collapsed */}
        {!isCollapsed && (
          <>
            {/* Mode Tabs */}
            <div className="flex border-b border-gray-800 bg-gray-900/50">
              <button
                onClick={() => setMode('observation')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                  mode === 'observation'
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                Earth Observation
              </button>
              <button
                onClick={() => setMode('tracking')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                  mode === 'tracking'
                    ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                Orbit Tracking
              </button>
            </div>

            {/* Mode Content */}
            <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {mode === 'observation' && (
                <SpaceImageryControlPanel map={map} />
              )}
              {mode === 'tracking' && (
                <SatelliteTrackingPanel />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
