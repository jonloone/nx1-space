'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export type Layer = 'operations' | 'optimizer' | 'opportunities'
export type OperationsMode = 'utilization' | 'profit' | 'revenue'
export type OptimizerMode = 'coverage' | 'capacity' | 'feasibility'
export type OpportunitiesMode = 'market' | 'competition' | 'expansion'

interface ThreeLayerNavigationProps {
  onLayerChange: (layer: Layer) => void
  onModeChange: (mode: OperationsMode | OptimizerMode | OpportunitiesMode) => void
  currentLayer: Layer
  currentMode: string
  modelAccuracy?: number
}

const ThreeLayerNavigation: React.FC<ThreeLayerNavigationProps> = ({
  onLayerChange,
  onModeChange,
  currentLayer,
  currentMode,
  modelAccuracy = 0.72
}) => {
  const layers = [
    {
      id: 'operations' as Layer,
      label: 'Operations',
      icon: 'fa-chart-line',
      description: 'Current Performance',
      modes: [
        { id: 'utilization', label: 'Utilization', icon: 'fa-percentage' },
        { id: 'profit', label: 'Profit', icon: 'fa-dollar-sign' },
        { id: 'revenue', label: 'Revenue', icon: 'fa-coins' }
      ]
    },
    {
      id: 'optimizer' as Layer,
      label: 'Optimizer',
      icon: 'fa-calculator',
      description: 'Technical Validation',
      modes: [
        { id: 'coverage', label: 'Coverage', icon: 'fa-satellite-dish' },
        { id: 'capacity', label: 'Capacity', icon: 'fa-server' },
        { id: 'feasibility', label: 'Feasibility', icon: 'fa-check-circle' }
      ]
    },
    {
      id: 'opportunities' as Layer,
      label: 'Opportunities',
      icon: 'fa-lightbulb',
      description: 'Enterprise Intelligence',
      modes: [
        { id: 'market', label: 'Data Centers', icon: 'fa-server' },
        { id: 'competition', label: 'Telecom', icon: 'fa-network-wired' },
        { id: 'expansion', label: 'Financial', icon: 'fa-building' }
      ]
    }
  ]

  const currentLayerData = layers.find(l => l.id === currentLayer)

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      {/* Main Layer Navigation */}
      <div className="flex items-center justify-center mb-4">
        <div className="bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 
                      shadow-2xl overflow-hidden">
          <div className="flex">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onLayerChange(layer.id)}
                className={`relative px-8 py-4 transition-all duration-300 ${
                  currentLayer === layer.id
                    ? 'bg-blue-500/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {currentLayer === layer.id && (
                  <motion.div
                    layoutId="activeLayer"
                    className="absolute inset-0 bg-blue-500/20 border-t-2 border-blue-500"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative flex flex-col items-center gap-2">
                  <i className={`fas ${layer.icon} text-xl`} />
                  <span className="text-sm font-semibold">{layer.label}</span>
                  <span className="text-xs opacity-60">{layer.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Mode Navigation */}
      {currentLayerData && (
        <div className="flex justify-center mb-6">
          <div className="bg-black/80 backdrop-blur-lg rounded-lg border border-white/10 px-2 py-1">
            <div className="flex gap-1">
              {currentLayerData.modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onModeChange(mode.id as any)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    currentMode === mode.id
                      ? 'bg-white/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <i className={`fas ${mode.icon} text-xs`} />
                  <span className="text-sm">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Bar */}
      <div className="absolute left-4 bottom-4 bg-black/80 backdrop-blur-lg rounded-lg 
                    border border-white/10 px-4 py-2 text-white">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <i className="fas fa-satellite text-blue-400" />
            <span className="text-gray-400">Satellites:</span>
            <span className="font-bold">9,370</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-ship text-cyan-400" />
            <span className="text-gray-400">Vessels:</span>
            <span className="font-bold">500+</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-anchor text-green-400" />
            <span className="text-gray-400">Ports:</span>
            <span className="font-bold">101</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400">Live Data</span>
          </div>
        </div>
      </div>

      {/* Accuracy Badge */}
      <div className="absolute right-4 bottom-4 bg-black/80 backdrop-blur-lg rounded-lg 
                    border border-white/10 px-4 py-2 text-white">
        <div className="flex items-center gap-2 text-xs">
          <i className={`fas fa-check-circle ${modelAccuracy >= 0.70 ? 'text-green-400' : 'text-yellow-400'}`} />
          <span className="text-gray-400">Model Accuracy:</span>
          <span className={`font-bold ${modelAccuracy >= 0.70 ? 'text-green-400' : 'text-yellow-400'}`}>
            {(modelAccuracy * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default ThreeLayerNavigation