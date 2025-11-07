# IC Domain Visualization System
## Intelligence Community Operational Domain Layer Management

**Version:** 1.0.0
**Date:** 2025-11-07
**Status:** Implemented

---

## Overview

The IC Domain Visualization System provides domain-specific map layer configurations and analysis controls aligned with Intelligence Community operational workflows. Each of the 6 IC operational domains (Ground, Maritime, Space, Surface, Air, Subsurface) has optimized default layers, basemaps, and analysis toolbars.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  AnalysisModeSwitcher  │  DomainAnalysisToolbar             │
│  (Domain Selection)    │  (Analysis Controls)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  DomainLayerService    │  ICAnalysisHandler                 │
│  (Layer Management)    │  (Query Processing)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Layer                         │
├─────────────────────────────────────────────────────────────┤
│  icDomainVisualization │  icDomains  │  icLayers            │
│  (Visual Configs)      │  (Domains)  │  (Layer Defs)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  LayerStore (Zustand)  │  MapStore   │  PanelStore          │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
network-intelligence/
├── lib/
│   ├── config/
│   │   ├── icDomains.ts                    # Domain definitions
│   │   ├── icLayers.ts                     # Cross-cutting layers
│   │   └── icDomainVisualization.ts        # ⭐ Visual configurations
│   │
│   ├── services/
│   │   ├── icAnalysisHandler.ts            # Query routing
│   │   ├── domainLayerService.ts           # ⭐ Layer management
│   │   └── domainHandlers/
│   │       ├── groundDomainHandler.ts
│   │       ├── maritimeDomainHandler.ts
│   │       └── spaceDomainHandler.ts
│   │
│   └── stores/
│       └── layerStore.ts                   # Layer state management
│
└── components/
    ├── chat/
    │   ├── AnalysisModeSwitcher.tsx        # Domain selector UI
    │   └── CopilotSidebarWrapper.tsx       # Chat integration
    │
    └── opintel/
        └── DomainAnalysisToolbar.tsx       # ⭐ Analysis controls UI
