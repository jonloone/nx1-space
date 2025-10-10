/**
 * Satellite Operations Template
 *
 * Operational intelligence for satellite and ground station operations
 * - Satellite tracking (TLE/orbital data)
 * - Ground station visibility
 * - Coverage analysis
 * - Pass predictions
 */

import type { TemplateConfig } from '@/lib/models/Template'
import { createBaseTemplate } from '@/lib/models/Template'

export const satelliteOperationsTemplate: TemplateConfig = createBaseTemplate(
  'satellite-operations',
  'Satellite Operations',
  'space',
  {
    description: 'Real-time satellite tracking and ground station operations',
    icon: '🛰️',

    supportedEntityTypes: ['satellite', 'ground-station', 'zone'],

    defaultEntityProperties: {
      noradId: '',
      cosparId: '',
      operator: '',
      launchDate: null,
      orbitType: 'LEO',
      period: 0, // minutes
      inclination: 0, // degrees
      apogee: 0, // km
      perigee: 0, // km
      frequency: '',
      status: 'operational'
    },

    dataSources: [
      {
        id: 'satellite-positions',
        name: 'Satellite TLE Data',
        type: 'api',
        endpoint: '/api/satellites',
        refreshInterval: 30000 // 30 seconds
      },
      {
        id: 'ground-stations',
        name: 'Ground Station Network',
        type: 'database'
      },
      {
        id: 'coverage',
        name: 'Coverage Analysis',
        type: 'stream',
        refreshInterval: 60000 // 1 minute
      }
    ],

    defaultLayers: [
      {
        id: 'satellites',
        name: 'Satellites',
        type: 'ScatterplotLayer' as any,
        visible: true,
        opacity: 1,
        color: '#3b82f6'
      },
      {
        id: 'ground-stations',
        name: 'Ground Stations',
        type: 'IconLayer' as any,
        visible: true,
        opacity: 1,
        color: '#10b981'
      },
      {
        id: 'orbits',
        name: 'Orbital Paths',
        type: 'PathLayer' as any,
        visible: true,
        opacity: 0.6,
        color: '#8b5cf6'
      },
      {
        id: 'coverage',
        name: 'Coverage Zones',
        type: 'PolygonLayer' as any,
        visible: false,
        opacity: 0.3,
        color: '#06b6d4'
      },
      {
        id: 'hex-coverage',
        name: 'H3 Hexagon Coverage',
        type: 'HexagonLayer' as any,
        visible: false,
        opacity: 0.5,
        color: '#f59e0b'
      }
    ],

    ui: {
      projectName: 'Satellite Network',
      showTimeline: true,
      showAlerts: true,
      defaultViewport: {
        longitude: 0,
        latitude: 30,
        zoom: 2,
        pitch: 0,
        bearing: 0
      }
    },

    features: {
      realTimeTracking: true,
      historicalPlayback: true,
      routeOptimization: false,
      geofencing: false,
      alerts: true,
      analytics: true
    }
  }
)

/**
 * Orbit types
 */
export const orbitTypes = [
  { id: 'LEO', name: 'Low Earth Orbit', altitude: '160-2,000 km' },
  { id: 'MEO', name: 'Medium Earth Orbit', altitude: '2,000-35,786 km' },
  { id: 'GEO', name: 'Geostationary Orbit', altitude: '35,786 km' },
  { id: 'HEO', name: 'Highly Elliptical Orbit', altitude: 'Variable' },
  { id: 'SSO', name: 'Sun-Synchronous Orbit', altitude: '600-800 km' },
  { id: 'POLAR', name: 'Polar Orbit', altitude: 'Variable' }
]

/**
 * Alert types for satellite operations
 */
export const satelliteAlertTypes = [
  {
    id: 'conjunction',
    name: 'Collision Risk',
    severity: 'critical' as const,
    color: '#dc2626'
  },
  {
    id: 'anomaly',
    name: 'Satellite Anomaly',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'contact-loss',
    name: 'Contact Loss',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'solar-flare',
    name: 'Solar Activity',
    severity: 'medium' as const,
    color: '#f59e0b'
  },
  {
    id: 'station-down',
    name: 'Ground Station Offline',
    severity: 'medium' as const,
    color: '#f97316'
  },
  {
    id: 'orbit-drift',
    name: 'Orbit Drift',
    severity: 'medium' as const,
    color: '#f59e0b'
  }
]
