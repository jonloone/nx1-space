'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Ship, Truck, Shield, MapPin, X, Navigation } from 'lucide-react'
import { getGERSDemoService, GERSPlace, INDUSTRY_SCENARIOS } from '@/lib/services/gersDemoService'

interface GERSSearchPanelProps {
  onResultsChange?: (results: GERSPlace[]) => void
  onPlaceSelect?: (place: GERSPlace) => void
  defaultCenter?: [number, number]
}

export default function GERSSearchPanel({
  onResultsChange,
  onPlaceSelect,
  defaultCenter = [-118.2437, 34.0522] // LA
}: GERSSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedScenario, setSelectedScenario] = useState<'maritime' | 'logistics' | 'defense' | null>(null)
  const [results, setResults] = useState<GERSPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchCenter, setSearchCenter] = useState<[number, number]>(defaultCenter)
  const [radius, setRadius] = useState(25000) // 25km default

  const gersService = getGERSDemoService()

  const scenarioIcons = {
    maritime: Ship,
    logistics: Truck,
    defense: Shield
  }

  const handleScenarioSelect = async (scenario: 'maritime' | 'logistics' | 'defense') => {
    setSelectedScenario(scenario)
    setIsLoading(true)

    try {
      const places = await gersService.searchByScenario(scenario, searchCenter, radius)
      setResults(places)
      if (onResultsChange) {
        onResultsChange(places)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextSearch = async () => {
    if (!searchText.trim()) return

    setIsLoading(true)
    try {
      const places = await gersService.search({
        text: searchText,
        near: searchCenter,
        radius,
        limit: 50
      })
      setResults(places)
      if (onResultsChange) {
        onResultsChange(places)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceClick = (place: GERSPlace) => {
    if (onPlaceSelect) {
      onPlaceSelect(place)
    }
  }

  const clearSearch = () => {
    setSelectedScenario(null)
    setResults([])
    setSearchText('')
    if (onResultsChange) {
      onResultsChange([])
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-24 right-6 z-50 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="bg-[#176BF8] hover:bg-[#0D4DB8] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 transition-colors">
          <Search className="w-5 h-5" />
          <span className="font-semibold">GERs Search</span>
        </div>
      </motion.button>

      {/* Search Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-24 right-6 z-40 w-96"
          >
            <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-[#176BF8] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-white" />
                  <h3 className="text-white font-semibold">Global Entity Search</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/90 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Industry Scenarios */}
                <div>
                  <label className="text-xs font-semibold text-[#525252] uppercase tracking-wide mb-2 block">
                    Industry Scenarios
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['maritime', 'logistics', 'defense'] as const).map((scenario) => {
                      const Icon = scenarioIcons[scenario]
                      const config = INDUSTRY_SCENARIOS[scenario]
                      const isSelected = selectedScenario === scenario

                      return (
                        <button
                          key={scenario}
                          onClick={() => handleScenarioSelect(scenario)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-[#176BF8] bg-[#DBEAFE]'
                              : 'border-[#E5E5E5] hover:border-[#176BF8] hover:bg-[#F5F5F5]'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 mx-auto mb-1 ${
                              isSelected ? 'text-[#176BF8]' : 'text-[#525252]'
                            }`}
                          />
                          <div className={`text-xs font-medium ${
                            isSelected ? 'text-[#176BF8]' : 'text-[#171717]'
                          }`}>
                            {config.name.split(' ')[0]}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Text Search */}
                <div>
                  <label className="text-xs font-semibold text-[#525252] uppercase tracking-wide mb-2 block">
                    Search by Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                      placeholder="e.g., Port of Los Angeles, Walmart..."
                      className="w-full px-4 py-2 pr-10 border border-[#E5E5E5] rounded-lg text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#176BF8] focus:border-transparent"
                    />
                    <button
                      onClick={handleTextSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#176BF8] transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Radius Control */}
                <div>
                  <label className="text-xs font-semibold text-[#525252] uppercase tracking-wide mb-2 block">
                    Search Radius: <span className="text-[#176BF8]">{radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-[#176BF8]"
                  />
                </div>

                {/* Clear Button */}
                {(selectedScenario || results.length > 0) && (
                  <button
                    onClick={clearSearch}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm text-[#525252] hover:bg-[#F5F5F5] hover:border-[#A3A3A3] transition-colors font-medium"
                  >
                    Clear Search
                  </button>
                )}

                {/* Loading */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-[#176BF8] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Results */}
                {!isLoading && results.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#525252] uppercase tracking-wide">
                        Results ({results.length})
                      </label>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.map((place) => (
                        <motion.div
                          key={place.gersId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 border border-[#E5E5E5] rounded-lg hover:border-[#176BF8] hover:bg-[#DBEAFE] cursor-pointer transition-all"
                          onClick={() => handlePlaceClick(place)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-2xl">{gersService.getCategoryIcon(place.categories[0])}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-[#171717] truncate">
                                {place.name}
                              </h4>
                              <p className="text-xs text-[#737373] mt-1 capitalize">
                                {place.categories[0].replace(/_/g, ' ')}
                              </p>
                              {place.distance !== undefined && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Navigation className="w-3 h-3 text-[#176BF8]" />
                                  <span className="text-xs font-semibold text-[#176BF8]">
                                    {gersService.formatDistance(place.distance)} {gersService.formatBearing(place.bearing || 0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Info */}
                          {place.properties && Object.keys(place.properties).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#E5E5E5] space-y-1">
                              {Object.entries(place.properties).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between text-xs">
                                  <span className="text-[#737373] capitalize">{key.replace(/_/g, ' ')}</span>
                                  <span className="text-[#171717] font-semibold">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!isLoading && selectedScenario && results.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-[#A3A3A3]" />
                    <p className="text-sm text-[#525252] font-medium">No places found in this area</p>
                    <p className="text-xs text-[#737373] mt-1">Try increasing the search radius</p>
                  </div>
                )}

                {/* Help Text */}
                {!selectedScenario && results.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto mb-3 text-[#A3A3A3]" />
                    <p className="text-sm font-semibold text-[#171717] mb-2">Search for Places</p>
                    <p className="text-xs text-[#737373] leading-relaxed">
                      Select an industry scenario or search by name to find relevant locations on the map
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
