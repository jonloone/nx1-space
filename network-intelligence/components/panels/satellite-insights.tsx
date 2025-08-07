'use client'

import React from 'react'

const SatelliteInsights: React.FC<{ filter: string }> = ({ filter }) => {
  const getInsights = () => {
    switch(filter) {
      case 'coverage':
        return [
          { label: 'Global Coverage', value: '87%', trend: 'up' },
          { label: 'Blind Spots', value: '23 regions', trend: 'down' },
          { label: 'Overlap Areas', value: '156', trend: 'stable' }
        ]
      case 'orbits':
        return [
          { label: 'LEO Satellites', value: '842', trend: 'up' },
          { label: 'GEO Satellites', value: '405', trend: 'stable' },
          { label: 'Orbit Conflicts', value: '3', trend: 'down' }
        ]
      case 'capacity':
        return [
          { label: 'Total Capacity', value: '2.4 Tbps', trend: 'up' },
          { label: 'Utilization', value: '68%', trend: 'up' },
          { label: 'Available', value: '768 Gbps', trend: 'stable' }
        ]
      default:
        return []
    }
  }
  
  const insights = getInsights()
  
  return (
    <div className="p-4">
      <h3 className="text-white text-sm font-medium mb-3">Satellite Insights</h3>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">{insight.label}</span>
              <TrendIndicator trend={insight.trend} />
            </div>
            <div className="text-white text-sm font-medium mt-1">{insight.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TrendIndicator: React.FC<{ trend: string }> = ({ trend }) => {
  if (trend === 'up') {
    return <span className="text-green-400 text-xs">↑</span>
  }
  if (trend === 'down') {
    return <span className="text-red-400 text-xs">↓</span>
  }
  return <span className="text-gray-400 text-xs">→</span>
}

export default SatelliteInsights