'use client'

/**
 * Space Domain Test Page
 * Demonstrates Phase 1 satellite imagery capabilities + Phase 2 orbital mechanics
 */

import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { SpaceDomainIntegration } from '@/components/space/SpaceDomainIntegration'
import { SatelliteTrackingIntegration } from '@/components/space/SatelliteTrackingIntegration'
import { useSpaceStore } from '@/lib/stores/spaceStore'
import { Satellite, MapPin, Orbit } from 'lucide-react'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

// Test locations with satellite imagery
const TEST_LOCATIONS = [
  { name: 'Washington DC', coords: [-77.0369, 38.9072] as [number, number] },
  { name: 'San Francisco', coords: [-122.4194, 37.7749] as [number, number] },
  { name: 'New York City', coords: [-74.006, 40.7128] as [number, number] },
  { name: 'Los Angeles', coords: [-118.2437, 34.0522] as [number, number] },
  { name: 'Miami', coords: [-80.1918, 25.7617] as [number, number] }
]

type Mode = 'imagery' | 'tracking'

export default function SpaceTestPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mode, setMode] = useState<Mode>('tracking') // Default to Phase 2
  const [selectedLocation, setSelectedLocation] = useState<typeof TEST_LOCATIONS[0] | null>(null)
  const { currentLocation, images } = useSpaceStore()

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🗺️ Initializing Space domain test map...')

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
      pitch: 0,
      bearing: 0
    })

    map.current = mapInstance

    mapInstance.on('load', () => {
      console.log('✅ Map loaded successfully!')
      setIsLoaded(true)
    })

    mapInstance.on('error', (e) => {
      console.error('❌ Map error:', e)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  const handleLocationSelect = (location: typeof TEST_LOCATIONS[0]) => {
    console.log('📍 Selected location:', location.name)
    setSelectedLocation(location)

    // Fly to location
    if (map.current) {
      map.current.flyTo({
        center: location.coords,
        zoom: 12,
        essential: true,
        duration: 2000
      })
    }
  }

  return (
    <div className="h-screen w-full relative">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full bg-slate-900"
      />

      {/* Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-sm text-gray-300 font-medium">Loading Space domain test...</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-6 left-6 z-50">
        <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            {mode === 'imagery' ? (
              <Satellite className="w-6 h-6 text-blue-500" />
            ) : (
              <Orbit className="w-6 h-6 text-purple-500" />
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">
                Space Domain - {mode === 'imagery' ? 'Phase 1' : 'Phase 2'} Test
              </h1>
              <p className="text-xs text-gray-400">
                {mode === 'imagery'
                  ? 'Real Sentinel-2 satellite imagery via AWS STAC API'
                  : 'Real-time satellite tracking with SGP4 orbital mechanics'
                }
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setMode('imagery')}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                mode === 'imagery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Satellite className="w-3 h-3" />
                <span>Imagery</span>
              </div>
            </button>
            <button
              onClick={() => setMode('tracking')}
              className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                mode === 'tracking'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Orbit className="w-3 h-3" />
                <span>Tracking</span>
              </div>
            </button>
          </div>

          {mode === 'imagery' && currentLocation && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Current Location</div>
              <div className="text-sm text-white font-mono">
                {currentLocation[1].toFixed(4)}, {currentLocation[0].toFixed(4)}
              </div>
              <div className="text-xs text-blue-400 mt-1">
                {images.length} images loaded
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Locations Panel (Imagery Mode Only) */}
      {mode === 'imagery' && (
        <div className="absolute top-6 right-6 z-50">
          <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg p-4 w-64">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-300">Test Locations</h2>
            </div>

            <div className="space-y-2">
              {TEST_LOCATIONS.map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleLocationSelect(location)}
                  className={`
                    w-full px-3 py-2 rounded text-left text-sm transition-colors
                    ${selectedLocation?.name === location.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  {location.name}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Click a location to load satellite imagery time-series
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Space Domain Integrations */}
      {isLoaded && map.current && (
        <>
          {/* Phase 1: Satellite Imagery */}
          {mode === 'imagery' && (
            <SpaceDomainIntegration
              map={map.current}
              isActive={selectedLocation !== null}
              initialLocation={selectedLocation?.coords}
              initialLocationName={selectedLocation?.name}
            />
          )}

          {/* Phase 2: Satellite Tracking */}
          {mode === 'tracking' && (
            <SatelliteTrackingIntegration
              map={map.current}
              isActive={true}
              showOrbits={true}
              showLabels={true}
            />
          )}
        </>
      )}

      {/* Instructions */}
      {mode === 'imagery' && !selectedLocation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg px-6 py-4 max-w-lg">
            <h3 className="text-sm font-medium text-white mb-2">Phase 1: Satellite Imagery</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Select a test location from the right panel</li>
              <li>• View 90 days of Sentinel-2 imagery in the timeline</li>
              <li>• Click thumbnails to switch between dates</li>
              <li>• Use opacity slider to blend imagery with base map</li>
              <li>• Try "Compare" mode to detect changes over time</li>
            </ul>
          </div>
        </div>
      )}

      {mode === 'tracking' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg px-6 py-4 max-w-lg">
            <h3 className="text-sm font-medium text-white mb-2">Phase 2: Satellite Tracking</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Search for satellites by name or add presets (ISS, Sentinel-2, etc.)</li>
              <li>• View real-time positions updated via SGP4/SDP4 orbital mechanics</li>
              <li>• See ground tracks showing orbit paths on Earth surface</li>
              <li>• Click satellites on map to select and view orbital details</li>
              <li>• Adjust update interval (1s, 5s, 10s) for performance tuning</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
