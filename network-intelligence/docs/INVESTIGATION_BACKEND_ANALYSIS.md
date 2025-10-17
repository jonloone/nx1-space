# Investigation Mode Backend & Geospatial Analysis

## Executive Summary

This document provides a critical analysis of the Investigation Mode backend architecture, data flow, geospatial accuracy, and visualization layers. It identifies current issues, architectural concerns, and proposes concrete solutions to ensure accurate storytelling through geospatial intelligence.

**Status**: ⚠️ CRITICAL ISSUES IDENTIFIED
**Priority**: HIGH - Affects narrative coherence and data accuracy
**Impact**: Visualization quality, route authenticity, temporal accuracy

---

## Current Backend Architecture

### 1. Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO DEFINITION (investigation-scenarios.ts)                │
│ - Pre-defined locations with lat/lng                           │
│ - Temporal metadata (day, time, dwell minutes)                 │
│ - Significance classification                                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ ENRICHED SCENARIO LOADER (enrichedScenarioLoader.ts)           │
│ - Converts scenario format                                     │
│ - Calls AuthenticInvestigationDataService                      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUTHENTIC INVESTIGATION DATA SERVICE                            │
│ (authenticInvestigationDataService.ts)                          │
│                                                                 │
│ FOR EACH CONSECUTIVE LOCATION PAIR:                            │
│   1. Validate addresses (addressValidationService)             │
│   2. Generate route (valhallaRoutingService)                   │
│   3. Create tracking points from route waypoints               │
│   4. Calculate realistic dwell times                           │
│   5. Build route segments with timestamps                      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ POI ENRICHMENT (poiContextService)                             │
│ - Query nearby POIs (1km radius)                               │
│ - Enhance location notes with context                          │
│ - Assign validation status                                     │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ DEMO DATA OUTPUT (InvestigationDemoData)                       │
│ - subject: InvestigationSubject                                │
│ - locationStops: LocationStop[] (11 locations)                 │
│ - trackingPoints: TrackingPoint[] (route waypoints)            │
│ - routeSegments: RouteSegment[] (10 segments)                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Visualization Layer Stack

**DeckGL Layer Hierarchy** (from bottom to top):

1. **Heatmap Layer** (optional)
   - `HeatmapLayer` - Frequency visualization

2. **Route Visualization** (RoutePlayer)
   - `PathLayer` - Route trail (red, semi-transparent)
   - `PathLayer` x N - Segment paths (time-of-day colored)
   - `ScatterplotLayer` - Current position pulse (large, transparent)
   - `ScatterplotLayer` - Current position marker (small, solid)
   - `ScatterplotLayer` - Heading indicator (directional arrow)

3. **Location Markers** (LocationMarkers)
   - `ScatterplotLayer` - Anomaly glow rings (1.8x size)
   - `ScatterplotLayer` - Main location markers
   - `ScatterplotLayer` - Inner cores (0.4x size)
   - `ScatterplotLayer` - Visit count badges
   - `TextLayer` - Visit count numbers
   - `TextLayer` - Location labels

**Total Layers**: 15-20 simultaneous DeckGL layers

---

## Critical Issues Identified

### Issue #1: "Random Dots" - Visual Clutter from Layer Stacking

**Problem**: Multiple ScatterplotLayers create visual noise

**Root Cause**:
- Each location renders **3 separate markers** (glow + main + core)
- Current position renders **3 markers** (pulse + main + heading)
- Visit badges add **2 more layers** (background + text)
- Result: Up to **33 markers visible** for 11 locations

**Evidence**:
```typescript
// LocationMarkers.tsx lines 87-153
// Creates 3 overlapping circular markers per location
1. Outer glow (1.8x size, 80 alpha)
2. Main marker (1.0x size, 200 alpha)
3. Inner core (0.4x size, 255 alpha)
```

**Impact**:
- Cluttered visualization, especially when zoomed out
- Difficulty distinguishing actual stops from decorative layers
- Performance degradation with 15-20 active layers

**Recommendation**:
- Consolidate to **single marker per location** with configurable styling
- Use shader-based effects instead of multiple layers
- Implement LOD (Level of Detail) to hide decorative layers when zoomed out

---

### Issue #2: Route Generation Gaps

**Problem**: Routes only generated between **consecutive** scenario locations

