'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { Search, Sparkles, MapPin, TrendingUp, AlertCircle, X } from 'lucide-react'

interface GERSearchPanelProps {
  stations: any[]
  onSearchResults?: (results: any[]) => void
  onStationSelect?: (station: any) => void
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export default function GERSearchPanel({
  stations,
  onSearchResults,
  onStationSelect,
  position = 'top-left'
}: GERSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<any>(null)
  const [stationInsight, setStationInsight] = useState<string>('')

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // GSAP animations on mount
  useEffect(() => {
    if (panelRef.current && isOpen) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.9, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      )
    }
  }, [isOpen])

  // Animate results
  useEffect(() => {
    if (resultsRef.current && results) {
      const items = resultsRef.current.querySelectorAll('.result-item')
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [results])

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      // Call the AI search API
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          stations: stations.slice(0, 50) // Send sample for context
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data)

      // Filter stations based on results
      if (onSearchResults && data.stations) {
        const matchedStations = stations.filter(s =>
          data.stations.some((name: string) =>
            s.name.toLowerCase().includes(name.toLowerCase())
          )
        )
        onSearchResults(matchedStations)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      console.error('GER Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStationClick = async (station: any) => {
    setSelectedStation(station)
    setStationInsight('')

    // Get AI insight for the station
    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station })
      })

      if (response.ok) {
        const data = await response.json()
        setStationInsight(data.insight)
      }
    } catch (err) {
      console.error('Failed to get station insight:', err)
    }

    if (onStationSelect) {
      onStationSelect(station)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <>
      {/* Floating search button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses[position]} z-50 group`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium hidden group-hover:inline-block pr-2">AI Search</span>
        </div>
      </motion.button>

      {/* Search panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed ${positionClasses[position]} z-40 mt-20`}
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">GER Intelligence Search</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about ground stations..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Results */}
              {results && (
                <div ref={resultsRef} className="space-y-4">
                  {/* Reasoning */}
                  {results.reasoning && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm italic">{results.reasoning}</p>
                    </div>
                  )}

                  {/* Matched stations */}
                  {results.stations && results.stations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-gray-400 text-xs uppercase tracking-wide">Matching Stations</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.stations.map((stationName: string, idx: number) => {
                          const station = stations.find(s =>
                            s.name.toLowerCase().includes(stationName.toLowerCase())
                          )
                          if (!station) return null

                          return (
                            <motion.div
                              key={idx}
                              className="result-item p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-400/30"
                              onClick={() => handleStationClick(station)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                    <h5 className="text-white font-medium text-sm">{station.name}</h5>
                                  </div>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {station.operator} • {station.country || station.location}
                                  </p>
                                </div>
                                {station.utilization && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400">{station.utilization.toFixed(0)}%</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Filters applied */}
                  {results.filters && Object.keys(results.filters).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-gray-400 text-xs uppercase tracking-wide">Search Filters</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(results.filters).map(([key, value]) =>
                          value ? (
                            <span
                              key={key}
                              className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs"
                            >
                              {key}: {String(value)}
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected station insight */}
              {selectedStation && stationInsight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg"
                >
                  <h4 className="text-blue-300 font-medium text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Insight: {selectedStation.name}
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{stationInsight}</p>
                </motion.div>
              )}

              {/* Example queries */}
              {!results && !isLoading && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-gray-400 text-xs uppercase tracking-wide">Try asking:</h4>
                  <div className="space-y-1">
                    {[
                      'Show me SES stations in Europe',
                      'Find high utilization stations',
                      'Which stations have low margins?',
                      'Stations operated by AWS'
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(example)}
                        className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white text-xs transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
