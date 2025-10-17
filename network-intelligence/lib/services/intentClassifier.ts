/**
 * Intent Classification Service
 *
 * Uses Vultr LLM to classify user queries and extract entities
 * Falls back to pattern matching if LLM fails
 */

import { VultrLLMService } from './vultrLLMService'
import type { IntentResult, ExtractedEntity } from '@/lib/stores/chatStore'

export class IntentClassificationService {
  private llm: VultrLLMService
  private cache = new Map<string, IntentResult>()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  constructor(llm: VultrLLMService) {
    this.llm = llm
  }

  /**
   * Classify intent using Vultr LLM with fallback to pattern matching
   */
  async classifyIntent(query: string, context?: any): Promise<IntentResult> {
    // Check cache first
    const cacheKey = `${query}:${JSON.stringify(context)}`
    const cached = this.cache.get(cacheKey)
    if (cached) {
      console.log('🎯 Intent cache hit:', query)
      return cached
    }

    try {
      // Try LLM classification first
      const result = await this.classifyWithLLM(query, context)

      // Cache result
      this.cache.set(cacheKey, result)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL)

      return result
    } catch (error) {
      console.warn('LLM classification failed, using pattern matching:', error)
      return this.classifyWithPatterns(query)
    }
  }

  /**
   * Classify using Vultr LLM (primary method)
   */
  private async classifyWithLLM(query: string, context?: any): Promise<IntentResult> {
    const systemPrompt = `You are an intent classifier for a geospatial intelligence platform.
Analyze user queries and classify the intent, then extract relevant entities.

Intent Types:
- search: User wants to find a specific location (e.g., "JFK Airport", "hospitals in Manhattan")
- analysis: User wants intelligence analysis (e.g., "what's suspicious", "show anomalies")
- layer: User wants to toggle map layers (e.g., "show buildings", "enable roads layer")
- temporal: User wants to see temporal data (e.g., "show timeline", "what happened at night")
- action: User wants to perform an action (e.g., "export data", "generate scenario")
- help: User wants help (e.g., "what can you do", "help")
- unknown: Cannot classify

Entity Types:
- location: Place names, addresses, coordinates
- category: Place categories (hospital, restaurant, airport)
- time: Temporal references (night, 2:47 AM, Day 2)
- significance: Risk levels (suspicious, critical, anomaly, routine)
- layer: Map layer names (buildings, roads, places)
- template: Use case templates (fleet tracking, investigation, maritime)

Return JSON only, no explanation.`

    const userPrompt = `Query: "${query}"

${context ? `Context:
- Viewport zoom: ${context.viewport?.zoom || 'unknown'}
- Recent queries: ${context.recentQueries?.join(', ') || 'none'}
- Enabled layers: ${context.enabledLayers?.join(', ') || 'none'}` : ''}

Classify and extract:
{
  "type": "search|analysis|layer|temporal|action|help|unknown",
  "confidence": 0.0-1.0,
  "entities": [
    {
      "type": "location|category|time|significance|layer|template",
      "value": "extracted text",
      "coordinates": [lng, lat] // optional, if known location
    }
  ]
}`

    const response = await this.llm.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Low temperature for consistent classification
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content || '{}'
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

    try {
      const parsed = JSON.parse(jsonStr)

      const result: IntentResult = {
        type: parsed.type || 'unknown',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || [],
        query
      }

      console.log('🤖 LLM Intent:', result.type, `(${(result.confidence * 100).toFixed(0)}%)`)
      return result

    } catch (parseError) {
      console.warn('Failed to parse LLM response:', parseError)
      throw new Error('LLM response parsing failed')
    }
  }

  /**
   * Pattern-based classification (fallback)
   */
  private classifyWithPatterns(query: string): IntentResult {
    const lowerQuery = query.toLowerCase().trim()
    const entities: ExtractedEntity[] = []

    // Search patterns
    if (
      /^(find|show|where|locate|search)/.test(lowerQuery) ||
      /\b(airport|hospital|restaurant|hotel|station)\b/.test(lowerQuery)
    ) {
      // Extract location/category entities
      const categories = ['hospital', 'airport', 'restaurant', 'hotel', 'station', 'park', 'school']
      categories.forEach(cat => {
        if (lowerQuery.includes(cat)) {
          entities.push({
            type: 'category',
            value: cat
          })
        }
      })

      return {
        type: 'search',
        confidence: 0.8,
        entities,
        query
      }
    }

    // Analysis patterns
    if (
      /(suspicious|anomal|pattern|analysis|analyze|investigate|risk)/i.test(lowerQuery)
    ) {
      // Extract significance entities
      if (/suspicious/i.test(lowerQuery)) {
        entities.push({ type: 'significance', value: 'suspicious' })
      }
      if (/critical|urgent|high.?risk/i.test(lowerQuery)) {
        entities.push({ type: 'significance', value: 'critical' })
      }
      if (/anomal/i.test(lowerQuery)) {
        entities.push({ type: 'significance', value: 'anomaly' })
      }

      return {
        type: 'analysis',
        confidence: 0.85,
        entities,
        query
      }
    }

    // Layer patterns
    if (
      /(show|enable|toggle|display|hide|disable).*(layer|buildings|roads|places)/i.test(lowerQuery)
    ) {
      // Extract layer entities
      const layers = ['buildings', 'roads', 'places', 'transportation', 'landuse', 'addresses']
      layers.forEach(layer => {
        if (lowerQuery.includes(layer)) {
          entities.push({
            type: 'layer',
            value: layer
          })
        }
      })

      return {
        type: 'layer',
        confidence: 0.9,
        entities,
        query
      }
    }

    // Temporal patterns
    if (
      /(timeline|temporal|history|playback|night|evening|morning|day)/i.test(lowerQuery)
    ) {
      // Extract time entities
      if (/night|evening|2.*am|3.*am/i.test(lowerQuery)) {
        entities.push({ type: 'time', value: 'night' })
      }
      if (/timeline|playback/i.test(lowerQuery)) {
        entities.push({ type: 'temporal', value: 'timeline' })
      }

      return {
        type: 'temporal',
        confidence: 0.85,
        entities,
        query
      }
    }

    // Action patterns
    if (
      /(generate|create|export|download|save|scenario)/i.test(lowerQuery)
    ) {
      // Extract template entities
      if (/scenario|investigation/i.test(lowerQuery)) {
        entities.push({ type: 'template', value: 'investigation' })
      }
      if (/fleet/i.test(lowerQuery)) {
        entities.push({ type: 'template', value: 'fleet-tracking' })
      }

      return {
        type: 'action',
        confidence: 0.8,
        entities,
        query
      }
    }

    // Help patterns
    if (
      /(help|what can|capabilities|features|how to|guide)/i.test(lowerQuery)
    ) {
      return {
        type: 'help',
        confidence: 0.95,
        entities: [],
        query
      }
    }

    // Unknown
    return {
      type: 'unknown',
      confidence: 0.3,
      entities: [],
      query
    }
  }

  /**
   * Extract coordinates from location string (basic implementation)
   */
  async extractCoordinates(locationName: string): Promise<[number, number] | undefined> {
    // This would ideally use a geocoding service
    // For now, return undefined - will be handled by query handlers
    return undefined
  }
}

// Singleton instance
let classifierInstance: IntentClassificationService | null = null

export function getIntentClassifier(): IntentClassificationService {
  if (!classifierInstance) {
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY environment variable is not set')
    }

    const llm = new VultrLLMService({
      apiKey,
      baseURL: 'https://api.vultrinference.com/v1',
      model: 'llama2-13b-chat'
    })

    classifierInstance = new IntentClassificationService(llm)
  }

  return classifierInstance
}
