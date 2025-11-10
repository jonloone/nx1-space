# Space Domain UI Redesign Plan
## Viewport-First Earth Observation + Layer Management

**Objective:** Transform Space domain from confusing prototype to professional GIS tool
**Approach:** Viewport-based queries + Layer management + Mode separation
**Timeline:** 3-5 days full implementation

---

## Design Principles

1. **Viewport-First**: Default to "query what you see" (modern web mapping)
2. **Progressive Disclosure**: Show simple → advanced as needed
3. **Layer-Centric**: All data visible in layer panel (GIS mental model)
4. **Mode Separation**: Orbit tracking ≠ Earth observation
5. **Speed**: Minimize clicks to first result

---

## Architecture Overview

### Component Structure

```
components/space/
├── SpaceDomainPanel.tsx              ← Main container with mode switcher
│
├── orbit-tracking/
│   ├── OrbitTrackingMode.tsx         ← Orbit tracking container
│   ├── SatelliteSelector.tsx         ← Search/add satellites
│   ├── SatelliteList.tsx             ← List tracked satellites
│   └── OrbitControls.tsx             ← Update interval, etc.
│
├── earth-observation/
│   ├── EarthObservationMode.tsx      ← EO container
│   ├── ViewportQueryPanel.tsx        ← Main query interface (NEW)
│   ├── AOIDrawTool.tsx               ← Optional AOI drawing (NEW)
│   ├── TemporalControls.tsx          ← Date range, filters
│   ├── VisualizationPanel.tsx        ← Opacity, compare mode
│   └── TimelinePanel.tsx             ← Bottom timeline
│
└── shared/
    ├── LayerManager.tsx               ← Universal layer list (NEW)
    ├── LayerItem.tsx                  ← Individual layer control
    └── MapControls.tsx                ← Shared map tools
```

---

## Mode 1: Orbit Tracking

**Purpose:** Monitor satellites in real-time for ground station operations
**Users:** Space operators, satellite trackers
**Location:** Right panel when "Orbit Tracking" tab selected

### UI Layout
```
┌──────────────────────────────────────────┐
│ 🛰️ Orbit Tracking                        │
├──────────────────────────────────────────┤
│                                           │
│ Search Satellite:                         │
│ [ISS                           ] [Search] │
│                                           │
│ Quick Add:                                │
│ [ISS] [Sentinel-2A] [Landsat 8] [HST]   │
│                                           │
│ ─────────────────────────────────────────│
│                                           │
│ Tracked Satellites (3)                    │
│                                           │
│ ┌─ ISS (ZARYA) ──────────────────── ×   │
│ │ Lat: 38.92°N  Lon: 77.03°W           │
│ │ Alt: 419 km   Vel: 7.66 km/s         │
│ │ Period: 92 min  Inc: 51.6°           │
│ │ Updated: 10:23:45                    │
│ └──────────────────────────────────────│
│                                           │
│ ┌─ SENTINEL-2A ───────────────── ×      │
│ │ ...                                   │
│ └──────────────────────────────────────│
│                                           │
│ ─────────────────────────────────────────│
│                                           │
│ Update Interval:  [1s] [5s] [10s]       │
│                                           │
└──────────────────────────────────────────┘
```

**Features:**
- Add satellites by name/catalog #
- Real-time position updates
- Orbital parameters display
- Ground tracks on map
- No imagery capabilities

---

## Mode 2: Earth Observation (PRIMARY FOCUS)

**Purpose:** Analyze satellite imagery time-series
**Users:** Intelligence analysts, environmental scientists
**Location:** Right panel when "Earth Observation" tab selected

### Panel Structure

