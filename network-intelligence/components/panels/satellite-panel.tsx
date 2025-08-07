'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useMapSelection, type Satellite } from '@/lib/hooks/useMapSelection'

const SatellitePanel: React.FC<{ satellite: Satellite }> = ({ satellite }) => {
  const { clearSelection } = useMapSelection()
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white text-lg font-light">{satellite.name}</h3>
            <p className="text-gray-400 text-xs mt-1">{satellite.type} • {satellite.orbit}</p>
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
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Coverage</h4>
            <div className="text-2xl font-bold text-white">{satellite.coverage}%</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Capacity</h4>
            <div className="text-xl font-semibold text-blue-400">{satellite.capacity} Gbps</div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Status</h4>
            <div className={`text-lg capitalize ${
              satellite.status === 'active' ? 'text-green-400' : 
              satellite.status === 'idle' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {satellite.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SatellitePanel