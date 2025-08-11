'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationProps {
  onViewChange: (view: 'insights' | 'opportunities') => void
  onMaritimeToggle: (enabled: boolean) => void
  onLayerToggle?: (layer: string, enabled: boolean) => void
}

const StationFocusedNavigation: React.FC<NavigationProps> = ({
  onViewChange,
  onMaritimeToggle,
  onLayerToggle
}) => {
  const [activeView, setActiveView] = useState<'insights' | 'opportunities'>('insights')
  const [maritimeEnabled, setMaritimeEnabled] = useState(true)
  const [expandedLayers, setExpandedLayers] = useState(false)
  
  // View configurations
  const views = {
    insights: {
      id: 'insights',
      icon: '📊',
      label: 'Insights',
      description: 'Utilization & Profitability',
      metrics: ['Utilization', 'Profit Margins', 'Performance']
    },
    opportunities: {
      id: 'opportunities', 
      icon: '🎯',
      label: 'Opportunities',
      description: 'Growth Potential',
      metrics: ['Market Opportunity', 'Expansion Sites', 'Revenue Potential']
    }
  }
  
  const handleViewChange = (viewId: 'insights' | 'opportunities') => {
    setActiveView(viewId)
    onViewChange(viewId)
  }
  
  const handleMaritimeToggle = () => {
    const newState = !maritimeEnabled
    setMaritimeEnabled(newState)
    onMaritimeToggle(newState)
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex flex-col items-center pb-4 gap-3">
        
        {/* Context Layers (Maritime always available) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto"
        >
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2">
            <div className="flex items-center gap-3">
              {/* Maritime Toggle */}
              <button
                onClick={handleMaritimeToggle}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${maritimeEnabled
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className="text-sm">🚢</span>
                <span>Maritime</span>
                {maritimeEnabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  />
                )}
              </button>
              
              {/* Separator */}
              <div className="h-4 w-px bg-white/10" />
              
              {/* Additional Context Layers */}
              <button
                onClick={() => setExpandedLayers(!expandedLayers)}
                className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-xs">Layers</span>
                <motion.div
                  animate={{ rotate: expandedLayers ? 180 : 0 }}
                  className="text-xs"
                >
                  ▼
                </motion.div>
              </button>
            </div>
            
            {/* Expanded Layer Options */}
            <AnimatePresence>
              {expandedLayers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 pt-2 border-t border-white/10"
                >
                  <div className="flex gap-2 flex-wrap">
                    {['Satellites', 'Ports', 'Weather', 'Terrain'].map(layer => (
                      <button
                        key={layer}
                        onClick={() => onLayerToggle?.(layer.toLowerCase(), true)}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white 
                                 hover:bg-white/5 rounded transition-all"
                      >
                        {layer}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Main View Toggle - Ground Station Focused */}
        <div className="pointer-events-auto">
          <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-2">
            <div className="flex items-center gap-2">
              {/* Ground Station Badge */}
              <div className="px-3 py-2 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📡</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-white">Ground Stations</div>
                    <div className="text-[10px] text-gray-400">Network Analysis</div>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-12 w-px bg-white/10" />
              
              {/* View Options */}
              {Object.values(views).map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id as 'insights' | 'opportunities')}
                  className={`
                    relative px-4 py-2 rounded-xl transition-all duration-200
                    min-w-[140px] group
                    ${activeView === view.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {/* Active background */}
                  {activeView === view.id && (
                    <motion.div
                      layoutId="activeView"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 
                               via-purple-500/20 to-blue-500/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative flex flex-col items-center gap-0.5">
                    <span className="text-lg">{view.icon}</span>
                    <span className="text-xs font-medium">
                      {view.label}
                    </span>
                    <span className="text-[9px] text-gray-500 hidden group-hover:block absolute -bottom-3">
                      {view.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Active View Metrics */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="mt-2 pt-2 border-t border-white/5"
              >
                <div className="flex justify-center gap-4">
                  {views[activeView].metrics.map(metric => (
                    <div key={metric} className="text-[10px] text-gray-500">
                      • {metric}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationFocusedNavigation