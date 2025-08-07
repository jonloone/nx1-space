'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapSelection } from '@/lib/hooks/useMapSelection'

interface NetworkStats {
  activeStations: number
  avgUtilization: number
  totalRevenue: number
  satellitesTracked: number
  globalCoverage: number
  activeLinks: number
}

// Mock stats - in production, this would come from an API
const useNetworkStats = (): NetworkStats => {
  return {
    activeStations: 89,
    avgUtilization: 72,
    totalRevenue: 45.2,
    satellitesTracked: 1247,
    globalCoverage: 87,
    activeLinks: 342
  }
}

const QuickStats: React.FC = () => {
  const { viewContext } = useMapSelection()
  const stats = useNetworkStats()
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Get relevant stats based on current view
  const viewStats = useMemo(() => {
    if (viewContext.view === 'stations') {
      return {
        primary: { label: 'Active Stations', value: stats.activeStations, icon: 'fa-satellite-dish' },
        secondary: { label: 'Avg Utilization', value: `${stats.avgUtilization}%`, icon: 'fa-chart-line' },
        tertiary: { label: 'Total Revenue', value: `$${stats.totalRevenue}M`, icon: 'fa-dollar-sign' }
      }
    } else {
      return {
        primary: { label: 'Satellites Tracked', value: stats.satellitesTracked.toLocaleString(), icon: 'fa-satellite' },
        secondary: { label: 'Coverage', value: `${stats.globalCoverage}%`, icon: 'fa-globe' },
        tertiary: { label: 'Active Links', value: stats.activeLinks, icon: 'fa-signal' }
      }
    }
  }, [viewContext.view, stats])
  
  // If completely hidden, show a small restore button
  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 
                 p-2 bg-black/40 backdrop-blur-xl border border-white/10 
                 rounded-lg hover:bg-white/5 transition-all"
        title="Show Stats"
      >
        <i className="fas fa-chart-bar text-white text-sm" />
      </motion.button>
    )
  }
  
  // Minimized state - just show icons
  if (isMinimized) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 
                      rounded-full px-3 py-2 flex items-center gap-3">
          {Object.values(viewStats).map((stat, index) => (
            <button
              key={index}
              onClick={() => setIsMinimized(false)}
              className="text-white/70 hover:text-white transition-colors"
              title={`${stat.label}: ${stat.value}`}
            >
              <i className={`fas ${stat.icon} text-xs`} />
            </button>
          ))}
          <button
            onClick={() => setIsMinimized(false)}
            className="text-gray-400 hover:text-white transition-colors ml-1"
            title="Expand"
          >
            <i className="fas fa-chevron-down text-xs" />
          </button>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20"
    >
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 
                    rounded-full px-6 py-2 flex items-center gap-6 relative group">
        {Object.values(viewStats).map((stat, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center gap-2">
              <i className={`fas ${stat.icon} text-sm text-white/70`} />
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium">{stat.value}</span>
                <span className="text-gray-500 text-[10px] uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            </div>
            {index < 2 && <div className="w-px h-8 bg-white/10" />}
          </React.Fragment>
        ))}
        
        {/* Controls - show on hover */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex items-center gap-1 
                      opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 bg-black/40 backdrop-blur border border-white/10 
                     rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <i className="fas fa-chevron-up text-xs" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 bg-black/40 backdrop-blur border border-white/10 
                     rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Hide"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default QuickStats