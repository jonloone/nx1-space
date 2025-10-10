/**
 * Fleet Tracking Template
 *
 * Operational intelligence for vehicle fleet management
 * - Real-time vehicle tracking
 * - Route optimization
 * - Delivery management
 * - Driver monitoring
 */

import type { TemplateConfig } from '@/lib/models/Template'
import { createBaseTemplate } from '@/lib/models/Template'

export const fleetTrackingTemplate: TemplateConfig = createBaseTemplate(
  'fleet-tracking',
  'Fleet Tracking',
  'logistics',
  {
    description: 'Real-time vehicle fleet management and delivery operations',
    icon: '🚚',

    supportedEntityTypes: ['vehicle', 'route', 'zone', 'waypoint'],

    defaultEntityProperties: {
      driver: '',
      vehicleType: 'van',
      capacity: 0,
      currentLoad: 0,
      fuelLevel: 100,
      odometer: 0,
      lastMaintenance: null,
      nextMaintenance: null
    },

    dataSources: [
      {
        id: 'vehicle-positions',
        name: 'Vehicle GPS Feed',
        type: 'stream',
        refreshInterval: 5000 // 5 seconds
      },
      {
        id: 'delivery-zones',
        name: 'Service Zones',
        type: 'file'
      },
      {
        id: 'routes',
        name: 'Planned Routes',
        type: 'database'
      }
    ],

    defaultLayers: [
      {
        id: 'vehicles',
        name: 'Vehicle Fleet',
        type: 'ScatterplotLayer' as any,
        visible: true,
        opacity: 1,
        color: '#3b82f6'
      },
      {
        id: 'routes',
        name: 'Delivery Routes',
        type: 'PathLayer' as any,
        visible: true,
        opacity: 0.8,
        color: '#10b981'
      },
      {
        id: 'zones',
        name: 'Service Zones',
        type: 'PolygonLayer' as any,
        visible: true,
        opacity: 0.3,
        color: '#8b5cf6'
      },
      {
        id: 'heatmap',
        name: 'Demand Heatmap',
        type: 'HeatmapLayer' as any,
        visible: false,
        opacity: 0.6,
        color: '#ef4444'
      }
    ],

    ui: {
      projectName: 'Fleet Operations',
      showTimeline: true,
      showAlerts: true,
      defaultViewport: {
        longitude: -122.4194,
        latitude: 37.7749,
        zoom: 11,
        pitch: 45,
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
 * Vehicle status configuration
 */
export const vehicleStatusConfig = {
  active: {
    color: '#10b981', // green
    label: 'Active',
    icon: '🟢'
  },
  idle: {
    color: '#fbbf24', // yellow
    label: 'Idle',
    icon: '🟡'
  },
  maintenance: {
    color: '#f97316', // orange
    label: 'Maintenance',
    icon: '🟠'
  },
  offline: {
    color: '#6b7280', // gray
    label: 'Offline',
    icon: '⚪'
  },
  alert: {
    color: '#ef4444', // red
    label: 'Alert',
    icon: '🔴'
  }
}

/**
 * Vehicle categories
 */
export const vehicleCategories = [
  { id: 'van', name: 'Delivery Van', icon: '🚐', capacity: 1000 },
  { id: 'truck', name: 'Delivery Truck', icon: '🚚', capacity: 5000 },
  { id: 'semi', name: 'Semi Truck', icon: '🚛', capacity: 20000 },
  { id: 'bike', name: 'Bike', icon: '🚴', capacity: 50 },
  { id: 'drone', name: 'Drone', icon: '🛸', capacity: 5 }
]

/**
 * Alert types for fleet operations
 */
export const fleetAlertTypes = [
  {
    id: 'delay',
    name: 'Delivery Delay',
    severity: 'medium' as const,
    color: '#f59e0b'
  },
  {
    id: 'speeding',
    name: 'Speeding Violation',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'maintenance',
    name: 'Maintenance Required',
    severity: 'medium' as const,
    color: '#f97316'
  },
  {
    id: 'fuel-low',
    name: 'Low Fuel',
    severity: 'medium' as const,
    color: '#f59e0b'
  },
  {
    id: 'geofence',
    name: 'Geofence Violation',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'accident',
    name: 'Accident Reported',
    severity: 'critical' as const,
    color: '#dc2626'
  }
]
