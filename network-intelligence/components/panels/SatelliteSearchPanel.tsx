'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Satellite, ChevronRight, X } from 'lucide-react'

export interface SatelliteInfo {
  id: string
  name: string
  operator: string
  constellation?: string
  type?: 'GEO' | 'MEO' | 'LEO'
  position: [number, number, number]
  noradId?: string
  launchDate?: string
  purpose?: string
}

interface SatelliteSearchPanelProps {
  satellites: SatelliteInfo[]
  selectedSatellite: SatelliteInfo | null
  onSelectSatellite: (satellite: SatelliteInfo) => void
  onClose?: () => void
  visible: boolean
}

const SatelliteSearchPanel: React.FC<SatelliteSearchPanelProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  onClose,
  visible
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(null)

  // Group satellites by constellation
  const constellations = useMemo(() => {
    const groups: Record<string, SatelliteInfo[]> = {}
    
    satellites.forEach(sat => {
      const key = sat.constellation || sat.operator || 'Other'
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(sat)
    })
    
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length) // Sort by number of satellites
      .map(([name, sats]) => ({
        name,
        satellites: sats,
        count: sats.length
      }))
  }, [satellites])

  // Filter satellites based on search and constellation
  const filteredSatellites = useMemo(() => {
    let filtered = satellites
    
    // Filter by constellation
    if (selectedConstellation) {
      filtered = filtered.filter(sat => 
        (sat.constellation || sat.operator || 'Other') === selectedConstellation
      )
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(sat =>
        sat.name.toLowerCase().includes(query) ||
        sat.operator.toLowerCase().includes(query) ||
        (sat.constellation && sat.constellation.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [satellites, searchQuery, selectedConstellation])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: 'spring', damping: 20 }}
        className="absolute right-0 top-0 h-full w-96 bg-black/90 backdrop-blur-xl 
                   border-l border-white/10 overflow-hidden flex flex-col z-40"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Satellite Search</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search satellites by name or operator..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg
                       text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Constellation Filter */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Constellations</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedConstellation(null)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                !selectedConstellation
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All ({satellites.length})
            </button>
            {constellations.slice(0, 5).map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setSelectedConstellation(name)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedConstellation === name
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {name} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="px-6 py-3 bg-white/5 border-b border-white/10">
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-gray-400">Total: </span>
              <span className="text-white font-semibold">{satellites.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Filtered: </span>
              <span className="text-white font-semibold">{filteredSatellites.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Selected: </span>
              <span className="text-blue-400 font-semibold">
                {selectedSatellite ? '1' : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Satellite List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSatellites.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No satellites found matching your criteria
            </div>
          ) : (
            <div className="p-2">
              {filteredSatellites.map((satellite) => (
                <motion.button
                  key={satellite.id}
                  onClick={() => onSelectSatellite(satellite)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-3 mb-2 rounded-lg text-left transition-colors ${
                    selectedSatellite?.id === satellite.id
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">
                        {satellite.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {satellite.operator}
                        {satellite.constellation && satellite.constellation !== satellite.operator && (
                          <span> • {satellite.constellation}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${
                          satellite.type === 'GEO' ? 'bg-green-500/20 text-green-400' :
                          satellite.type === 'MEO' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {satellite.type || 'LEO'}
                        </span>
                        <span className="text-gray-500">
                          Alt: {Math.round((satellite.position[2] || 0) / 1000)} km
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      selectedSatellite?.id === satellite.id
                        ? 'text-blue-400 rotate-90'
                        : 'text-gray-500'
                    }`} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Satellite Details */}
        {selectedSatellite && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-white/10 bg-black/50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-white mb-3">Satellite Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{selectedSatellite.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Operator:</span>
                  <span className="text-white">{selectedSatellite.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{selectedSatellite.type || 'LEO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Altitude:</span>
                  <span className="text-white">
                    {Math.round((selectedSatellite.position[2] || 0) / 1000).toLocaleString()} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latitude:</span>
                  <span className="text-white">
                    {selectedSatellite.position[1].toFixed(2)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Longitude:</span>
                  <span className="text-white">
                    {selectedSatellite.position[0].toFixed(2)}°
                  </span>
                </div>
                {selectedSatellite.noradId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">NORAD ID:</span>
                    <span className="text-white">{selectedSatellite.noradId}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default SatelliteSearchPanel