# Phase 2: Orbital Mechanics & Satellite Tracking

## Overview

Add real-time satellite orbit visualization, tracking, and pass prediction capabilities to the Space domain.

## Technology Decisions

### JavaScript SGP4 Library: satellite.js
**Selected:** satellite.js v5.0.0
**Why:** Most mature JavaScript implementation of SGP4/SDP4 algorithms
- MIT licensed, actively maintained (updated June 2024)
- Pure JavaScript (works in browser and Node.js)
- Handles both near-Earth (SGP4) and deep-space (SDP4) automatically
- Returns ECI (Earth-Centered Inertial) coordinates
- Well-documented with extensive community support

**Alternative Considered:** brahe (Rust library)
- Excellent performance but only has Python bindings
- Would require WASM compilation for JavaScript
- Adds complexity for marginal performance gain in web context
- **Decision:** Use satellite.js for simplicity; revisit if performance becomes critical

### TLE Data Source: CelesTrak
**Selected:** CelesTrak.org free API
**Why:** Industry-standard, reliable, and completely free
- 501(c)(3) non-profit organization
- No API key required
- Multiple data formats (JSON, XML, KVN, TLE)
- Query by: Catalog Number (CATNR), International Designator (INTDES), Group, Name
- Covers all tracked objects in Earth orbit

**API Examples:**
```
# Single satellite (ISS)
https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=JSON

# Group (e.g., active satellites)
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=JSON

# By name
https://celestrak.org/NORAD/elements/gp.php?NAME=SENTINEL-2A&FORMAT=JSON
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  TLE Data Service                                   │
│  • Fetch from CelesTrak API                         │
│  • Parse JSON/TLE formats                           │
│  • Cache TLE data (24hr TTL)                       │
│  • Auto-refresh stale data                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Orbital Mechanics Service (satellite.js)           │
│  • SGP4/SDP4 orbit propagation                      │
│  • ECI → ECEF → LLA coordinate transforms           │
│  • Real-time position calculation                   │
│  • Ground track generation                          │
│  • Velocity vector calculation                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Satellite Tracking Store (Zustand)                 │
│  • Active satellites list                           │
│  • Current positions                                │
│  • Orbit paths (past/future)                        │
│  • Pass predictions                                 │
│  • Update interval (configurable)                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Visualization Layer (Mapbox)                       │
│  • Satellite icons (real-time position)             │
│  • Orbit paths (ground tracks)                      │
│  • Footprints (visibility circles)                  │
│  • Velocity vectors (optional)                      │
│  • Animation (satellite movement)                   │
└─────────────────────────────────────────────────────┘
```

## Implementation Plan

### 1. TLE Data Service (2 days)
**File:** `lib/services/tleDataService.ts`

Features:
- Fetch TLE data from CelesTrak API
- Support query by: CATNR, GROUP, NAME
- Parse JSON and TLE formats
- Cache with 24-hour TTL
- Auto-refresh mechanism
- Error handling and fallbacks

Key satellites/groups to support:
- **Sentinel-2A/B** (Earth observation - ties to Phase 1)
- **ISS** (International Space Station - high visibility)
- **Starlink** (large constellation - stress test)
- **GPS** (navigation constellation)
- **NOAA Weather** (weather satellites)
- **Active Satellites** (all active objects)

### 2. Orbital Mechanics Service (3 days)
**File:** `lib/services/orbitalMechanicsService.ts`

Dependencies: `npm install satellite.js`

Features:
- Initialize satellite from TLE
- Propagate position at any time
- ECI → Geodetic (lat/lon/alt) conversion
- Ground track generation (past/future orbits)
- Velocity calculations
- Orbit period calculation
- Satellite visibility from ground point

Key functions:
```typescript
getSatellitePosition(tle: TLE, date: Date): Position
getGroundTrack(tle: TLE, startDate: Date, duration: number): GroundTrack[]
isVisible(tle: TLE, observerLat: number, observerLon: number, minElevation: number): boolean
getNextPass(tle: TLE, observerLat: number, observerLon: number): PassPrediction
```

### 3. Satellite Tracking Store (2 days)
**File:** `lib/stores/satelliteTrackingStore.ts`

State:
```typescript
{
  satellites: TrackedSatellite[]
  selectedSatellite: TrackedSatellite | null
  updateInterval: number  // ms (default: 5000)
  isTracking: boolean
  passPredictions: PassPrediction[]
  groundTracks: Map<string, GroundTrack[]>
}
```

