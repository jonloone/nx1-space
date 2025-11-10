# Space Domain UI/UX Critical Analysis
## Current State Assessment & Best Practices Comparison

**Date:** November 2025
**Status:** Critical Review Requested

---

## 1. CURRENT IMPLEMENTATION ISSUES

### Problem: Imagery Control Panel Not Visible

**Root Cause:**
The `SpaceImageryControlPanel` was added inside `SatelliteTrackingIntegration`, which renders within a right sidebar panel structure. The panel is likely:
- Hidden by scrolling/overflow
- Positioned incorrectly within the panel hierarchy
- Blocked by the satellite tracking panel's max-height constraints

**Architecture Flaw:**
```typescript
// Current (FLAWED):
SatelliteTrackingIntegration
  └─ SatelliteTrackingPanel (right sidebar, fixed height)
      └─ SpaceImageryControlPanel (hidden/inaccessible)
```

### Domain Selection Confusion

**Current Issues:**
1. **No Clear Domain Switcher**: Users don't understand they're in "Space" domain
2. **Separate Tracking vs Imagery**: Satellite tracking and imagery feel disconnected
3. **Hidden Context**: No indication of what capabilities are available per domain
4. **No Progressive Disclosure**: All controls visible at once = cognitive overload

---

## 2. BEST PRACTICES ANALYSIS

### Reference Platforms Studied

#### **Sentinel Hub EO Browser**
- **Domain Organization**: Clear tabs (Sentinel-2, Sentinel-3, Landsat, etc.)
- **Layer Selection**: Visual band combinations with previews
- **Time Selection**: Prominent timeline scrubber at top
- **Visualization**: Multiple compare modes (split, swipe, opacity)
- **Search**: Location-based with date range filters
- **Analysis**: Built-in indices (NDVI, NDWI, etc.) as layer options

#### **Google Earth Engine Code Editor**
- **Layer Management**: Explicit add/remove with visibility toggles
- **Inspector Tool**: Click map to query all active layers
- **Console**: Shows available data and metadata
- **Band Visualization**: Separate panel for band math/composites

#### **Planet Explorer**
- **Mosaic View**: Shows available imagery as heatmap
- **AOI Tool**: Draw area of interest first, then search
- **Subscription Model**: Shows data availability before loading
- **Comparison**: Side-by-side or overlay mode

#### **QGIS / ArcGIS Pro** (Desktop GIS)
- **Layer Panel**: Tree structure with visibility, opacity, reordering
- **Catalogs**: Separate data source browsers
- **Symbology**: Per-layer rendering controls
- **Processing**: Separate tools/analysis menu

---

## 3. CRITICAL UI/UX FLAWS IN CURRENT DESIGN

### Flaw #1: No Domain Context Awareness
**Problem:** Users don't know what "domain" they're in or what it means.

**What We Have:**
- Domain selector buried in left sidebar
- No visual indication of active domain
- Capabilities hidden until domain selected

**What We Need:**
```
┌─────────────────────────────────────────┐
│ 🌍 CYBER  🛰️ SPACE  🏢 PHYSICAL  📡 SIGINT │ ← Prominent tabs
│           ▔▔▔▔▔                           │
└─────────────────────────────────────────┘
```

### Flaw #2: Satellite Tracking != Satellite Imagery
**Problem:** These are two COMPLETELY different capabilities being conflated.

**Satellite Tracking:**
- Purpose: Monitor orbital mechanics, predict passes
- Users: Space operators, ground station planners
- Data: TLE elements, position vectors, orbital parameters
- Workflow: Select satellite → Track position → Predict passes

**Satellite Imagery:**
- Purpose: Analyze Earth observations, change detection
- Users: Intelligence analysts, environmental scientists
- Data: Multispectral rasters, time-series, indices
- Workflow: Select AOI → Query archives → Analyze temporal changes

**Current Design (WRONG):**
Both mashed together in one panel, creating confusion about purpose.

**Correct Design:**
These should be **separate sub-domains** or **modes within Space domain**.

### Flaw #3: No Layer Management Paradigm
**Problem:** Users can't manage what's on the map.

