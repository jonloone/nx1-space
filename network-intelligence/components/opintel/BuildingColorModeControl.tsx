'use client'

/**
 * Building Color Mode Control
 * UI for switching between different building coloring modes
 */

import React, { useState } from 'react'
import type { BuildingColorMode } from '@/lib/services/buildingColorModeService'

interface BuildingColorModeControlProps {
  onModeChange?: (mode: BuildingColorMode) => void
  currentMode?: BuildingColorMode
}

export function BuildingColorModeControl({
  onModeChange,
  currentMode = 'poi-category'
}: BuildingColorModeControlProps) {
  const [selectedMode, setSelectedMode] = useState<BuildingColorMode>(currentMode)
  const [isExpanded, setIsExpanded] = useState(false)

  const modes: Array<{
    id: BuildingColorMode
    name: string
    description: string
    icon: string
    preview: string
  }> = [
    {
      id: 'poi-category',
      name: 'POI Category',
      description: 'Color buildings by nearby place types (restaurants, hospitals, retail, etc.)',
      icon: '📍',
      preview: 'linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 50%, #F7DC6F 100%)'
    },
    {
      id: 'alert-proximity',
      name: 'Alert Proximity',
      description: 'Color buildings by investigation alert proximity and priority level',
      icon: '🚨',
      preview: 'linear-gradient(90deg, #DC143C 0%, #FF6347 50%, #FFA500 100%)'
    },
    {
      id: 'attributes',
      name: 'Building Attributes',
      description: 'Color by building properties (height, class, floors, age)',
      icon: '🏗️',
      preview: 'linear-gradient(90deg, #E74C3C 0%, #3498DB 50%, #9B59B6 100%)'
    },
    {
      id: 'intelligence',
      name: 'Intelligence Significance',
      description: 'Color by multi-int relevance score (0-100 heat scale)',
      icon: '🎯',
      preview: 'linear-gradient(90deg, #EEEEEE 0%, #FFB74D 50%, #B71C1C 100%)'
    }
  ]

  const currentModeData = modes.find(m => m.id === selectedMode) || modes[0]

  const handleModeChange = (mode: BuildingColorMode) => {
    setSelectedMode(mode)
    onModeChange?.(mode)
    setIsExpanded(false)
  }

  return (
    <div className="relative">
      {/* Current Mode Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <span className="text-xl">{currentModeData.icon}</span>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium text-white">
            {currentModeData.name}
          </span>
          <span className="text-xs text-gray-400">Building Colors</span>
        </div>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mode Selector Dropdown */}
      {isExpanded && (
        <div className="absolute top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Building Color Modes</h3>
            <p className="text-xs text-gray-400 mt-1">
              Choose how buildings are colored on the map
            </p>
          </div>

          <div className="p-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors ${
                  selectedMode === mode.id ? 'bg-gray-800 ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{mode.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {mode.name}
                      </span>
                      {selectedMode === mode.id && (
                        <span className="text-xs text-blue-400">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {mode.description}
                    </p>
                    {/* Color Preview */}
                    <div
                      className="h-2 rounded-full"
                      style={{ background: mode.preview }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="text-xs text-gray-400">
              <span className="font-semibold">Tip:</span> Switch modes to highlight different intelligence aspects
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