```

---

## IC Domain Configurations

### 1. Ground Domain

**Purpose:** Terrestrial operations, urban intelligence, infrastructure analysis

**Default Basemap:** `satellite-streets`
- **Why:** Realism (satellite imagery) + navigation context (road overlays)
- **Alternatives:** `light` (reports), `dark` (operations center), `satellite` (pure imagery)

**Priority Layers:**
1. **Buildings (3D/2D)** - Priority 1 - Essential
   - Line-of-sight analysis
   - Cover/concealment assessment
   - Urban operations planning

2. **Roads/Transportation** - Priority 2 - Essential
   - Movement corridors
   - Approach routes
   - Checkpoint placement

3. **Places/POI** - Priority 2 - Essential
   - Government facilities
   - Transportation hubs
   - Commercial centers

4. **Cell Towers** - Priority 3 - Critical
   - SIGINT infrastructure
   - Coverage mapping
   - Network analysis

5. **Addresses** - Priority 3 - Optional (on-demand)
   - Precision targeting
   - Location verification

**Analysis Controls (8):**
- **Time Playback:** Pattern-of-life studies, temporal analysis
- **Building Type Filter:** Residential, commercial, government, industrial, religious
- **POI Categories:** Government, transportation, commercial, healthcare, religious
- **Movement Heatmap:** Frequency visualization, dwell time analysis
- **Radius Analysis:** Buffer zones (100m, 250m, 500m, 1km, 5km)
- **Cell Tower Coverage:** SIGINT coverage visualization
- **Threat Level Overlay:** Risk assessment zones (red/yellow/green)
- **3D Buildings Toggle:** Height extrusion for tactical planning

**Visual Emphasis:**
- Earth tone color scheme (brown, green, gray)
- Dense label density for urban detail
- 3D buildings with type-based color coding
- Width-scaled roads by classification

**Viewport Defaults:**
- Pitch: 45° (tilted for 3D view)
- Bearing: 0°
- Zoom: 14 (street-level detail)

---

### 2. Maritime Domain

**Purpose:** Ocean operations, vessel tracking, port intelligence

**Default Basemap:** `satellite`
- **Why:** Minimal land distraction, focus on water/coastal features
- **Alternatives:** `dark` (operations center), `light` (reports)

**Priority Layers:**
1. **Maritime Routes** - Priority 1 - Essential
   - Shipping lanes
   - Traffic separation schemes
   - Route density analysis

2. **Ports/Harbor (POI)** - Priority 2 - Essential
   - Port infrastructure
   - Berths and terminals
   - Congestion monitoring

3. **Maritime Boundaries** - Priority 1 - Essential (control, not layer)
   - Territorial waters (12nm)
   - EEZ (200nm)
   - Contiguous zones

**Analysis Controls (6):**
- **Vessel Filter:** Cargo, tanker, passenger, fishing, military, unknown
- **Time Window:** Live, 1h, 6h, 24h, 7d
- **Route Analysis:** Historical vessel tracks, predicted routes
- **Maritime Boundaries:** Territorial waters/EEZ toggle
- **Port Activity:** Arrival/departure monitoring
- **Shipping Density:** Heatmap of vessel traffic

**Visual Emphasis:**
- Ocean blue color scheme
- Moderate label density
- Ship-shaped icons oriented by heading
- Color-coded vessels by type
- Semi-transparent boundary zones

**Viewport Defaults:**
- Pitch: 0° (top-down for maritime ops)
- Bearing: 0°
- Zoom: 8 (regional view)

---

### 3. Space Domain

**Purpose:** Satellite imagery analysis, orbital intelligence, ground station ops

**Default Basemap:** `dark`
- **Why:** Minimalist for orbital visualization, imagery analysis focus
- **Alternatives:** `satellite` (ground station context)

**Priority Layers:**
1. **Ground Stations** - Priority 1 - Essential
   - Satellite communications infrastructure
   - Downlink monitoring
   - Coverage cones

2. **Satellite Imagery** - Priority 1 - Data source (not map layer)
   - Optical (Sentinel-2, Landsat-8)
   - SAR (Sentinel-1)
   - Change detection overlays

**Analysis Controls (6):**
- **Satellite Selector:** Sentinel-2, Sentinel-1, Landsat-8, Commercial
- **Temporal Slider:** Date range selection for imagery
- **Change Detection:** Before/after comparison mode
- **Orbital Passes:** Satellite pass predictions over AOI
- **GS Coverage:** Ground station visibility cones
- **Spectral Bands:** True color, false color, NDVI, NDWI

**Visual Emphasis:**
- Dark theme with bright accents
- Minimal label density
- Full-screen imagery display
- Ground station dish icons
- Satellite orbital track lines

**Viewport Defaults:**
- Pitch: 0° (top-down for imagery)
- Bearing: 0°
- Zoom: 6 (regional coverage)

---

### 4. Surface Domain

**Purpose:** Terrain analysis, topography, trafficability assessment

**Default Basemap:** `outdoors`
- **Why:** Purpose-built for terrain visualization (contours, hillshade)
- **Alternatives:** `satellite` (ground truth), `light` (clean view)

**Priority Layers:**
1. **Land Use** - Priority 1 - Essential
   - Forest/vegetation
   - Urban/built-up
   - Agricultural areas

2. **Transportation** - Priority 2 - Essential
   - Road network for route analysis
   - Bridge crossing points

3. **Elevation Data** - Priority 1 - Basemap feature
   - DEM (Digital Elevation Model)
   - Contour lines
   - Hillshade

**Analysis Controls (6):**
- **3D Terrain Exaggeration:** 1x to 5x vertical exaggeration
- **Slope Analysis:** Color-coded slope angle classification
- **Viewshed Analysis:** Calculate visible area from observation point
- **Elevation Profile:** Graph elevation along drawn line
- **Contour Interval:** 5m, 10m, 20m, 50m options
- **Land Cover Toggle:** Vegetation and land use classification

**Visual Emphasis:**
- Topographic color scheme (green→yellow→brown→white)
- Moderate label density
- 3D terrain mesh with hillshading
- Transparent slope overlay

**Viewport Defaults:**
- Pitch: 60° (angled for terrain features)
- Bearing: -30°
- Zoom: 12 (local terrain detail)

---

### 5. Air Domain

**Purpose:** Aviation operations, airspace monitoring, flight tracking

**Default Basemap:** `light`
- **Why:** Clean, minimal (aviation chart aesthetic)
- **Alternatives:** `outdoors` (low-altitude ops), `dark` (operations center)

**Priority Layers:**
1. **Airports/Airfields (POI)** - Priority 1 - Essential
   - International/regional airports
   - Military airbases
   - Runway layouts

2. **Airspace Structure** - Priority 1 - Essential (control, not layer)
   - Controlled airspace classes
   - Restricted areas
   - Flight Information Regions

3. **Transportation** - Priority 2 - Optional
   - Ground infrastructure context

**Analysis Controls (5):**
- **Aircraft Filter:** Commercial, cargo, private, military, helicopter
- **Altitude Filter:** Ground, low (<10k ft), medium (10-30k), high (>30k)
- **Airspace Toggle:** Controlled airspace boundaries
- **Flight Tracks:** Historical flight path display
- **Airport Activity:** Departure/arrival monitoring

**Visual Emphasis:**
- Aviation chart colors (magenta, blue, purple)
- Moderate label density
- Airplane-shaped icons oriented by heading
- Color-coded by type and altitude
- Semi-transparent airspace polygons

**Viewport Defaults:**
- Pitch: 0° (top-down for air traffic)
- Bearing: 0°
- Zoom: 9 (airport region)

---

### 6. Subsurface Domain

**Purpose:** Underground facilities, tunnel detection, geological intelligence

**Default Basemap:** `satellite`
- **Why:** Surface indicators best seen in real imagery
- **Alternatives:** `outdoors` (terrain context), `light` (clean view)

**Priority Layers:**
1. **Land Use** - Priority 2 - Important
   - Surface conditions affecting subsurface

2. **Geological Layers** - Priority 1 - Essential (control, not default layer)
   - Rock formations
   - Fault lines
   - Karst features

**Analysis Controls (5):**
- **Geological Layers:** Rock formations and structures toggle
- **Facility Database:** Tunnels, mines, caves, bunkers, utilities
- **Surface Indicators:** Spoil piles, vents, access roads detection
- **Geophysical Anomalies:** Magnetic, gravity, seismic anomaly overlay
- **Cross-Section Tool:** Vertical geological slice visualization

**Visual Emphasis:**
- Geological color palette (rock type based)
- Minimal label density
- Heatmap anomaly visualization
- 3D subsurface rendering (if data available)

**Viewport Defaults:**
- Pitch: 30° (slight tilt for terrain context)
- Bearing: 0°
- Zoom: 13 (site-level detail)

---

## Domain INT Type Priorities

Each domain optimized for specific intelligence disciplines:

| Domain | Primary INT | Secondary INT | Tertiary INT |
|--------|-------------|---------------|--------------|
| Ground | GEOINT | SIGINT, OSINT | TEMPORAL, IMINT |
| Maritime | GEOINT | MASINT, OSINT | SIGINT, TEMPORAL |
| Space | GEOINT | IMINT | SIGINT, TEMPORAL |
| Surface | GEOINT | IMINT | MASINT, TEMPORAL |
| Air | GEOINT | SIGINT | MASINT, TEMPORAL |
| Subsurface | GEOINT | MASINT | SIGINT, IMINT |

**INT Type Definitions:**
- **GEOINT:** Geographic Intelligence (terrain, infrastructure, location)
- **SIGINT:** Signals Intelligence (communications, emissions)
- **OSINT:** Open Source Intelligence (publicly available data)
- **IMINT:** Imagery Intelligence (satellite/aerial imagery analysis)
- **MASINT:** Measurement and Signature Intelligence (sensors, signatures)
- **HUMINT:** Human Intelligence (human sources)
- **TEMPORAL:** Pattern-of-life, temporal analysis

---

## API Reference

### DomainLayerService

**Purpose:** Manages automatic layer switching when domains change

```typescript
import { getDomainLayerService } from '@/lib/services/domainLayerService'

