/**
 * Satellite Tracking Store
 * Manages real-time satellite position tracking and visualization
 */

import { create } from 'zustand'
import type { TLE } from '../services/tleDataService'
import { getTLEDataService } from '../services/tleDataService'
import { getOrbitalMechanicsService, type SatellitePosition, type PassPrediction, type GroundTrackPoint } from '../services/orbitalMechanicsService'

export interface TrackedSatellite {
  /** NORAD catalog number */
  catalogNumber: string
  /** Satellite name */
  name: string
  /** TLE data */
  tle: TLE
  /** Current position */
  position: SatellitePosition | null
  /** Current velocity (km/s) */
  velocity: number
  /** Orbital elements */
  orbit: {
    period: number // minutes
    apogee: number // km
    perigee: number // km
    inclination: number // degrees
    eccentricity: number
  }
  /** Last update timestamp */
  lastUpdate: Date
  /** Is currently visible on map */
  isVisible: boolean
}

interface SatelliteTrackingStore {
  // State
  satellites: TrackedSatellite[]
  selectedSatellite: TrackedSatellite | null
  isTracking: boolean
  updateInterval: number // milliseconds (default: 5000)
  groundTracks: Map<string, GroundTrackPoint[]> // catalogNumber → ground track
  passPredictions: Map<string, PassPrediction[]> // catalogNumber → passes
  observerLocation: [number, number] | null // [lat, lon] for pass predictions

  // Loading states
  isLoadingSatellite: boolean
  error: string | null

  // Actions
  addSatellite: (catalogNumber: string) => Promise<void>
  addSatelliteByName: (name: string) => Promise<void>
  removeSatellite: (catalogNumber: string) => void
  selectSatellite: (catalogNumber: string | null) => void
  updatePositions: () => void
  generateGroundTrack: (catalogNumber: string, durationMinutes?: number) => void
  predictPasses: (catalogNumber: string, observerLocation: [number, number]) => Promise<void>
  setObserverLocation: (location: [number, number]) => void
  startTracking: () => void
  stopTracking: () => void
  setUpdateInterval: (interval: number) => void
  clearAll: () => void
}

// Update timer reference (stored outside Zustand)
let updateTimer: NodeJS.Timeout | null = null

