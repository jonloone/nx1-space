'use client'

import React, { useState, forwardRef } from 'react'
import { Sparkles } from 'lucide-react'
import styles from './copilot-custom.module.css'
import AIChatPanel, { ChatMessage, AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { getInvestigationCommandHandler } from '@/lib/services/investigationCommandHandler'
import { useAnalysisStore } from '@/lib/stores/analysisStore'

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

  const handleQuery = async (query: string): Promise<ChatMessage> => {
    setIsLoading(true)

    try {
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
          }]
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
