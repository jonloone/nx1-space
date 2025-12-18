'use client'

/**
 * Ask Data Page
 * Natural language data exploration interface
 *
 * Layout:
 * - Left panel: Enhanced chat interface (480px)
 * - Center: Full-screen dark map
 * - Right panel: Document/analysis slide panel (overlays map)
 * - Bottom: Data analysis panel with results table
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import EnhancedChatPanel from '@/components/ask-data/EnhancedChatPanel'
import DataAnalysisPanel from '@/components/ask-data/DataAnalysisPanel'
import DocumentSlidePanel from '@/components/panels/DocumentSlidePanel'
import { useMapStore } from '@/lib/stores/mapStore'
import { usePanelStore, type DocumentPanelMode } from '@/lib/stores/panelStore'
import type { QueryResult } from '@/lib/services/chatQueryService'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

interface QueryResult {
  sql: string
  data: any[]
  columns: string[]
  executionTime?: number
}

// Data markers layer reference
let markersSource: mapboxgl.GeoJSONSource | null = null

export default function AskDataPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  const { setMap, setLoaded, isLoaded } = useMapStore()
  const {
    documentPanelMode,
    documentPanelData,
    openDocumentPanel,
    closeDocumentPanel
  } = usePanelStore()

  const [queryResults, setQueryResults] = useState<QueryResult | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [mapMarkers, setMapMarkers] = useState<mapboxgl.Marker[]>([])

  // Initialize map with dark theme
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('Initializing dark map...')

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme
      center: [0, 30], // World view centered
      zoom: 2,
      pitch: 0,
      bearing: 0,
      antialias: true,
      projection: 'mercator'
    })

    map.current = mapInstance

    mapInstance.on('load', () => {
      console.log('Dark map loaded')
      setMap(mapInstance)
      setLoaded(true)

      // Add data points source
      mapInstance.addSource('data-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      // Add circle layer for data points (red/pink markers)
      mapInstance.addLayer({
        id: 'data-points-layer',
        type: 'circle',
        source: 'data-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 4,
            8, 6,
            14, 10
          ],
          'circle-color': '#ef4444', // Red color like reference
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fecaca'
        }
      })

      // Add hover interaction
      mapInstance.on('mouseenter', 'data-points-layer', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })

      mapInstance.on('mouseleave', 'data-points-layer', () => {
        mapInstance.getCanvas().style.cursor = ''
      })

      // Click to show popup
      mapInstance.on('click', 'data-points-layer', (e) => {
        if (!e.features || e.features.length === 0) return

        const feature = e.features[0]
        const coordinates = (feature.geometry as any).coordinates.slice()
        const properties = feature.properties || {}

        // Create popup content
        const popupContent = Object.entries(properties)
          .filter(([key]) => !key.startsWith('_'))
          .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
          .join('<br>')

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<div class="text-sm p-1">${popupContent}</div>`)
          .addTo(mapInstance)
      })

      markersSource = mapInstance.getSource('data-points') as mapboxgl.GeoJSONSource
    })

    mapInstance.on('error', (e) => {
      const msg = e.error?.message || ''
      if (!msg.includes('404')) {
        console.error('Map error:', e)
      }
    })

    return () => {
      mapInstance.remove()
      setMap(null)
    }
  }, [setMap, setLoaded])

  // Update map markers when results change
  const updateMapMarkers = useCallback((results: QueryResult) => {
    if (!map.current || !isLoaded) return

    // Convert results to GeoJSON features
    const features = results.data
      .filter(row => {
        const lat = row.lat ?? row.latitude ?? row.LATITUDE
        const lng = row.lng ?? row.longitude ?? row.LONGITUDE
        return lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)
      })
      .map((row, index) => {
        const lat = row.lat ?? row.latitude ?? row.LATITUDE
        const lng = row.lng ?? row.longitude ?? row.LONGITUDE

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          properties: {
            id: row.id ?? index,
            name: row.name ?? row.NAME ?? row.place ?? `Point ${index + 1}`,
            type: row.type ?? row.TYPE ?? 'unknown',
            ...row
          }
        }
      })

    console.log(`Adding ${features.length} markers to map`)

    // Update GeoJSON source
    const source = map.current.getSource('data-points') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      })

      // Fit map to show all points
      if (features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        features.forEach(f => {
          bounds.extend(f.geometry.coordinates as [number, number])
        })

        map.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 250, left: 400, right: 80 },
          maxZoom: 12,
          duration: 1500
        })
      }
    }
  }, [isLoaded])

  // Handle row click in results table
  const handleRowClick = useCallback((row: any) => {
    const lat = row.lat ?? row.latitude ?? row.LATITUDE
    const lng = row.lng ?? row.longitude ?? row.LONGITUDE

    if (lat && lng && map.current) {
      map.current.flyTo({
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 10,
        duration: 1500
      })
    }
  }, [])

  // Handle "show on map" button
  const handleShowOnMap = useCallback((row: any) => {
    const lat = row.lat ?? row.latitude ?? row.LATITUDE
    const lng = row.lng ?? row.longitude ?? row.LONGITUDE
    const name = row.name ?? row.NAME ?? row.place ?? 'Location'

    if (lat && lng && map.current) {
      map.current.flyTo({
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 14,
        duration: 2000
      })

      // Add a popup
      new mapboxgl.Popup({ offset: 25 })
        .setLngLat([parseFloat(lng), parseFloat(lat)])
        .setHTML(`<div class="font-medium p-1">${name}</div>`)
        .addTo(map.current)
    }
  }, [])

  // Handle opening document panel
  const handleOpenDocumentPanel = useCallback((mode: DocumentPanelMode, data: any) => {
    openDocumentPanel(mode, data)
  }, [openDocumentPanel])

  // Handle opening bottom panel for large results
  const handleOpenBottomPanel = useCallback((results: QueryResult) => {
    setQueryResults(results)
    setIsPanelOpen(true)
  }, [])

  // Handle expand to bottom from document panel
  const handleExpandToBottom = useCallback(() => {
    if (documentPanelData) {
      setQueryResults(documentPanelData)
      setIsPanelOpen(true)
      closeDocumentPanel()
    }
  }, [documentPanelData, closeDocumentPanel])

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-950 flex">
      {/* Left Chat Panel - 480px */}
      <aside className="w-[480px] h-full flex-shrink-0 border-r border-gray-800 z-20">
        <EnhancedChatPanel
          onOpenDocumentPanel={handleOpenDocumentPanel}
          onOpenBottomPanel={handleOpenBottomPanel}
          onShowOnMap={handleShowOnMap}
        />
      </aside>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapContainer}
          className="absolute inset-0 w-full h-full"
        />

        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-20">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map Attribution Override - Move to top right */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs text-gray-600 bg-gray-900/80 px-2 py-1 rounded">
            Map data &copy; CARTO, &copy; OpenStreetMap contributors
          </span>
        </div>

        {/* Document Slide Panel - Right of Chat */}
        <DocumentSlidePanel
          isOpen={documentPanelMode !== null}
          mode={documentPanelMode}
          data={documentPanelData}
          onClose={closeDocumentPanel}
          onExpandToBottom={handleExpandToBottom}
        />
      </div>

      {/* Bottom Data Analysis Panel */}
      <DataAnalysisPanel
        results={queryResults}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onRowClick={handleRowClick}
        onShowOnMap={handleShowOnMap}
      />
    </div>
  )
}
