# OpIntel Data Models & Template System

This directory contains the core data models and template system for the Operational Intelligence Platform.

## Overview

The OpIntel platform is designed to be **template-driven** and **use-case agnostic**. Instead of being hardcoded for one specific domain (like satellites or fleet tracking), it uses a flexible template system that can support:

- 🚚 **Fleet Tracking** - Vehicle fleets, deliveries, logistics
- ⚓ **Maritime Operations** - Vessels, ports, shipping lanes
- ✈️ **Aviation** - Aircraft, flight tracking, airports
- 🛰️ **Satellite Operations** - Satellites, ground stations, orbits
- 👥 **Field Operations** - Personnel, assets, equipment
- 🌐 **IoT Monitoring** - Sensors, devices, infrastructure

## Core Concepts

### 1. SpatialEntity

The `SpatialEntity` is the **universal data model** for any entity with a location:

```typescript
interface SpatialEntity {
  // Identity
  id: string
  type: EntityType // 'vehicle' | 'vessel' | 'satellite' | etc.
  name: string
  category?: string

  // Location & Motion
  position: Position
  motion?: Motion
  geometry?: GeometryData

  // Status
  status: EntityStatus
  lastUpdate: Date

  // Metadata
  properties: Record<string, any>
  tags?: string[]

  // Relationships
  parentId?: string
  childIds?: string[]

  // Visual styling
  style?: {...}
}
```

**Key Features:**
- **Flexible properties** - Store domain-specific data in `properties` object
- **Motion tracking** - Speed, heading, altitude for moving entities
- **Geometry support** - Points, lines, polygons for zones/routes
- **Relationships** - Parent/child for fleets, convoys, constellations
- **Visual styling** - Control color, icon, size per entity

### 2. Template System

Templates define **how a specific use case** is configured:

```typescript
interface TemplateConfig {
  id: string
  name: string
  category: TemplateCategory

  // What entity types this template supports
  supportedEntityTypes: EntityType[]

  // Default properties for entities
  defaultEntityProperties: Record<string, any>

  // Data source configuration
  dataSources: DataSourceConfig[]

  // Default map layers
  defaultLayers: Layer[]

  // UI configuration
  ui: {
    projectName: string
    showTimeline: boolean
    showAlerts: boolean
    defaultViewport: {...}
  }

  // Feature toggles
  features: {
    realTimeTracking: boolean
    historicalPlayback: boolean
    routeOptimization: boolean
    geofencing: boolean
    alerts: boolean
    analytics: boolean
  }
}
```

## Built-in Templates

### Fleet Tracking Template

**Use Case:** Last-mile delivery, logistics, vehicle fleet management

**Entity Types:** `vehicle`, `route`, `zone`, `waypoint`

**Features:**
- Real-time GPS tracking
- Route optimization
- Delivery management
- Driver monitoring
- Geofencing
- Demand heatmaps

**Default Properties:**
```typescript
{
  driver: string
  vehicleType: 'van' | 'truck' | 'semi' | 'bike'
  capacity: number
  currentLoad: number
  fuelLevel: number
  odometer: number
  route: string
}
```

**Demo:** San Francisco fleet (200 vehicles)

---

### Maritime Tracking Template

**Use Case:** Vessel tracking, port operations, shipping intelligence

**Entity Types:** `vessel`, `route`, `zone`, `waypoint`

**Features:**
- AIS vessel tracking
- Shipping lane visualization
- Port information
- Weather integration
- EEZ boundaries
- Route prediction

**Default Properties:**
```typescript
{
  mmsi: string  // Maritime Mobile Service Identity
  imo: string   // International Maritime Organization
  vesselType: 'cargo' | 'tanker' | 'passenger' | 'fishing'
  flag: string
  destination: string
  eta: Date
  draught: number
  length: number
  width: number
}
```

---

### Satellite Operations Template

**Use Case:** Satellite tracking, ground station operations, coverage analysis

**Entity Types:** `satellite`, `ground-station`, `zone`

**Features:**
- TLE orbital propagation
- Ground station visibility
- Pass predictions
- Coverage analysis
- H3 hexagon grids
- Constellation management

**Default Properties:**
```typescript
{
  noradId: string
  cosparId: string
  operator: string
  orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO'
  period: number      // minutes
  inclination: number // degrees
  apogee: number      // km
  perigee: number     // km
}
```

## Using Templates

### 1. Select a Template

