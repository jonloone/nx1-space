'use client'

/**
 * Maritime Intelligence Page
 *
 * Unified chat-first interface for AIS/maritime data exploration.
 *
 * Layout:
 * - Left panel (400px): Full-height chat with query input and results
 * - Right panel (flex): Map visualization (top) + Data table/charts (bottom)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MaritimeChatPanel from '@/components/maritime/MaritimeChatPanel'
import ArtifactPanel from '@/components/maritime/ArtifactPanel'
import { KATTEGAT_BOUNDS } from '@/lib/types/ais-anomaly'

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

// ============================================================================
// Types
// ============================================================================

export interface MaritimeQueryResult {
  type: 'vessels' | 'anomalies' | 'routes' | 'ports' | 'statistics' | 'track'
  data: any[]
  columns: string[]
  summary: string
  mapFeatures?: GeoJSON.FeatureCollection
  chartData?: {
    type: 'bar' | 'pie' | 'line' | 'heatmap'
    data: any
    config?: any
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
  queryPreview?: string
  result?: MaritimeQueryResult
}

// ============================================================================
// Component
// ============================================================================

export default function MaritimeIntelPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentResult, setCurrentResult] = useState<MaritimeQueryResult | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [tableHeight, setTableHeight] = useState<'collapsed' | 'default' | 'expanded'>('collapsed')

  // Initialize map with Kattegat region
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: KATTEGAT_BOUNDS.center,
      zoom: 7,
      pitch: 0,
      bearing: 0,
      antialias: true
    })

    map.current = mapInstance

    mapInstance.on('load', () => {
      setIsMapLoaded(true)

      // Add vessel source (empty initially)
      mapInstance.addSource('vessels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })

      // Vessel markers layer
      mapInstance.addLayer({
        id: 'vessel-markers',
        type: 'circle',
        source: 'vessels',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            5, 4,
            10, 8,
            15, 12
          ],
          'circle-color': [
            'match', ['get', 'type'],
            'cargo', '#3b82f6',
            'tanker', '#f59e0b',
            'passenger', '#10b981',
            'fishing', '#8b5cf6',
            '#6b7280'
          ],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      // Add anomaly source
      mapInstance.addSource('anomalies', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })

      // Anomaly markers layer
      mapInstance.addLayer({
        id: 'anomaly-markers',
        type: 'circle',
        source: 'anomalies',
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'match', ['get', 'anomalyType'],
            'AIS_GAP', '#ef4444',
            'LOITERING', '#f97316',
            'RENDEZVOUS', '#a855f7',
            'SPEED_ANOMALY', '#eab308',
            'COURSE_DEVIATION', '#06b6d4',
            '#ef4444'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      // Add track source
      mapInstance.addSource('tracks', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })

      // Track line layer
      mapInstance.addLayer({
        id: 'track-lines',
        type: 'line',
        source: 'tracks',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })

      // Click handlers
      mapInstance.on('click', 'vessel-markers', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties
          setSelectedFeature({
            type: 'vessel',
            ...props
          })
        }
      })

      mapInstance.on('click', 'anomaly-markers', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties
          setSelectedFeature({
            type: 'anomaly',
            ...props
          })
        }
      })

      // Cursor changes
      mapInstance.on('mouseenter', 'vessel-markers', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })
      mapInstance.on('mouseleave', 'vessel-markers', () => {
        mapInstance.getCanvas().style.cursor = ''
      })
      mapInstance.on('mouseenter', 'anomaly-markers', () => {
        mapInstance.getCanvas().style.cursor = 'pointer'
      })
      mapInstance.on('mouseleave', 'anomaly-markers', () => {
        mapInstance.getCanvas().style.cursor = ''
      })
    })

    return () => {
      mapInstance.remove()
    }
  }, [])

  // Update map when result changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !currentResult?.mapFeatures) return

    const source = map.current.getSource('vessels') as mapboxgl.GeoJSONSource
    if (source && currentResult.type === 'vessels') {
      source.setData(currentResult.mapFeatures)

      // Fit to bounds if we have features
      if (currentResult.mapFeatures.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        currentResult.mapFeatures.features.forEach(f => {
          if (f.geometry.type === 'Point') {
            bounds.extend(f.geometry.coordinates as [number, number])
          }
        })
        map.current?.fitBounds(bounds, { padding: 100, maxZoom: 12 })
      }
    }

    const anomalySource = map.current.getSource('anomalies') as mapboxgl.GeoJSONSource
    if (anomalySource && currentResult.type === 'anomalies') {
      anomalySource.setData(currentResult.mapFeatures)
    }

    const trackSource = map.current.getSource('tracks') as mapboxgl.GeoJSONSource
    if (trackSource && currentResult.type === 'track') {
      trackSource.setData(currentResult.mapFeatures)
    }
  }, [currentResult, isMapLoaded])

  // Handle query submission from chat
  const handleQuerySubmit = useCallback(async (query: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    const loadingMessage: ChatMessage = {
      id: `msg-${Date.now()}-loading`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      queryPreview: generateQueryPreview(query)
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])

    try {
      // Process the query
      const result = await processMaritimeQuery(query)

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: result.summary,
        timestamp: new Date(),
        queryPreview: generateQueryPreview(query),
        result
      }

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage))
      setCurrentResult(result)

      // Expand table if we have data
      if (result.data.length > 0) {
        setTableHeight('default')
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage))
    }
  }, [])

  // Handle row selection in table
  const handleRowSelect = useCallback((row: any) => {
    setSelectedFeature(row)

    // Fly to location if coordinates exist
    if (map.current && row.latitude && row.longitude) {
      map.current.flyTo({
        center: [row.longitude, row.latitude],
        zoom: 10,
        duration: 1500
      })
    }
  }, [])

  // Handle table height toggle
  const handleTableToggle = useCallback(() => {
    setTableHeight(prev => {
      if (prev === 'collapsed') return 'default'
      if (prev === 'default') return 'expanded'
      return 'collapsed'
    })
  }, [])

  // Handle table close
  const handleTableClose = useCallback(() => {
    setTableHeight('collapsed')
  }, [])

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-950 flex">
      {/* Left: Chat Panel */}
      <aside className="w-[400px] h-full flex-shrink-0 border-r border-gray-800 z-20">
        <MaritimeChatPanel
          messages={messages}
          onSubmit={handleQuerySubmit}
          selectedFeature={selectedFeature}
        />
      </aside>

      {/* Right: Artifact Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

          {/* Loading overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading Kattegat Strait...</p>
              </div>
            </div>
          )}

          {/* Region indicator */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
              <div className="text-xs text-gray-400">Region</div>
              <div className="text-sm font-medium text-white">Kattegat Strait</div>
              <div className="text-xs text-gray-500">Denmark / Sweden</div>
            </div>
          </div>

          {/* Map attribution */}
          <div className="absolute top-4 right-4 z-10">
            <span className="text-xs text-gray-600 bg-gray-900/80 px-2 py-1 rounded">
              Map &copy; Mapbox, OpenStreetMap
            </span>
          </div>
        </div>

        {/* Data Table / Charts Panel */}
        <ArtifactPanel
          result={currentResult}
          height={tableHeight}
          onToggleHeight={handleTableToggle}
          onClose={handleTableClose}
          onRowSelect={handleRowSelect}
          selectedRow={selectedFeature}
        />
      </main>
    </div>
  )
}

