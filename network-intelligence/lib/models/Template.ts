/**
 * Template System - Configurable operational intelligence templates
 *
 * Templates define how different use cases (fleet, maritime, satellite, etc.)
 * are rendered and interacted with in the OpIntel platform.
 */

import type { SpatialEntity, EntityType } from './SpatialEntity'
import type { Layer } from '@/lib/stores/layerStore'
import type { ReactNode } from 'react'

export interface TemplateConfig {
  id: string
  name: string
  description: string
  category: TemplateCategory
  icon?: string

  // Entity configuration
  supportedEntityTypes: EntityType[]
  defaultEntityProperties: Record<string, any>

  // Data sources
  dataSources: DataSourceConfig[]

  // Layer configuration
  defaultLayers: Layer[]

  // UI configuration
  ui: {
    projectName: string
    showTimeline: boolean
    showAlerts: boolean
    defaultViewport: {
      longitude: number
      latitude: number
      zoom: number
      pitch?: number
      bearing?: number
    }
  }

  // Feature configuration
  features: {
    realTimeTracking: boolean
    historicalPlayback: boolean
    routeOptimization: boolean
    geofencing: boolean
    alerts: boolean
    analytics: boolean
  }
}

export type TemplateCategory =
  | 'logistics'
  | 'maritime'
  | 'aviation'
  | 'space'
  | 'field-ops'
  | 'iot'
  | 'custom'

export interface DataSourceConfig {
  id: string
  name: string
  type: 'stream' | 'file' | 'database' | 'api'
  endpoint?: string
  refreshInterval?: number // milliseconds
  authentication?: {
    type: 'none' | 'api-key' | 'oauth' | 'basic'
    credentials?: Record<string, string>
  }
  transform?: (data: any) => SpatialEntity[]
}

/**
 * Template registry
 */
export interface TemplateRegistry {
  templates: Map<string, TemplateConfig>
  register: (template: TemplateConfig) => void
  get: (id: string) => TemplateConfig | undefined
  list: () => TemplateConfig[]
  listByCategory: (category: TemplateCategory) => TemplateConfig[]
}

/**
 * Template component interface
 */
export interface TemplateComponent {
  id: string
  name: string
  render: (props: any) => ReactNode
}

/**
 * Create template registry
 */
export function createTemplateRegistry(): TemplateRegistry {
  const templates = new Map<string, TemplateConfig>()

  return {
    templates,
    register: (template: TemplateConfig) => {
      templates.set(template.id, template)
    },
    get: (id: string) => {
      return templates.get(id)
    },
    list: () => {
      return Array.from(templates.values())
    },
    listByCategory: (category: TemplateCategory) => {
      return Array.from(templates.values()).filter((t) => t.category === category)
    }
  }
}

/**
 * Base template factory
 */
export function createBaseTemplate(
  id: string,
  name: string,
  category: TemplateCategory,
  options: Partial<TemplateConfig> = {}
): TemplateConfig {
  return {
    id,
    name,
    description: options.description || '',
    category,
    supportedEntityTypes: options.supportedEntityTypes || ['custom'],
    defaultEntityProperties: options.defaultEntityProperties || {},
    dataSources: options.dataSources || [],
    defaultLayers: options.defaultLayers || [],
    ui: options.ui || {
      projectName: name,
      showTimeline: true,
      showAlerts: true,
      defaultViewport: {
        longitude: 0,
        latitude: 0,
        zoom: 2
      }
    },
    features: options.features || {
      realTimeTracking: true,
      historicalPlayback: true,
      routeOptimization: false,
      geofencing: false,
      alerts: true,
      analytics: false
    },
    ...options
  }
}