const domainLayerService = getDomainLayerService()

// Switch to new domain (updates layers, basemap, viewport)
const result = domainLayerService.switchDomain('ground', mapInstance, {
  animateViewport: true,
  preserveUserLayers: false
})

// Get current domain
const currentDomain = domainLayerService.getCurrentDomain()

// Get enabled layers
const enabledLayers = domainLayerService.getEnabledLayers()
```

**Methods:**
- `switchDomain(domainId, map, options)` - Switch to new operational domain
- `getCurrentDomain()` - Get active domain ID
- `getEnabledLayers()` - Get array of enabled layer IDs
- `enableLayer(layerId)` - Enable specific layer
- `disableLayer(layerId)` - Disable specific layer

---

### Domain Visualization Config

**Purpose:** Get domain-specific configurations

```typescript
import {
  getDomainVisualization,
  getDomainDefaultLayers,
  getDomainAnalysisControls,
  getDomainBasemap,
  basemapToMapboxStyle
} from '@/lib/config/icDomainVisualization'

// Get full config for domain
const config = getDomainVisualization('ground')

// Get default layers (priority-sorted)
const layers = getDomainDefaultLayers('ground')

// Get analysis controls for domain
const controls = getDomainAnalysisControls('ground')

// Get basemap style
const basemap = getDomainBasemap('ground')  // Returns: 'satellite-streets'