// ============================================================================
// Query Processing
// ============================================================================

/**
 * Generate natural language preview of what the query is doing
 */
function generateQueryPreview(query: string): string {
  const lower = query.toLowerCase()

  if (lower.includes('vessel') || lower.includes('ship')) {
    if (lower.includes('cargo')) return 'Finding cargo vessels in the Kattegat region...'
    if (lower.includes('tanker')) return 'Finding tanker vessels in the Kattegat region...'
    if (lower.includes('fishing')) return 'Finding fishing vessels in the Kattegat region...'
    if (lower.includes('all')) return 'Loading all vessels in the Kattegat region...'
    return 'Searching for vessels matching your criteria...'
  }

  if (lower.includes('anomal') || lower.includes('suspicious')) {
    if (lower.includes('gap') || lower.includes('dark')) return 'Detecting AIS gap anomalies (dark vessels)...'
    if (lower.includes('loiter')) return 'Finding loitering vessels outside ports...'
    if (lower.includes('rendezvous') || lower.includes('meeting')) return 'Detecting ship-to-ship meetings...'
    if (lower.includes('speed')) return 'Finding speed anomalies...'
    return 'Running anomaly detection algorithms...'
  }

  if (lower.includes('route')) return 'Analyzing shipping routes...'
  if (lower.includes('port')) return 'Querying port activity data...'
  if (lower.includes('track') || lower.includes('history')) return 'Reconstructing vessel track history...'
  if (lower.includes('density') || lower.includes('traffic')) return 'Calculating traffic density...'
  if (lower.includes('statistic') || lower.includes('breakdown')) return 'Computing statistics...'

  return 'Processing your query...'
}

/**
 * Process maritime query and return results
 */
