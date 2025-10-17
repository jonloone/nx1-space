/**
 * Query Handler Registry
 *
 * Manages query handlers for different intent types
 * Routes classified intents to appropriate handlers
 */

import type { IntentResult, ExtractedEntity, ConversationContext } from '@/lib/stores/chatStore'

export interface QueryHandlerResponse {
  message: string
  action?: 'fly-to' | 'toggle-layer' | 'open-panel' | 'load-template' | 'show-help'
  data?: any
  suggestions?: string[]
}

export abstract class QueryHandler {
  abstract handle(
    intent: IntentResult,
    context: ConversationContext
  ): Promise<QueryHandlerResponse>
}

/**
 * Search Query Handler
 * Handles location searches and place queries
 */
export class SearchQueryHandler extends QueryHandler {
  async handle(intent: IntentResult, context: ConversationContext): Promise<QueryHandlerResponse> {
    console.log('🔍 Search handler:', intent.query)

    // Extract location or category entities
    const locationEntity = intent.entities.find(e => e.type === 'location')
    const categoryEntity = intent.entities.find(e => e.type === 'category')

    if (locationEntity) {
      // Specific location search
      return {
        message: `Searching for ${locationEntity.value}...`,
        action: 'fly-to',
        data: {
          type: 'location',
          name: locationEntity.value,
          coordinates: locationEntity.coordinates
        },
        suggestions: [
          "What's nearby?",
          "Show timeline",
          "Analyze this location"
        ]
      }
    }

    if (categoryEntity) {
      // Category search (hospitals, restaurants, etc.)
      return {
        message: `Finding ${categoryEntity.value}s in this area...`,
        action: 'open-panel',
        data: {
          type: 'search-results',
          category: categoryEntity.value,
          viewport: context.viewport
        },
        suggestions: [
          "Which one is closest?",
          "Filter by rating",
          "Show on timeline"
        ]
      }
    }

    // Generic search - show help
    return {
      message: "I can help you search for locations. Try: 'Find hospitals' or 'Show JFK Airport'",
      suggestions: [
        "Find hospitals nearby",
        "Show airports",
        "Locate restaurants"
      ]
    }
  }
}

/**
 * Analysis Query Handler
 * Handles intelligence analysis queries
 */
export class AnalysisQueryHandler extends QueryHandler {
  async handle(intent: IntentResult, context: ConversationContext): Promise<QueryHandlerResponse> {
    console.log('🧠 Analysis handler:', intent.query)

    // Extract significance entities
    const significanceEntity = intent.entities.find(e => e.type === 'significance')
    const significance = significanceEntity?.value || 'all'

    return {
      message: `Analyzing ${significance} activity...`,
      action: 'open-panel',
      data: {
        type: 'intelligence-analysis',
        significance,
        viewport: context.viewport
      },
      suggestions: [
        "View timeline",
        "Show geographic clusters",
        "Network analysis",
        "Export report"
      ]
    }
  }
}

/**
 * Layer Query Handler
 * Handles map layer toggles
 */
export class LayerQueryHandler extends QueryHandler {
  async handle(intent: IntentResult, context: ConversationContext): Promise<QueryHandlerResponse> {
    console.log('🗺️  Layer handler:', intent.query)

    // Extract layer entities
    const layerEntity = intent.entities.find(e => e.type === 'layer')

    if (!layerEntity) {
      return {
        message: "Which layer would you like to toggle?",
        suggestions: [
          "Show buildings",
          "Enable roads",
          "Display places",
          "Show all layers"
        ]
      }
    }

    const layerName = layerEntity.value
    const isCurrentlyEnabled = context.enabledLayers.includes(layerName)
    const action = isCurrentlyEnabled ? 'disabled' : 'enabled'

    return {
      message: `${layerName.charAt(0).toUpperCase() + layerName.slice(1)} layer ${action}`,
      action: 'toggle-layer',
      data: {
        layer: layerName,
        enable: !isCurrentlyEnabled
      },
      suggestions: [
        isCurrentlyEnabled ? `Hide ${layerName}` : `Show ${layerName} details`,
        "Show all layers",
        "Reset layers"
      ]
    }
  }
}

/**
 * Temporal Query Handler
 * Handles timeline and temporal data queries
 */
export class TemporalQueryHandler extends QueryHandler {
  async handle(intent: IntentResult, context: ConversationContext): Promise<QueryHandlerResponse> {
    console.log('⏱️  Temporal handler:', intent.query)

    // Check if asking for timeline
    if (/timeline|playback/.test(intent.query.toLowerCase())) {
      return {
        message: "Opening timeline control...",
        action: 'open-panel',
        data: {
          type: 'timeline',
          autoPlay: false
        },
        suggestions: [
          "Play timeline",
          "Speed up 2x",
          "Show night activity only"
        ]
      }
    }

    // Time-based filtering
    const timeEntity = intent.entities.find(e => e.type === 'time')
    if (timeEntity) {
      return {
        message: `Filtering to ${timeEntity.value} activity...`,
        action: 'open-panel',
        data: {
          type: 'temporal-filter',
          timeRange: timeEntity.value
        },
        suggestions: [
          "Show timeline",
          "View all times",
          "Export filtered data"
        ]
      }
    }

    return {
      message: "I can show timeline data. Try: 'Show timeline' or 'What happened at night?'",
      suggestions: [
        "Show timeline",
        "Night activity only",
        "Play journey"
      ]
    }
  }
}

