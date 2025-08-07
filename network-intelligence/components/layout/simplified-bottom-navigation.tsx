'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapSelection } from '@/lib/hooks/useMapSelection'

const SimplifiedBottomNavigation: React.FC = () => {
  const { viewContext, setViewContext } = useMapSelection()
  const [activeView, setActiveView] = useState<'stations' | 'satellites'>(viewContext.view)
  const [activeFilter, setActiveFilter] = useState(viewContext.filter)
  
  // Main views configuration
  const views = {
    stations: {
      id: 'stations',
      icon: '📡',
      label: 'Ground Stations',
      filters: [
        { id: 'utilization', label: 'Utilization', icon: '📊' },
        { id: 'profit', label: 'Profit', icon: '💰' },
        { id: 'opportunities', label: 'Opportunities', icon: '🎯' },
        { id: 'maritime', label: 'Maritime', icon: '🚢' }
      ]
    },
    satellites: {
      id: 'satellites',
      icon: '🛰️',
      label: 'Satellites',
      filters: [
        { id: 'coverage', label: 'Coverage', icon: '🗺️' },
        { id: 'orbits', label: 'Orbits', icon: '🌍' },
        { id: 'capacity', label: 'Capacity', icon: '📶' }
      ]
    }
  }
  
  const handleViewChange = (viewId: 'stations' | 'satellites') => {
    setActiveView(viewId)
    
    // Reset filter to first option when switching views
    const firstFilter = views[viewId].filters[0].id
    setActiveFilter(firstFilter)
    
    // Update global state
    setViewContext({ view: viewId, filter: firstFilter })
  }
  
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId)
    setViewContext({ view: activeView, filter: filterId })
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex flex-col items-center pb-4 gap-2">
        
        {/* Filter Pills - Appear above main navigation */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-auto"
          >
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl px-1 py-1">
              <div className="flex items-center gap-0.5">
                {views[activeView].filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`
                      relative px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200 flex items-center gap-1.5
                      ${activeFilter === filter.id
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <span className="text-sm">{filter.icon}</span>
                    <span>{filter.label}</span>
                    
                    {/* Active indicator dot */}
                    {activeFilter === filter.id && (
                      <motion.div
                        layoutId="activeFilter"
                        className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 
                                 w-1 h-1 bg-blue-500 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Main View Toggle */}
        <div className="pointer-events-auto">
          <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5">
            <div className="flex items-center gap-1">
              {Object.values(views).map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id as 'stations' | 'satellites')}
                  className={`
                    relative px-5 py-2.5 rounded-xl transition-all duration-200
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
                  <div className="relative flex flex-col items-center gap-1">
                    <span className="text-xl">{view.icon}</span>
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

export default SimplifiedBottomNavigation