async function processMaritimeQuery(query: string): Promise<MaritimeQueryResult> {
  const lower = query.toLowerCase()

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Vessel queries
  if (lower.includes('vessel') || lower.includes('ship') || lower.includes('all vessels')) {
    return generateVesselResults(query)
  }

  // Anomaly queries
  if (lower.includes('anomal') || lower.includes('suspicious') || lower.includes('gap') ||
      lower.includes('dark') || lower.includes('loiter') || lower.includes('rendezvous')) {
    return generateAnomalyResults(query)
  }

  // Port queries
  if (lower.includes('port')) {
    return generatePortResults(query)
  }

  // Statistics queries
  if (lower.includes('statistic') || lower.includes('breakdown') || lower.includes('distribution')) {
    return generateStatisticsResults(query)
  }

  // Default to vessel search
  return generateVesselResults(query)
}

/**
 * Generate demo vessel results
 */
function generateVesselResults(query: string): MaritimeQueryResult {
  const lower = query.toLowerCase()

  // Demo vessel data for Kattegat
  const allVessels = [
    { mmsi: '219000001', name: 'MAERSK NAVIGATOR', type: 'cargo', speed: 12.5, heading: 45, latitude: 57.2, longitude: 11.5, status: 'underway', flag: 'Denmark' },
    { mmsi: '265000002', name: 'STENA SCANDICA', type: 'passenger', speed: 18.2, heading: 270, latitude: 56.8, longitude: 12.1, status: 'underway', flag: 'Sweden' },
    { mmsi: '219000003', name: 'NORDIC FISHER', type: 'fishing', speed: 3.5, heading: 180, latitude: 57.5, longitude: 10.8, status: 'fishing', flag: 'Denmark' },
    { mmsi: '265000004', name: 'BALTIC TANKER', type: 'tanker', speed: 10.8, heading: 90, latitude: 56.5, longitude: 11.2, status: 'underway', flag: 'Sweden' },
    { mmsi: '219000005', name: 'COPENHAGEN TUG', type: 'tug', speed: 8.0, heading: 315, latitude: 57.0, longitude: 10.5, status: 'underway', flag: 'Denmark' },
    { mmsi: '265000006', name: 'GOTHENBURG EXPRESS', type: 'cargo', speed: 14.2, heading: 60, latitude: 57.4, longitude: 11.8, status: 'underway', flag: 'Sweden' },
    { mmsi: '219000007', name: 'KATTEGAT SUPPLY', type: 'cargo', speed: 0, heading: 0, latitude: 56.7, longitude: 10.9, status: 'anchored', flag: 'Denmark' },
    { mmsi: '265000008', name: 'SCANDINAVIAN STAR', type: 'passenger', speed: 20.5, heading: 225, latitude: 57.1, longitude: 11.3, status: 'underway', flag: 'Sweden' },
  ]

  // Filter based on query
  let filtered = allVessels
  if (lower.includes('cargo')) filtered = allVessels.filter(v => v.type === 'cargo')
  else if (lower.includes('tanker')) filtered = allVessels.filter(v => v.type === 'tanker')
  else if (lower.includes('passenger')) filtered = allVessels.filter(v => v.type === 'passenger')
  else if (lower.includes('fishing')) filtered = allVessels.filter(v => v.type === 'fishing')

  if (lower.includes('fast') || lower.includes('speed > 10') || lower.includes('> 10 knots')) {
    filtered = filtered.filter(v => v.speed > 10)
  }
  if (lower.includes('anchor') || lower.includes('stationary')) {
    filtered = filtered.filter(v => v.status === 'anchored' || v.speed < 1)
  }

  const mapFeatures: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: filtered.map(v => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [v.longitude, v.latitude] },
      properties: v
    }))
  }

  return {
    type: 'vessels',
    data: filtered,
    columns: ['MMSI', 'Name', 'Type', 'Speed (kts)', 'Heading', 'Status', 'Flag'],
    summary: `Found **${filtered.length} vessels** in the Kattegat region. ${filtered.filter(v => v.speed > 10).length} are currently moving at >10 knots.`,
    mapFeatures
  }
}

/**
 * Generate demo anomaly results
 */
