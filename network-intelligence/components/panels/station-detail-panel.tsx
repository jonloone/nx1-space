'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useMapSelection, type Station } from '@/lib/hooks/useMapSelection'
import { GlassPanel } from '@/components/ui/glass-components'

const StationDetailPanel: React.FC<{ station: Station }> = ({ station }) => {
  const { viewContext, clearSelection } = useMapSelection()
  
  // Dynamic content based on active filter
  const getAnalyticsContent = () => {
    switch(viewContext.filter) {
      case 'utilization':
        return <UtilizationAnalytics station={station} />
      case 'profit':
        return <ProfitAnalytics station={station} />
      case 'opportunities':
        return <OpportunityAnalytics station={station} />
      case 'maritime':
        return <MaritimeAnalytics station={station} />
      default:
        return <GeneralAnalytics station={station} />
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white text-lg font-light">{station.name}</h3>
            <p className="text-gray-400 text-xs mt-1">{station.location}</p>
          </div>
          <button
            onClick={() => clearSelection()}
            className="p-1.5 text-gray-400 hover:text-white transition-colors 
                     rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Status */}
        <div className="flex items-center gap-2 mt-3">
          <StatusBadge status={station.status} />
          <Badge label={`${station.utilization}% utilized`} />
          <Badge 
            label={`$${station.revenue}M/mo`} 
            variant={station.margin > 0 ? 'success' : 'danger'} 
          />
        </div>
      </div>
      
      {/* Dynamic Analytics Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {getAnalyticsContent()}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 
                       text-blue-400 rounded-xl backdrop-blur-xl 
                       border border-blue-500/30 transition-all duration-200
                       text-sm font-medium">
          View Detailed Report
        </button>
        <button className="w-full py-2 bg-white/5 hover:bg-white/10 
                       text-white rounded-xl backdrop-blur-xl 
                       border border-white/10 transition-all duration-200
                       text-sm font-medium">
          Compare with Peers
        </button>
      </div>
    </div>
  )
}

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    idle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    maintenance: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || colors.idle}`}>
      {status}
    </span>
  )
}

// Badge component
const Badge: React.FC<{ label: string; variant?: 'default' | 'success' | 'danger' }> = ({ 
  label, 
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-white/5 text-gray-300 border-white/10',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20'
  }
  
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${variants[variant]}`}>
      {label}
    </span>
  )
}

// Utilization-specific analytics
const UtilizationAnalytics: React.FC<{ station: Station }> = ({ station }) => {
  return (
    <div className="space-y-4">
      {/* Utilization Gauge */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
          Current Utilization
        </h4>
        <div className="relative h-32">
          <GaugeChart 
            value={station.utilization} 
            max={100}
            thresholds={[40, 60, 80]}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-gray-500">Target: 75%</span>
          <span className={station.utilization >= 75 ? 'text-green-400' : 'text-yellow-400'}>
            {station.utilization >= 75 ? 'On Target' : 'Below Target'}
          </span>
        </div>
      </div>
      
      {/* Utilization Trend */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
          7-Day Trend
        </h4>
        <SparklineChart 
          data={station.utilizationHistory || [65, 68, 72, 70, 75, 78, station.utilization]} 
          height={60}
          color={station.utilizationTrend > 0 ? '#22c55e' : '#ef4444'}
        />
      </div>
      
      {/* Service Breakdown */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
          Service Mix
        </h4>
        <div className="space-y-2">
          {station.services.map(service => (
            <div key={service.type} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{service.type}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${service.percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 text-xs w-10 text-right">
                  {service.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Simple gauge chart component
const GaugeChart: React.FC<{ 
  value: number
  max: number
  thresholds: number[]
}> = ({ value, max, thresholds }) => {
  const percentage = (value / max) * 100
  const rotation = (percentage * 180) / 100 - 90
  
  const getColor = () => {
    if (value < thresholds[0]) return '#ef4444' // red
    if (value < thresholds[1]) return '#f59e0b' // orange
    if (value < thresholds[2]) return '#eab308' // yellow
    return '#22c55e' // green
  }
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg className="transform -rotate-90 w-32 h-32">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-white/10"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(percentage * 351.86) / 100} 351.86`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{value}%</div>
          <div className="text-xs text-gray-400">Utilization</div>
        </div>
      </div>
    </div>
  )
}

// Simple sparkline chart component
const SparklineChart: React.FC<{
  data: number[]
  height: number
  color: string
}> = ({ data, height, color }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((max - value) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`${points} 100,${height} 0,${height}`}
        fill={`${color}20`}
        stroke="none"
      />
    </svg>
  )
}

// Placeholder components for other analytics views
const ProfitAnalytics: React.FC<{ station: Station }> = ({ station }) => (
  <div className="text-gray-400 text-sm">Profit analytics for {station.name}</div>
)

const OpportunityAnalytics: React.FC<{ station: Station }> = ({ station }) => (
  <div className="text-gray-400 text-sm">Opportunity analytics for {station.name}</div>
)

const MaritimeAnalytics: React.FC<{ station: Station }> = ({ station }) => (
  <div className="text-gray-400 text-sm">Maritime analytics for {station.name}</div>
)

const GeneralAnalytics: React.FC<{ station: Station }> = ({ station }) => (
  <div className="text-gray-400 text-sm">General analytics for {station.name}</div>
)

export default StationDetailPanel