**Root Cause**:
```typescript
// authenticInvestigationDataService.ts lines 178-247
for (let i = 0; i < scenario.locations.length; i++) {
  const location = scenario.locations[i]
  const nextLocation = scenario.locations[i + 1]

  // Generate route to next location if exists
  if (nextLocation) {
    const route = await generateRoute(...)
  }
}
```

**What This Means**:
- Location A → Location B → Location C
- Routes: A→B ✅, B→C ✅
- BUT: If subject moves A→B→C→A, there's no A→C route generated
- Result: Subject appears to "teleport" between non-consecutive locations

**Scenario Impact** (SCENARIO_DIGITAL_SHADOW):
```
Day 1: Home → Office → Coffee → Gym → Restaurant ✅ Connected
Day 2: Restaurant → Parking Garage ❌ GAP (no route from last Day 1 location)
Day 3: Storage → Navy Yard → Airport ✅ Connected
       Airport → Hotel ✅ Connected
       Hotel → Pier ✅ Connected
       Pier → ??? ❌ GAP (no return home)
```

**Recommendation**:
- Generate routes for **all temporal transitions**, not just consecutive array indices
- Sort locations by `arrivalTime`, then generate routes based on chronological order
- Add "return home" routes for multi-day scenarios

---

### Issue #3: Temporal Authenticity Compromised

**Problem**: Scenario uses **hardcoded times** instead of calculated route durations

**Root Cause**:
```typescript
// investigation-scenarios.ts
locations: [
  { name: 'Home', day: 1, time: '07:00', ... },
  { name: 'Office', day: 1, time: '08:30', ... },  // Assumes 90min commute
  { name: 'Coffee', day: 1, time: '12:30', ... }   // Assumes 4hr work block
]
```

**The Problem**:
- Valhalla generates real routes with **actual durations**
- But scenario times are **pre-set** and may not match reality
- Example: Scenario says 90min commute, but Valhalla calculates 35min actual driving time
- Result: Subject appears to drive **very slowly** or timeline doesn't make sense

**Current Implementation**:
```typescript
// authenticInvestigationDataService.ts line 238
currentTime = new Date(departureTime.getTime() + route.duration * 1000)
```
This correctly uses route duration, but it's **OVERRIDDEN** by the next location's pre-set arrival time!

**Recommendation**:
- **Option A**: Remove hardcoded times, calculate from routes + dwell
- **Option B**: Use hardcoded times as "checkpoints" and interpolate routes to match
- **Option C**: Generate scenarios dynamically with time-aware routing

---

### Issue #4: Incomplete Route Segments Data Structure

**Problem**: Route segments lack critical metadata for realistic visualization

**Current Structure**:
```typescript
interface RouteSegment {
  path: [number, number][]  // Just coordinates
  startTime: Date
  endTime: Date
  mode: 'driving' | 'walking' | 'transit'
  distance: number
}
```

**Missing Data**:
- ❌ Speed profile (for realistic animation)
- ❌ Road types (highway vs residential)
- ❌ Turn-by-turn instructions
- ❌ Traffic delays
- ❌ Elevation changes
- ❌ Intermediate stops (gas stations, traffic lights)

**Recommendation**:
- Extend Valhalla response parsing to capture full route metadata
- Add `speedProfile: { timestamp: Date, speedKmh: number }[]`
- Add `roadSegments: { type: 'highway' | 'arterial' | 'residential', distance: number }[]`

---

### Issue #5: TrackingPoints vs LocationStops Confusion

**Problem**: Two overlapping data structures with unclear roles

**TrackingPoints** (from routes):
```typescript
TrackingPoint {
  lat, lng: number
  timestamp: Date
  speed: number    // Always 0! Never calculated
  heading: number  // Always 0! Never calculated
}
```

**LocationStops** (from scenario):
```typescript
LocationStop {
  id, name, type, significance
  lat, lng: number
  arrivalTime, departureTime: Date
  dwellTimeMinutes: number
  visitCount: number
  notes?: string
}
```

**The Issue**:
- TrackingPoints should represent **movement** (every 30 seconds during travel)
- LocationStops should represent **dwell** (places where subject stopped)
- But currently:
  - TrackingPoints have speed=0 and heading=0 (useless)
  - LocationStops are shown as big markers even during transit
  - No distinction between "passing through" and "stopping at"