// Convert to Mapbox style URL
const styleUrl = basemapToMapboxStyle(basemap)
// Returns: 'mapbox://styles/mapbox/satellite-streets-v12'
```

---

### DomainAnalysisToolbar Component

**Purpose:** Render domain-specific analysis controls

```typescript
import DomainAnalysisToolbar from '@/components/opintel/DomainAnalysisToolbar'

<DomainAnalysisToolbar
  domainId={currentDomain?.id || null}
  onControlChange={(controlId, value) => {
    console.log(`Control ${controlId} changed to:`, value)
    // Handle control value changes
  }}
  compact={false}  // Optional: Use compact layout
/>
```

**Props:**
- `domainId: ICDomainId | null` - Current active domain
- `onControlChange?: (controlId: string, value: any) => void` - Control value change handler
- `compact?: boolean` - Use compact layout (default: false)

**Control Types:**
- **toggle:** On/off switches (e.g., 3D buildings, maritime boundaries)
- **select:** Single selection dropdown (e.g., satellite selector, time window)
- **multi-select:** Multiple selection checkboxes (e.g., POI categories, vessel types)
- **slider:** Range input (e.g., terrain exaggeration 1x-5x)
- **radius:** Preset distance selector (e.g., 100m, 500m, 1km)
- **time-range:** Date/time pickers (e.g., imagery date range)
- **custom:** Custom interaction buttons (e.g., viewshed tool, cross-section)

---

## Integration Guide

### Step 1: Wire Domain Switching to Layer Service

Update `CopilotSidebarWrapper.tsx`:

```typescript
import { getDomainLayerService } from '@/lib/services/domainLayerService'

const handleDomainChange = (domain: ICDomain, layers: ICLayerId[]) => {
  setCurrentDomain(domain)
  setCurrentLayers(layers)

  // Trigger layer switching
  const domainLayerService = getDomainLayerService()
  domainLayerService.switchDomain(domain.id, mapStore.map, {
    animateViewport: false,  // Don't auto-zoom
    preserveUserLayers: false  // Apply domain defaults
  })

  console.log(`🎯 Domain changed to: ${domain.name}`)
}
```

### Step 2: Add DomainAnalysisToolbar to Operations Page

Update `app/operations/page.tsx`:

```typescript
import DomainAnalysisToolbar from '@/components/opintel/DomainAnalysisToolbar'

// Add state for current domain (passed from CopilotSidebar)
const [currentDomain, setCurrentDomain] = useState<ICDomainId | null>(null)