**Missing Capabilities:**
- No layer list showing what's active
- No ability to reorder layers (z-index)
- No per-layer opacity control
- No toggle layer visibility
- No clear visual hierarchy of data sources

**What Users Expect (GIS Mental Model):**
```
Layers
├─ 📸 Sentinel-2 (2024-11-10) [opacity: 80%] [👁️]
├─ 🛰️ ISS Ground Track [👁️]
├─ 🏢 Buildings (3D) [👁️ OFF]
└─ 🗺️ Base Map [👁️]
```

### Flaw #4: Temporal Navigation is Afterthought
**Problem:** Timeline buried at bottom, only appears after imagery loaded.

**Best Practice (Sentinel Hub):**
- Timeline always visible when in imagery mode
- Shows data availability as visual density
- Allows scrubbing before imagery loads
- Highlights selected date

**Current:**
Timeline appears only after "Load Imagery Here" (which user can't find).

### Flaw #5: Zoom-Gating UX is Confusing
**Problem:** "Zoom to level 12 to load imagery" is arbitrary to users.

**Why This Fails:**
- No context for why zoom matters
- No preview of coverage area
- No indication of resolution at current zoom
- User might zoom to empty area with no imagery

**Better Approach:**
1. Show imagery **footprints** on map at any zoom (like Planet)
2. Highlight available tiles in viewport
3. Load hi-res when zoomed in
4. Progressive loading: thumbnails → tiles → full resolution

---

## 4. PROPOSED REDESIGN: SPACE DOMAIN UX

### Principle: Separate Concerns

#### **Mode 1: Orbit Tracking** (Current satellite tracking)
**Purpose:** Monitor satellites in real-time
**Primary Actions:**
- Add satellite by name/catalog #
- View orbital parameters
- Track ground path
- Predict passes over ground station

**UI Location:** Right sidebar, collapsible panel
**Visual:** Orbital paths drawn on map, satellite icons

#### **Mode 2: Earth Observation** (Satellite imagery analysis)
**Purpose:** Analyze time-series imagery
**Primary Actions:**
- Define AOI (area of interest)
- Query imagery archives
- Compare dates
- Run analysis (NDVI, change detection)

**UI Location:** Dedicated panel system (not crammed in sidebar)
**Visual:** Imagery overlays on map, timeline scrubber

#### **Mode Switcher:**
```
┌──────────────────────────────────────┐
│ Space Domain                          │
│ ○ Orbit Tracking  ● Earth Observation│
└──────────────────────────────────────┘
```

### Redesigned Earth Observation Workflow

#### Step 1: AOI Definition
```
┌─────────────────────────────────────────┐
│ 1️⃣ Define Area of Interest              │
│                                          │
│ ○ Current View (zoom to area)           │
│ ○ Draw Rectangle                         │
│ ○ Draw Polygon                           │
│ ○ Enter Coordinates                      │
│ ○ Search Location                        │
│                                          │
│ [✓] Show imagery availability           │
└─────────────────────────────────────────┘
```

**What Happens:**
- Map shows Sentinel-2 tile grid overlay
- Tiles colored by availability (green=recent, yellow=older, gray=none)
- No imagery loads yet, just metadata query

#### Step 2: Temporal Query
```
┌─────────────────────────────────────────┐
│ 2️⃣ Select Time Range                    │
│                                          │
│ From: [2024-08-10] To: [2024-11-10]     │
│                                          │
│ Max Cloud Cover: [20%] ▓▓▓░░░░░░░ 20%   │
│                                          │
│ Timeline:                                │
│ ├─────┬─────┬─────┬─────┬─────┬──►     │
│ Aug   Sep   Oct   Nov   Dec              │
│  ●●   ●●●●  ●●    ●●●●● ●              │
│  ^found 23 images                        │
│                                          │
│ [Load Imagery →]                         │
└─────────────────────────────────────────┘
```

**What Happens:**
- Timeline shows available dates as dots
- Density indicates data availability
- Still no imagery loaded, keeping it fast

#### Step 3: Layer Configuration
```
┌─────────────────────────────────────────┐
│ 3️⃣ Visualization                        │
│                                          │
│ Band Combination:                        │
│ ● True Color (RGB)                       │
│ ○ False Color Infrared                   │
│ ○ Agriculture (NDVI)                     │
│ ○ Water Index (NDWI)                     │
│ ○ Custom...                              │
│                                          │
│ Opacity: ▓▓▓▓▓▓▓▓░░ 80%                 │
│                                          │
│ Compare Mode:                            │
│ ○ Single  ● Split  ○ Swipe  ○ Opacity   │
│                                          │
│ Before: [2024-08-10 ▼]                   │
│ After:  [2024-11-10 ▼]                   │
└─────────────────────────────────────────┘
```

#### Step 4: Analysis Tools
```
┌─────────────────────────────────────────┐
│ 🔬 Analysis                              │
│                                          │
│ [ ] Change Detection                     │
│ [ ] Feature Extraction                   │
│ [ ] Spectral Indices                     │
│ [ ] Time Series Chart                    │
│ [ ] Cloud Masking                        │
│                                          │
│ [Run Analysis →]                         │
└─────────────────────────────────────────┘
```

---

## 5. LAYER PANEL ARCHITECTURE

### Sentinel Hub Approach (Ideal)

```
Layers Panel (Right Sidebar)
├─ Data Sources
│   ├─ [+] Add Data Source
│   ├─ ✓ Sentinel-2 L2A
│   ├─ ✓ Landsat 8/9
│   └─ ☐ Planet SkySat
│
├─ Active Layers
│   ├─ 📸 Sentinel-2 (2024-11-10)
│   │   ├─ Opacity: ▓▓▓▓░░░░ 60%
│   │   ├─ Bands: RGB (True Color)
│   │   ├─ [👁️] [🗑️] [⚙️]
│   │   └─ ▼ Advanced
│   │       ├─ Contrast: ▓▓▓▓▓░░░
│   │       ├─ Brightness: ▓▓▓▓▓░░░
│   │       └─ Saturation: ▓▓▓▓▓░░░
│   │
│   ├─ 🛰️ ISS Ground Track
│   │   └─ [👁️] [🗑️]
│   │
│   └─ 🗺️ Base Map (Mapbox)
│       └─ [👁️]
│
└─ [+ Add Layer]
```

### Our Current Capabilities → Realistic Implementation

**We CAN do:**
- ✅ Layer list with visibility toggles
- ✅ Per-layer opacity control
- ✅ Remove layers
- ✅ Reorder layers (z-index)
- ✅ Sentinel-2 true color imagery
- ✅ Timeline scrubbing
- ✅ Compare mode (split screen)
- ✅ AOI-based queries
- ✅ Cloud cover filtering

**We CANNOT do (yet):**
- ❌ Band math / custom composites
- ❌ Spectral indices (NDVI, NDWI) - would need processing pipeline
- ❌ Change detection algorithms - would need ML/CV backend
- ❌ Multiple data sources (only Sentinel-2)
- ❌ Feature extraction

**Realistic MVP:**
```
Layers
├─ 📸 Sentinel-2 Imagery
│   ├─ Date: [2024-11-10 ▼]
│   ├─ Opacity: ▓▓▓▓▓▓░░ 75%
│   └─ [👁️] [🗑️]
│
├─ 🛰️ Satellite Tracks
│   ├─ ISS [👁️]
│   ├─ Sentinel-2A [👁️]
│   └─ [+ Add Satellite]
│
├─ 📍 Infrastructure
│   ├─ Buildings [👁️ OFF]
│   ├─ Roads [👁️]
│   └─ Places [👁️]
│
└─ 🗺️ Base Map [👁️]
```

---

## 6. RECOMMENDED ARCHITECTURE CHANGES

### Current File Structure (FLAWED)
```
components/space/
├─ SatelliteTrackingPanel.tsx      ← Orbit tracking
├─ SatelliteTrackingIntegration.tsx
├─ SpaceImageryControlPanel.tsx    ← Hidden/lost
├─ SpaceDomainIntegration.tsx      ← Imagery
└─ SatelliteTimelinePanel.tsx
```

**Problem:** No clear separation of concerns.

### Proposed Structure (BETTER)
```
components/space/
├─ SpaceDomainPanel.tsx             ← Mode switcher
├─ orbit-tracking/
│   ├─ OrbitTrackingMode.tsx        ← Container
│   ├─ SatelliteSelector.tsx        ← Add satellites
│   ├─ SatelliteList.tsx            ← Show tracked
│   └─ OrbitControls.tsx            ← Update interval, etc.
│
├─ earth-observation/
│   ├─ EarthObservationMode.tsx     ← Container
│   ├─ AOISelector.tsx              ← Define area
│   ├─ TemporalQuery.tsx            ← Date range + filters
│   ├─ ImageryVisualization.tsx     ← Band selection, opacity
│   ├─ CompareMode.tsx              ← Split/swipe controls
│   └─ TimelinePanel.tsx            ← Bottom timeline
│
└─ shared/
    ├─ LayerManager.tsx              ← Universal layer list
    └─ MapControls.tsx               ← Shared map interactions
```

### Component Hierarchy
```
OperationsPage
├─ LeftSidebar
│   └─ DomainSelector (CYBER/SPACE/PHYSICAL/SIGINT)
│
├─ Map (Mapbox)
│   ├─ Base map layer
│   ├─ Dynamic layers (managed by LayerManager)
│   └─ Interaction handlers
│
├─ RightPanel
│   ├─ [IF SPACE DOMAIN]
│   │   ├─ SpaceDomainTabs
│   │   │   ├─ Tab: Orbit Tracking
│   │   │   └─ Tab: Earth Observation
│   │   │
│   │   ├─ [IF Orbit Tracking]
│   │   │   └─ OrbitTrackingMode
│   │   │
│   │   └─ [IF Earth Observation]
│   │       └─ EarthObservationMode
│   │           ├─ AOISelector
│   │           ├─ TemporalQuery
│   │           └─ ImageryVisualization
│   │
│   └─ LayerManager (always visible)
│       └─ List of active layers with controls
│
└─ BottomPanel
    └─ [IF imagery loaded]
        └─ TimelinePanel
            ├─ Timeline scrubber
            ├─ Thumbnail previews
            └─ Playback controls
```

---

## 7. IMMEDIATE FIXES (Quick Wins)

### Fix #1: Make Imagery Control Visible
**Move** `SpaceImageryControlPanel` out of `SatelliteTrackingIntegration`.

**New placement:**
```typescript
// In operations/page.tsx:
<RightPanel>
  {currentDomain === 'space' && (
    <>
      <SatelliteTrackingPanel />
      <SpaceImageryControlPanel map={map} /> // ← Separate, below tracking
    </>
  )}
</RightPanel>
```

### Fix #2: Add Layer Manager Component
Create a persistent layer list showing all active map layers:
- Sentinel-2 imagery (if loaded)
- Satellite ground tracks
- Buildings, roads, places
- Base map

### Fix #3: Mode Switcher for Space Domain
Add tabs at top of right panel:
```
[Orbit Tracking] [Earth Observation]
```
Toggle between two distinct workflows.

### Fix #4: Timeline Always Visible in EO Mode
Move timeline to top of EO panel (not bottom of map).
Show as collapsed state until imagery queried.

### Fix #5: AOI Tool Before Imagery Load
Add "Draw AOI" button that activates map drawing.
Only enable "Query Imagery" after AOI defined.

---

## 8. UX FLOW COMPARISON

### Current Flow (BROKEN)
```
1. User selects Space domain (unclear what happens)
2. Sees satellite tracking panel
3. Can add satellites, see orbits ✓
4. ???
5. Where is imagery?
6. User gives up
```

### Proposed Flow: Earth Observation
```
1. User selects Space domain
2. Sees tabs: [Orbit Tracking] [Earth Observation]
3. Clicks "Earth Observation"
4. Panel shows:
   - "Define AOI" button (glowing CTA)
   - Timeline (collapsed, says "Query imagery to see timeline")
5. User clicks "Define AOI"
   - Map cursor changes to draw mode
   - Draws rectangle on map
   - AOI highlighted
6. Panel updates:
   - Shows AOI coordinates
   - "Query Imagery" button enabled
   - Date range picker visible
7. User selects date range
8. Clicks "Query Imagery"
   - API call to AWS STAC
   - Timeline expands, shows available dates as dots
   - First/latest image auto-selected
9. Imagery loads on map
10. Layer Manager shows: "Sentinel-2 (2024-11-10)" with opacity slider
11. Timeline allows scrubbing through dates
12. User clicks "Compare Mode"
    - Selects before/after dates
    - Map splits vertically
13. User analyzes change over time ✓
```

---

## 9. RECOMMENDED PHASED IMPLEMENTATION

### Phase 1: Structural Fixes (1-2 days)
- [ ] Move `SpaceImageryControlPanel` to visible location
- [ ] Add mode tabs to Space domain (Orbit Tracking / Earth Observation)
- [ ] Create basic `LayerManager` component
- [ ] Fix timeline positioning (top of panel, not map bottom)

### Phase 2: AOI Workflow (2-3 days)
- [ ] Add AOI drawing tool (Mapbox Draw)
- [ ] Disable imagery query until AOI defined
- [ ] Show imagery footprint availability
- [ ] Add date range picker
- [ ] Refactor query flow: AOI → Date → Query → Load

### Phase 3: Layer Management (2-3 days)
- [ ] Implement layer list with visibility toggles
- [ ] Add per-layer opacity controls
- [ ] Enable layer reordering
- [ ] Group layers by type (Imagery / Tracks / Infrastructure / Base)
- [ ] Add layer metadata tooltips

### Phase 4: Enhanced Visualization (3-5 days)
- [ ] Improve timeline with data availability visualization
- [ ] Add split-screen compare mode (before/after)
- [ ] Implement swipe compare mode
- [ ] Add playback controls (play/pause/speed)
- [ ] Thumbnail previews in timeline

### Phase 5: Advanced Features (Future)
- [ ] Multi-source support (Landsat, Planet)
- [ ] Band math / custom composites
- [ ] Spectral indices (NDVI, NDWI)
- [ ] Change detection algorithms
- [ ] Export/download capabilities

---

## 10. KEY TAKEAWAYS

### What We Got WRONG
1. **Mixing capabilities**: Orbit tracking ≠ Earth observation
2. **Hidden controls**: Imagery panel buried/invisible
3. **No layer management**: Can't see/control what's on map
4. **Workflow unclear**: No guided user journey
5. **Temporal navigation poor**: Timeline afterthought

### What We Should COPY from Sentinel Hub
1. **Clear data source selection**
2. **Timeline-first approach** (show availability before loading)
3. **AOI-first workflow** (define area before querying)
4. **Layer management** (visual list with controls)
5. **Compare modes** (split, swipe, opacity)

### What We CAN'T Do (Yet)
1. Band math / custom composites
2. Spectral indices
3. Change detection algorithms
4. Multiple data sources
5. Advanced processing

### Realistic MVP
**Focus on doing ONE thing well:**
- Earth observation time-series analysis
- AOI-based queries
- Timeline scrubbing
- Basic compare mode
- Layer management

**Defer orbit tracking to separate mode/view.**

---

## CONCLUSION

Our current Space domain UI fails basic GIS/EO platform UX principles. The core issue is **conflating two unrelated capabilities** (orbit tracking vs. imagery analysis) and **hiding critical controls**.

**Priority actions:**
1. Separate orbit tracking from earth observation
2. Make imagery controls visible and prominent
3. Implement layer management
4. Fix AOI → Query → Load workflow
5. Study and emulate Sentinel Hub's UX patterns

**Success metrics:**
- User can find imagery controls without help
- User can define AOI and query imagery in <30 seconds
- User can compare two dates in <1 minute
- Layer list shows all active data clearly

This redesign brings us from **confusing prototype** to **usable GIS tool**.