function generateAnomalyResults(query: string): MaritimeQueryResult {
  const lower = query.toLowerCase()

  const allAnomalies = [
    { id: 'A001', type: 'AIS_GAP', vessel: 'UNKNOWN-001', mmsi: '219999001', severity: 'high', duration: '2h 15m', latitude: 57.3, longitude: 11.0, timestamp: '2024-01-15 14:30', description: 'Vessel went dark for 2+ hours in open water' },
    { id: 'A002', type: 'LOITERING', vessel: 'NORDIC FISHER', mmsi: '219000003', severity: 'medium', duration: '4h 30m', latitude: 57.1, longitude: 10.7, timestamp: '2024-01-15 10:00', description: 'Stationary outside designated fishing zone' },
    { id: 'A003', type: 'RENDEZVOUS', vessel: 'CARGO-X / TANKER-Y', mmsi: '219000001', severity: 'high', duration: '45m', latitude: 56.9, longitude: 11.4, timestamp: '2024-01-15 02:15', description: 'Ship-to-ship meeting in open water at night' },
    { id: 'A004', type: 'SPEED_ANOMALY', vessel: 'BALTIC TANKER', mmsi: '265000004', severity: 'low', duration: '5m', latitude: 56.6, longitude: 11.1, timestamp: '2024-01-15 16:45', description: 'Sudden deceleration from 12 to 3 knots' },
    { id: 'A005', type: 'COURSE_DEVIATION', vessel: 'GOTHENBURG EXPRESS', mmsi: '265000006', severity: 'medium', duration: '15m', latitude: 57.2, longitude: 11.6, timestamp: '2024-01-15 08:20', description: '45-degree course change outside shipping lane' },
  ]

  // Filter based on query
  let filtered = allAnomalies
  if (lower.includes('gap') || lower.includes('dark')) filtered = allAnomalies.filter(a => a.type === 'AIS_GAP')
  else if (lower.includes('loiter')) filtered = allAnomalies.filter(a => a.type === 'LOITERING')
  else if (lower.includes('rendezvous') || lower.includes('meeting')) filtered = allAnomalies.filter(a => a.type === 'RENDEZVOUS')
  else if (lower.includes('speed')) filtered = allAnomalies.filter(a => a.type === 'SPEED_ANOMALY')
  else if (lower.includes('course')) filtered = allAnomalies.filter(a => a.type === 'COURSE_DEVIATION')

  if (lower.includes('high') || lower.includes('critical')) {
    filtered = filtered.filter(a => a.severity === 'high' || a.severity === 'critical')
  }

  const mapFeatures: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: filtered.map(a => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
      properties: { ...a, anomalyType: a.type }
    }))
  }

  const highSeverity = filtered.filter(a => a.severity === 'high' || a.severity === 'critical').length

  return {
    type: 'anomalies',
    data: filtered,
    columns: ['ID', 'Type', 'Vessel', 'Severity', 'Duration', 'Timestamp', 'Description'],
    summary: `Detected **${filtered.length} anomalies** in the analysis period. ${highSeverity} are high severity requiring attention.`,
    mapFeatures
  }
}

/**
 * Generate demo port results
 */
function generatePortResults(query: string): MaritimeQueryResult {
  const ports = [
    { name: 'Gothenburg', country: 'Sweden', arrivals: 45, departures: 42, avgDwell: '18h', congestion: 'low', latitude: 57.7089, longitude: 11.9670 },
    { name: 'Aarhus', country: 'Denmark', arrivals: 32, departures: 35, avgDwell: '12h', congestion: 'medium', latitude: 56.1629, longitude: 10.2134 },
    { name: 'Frederikshavn', country: 'Denmark', arrivals: 28, departures: 26, avgDwell: '8h', congestion: 'low', latitude: 57.4407, longitude: 10.5364 },
    { name: 'Varberg', country: 'Sweden', arrivals: 15, departures: 18, avgDwell: '24h', congestion: 'low', latitude: 57.1059, longitude: 12.2502 },
  ]

  return {
    type: 'ports',
    data: ports,
    columns: ['Port', 'Country', 'Arrivals (24h)', 'Departures (24h)', 'Avg Dwell', 'Congestion'],
    summary: `Showing activity for **${ports.length} major ports** in the Kattegat region. Gothenburg has the highest traffic.`,
    chartData: {
      type: 'bar',
      data: ports.map(p => ({ name: p.name, arrivals: p.arrivals, departures: p.departures })),
      config: { xKey: 'name', yKeys: ['arrivals', 'departures'] }
    }
  }
}

/**
 * Generate demo statistics results
 */
function generateStatisticsResults(query: string): MaritimeQueryResult {
  const stats = [
    { category: 'Cargo', count: 45, percentage: 35 },
    { category: 'Tanker', count: 28, percentage: 22 },
    { category: 'Passenger', count: 18, percentage: 14 },
    { category: 'Fishing', count: 22, percentage: 17 },
    { category: 'Other', count: 15, percentage: 12 },
  ]

  return {
    type: 'statistics',
    data: stats,
    columns: ['Category', 'Count', 'Percentage'],
    summary: `Vessel type distribution: **Cargo vessels** are most common (35%), followed by tankers (22%).`,
    chartData: {
      type: 'pie',
      data: stats,
      config: { nameKey: 'category', valueKey: 'count' }
    }
  }
}