Actions:
- `addSatellite(catalogNumber: string)`
- `removeSatellite(catalogNumber: string)`
- `selectSatellite(catalogNumber: string)`
- `updatePositions()` - Updates all satellite positions
- `predictPasses(observerLocation: [number, number])`
- `startTracking()` / `stopTracking()`

### 4. Orbit Visualization Layer (3 days)
**File:** `lib/layers/satelliteOrbitLayer.ts`

Features:
- Satellite markers (icons with direction indicators)
- Orbit paths (LineString geometries)
- Footprints (circle polygons for visibility)
- Real-time animation
- Click handlers for satellite selection

Visualization approach:
- Use Mapbox GeoJSON sources
- Update positions every 5 seconds
- Animate transitions with easing
- Color-code by satellite type
- Show orbit direction with arrows

### 5. Satellite Tracking Panel (3 days)
**File:** `components/space/SatelliteTrackingPanel.tsx`

UI Components:
- Satellite selector (search/browse)
- Live position display (lat/lon/alt/velocity)
- Orbit info (period, apogee, perigee, inclination)
- Pass predictions table (next N passes over location)
- Tracking controls (start/stop, update rate)
- Ground track options (show past/future orbits)

Layout:
- Top-right floating panel (collapsible)
- Compact mode: Just satellite count + tracking status
- Expanded mode: Full details and controls

### 6. Integration & Testing (2 days)
- Add to Space domain test page
- Performance testing (100+ satellites)
- Accuracy verification (compare to known positions)
- Memory leak testing (long-running tracking)
- Error handling (offline, bad TLE data)

## Data Models

### TLE (Two-Line Element Set)
```typescript
interface TLE {
  name: string
  line1: string  // First line of TLE
  line2: string  // Second line of TLE
  catalogNumber: string  // NORAD catalog number
  epoch: Date    // TLE epoch (reference time)
}
```

### Tracked Satellite
```typescript
interface TrackedSatellite {
  catalogNumber: string
  name: string
  tle: TLE
  position: {
    latitude: number
    longitude: number
    altitude: number  // km above sea level
    velocity: number  // km/s
  }
  lastUpdate: Date
  orbit: {
    period: number  // minutes
    apogee: number  // km
    perigee: number // km
    inclination: number  // degrees
    eccentricity: number
  }
}
```

### Pass Prediction
```typescript
interface PassPrediction {
  satelliteName: string
  riseTime: Date
  riseAzimuth: number  // degrees
  maxTime: Date
  maxElevation: number  // degrees
  maxAzimuth: number
  setTime: Date
  setAzimuth: number
  duration: number  // minutes
  visible: boolean  // Is it illuminated?
}
```

### Ground Track Point
```typescript
interface GroundTrackPoint {
  latitude: number
  longitude: number
  altitude: number
  time: Date
}
```

## Performance Considerations

### Update Strategy
- Default: 5-second updates for active tracking
- Adaptive: Slow down for LEO satellites when out of view
- Batch processing: Update all satellites in single frame
- Web Worker: Offload calculations to worker thread (Phase 3 optimization)

### Caching Strategy
- TLE data: 24-hour cache (satellites don't change orbit that fast)
- Ground tracks: Pre-calculate 1 orbit period ahead
- Pass predictions: Calculate when tracking starts, cache results

### Rendering Optimization
- Only render orbits for selected satellites
- Cull satellites below horizon
- Use Mapbox clustering for dense constellations
- LOD (Level of Detail) for orbit paths based on zoom

## Success Metrics

✅ **Functional Requirements:**
- Load and track 10+ satellites simultaneously
- Update positions every 5 seconds
- Display accurate ground tracks
- Predict passes within 1-minute accuracy
- Handle TLE data updates seamlessly

✅ **Performance Requirements:**
- < 50ms update time for 10 satellites
- < 500ms to load new satellite
- Smooth 60fps animation
- < 100MB memory for 100 satellites

✅ **UX Requirements:**
- Intuitive satellite selection
- Clear visual distinction between satellites
- Responsive controls (<100ms feedback)
- Graceful error handling

## Future Enhancements (Phase 3+)

- **3D Globe View** - Use Deck.gl GlobeView for better orbit visualization
- **Collision Detection** - Warn of potential conjunctions
- **Sensor Coverage** - Show sensor FOV for Earth observation satellites
- **Ground Station Network** - Visualize ground station passes
- **Historical Tracking** - Replay past orbits
- **Orbit Maneuvering** - Detect orbital changes from TLE updates

## References

- satellite.js docs: https://github.com/shashwatak/satellite-js
- CelesTrak API: https://celestrak.org/NORAD/documentation/gp-data-formats.php
- SGP4 theory: https://celestrak.org/NORAD/documentation/spacetrk.pdf
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/
