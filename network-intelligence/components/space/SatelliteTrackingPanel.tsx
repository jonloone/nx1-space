'use client'

/**
 * Satellite Tracking Panel
 * UI for selecting and tracking satellites in real-time
 */

import { useState, useEffect } from 'react'
import { useSatelliteTrackingStore } from '@/lib/stores/satelliteTrackingStore'
import { PRESET_SATELLITES, type PresetSatelliteKey } from '@/lib/services/tleDataService'
import {
  Satellite,
  Play,
  Pause,
  X,
  Plus,
  Search,
  Info,
  Globe,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'

interface SatelliteTrackingPanelProps {
  className?: string
}

export function SatelliteTrackingPanel({ className = '' }: SatelliteTrackingPanelProps) {
  const {
    satellites,
    selectedSatellite,
    isTracking,
    updateInterval,
    isLoadingSatellite,
    error,
    addSatellite,
    addSatelliteByName,
    removeSatellite,
    selectSatellite,
    startTracking,
    stopTracking,
    setUpdateInterval
  } = useSatelliteTrackingStore()

  const [isExpanded, setIsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPresets, setShowPresets] = useState(true)

  // Auto-start tracking when first satellite is added
  useEffect(() => {
    if (satellites.length > 0 && !isTracking) {
      startTracking()
    }
  }, [satellites.length, isTracking, startTracking])

  const handleAddPreset = async (presetKey: PresetSatelliteKey) => {
    const preset = PRESET_SATELLITES[presetKey]
    await addSatellite(preset.catalogNumber)
  }

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await addSatelliteByName(searchQuery)
      setSearchQuery('')
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <div className={`fixed top-20 right-6 z-50 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-gray-800/95 transition-colors"
        >
          <Satellite className="w-5 h-5 text-blue-500" />
          <div className="text-left">
            <div className="text-sm font-medium text-white">
              {satellites.length} Satellite{satellites.length !== 1 ? 's' : ''}
            </div>
            {isTracking && (
              <div className="text-xs text-green-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Tracking
              </div>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed top-20 right-6 z-50 w-96 ${className}`}>
      <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Satellite className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-semibold text-white">Satellite Tracking</h3>
              <p className="text-xs text-gray-400">{satellites.length} active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tracking controls */}
            {isTracking ? (
              <button
                onClick={stopTracking}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                title="Pause tracking"
              >
                <Pause className="w-4 h-4 text-gray-300" />
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                title="Start tracking"
                disabled={satellites.length === 0}
              >
                <Play className="w-4 h-4 text-green-400" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Add Satellite Section */}
        <div className="p-4 border-b border-gray-800">
          {/* Search */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search satellite name..."
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoadingSatellite}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center gap-2"
            >
              {isLoadingSatellite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Preset Satellites */}
          <div>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-gray-400 hover:text-gray-300 mb-2 flex items-center gap-1"
            >
              Quick Add
              {showPresets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showPresets && (
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRESET_SATELLITES) as PresetSatelliteKey[]).slice(0, 6).map(key => {
                  const preset = PRESET_SATELLITES[key]
                  const isAdded = satellites.some(sat => sat.catalogNumber === preset.catalogNumber)

                  return (
                    <button
                      key={key}
                      onClick={() => !isAdded && handleAddPreset(key)}
                      disabled={isAdded || isLoadingSatellite}
                      className={`px-3 py-2 rounded text-xs transition-colors text-left ${
                        isAdded
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                      title={preset.description}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-[10px] text-gray-500">{isAdded ? 'Added' : 'Click to add'}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Tracked Satellites List */}
        <div className="max-h-96 overflow-y-auto">
          {satellites.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Satellite className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No satellites tracked</p>
              <p className="text-xs mt-1">Search or add a preset to start</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {satellites.map(sat => (
                <div
                  key={sat.catalogNumber}
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    selectedSatellite?.catalogNumber === sat.catalogNumber ? 'bg-gray-800/70' : ''
                  }`}
                  onClick={() => selectSatellite(sat.catalogNumber)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{sat.name}</div>
                      <div className="text-xs text-gray-500">#{sat.catalogNumber}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSatellite(sat.catalogNumber)
                      }}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {sat.position && (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Globe className="w-3 h-3" />
                        <span>
                          {sat.position.latitude.toFixed(2)}°, {sat.position.longitude.toFixed(2)}°
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-gray-800/50 px-2 py-1 rounded">
                          <div className="text-gray-500 text-[10px]">Altitude</div>
                          <div className="text-white">{Math.round(sat.position.altitude)} km</div>
                        </div>
                        <div className="bg-gray-800/50 px-2 py-1 rounded">
                          <div className="text-gray-500 text-[10px]">Velocity</div>
                          <div className="text-white">{sat.velocity.toFixed(2)} km/s</div>
                        </div>
                        <div className="bg-gray-800/50 px-2 py-1 rounded">
                          <div className="text-gray-500 text-[10px]">Period</div>
                          <div className="text-white">{Math.round(sat.orbit.period)} min</div>
                        </div>
                        <div className="bg-gray-800/50 px-2 py-1 rounded">
                          <div className="text-gray-500 text-[10px]">Inclination</div>
                          <div className="text-white">{sat.orbit.inclination.toFixed(1)}°</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-[10px] mt-2">
                        Updated {formatTime(sat.lastUpdate)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Update Settings */}
        {satellites.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Update: {updateInterval / 1000}s
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUpdateInterval(1000)}
                  className={`px-2 py-1 text-xs rounded ${
                    updateInterval === 1000
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  1s
                </button>
                <button
                  onClick={() => setUpdateInterval(5000)}
                  className={`px-2 py-1 text-xs rounded ${
                    updateInterval === 5000
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  5s
                </button>
                <button
                  onClick={() => setUpdateInterval(10000)}
                  className={`px-2 py-1 text-xs rounded ${
                    updateInterval === 10000
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  10s
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