```
┌────────────────────────────────────────────────┐
│ 🌍 Earth Observation                            │
├────────────────────────────────────────────────┤
│                                                 │
│ 📍 Query Location                               │
│ ┌───────────────────────────────────────────┐ │
│ │ Current View:                              │ │
│ │ Center: 38.9072°N, 77.0369°W              │ │
│ │ Zoom: 13 (40m/pixel)                      │ │
│ │                                            │ │
│ │ [🔍 Query Imagery in View]  ← PRIMARY     │ │
│ │                                            │ │
│ │ ─ Advanced ─                              │ │
│ │ [📐 Draw Custom AOI]                      │ │
│ │ [📂 Load Saved AOI]                       │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ 📅 Time Range                                   │
│ ┌───────────────────────────────────────────┐ │
│ │ From: [2024-08-10 ▼]                      │ │
│ │ To:   [2024-11-10 ▼] (Today)             │ │
│ │                                            │ │
│ │ Filters:                                   │ │
│ │ Max Cloud Cover: 20% ▓▓░░░░░░░░          │ │
│ │ [✓] Only with data in AOI                 │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ 🎨 Visualization (when imagery loaded)         │
│ ┌───────────────────────────────────────────┐ │
│ │ Current: Sentinel-2 (2024-11-10)          │ │
│ │                                            │ │
│ │ Band Combo: [True Color ▼]               │ │
│ │ Opacity: ▓▓▓▓▓▓▓▓░░ 80%                  │ │
│ │                                            │ │
│ │ Compare Mode:                              │ │
│ │ ○ Single  ● Split  ○ Swipe                │ │
│ │                                            │ │
│ │ Before: [2024-08-10 ▼]                    │ │
│ │ After:  [2024-11-10 ▼]                    │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
└────────────────────────────────────────────────┘
```

### Workflow: Viewport-Based (Default)

**Step 1: Navigate to Area**
```
User: Zooms/pans map to Washington DC
System: Updates "Current View" coordinates in real-time
```

**Step 2: Query Imagery**
```
User: Clicks "Query Imagery in View"
System:
  - Captures viewport bounds
  - Queries AWS STAC API for Sentinel-2 within bounds + date range
  - Shows loading indicator
  - Returns available dates
```

**Step 3: Timeline Appears**
```
Timeline panel expands at bottom:
┌─────────────────────────────────────────────────┐
│ Sentinel-2 Time Series (23 images)              │
│                                                  │
│ Aug ─────── Sep ─────── Oct ─────── Nov ───►   │
│  ●●   ●●●●●   ●●   ●●●●●●●   ●●●              │
│                                           ▲      │
│                                    Selected      │
│                                                  │
│ [◄] [►] [▶] Speed: 1x                           │
└─────────────────────────────────────────────────┘
```

**Step 4: Select Date**
```
User: Clicks dot on timeline OR clicks thumbnail
System: Loads imagery for that date on map
Layer Manager updates: "Sentinel-2 (2024-11-10)" added
```

**Step 5: Explore**
```
User can:
- Scrub timeline to animate through dates
- Adjust opacity slider
- Enable compare mode for before/after
- Pan/zoom (imagery follows viewport)
- Click "Query Imagery in View" again for new area
```

### Workflow: AOI-Based (Advanced)

**When to use:**
- Precise boundary needed
- Irregular shape (not rectangle)
- Reproducible analysis
- Save AOI for later

**Step 1: Draw AOI**
```
User: Clicks "Draw Custom AOI"
System:
  - Activates Mapbox Draw
  - Cursor changes to crosshair
  - User draws rectangle/polygon
  - AOI highlighted in blue
```

**Step 2: AOI Locked**
```
Panel updates:
┌───────────────────────────────────────────┐
│ 📍 Query Location                          │
│ ┌─────────────────────────────────────────┤
│ │ 🔒 AOI Active: "Washington DC"          │
│ │ Area: 25.4 km²                          │
│ │                                          │
│ │ [Edit AOI] [Clear AOI] [Save AOI]       │
│ └─────────────────────────────────────────┘
│                                             │
│ [🔍 Query Imagery in AOI]                  │
└─────────────────────────────────────────────┘
```

**Step 3: Query with AOI**
```
User: Clicks "Query Imagery in AOI"
System:
  - Uses AOI geometry (not viewport) for query
  - Panning map doesn't change query area
  - AOI stays highlighted
```

