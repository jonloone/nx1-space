# Space Domain Enhancement - Implementation Plan

**Version**: 1.0
**Date**: 2025-11-10
**Status**: Design Phase

## Executive Summary

This document outlines a comprehensive plan to elevate the Space domain from **partial** to **full operational capability**, transforming it into a production-ready intelligence platform for satellite imagery analysis and orbital operations.

**Primary Goals**:
1. ✅ **Satellite Imagery Intelligence** - Multi-source imagery with change detection
2. ✅ **Orbital Mechanics** - Real-time satellite tracking with `brahe` library
3. ✅ **Ground Station Integration** - Link satellites to ground stations with visibility analysis
4. ✅ **Temporal Analysis** - Time-series imagery with activity monitoring
5. ✅ **Intelligence Workflows** - IMINT workflows matching real analyst needs

---

## 1. Current State Analysis

### 1.1 Existing Infrastructure ✅

**Strengths**:
- ✅ `SatelliteImageryService` with multi-source support (Sentinel-2, Mapbox, GEE)
- ✅ `ImageryAnalysisService` with change detection and activity analysis
- ✅ GEO satellite utilities (position calculation, coverage footprints)
- ✅ Time-series imagery support
- ✅ Mock data generation for demonstration

**Current Capabilities**:
```typescript
// lib/services/satelliteImageryService.ts
- getImagery() - Multi-source satellite imagery
- getTimeSeries() - Time-series collection
- getTileLayer() - Tile layer info for visualization

// lib/services/imageryAnalysisService.ts
- detectChanges() - Temporal change detection
- analyzeActivity() - Activity monitoring
- detectObjects() - Object detection (mock)
```

### 1.2 Gaps & Limitations ⚠️

**Critical Gaps**:
1. **No Real Orbital Mechanics** - Only static GEO satellite positions
2. **No LEO Satellite Tracking** - Missing SGP4/SDP4 orbit propagation
3. **Mock Imagery** - Not connected to real Sentinel-2 STAC API
4. **No Visualization UI** - Services exist but no UI components
5. **No Ground Station Links** - Satellites and ground stations disconnected
6. **Limited Temporal UI** - No timeline scrubber or multi-temporal viewer

**Status**: Space domain currently at **35% capability**

---

## 2. Critical Review: Imagery Display Architecture

### 2.1 Display Options Analysis

#### Option A: Map Layer (Raster Overlay) 🟡

**Implementation**:
```typescript
// Add imagery as Mapbox raster layer
map.addSource('satellite-imagery-temporal', {
  type: 'raster',
  tiles: [tileUrl],
  tileSize: 256,
  minzoom: 0,
  maxzoom: 18
})

map.addLayer({
  id: 'satellite-imagery',
  type: 'raster',
  source: 'satellite-imagery-temporal',
  paint: {
    'raster-opacity': 0.8,
    'raster-fade-duration': 300
  }
})
```

**Pros**:
- ✅ Seamless map integration
- ✅ Can overlay on vector data
- ✅ Familiar UX pattern
- ✅ Good for spatial correlation

**Cons**:
- ❌ Limited to map projection
- ❌ Hard to show multiple dates simultaneously
- ❌ Resolution constraints from tiling
- ❌ Difficult to toggle between images

**Score**: 6/10 - Good for general viewing, poor for analysis

---

#### Option B: Side Panel Image Viewer 🟡

**Implementation**:
```typescript
// Full-resolution image viewer in right panel
<ImageryPanel>
  <ImageViewer
    image={selectedImage}
    zoom={independentZoom}
    pan={independentPan}
  />
  <ImageMetadata />
  <SpectralBandSelector />
</ImageryPanel>
```

**Pros**:
- ✅ Full resolution display
- ✅ Independent zoom/pan
- ✅ Better for detailed analysis
- ✅ Can show spectral bands

**Cons**:
- ❌ Disconnected from map context
- ❌ Takes screen real estate
- ❌ Harder to correlate with ground features
- ❌ Cognitive load (two separate views)

**Score**: 5/10 - Good for analysis, poor for context

---

#### Option C: **Hybrid Approach (RECOMMENDED)** ✅ 🎯

**Architecture**:
```
┌─────────────────────────────────────────────────────┐
│  Main Map (Primary Context)                        │
│  ┌─────────────────────────────────────────┐       │
│  │  • Vector layers (buildings, roads)     │       │
│  │  • Satellite imagery overlay (opacity)  │       │
│  │  • Orbit tracks (deck.gl ArcLayer)      │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Bottom: Timeline Panel                             │
│  ┌─────────────────────────────────────────┐       │
│  │  [img] [img] [img] [img] [img] [img]    │       │
│  │  |──────────●──────────────────────|     │       │
│  │  2024-08   2024-09   2024-10            │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Right: Imagery Detail Panel (on-demand)            │
│  ┌─────────────────────────────────────────┐       │
│  │  Full-Resolution Viewer                  │       │
│  │  • Click image thumbnail to open         │       │
│  │  • Before/After comparison               │       │
│  │  • Spectral band controls                │       │
│  │  • Change detection overlay              │       │
│  │  • Export/Download                       │       │
│  └─────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

**Implementation Strategy**:
1. **Primary**: Map with raster overlay + opacity slider
2. **Timeline**: Bottom panel with thumbnail scrubber
3. **Detail**: Right panel opens on-demand for full analysis
4. **Sync**: Map view synced to timeline selection

**Pros**:
- ✅ Best of both worlds
- ✅ Contextual and detailed
- ✅ Progressive disclosure
- ✅ Maintains spatial awareness
- ✅ Supports multi-temporal workflow

**Cons**:
- ⚠️ More complex to implement
- ⚠️ Requires state synchronization

**Score**: 9/10 - **RECOMMENDED APPROACH**

**Why Hybrid Wins**:
- Matches real IMINT analyst workflows
- Supports both reconnaissance and detailed analysis
- Allows spatial correlation with ground features
- Enables temporal scrubbing with visual feedback
- Familiar pattern from Google Earth Engine, Sentinel Hub

---

## 3. Orbital Mechanics Integration

### 3.1 brahe Library Analysis

**Repository**: https://github.com/duncaneddy/brahe
**Language**: Rust with Python bindings
**Capabilities**:
- SGP4/SDP4 orbit propagation
- TLE (Two-Line Element) parsing
- Ground track calculation
- Visibility windows
- Access time computation
- Coordinate transformations

### 3.2 Integration Architecture

**Option A: Python Service (RECOMMENDED)** ✅

```python
# python-services/orbital-mechanics/main.py
from brahe import SGP4, TLE
from datetime import datetime, timedelta

class OrbitalMechanicsService:
    def propagate_orbit(self, tle: dict, start: datetime, end: datetime, step: int = 60):
        """Propagate orbit from TLE"""
        satellite = SGP4.from_tle(tle['line1'], tle['line2'])

        positions = []
        current = start
        while current <= end:
            r, v = satellite.propagate(current)  # ECI coordinates
            lat, lon, alt = eci_to_geodetic(r, current)

            positions.append({
                'timestamp': current.isoformat(),
                'lat': lat,
                'lon': lon,
                'alt': alt
            })

            current += timedelta(seconds=step)

        return positions

    def calculate_ground_track(self, tle: dict, num_orbits: int = 2):
        """Calculate ground track for visualization"""
        satellite = SGP4.from_tle(tle['line1'], tle['line2'])
        period = satellite.period  # Orbital period in seconds

        return self.propagate_orbit(tle, datetime.utcnow(),
                                    datetime.utcnow() + timedelta(seconds=period * num_orbits))

    def find_passes(self, tle: dict, ground_station: dict, start: datetime, end: datetime):
        """Find satellite passes over ground station"""
        satellite = SGP4.from_tle(tle['line1'], tle['line2'])
        gs_lat, gs_lon, gs_alt = ground_station['lat'], ground_station['lon'], ground_station['alt']

        passes = []
        # Compute visibility windows
        # ... (brahe visibility computation)

        return passes
