'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationProps {
  onViewChange: (view: 'groundStations' | 'satellites') => void
  onModeChange: (mode: 'operations' | 'opportunities' | 'coverage' | 'orbits') => void
  onLayerToggle?: (layer: string, enabled: boolean) => void
}

const ProfessionalNavigation: React.FC<NavigationProps> = ({
  onViewChange,
  onModeChange,
  onLayerToggle
}) => {
  const [activeView, setActiveView] = useState<'groundStations' | 'satellites'>('groundStations')
  const [activeMode, setActiveMode] = useState<'operations' | 'opportunities' | 'coverage' | 'orbits'>('operations')
  
  // Two main navigation views
  const navigationViews = {
    groundStations: {
      icon: 'satellite-dish',
      label: 'Ground Stations',
      subModes: [
        { id: 'operations', label: 'Operations', description: 'Monitor station performance' },
        { id: 'opportunities', label: 'Opportunities', description: 'Maritime & expansion analysis' }
      ]
    },
    satellites: {
      icon: 'satellite',
      label: 'Satellites',
      subModes: [
        { id: 'coverage', label: 'Coverage', description: 'Footprint analysis' },
        { id: 'orbits', label: 'Orbits', description: 'Orbital mechanics' }
      ]
    }
  } as const
  
  const handleViewChange = (viewId: 'groundStations' | 'satellites') => {
    setActiveView(viewId)
    onViewChange(viewId)
    
    // Set default mode for the view
    const defaultMode = viewId === 'groundStations' ? 'operations' : 'coverage'
    setActiveMode(defaultMode)
    onModeChange(defaultMode)
  }
  
  const handleModeChange = (mode: 'operations' | 'opportunities' | 'coverage' | 'orbits') => {
    setActiveMode(mode)
    onModeChange(mode)
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex flex-col items-center pb-4 gap-3">
        
        {/* Sub-mode buttons (appear above main navigation) */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-auto"
          >
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl px-2 py-1.5">
              <div className="flex items-center gap-2">
                {navigationViews[activeView].subModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id as any)}
                    className={`
                      relative px-4 py-2 rounded-lg text-xs font-medium
                      transition-all duration-200 group
                      ${activeMode === mode.id
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Active mode indicator */}
                    {activeMode === mode.id && (
                      <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 
                                 via-purple-500/20 to-blue-500/20 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    {/* Mode content */}
                    <div className="relative flex flex-col items-center">
                      <span className="font-semibold">{mode.label}</span>
                      <span className="text-[9px] text-gray-500 hidden group-hover:block absolute -bottom-4">
                        {mode.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Main view navigation */}
        <div className="pointer-events-auto">
          <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-2">
            <div className="flex items-center gap-2">
              
              {/* View toggles */}
              {Object.entries(navigationViews).map(([viewId, view]) => (
                <button
                  key={viewId}
                  onClick={() => handleViewChange(viewId as 'groundStations' | 'satellites')}
                  className={`
                    relative px-6 py-3 rounded-xl transition-all duration-200
                    min-w-[160px] group
                    ${activeView === viewId
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {/* Active background */}
                  {activeView === viewId && (
                    <motion.div
                      layoutId="activeView"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 
                               via-purple-500/20 to-blue-500/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  {/* View content */}
                  <div className="relative flex flex-col items-center gap-1">
                    {/* FontAwesome icon placeholder */}
                    <div className="w-6 h-6 flex items-center justify-center">
                      <i className={`fas fa-${view.icon} text-lg`}></i>
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-wider">
                      {view.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalNavigation