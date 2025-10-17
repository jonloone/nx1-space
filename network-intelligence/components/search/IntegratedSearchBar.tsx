'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Eye } from 'lucide-react'
import { MapPin, Buildings, City, MapTrifold, Globe } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
import { getGERSDemoService, GERSPlace, LevelOfDetail, LOD_CONFIG } from '@/lib/services/gersDemoService'
import { useMapStore } from '@/lib/stores'

interface IntegratedSearchBarProps {
  onPlaceSelect?: (place: GERSPlace) => void
  placeholder?: string
  className?: string
}

// Icon mapping for Phosphor icons
const LOD_ICONS = {
  landmark: MapPin,
  place: Buildings,
  city: City,
  state: MapTrifold,
  country: Globe
}

export default function IntegratedSearchBar({
  onPlaceSelect,
  placeholder: customPlaceholder,
  className = ''
}: IntegratedSearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GERSPlace[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fuse, setFuse] = useState<Fuse<GERSPlace> | null>(null)
  const [selectedLoD, setSelectedLoD] = useState<LevelOfDetail[]>([])

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const gersService = getGERSDemoService()

  // Get places from mapStore (viewport-aware) + GERs demo data
  const { visiblePlaces, allCachedPlaces, map } = useMapStore()

  // Dynamic placeholder based on zoom level
  const placeholder = React.useMemo(() => {
    if (customPlaceholder) return customPlaceholder

    if (!map) return 'Search places...'

    const zoom = map.getZoom()

    if (zoom < 6) {
      return 'Search countries, states, major cities...'
    } else if (zoom < 9) {
      return 'Search cities, airports, landmarks...'
    } else if (zoom < 12) {
      return 'Search hospitals, universities, parks...'
    } else if (zoom < 14) {
      return 'Search hotels, museums, services...'
    } else {
      return 'Search restaurants, cafes, shops...'
    }
  }, [map, customPlaceholder])

  // Combine visible, cached, AND GERs demo places for comprehensive search
  const searchablePlaces = React.useMemo(() => {
    const visibleIds = new Set(visiblePlaces.map(p => p.gersId))
    const cachedIds = new Set(allCachedPlaces.map(p => p.gersId))

    // Get ALL demo places from GERs service (includes cities, states, countries)
    const gersPlaces = gersService.getAllPlaces()

    // Mark visible places and combine with cached + GERs demo data
    const marked = [
      ...visiblePlaces.map(p => ({ ...p, isVisible: true })),
      ...allCachedPlaces
        .filter(p => !visibleIds.has(p.gersId))
        .map(p => ({ ...p, isVisible: false })),
      ...gersPlaces
        .filter(p => !visibleIds.has(p.gersId) && !cachedIds.has(p.gersId))
        .map(p => ({ ...p, isVisible: false }))
    ]

    return marked
  }, [visiblePlaces, allCachedPlaces, gersService])

  // Initialize Fuse.js with searchable places
  useEffect(() => {
    if (searchablePlaces.length === 0) return

    const fuseInstance = new Fuse(searchablePlaces, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'categories', weight: 0.2 },
        { name: 'address.city', weight: 0.05 },
        { name: 'address.street', weight: 0.05 }
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true
    })

    setFuse(fuseInstance)
  }, [searchablePlaces])

  // Handle search with fuzzy matching
  useEffect(() => {
    if (!fuse || !query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    // Perform fuzzy search
    let searchResults = fuse.search(query, { limit: 30 })
    let places = searchResults.map(result => result.item as GERSPlace & { isVisible?: boolean })

    // Sort by: 1) visibility (visible first), 2) LoD (landmark first), 3) score
    const lodOrder: LevelOfDetail[] = ['landmark', 'place', 'city', 'state', 'country']
    places.sort((a, b) => {
      // Prioritize visible places
      if (a.isVisible && !b.isVisible) return -1
      if (!a.isVisible && b.isVisible) return 1

      // Then sort by LoD
      const aIndex = lodOrder.indexOf(a.levelOfDetail)
      const bIndex = lodOrder.indexOf(b.levelOfDetail)
      return aIndex - bIndex
    })

    setResults(places.slice(0, 15))
    setIsOpen(places.length > 0)
    setSelectedIndex(0)
  }, [query, fuse])

  // Toggle LoD filter
  const toggleLoD = (lod: LevelOfDetail) => {
    setSelectedLoD(prev =>
      prev.includes(lod)
        ? prev.filter(l => l !== lod)
        : [...prev, lod]
    )
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handlePlaceSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Handle place selection
  const handlePlaceSelect = (place: GERSPlace) => {
    if (onPlaceSelect) {
      onPlaceSelect(place)
    }
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle clear
  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Group results by LoD
  const groupedResults = results.reduce((acc, place) => {
    if (!acc[place.levelOfDetail]) {
      acc[place.levelOfDetail] = []
    }
    acc[place.levelOfDetail].push(place)
    return acc
  }, {} as Record<LevelOfDetail, GERSPlace[]>)

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-10 bg-white border border-[#E5E5E5] rounded-lg text-sm text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#176BF8] focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown - Opens upward since search is at bottom */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#E5E5E5] rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="max-h-[500px] overflow-y-auto">
              {/* Results Header */}
              <div className="px-4 py-2 border-b border-[#E5E5E5] bg-[#F5F5F5]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#525252] uppercase tracking-wide">
                    {results.length} {results.length === 1 ? 'Result' : 'Results'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#737373]">
                    <Eye size={12} className="text-[#10B981]" />
                    <span>
                      {results.filter(r => (r as GERSPlace & { isVisible?: boolean }).isVisible).length} in viewport
                    </span>
                  </div>
                </div>
              </div>

              {/* Grouped Results */}
              <div className="py-1">
                {(Object.keys(LOD_CONFIG) as LevelOfDetail[]).map((lod) => {
                  const lodResults = groupedResults[lod]
                  if (!lodResults || lodResults.length === 0) return null

                  const config = LOD_CONFIG[lod]
                  const Icon = LOD_ICONS[lod]

                  return (
                    <div key={lod}>
                      {/* LoD Category Header */}
                      <div
                        className="px-4 py-2 flex items-center gap-2"
                        style={{ backgroundColor: `${config.color}10` }}
                      >
                        <Icon size={16} weight="bold" style={{ color: config.color }} />
                        <span
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: config.color }}
                        >
                          {config.label} ({lodResults.length})
                        </span>
                      </div>

                      {/* Places in this LoD */}
                      {lodResults.map((place, index) => {
                        const globalIndex = results.indexOf(place)
                        const isSelected = globalIndex === selectedIndex
                        const icon = gersService.getCategoryIcon(place.categories[0])
                        const placeWithVisibility = place as GERSPlace & { isVisible?: boolean }
                        const isVisible = placeWithVisibility.isVisible

                        return (
                          <motion.button
                            key={place.gersId}
                            onClick={() => handlePlaceSelect(place)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full px-4 py-3 flex items-start gap-3 transition-colors ${
                              isSelected
                                ? 'bg-[#DBEAFE]'
                                : 'hover:bg-[#F5F5F5]'
                            }`}
                            style={{
                              borderLeft: isSelected ? `4px solid ${config.color}` : '4px solid transparent'
                            }}
                            whileHover={{ x: 2 }}
                          >
                            {/* Icon */}
                            <div className="text-2xl shrink-0 mt-0.5">{icon}</div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 text-left">
                              {/* Name with visibility badge */}
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm text-[#171717] truncate">
                                  {place.name}
                                </div>
                                {isVisible && (
                                  <div className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-[#10B981] bg-opacity-10 rounded text-[10px] font-medium text-[#10B981]">
                                    <Eye size={10} />
                                    <span>In View</span>
                                  </div>
                                )}
                              </div>

                              {/* Category */}
                              <div className="text-xs text-[#737373] mt-0.5 capitalize">
                                {place.categories[0].replace(/_/g, ' ')}
                              </div>

                              {/* Address */}
                              {place.address && (
                                <div className="text-xs text-[#737373] truncate mt-0.5">
                                  {[place.address.city, place.address.state].filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>

                            {/* LoD Badge */}
                            <div className="shrink-0 self-start">
                              <Icon size={16} style={{ color: config.color }} weight="fill" />
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2 border-t border-[#E5E5E5] bg-[#F5F5F5]">
              <div className="flex items-center justify-between text-xs text-[#737373]">
                <span>Use ↑↓ to navigate</span>
                <span>Press Enter to select</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