**Step 4: Manage AOI**
```
User can:
- Edit: Modify polygon vertices
- Clear: Return to viewport mode
- Save: Store AOI with name for later
- Load: Recall saved AOI
```

---

## Layer Manager (NEW)

**Purpose:** Central control for all map layers
**Location:** Right panel, always visible (below mode panels)
**Inspiration:** QGIS, ArcGIS Pro, Sentinel Hub

### UI Design

```
┌────────────────────────────────────────────┐
│ 🗂️ Layers                                   │
├────────────────────────────────────────────┤
│                                             │
│ 📸 Imagery                                  │
│ ┌─ Sentinel-2 (2024-11-10) ──────────────┐│
│ │ Opacity: ▓▓▓▓▓▓▓▓░░ 80%                ││
│ │ [👁️] [⚙️] [🗑️]                          ││
│ └─────────────────────────────────────────┘│
│                                             │
│ 🛰️ Satellite Tracks                        │
│ ┌─ ISS Ground Track ──────────────────────┐│
│ │ [👁️] [🗑️]                                ││
│ └─────────────────────────────────────────┘│
│ ┌─ Sentinel-2A Ground Track ──────────────┐│
│ │ [👁️] [🗑️]                                ││
│ └─────────────────────────────────────────┘│
│                                             │
│ 📍 Infrastructure                           │
│ ┌─ Buildings (3D) ─────────────────────────┐│
│ │ [👁️ OFF] [⚙️]                            ││
│ └─────────────────────────────────────────┘│
│ ┌─ Roads ──────────────────────────────────┐│
│ │ [👁️] [⚙️]                                ││
│ └─────────────────────────────────────────┘│
│ ┌─ Places ─────────────────────────────────┐│
│ │ [👁️] [⚙️]                                ││
│ └─────────────────────────────────────────┘│
│                                             │
│ 🗺️ Base Map                                │
│ ┌─ Mapbox Light ──────────────────────────┐│
│ │ [👁️] [⚙️]                                ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [+ Add Layer]                               │
└────────────────────────────────────────────┘
```

### Layer Controls

**For each layer:**
- **👁️ Visibility Toggle**: Show/hide layer instantly
- **⚙️ Settings**:
  - Imagery: Opacity, band combination
  - Tracks: Color, line width
  - Infrastructure: Styling options
- **🗑️ Remove**: Delete layer from map
- **Drag handle**: Reorder layers (z-index)

### Layer Groups

Layers organized by category:
1. **Imagery**: Satellite imagery overlays
2. **Satellite Tracks**: Orbital ground paths
3. **Infrastructure**: Buildings, roads, places
4. **Base Map**: Underlying map style

### State Management

```typescript
interface Layer {
  id: string
  name: string
  type: 'imagery' | 'track' | 'infrastructure' | 'basemap'
  visible: boolean
  opacity: number
  zIndex: number
  source: any // Mapbox source
  style: any // Rendering style
  metadata?: {
    date?: Date
    satellite?: string
    resolution?: string
  }
}

interface LayerManagerState {
  layers: Layer[]
  selectedLayer: string | null

  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  toggleVisibility: (id: string) => void
  setOpacity: (id: string, opacity: number) => void
  reorderLayers: (layerIds: string[]) => void
}
```

---

## Timeline Panel (Enhanced)

**Location:** Bottom of screen when imagery loaded
**Behavior:** Collapsible, draggable height

### Design

```
┌─────────────────────────────────────────────────────────┐
│ 🛰️ Sentinel-2 Time Series (23 images) [Minimize] [×]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [◄] [▶] [▶▶] Speed: 1x  ┊  Date: 2024-11-10           │
│                                                          │
│ Aug ──────── Sep ──────── Oct ──────── Nov ─────────►  │
│  ●●   ●●●●●   ●●   ●●●●●●●   ●●●                      │
│                                    ▲                     │
│                             Selected (23/23)             │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Thumbnails: (hover to preview)                      │ │
│ │                                                      │ │
│ │ [▮ 08/10] [▮ 08/15] ... [▮ 11/10] [▮ 11/12]       │ │
│ │    20%       15%           5%         8%             │ │
│ │  cloud     cloud        cloud      cloud            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Filters: [✓] Hide cloudy (>30%)  [✓] Show only clear  │
└─────────────────────────────────────────────────────────┘
```

