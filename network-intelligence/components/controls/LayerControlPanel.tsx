'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface LayerConfig {
  satellites: boolean
  orbits: boolean
  stations: boolean
  coverage: boolean
  enterprise: boolean
  heatmap: boolean
}

interface LayerControlPanelProps {
  layers: LayerConfig
  onToggle: (key: keyof LayerConfig) => void
  currentView: string
}

const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggle,
  currentView
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const layerDefinitions = {
    operations: [
      { id: 'stations' as keyof LayerConfig, icon: 'fa-satellite-dish', label: 'Stations', category: 'infrastructure' },
      { id: 'heatmap' as keyof LayerConfig, icon: 'fa-fire', label: 'Performance', category: 'analysis' }
    ],
    optimizer: [
      { id: 'stations' as keyof LayerConfig, icon: 'fa-satellite-dish', label: 'Stations', category: 'infrastructure' },
      { id: 'satellites' as keyof LayerConfig, icon: 'fa-satellite', label: 'Satellites', category: 'space' },
      { id: 'orbits' as keyof LayerConfig, icon: 'fa-circle-notch', label: 'Orbits', category: 'space' },
      { id: 'coverage' as keyof LayerConfig, icon: 'fa-broadcast-tower', label: 'Coverage', category: 'space' }
    ],
    opportunities: [
      { id: 'stations' as keyof LayerConfig, icon: 'fa-satellite-dish', label: 'Stations', category: 'infrastructure' },
      { id: 'enterprise' as keyof LayerConfig, icon: 'fa-building', label: 'Enterprise', category: 'markets' },
      { id: 'heatmap' as keyof LayerConfig, icon: 'fa-fire', label: 'Opportunity', category: 'analysis' }
    ]
  }
  
  const visibleLayers = layerDefinitions[currentView as keyof typeof layerDefinitions] || []
  const activeLayerCount = visibleLayers.filter(layer => layers[layer.id]).length

  return (
    <div className="fixed right-4 top-20 z-30">
      {/* Collapsed State - Icon Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg p-3
                     hover:bg-white/5 transition-all duration-200 relative"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="text-white"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
              />
            </svg>
            
            {/* Active layer count badge */}
            {activeLayerCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 
                            flex items-center justify-center font-medium">
                {activeLayerCount}
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded State - Layer Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-64"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-medium">Layers</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Layer List */}
            <div className="space-y-2">
              {visibleLayers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => onToggle(layer.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg
                    transition-all duration-200
                    ${layers[layer.id]
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <i className={`fas ${layer.icon} text-xs w-4`}></i>
                    <span className="text-xs font-medium">{layer.label}</span>
                  </div>
                  
                  {/* Toggle indicator */}
                  <div className={`
                    w-8 h-4 rounded-full transition-all duration-200
                    ${layers[layer.id] ? 'bg-blue-500' : 'bg-gray-700'}
                  `}>
                    <div className={`
                      w-3 h-3 rounded-full bg-white transition-all duration-200 mt-0.5
                      ${layers[layer.id] ? 'ml-4' : 'ml-0.5'}
                    `} />
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  visibleLayers.forEach(layer => {
                    if (!layers[layer.id]) {
                      onToggle(layer.id)
                    }
                  })
                }}
                className="flex-1 text-xs text-gray-400 hover:text-white transition-colors py-1"
              >
                Show All
              </button>
              <button
                onClick={() => {
                  visibleLayers.forEach(layer => {
                    if (layers[layer.id]) {
                      onToggle(layer.id)
                    }
                  })
                }}
                className="flex-1 text-xs text-gray-400 hover:text-white transition-colors py-1"
              >
                Hide All
              </button>
            </div>
            
            {/* View indicator */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500">
                Current view: <span className="text-gray-400 capitalize">{currentView}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LayerControlPanel