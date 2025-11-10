'use client'

/**
 * Intelligence Preset Switcher
 * Allows users to quickly switch between pre-configured multi-INT views
 */

import React, { useState } from 'react'
import { INTELLIGENCE_PRESETS, type IntelligencePreset } from '@/lib/config/intelligencePresets'

interface IntelligencePresetSwitcherProps {
  onPresetChange?: (preset: IntelligencePreset) => void
  currentPresetId?: string
}

export function IntelligencePresetSwitcher({
  onPresetChange,
  currentPresetId = 'full-spectrum'
}: IntelligencePresetSwitcherProps) {
  const [selectedPreset, setSelectedPreset] = useState(currentPresetId)
  const [isExpanded, setIsExpanded] = useState(false)

  const presets = Object.values(INTELLIGENCE_PRESETS)
  const currentPreset = INTELLIGENCE_PRESETS[selectedPreset.toUpperCase().replace(/-/g, '_')]

  const handlePresetSelect = (presetId: string) => {
    const preset = INTELLIGENCE_PRESETS[presetId.toUpperCase().replace(/-/g, '_')]
    if (preset) {
      setSelectedPreset(presetId)
      onPresetChange?.(preset)
      setIsExpanded(false)
    }
  }

  const getCategoryColor = (category: IntelligencePreset['category']) => {
    const colors = {
      'multi-int': 'bg-purple-500',
      'sigint': 'bg-blue-500',
      'geoint': 'bg-green-500',
      'osint': 'bg-orange-500',
      'temporal': 'bg-red-500'
    }
    return colors[category]
  }

  const getCategoryLabel = (category: IntelligencePreset['category']) => {
    const labels = {
      'multi-int': 'Multi-INT',
      'sigint': 'SIGINT',
      'geoint': 'GEOINT',
      'osint': 'OSINT',
      'temporal': 'Temporal'
    }
    return labels[category]
  }

  return (
    <div className="relative">
      {/* Current Preset Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <span className="text-2xl">{currentPreset?.icon}</span>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {currentPreset?.name}
            </span>
            <span className={`px-1.5 py-0.5 text-xs font-semibold text-white rounded ${getCategoryColor(currentPreset?.category)}`}>
              {getCategoryLabel(currentPreset?.category)}
            </span>
          </div>
          <span className="text-xs text-gray-400">Intelligence View</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Preset Dropdown */}
      {isExpanded && (
        <div className="absolute top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-[600px] overflow-y-auto">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Intelligence View Presets</h3>
            <p className="text-xs text-gray-400 mt-1">
              Pre-configured layer combinations for different analysis workflows
            </p>
          </div>

          <div className="p-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors ${
                  selectedPreset === preset.id ? 'bg-gray-800 ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {preset.name}
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs font-semibold text-white rounded ${getCategoryColor(preset.category)}`}>
                        {getCategoryLabel(preset.category)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {preset.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {preset.intelFocus.domains.map((domain) => (
                        <span
                          key={domain}
                          className="px-2 py-0.5 text-xs font-medium bg-gray-700 text-gray-300 rounded"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="text-xs text-gray-400">
              <span className="font-semibold">Primary Focus:</span> {currentPreset?.intelFocus.primary}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              <span className="font-semibold">Active Layers:</span>{' '}
              {Object.entries(currentPreset?.layers || {}).filter(([_, config]) => config.enabled).length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