```typescript
import { templateRegistry } from '@/lib/templates'

// Get template by ID
const template = templateRegistry.get('fleet-tracking')

// List all templates
const allTemplates = templateRegistry.list()

// List by category
const logisticsTemplates = templateRegistry.listByCategory('logistics')
```

### 2. Generate Demo Data

```typescript
import { generateSanFranciscoFleet } from '@/lib/generators/fleetDataGenerator'

// Generate 200 vehicles in San Francisco
const vehicles = generateSanFranciscoFleet()
```

### 3. Create Entities

```typescript
import { createVehicleEntity, createVesselEntity } from '@/lib/models/SpatialEntity'

// Create a vehicle
const vehicle = createVehicleEntity(
  'VEH-001',
  'Delivery Van 1',
  -122.4194,
  37.7749,
  {
    driver: 'John Smith',
    vehicleType: 'van',
    route: 'Route A'
  }
)

// Create a vessel
const vessel = createVesselEntity(
  'IMO-9876543',
  'Container Ship Alpha',
  -70.0,
  35.0,
  {
    mmsi: '123456789',
    vesselType: 'cargo',
    destination: 'Port of New York'
  }
)
```

### 4. Update Entity Positions

```typescript
import { updateVehiclePositions } from '@/lib/generators/fleetDataGenerator'

// Simulate 30 seconds of movement
const updatedVehicles = updateVehiclePositions(vehicles, 30)
```

## Creating Custom Templates

### Step 1: Define Template Config

```typescript
import { createBaseTemplate } from '@/lib/models/Template'

export const myCustomTemplate = createBaseTemplate(
  'my-custom',
  'My Custom Use Case',
  'custom',
  {
    description: 'Description of use case',
    supportedEntityTypes: ['custom'],
    defaultEntityProperties: {
      // Your custom properties
    },
    dataSources: [
      {
        id: 'my-data-source',
        name: 'My Data Source',
        type: 'stream',
        refreshInterval: 5000
      }
    ],
    defaultLayers: [
      {
        id: 'my-layer',
        name: 'My Layer',
        type: 'ScatterplotLayer',
        visible: true,
        opacity: 1,
        color: '#3b82f6'
      }
    ],
    ui: {
      projectName: 'My Project',
      showTimeline: true,
      showAlerts: true,
      defaultViewport: {
        longitude: 0,
        latitude: 0,
        zoom: 2
      }
    },
    features: {
      realTimeTracking: true,
      historicalPlayback: true,
      routeOptimization: false,
      geofencing: true,
      alerts: true,
      analytics: true
    }
  }
)
```

### Step 2: Register Template

```typescript
import { templateRegistry } from '@/lib/templates'
import { myCustomTemplate } from './my-custom-template'

templateRegistry.register(myCustomTemplate)
```

### Step 3: Use Template in App

```typescript
const template = templateRegistry.get('my-custom')
const { ui, features, defaultLayers } = template
```

## Architecture Benefits

✅ **Separation of Concerns** - Business logic separated from platform code
✅ **Reusability** - Same map, UI, stores work for all templates
✅ **Extensibility** - Add new templates without changing core platform
✅ **Configuration over Code** - Templates are data, not code
✅ **Type Safety** - Full TypeScript support
✅ **Demo Data** - Built-in generators for testing

## File Structure

```
lib/
├── models/
│   ├── SpatialEntity.ts    # Universal entity model
│   ├── Template.ts         # Template system types
│   └── README.md           # This file
├── templates/
│   ├── fleet-tracking.ts   # Fleet template
│   ├── maritime-tracking.ts # Maritime template
│   ├── satellite-operations.ts # Satellite template
│   └── index.ts            # Template registry
└── generators/
    └── fleetDataGenerator.ts # Demo data generators
```

## Next Steps

1. **Entity Store** - Create Zustand store for managing SpatialEntities
2. **Data Adapters** - Build adapters for real data sources (GPS, AIS, TLE)
3. **Visualization** - Connect entities to Deck.gl/Mapbox layers
4. **Analytics** - Add analytics capabilities per template
5. **More Templates** - Aviation, field ops, IoT monitoring

## References

- [SpatialEntity.ts](./SpatialEntity.ts) - Entity model implementation
- [Template.ts](./Template.ts) - Template system implementation
- [Fleet Template](../templates/fleet-tracking.ts) - Fleet tracking example
- [Maritime Template](../templates/maritime-tracking.ts) - Maritime example
- [Satellite Template](../templates/satellite-operations.ts) - Satellite example
