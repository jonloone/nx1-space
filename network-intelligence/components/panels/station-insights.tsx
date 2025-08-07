'use client'

import React from 'react'

const StationInsights: React.FC<{ filter: string }> = ({ filter }) => {
  const getInsights = () => {
    switch(filter) {
      case 'utilization':
        return [
          { label: 'Low Utilization', value: '12 stations', trend: 'down' },
          { label: 'Peak Hours', value: '14:00-18:00', trend: 'stable' },
          { label: 'Avg Capacity', value: '72%', trend: 'up' }
        ]
      case 'profit':
        return [
          { label: 'Top Performer', value: 'SES Betzdorf', trend: 'up' },
          { label: 'Monthly Revenue', value: '$45.2M', trend: 'up' },
          { label: 'Profit Margin', value: '23%', trend: 'stable' }
        ]
      case 'opportunities':
        return [
          { label: 'New Opportunities', value: '8 zones', trend: 'up' },
          { label: 'Total Value', value: '$127M', trend: 'up' },
          { label: 'Success Rate', value: '67%', trend: 'stable' }
        ]
      case 'maritime':
        return [
          { label: 'Vessels Covered', value: '342', trend: 'up' },
          { label: 'Route Coverage', value: '78%', trend: 'stable' },
          { label: 'Maritime Revenue', value: '$8.3M', trend: 'up' }
        ]
      default:
        return []
    }
  }
  
  const insights = getInsights()
  
  return (
    <div className="p-4">
      <h3 className="text-white text-sm font-medium mb-3">Key Insights</h3>
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

export default StationInsights