/**
 * Action Query Handler
 * Handles system actions (export, generate, etc.)
 */
export class ActionQueryHandler extends QueryHandler {
  async handle(intent: IntentResult, context: ConversationContext): Promise<QueryHandlerResponse> {
    console.log('⚡ Action handler:', intent.query)

    // Check for scenario generation
    if (/generate.*scenario|create.*scenario/i.test(intent.query)) {
      const templateEntity = intent.entities.find(e => e.type === 'template')
      const templateType = templateEntity?.value || 'tech_worker'

      return {
        message: `Generating authentic ${templateType} scenario...`,
        action: 'load-template',
        data: {
          type: 'generate-scenario',
          templateType
        },
        suggestions: [
          "Start exploration",
          "View timeline",
          "Show narrative"
        ]
      }
    }

    // Check for template loading
    const templateEntity = intent.entities.find(e => e.type === 'template')
    if (templateEntity) {
      return {
        message: `Loading ${templateEntity.value} template...`,
        action: 'load-template',
        data: {
          type: 'load-template',
          template: templateEntity.value
        },
        suggestions: [
          "Show details",
          "Start simulation",
          "Export data"
        ]
      }
    }

    // Export action
    if (/export|download|save/i.test(intent.query)) {
      return {
        message: "Preparing data export...",
        action: 'open-panel',
        data: {
          type: 'export-dialog'
        },
        suggestions: [
          "Export as GeoJSON",
          "Export as CSV",
          "Copy to clipboard"
        ]
      }
    }

    return {
      message: "What would you like to do?",
      suggestions: [
        "Generate a scenario",
        "Load fleet tracking",
        "Export current data"
      ]
    }
  }
}

/**
 * Help Query Handler
 * Provides guidance and feature discovery
 */
export class HelpQueryHandler extends QueryHandler {
  async handle(intent: IntentResult, context: ConversationContext): Promise<QueryHandlerResponse> {
    console.log('❓ Help handler:', intent.query)

    const helpMessage = `I'm your geospatial intelligence assistant! Here's what I can do:

🔍 **Search & Explore**
• "Find hospitals in Manhattan"
• "Show JFK Airport"
• "Locate restaurants nearby"

🧠 **Analyze & Discover**
• "Show suspicious activity"
• "Analyze this area"
• "What's anomalous here?"

🗺️ **Map Layers**
• "Show buildings"
• "Enable roads layer"
• "Display places"

⏱️ **Temporal Data**
• "Show timeline"
• "What happened at night?"
• "Play journey"

⚡ **Actions**
• "Generate a 72-hour scenario"
• "Load fleet tracking"
• "Export data"

Just ask me anything in plain English!`

    return {
      message: helpMessage,
      action: 'show-help',
      suggestions: [
        "Find hospitals",
        "Show suspicious activity",
        "Generate scenario",
        "Show timeline"
      ]
    }
  }
}

/**
 * Query Handler Registry
 * Routes intents to appropriate handlers
 */
export class QueryHandlerRegistry {
  private handlers: Map<string, QueryHandler>

  constructor() {
    this.handlers = new Map()

    // Register default handlers
    this.register('search', new SearchQueryHandler())
    this.register('analysis', new AnalysisQueryHandler())
    this.register('layer', new LayerQueryHandler())
    this.register('temporal', new TemporalQueryHandler())
    this.register('action', new ActionQueryHandler())
    this.register('help', new HelpQueryHandler())
  }

  /**
   * Register a query handler for an intent type
   */
  register(intentType: string, handler: QueryHandler): void {
    this.handlers.set(intentType, handler)
  }

  /**
   * Handle a classified intent
   */
  async handle(
    intent: IntentResult,
    context: ConversationContext
  ): Promise<QueryHandlerResponse> {
    const handler = this.handlers.get(intent.type)

    if (!handler) {
      console.warn(`No handler registered for intent type: ${intent.type}`)
      return {
        message: `I'm not sure how to handle that. Try asking: "What can you do?"`,
        suggestions: [
          "What can you do?",
          "Find hospitals",
          "Show suspicious activity"
        ]
      }
    }

    return handler.handle(intent, context)
  }

  /**
   * Get all registered intent types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}

// Singleton instance
let registryInstance: QueryHandlerRegistry | null = null

export function getQueryHandlerRegistry(): QueryHandlerRegistry {
  if (!registryInstance) {
    registryInstance = new QueryHandlerRegistry()
  }
  return registryInstance
}