### Features

1. **Visual Timeline**
   - Dots represent available dates
   - Density shows data frequency
   - Selected date highlighted

2. **Playback Controls**
   - Play/Pause: Auto-advance through timeline
   - Speed: 0.5x, 1x, 2x, 5x
   - Loop: Restart when reaching end

3. **Thumbnail Previews**
   - Small preview of each image
   - Cloud cover % shown
   - Hover for larger preview
   - Click to load

4. **Filters**
   - Hide cloudy images
   - Show only clear
   - Date range slider

5. **Export**
   - Download selected imagery
   - Export timeline as video
   - Save comparison as image

---

## Implementation Plan

### Phase 1: Quick Fixes (Day 1 - 4 hours)

**Goal:** Make current implementation visible and usable

1. **Fix Imagery Control Visibility**
   ```typescript
   // Remove from SatelliteTrackingIntegration
   // Add directly to RightPanel
   ```

2. **Add Mode Tabs**
   ```typescript
   const [mode, setMode] = useState<'tracking' | 'observation'>('observation')

   return (
     <div className="tabs">
       <Tab active={mode === 'tracking'} onClick={() => setMode('tracking')}>
         🛰️ Orbit Tracking
       </Tab>
       <Tab active={mode === 'observation'} onClick={() => setMode('observation')}>
         🌍 Earth Observation
       </Tab>
     </div>
   )
   ```

3. **Basic Layer List**
   - Show what's currently on map
   - Add visibility toggles
   - Quick win for user clarity

### Phase 2: Viewport Query (Day 2 - 6 hours)

**Goal:** Implement viewport-based query flow

1. **ViewportQueryPanel Component**
   - Show current viewport coords
   - "Query Imagery in View" button
   - Captures map bounds on click
   - Queries AWS STAC API

2. **Update spaceStore**
   ```typescript
   interface SpaceStore {
     queryMode: 'viewport' | 'aoi'
     viewport: {
       bounds: [[number, number], [number, number]]
       center: [number, number]
       zoom: number
     }

     queryImageryInViewport: (map: Map) => Promise<void>
     // ... existing methods
   }
   ```

3. **Wire up to existing timeline**
   - Timeline appears after query
   - Shows available dates
   - Loads imagery on selection

### Phase 3: Layer Manager (Day 3 - 8 hours)

**Goal:** Implement proper layer management

1. **LayerManager Component**
   - List all active layers
   - Group by category
   - Visibility toggles
   - Opacity sliders

2. **LayerItem Component**
   - Individual layer controls
   - Drag handle for reordering
   - Settings dropdown
   - Remove button

3. **Layer State Store**
   ```typescript
   interface LayerStore {
     layers: Layer[]
     addLayer: (layer: Layer) => void
     removeLayer: (id: string) => void
     toggleVisibility: (id: string) => void
     setOpacity: (id: string, opacity: number) => void
     reorderLayers: (ids: string[]) => void
   }
   ```

4. **Integration**
   - Update when imagery loaded
   - Update when satellite tracks added
   - Sync with existing Mapbox layers

### Phase 4: AOI Tool (Optional) (Day 4 - 6 hours)

**Goal:** Add advanced AOI drawing for power users

1. **Install Mapbox Draw**
   ```bash
   npm install @mapbox/mapbox-gl-draw
   ```

2. **AOIDrawTool Component**
   - "Draw Custom AOI" button
   - Activates Mapbox Draw
   - Saves geometry
   - Shows locked AOI state

3. **AOI Management**
   - Edit polygon
   - Clear AOI
   - Save AOI with name
   - Load saved AOIs

### Phase 5: Enhanced Timeline (Day 5 - 6 hours)

