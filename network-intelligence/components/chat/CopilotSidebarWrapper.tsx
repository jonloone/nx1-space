'use client'

import React, { useState, forwardRef, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import styles from './copilot-custom.module.css'
import AIChatPanel, { ChatMessage, AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { useMapStore } from '@/lib/stores/mapStore'
import { usePanelStore } from '@/lib/stores/panelStore'
import { getAIContext, formatContextForAI } from '@/lib/services/aiContextService'
import { AnalysisModeSwitcher } from '@/components/chat/AnalysisModeSwitcher'
import { getAvailableICDomains, type ICDomain } from '@/lib/config/icDomains'
import { type ICLayerId } from '@/lib/config/icLayers'
import { ICAnalysisHandler } from '@/lib/services/icAnalysisHandler'
import { getDomainLayerService } from '@/lib/services/domainLayerService'

interface CopilotSidebarWrapperProps {
  className?: string
  onAction?: (action: string, data: any) => void
  onDomainChange?: (domain: ICDomain | undefined, layers: ICLayerId[]) => void
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
  function CopilotSidebarWrapper({ className = '', onAction, onDomainChange }, ref) {
  const [isLoading, setIsLoading] = useState(false)
  // IC Domain & Layer State
  const [currentDomain, setCurrentDomain] = useState<ICDomain | undefined>(getAvailableICDomains()[0]) // Default to first available domain (Ground)
  const [currentLayers, setCurrentLayers] = useState<ICLayerId[]>([])
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
      console.log('🎯 Current IC domain:', currentDomain?.name, '| Layers:', currentLayers)

      // If no domain selected, prompt user to select one
      if (!currentDomain) {
        return {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Please select an operational domain (Ground, Maritime, or Space) before performing analysis.',
          timestamp: new Date()
        }
      }

      // Use IC Analysis Handler to process query
      const icResult = await ICAnalysisHandler.processQuery(query, currentDomain.id, currentLayers)
      console.log('🔧 IC Analysis result:', icResult)

      // If IC handler returned an error, show it to user
      if (!icResult.success && icResult.error) {
        return {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${icResult.message}\n\nTry one of these ${currentDomain.name} queries:\n${currentDomain.examples.slice(0, 3).map(ex => `• ${ex}`).join('\n')}`,
          timestamp: new Date()
        }
      }

      // If IC handler returned a tool call, use it directly
      if (icResult.toolCall) {
        // Import and execute the map action handler
        const { getMapActionHandler } = await import('@/lib/services/mapActionHandler')
        const handler = getMapActionHandler()

        let result: any = null

        try {
          // Execute the appropriate action client-side where we have map access
          const { tool, params } = icResult.toolCall
          console.log('🔧 Executing IC tool call:', tool, params)

          switch (tool) {
            case 'analyzeRoute': {
              // Route analysis from Ground domain
              try {
                const { getRouteAnalysisService } = await import('@/lib/services/routeAnalysisService')
                const routeService = getRouteAnalysisService()

                console.log('🔍 Geocoding locations:', params.fromLocation, params.toLocation)
                const fromCoords = await handler.geocodeLocation(params.fromLocation)
                const toCoords = await handler.geocodeLocation(params.toLocation)
                console.log('📍 Geocoded coordinates:', { from: fromCoords, to: toCoords })

                if (!fromCoords) {
                  throw new Error(`Could not find location: ${params.fromLocation}`)
                }
                if (!toCoords) {
                  throw new Error(`Could not find location: ${params.toLocation}`)
                }

                console.log('🛣️ Generating route analysis...')
                const analysis = await routeService.generateAnalyzedRoute({
                  from: fromCoords,
                  to: toCoords,
                  mode: params.mode || 'driving',
                  startTime: params.startTime ? new Date(params.startTime) : new Date()
                })

                const enhancedAnalysis = {
                  ...analysis,
                  from: { name: params.fromLocation, coordinates: fromCoords },
                  to: { name: params.toLocation, coordinates: toCoords }
                }

                panelStore.openRightPanel('route-analysis', enhancedAnalysis)

                result = {
                  message: `✅ Route analysis complete. Risk level: ${analysis.riskAssessment.riskLevel}. ${analysis.anomalyDetection.anomalyCount} anomalies detected.`,
                  action: 'showRoute',
                  data: enhancedAnalysis
                }
              } catch (error) {
                console.error('❌ Route analysis error:', error)
                result = {
                  message: `❌ Route analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  action: 'error',
                  success: false
                }
              }
              break
            }

            case 'analyzeImagery': {
              // Imagery analysis from Space domain
              const { getSatelliteImageryService } = await import('@/lib/services/satelliteImageryService')
              const { getImageryAnalysisService } = await import('@/lib/services/imageryAnalysisService')

              const imageryService = getSatelliteImageryService()
              const analysisService = getImageryAnalysisService()

              const coords = await handler.geocodeLocation(params.location)
              if (!coords) {
                throw new Error('Could not geocode location')
              }

              const startDate = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              const endDate = params.endDate ? new Date(params.endDate) : new Date()

              const timeSeries = await imageryService.getTimeSeries(coords, startDate, endDate)

              let panelData: any = { type: 'activity-analysis' }

              if (params.includeChangeDetection && timeSeries.images.length >= 2) {
                const changeDetection = await analysisService.detectChanges({
                  beforeImage: timeSeries.images[0],
                  afterImage: timeSeries.images[timeSeries.images.length - 1],
                  sensitivity: 'medium'
                })
                panelData = { type: 'change-detection', changeDetection }
              }

              if (params.includeActivity) {
                const activityAnalysis = await analysisService.analyzeActivity(timeSeries, params.location)
                panelData = { type: 'activity-analysis', activityAnalysis }
              }

              panelStore.openRightPanel('imagery-analysis', panelData)

              result = {
                message: `✅ Imagery analysis complete for ${params.location}`,
                action: 'showImagery',
                data: panelData
              }
              break
            }

            case 'searchPlaces':
              result = await handler.handleSearchNearLocation(
                params.location,
                params.categories || [],
                params.radius || 5000
              )
              break

            default:
              console.warn('Unknown IC tool call:', tool)
              result = {
                message: `Tool "${tool}" not yet implemented for IC analysis`,
                success: false
              }
          }

          // Return the IC result message
          return {
            id: Date.now().toString(),
            role: 'assistant',
            content: result?.message || icResult.message,
            timestamp: new Date()
          }
        } catch (error) {
          console.error('IC tool execution error:', error)
          return {
            id: Date.now().toString(),
            role: 'assistant',
            content: `❌ Error executing ${currentDomain.name} analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          }
        }
      }

      // No tool call from IC handler - return analysis message
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: icResult.message,
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

  // Apply default domain settings on map load
  useEffect(() => {
    if (!mapStore.map || !currentDomain) return

    console.log('🎯 Applying default domain on mount:', currentDomain.name)
    const domainLayerService = getDomainLayerService()
    domainLayerService.switchDomain(currentDomain.id, mapStore.map, {
      animateViewport: false,
      preserveUserLayers: false
    })
  }, [mapStore.map]) // Only run when map becomes available

  const handleDomainChange = (domain: ICDomain, layers: ICLayerId[]) => {
    setCurrentDomain(domain)
    setCurrentLayers(layers)

    // Trigger automatic layer switching for the new domain
    const domainLayerService = getDomainLayerService()
    domainLayerService.switchDomain(domain.id, mapStore.map, {
      animateViewport: false,  // Don't auto-zoom, let user control viewport
      preserveUserLayers: false  // Apply domain default layers
    })

    // Notify parent component of domain change
    onDomainChange?.(domain, layers)

    console.log(`🎯 Domain changed to: ${domain.name} | Layers:`, layers)
  }

  return (
    <div className={`${styles.copilotSidebar} ${className} flex flex-col`}>
      {/* IC Domain & Layer Switcher */}
      <div className="p-3 border-b border-gray-700">
        <AnalysisModeSwitcher
          currentDomain={currentDomain}
          currentLayers={currentLayers}
          onDomainChange={handleDomainChange}
          compact={true}
        />
      </div>

      {/* Chat Panel */}
      <div className="flex-1 overflow-hidden">
        <AIChatPanel
          ref={ref}
          onQuery={handleQuery}
          isLoading={isLoading}
          placeholder={currentDomain
            ? `${currentDomain.name}${currentLayers.length > 0 ? ` + ${currentLayers.length} layer(s)` : ''}: ${currentDomain.examples[0] || 'Enter query...'}`
            : 'Select an operational domain to begin...'
          }
        />
      </div>
    </div>
  )
})

export default CopilotSidebarWrapper
