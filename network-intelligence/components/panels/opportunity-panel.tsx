'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useMapSelection, type Hexagon } from '@/lib/hooks/useMapSelection'

const OpportunityPanel: React.FC<{ hexagon: Hexagon }> = ({ hexagon }) => {
  const { clearSelection } = useMapSelection()
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white text-lg font-light">Opportunity Zone</h3>
            <p className="text-gray-400 text-xs mt-1">
              {hexagon.coordinates[1].toFixed(2)}°, {hexagon.coordinates[0].toFixed(2)}°
            </p>
          </div>
          <button
            onClick={() => clearSelection()}
            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Score</h4>
            <div className="text-2xl font-bold text-white">{hexagon.score}/100</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Revenue Potential</h4>
            <div className="text-xl font-semibold text-green-400">
              ${(hexagon.revenue / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Land Coverage</h4>
            <div className="text-lg text-white">{hexagon.landCoverage}%</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Risk Level</h4>
            <div className="text-lg text-yellow-400 capitalize">{hexagon.riskLevel}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpportunityPanel