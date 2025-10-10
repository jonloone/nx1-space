# Zustand Store Architecture

This directory contains all Zustand state management stores for the Operational Intelligence Platform.

## Store Overview

### Generic OpIntel Stores

These stores are designed to work with any operational intelligence use case (fleet tracking, delivery management, logistics, etc.):

#### `mapStore.ts` - Map State Management
- **Purpose**: Manages map viewport, interactions, and feature selection
- **Key Features**:
  - Viewport state (longitude, latitude, zoom, pitch, bearing)
  - Map instance reference
  - Selected and hovered features
  - Map modes (view, draw, measure, select)
  - Actions: flyTo, resetViewport
- **Use Cases**: Any map-based visualization

#### `alertStore.ts` - Alert Management
- **Purpose**: Manages alerts, notifications, and recommendations
- **Key Features**:
  - Alert CRUD operations
  - Severity levels (low, medium, high, critical)
  - Alert types (delivery, vehicle, route, system, weather, security)
  - Alert status (active, acknowledged, resolved, dismissed)
  - Filtering by severity, type, and status
  - Location-based alerts
- **Use Cases**: Real-time monitoring, anomaly detection, incident management

#### `panelStore.ts` - UI Panel State
- **Purpose**: Manages sidebar and panel visibility and content
- **Key Features**:
  - Left sidebar (open/closed, active tab)
  - Right panel (open/closed, mode, data)
  - Timeline expansion state
  - Panel modes: feature, alert, layer, analysis
  - Actions: openRightPanel, closeRightPanel, resetPanels
- **Use Cases**: Mission Control UI, context-sensitive panels

#### `timelineStore.ts` - Timeline & Playback
- **Purpose**: Manages temporal data playback and time range selection
- **Key Features**:
  - Current time, start time, end time
  - Playback controls (play, pause, stop)
  - Playback speed (0.5x, 1x, 2x, 4x, etc.)
  - Playback modes (realtime, historical, simulation)
  - Loop mode
  - Actions: skipForward, skipBackward, goToTime
  - Helpers: getProgress, getTotalDuration, getElapsedTime
- **Use Cases**: Historical data replay, real-time streaming, simulations

### Domain-Specific Stores

#### `layerStore.ts` - Advanced Layer Management
- **Purpose**: Manages data layers with filters, groups, and advanced features
- **Key Features**:
  - Layer types: ground-station, maritime, hex-grid, overture, custom
  - Layer filters with operators (equals, contains, greater, less, between, in)
  - Layer groups with collapse/expand
  - Z-index management
  - Default layers for satellite platform
  - Uses Map and Set for performance
- **Use Cases**: Satellite operations, multi-source data visualization

## Usage

### Basic Usage

```typescript
import { useMapStore, useAlertStore, usePanelStore } from '@/lib/stores'

function MyComponent() {
  // Map store
  const { viewport, flyTo, selectFeature } = useMapStore()

  // Alert store
  const { alerts, addAlert, getActiveAlerts } = useAlertStore()

  // Panel store
  const { openRightPanel, closeRightPanel } = usePanelStore()

  const handleFeatureClick = (feature) => {
    selectFeature(feature)
    openRightPanel('feature', feature)
  }

  return (
    <div>
      {/* Your component */}
    </div>
  )
}
```

### Accessing State Without Re-renders

```typescript
import { useMapStore } from '@/lib/stores'

// Only subscribe to specific state
const longitude = useMapStore((state) => state.viewport.longitude)

// Access state without subscribing (no re-renders)
const flyToLocation = () => {
  const flyTo = useMapStore.getState().flyTo
  flyTo(-122.4194, 37.7749)
}
```

### DevTools

All stores are configured with Redux DevTools for debugging:
- Install [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
- Open browser DevTools → Redux tab
- View state changes, time-travel debugging, dispatch actions

## Store Design Principles

1. **Single Responsibility**: Each store manages a specific domain
2. **Composability**: Stores can be used independently or together
3. **Type Safety**: Full TypeScript support with exported types
4. **Performance**: Optimized with Map/Set, selective subscriptions
5. **Debuggability**: Redux DevTools integration
6. **Actions over Setters**: Prefer semantic actions (flyTo) over raw setters (setViewport)

## Adding New Stores

1. Create new file in `/lib/stores/`
2. Use `create` from zustand with `devtools` middleware
3. Export store hook and types
4. Add to `index.ts`
5. Document in this README

Example:
```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface MyState {
  count: number
  increment: () => void
}

export const useMyStore = create<MyState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }),
    { name: 'MyStore' }
  )
)
```

## Migration from Local State

When migrating from local useState to Zustand:

**Before:**
```typescript
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState(null)

  return (
    <ChildComponent
      isOpen={isOpen}
      data={data}
      onClose={() => setIsOpen(false)}
    />
  )
}
```

**After:**
```typescript
function MyComponent() {
  const { isRightPanelOpen, rightPanelData, closeRightPanel } = usePanelStore()

  return (
    <ChildComponent
      isOpen={isRightPanelOpen}
      data={rightPanelData}
      onClose={closeRightPanel}
    />
  )
}
```

Benefits:
- No prop drilling
- State persists across component unmounts
- Multiple components can access same state
- Easy to test
- DevTools for debugging

## Next Steps

Week 2 tasks will use these stores to:
1. Create generic `SpatialEntity` data model
2. Build template system for different use cases
3. Implement real-time data streaming
4. Create demo fleet dataset (200 vehicles)
