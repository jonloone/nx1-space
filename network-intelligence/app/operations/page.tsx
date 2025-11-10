'use client'

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MissionControlLayout from '@/components/opintel/layout/MissionControlLayout'
import RightPanel from '@/components/opintel/panels/RightPanel'
import IntelligenceAlertPanel from '@/components/opintel/panels/IntelligenceAlertPanel'
import SubjectProfileViewer from '@/components/opintel/SubjectProfileViewer'
import RouteAnalysisPanel from '@/components/opintel/panels/RouteAnalysisPanel'
import ImageryAnalysisPanel from '@/components/opintel/panels/ImageryAnalysisPanel'
import IsochroneAnalysisPanel from '@/components/opintel/panels/IsochroneAnalysisPanel'
import UnifiedAnalysisPanel from '@/components/opintel/panels/UnifiedAnalysisPanel'
import AlertQueue from '@/components/opintel/AlertQueue'
import TemporalPlaybackControls from '@/components/opintel/TemporalPlaybackControls'
import AdvancedSearchFilterPanel from '@/components/opintel/AdvancedSearchFilterPanel'
import GERSMapLayer from '@/components/gers/GERSMapLayer'
import AddLayerDropdown from '@/components/opintel/panels/AddLayerDropdown'
// DISABLED: Investigation mode now triggered via AI chat artifacts
// import { InvestigationMode } from '@/components/investigation'
import CopilotProvider from '@/components/chat/CopilotProvider'
import { AIChatPanelRef, ChatMessage } from '@/components/ai/AIChatPanel'
import MapboxAlertVisualization from '@/components/opintel/MapboxAlertVisualization'
import { SpaceDomainIntegration } from '@/components/space/SpaceDomainIntegration'
import { UnifiedDock } from '@/components/dock/UnifiedDock'
import { DockChatPanel } from '@/components/dock/panels/DockChatPanel'
import { DockDomainsPanel } from '@/components/dock/panels/DockDomainsPanel'
import { DockAnalysisPanel } from '@/components/dock/panels/DockAnalysisPanel'
import { DockLayersPanel } from '@/components/dock/panels/DockLayersPanel'
import { ToolbarManager } from '@/components/domains/toolbars'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import type { ICDomainId } from '@/lib/config/icDomains'
import { useMapStore, usePanelStore } from '@/lib/stores'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { GERSPlace, LOD_CONFIG } from '@/lib/services/gersDemoService'
import { getOverturePlacesService } from '@/lib/services/overturePlacesService'
import { getOvertureLayersManager, OVERTURE_LAYER_CONFIGS } from '@/lib/services/overtureLayersManager'
import { getFeatureHighlightService } from '@/lib/services/featureHighlightService'
import { getBuildingPlaceMapper } from '@/lib/services/buildingPlaceMapper'
import { debounce } from '@/lib/utils/debounce'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