```

**API Endpoints**:
```
POST /api/orbital/propagate
POST /api/orbital/ground-track
POST /api/orbital/visibility
POST /api/orbital/access-times
```

**Option B: WebAssembly** 🔮

- Compile Rust to WASM for client-side computation
- Pro: No server latency
- Con: Complex build, limited debugging
- **Verdict**: Phase 2 optimization

### 3.3 TLE Data Sources

**Primary Sources**:
1. **CelesTrak** (https://celestrak.org/NORAD/elements/)
   - Active satellites catalog
   - Updated daily
   - Public TLEs

2. **Space-Track.org** (https://www.space-track.org/)
   - Official NORAD TLE database
   - Requires registration
   - Most comprehensive

3. **N2YO** (https://www.n2yo.com/)
   - Real-time tracking
   - API available

**TLE Update Strategy**:
```typescript
// Daily TLE refresh job
async function updateTLEs() {
  const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json')
  const satellites = await response.json()

  // Store in database with timestamp
  await db.satellites.bulkWrite(satellites.map(sat => ({
    updateOne: {
      filter: { noradId: sat.NORAD_CAT_ID },
      update: { $set: { tle: sat, updatedAt: new Date() } },
      upsert: true
    }
  })))
}
```

---

## 4. Detailed Implementation Plan

### Phase 1: Core Satellite Imagery Infrastructure (2-3 weeks)

**Goal**: Connect real satellite imagery and display on map

#### 1.1 Real Sentinel-2 Integration

**Task**: Replace mock data with STAC API

```typescript
// lib/services/sentinel2StacService.ts
export class Sentinel2StacService {
  private stacApiUrl = 'https://earth-search.aws.element84.com/v1'

