'use client'

/**
 * Preset Button Component
 * Individual button for intelligence analysis presets
 */

import React from 'react'
import { type IntelligencePreset } from '@/lib/config/intelligencePresets'

interface PresetButtonProps {
  preset: IntelligencePreset
  isActive?: boolean
  onClick: () => void
}

export function PresetButton({ preset, isActive = false, onClick }: PresetButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        w-full h-24 rounded-lg
        transition-all duration-200
        ${isActive
          ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-500'
          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
        }
      `}
      title={preset.description}
    >
      <span className="text-2xl mb-1">{preset.icon}</span>
      <span className="text-xs font-medium text-center px-2 leading-tight">
        {preset.name.replace(' Intelligence', '').replace(' Analysis', '')}
      </span>
    </button>
  )
}