**Recommendation**:
- Calculate actual speed and heading from route geometry
- Add `isTransit: boolean` flag to distinguish passing vs stopping
- Use different visualization for transit vs dwell points

---

### Issue #6: No Data Validation or Integrity Checks

**Problem**: No validation that generated data makes logical sense

**Missing Validations**:
- ❌ Route start/end matches location coordinates
- ❌ Time intervals are positive (no time travel)
- ❌ Routes don't cross oceans or go through buildings
- ❌ Dwell times match significance (anomaly shouldn't be 8 hours)
- ❌ Subject doesn't teleport (speed > 200 mph)
- ❌ Day boundaries are respected (Day 1 → Day 2 transition)

**Example Failure Scenario**:
```typescript
// No check that this makes sense:
Location A: lat: 40.7661, lng: -73.9912 (Manhattan)
Location B: lat: 40.7007, lng: -73.9721 (Brooklyn)
Route: null (Valhalla failed)
Time progression: 12:00 → 12:15 (15 minutes)
Distance: ~8 km

// Subject traveled 8km in 15 minutes = 32 km/h average
// This is IMPOSSIBLE in NYC traffic during daytime
```

**Recommendation**:
- Add `DataIntegrityService` to validate generated data
- Check route continuity, speed limits, temporal consistency
- Log warnings for suspicious patterns
- Provide fallback correction strategies

---

## Data Accuracy Assessment

### Current Accuracy Levels

| Component | Accuracy | Notes |
|-----------|----------|-------|
| **Coordinates** | ⭐⭐⭐⭐⭐ 95% | Real NYC lat/lng, validated |
| **Routes** | ⭐⭐⭐⭐ 80% | Valhalla provides real streets, but gaps exist |
| **Timestamps** | ⭐⭐ 40% | Hardcoded, doesn't match route durations |
| **Speed/Heading** | ⭐ 10% | Always zero, never calculated |
| **Dwell Times** | ⭐⭐⭐ 60% | Realistic ranges, but not contextualized |
| **POI Context** | ⭐⭐⭐⭐ 85% | Good nearby POI enrichment |
| **Narrative Coherence** | ⭐⭐⭐ 65% | Story makes sense, but timeline issues |

### Geospatial Data Quality

**Strengths**:
✅ Real NYC coordinates from known landmarks
✅ Valhalla provides actual street-level routing
✅ Address validation catches bad coordinates
✅ POI enrichment adds real-world context

**Weaknesses**:
❌ Route gaps between non-consecutive locations
❌ No validation of route geometry
❌ Missing elevation data (NYC has hills!)
❌ No consideration of one-way streets, traffic
❌ Hardcoded timestamps override calculated routes

---

## Proposed Solutions

### Phase 1: Immediate Fixes (2-4 hours)

**1.1 Fix Layer Stacking** ✅ CRITICAL
- Reduce location markers from 3 layers to 1
- Make glow/pulse effects optional via settings
- Implement LOD (hide decorations when zoomed out)

**File**: `components/investigation/LocationMarkers.tsx`
```typescript
// Add optional parameter to control layer complexity
export function useLocationMarkersLayers({
  locations,
  renderQuality = 'high' // 'high' | 'medium' | 'low'
}: LocationMarkersProps) {
  if (renderQuality === 'low') {
    // Single marker only
  } else if (renderQuality === 'medium') {
    // Main marker + label
  } else {
    // Full glow + main + core + badge
  }
}
```

**1.2 Fix Route Continuity**
- Sort locations by `arrivalTime` before route generation
- Generate routes based on **chronological order**, not array order

**File**: `lib/services/authenticInvestigationDataService.ts`
```typescript
async scenarioToDemo(scenario: AuthenticScenario): Promise<InvestigationDemoData> {
  // STEP 1: Sort locations by chronological order
  const chronologicalLocations = [...scenario.locations].sort((a, b) => {
    const timeA = this.parseScenarioTime(a.day, a.time)
    const timeB = this.parseScenarioTime(b.day, b.time)
    return timeA.getTime() - timeB.getTime()
  })

  // STEP 2: Generate routes between consecutive chronological locations
  for (let i = 0; i < chronologicalLocations.length - 1; i++) {
    const from = chronologicalLocations[i]
    const to = chronologicalLocations[i + 1]
    // Generate route...
  }
}
```

**1.3 Add Data Validation**
- Create simple validation checks
- Log warnings for suspicious data

```typescript
function validateRouteData(data: InvestigationDemoData): ValidationResult {
  const warnings = []

  // Check for time travel
  for (let i = 0; i < data.locationStops.length - 1; i++) {
    const current = data.locationStops[i]
    const next = data.locationStops[i + 1]
    if (next.arrivalTime <= current.departureTime) {
      warnings.push(`Time overlap: ${current.name} → ${next.name}`)
    }
  }

  // Check for impossible speeds
  for (const segment of data.routeSegments) {
    const duration = (segment.endTime.getTime() - segment.startTime.getTime()) / 1000
    const speed = (segment.distance / duration) * 3.6 // km/h
    if (speed > 120) {
      warnings.push(`Impossible speed: ${speed.toFixed(0)} km/h`)
    }
  }

  return { valid: warnings.length === 0, warnings }
}
```

---

### Phase 2: Enhanced Realism (4-8 hours)

**2.1 Calculate Speed and Heading**
- Parse route geometry to calculate realistic speed profiles
- Compute heading from consecutive coordinates

```typescript
function calculateSpeedAndHeading(route: ValhallaRoute): TrackingPoint[] {
  const points: TrackingPoint[] = []

  for (let i = 0; i < route.waypoints.length - 1; i++) {
    const current = route.waypoints[i]
    const next = route.waypoints[i + 1]

    // Calculate heading
    const dLng = next.lng - current.lng
    const dLat = next.lat - current.lat
    const heading = Math.atan2(dLng, dLat) * 180 / Math.PI

    // Calculate speed
    const distance = haversine(current, next)
    const timeDiff = (next.timestamp - current.timestamp) / 1000
    const speed = (distance / timeDiff) * 3.6 // km/h

    points.push({
      lat: current.lat,
      lng: current.lng,
      timestamp: current.timestamp,
      speed,
      heading: (heading + 360) % 360 // Normalize to 0-360
    })
  }

  return points
}
```

**2.2 Temporal Recalculation**
- Make timestamps **derived** from routes, not hardcoded
- Add realistic pause times for traffic, stops

```typescript
class TemporalRouteBuilder {
  async buildRealisticTimeline(locations: ScenarioLocation[]): Promise<Timeline> {
    const timeline = []
    let currentTime = this.getStartTime(locations[0])

    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i]
      const to = locations[i + 1]

      // Add dwell time at current location
      const dwellTime = this.calculateRealisticDwell(from)
      const departureTime = new Date(currentTime.getTime() + dwellTime)

      // Generate route
      const route = await generateRoute(from.coordinates, to.coordinates)

      // Account for traffic based on time of day
      const trafficMultiplier = this.getTrafficMultiplier(departureTime)
      const travelTime = route.duration * trafficMultiplier

      // Arrive at next location
      currentTime = new Date(departureTime.getTime() + travelTime * 1000)

      timeline.push({
        location: to,
        arrivalTime: currentTime,
        departureTime,
        routeDuration: travelTime
      })
    }

    return timeline
  }

  getTrafficMultiplier(time: Date): number {
    const hour = time.getHours()
    if (hour >= 7 && hour <= 9) return 1.8  // Morning rush
    if (hour >= 16 && hour <= 19) return 1.9 // Evening rush
    if (hour >= 0 && hour <= 5) return 0.7   // Late night
    return 1.0
  }
}
```

**2.3 Extended Route Metadata**
- Parse full Valhalla response for road types, instructions
- Add realistic animation parameters

---

### Phase 3: Production-Ready Intelligence (8-16 hours)

**3.1 Multi-Day Route Continuity**
- Handle overnight stays properly
- Add "return home" routes for multi-day scenarios
- Implement day boundaries with realistic sleep times

**3.2 Behavior Pattern Analysis**
- Detect commute patterns automatically
- Flag unusual routes (deviation from normal)
- Calculate routine vs anomaly scores based on actual patterns

**3.3 Advanced Temporal Modeling**
- Business hours validation
- Weekend vs weekday patterns
- Seasonal adjustments (daylight, weather)

**3.4 Performance Optimization**
- Implement layer virtualization (only render visible layers)
- Use WebGL shaders for marker effects
- Cache route calculations
- Implement progressive loading for long scenarios

---

## Testing & Validation Framework

### Proposed Test Suite

**Unit Tests**:
```typescript
describe('RouteGeneration', () => {
  it('should generate routes in chronological order', async () => {
    const scenario = SCENARIO_DIGITAL_SHADOW
    const data = await service.scenarioToDemo(scenario)

    // Verify chronological continuity
    for (let i = 0; i < data.routeSegments.length - 1; i++) {
      expect(data.routeSegments[i].endTime)
        .toBeLessThanOrEqual(data.routeSegments[i + 1].startTime)
    }
  })

  it('should not allow time travel', () => {
    // Test that all timestamps progress forward
  })

  it('should calculate realistic speeds', () => {
    // Test that no segment exceeds 120 km/h in NYC
  })
})
```

**Integration Tests**:
- End-to-end scenario loading
- Route generation with Valhalla
- POI enrichment accuracy
- Visualization layer rendering

**Visual Regression Tests**:
- Screenshot comparison for map rendering
- Layer stacking verification
- Label overlap detection

---

## Implementation Roadmap

### Week 1: Critical Fixes
- [ ] Reduce layer count from 15-20 to 8-10
- [ ] Fix route generation chronological ordering
- [ ] Add basic data validation
- [ ] Test with SCENARIO_DIGITAL_SHADOW

### Week 2: Enhanced Realism
- [ ] Calculate speed and heading from routes
- [ ] Implement temporal recalculation
- [ ] Add traffic multipliers
- [ ] Extend route metadata

### Week 3: Production Hardening
- [ ] Multi-day route continuity
- [ ] Pattern analysis
- [ ] Performance optimization
- [ ] Comprehensive testing

### Week 4: Documentation & QA
- [ ] API documentation
- [ ] User guide for scenario creation
- [ ] Performance benchmarks
- [ ] Security audit

---

## Metrics for Success

### Quantitative Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Layer Count | 15-20 | 6-10 |
| Route Coverage | 80% | 100% |
| Temporal Accuracy | 40% | 95% |
| Frame Rate (60fps) | ~45fps | >55fps |
| Load Time | ~8s | <3s |

### Qualitative Metrics

- ✅ Routes follow actual streets (not straight lines)
- ✅ Timeline is narratively coherent
- ✅ No visual clutter from overlapping markers
- ✅ Realistic movement speeds
- ✅ Proper day/night transitions
- ✅ Contextual POI information enhances story

---

## Conclusion

The Investigation Mode backend demonstrates strong foundational architecture with real geospatial routing (Valhalla), address validation, and POI enrichment. However, critical issues in layer visualization, route continuity, and temporal accuracy compromise the storytelling effectiveness.

**Top Priorities**:
1. **Fix visual clutter** from layer stacking (2 hours)
2. **Fix route gaps** via chronological ordering (2 hours)
3. **Add data validation** to catch issues early (1 hour)

These three fixes will immediately improve the user experience and data accuracy, enabling confident demonstration of geospatial intelligence capabilities.

**Long-term Vision**:
Build a fully autonomous investigation scenario generator that creates realistic, temporally accurate, geospatially precise surveillance narratives from high-level specifications. The system should be capable of generating months of realistic subject behavior with minimal human input.

---

## Appendix A: File References

### Core Backend Files
- `lib/services/authenticInvestigationDataService.ts` - Route generation orchestration
- `lib/services/valhallaRoutingService.ts` - Valhalla API integration
- `lib/services/enrichedScenarioLoader.ts` - Scenario loading & enrichment
- `lib/services/poiContextService.ts` - POI enrichment
- `lib/demo/investigation-scenarios.ts` - Scenario definitions

### Visualization Files
- `components/investigation/InvestigationMode.tsx` - Main container
- `components/investigation/RoutePlayer.tsx` - Route animation layers
- `components/investigation/LocationMarkers.tsx` - Location marker layers

### Data Types
- `lib/demo/investigation-demo-data.ts` - Type definitions

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Author**: Investigation Intelligence System Analysis
**Classification**: INTERNAL TECHNICAL DOCUMENTATION
