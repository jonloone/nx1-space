'use client'

import React, { useEffect } from 'react'
import { useChatStore, getContextualSuggestions } from '@/lib/stores/chatStore'
import { useMapStore } from '@/lib/stores/mapStore'
import { usePanelStore } from '@/lib/stores/panelStore'
import { getIntentClassifier } from '@/lib/services/intentClassifier'
import { getQueryHandlerRegistry } from '@/lib/services/queryHandlerRegistry'
import ChatInput from './ChatInput'
import ChatHistory from './ChatHistory'

interface ChatContainerProps {
  className?: string
  onAction?: (action: string, data: any) => void
}

/**
 * ChatContainer Component
 *
 * Integrates chat input, history, and query processing
 * Connects chat to intent classification and query handlers
 */
export default function ChatContainer({
  className = "",
  onAction
}: ChatContainerProps) {
  const {
    addMessage,
    setLoading,
    updateContext,
    context,
    setSuggestions,
    messages
  } = useChatStore()

  const {
    getViewportContext,
    getEnabledLayers,
    getSelectedFeatureIds,
    flyTo
  } = useMapStore()

  const { openPanel } = usePanelStore()

  // Update chat context when viewport changes
  useEffect(() => {
    const viewport = getViewportContext()
    const enabledLayers = getEnabledLayers()
    const selectedFeatures = getSelectedFeatureIds()

    updateContext({
      viewport,
      enabledLayers,
      selectedFeatures
    })

    // Update contextual suggestions
    const newSuggestions = getContextualSuggestions(context)
    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions)
    }
  }, [getViewportContext, getEnabledLayers, getSelectedFeatureIds])

  /**
   * Handle query submission
   */
  const handleSubmit = async (query: string) => {
    console.log('📝 User query:', query)

    // Add user message
    addMessage({
      role: 'user',
      content: query
    })

    setLoading(true)

    try {
      // Step 1: Classify intent
      const classifier = getIntentClassifier()
      const intent = await classifier.classifyIntent(query, context)

      console.log('🎯 Classified intent:', intent.type, `(${(intent.confidence * 100).toFixed(0)}%)`)

      // Step 2: Handle query
      const registry = getQueryHandlerRegistry()
      const response = await registry.handle(intent, context)

      console.log('✅ Query response:', response)

      // Step 3: Add assistant message
      addMessage({
        role: 'assistant',
        content: response.message,
        intent
      })

      // Step 4: Update suggestions
      if (response.suggestions) {
        setSuggestions(response.suggestions)
      }

      // Step 5: Execute action (if any)
      if (response.action && response.data) {
        await executeAction(response.action, response.data)
      }

    } catch (error) {
      console.error('❌ Query error:', error)

      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again.',
        error: true
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Execute action based on query handler response
   */
  const executeAction = async (action: string, data: any) => {
    switch (action) {
      case 'fly-to':
        if (data.coordinates) {
          flyTo(data.coordinates[0], data.coordinates[1], 14)
        }
        break

      case 'toggle-layer':
        // Will be implemented in Phase 3
        console.log('Toggle layer:', data.layer, data.enable ? 'ON' : 'OFF')
        break

      case 'open-panel':
        // Open bottom panel with appropriate content
        handleOpenPanel(data)
        break

      case 'load-template':
        // Notify parent to load template
        onAction?.('load-template', data)
        break

      case 'show-help':
        // Help is already shown in message
        break

      default:
        console.warn('Unknown action:', action)
    }
  }

  /**
   * Handle opening panels based on data type
   */
  const handleOpenPanel = (data: any) => {
    console.log('🔷 Opening panel:', data.type)

    switch (data.type) {
      case 'search-results':
        // Open search results panel
        openPanel({
          type: 'search-results',
          data: {
            query: data.query || '',
            results: data.results || [],
            total: data.total || 0
          }
        }, 'medium')
        break

      case 'poi-context':
        // Open POI context panel
        openPanel({
          type: 'poi-context',
          data: {
            poi: data.poi
          }
        }, 'collapsed')
        break

      case 'intelligence-analysis':
        // Open intelligence analysis panel
        openPanel({
          type: 'intelligence-analysis',
          data: {
            riskScore: data.riskScore || 0,
            insights: data.insights || [],
            locationCount: data.locationCount,
            suspiciousCount: data.suspiciousCount
          }
        }, 'medium')
        break

      case 'timeline':
        // Open timeline panel
        openPanel({
          type: 'timeline',
          data: data
        }, 'medium')
        break

      case 'document':
        // Open document panel
        openPanel({
          type: 'document',
          data: data
        }, 'expanded')
        break

      case 'help':
        // Open help panel
        openPanel({
          type: 'help',
          data: data
        }, 'medium')
        break

      default:
        console.warn('Unknown panel type:', data.type)
        // Fallback to generic panel
        openPanel({
          type: data.type || 'search-results',
          data: data
        }, 'medium')
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat History (scrollable, takes available space with proper padding) */}
      {messages.length > 0 ? (
        <div className="flex-1 overflow-hidden px-4 pt-6 pb-4">
          <ChatHistory className="h-full" maxHeight="100%" />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-4xl">💬</div>
            <h3 className="text-lg font-medium text-foreground">How can I help you today?</h3>
            <p className="text-sm text-muted-foreground">
              Ask me to search locations, analyze patterns, or explore map data
            </p>
          </div>
        </div>
      )}

      {/* Chat Input (fixed at bottom with proper padding) */}
      <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border/50">
        <ChatInput
          onSubmit={handleSubmit}
          placeholder="Ask anything or search places..."
        />
      </div>
    </div>
  )
}