export default function OperationsPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const chatRef = useRef<AIChatPanelRef>(null)
  const summarizedAlerts = useRef<Set<string>>(new Set())

  // Active domains state (for ToolbarManager)
  const [activeDomains, setActiveDomains] = useState<ICDomainId[]>(['ground'])

  // Zustand stores
  const {
    setMap,
    isLoaded,
    setLoaded,
    selectFeature,
    setVisiblePlaces,
    addCachedPlaces,
    visiblePlaces,
    setViewportBounds,
    initializeCache,
    saveToCache
  } = useMapStore()
  const { rightPanelMode, rightPanelData, openRightPanel, closeRightPanel } = usePanelStore()
  const { pushArtifact } = useAnalysisStore()

  // GERs search state (for custom search features)
  const [gersPlaces, setGersPlaces] = useState<GERSPlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState<GERSPlace | null>(null)

  // Overture Places loading state
  const [isOverturePlacesLoaded, setIsOverturePlacesLoaded] = useState(false)

  // Layer Management state
  const [activeLayers, setActiveLayers] = useState<Array<{
    id: string
    name: string
    type: string
    visible: boolean
    opacity: number
    color?: string
  }>>([]) // Start with empty - user adds layers via catalog

  // Add Layer Dialog state
  const [isAddLayerDialogOpen, setIsAddLayerDialogOpen] = useState(false)

  // Investigation Mode - DISABLED: Will be triggered via AI chat artifacts instead
  // const [isInvestigationModeActive, setIsInvestigationModeActive] = useState(false)

  // Viewport tracking for alert visualization
  const [viewport, setViewport] = useState({
    zoom: 4,
    latitude: 39.8283,
    longitude: -98.5795
  })

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🗺️ Initializing Mapbox map...')

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 4,
        pitch: 0,
        bearing: 0,
        antialias: true
      })

      map.current = mapInstance

      mapInstance.on('load', () => {
        console.log('✅ Map loaded successfully!')
        setMap(mapInstance)
        setLoaded(true)
      })

      mapInstance.on('error', (e) => {
        // Suppress tile 404 errors (expected for optional layers)
        const errorMessage = e.error?.message || ''
        if (errorMessage.includes('404') || errorMessage.includes('pmtiles')) {
          // Silent - these are expected for optional building tiles
          return
        }
        console.error('❌ Map error:', e)
      })
    } catch (error) {
      console.error('❌ Failed to initialize map:', error)
    }

    return () => {
      map.current?.remove()
      setMap(null)
    }
  }, [setMap, setLoaded, openRightPanel])

  // Initialize cache on mount
  useEffect(() => {
    initializeCache()
  }, [initializeCache])

  // Track viewport changes for alert visualization
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const updateViewport = () => {
      if (!map.current) return
      const center = map.current.getCenter()
      setViewport({
        zoom: map.current.getZoom(),
        latitude: center.lat,
        longitude: center.lng
      })
    }

    // Update on map move
    map.current.on('move', updateViewport)
    map.current.on('zoom', updateViewport)

    return () => {
      if (map.current) {
        map.current.off('move', updateViewport)
        map.current.off('zoom', updateViewport)
      }
    }
  }, [isLoaded])

  // Visualize route analysis on map
  useEffect(() => {
    if (!map.current || !isLoaded) return
    if (rightPanelMode !== 'route-analysis' || !rightPanelData) return

    const mapInstance = map.current
    const routeData = rightPanelData

    // Add route line source
    if (!mapInstance.getSource('route-line')) {
      mapInstance.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeData.route.path
          }
        }
      })

      // Add route line layer
      mapInstance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1D48E5',
          'line-width': 4,
          'line-opacity': 0.8
        }
      })
    } else {
      // Update existing source
      const source = mapInstance.getSource('route-line') as mapboxgl.GeoJSONSource
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeData.route.path
        }
      })
    }

    // Add waypoint markers
    const markers: mapboxgl.Marker[] = []
    routeData.analyzedWaypoints.forEach((waypoint: any, index: number) => {
      const el = document.createElement('div')
      el.className = 'waypoint-marker'
      el.style.width = '12px'
      el.style.height = '12px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      // Color by risk
      const riskIndicators = waypoint.analysis?.riskIndicators || []
      el.style.backgroundColor = riskIndicators.length > 2 ? '#ef4444' :
                                  riskIndicators.length > 0 ? '#f97316' : '#3b82f6'

      const marker = new mapboxgl.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(mapInstance)

      markers.push(marker)
    })

    // Fit map to route bounds
    const bounds = new mapboxgl.LngLatBounds()
    routeData.route.path.forEach((coord: [number, number]) => {
      bounds.extend(coord)
    })
    mapInstance.fitBounds(bounds, { padding: 80, duration: 1000 })

    // Cleanup
    return () => {
      if (mapInstance.getLayer('route-line')) {
        mapInstance.removeLayer('route-line')
      }
      if (mapInstance.getSource('route-line')) {
        mapInstance.removeSource('route-line')
      }
      markers.forEach(marker => marker.remove())
    }
  }, [isLoaded, rightPanelMode, rightPanelData])

  // Track if default layers have been loaded
  const [defaultLayersLoaded, setDefaultLayersLoaded] = useState(false)

  // Initialize Overture Layers Manager
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const initializeLayersManager = async () => {
      try {
        console.log('🗂️ Initializing Overture Layers Manager...')
        const layersManager = getOvertureLayersManager()
        await layersManager.initialize(map.current!)
        console.log('✅ Overture Layers Manager ready')
      } catch (error) {
        console.error('❌ Failed to initialize Layers Manager:', error)
      }
    }

    initializeLayersManager()
  }, [isLoaded])

  // Initialize Feature Highlight Service
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const highlightService = getFeatureHighlightService()
    highlightService.initialize(map.current)

    // Initialize Building-Place Mapper
    const mapper = getBuildingPlaceMapper()
    mapper.initialize(map.current)
  }, [isLoaded])

  // Add building and places click handlers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Define place layer IDs at outer scope so cleanup can access them
    const placeLayers = [
      'overture-airports',
      'overture-hospitals',
      'overture-education',
      'overture-cultural',
      'overture-transport',
      'overture-general'
    ]

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Check for places first (POIs have higher priority)
      const placeFeatures = map.current!.queryRenderedFeatures(e.point, {
        layers: placeLayers
      })

      if (placeFeatures.length > 0) {
        const feature = placeFeatures[0]
        const properties = feature.properties || {}

        // Get coordinates
        const coordinates: [number, number] = e.lngLat.toArray() as [number, number]

        // Create SelectedFeature for place
        const selectedFeature = {
          id: properties.id || `place-${coordinates.join(',')}`,
          type: 'place' as const,
          name: properties.name || 'Place',
          coordinates,
          properties: {
            categories: properties.categories ? JSON.parse(properties.categories) : [],
            confidence: properties.confidence,
            ...properties
          }
        }

        // Update map store
        selectFeature(selectedFeature)

        // Highlight the feature visually
        const highlightService = getFeatureHighlightService()
        highlightService.highlightFeature(selectedFeature)

        // Open right panel with place details
        openRightPanel('feature', {
          id: properties.id || `place-${coordinates.join(',')}`,
          type: 'place',
          name: properties.name || 'Place',
          coordinates,
          properties: {
            category: properties.category,
            categories: properties.categories ? JSON.parse(properties.categories) : [],
            confidence: properties.confidence,
            ...properties
          }
        })
        return
      }

      // Check for buildings
      const buildingFeatures = map.current!.queryRenderedFeatures(e.point, {
        layers: ['buildings-2d', 'buildings-3d']
      })

      if (buildingFeatures.length > 0) {
        const feature = buildingFeatures[0]
        const properties = feature.properties || {}

        // Get geometry center for coordinates
        const coordinates: [number, number] = e.lngLat.toArray() as [number, number]

        // Create SelectedFeature
        const selectedFeature = {
          id: properties.id || `building-${coordinates.join(',')}`,
          type: 'building' as const,
          name: properties.name || 'Building',
          coordinates,
          properties: {
            class: properties.class || 'building',
            height: properties.height || 0,
            floors: properties.floors || 0,
            ...properties
          }
        }

        // Update map store
        selectFeature(selectedFeature)

        // Highlight the feature visually
        const highlightService = getFeatureHighlightService()
        highlightService.highlightFeature(selectedFeature)

        // Open right panel with building details
        openRightPanel('feature', {
          id: properties.id || `building-${coordinates.join(',')}`,
          type: 'building',
          name: properties.name || 'Building',
          coordinates,
          properties: {
            class: properties.class || 'building',
            height: properties.height || 0,
            floors: properties.floors || 0,
            ...properties
          }
        })
      }
    }

    // Add click listener
    map.current.on('click', handleMapClick)

    // Change cursor on hover for buildings
    const handleMouseEnter = () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    }
    const handleMouseLeave = () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    }

    // Buildings
    map.current.on('mouseenter', 'buildings-2d', handleMouseEnter)
    map.current.on('mouseleave', 'buildings-2d', handleMouseLeave)
    map.current.on('mouseenter', 'buildings-3d', handleMouseEnter)
    map.current.on('mouseleave', 'buildings-3d', handleMouseLeave)

    // Places
    placeLayers.forEach(layer => {
      map.current!.on('mouseenter', layer, handleMouseEnter)
      map.current!.on('mouseleave', layer, handleMouseLeave)
    })

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick)
        map.current.off('mouseenter', 'buildings-2d', handleMouseEnter)
        map.current.off('mouseleave', 'buildings-2d', handleMouseLeave)
        map.current.off('mouseenter', 'buildings-3d', handleMouseEnter)
        map.current.off('mouseleave', 'buildings-3d', handleMouseLeave)

        placeLayers.forEach(layer => {
          map.current!.off('mouseenter', layer, handleMouseEnter)
          map.current!.off('mouseleave', layer, handleMouseLeave)
        })
      }
    }
  }, [isLoaded, selectFeature, openRightPanel])

  // Query visible places when viewport changes (for Places layer)
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Check if Places layer is active
    const hasPlacesLayer = activeLayers.some(l => l.id === 'infra-places' && l.visible)
    if (!hasPlacesLayer) return

    const updateVisiblePlaces = debounce(() => {
      if (!map.current) return

      const overturePlacesService = getOverturePlacesService()
      const places = overturePlacesService.queryVisiblePlaces(map.current)

      // Update mapStore with visible places (for search)
      setVisiblePlaces(places)
      console.log(`📍 Updated visible places: ${places.length} in viewport`)
    }, 500)

    // Query on load and viewport change
    updateVisiblePlaces()

    map.current.on('moveend', updateVisiblePlaces)
    map.current.on('zoomend', updateVisiblePlaces)

    return () => {
      if (map.current) {
        map.current.off('moveend', updateVisiblePlaces)
        map.current.off('zoomend', updateVisiblePlaces)
      }
    }
  }, [isLoaded, activeLayers, setVisiblePlaces])

  // Demo data for left sidebar
  const dataSources = [
    {
      id: 'ops-feed',
      name: 'Operations Feed',
      type: 'stream' as const,
      status: 'connected' as const,
      lastUpdated: 'Live',
      recordCount: 1247
    },
    {
      id: 'network-data',
      name: 'Network Status',
      type: 'api' as const,
      status: 'connected' as const,
      lastUpdated: '2 min ago',
      recordCount: 89
    },
    {
      id: 'sensor-grid',
      name: 'Sensor Grid',
      type: 'database' as const,
      status: 'connected' as const,
      lastUpdated: '5 min ago',
      recordCount: 342
    }
  ]

  const liveStreams = [
    {
      id: 'ops-stream',
      name: 'Operations Stream',
      status: 'active' as const,
      messagesPerSecond: 12.4,
      totalMessages: 45623,
      latency: 28
    },
    {
      id: 'telemetry-stream',
      name: 'Telemetry Feed',
      status: 'active' as const,
      messagesPerSecond: 8.7,
      totalMessages: 32891,
      latency: 42
    }
  ]

  const handleAddLayer = async (layerId: string) => {
    if (!map.current) return

    console.log(`📍 Adding layer: ${layerId}`)

    // Get layer definition from catalog
    const { getLayerById } = require('@/lib/config/layerCatalog')
    const layerDef = getLayerById(layerId)

    if (!layerDef) {
      console.error(`Layer ${layerId} not found in catalog`)
      return
    }

    try {
      // Handle different layer types
      if (layerDef.category === 'basemaps') {
        // Change basemap style
        const style = layerDef.sourceUrl
        if (style) {
          map.current!.setStyle(style)
          console.log(`✅ Changed basemap to: ${layerDef.name}`)
        }
      } else if (layerDef.category === 'infrastructure') {
        // Map catalog layer IDs to Overture Layers Manager IDs
        const layerIdMap: Record<string, string> = {
          'infra-places': 'places',
          'infra-buildings-2d': 'buildings-2d',
          'infra-buildings-3d': 'buildings-3d',
          'infra-roads': 'transportation',
          'infra-ports': 'ports' // Will need custom handling
        }

        const overtureLayerId = layerIdMap[layerId]

        if (overtureLayerId) {
          // Use Overture Layers Manager for infrastructure layers
          const layersManager = getOvertureLayersManager()
          await layersManager.addLayer(overtureLayerId as any)
          console.log(`✅ Added infrastructure layer: ${layerDef.name}`)
        } else {
          console.log(`⚠️ Infrastructure layer ${layerId} not yet implemented`)
        }
      } else {
        console.log(`⚠️ Layer type ${layerDef.category} not yet implemented`)
        // TODO: Implement other layer types (weather, EO, maritime, comms)
      }

      // Add to active layers list
      setActiveLayers(prev => [
        ...prev,
        {
          id: layerId,
          name: layerDef.name,
          type: layerDef.type,
          visible: true,
          opacity: layerDef.defaultOpacity,
          color: layerDef.icon // Use icon as color placeholder
        }
      ])
    } catch (error) {
      console.error(`Failed to add layer ${layerId}:`, error)
    }
  }

  const handleToggleLayer = async (layerId: string) => {
    if (!map.current) return

    const layer = activeLayers.find(l => l.id === layerId)
    if (!layer) return

    try {
      // Toggle visibility based on layer type
      const { getLayerById } = require('@/lib/config/layerCatalog')
      const layerDef = getLayerById(layerId)

      if (layerDef?.category === 'infrastructure') {
        // Map catalog layer IDs to Overture Layers Manager IDs
        const layerIdMap: Record<string, string> = {
          'infra-places': 'places',
          'infra-buildings-2d': 'buildings-2d',
          'infra-buildings-3d': 'buildings-3d',
          'infra-roads': 'transportation'
        }

        const overtureLayerId = layerIdMap[layerId]
        if (overtureLayerId) {
          const layersManager = getOvertureLayersManager()
          layersManager.toggleLayer(overtureLayerId as any, !layer.visible)
        }
      }

      // Update state
      setActiveLayers(prev =>
        prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l)
      )
    } catch (error) {
      console.error(`Failed to toggle layer ${layerId}:`, error)
    }
  }

  const handleRemoveLayer = async (layerId: string) => {
    if (!map.current) return

    console.log(`🗑️ Removing layer: ${layerId}`)

    try {
      // Get layer definition from catalog
      const { getLayerById } = require('@/lib/config/layerCatalog')
      const layerDef = getLayerById(layerId)

      if (layerDef?.category === 'infrastructure') {
        // Remove infrastructure layer
        const layersManager = getOvertureLayersManager()
        const mapLayerIds = layersManager['getMapLayerIds'](layerId as any)

        // Remove each map layer
        mapLayerIds.forEach((id: string) => {
          if (map.current!.getLayer(id)) {
            map.current!.removeLayer(id)
          }
        })

        // Remove source if no other layers use it
        const sourceId = layerId.includes('buildings') ? 'overture-buildings' : `overture-${layerId}`
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId)
        }

        console.log(`✅ Removed infrastructure layer: ${layerDef.name}`)
      }
      // TODO: Handle removal of other layer types

      // Remove from active layers list
      setActiveLayers(prev => prev.filter(l => l.id !== layerId))
    } catch (error) {
      console.error(`Failed to remove layer ${layerId}:`, error)
    }
  }

  const handleChangeOpacity = async (layerId: string, opacity: number) => {
    if (!map.current) return

    console.log(`🎨 Changing opacity for ${layerId}: ${opacity}`)

    try {
      // Get layer definition from catalog
      const { getLayerById } = require('@/lib/config/layerCatalog')
      const layerDef = getLayerById(layerId)

      if (layerDef?.category === 'infrastructure') {
        // Map catalog layer IDs to Overture Layers Manager IDs
        const layerIdMap: Record<string, string> = {
          'infra-places': 'places',
          'infra-buildings-2d': 'buildings-2d',
          'infra-buildings-3d': 'buildings-3d',
          'infra-roads': 'transportation'
        }

        const overtureLayerId = layerIdMap[layerId]
        if (overtureLayerId) {
          const layersManager = getOvertureLayersManager()
          layersManager.setLayerOpacity(overtureLayerId as any, opacity)
        }
      }
      // TODO: Handle opacity for other layer types

      // Update state
      setActiveLayers(prev =>
        prev.map(l => l.id === layerId ? { ...l, opacity } : l)
      )
    } catch (error) {
      console.error(`Failed to change opacity for layer ${layerId}:`, error)
    }
  }

  const handleLayerSettings = (layerId: string) => {
    console.log('Layer settings:', layerId)
    // TODO: Open settings dialog for layer (opacity, filters, etc.)
  }

  const handleTogglePlaceCategory = (categoryId: string) => {
    const overturePlacesService = getOverturePlacesService()
    overturePlacesService.toggleCategory(categoryId)
  }

  const handleTogglePlaceGroup = (groupId: string, enabled: boolean) => {
    // Import the category group to get all category IDs
    const { CATEGORY_GROUPS } = require('@/lib/config/placesCategories')
    const group = CATEGORY_GROUPS.find((g: any) => g.id === groupId)

    if (group) {
      const overturePlacesService = getOverturePlacesService()
      overturePlacesService.toggleCategoryGroup(group.categories, enabled)
    }
  }

  // Auto-load default layers on startup
  useEffect(() => {
    if (!map.current || !isLoaded || defaultLayersLoaded) return

    const loadDefaultLayers = async () => {
      try {
        console.log('📍 Auto-loading default layers...')
        const { DEFAULT_LAYERS } = require('@/lib/config/layerPresets')

        // Load default infrastructure layers
        for (const layerConfig of DEFAULT_LAYERS.layers) {
          await handleAddLayer(layerConfig.id)

          // Set visibility based on default
          if (!layerConfig.visible) {
            // If default is hidden, toggle it off after adding
            setTimeout(() => {
              setActiveLayers(prev =>
                prev.map(l => l.id === layerConfig.id ? { ...l, visible: false } : l)
              )

              // Also toggle in the manager
              const layerIdMap: Record<string, string> = {
                'infra-places': 'places',
                'infra-buildings-2d': 'buildings-2d',
                'infra-buildings-3d': 'buildings-3d'
              }
              const overtureLayerId = layerIdMap[layerConfig.id]
              if (overtureLayerId) {
                const layersManager = getOvertureLayersManager()
                layersManager.toggleLayer(overtureLayerId as any, false)
              }
            }, 100)
          }
        }

        console.log('✅ Default layers loaded')
        setDefaultLayersLoaded(true)
      } catch (error) {
        console.error('❌ Failed to load default layers:', error)
      }
    }

    loadDefaultLayers()
  }, [isLoaded, defaultLayersLoaded])

  const handleSearch = (query: string) => {
    console.log('Search:', query)
  }

  const handleGERSResults = (places: GERSPlace[]) => {
    setGersPlaces(places)
    console.log(`Found ${places.length} GERs places`)
  }

  const handleGERSPlaceSelect = (place: GERSPlace) => {
    setSelectedPlace(place)
    console.log('Selected place:', place.name, 'LoD:', place.levelOfDetail)

    // Create SelectedFeature for the store
    const selectedFeature = {
      id: place.gersId,
      type: 'place',
      name: place.name,
      coordinates: place.location.coordinates as [number, number],
      properties: {
        ...place,
        categories: place.categories,
        levelOfDetail: place.levelOfDetail
      }
    }

    // Update map store
    selectFeature(selectedFeature)

    // Highlight the feature visually
    const highlightService = getFeatureHighlightService()
    highlightService.highlightFeature(selectedFeature)

    // Open right panel with place details
    openRightPanel('feature', place)
  }

  // Handle alert click - Open panel with alert details (no chat injection)
  const handleInjectAlert = (alert: IntelligenceAlert) => {
    console.log('🎯 Alert clicked:', alert.id)
    console.log('📍 Subject:', alert.subjectName)

    // Note: All alert details and analysis are shown in the panel
    // No chat injection - everything is in the alert panel

    // Mark as handled
    summarizedAlerts.current.add(alert.id)

    // Open right panel with alert details
    openRightPanel('alert', {
      alert,
      timestamp: new Date()
    })
  }

  // Handle map actions from AI chat
  const handleChatAction = async (action: string, data: any) => {
    console.log('💬 Chat action:', action, data)

    if (!data || !map.current) return

    const mapper = getBuildingPlaceMapper()

    // Execute map actions based on LLM responses
    switch (action) {
      case 'flyTo':
        if (data.viewport) {
          console.log('🗺️ Flying to:', data.viewport.center, 'zoom:', data.viewport.zoom)
          map.current.flyTo({
            center: data.viewport.center,
            zoom: data.viewport.zoom,
            essential: true
          })
        }
        break

      case 'search':
        if (data.places && data.places.length > 0) {
          console.log('🎨 Coloring buildings for', data.places.length, 'places')

          // Color buildings instead of showing place markers
          await mapper.colorBuildingsByPlaces(data.places, data.categories)

          // Also store places in state for search
          setVisiblePlaces(data.places)

          if (data.viewport) {
            map.current.flyTo({
              center: data.viewport.center,
              zoom: data.viewport.zoom,
              essential: true
            })
          }
        }
        break

      case 'showNearby':
        if (data.places) {
          console.log('🎨 Coloring nearby buildings:', data.places.length)
          await mapper.colorBuildingsByPlaces(data.places)
          setVisiblePlaces(data.places)
        }
        break

      case 'analyze':
        if (data.places && data.viewport) {
          console.log('📊 Analyzing area with', data.places.length, 'places')
          await mapper.colorBuildingsByPlaces(data.places)
          setVisiblePlaces(data.places)

          map.current.flyTo({
            center: data.viewport.center,
            zoom: data.viewport.zoom,
            essential: true
          })
        }
        break
    }
  }

  return (
    <CopilotProvider>
      <MissionControlLayout
        projectName="Operations Intelligence"
        notificationCount={5}
        isLive={true}
        activeUsers={12}
        hideSidebar={false}
        useChatInterface={false}
        onSearch={handleSearch}
        onPlaceSelect={handleGERSPlaceSelect}
      rightPanel={
        rightPanelMode ? (
          rightPanelMode === 'alert' && rightPanelData?.alert ? (
            <IntelligenceAlertPanel
              alert={rightPanelData.alert}
              relatedAlerts={rightPanelData.relatedAlerts || []}
              onClose={() => {
                closeRightPanel()
              }}
              onAlertClick={(alertId) => {
                console.log('Navigate to alert:', alertId)
              }}
              onSubjectClick={(subjectId) => {
                console.log('View subject profile:', subjectId)
                openRightPanel('subject', { subjectId })
              }}
            />
          ) : rightPanelMode === 'subject' && rightPanelData?.subjectId ? (
            <SubjectProfileViewer
              subjectId={rightPanelData.subjectId}
              onClose={() => {
                closeRightPanel()
              }}
              onAlertClick={(alert) => {
                openRightPanel('alert', { alert })
              }}
              onRelatedSubjectClick={(subjectId) => {
                openRightPanel('subject', { subjectId })
              }}
            />
          ) : rightPanelMode === 'route-analysis' && rightPanelData ? (
            <RouteAnalysisPanel
              data={rightPanelData}
              onClose={() => {
                closeRightPanel()
              }}
              onFlyToWaypoint={(coords) => {
                if (map.current) {
                  map.current.flyTo({
                    center: coords,
                    zoom: 16,
                    essential: true,
                    duration: 2000
                  })
                }
              }}
            />
          ) : rightPanelMode === 'imagery-analysis' && rightPanelData ? (
            <ImageryAnalysisPanel
              data={rightPanelData}
              onClose={() => {
                closeRightPanel()
              }}
            />
          ) : rightPanelMode === 'isochrone-analysis' && rightPanelData ? (
            <IsochroneAnalysisPanel
              data={rightPanelData}
              onClose={() => {
                closeRightPanel()
              }}
            />
          ) : rightPanelMode === 'unified-analysis' && rightPanelData ? (
            <UnifiedAnalysisPanel
              data={rightPanelData}
              onClose={() => {
                closeRightPanel()
              }}
            />
          ) : (
            <RightPanel
              mode={rightPanelMode}
              data={rightPanelData}
              map={map.current}
              onClose={() => {
                // Clear highlight when closing panel
                const highlightService = getFeatureHighlightService()
                highlightService.clearHighlight()
                selectFeature(null)
                closeRightPanel()
              }}
              onInjectAlert={handleInjectAlert}
            />
          )
        ) : null
      }
      >
        {/* Map Canvas */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full bg-slate-900"
        style={{ minHeight: '100%' }}
      />

      {/* Map Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#176BF8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-foreground font-medium">Loading operations map...</div>
          </div>
        </div>
      )}

      {/* GERs Map Layer */}
      {map.current && (
        <GERSMapLayer
          map={map.current}
          places={gersPlaces}
          onPlaceClick={handleGERSPlaceSelect}
        />
      )}

      {/* Alert Visualization Layers - Mapbox Native (No floating) */}
      {map.current && isLoaded && (
        <MapboxAlertVisualization
          map={map.current}
          autoUpdate={true}
          onAlertClick={handleInjectAlert}
        />
      )}

      {/* Satellite Imagery - Time-series analysis with timeline */}
      {map.current && isLoaded && (
        <SpaceDomainIntegration
          map={map.current}
          isActive={true}
        />
      )}

      {/* Domain Toolbars - Floating toolbars for domain-specific operations */}
      {map.current && isLoaded && (
        <ToolbarManager map={map.current} activeDomains={activeDomains} />
      )}

      {/* Unified Dock - Bottom command bar with Chat, Domains, Analysis, Layers */}
      <UnifiedDock
        map={map.current}
        onAction={handleChatAction}
        chatPanel={<DockChatPanel ref={chatRef} onAction={handleChatAction} />}
        domainsPanel={<DockDomainsPanel onDomainsChange={setActiveDomains} />}
        analysisPanel={<DockAnalysisPanel />}
        layersPanel={<DockLayersPanel />}
      />

      {/* Investigation Mode - DISABLED: Now triggered via AI chat artifacts */}
      {/* Investigation components will be dynamically created as artifacts */}

      {/* Add Layer Dropdown */}
      <AddLayerDropdown
        open={isAddLayerDialogOpen}
        onClose={() => setIsAddLayerDialogOpen(false)}
        onAddLayer={handleAddLayer}
        addedLayerIds={activeLayers.map(l => l.id)}
      />
    </MissionControlLayout>
    </CopilotProvider>
  )
}