// In right panel render:
{rightPanelMode === 'analysis-controls' && (
  <DomainAnalysisToolbar
    domainId={currentDomain}
    onControlChange={(controlId, value) => {
      console.log(`Analysis control changed: ${controlId} =`, value)
      // Apply control changes to map/layers
    }}
  />
)}
```

### Step 3: Handle Analysis Control Changes

```typescript
const handleAnalysisControlChange = (controlId: string, value: any) => {
  switch (controlId) {
    case '3d-buildings':
      // Toggle 3D building layer
      const layerStore = useLayerStore.getState()
      if (value) {
        layerStore.toggleLayer('overture-buildings')
      }
      break

    case 'movement-heatmap':
      // Enable/disable heatmap visualization
      setShowHeatmap(value)
      break

    case 'radius-analysis':
      // Draw radius buffer around point
      drawRadiusBuffer(Number(value))
      break

    // ... handle other controls
  }
}
```

---

## Data Layer Mapping

### Available Layers (from LayerStore)

| Layer ID | Type | PMTiles Source | Priority Domains |
|----------|------|----------------|------------------|
| `overture-buildings` | overture | buildings-global.pmtiles | Ground, Space |
| `overture-places` | overture | places-global.pmtiles | Ground, Maritime, Air |
| `overture-transportation` | overture | transportation-global.pmtiles | Ground, Surface, Air |
| `overture-addresses` | overture | addresses-global.pmtiles | Ground |
| `landuse` | overture | landuse-global.pmtiles | Surface, Subsurface |
| `cell-towers` | custom | cell-towers.pmtiles | Ground |
| `maritime-routes` | maritime | - | Maritime |
| `ground-stations` | ground-station | - | Space |
| `hex-coverage` | hex-grid | - | All (analytics) |

### Future Layers (Roadmap)

**Phase 2:**
- `maritime-boundaries` - Territorial waters, EEZ
- `shipping-lanes` - Major shipping corridors
- `bathymetry` - Ocean depth contours
- `elevation-terrain` - DEM for Surface domain
- `airports` - Aviation facilities

**Phase 3:**
- `real-time-ais` - Live vessel positions
- `real-time-adsb` - Live aircraft positions
- `satellite-orbits` - TLE orbital tracks
- `satellite-imagery-tiles` - Sentinel/Landsat tiles
- `weather-layers` - Wind, precipitation, temperature

---

## Best Practices

### 1. Domain Selection Strategy

**For Urban Operations:** Use Ground domain
- 3D buildings for line-of-sight
- Cell towers for SIGINT planning
- Addresses for precision targeting

**For Coastal/Ocean Ops:** Use Maritime domain
- Vessel tracking with route history
- Port activity monitoring
- Territorial boundary awareness

**For Imagery Analysis:** Use Space domain
- Change detection over time
- Satellite coverage planning
- Ground station coordination

**For Terrain Analysis:** Use Surface domain
- Slope/trafficability assessment
- Viewshed calculations
- Elevation profiles

### 2. Layer Performance

**Optimization Tips:**
- Disable unused layers (especially 3D buildings at wide zoom)
- Use layer opacity < 1.0 to see underlying features
- Enable layers progressively as you zoom in
- Cache tile data for frequently accessed areas

### 3. Analysis Workflow

**Recommended Sequence:**
1. Select appropriate domain for mission type
2. Review default layers (add/remove as needed)
3. Use analysis controls to filter/refine view
4. Perform analysis (viewshed, route, etc.)
5. Export results or generate intelligence report

---

## Troubleshooting

### Layers Not Switching When Domain Changes

**Issue:** Layers remain the same when switching domains

**Solution:**
1. Check if `domainLayerService.switchDomain()` is called in domain change handler
2. Verify `mapStore.map` is not null
3. Ensure LayerStore has layers with matching IDs
4. Check browser console for errors

### Analysis Controls Not Appearing

**Issue:** DomainAnalysisToolbar shows "No controls available"

**Solution:**
1. Verify `domainId` prop is not null
2. Check `icDomainVisualization.ts` has controls defined for domain
3. Ensure component is re-rendering when domain changes

### Basemap Not Changing

**Issue:** Map style stays the same across domains

**Solution:**
1. Verify map is loaded (`map.isStyleLoaded()`)
2. Check Mapbox access token is valid
3. Ensure basemap style URLs are correct in `basemapToMapboxStyle()`

---

## Performance Metrics

**Layer Switching Speed:**
- Domain change: ~100-200ms
- Basemap change: ~500-1000ms (full style reload)
- Layer visibility toggle: <50ms

**Memory Usage:**
- Base system: ~50MB
- +3D buildings: +30-50MB (zoom dependent)
- +Full maritime routes: +10-20MB
- +Satellite imagery: +50-100MB per tile set

---

## Future Enhancements

### Planned Features

1. **Custom Domain Presets**
   - Save user-defined domain configurations
   - Share presets across team
   - Import/export domain settings

2. **Layer Groups**
   - Organize layers by theme (infrastructure, natural features, etc.)
   - Bulk enable/disable layer groups
   - Group-level opacity control

3. **Analysis Templates**
   - Pre-configured analysis workflows
   - Step-by-step guided analysis
   - Automated report generation

4. **Real-Time Data Integration**
   - Live AIS vessel positions
   - Live ADS-B aircraft tracking
   - Real-time weather overlays
   - Satellite pass notifications

5. **Advanced Visualization**
   - 4D temporal playback
   - Heat-mapping for all domains
   - 3D terrain in Surface domain
   - Globe view for Space/Maritime

---

## References

### IC Intelligence Disciplines
- JP 2-0: Joint Intelligence (Department of Defense)
- ICD 203: Analytic Standards (ODNI)
- Geospatial Intelligence in Support of Operations

### Geospatial Standards
- Overture Maps Schema
- PMTiles Specification
- Mapbox GL JS API
- GeoJSON/Vector Tiles

### Internal Documentation
- `/docs/CITIZENS360-DATA-MODEL-ANALYSIS.md`
- `/lib/config/icDomains.ts`
- `/lib/config/icLayers.ts`

---

## Version History

**v1.0.0 (2025-11-07)**
- Initial implementation of IC Domain Visualization System
- 6 operational domains with custom configurations
- DomainLayerService for automatic layer management
- DomainAnalysisToolbar component with 7 control types
- Integration with existing layerStore and mapStore

---

## Contributors

- System Architecture: Based on IC intelligence analyst workflows
- Domain Research: IC domain operational requirements analysis
- Implementation: Layer management service + UI components
- Documentation: This comprehensive specification

---

**Last Updated:** 2025-11-07
**Maintained By:** Intelligence Platform Team
**Review Cycle:** Quarterly (aligned with IC taxonomy updates)