**Goal:** Improve timeline with thumbnails and playback

1. **Thumbnail Generation**
   - Fetch low-res previews from STAC
   - Show in timeline
   - Hover for larger preview

2. **Playback Controls**
   - Play/pause button
   - Speed control
   - Loop option
   - Progress indicator

3. **Timeline Filters**
   - Hide cloudy images
   - Date range slider
   - Show/hide thumbnails

---

## File Structure (New)

```
components/
├── space/
│   ├── SpaceDomainPanel.tsx           ← Mode switcher container
│   │
│   ├── orbit-tracking/
│   │   ├── OrbitTrackingMode.tsx
│   │   ├── SatelliteSelector.tsx
│   │   ├── SatelliteList.tsx
│   │   └── OrbitControls.tsx
│   │
│   ├── earth-observation/
│   │   ├── EarthObservationMode.tsx   ← NEW: Main container
│   │   ├── ViewportQueryPanel.tsx     ← NEW: Viewport query UI
│   │   ├── AOIDrawTool.tsx            ← NEW: Optional AOI tool
│   │   ├── TemporalControls.tsx       ← NEW: Date range, filters
│   │   ├── VisualizationPanel.tsx     ← Opacity, compare mode
│   │   └── TimelinePanel.tsx          ← Enhanced timeline
│   │
│   └── shared/
│       ├── LayerManager.tsx           ← NEW: Layer list
│       ├── LayerItem.tsx              ← NEW: Individual layer
│       └── MapControls.tsx
│
├── opintel/
│   └── panels/
│       └── RightPanel.tsx             ← Update to show Space domain
│
└── ...

lib/
├── stores/
│   ├── spaceStore.ts                  ← Update with viewport query
│   ├── layerStore.ts                  ← NEW: Layer management state
│   └── satelliteTrackingStore.ts      ← Keep for orbit tracking
│
└── services/
    ├── satelliteImageryService.ts     ← Update with viewport query
    └── layerManagementService.ts      ← NEW: Layer CRUD operations
```

---

## Success Metrics

### Before (Current State)
- ❌ User can't find imagery controls
- ❌ No layer management
- ❌ Unclear what domain does
- ❌ Orbit tracking mixed with imagery
- ⏱️ Time to first imagery: Unknown (user gives up)

### After (Redesigned)
- ✅ User sees clear mode tabs
- ✅ "Query Imagery in View" button prominent
- ✅ Layer list shows all map data
- ✅ Orbit tracking separated
- ⏱️ Time to first imagery: <30 seconds

### Key UX Improvements
1. **Discoverability**: User finds imagery controls in <5 seconds
2. **Speed**: Viewport query faster than AOI drawing
3. **Clarity**: Layer list shows what's active
4. **Flexibility**: Viewport for speed, AOI for precision
5. **Professional**: Matches GIS tool expectations

---

## Migration Strategy

### Keep Existing (Refactor)
- ✅ `SatelliteTrackingStore` → Move to orbit-tracking/
- ✅ `SpaceStore` → Enhance with viewport query
- ✅ `SatelliteTimelinePanel` → Enhance with playback
- ✅ `SpaceDomainIntegration` → Refactor as container

### Build New
- 🆕 `LayerManager` + `LayerStore`
- 🆕 `ViewportQueryPanel`
- 🆕 `EarthObservationMode` container
- 🆕 Mode switcher tabs

### Deprecate
- ❌ `SpaceImageryControlPanel` (replace with ViewportQueryPanel)
- ❌ `SatelliteTrackingIntegration` (split into separate modes)

---

## Next Steps

1. **Approve design** → Confirm viewport-first approach
2. **Phase 1 quick fixes** → Get imagery control visible (today)
3. **Implement phases 2-3** → Viewport query + Layer manager (this week)
4. **User testing** → Validate workflow improvements
5. **Phase 4-5 optional** → AOI tool + enhanced timeline (next week)

**Ready to start?** Let's begin with Phase 1 quick fixes to get the imagery control visible and usable today.
