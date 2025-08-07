'use client'

import React, { useMemo } from 'react'
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
  
  // Get relevant stats based on current view
  const viewStats = useMemo(() => {
    if (viewContext.view === 'stations') {
      return {
        primary: { label: 'Active Stations', value: stats.activeStations, icon: '📡' },
        secondary: { label: 'Avg Utilization', value: `${stats.avgUtilization}%`, icon: '📊' },
        tertiary: { label: 'Total Revenue', value: `$${stats.totalRevenue}M`, icon: '💰' }
      }
    } else {
      return {
        primary: { label: 'Satellites Tracked', value: stats.satellitesTracked.toLocaleString(), icon: '🛰️' },
        secondary: { label: 'Coverage', value: `${stats.globalCoverage}%`, icon: '🌍' },
        tertiary: { label: 'Active Links', value: stats.activeLinks, icon: '📶' }
      }
    }
  }, [viewContext.view, stats])
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20">
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 
                    rounded-full px-6 py-2 flex items-center gap-6">
        {Object.values(viewStats).map((stat, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center gap-2">
              <span className="text-sm">{stat.icon}</span>
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
      </div>
    </div>
  )
}

export default QuickStats