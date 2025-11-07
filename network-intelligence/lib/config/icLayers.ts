/**
 * IC Layer Configuration
 * Defines cross-cutting analysis layers that can be applied to any domain
 *
 * Layers represent types of intelligence collection/analysis that span domains:
 * - Cyber: Network infrastructure, telecommunications, digital systems
 * - Social Media: OSINT from social platforms, sentiment, event detection
 * - Business Intelligence: Corporate data, ownership, financial intelligence
 */

import { type ICDomainId } from './icDomains'

export type ICLayerId = 'cyber' | 'social-media' | 'business-intel'

export type LayerStatus = 'available' | 'partial' | 'unavailable'

export interface ICLayer {
  id: ICLayerId
  name: string
  description: string
  icon: string  // Lucide icon name

  // Which domains can use this layer
  compatibleDomains: ICDomainId[]

  // Data sources accessed by this layer
  dataSources: string[]

  // Services that implement this layer
  services: string[]

  // Availability status
  status: LayerStatus
  statusMessage?: string

  // What this layer adds to analysis
  enrichmentCapabilities: string[]
}

/**
 * IC Layer Definitions
 */
export const IC_LAYERS: Record<string, ICLayer> = {
  CYBER: {
    id: 'cyber',
    name: 'Cyber Layer',
    description: 'Network infrastructure, telecommunications, data centers, SIGINT capabilities',
    icon: 'Network',

    compatibleDomains: ['ground', 'maritime', 'space'],

    dataSources: [
      'cell-towers',
      'cell-tower-operators',
      'network-infrastructure',
      'undersea-cables',
      'ground-stations',
      'data-centers'
    ],

    services: [
      'cellTowerLayerService',
      'multiIntReportService'
    ],

    status: 'partial',
    statusMessage: 'Cell tower SIGINT available, network infrastructure limited',

    enrichmentCapabilities: [
      'SIGINT - Cell tower coverage and operator data',
      'Communication infrastructure mapping',
      'RF signal strength estimation',
      'Network connectivity assessment',
      'Telecommunications provider analysis'
    ]
  },

  SOCIAL_MEDIA: {
    id: 'social-media',
    name: 'Social Media OSINT',
    description: 'Social media monitoring, sentiment analysis, event detection, online presence',
    icon: 'MessageCircle',

    compatibleDomains: ['ground', 'maritime', 'air'],

    dataSources: [
      'social-media-presence',
      'reviews-ratings',
      'yelp-data',
      'google-reviews',
      'facebook-pages',
      'instagram-presence',
      'check-ins',
      'user-posts'
    ],

    services: [
      'osintEnrichmentService'
    ],

    status: 'partial',
    statusMessage: 'Presence indicators available, real-time monitoring not implemented',

    enrichmentCapabilities: [
      'Social media presence detection',
      'Review and rating aggregation',
      'Platform availability (Yelp, Google, Facebook, Instagram)',
      'User sentiment indicators',
      'Online reputation analysis'
    ]
  },

  BUSINESS_INTEL: {
    id: 'business-intel',
    name: 'Business Intelligence',
    description: 'Corporate data, ownership records, financial intelligence, business operations',
    icon: 'Briefcase',

    compatibleDomains: ['ground', 'maritime', 'air'],

    dataSources: [
      'business-registrations',
      'ownership-records',
      'citizens360-cases',
      'overture-places',
      'gers-business-data',
      'operating-hours',
      'business-type',
      'registration-state',
      'shell-company-indicators'
    ],

    services: [
      'osintEnrichmentService',
      'citizens360DataService',
      'overturePlacesService',
      'gersDemoService'
    ],

    status: 'available',

    enrichmentCapabilities: [
      'Business ownership investigation',
      'Corporate structure mapping',
      'Operating hours and status',
      'Business type classification',
      'Shell company detection',
      'Risk scoring (0-100)',
      'Subject-owned business tracking',
      'Registration and compliance data'
    ]
  }
}

/**
 * Get layer by ID
 */
export function getICLayer(layerId: ICLayerId): ICLayer | null {
  const key = layerId.toUpperCase().replace(/-/g, '_')
  return IC_LAYERS[key] || null
}

/**
 * Get all IC layers
 */
export function getAllICLayers(): ICLayer[] {
  return Object.values(IC_LAYERS)
}

/**
 * Get available layers (status = 'available')
 */
export function getAvailableICLayers(): ICLayer[] {
  return Object.values(IC_LAYERS).filter(layer => layer.status === 'available')
}

/**
 * Get layers compatible with a specific domain
 */
export function getCompatibleLayers(domainId: ICDomainId): ICLayer[] {
  return Object.values(IC_LAYERS).filter(layer =>
    layer.compatibleDomains.includes(domainId)
  )
}

/**
 * Check if a layer is compatible with a domain
 */
export function isLayerCompatible(layerId: ICLayerId, domainId: ICDomainId): boolean {
  const layer = getICLayer(layerId)
  return layer ? layer.compatibleDomains.includes(domainId) : false
}

/**
 * Get all enrichment capabilities for selected layers
 */
export function getEnrichmentCapabilities(layerIds: ICLayerId[]): string[] {
  return layerIds.flatMap(layerId => {
    const layer = getICLayer(layerId)
    return layer ? layer.enrichmentCapabilities : []
  })
}

/**
 * Get services needed for selected layers
 */
export function getLayerServices(layerIds: ICLayerId[]): string[] {
  const services = new Set<string>()
  layerIds.forEach(layerId => {
    const layer = getICLayer(layerId)
    if (layer) {
      layer.services.forEach(service => services.add(service))
    }
  })
  return Array.from(services)
}