  async search(bbox: [number, number, number, number], dateRange: [Date, Date]) {
    const response = await fetch(`${this.stacApiUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bbox,
        datetime: `${dateRange[0].toISOString()}/${dateRange[1].toISOString()}`,
        collections: ['sentinel-2-l2a'],
        limit: 100,
        query: {
          'eo:cloud_cover': { lt: 20 }
        }
      })
    })

    const data = await response.json()
    return this.transformStacToSatelliteImages(data.features)
  }
}
```

**Dependencies**:
- AWS Element84 STAC API (free, no key required)
- Sentinel Hub for tile serving (optional, requires account)

#### 1.2 Timeline Bottom Panel Component

**Component**: `TimelineBottomPanel.tsx`

```typescript
// components/space/TimelineBottomPanel.tsx
export function TimelineBottomPanel({
  images: SatelliteImage[],
  selectedImage: SatelliteImage | null,
  onSelectImage: (image: SatelliteImage) => void,
  onCompareMode: (before: SatelliteImage, after: SatelliteImage) => void
}) {
  return (
    <div className="h-32 bg-gray-900 border-t border-gray-800 p-4">
      {/* Timeline scrubber */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {images.map(image => (
          <ImageryThumbnail
            key={image.id}
            image={image}
            selected={selectedImage?.id === image.id}
            onClick={() => onSelectImage(image)}
          />
        ))}
      </div>

      {/* Date range selector */}
      <div className="mt-2 flex items-center gap-4">
        <DateRangePicker />
        <OpacitySlider />
        <CompareButton />
      </div>
    </div>
  )
}
```

**Thumbnail Generation**:
```typescript
// Use Sentinel Hub preview endpoint
const thumbnailUrl = `https://services.sentinel-hub.com/ogc/wms/${instanceId}
  ?REQUEST=GetMap
  &BBOX=${bbox.join(',')}
  &WIDTH=256&HEIGHT=256
  &LAYERS=TRUE_COLOR
  &TIME=${acquisitionDate}
`
```

#### 1.3 Map Raster Overlay

**Implementation**:
```typescript
// lib/layers/satelliteImageryLayer.ts
export function addSatelliteImageryLayer(
  map: mapboxgl.Map,
  image: SatelliteImage,
  options: { opacity: number } = { opacity: 0.8 }
) {
  // Remove existing imagery layer
  if (map.getLayer('satellite-imagery-temporal')) {
    map.removeLayer('satellite-imagery-temporal')
  }
  if (map.getSource('satellite-imagery-temporal')) {
    map.removeSource('satellite-imagery-temporal')
  }

  // Add new imagery
  const tileInfo = getSatelliteImageryService().getTileLayer(image)

  map.addSource('satellite-imagery-temporal', {
    type: 'raster',
    tiles: [tileInfo.url],
    tileSize: tileInfo.tileSize,
    minzoom: tileInfo.minZoom,
    maxzoom: tileInfo.maxZoom,
    attribution: tileInfo.attribution
  })

  map.addLayer({
    id: 'satellite-imagery-temporal',
    type: 'raster',
    source: 'satellite-imagery-temporal',
    paint: {
      'raster-opacity': options.opacity,
      'raster-fade-duration': 300
    }
  }, 'waterway') // Insert below labels
}
```

#### 1.4 Deliverables
- [ ] Real Sentinel-2 STAC integration
- [ ] Timeline bottom panel with thumbnails
- [ ] Map raster overlay with opacity control
- [ ] Image selection synchronization
- [ ] Cloud cover filtering

---

### Phase 2: Orbital Mechanics & Tracking (3-4 weeks)

**Goal**: Real-time satellite tracking with orbital propagation

#### 2.1 Python Orbital Mechanics Service

**Setup**:
```bash
# python-services/orbital-mechanics/
cd python-services
mkdir orbital-mechanics && cd orbital-mechanics
python -m venv venv
source venv/bin/activate
pip install brahe fastapi uvicorn python-dateutil
```

**Service Implementation** (see section 3.2)

#### 2.2 TLE Database & Updates

**Schema**:
```typescript
// Database: MongoDB or PostgreSQL
interface SatelliteTLE {
  noradId: string // NORAD catalog ID
  name: string
  tle: {
    line1: string
    line2: string
  }
  updatedAt: Date
  metadata: {
    launchDate?: Date
    operator?: string
    purpose?: string
  }
}
```

**Daily Update Cron**:
```typescript
// lib/jobs/updateTLEs.ts
import cron from 'node-cron'

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🛰️ Updating satellite TLEs from CelesTrak')
  await updateTLEsFromCelesTrak()
})
```

#### 2.3 Orbit Visualization (deck.gl)

**Arc Layer for Orbit Tracks**:
```typescript
// lib/layers/orbitTrackLayer.ts
import { ArcLayer } from '@deck.gl/layers'

export function createOrbitTrackLayer(positions: { lat: number; lon: number }[]) {
  // Convert positions to arcs for smooth visualization
  const arcs = positions.slice(0, -1).map((pos, i) => ({
    source: [pos.lon, pos.lat],
    target: [positions[i + 1].lon, positions[i + 1].lat]
  }))

  return new ArcLayer({
    id: 'satellite-orbit-track',
    data: arcs,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: [0, 150, 255, 180],
    getTargetColor: [0, 150, 255, 180],
    getWidth: 2,
    greatCircle: true
  })
}
```

**Animated Satellite Icon**:
```typescript
// Use IconLayer with real-time position updates
import { IconLayer } from '@deck.gl/layers'

export function createSatelliteIconLayer(position: { lat: number; lon: number }) {
  return new IconLayer({
    id: 'satellite-position',
    data: [{ position: [position.lon, position.lat] }],
    getIcon: () => ({
      url: '/icons/satellite.svg',
      width: 32,
      height: 32
    }),
    getPosition: d => d.position,
    getSize: 32,
    sizeScale: 1
  })
}
```

#### 2.4 Ground Station Visibility

**Visibility Calculation**:
```python
# In orbital-mechanics service
def calculate_visibility(satellite_tle, ground_station, elevation_mask=5.0):
    """
    Calculate when satellite is visible from ground station
    elevation_mask: Minimum elevation angle in degrees
    """
    satellite = SGP4.from_tle(tle['line1'], tle['line2'])
    gs_lat, gs_lon, gs_alt = ground_station['lat'], ground_station['lon'], ground_station['alt']

    # Convert ground station to ECEF
    gs_ecef = geodetic_to_ecef(gs_lat, gs_lon, gs_alt)

    # Compute passes over next 7 days
    start = datetime.utcnow()
    end = start + timedelta(days=7)

    passes = []
    for dt in daterange(start, end, step=timedelta(seconds=10)):
        sat_eci = satellite.propagate(dt)
        sat_ecef = eci_to_ecef(sat_eci, dt)

        # Compute look angles (azimuth, elevation, range)
        az, el, rng = compute_look_angles(gs_ecef, sat_ecef)

        if el > elevation_mask:
            # Satellite is visible
            passes.append({
                'time': dt,
                'azimuth': az,
                'elevation': el,
                'range': rng
            })

    # Group into pass events
    return group_passes(passes)
```

**Visualization**:
```typescript
// Show visibility cone from ground station
const visibilityFootprint = {
  center: groundStation.coordinates,
  radius: calculateVisibilityRadius(elevationMask),
  opacity: 0.3,
  color: [100, 200, 255]
}
```

#### 2.5 Deliverables
- [ ] Python orbital mechanics service with brahe
- [ ] TLE database with daily updates
- [ ] Orbit track visualization (deck.gl ArcLayer)
- [ ] Real-time satellite position updates
- [ ] Ground station visibility calculation
- [ ] Visibility cone visualization

---

### Phase 3: Imagery Detail Panel & Analysis (2-3 weeks)

**Goal**: Full-resolution analysis panel with change detection

#### 3.1 Imagery Detail Panel Component

**Component**: `ImageryDetailPanel.tsx`

```typescript
// components/space/ImageryDetailPanel.tsx
export function ImageryDetailPanel({
  image: SatelliteImage | null,
  onClose: () => void
}) {
  const [spectralMode, setSpectralMode] = useState<'rgb' | 'false-color' | 'ndvi'>('rgb')
  const [compareImage, setCompareImage] = useState<SatelliteImage | null>(null)

  return (
    <div className="w-[600px] h-full bg-gray-900 border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Satellite Imagery Analysis</h2>
        <div className="text-sm text-gray-400">
          {image?.source} | {image?.acquisitionDate.toLocaleDateString()}
        </div>
      </div>

      {/* Full-resolution viewer */}
      <div className="flex-1 relative">
        <ImageViewer image={image} spectralMode={spectralMode} />

        {/* Compare mode overlay */}
        {compareImage && (
          <ImageCompareSlider before={image} after={compareImage} />
        )}
      </div>

      {/* Spectral band selector */}
      <div className="p-4 border-t border-gray-800">
        <SpectralBandSelector
          bands={image?.bands || []}
          selected={spectralMode}
          onChange={setSpectralMode}
        />
      </div>

      {/* Analysis tools */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <ChangeDetectionButton onClick={() => runChangeDetection(image)} />
        <ObjectDetectionButton onClick={() => runObjectDetection(image)} />
        <ExportButton onClick={() => exportImage(image)} />
      </div>

      {/* Metadata */}
      <div className="p-4 border-t border-gray-800">
        <ImageMetadata image={image} />
      </div>
    </div>
  )
}
```

#### 3.2 Before/After Comparison

**Swipe Slider**:
```typescript
// components/space/ImageCompareSlider.tsx
export function ImageCompareSlider({
  before: SatelliteImage,
  after: SatelliteImage
}) {
  const [dividerPosition, setDividerPosition] = useState(50)

  return (
    <div className="relative w-full h-full">
      {/* Before image (left side) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - dividerPosition}% 0 0)` }}
      >
        <ImageViewer image={before} />
        <div className="absolute top-4 left-4 bg-black/70 px-2 py-1 rounded text-sm">
          {before.acquisitionDate.toLocaleDateString()}
        </div>
      </div>

