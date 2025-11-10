/**
 * Space Domain Store
 * State management for satellite imagery and orbital operations
 */

import { create } from 'zustand'
import type { SatelliteImage, SatelliteTimeSeries } from '../services/satelliteImageryService'
import type { DetectedChange } from '../services/imageryAnalysisService'
import { getSatelliteImageryService } from '../services/satelliteImageryService'
import { getImageryAnalysisService } from '../services/imageryAnalysisService'

interface SpaceStore {
  // Imagery state
  selectedImage: SatelliteImage | null
  images: SatelliteImage[]
  timeSeries: SatelliteTimeSeries | null
  timelineRange: [Date, Date] | null
  imageOpacity: number
  isLoading: boolean

  // Comparison state
  compareMode: boolean
  compareBeforeImage: SatelliteImage | null
  compareAfterImage: SatelliteImage | null

  // Analysis state
  changeDetectionActive: boolean
  detectedChanges: DetectedChange[]
  analysisLoading: boolean

  // Location state
  currentLocation: [number, number] | null // [lng, lat]
  currentLocationName?: string

  // Actions
  setSelectedImage: (image: SatelliteImage | null) => void
  setImageOpacity: (opacity: number) => void

  loadTimeSeries: (location: [number, number], locationName?: string) => Promise<void>
  selectImageByDate: (date: Date) => void

  enableCompareMode: (before: SatelliteImage, after: SatelliteImage) => void
  disableCompareMode: () => void

  runChangeDetection: () => Promise<void>
  clearAnalysis: () => void

  reset: () => void
}

const DEFAULT_TIME_RANGE_DAYS = 90

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  // Initial state
  selectedImage: null,
  images: [],
  timeSeries: null,
  timelineRange: null,
  imageOpacity: 0.8,
  isLoading: false,

  compareMode: false,
  compareBeforeImage: null,
  compareAfterImage: null,

  changeDetectionActive: false,
  detectedChanges: [],
  analysisLoading: false,

  currentLocation: null,
  currentLocationName: undefined,

  // Actions
  setSelectedImage: (image) => {
    console.log('📷 Selected image:', image?.acquisitionDate)
    set({ selectedImage: image })
  },

  setImageOpacity: (opacity) => {
    set({ imageOpacity: Math.max(0, Math.min(1, opacity)) })
  },

  loadTimeSeries: async (location, locationName) => {
    console.log(`🛰️ Loading time-series for ${locationName || 'location'}:`, location)

    set({
      isLoading: true,
      currentLocation: location,
      currentLocationName: locationName,
      images: [],
      selectedImage: null,
      detectedChanges: [],
      changeDetectionActive: false
    })

    try {
      const imageryService = getSatelliteImageryService()

      // Load last 90 days by default
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - DEFAULT_TIME_RANGE_DAYS * 24 * 60 * 60 * 1000)

      const timeSeries = await imageryService.getTimeSeries(
        location,
        startDate,
        endDate,
        {
          maxCloudCover: 20,
          source: 'sentinel-2'
        }
      )

      console.log(`✓ Loaded ${timeSeries.images.length} images`)

      set({
        timeSeries,
        images: timeSeries.images,
        timelineRange: [startDate, endDate],
        // Auto-select most recent image
        selectedImage: timeSeries.images.length > 0
          ? timeSeries.images[timeSeries.images.length - 1]
          : null,
        isLoading: false
      })
    } catch (error) {
      console.error('❌ Failed to load time-series:', error)
      set({
        isLoading: false,
        images: [],
        timeSeries: null
      })
    }
  },

  selectImageByDate: (date) => {
    const { images } = get()

    // Find image closest to the specified date
    if (images.length === 0) {
      return
    }

    const targetTime = date.getTime()
    const closestImage = images.reduce((closest, image) => {
      const imageDiff = Math.abs(image.acquisitionDate.getTime() - targetTime)
      const closestDiff = Math.abs(closest.acquisitionDate.getTime() - targetTime)
      return imageDiff < closestDiff ? image : closest
    })

    set({ selectedImage: closestImage })
  },

  enableCompareMode: (before, after) => {
    console.log('🔍 Enabling compare mode')
    set({
      compareMode: true,
      compareBeforeImage: before,
      compareAfterImage: after
    })
  },

  disableCompareMode: () => {
    console.log('❌ Disabling compare mode')
    set({
      compareMode: false,
      compareBeforeImage: null,
      compareAfterImage: null
    })
  },

  runChangeDetection: async () => {
    const { compareBeforeImage, compareAfterImage, compareMode } = get()

    if (!compareMode || !compareBeforeImage || !compareAfterImage) {
      console.warn('⚠️ Compare mode not active or images not selected')
      return
    }

    console.log('🔍 Running change detection...')
    set({ analysisLoading: true })

    try {
      const analysisService = getImageryAnalysisService()

      const result = await analysisService.detectChanges({
        beforeImage: compareBeforeImage,
        afterImage: compareAfterImage,
        sensitivity: 'medium'
      })

      console.log(`✓ Found ${result.changes.length} changes`)

      set({
        detectedChanges: result.changes,
        changeDetectionActive: true,
        analysisLoading: false
      })
    } catch (error) {
      console.error('❌ Change detection failed:', error)
      set({
        analysisLoading: false,
        detectedChanges: []
      })
    }
  },

  clearAnalysis: () => {
    set({
      detectedChanges: [],
      changeDetectionActive: false
    })
  },

  reset: () => {
    console.log('🔄 Resetting space store')
    set({
      selectedImage: null,
      images: [],
      timeSeries: null,
      timelineRange: null,
      imageOpacity: 0.8,
      isLoading: false,
      compareMode: false,
      compareBeforeImage: null,
      compareAfterImage: null,
      changeDetectionActive: false,
      detectedChanges: [],
      analysisLoading: false,
      currentLocation: null,
      currentLocationName: undefined
    })
  }
}))
