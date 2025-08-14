'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface LayerConfig {
  satellites: boolean
  orbits: boolean
  stations: boolean
  coverage: boolean
  enterprise: boolean
  heatmap: boolean
}

interface LayerToggleProps {
  layers: LayerConfig
  onToggle: (key: keyof LayerConfig) => void
  currentView: string
}

const LayerToggle: React.FC<LayerToggleProps> = ({ layers, onToggle, currentView }) => {
  const availableLayers = {
    operations: [
      { key: 'stations' as keyof LayerConfig, label: 'Stations', icon: 'fa-satellite-dish' },
      { key: 'heatmap' as keyof LayerConfig, label: 'Performance', icon: 'fa-fire' }
    ],
    optimizer: [
      { key: 'stations' as keyof LayerConfig, label: 'Stations', icon: 'fa-satellite-dish' },
      { key: 'satellites' as keyof LayerConfig, label: 'Satellites', icon: 'fa-satellite' },
      { key: 'orbits' as keyof LayerConfig, label: 'Orbits', icon: 'fa-circle-notch' },
      { key: 'coverage' as keyof LayerConfig, label: 'Coverage', icon: 'fa-broadcast-tower' }
    ],
    opportunities: [
      { key: 'stations' as keyof LayerConfig, label: 'Stations', icon: 'fa-satellite-dish' },
      { key: 'enterprise' as keyof LayerConfig, label: 'Enterprise', icon: 'fa-building' },
      { key: 'heatmap' as keyof LayerConfig, label: 'Opportunity', icon: 'fa-fire' }
    ]
  }

  const visibleLayers = availableLayers[currentView as keyof typeof availableLayers] || []

  return (
    <div className="absolute top-4 left-4 z-50">
      <div className="bg-black/80 backdrop-blur-xl rounded-lg border border-white/10 p-3">
        <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">
          Layers
        </div>
        <div className="space-y-1">
          {visibleLayers.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-md
                transition-all duration-200 text-xs font-medium
                ${layers[key] 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }
              `}
            >
              <i className={`fas ${icon} w-4`} />
              <span>{label}</span>
              <div className="ml-auto">
                {layers[key] ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                  />
                ) : (
                  <div className="w-2 h-2 bg-gray-600 rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* 3D Globe hint for optimizer view */}
        {currentView === 'optimizer' && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
            <div className="text-xs text-blue-400">
              <i className="fas fa-globe mr-1" />
              Zoom out for 3D Globe view
            </div>
          </div>
        )}
        
        {/* Active layer count warning */}
        {Object.values(layers).filter(Boolean).length > 3 && (
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <div className="text-xs text-amber-400">
              <i className="fas fa-exclamation-triangle mr-1" />
              Performance Warning: {Object.values(layers).filter(Boolean).length} layers active
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LayerToggle