      {/* After image (right side) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${dividerPosition}%)` }}
      >
        <ImageViewer image={after} />
        <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded text-sm">
          {after.acquisitionDate.toLocaleDateString()}
        </div>
      </div>

      {/* Draggable divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${dividerPosition}%` }}
        onMouseDown={handleDragStart}
      />
    </div>
  )
}
```

#### 3.3 Change Detection Visualization

**Overlay Layer**:
```typescript
// Show detected changes as colored polygons
const changeDetectionLayer = {
  id: 'change-detection-overlay',
  type: 'fill',
  source: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: changes.map(change => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [change.location.polygon]
        },
        properties: {
          type: change.type,
          confidence: change.confidence,
          magnitude: change.magnitude
        }
      }))
    }
  },
  paint: {
    'fill-color': [
      'match',
      ['get', 'type'],
      'construction', '#FF6B6B',
      'demolition', '#4ECDC4',
      'vegetation_loss', '#FFA500',
      'vegetation_gain', '#00D084',
      '#CCCCCC'
    ],
    'fill-opacity': ['*', ['get', 'confidence'], 0.01] // confidence * 0.01 for 0-1 range
  }
}
```

#### 3.4 Deliverables
- [ ] Full-resolution imagery detail panel
- [ ] Before/after swipe comparison
- [ ] Spectral band selector (RGB, false-color, NDVI)
- [ ] Change detection visualization overlay
- [ ] Export functionality (GeoTIFF, PNG)
- [ ] Image metadata display

---

### Phase 4: Advanced Analytics & Intelligence (3-4 weeks)

**Goal**: AI-powered analysis and intelligence reports

#### 4.1 Real ML Change Detection

**Options**:
1. **OpenAI Vision API** (Fast, expensive)
2. **Roboflow** (Custom models)
3. **HuggingFace** (Open-source models)

**Implementation with OpenAI**:
```typescript
// lib/services/mlChangeDetection.ts
export async function detectChangesML(
  beforeImageUrl: string,
  afterImageUrl: string
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze these two satellite images and identify all significant changes. Report construction, demolition, vegetation changes, and infrastructure modifications with approximate locations and confidence scores.'
        },
        { type: 'image_url', image_url: { url: beforeImageUrl } },
        { type: 'image_url', image_url: { url: afterImageUrl } }
      ]
    }],
    max_tokens: 2000
  })

  // Parse structured response
  return parseChangeDetectionResponse(response.choices[0].message.content)
}
```

#### 4.2 Orbital Pass Prediction UI

**Component**: `SatellitePassPredictor.tsx`

```typescript
// Show upcoming satellite passes over location
export function SatellitePassPredictor({
  groundStation: GroundStation,
  satellite: Satellite
}) {
  const passes = useSatellitePasses(groundStation, satellite)

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Upcoming Passes</h3>
      {passes.map(pass => (
        <div key={pass.id} className="p-3 bg-gray-800 rounded">
          <div className="flex justify-between">
            <span>{pass.aos.toLocaleString()}</span>
            <span className="text-blue-400">
              Max El: {pass.maxElevation.toFixed(1)}°
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Duration: {pass.duration}min | Pass: {pass.direction}
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### 4.3 Multi-Spectral Analysis

**NDVI Calculation**:
```typescript
// lib/analysis/spectralIndices.ts
export function calculateNDVI(nirBand: ImageData, redBand: ImageData): ImageData {
  // NDVI = (NIR - Red) / (NIR + Red)
  const ndvi = new ImageData(nirBand.width, nirBand.height)

  for (let i = 0; i < nirBand.data.length; i += 4) {
    const nir = nirBand.data[i]
    const red = redBand.data[i]

    const ndviValue = (nir - red) / (nir + red)

    // Map -1 to 1 range to color gradient
    const color = ndviValueToColor(ndviValue)
    ndvi.data[i] = color.r
    ndvi.data[i + 1] = color.g
    ndvi.data[i + 2] = color.b
    ndvi.data[i + 3] = 255
  }

  return ndvi
}
```

#### 4.4 Deliverables
- [ ] ML-powered change detection (OpenAI Vision)
- [ ] Satellite pass prediction UI
- [ ] Multi-spectral analysis (NDVI, NDWI, EVI)
- [ ] Intelligence report generation
- [ ] Activity scoring algorithm
- [ ] Export reports (PDF, JSON)

---

## 5. Technical Architecture

### 5.1 Service Layer

```
Frontend (Next.js + React)
    ↓
API Routes (/api/satellite/*, /api/orbital/*)
    ↓
Service Layer
    ├─ SatelliteImageryService (imagery access)
    ├─ Sentinel2StacService (STAC API)
    ├─ ImageryAnalysisService (change detection, activity)
    ├─ OrbitalMechanicsService (propagation, visibility)
    └─ GroundStationService (GS operations)
    ↓
Python Microservices (optional)
    ├─ orbital-mechanics (brahe)
    └─ ml-analysis (change detection)
    ↓
Data Sources
    ├─ AWS Element84 STAC (Sentinel-2)
    ├─ Sentinel Hub (tile serving)
    ├─ CelesTrak (TLE data)
    └─ Space-Track.org (TLE updates)
```

### 5.2 State Management

```typescript
// lib/stores/spaceStore.ts
interface SpaceStore {
  // Imagery state
  selectedImage: SatelliteImage | null
  images: SatelliteImage[]
  timelineRange: [Date, Date]
  imageOpacity: number

  // Orbital state
  selectedSatellite: Satellite | null
  orbitVisible: boolean
  groundTracks: OrbitPosition[][]

  // Ground station state
  selectedGroundStation: GroundStation | null
  visibilityWindows: VisibilityWindow[]

  // Analysis state
  changeDetectionActive: boolean
  detectedChanges: DetectedChange[]

  // Actions
  loadTimeSeries: (location: [number, number], range: [Date, Date]) => Promise<void>
  selectImage: (image: SatelliteImage) => void
  toggleOrbitVisibility: (visible: boolean) => void
  runChangeDetection: (before: SatelliteImage, after: SatelliteImage) => Promise<void>
}
```

---

## 6. Performance Considerations

### 6.1 Imagery Loading

**Challenge**: Large satellite imagery files (10-100MB per image)

**Solutions**:
1. **COG (Cloud-Optimized GeoTIFF)** - Stream only visible portions
2. **Tile Pyramid** - Pre-tiled imagery for fast zoom
3. **Lazy Loading** - Load thumbnails first, full-res on-demand
4. **Caching** - IndexedDB for viewed imagery

```typescript
// Progressive loading strategy
async function loadImageProgressive(image: SatelliteImage) {
  // 1. Load thumbnail (256x256) immediately
  const thumbnail = await loadThumbnail(image)
  displayImage(thumbnail)

  // 2. Load preview (1024x1024) for better quality
  const preview = await loadPreview(image)
  displayImage(preview)

  // 3. Load full-resolution tiles as user zooms
  setupTileLoader(image)
}
```

### 6.2 Orbit Calculation

**Challenge**: Real-time orbit propagation for hundreds of satellites

**Solutions**:
1. **Worker Threads** - Offload calculations to Web Workers
2. **Caching** - Pre-compute 24-hour trajectories
3. **LOD (Level of Detail)** - Reduce position updates when zoomed out
4. **Batch Updates** - Update multiple satellites in single frame

```typescript
// Web Worker for orbit calculations
// workers/orbitWorker.ts
self.addEventListener('message', async (e) => {
  const { tles, startTime, duration } = e.data

  const orbits = await Promise.all(
    tles.map(tle => computeOrbit(tle, startTime, duration))
  )

  self.postMessage({ orbits })
})
```

---

## 7. Data Sources & APIs

### 7.1 Satellite Imagery

| Source | Resolution | Revisit | Cost | Use Case |
|--------|-----------|---------|------|----------|
| **Sentinel-2** | 10m | 5 days | Free | Time-series, change detection |
| **Landsat-8** | 30m | 16 days | Free | Long-term analysis |
| **Mapbox Satellite** | <1m | Composite | $ | Base layer, context |
| **Sentinel Hub** | 10m | 5 days | $$ | Advanced processing |
| **Planet Labs** | 3-5m | Daily | $$$ | Commercial intelligence |

**Recommendation**: Start with **Sentinel-2** (free, good resolution, 5-day revisit)

### 7.2 Orbital Data

| Source | Data Type | Update | Cost | Quality |
|--------|-----------|--------|------|---------|
| **CelesTrak** | TLE | Daily | Free | High |
| **Space-Track.org** | TLE | Real-time | Free (registration) | Official |
| **N2YO** | TLE + Tracking | Real-time | API key | Good |
| **SatNOGS** | Ground station network | Crowdsourced | Free | Community |

**Recommendation**: **CelesTrak** for daily updates + **Space-Track.org** for critical satellites

---

## 8. Intelligence Workflows

### 8.1 Use Case: Facility Monitoring

**Scenario**: Monitor suspected military installation for activity

**Workflow**:
1. **Select AOI** - Click location on map
2. **Load Time-Series** - Fetch last 90 days of Sentinel-2
3. **Timeline Scrub** - Review imagery sequence
4. **Detect Changes** - Run ML change detection
5. **Analyze Activity** - Score activity level
6. **Generate Report** - Export intelligence assessment

**UI Flow**:
```
Map View → Right-click AOI → "Monitor Location" → Timeline loads →
Scrub through images → Click "Detect Changes" → Review findings →
"Generate Report"
```

### 8.2 Use Case: Satellite Pass Planning

**Scenario**: Plan ground station operations for satellite downlink

**Workflow**:
1. **Select Ground Station** - Click ground station marker
2. **Select Satellite** - Choose from available satellites
3. **Predict Passes** - Show next 7 days of passes
4. **Optimize Schedule** - Find optimal pass times
5. **Visualize Coverage** - Show visibility cone and orbit

**UI Flow**:
```
Map View → Click GS → "Plan Operations" → Select Satellite →
View Pass Schedule → Reserve Time Slot → Export Schedule
```

---

## 9. UI/UX Design Patterns

### 9.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Left: AI Chat (420px)    │  Center: Map           │  Right: │
│  - Space domain query      │  - Satellite imagery   │  Panel  │
│  - "Show imagery for       │  - Orbit tracks        │  (600px)│
│    Buenos Aires"           │  - Ground stations     │         │
│  - Results & analysis      │                        │         │
│                            │  Bottom: Timeline      │         │
│                            │  (180px height)        │         │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Color Scheme (Space Domain)

```css
--space-primary: #1a1f36;      /* Dark blue-black */
--space-accent: #00d4ff;        /* Cyan (satellite) */
--space-orbit: rgba(0, 150, 255, 0.6);  /* Blue orbit */
--space-ground-station: #ff9500; /* Orange marker */
--space-imagery: rgba(255, 255, 255, 0.8); /* White overlay */
--space-change-positive: #00d084; /* Green (construction) */
--space-change-negative: #ff6b6b; /* Red (demolition) */
```

---

## 10. Success Metrics

### 10.1 Technical Metrics

- [ ] **Imagery Load Time** < 2 seconds for thumbnail
- [ ] **Orbit Calculation** < 500ms for 100 satellites
- [ ] **Change Detection** < 10 seconds for 100km² AOI
- [ ] **Timeline Scrubbing** 60fps smooth scrolling
- [ ] **API Uptime** > 99.5% for imagery services

### 10.2 Feature Completeness

- [ ] **Phase 1** (Core Imagery): 80% complete
- [ ] **Phase 2** (Orbital): 50% complete
- [ ] **Phase 3** (Analysis): 30% complete
- [ ] **Phase 4** (Advanced): 10% complete

**Overall Space Domain Status**: Target **90%** by completion

---

## 11. Next Steps

### Immediate (Week 1-2)
1. ✅ **Review & approve** this implementation plan
2. 🔨 **Phase 1.1**: Integrate real Sentinel-2 STAC API
3. 🔨 **Phase 1.2**: Build timeline bottom panel
4. 🔨 **Phase 1.3**: Implement map raster overlay

### Short-term (Week 3-6)
1. 🔨 **Phase 2.1**: Set up Python orbital mechanics service
2. 🔨 **Phase 2.2**: Integrate brahe library for orbit propagation
3. 🔨 **Phase 2.3**: Visualize orbit tracks with deck.gl

### Medium-term (Week 7-12)
1. 🔨 **Phase 3**: Build imagery detail panel
2. 🔨 **Phase 4**: Implement ML change detection
3. 📊 **Testing**: User acceptance testing with analyst workflows

---

## Appendix A: References

### Libraries & Tools
- **brahe**: https://github.com/duncaneddy/brahe
- **deck.gl**: https://deck.gl/ (orbit visualization)
- **Sentinel-2 STAC API**: https://earth-search.aws.element84.com/v1
- **CelesTrak**: https://celestrak.org/
- **Sentinel Hub**: https://www.sentinel-hub.com/

### Research Papers
- "Change Detection in Satellite Imagery Using Deep Learning" (IEEE 2021)
- "Orbital Mechanics for Engineering Students" (Curtis, 4th Ed.)
- "GEOINT Tradecraft: Satellite Imagery Analysis" (NGA 2019)

---

**Document Owner**: AI Systems
**Last Updated**: 2025-11-10
**Status**: Ready for Implementation
