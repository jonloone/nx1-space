'use client'

import React, { useState, forwardRef } from 'react'
import { Sparkles } from 'lucide-react'
import styles from './copilot-custom.module.css'
import AIChatPanel, { ChatMessage, AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { getInvestigationCommandHandler } from '@/lib/services/investigationCommandHandler'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { useMapStore } from '@/lib/stores/mapStore'
import { usePanelStore } from '@/lib/stores/panelStore'
import { getAIContext, formatContextForAI } from '@/lib/services/aiContextService'

interface CopilotSidebarWrapperProps {
  className?: string
  onAction?: (action: string, data: any) => void
}

/**
 * CopilotSidebarWrapper Component
 *
 * Premium AI chat interface with Citizens 360 artifact support
 * Features:
 * - Full-height sidebar (420px width)
 * - Project blue (#1D48E5) accent colors
 * - Rich artifact rendering (Subject Profiles, Timelines, Intelligence Analysis)
 * - Investigation command processing
 * - Map action integration
 * - Direct integration with /api/copilot endpoint
 * - Ref forwarding for programmatic message injection
 */
const CopilotSidebarWrapper = forwardRef<AIChatPanelRef, CopilotSidebarWrapperProps>(
  function CopilotSidebarWrapper({ className = '', onAction }, ref) {
  const [isLoading, setIsLoading] = useState(false)
  const { pushArtifact } = useAnalysisStore()
  const mapStore = useMapStore()
  const analysisStore = useAnalysisStore()
  const panelStore = usePanelStore()

  const handleQuery = async (query: string): Promise<ChatMessage> => {
    setIsLoading(true)

    try {
      // Gather current application context for AI awareness
      const context = getAIContext(mapStore, analysisStore, panelStore)
      const contextMessage = formatContextForAI(context)
      console.log('📍 Current context for AI:', contextMessage)
      // First, check if this is an investigation command
      const investigationHandler = getInvestigationCommandHandler()
      const command = investigationHandler.parseQuery(query)

      if (command) {
        console.log('🔍 Processing investigation command:', command.type)
        const messages = await investigationHandler.executeCommand(command)

        // Process map actions for all messages
        const { getMapActionHandler } = await import('@/lib/services/mapActionHandler')
        const { useMapStore } = await import('@/lib/stores/mapStore')
        const mapHandler = getMapActionHandler()
        const mapStore = useMapStore.getState()
        const mapInstance = mapStore.map

        if (mapInstance) {
          for (const message of messages) {
            if (message.mapAction) {
              console.log('🗺️ Processing map action:', message.mapAction.type)
              const action = message.mapAction

              switch (action.type) {
                case 'flyTo':
                  if (action.coordinates) {
                    mapInstance.flyTo({
                      center: action.coordinates,
                      zoom: action.zoom || 12,
                      pitch: action.pitch || 0,
                      bearing: action.bearing || 0,
                      essential: true,
                      duration: 2000
                    })
                  }
                  break

                case 'addMarkers':
                  if (action.markers) {
                    // Add markers to map using mapbox markers
                    action.markers.forEach(marker => {
                      const el = document.createElement('div')
                      el.className = 'alert-marker'
                      el.style.width = '24px'
                      el.style.height = '24px'
                      el.style.borderRadius = '50%'
                      el.style.cursor = 'pointer'

                      // Color by priority
                      const priority = marker.properties?.priority || 'medium'
                      el.style.backgroundColor = priority === 'critical' ? '#ef4444' :
                                                  priority === 'high' ? '#f97316' : '#3b82f6'
                      el.style.border = '2px solid white'
                      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

                      const mapboxgl = (window as any).mapboxgl
                      if (mapboxgl) {
                        new mapboxgl.Marker(el)
                          .setLngLat(marker.coordinates)
                          .addTo(mapInstance)
                      }
                    })
                  }
                  break
              }
            }
          }
        }

        // Push artifacts to analysis store for each message
        messages.forEach(message => {
          if (message.artifact) {
            pushArtifact(message.artifact, message.id)
          }
        })

        // Return the first message (multiple messages will be displayed via artifact system)
        return messages[0]
      }

      // If not an investigation command, use the LLM copilot endpoint
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: query
          }],
          context: contextMessage // Include current application context
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Extract assistant message from OpenAI-format response
      let assistantContent = data.choices?.[0]?.message?.content || 'No response generated'

      // Execute tool call on client side if present
      if (data.toolCall && onAction) {
        const { tool, params } = data.toolCall
        console.log('🔧 Executing tool client-side:', tool, params)

        // Import and execute the map action handler
        const { getMapActionHandler } = await import('@/lib/services/mapActionHandler')
        const handler = getMapActionHandler()

        let result: any = null

        try {
          // Execute the appropriate action client-side where we have map access
          switch (tool) {
            case 'searchPlaces':
              result = await handler.handleSearchNearLocation(
                params.location,
                params.categories || [],
                params.radius || 5000
              )
              break

            case 'flyToLocation':
              result = await handler.handleFlyTo(params.location, params.zoom)
              break

            case 'showNearby':
              result = await handler.handleSearchInViewport(
                params.categories,
                params.radius || 5000
              )
              break

            case 'analyzeArea':
              result = await handler.handleAnalyzeArea(
                params.location,
                params.radius || 10000
              )
              break

            case 'showBuildings':
              result = await handler.handleShowBuildings(params.enable3D || false)
              break

            case 'toggleLayer':
              result = await handler.handleToggleLayer(
                params.layerName,
                params.visible !== false // Default to true if not specified
              )
              break

            case 'showWeather':
              result = await handler.handleShowWeather(params.weatherType)
              break

            case 'analyzeRoute': {
              // Import route analysis service
              const { getRouteAnalysisService } = await import('@/lib/services/routeAnalysisService')
              const routeService = getRouteAnalysisService()

              // Geocode locations
              const fromCoords = await handler.geocodeLocation(params.fromLocation)
              const toCoords = await handler.geocodeLocation(params.toLocation)

              if (!fromCoords || !toCoords) {
                throw new Error('Could not geocode locations')
              }

              // Generate route analysis
              const analysis = await routeService.generateAnalyzedRoute({
                from: fromCoords,
                to: toCoords,
                mode: params.mode || 'driving',
                startTime: params.startTime ? new Date(params.startTime) : new Date()
              })

              // Open panel with results
              panelStore.openRightPanel('route-analysis', analysis)

              result = {
                message: `✅ Route analysis complete. Risk level: ${analysis.riskAssessment.riskLevel}. ${analysis.anomalyDetection.anomalyCount} anomalies detected.`,
                action: 'showRoute',
                data: analysis
              }
              break
            }

            case 'analyzeImagery': {
              // Import imagery analysis services
              const { getSatelliteImageryService } = await import('@/lib/services/satelliteImageryService')
              const { getImageryAnalysisService } = await import('@/lib/services/imageryAnalysisService')

              const imageryService = getSatelliteImageryService()
              const analysisService = getImageryAnalysisService()

              // Geocode location
              const coords = await handler.geocodeLocation(params.location)
              if (!coords) {
                throw new Error('Could not geocode location')
              }

              // Parse dates or use defaults
              const startDate = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              const endDate = params.endDate ? new Date(params.endDate) : new Date()

              // Get time series imagery
              const timeSeries = await imageryService.getTimeSeries(coords, startDate, endDate)

              let panelData: any = { type: 'activity-analysis' }

              // Run change detection if requested
              if (params.includeChangeDetection && timeSeries.images.length >= 2) {
                const changeDetection = await analysisService.detectChanges({
                  beforeImage: timeSeries.images[0],
                  afterImage: timeSeries.images[timeSeries.images.length - 1],
                  sensitivity: 'medium'
                })
                panelData = { type: 'change-detection', changeDetection }
              }

              // Run activity analysis if requested
              if (params.includeActivity) {
                const activityAnalysis = await analysisService.analyzeActivity(timeSeries, params.location)
                panelData = { type: 'activity-analysis', activityAnalysis }
              }

              // Open panel with results
              panelStore.openRightPanel('imagery-analysis', panelData)

              result = {
                message: `✅ Satellite imagery analysis complete for ${params.location}.`,
                action: 'showImagery',
                data: panelData
              }
              break
            }

            case 'analyzeIsochrone': {
              // Import isochrone analysis service
              const { getIsochroneAnalysisService } = await import('@/lib/services/isochroneAnalysisService')
              const isochroneService = getIsochroneAnalysisService()

              // Geocode location
              const coords = await handler.geocodeLocation(params.location)
              if (!coords) {
                throw new Error('Could not geocode location')
              }

              // Generate isochrone analysis
              const analysis = await isochroneService.analyzeReachability({
                center: coords,
                locationName: params.location,
                modes: params.modes || ['driving', 'walking', 'cycling'],
                contours: params.contours || [15, 30, 45],
                analysisType: 'strategic'
              })

              // Open panel with results
              panelStore.openRightPanel('isochrone-analysis', analysis)

              result = {
                message: `✅ Reachability analysis complete. Accessibility level: ${analysis.accessibility.level}.`,
                action: 'showIsochrone',
                data: analysis
              }
              break
            }

            case 'analyzeMultiLayer': {
              // Import multi-layer analysis service
              const { getMultiLayerAnalysisService } = await import('@/lib/services/multiLayerAnalysisService')
              const multiService = getMultiLayerAnalysisService()

              // Geocode location
              const coords = await handler.geocodeLocation(params.location)
              if (!coords) {
                throw new Error('Could not geocode location')
              }

              // Prepare analysis options
              const analysisTypes = params.analysisTypes || ['all']
              const options: any = {
                center: coords,
                locationName: params.location,
                analysisTypes
              }

              // Add route options if provided
              if (params.routeFrom && params.routeTo) {
                const fromCoords = await handler.geocodeLocation(params.routeFrom)
                const toCoords = await handler.geocodeLocation(params.routeTo)
                if (fromCoords && toCoords) {
                  options.route = {
                    from: fromCoords,
                    to: toCoords,
                    mode: 'driving'
                  }
                }
              }

              // Add imagery options
              options.imagery = {
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                includeChangeDetection: true,
                includeActivityAnalysis: true
              }

              // Add isochrone options
              options.isochrone = {
                modes: ['driving', 'walking'],
                contours: [15, 30]
              }

              // Generate multi-layer analysis
              const analysis = await multiService.analyzeLocation(options)

              // Open panel with results
              panelStore.openRightPanel('unified-analysis', analysis)

              result = {
                message: `✅ Multi-layer intelligence analysis complete. Overall risk: ${analysis.integration.riskLevel} (${analysis.integration.overallRiskScore}/100).`,
                action: 'showUnifiedAnalysis',
                data: analysis
              }
              break
            }
          }

          if (result) {
            // Execute the map action (flyTo, show places, etc.)
            if (result.action && result.data && onAction) {
              onAction(result.action, result.data)
            }

            // Use the result message instead of pending message
            assistantContent = result.message
          }
        } catch (error) {
          console.error('Tool execution error:', error)
          assistantContent = 'Error executing action. Please try again.'
        }
      }

      // Return as ChatMessage
      return {
        id: data.id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Failed to process query:', error)

      // Return error message
      return {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${styles.copilotSidebar} ${className}`}>
      <AIChatPanel
        ref={ref}
        onQuery={handleQuery}
        isLoading={isLoading}
        placeholder="Ask about investigations, search locations, or analyze patterns..."
      />
    </div>
  )
})

export default CopilotSidebarWrapper
