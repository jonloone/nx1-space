/**
 * Maritime Tracking Template
 *
 * Operational intelligence for maritime operations
 * - Vessel tracking (AIS data)
 * - Port operations
 * - Shipping routes
 * - Weather integration
 */

import type { TemplateConfig } from '@/lib/models/Template'
import { createBaseTemplate } from '@/lib/models/Template'

export const maritimeTrackingTemplate: TemplateConfig = createBaseTemplate(
  'maritime-tracking',
  'Maritime Operations',
  'maritime',
  {
    description: 'Real-time vessel tracking and maritime intelligence',
    icon: '⚓',

    supportedEntityTypes: ['vessel', 'route', 'zone', 'waypoint'],

    defaultEntityProperties: {
      mmsi: '', // Maritime Mobile Service Identity
      imo: '', // International Maritime Organization number
      callSign: '',
      vesselType: 'cargo',
      flag: '',
      destination: '',
      eta: null,
      draught: 0,
      length: 0,
      width: 0,
      cargo: '',
      dwt: 0 // Deadweight tonnage
    },

    dataSources: [
      {
        id: 'ais-feed',
        name: 'AIS Vessel Positions',
        type: 'stream',
        refreshInterval: 10000 // 10 seconds
      },
      {
        id: 'port-data',
        name: 'Port Information',
        type: 'database'
      },
      {
        id: 'shipping-lanes',
        name: 'Shipping Routes',
        type: 'file'
      },
      {
        id: 'weather',
        name: 'Marine Weather',
        type: 'api',
        refreshInterval: 300000 // 5 minutes
      }
    ],

    defaultLayers: [
      {
        id: 'vessels',
        name: 'Vessel Positions',
        type: 'ScatterplotLayer' as any,
        visible: true,
        opacity: 1,
        color: '#0ea5e9'
      },
      {
        id: 'shipping-lanes',
        name: 'Shipping Lanes',
        type: 'PathLayer' as any,
        visible: true,
        opacity: 0.6,
        color: '#6366f1'
      },
      {
        id: 'ports',
        name: 'Ports',
        type: 'IconLayer' as any,
        visible: true,
        opacity: 1,
        color: '#8b5cf6'
      },
      {
        id: 'eez',
        name: 'Economic Zones',
        type: 'PolygonLayer' as any,
        visible: false,
        opacity: 0.3,
        color: '#10b981'
      },
      {
        id: 'weather',
        name: 'Weather Overlay',
        type: 'HeatmapLayer' as any,
        visible: false,
        opacity: 0.5,
        color: '#06b6d4'
      }
    ],

    ui: {
      projectName: 'Maritime Operations',
      showTimeline: true,
      showAlerts: true,
      defaultViewport: {
        longitude: -70.0, // Atlantic Ocean
        latitude: 35.0,
        zoom: 4,
        pitch: 0,
        bearing: 0
      }
    },

    features: {
      realTimeTracking: true,
      historicalPlayback: true,
      routeOptimization: true,
      geofencing: true,
      alerts: true,
      analytics: true
    }
  }
)

/**
 * Vessel types
 */
export const vesselTypes = [
  { id: 'cargo', name: 'Cargo Ship', icon: '🚢' },
  { id: 'tanker', name: 'Tanker', icon: '🛢️' },
  { id: 'passenger', name: 'Passenger Ship', icon: '🛳️' },
  { id: 'fishing', name: 'Fishing Vessel', icon: '🎣' },
  { id: 'pleasure', name: 'Pleasure Craft', icon: '⛵' },
  { id: 'tug', name: 'Tug', icon: '🚤' },
  { id: 'military', name: 'Military', icon: '⚓' },
  { id: 'other', name: 'Other', icon: '🚢' }
]

/**
 * Alert types for maritime operations
 */
export const maritimeAlertTypes = [
  {
    id: 'collision-risk',
    name: 'Collision Risk',
    severity: 'critical' as const,
    color: '#dc2626'
  },
  {
    id: 'weather-warning',
    name: 'Weather Warning',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'piracy-alert',
    name: 'Piracy Alert',
    severity: 'critical' as const,
    color: '#dc2626'
  },
  {
    id: 'restricted-area',
    name: 'Restricted Area',
    severity: 'high' as const,
    color: '#f97316'
  },
  {
    id: 'port-delay',
    name: 'Port Delay',
    severity: 'medium' as const,
    color: '#f59e0b'
  },
  {
    id: 'route-deviation',
    name: 'Route Deviation',
    severity: 'medium' as const,
    color: '#f59e0b'
  }
]