export const useSatelliteTrackingStore = create<SatelliteTrackingStore>((set, get) => ({
  // Initial state
  satellites: [],
  selectedSatellite: null,
  isTracking: false,
  updateInterval: 5000, // 5 seconds
  groundTracks: new Map(),
  passPredictions: new Map(),
  observerLocation: null,
  isLoadingSatellite: false,
  error: null,

  // Actions
  addSatellite: async (catalogNumber: string) => {
    set({ isLoadingSatellite: true, error: null })

    try {
      console.log(`🛰️ Adding satellite: ${catalogNumber}`)

      // Check if already tracking
      const { satellites } = get()
      if (satellites.some(sat => sat.catalogNumber === catalogNumber)) {
        console.log(`⚠️ Already tracking satellite ${catalogNumber}`)
        set({ isLoadingSatellite: false })
        return
      }

      // Fetch TLE data
      const tleService = getTLEDataService()
      const tle = await tleService.getTLEByCatalogNumber(catalogNumber)

      if (!tle) {
        throw new Error(`Satellite ${catalogNumber} not found`)
      }

      // Calculate initial position
      const orbitService = getOrbitalMechanicsService()
      const state = orbitService.getSatellitePosition(tle, new Date())

      if (!state) {
        throw new Error(`Failed to calculate position for ${catalogNumber}`)
      }

      // Get orbital elements
      const orbitalElements = orbitService.getOrbitalElements(tle)

      // Create tracked satellite
      const trackedSat: TrackedSatellite = {
        catalogNumber: tle.catalogNumber,
        name: tle.name,
        tle,
        position: state.position,
        velocity: state.velocity.speed,
        orbit: {
          period: orbitalElements.period,
          apogee: orbitalElements.apogee,
          perigee: orbitalElements.perigee,
          inclination: orbitalElements.inclination,
          eccentricity: orbitalElements.eccentricity
        },
        lastUpdate: new Date(),
        isVisible: true
      }

      set({
        satellites: [...satellites, trackedSat],
        isLoadingSatellite: false
      })

      console.log(`✓ Added satellite: ${tle.name}`)

      // Generate initial ground track
      get().generateGroundTrack(catalogNumber, orbitalElements.period)

    } catch (error) {
      console.error(`❌ Failed to add satellite ${catalogNumber}:`, error)
      set({
        isLoadingSatellite: false,
        error: error instanceof Error ? error.message : 'Failed to add satellite'
      })
    }
  },

  addSatelliteByName: async (name: string) => {
    set({ isLoadingSatellite: true, error: null })

    try {
      console.log(`🛰️ Searching for satellite: ${name}`)

      const tleService = getTLEDataService()
      const tles = await tleService.getTLEByName(name)

      if (tles.length === 0) {
        throw new Error(`No satellites found matching "${name}"`)
      }

      // Add the first match
      await get().addSatellite(tles[0].catalogNumber)

    } catch (error) {
      console.error(`❌ Failed to add satellite by name "${name}":`, error)
      set({
        isLoadingSatellite: false,
        error: error instanceof Error ? error.message : 'Failed to find satellite'
      })
    }
  },

  removeSatellite: (catalogNumber: string) => {
    const { satellites, selectedSatellite, groundTracks, passPredictions } = get()

    console.log(`🗑️ Removing satellite: ${catalogNumber}`)

    // Remove from satellites list
    const updatedSatellites = satellites.filter(sat => sat.catalogNumber !== catalogNumber)

    // Clear selection if this satellite was selected
    const updatedSelection = selectedSatellite?.catalogNumber === catalogNumber
      ? null
      : selectedSatellite

    // Remove ground track
    const updatedGroundTracks = new Map(groundTracks)
    updatedGroundTracks.delete(catalogNumber)

    // Remove pass predictions
    const updatedPassPredictions = new Map(passPredictions)
    updatedPassPredictions.delete(catalogNumber)

    set({
      satellites: updatedSatellites,
      selectedSatellite: updatedSelection,
      groundTracks: updatedGroundTracks,
      passPredictions: updatedPassPredictions
    })
  },

  selectSatellite: (catalogNumber: string | null) => {
    const { satellites } = get()

    if (catalogNumber === null) {
      set({ selectedSatellite: null })
      return
    }

    const satellite = satellites.find(sat => sat.catalogNumber === catalogNumber)

    if (satellite) {
      console.log(`📡 Selected satellite: ${satellite.name}`)
      set({ selectedSatellite: satellite })
    }
  },

  updatePositions: () => {
    const { satellites } = get()

    if (satellites.length === 0) return

    const now = new Date()
    const orbitService = getOrbitalMechanicsService()

    const updatedSatellites = satellites.map(sat => {
      const state = orbitService.getSatellitePosition(sat.tle, now)

      if (!state) {
        return sat // Keep old position if calculation fails
      }

      return {
        ...sat,
        position: state.position,
        velocity: state.velocity.speed,
        lastUpdate: now
      }
    })

    set({ satellites: updatedSatellites })

    // Update selected satellite if it exists
    const { selectedSatellite } = get()
    if (selectedSatellite) {
      const updated = updatedSatellites.find(
        sat => sat.catalogNumber === selectedSatellite.catalogNumber
      )
      if (updated) {
        set({ selectedSatellite: updated })
      }
    }
  },

  generateGroundTrack: (catalogNumber: string, durationMinutes = 100) => {
    const { satellites, groundTracks } = get()

    const satellite = satellites.find(sat => sat.catalogNumber === catalogNumber)
    if (!satellite) return

    console.log(`🛰️ Generating ground track for ${satellite.name} (${durationMinutes} min)`)

    const orbitService = getOrbitalMechanicsService()
    const groundTrack = orbitService.getGroundTrack(
      satellite.tle,
      new Date(),
      durationMinutes,
      60 // 60 second steps
    )

    const updatedGroundTracks = new Map(groundTracks)
    updatedGroundTracks.set(catalogNumber, groundTrack)

    set({ groundTracks: updatedGroundTracks })

    console.log(`✓ Generated ${groundTrack.length} ground track points`)
  },

  predictPasses: async (catalogNumber: string, observerLocation: [number, number]) => {
    const { satellites, passPredictions } = get()

    const satellite = satellites.find(sat => sat.catalogNumber === catalogNumber)
    if (!satellite) return

    console.log(`🔭 Predicting passes for ${satellite.name} over [${observerLocation}]`)

    const orbitService = getOrbitalMechanicsService()

    try {
      // Predict next 5 passes
      const passes: PassPrediction[] = []
      let searchStart = new Date()

      for (let i = 0; i < 5; i++) {
        const pass = await orbitService.predictNextPass(
          satellite.tle,
          { latitude: observerLocation[0], longitude: observerLocation[1] },
          searchStart,
          7 // Search 7 days ahead
        )

        if (pass) {
          passes.push(pass)
          searchStart = new Date(pass.setTime.getTime() + 60000) // Start next search 1 minute after this pass ends
        } else {
          break // No more passes found
        }
      }

      const updatedPassPredictions = new Map(passPredictions)
      updatedPassPredictions.set(catalogNumber, passes)

      set({ passPredictions: updatedPassPredictions })

      console.log(`✓ Predicted ${passes.length} passes`)

    } catch (error) {
      console.error(`❌ Failed to predict passes:`, error)
    }
  },

  setObserverLocation: (location: [number, number]) => {
    console.log(`📍 Observer location set: [${location}]`)
    set({ observerLocation: location })
  },

  startTracking: () => {
    const { isTracking, updateInterval } = get()

    if (isTracking) {
      console.log('⚠️ Tracking already active')
      return
    }

    console.log(`🚀 Starting satellite tracking (interval: ${updateInterval}ms)`)

    set({ isTracking: true })

    // Initial update
    get().updatePositions()

    // Set up periodic updates
    updateTimer = setInterval(() => {
      get().updatePositions()
    }, updateInterval)
  },

  stopTracking: () => {
    console.log('⏸️ Stopping satellite tracking')

    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }

    set({ isTracking: false })
  },

  setUpdateInterval: (interval: number) => {
    const { isTracking } = get()

    console.log(`⏱️ Update interval changed: ${interval}ms`)

    set({ updateInterval: interval })

    // Restart tracking with new interval if currently tracking
    if (isTracking) {
      get().stopTracking()
      get().startTracking()
    }
  },

  clearAll: () => {
    console.log('🗑️ Clearing all tracked satellites')

    const { stopTracking } = get()
    stopTracking()

    set({
      satellites: [],
      selectedSatellite: null,
      groundTracks: new Map(),
      passPredictions: new Map(),
      observerLocation: null,
      error: null
    })
  }
}))

// Cleanup on unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (updateTimer) {
      clearInterval(updateTimer)
    }
  })
}
