# Multi-Layer Analysis System - Testing & Usage Guide

## Quick Start Testing

### Method 1: Browser Console Testing (Fastest)

Open your browser console on `/operations` page and run these commands:

#### Test 1: Route Analysis
```javascript
// Import the service
const { getRouteAnalysisService } = await import('/lib/services/routeAnalysisService')
const service = getRouteAnalysisService()

// Analyze a route (Times Square to Central Park)
const route = await service.generateAnalyzedRoute({
  from: [-73.9855, 40.7580],  // Times Square
  to: [-73.9654, 40.7829],    // Central Park
  mode: 'driving',
  startTime: new Date()
})

console.log('Route Analysis Results:', route)
console.log('Risk Level:', route.riskAssessment.riskLevel)
console.log('Anomalies:', route.anomalyDetection.anomalyCount)
```

#### Test 2: Satellite Imagery
```javascript
const { getSatelliteImageryService } = await import('/lib/services/satelliteImageryService')
const imagery = getSatelliteImageryService()

// Get satellite images for Buenos Aires
const images = await imagery.getImagery({
  center: [-58.3816, -34.6037],
  source: 'sentinel-2'
})

console.log('Satellite Images:', images)
```

#### Test 3: Change Detection
```javascript
const { getImageryAnalysisService } = await import('/lib/services/imageryAnalysisService')
const analysis = getImageryAnalysisService()

// First get time-series images
const { getSatelliteImageryService } = await import('/lib/services/satelliteImageryService')
const imagery = getSatelliteImageryService()

const timeSeries = await imagery.getTimeSeries(
  [-58.3816, -34.6037],
  new Date('2024-09-01'),
  new Date('2024-11-01')
)

// Run change detection
const changes = await analysis.detectChanges({
  beforeImage: timeSeries.images[0],
  afterImage: timeSeries.images[timeSeries.images.length - 1],
  sensitivity: 'medium'
})

console.log('Changes Detected:', changes.summary.totalChanges)
console.log('Change Types:', changes.summary.changeTypes)
```

#### Test 4: Isochrone Analysis
```javascript
const { getIsochroneAnalysisService } = await import('/lib/services/isochroneAnalysisService')
const isochrone = getIsochroneAnalysisService()

// Analyze reachability for Buenos Aires
const reachability = await isochrone.analyzeReachability({
  center: [-58.3816, -34.6037],
  locationName: 'Buenos Aires City Center',
  modes: ['driving', 'walking', 'cycling'],
  contours: [15, 30, 45]
})

console.log('Accessibility Score:', reachability.accessibility.overallScore)
console.log('Best Mode:', reachability.comparison.fastestMode)
```

#### Test 5: Multi-Layer Integration
```javascript
const { getMultiLayerAnalysisService } = await import('/lib/services/multiLayerAnalysisService')
const multi = getMultiLayerAnalysisService()

// Comprehensive analysis
const result = await multi.analyzeLocation({
  center: [-58.3816, -34.6037],
  locationName: 'Buenos Aires',
  analysisTypes: ['route', 'imagery', 'isochrone'],
  route: {
    from: [-58.3816, -34.6037],
    to: [-58.4173, -34.6131],
    mode: 'driving'
  },
  imagery: {
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-11-01'),
    includeChangeDetection: true,
    includeActivityAnalysis: true
  },
  isochrone: {
    modes: ['driving', 'walking'],
    contours: [15, 30]
  }
})

console.log('Integrated Analysis:', result)
console.log('Overall Risk Score:', result.integration.overallRiskScore)
console.log('Risk Level:', result.integration.riskLevel)
console.log('Key Findings:', result.integration.keyFindings)
```

---

## Method 2: Natural Language Chat Interface

Use the AI Copilot to trigger analyses via natural language:

### Route Analysis via Chat
```
User: "Analyze the route from Times Square to Central Park by driving"

→ Copilot will call analyzeRoute tool
→ Route analysis will be generated
→ Results appear in chat or panel
```

### Combined Analysis
```
User: "Give me a full intelligence assessment for coordinates -58.38, -34.60 including route options and satellite imagery"

→ Multi-layer analysis triggered
→ Unified panel displays integrated results
```

---

## Method 3: Direct Panel Testing

Create a test page to render panels directly:

### Create Test Page
Create `app/test-panels/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import RouteAnalysisPanel from '@/components/opintel/panels/RouteAnalysisPanel'
import { getRouteAnalysisService } from '@/lib/services/routeAnalysisService'

export default function TestPanels() {
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const service = getRouteAnalysisService()
      const result = await service.generateAnalyzedRoute({
        from: [-73.9855, 40.7580],
        to: [-73.9654, 40.7829],
        mode: 'driving',
        startTime: new Date()
      })
      setRouteData(result)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="h-screen">
      <RouteAnalysisPanel
        data={routeData}
        onClose={() => console.log('Close clicked')}
        onFlyToWaypoint={(coords) => console.log('Fly to:', coords)}
      />
    </div>
  )
}
```

**Access at:** `http://localhost:3000/test-panels`

---

## Method 4: Integration with Existing Operations Page

### Step 1: Add to PanelRouter

Edit `components/panels/PanelRouter.tsx`:

```typescript
import RouteAnalysisPanel from '@/components/opintel/panels/RouteAnalysisPanel'
import ImageryAnalysisPanel from '@/components/opintel/panels/ImageryAnalysisPanel'
import IsochroneAnalysisPanel from '@/components/opintel/panels/IsochroneAnalysisPanel'
import UnifiedAnalysisPanel from '@/components/opintel/panels/UnifiedAnalysisPanel'

// In the switch statement, add:
case 'route-analysis':
  return <RouteAnalysisPanel data={data.route} onClose={onClose} />

case 'imagery-analysis':
  return <ImageryAnalysisPanel data={data} onClose={onClose} />

case 'isochrone-analysis':
  return <IsochroneAnalysisPanel data={data.isochrone} onClose={onClose} />

case 'unified-analysis':
  return <UnifiedAnalysisPanel data={data} onClose={onClose} />
```

### Step 2: Trigger from Map Actions

Edit `app/operations/page.tsx` and add handler:

```typescript
const handleRouteAnalysis = async (from, to) => {
  const { getRouteAnalysisService } = await import('@/lib/services/routeAnalysisService')
  const service = getRouteAnalysisService()

  const result = await service.generateAnalyzedRoute({
    from,
    to,
    mode: 'driving',
    startTime: new Date()
  })

  openRightPanel('route-analysis', {
    route: result,
    timestamp: new Date()
  })
}

// Call it with:
handleRouteAnalysis(
  [-58.3816, -34.6037],  // From
  [-58.4173, -34.6131]   // To
)
```

---

## Test Scenarios

### Scenario 1: Operational Planning Workflow

**Goal:** Plan a surveillance operation route

```javascript
// 1. Analyze route with risk assessment
const route = await routeAnalysisService.generateAnalyzedRoute({
  from: [-58.3816, -34.6037],
  to: [-58.4173, -34.6131],
  mode: 'driving'
})

// 2. Check for high-risk segments
if (route.riskAssessment.riskLevel === 'high' || route.riskAssessment.riskLevel === 'critical') {
  console.warn('⚠️ High-risk route detected!')
  console.log('High-risk segments:', route.riskAssessment.highRiskSegments)
}

// 3. Review anomalies
route.anomalyDetection.anomalies.forEach(anomaly => {
  console.log(`Anomaly at waypoint ${anomaly.waypointIndex}:`, anomaly.reasons)
})

// 4. Display in panel for team review
openRightPanel('route-analysis', { route })
```

### Scenario 2: Site Surveillance Workflow

**Goal:** Assess a location for surveillance setup

```javascript
// 1. Get satellite imagery history
const timeSeries = await imageryService.getTimeSeries(
  targetCoordinates,
  new Date('2024-08-01'),
  new Date('2024-11-01'),
  { maxCloudCover: 20 }
)

// 2. Analyze activity over time
const activity = await imageryAnalysisService.analyzeActivity(
  timeSeries,
  'Target Location'
)

// 3. Check activity level
if (activity.activityLevel === 'high' || activity.activityLevel === 'very_high') {
  console.warn('⚠️ High activity detected!')
  console.log('Activity score:', activity.activityScore)
  console.log('Risk indicators:', activity.intelligence.riskIndicators)
}

// 4. Display in panel
openRightPanel('imagery-analysis', {
  type: 'activity-analysis',
  activityAnalysis: activity
})
```

### Scenario 3: Multi-Layer Assessment Workflow

**Goal:** Comprehensive location intelligence

```javascript
// Run integrated analysis
const assessment = await multiLayerAnalysisService.analyzeLocation({
  center: targetCoordinates,
  locationName: 'Target Site',
  analysisTypes: ['all'],
  route: {
    from: baseCoordinates,
    to: targetCoordinates,
    mode: 'driving'
  },
  imagery: {
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-11-01'),
    includeChangeDetection: true,
    includeActivityAnalysis: true
  },
  isochrone: {
    modes: ['driving', 'walking', 'cycling'],
    contours: [15, 30, 45]
  }
})

// Review integrated intelligence
console.log('Overall Risk:', assessment.integration.riskLevel)
console.log('Risk Score:', assessment.integration.overallRiskScore)
console.log('Key Findings:', assessment.integration.keyFindings)
console.log('Cross-layer Correlations:', assessment.integration.correlations)
console.log('Recommended Actions:', assessment.integration.recommendedActions)

// Display in unified panel
openRightPanel('unified-analysis', assessment)
```

---

## Quick Test Commands

Run these in the browser console for instant results:

### Quick Route Test (NYC)
```javascript
(async () => {
  const { getRouteAnalysisService } = await import('/lib/services/routeAnalysisService')
  const result = await getRouteAnalysisService().generateAnalyzedRoute({
    from: [-74.0060, 40.7128],  // NYC
    to: [-73.9352, 40.7306],    // LGA Airport
    mode: 'driving'
  })
  console.table({
    'Risk Level': result.riskAssessment.riskLevel,
    'Risk Score': result.riskAssessment.overallRiskScore,
    'Distance (km)': (result.route.distance / 1000).toFixed(2),
    'Duration (min)': (result.route.duration / 60).toFixed(0),
    'Anomalies': result.anomalyDetection.anomalyCount,
    'Waypoints': result.analyzedWaypoints.length
  })
  return result
})()
```

### Quick Imagery Test (Buenos Aires)
```javascript
(async () => {
  const { getSatelliteImageryService } = await import('/lib/services/satelliteImageryService')
  const { getImageryAnalysisService } = await import('/lib/services/imageryAnalysisService')

  const imagery = getSatelliteImageryService()
  const analysis = getImageryAnalysisService()

  const timeSeries = await imagery.getTimeSeries(
    [-58.3816, -34.6037],
    new Date('2024-09-01'),
    new Date('2024-11-01')
  )

  const activity = await analysis.analyzeActivity(timeSeries, 'Buenos Aires')

  console.table({
    'Activity Level': activity.activityLevel,
    'Activity Score': activity.activityScore,
    'Images Analyzed': timeSeries.images.length,
    'Change Frequency': activity.changeFrequency + '/month',
    'Risk Indicators': activity.intelligence.riskIndicators.length
  })
  return activity
})()
```

### Quick Multi-Layer Test
```javascript
(async () => {
  const { getMultiLayerAnalysisService } = await import('/lib/services/multiLayerAnalysisService')
  const result = await getMultiLayerAnalysisService().quickOperationalPlan(
    [-58.3816, -34.6037],
    [-58.4173, -34.6131],
    'Buenos Aires'
  )
  console.log('📊 Multi-Layer Analysis Complete!')
  console.table({
    'Overall Risk': result.integration.riskLevel,
    'Risk Score': result.integration.overallRiskScore,
    'Confidence': result.metadata.confidenceScore + '%',
    'Analysis Types': result.metadata.analysisTypes.join(', '),
    'Key Findings': result.integration.keyFindings.length,
    'Actions': result.integration.recommendedActions.length
  })
  return result
})()
```

---

## Expected Output Examples

### Route Analysis Output
```
{
  route: { distance: 5243m, duration: 720s },
  analyzedWaypoints: [10 waypoints],
  anomalyDetection: {
    hasAnomalies: true,
    anomalyCount: 2,
    anomalies: [
      { waypointIndex: 3, severity: 'medium', reasons: ['Late-night timing'] },
      { waypointIndex: 7, severity: 'high', reasons: ['High-risk location'] }
    ]
  },
  riskAssessment: {
    overallRiskScore: 45,
    riskLevel: 'medium',
    highRiskSegments: [...],
    recommendedActions: ['Exercise caution during evening hours']
  }
}
```

### Change Detection Output
```
{
  summary: {
    totalChanges: 8,
    significantChanges: 5,
    changeTypes: { construction: 3, vegetation_loss: 2, infrastructure: 3 }
  },
  changes: [
    {
      type: 'construction',
      confidence: 87.3,
      magnitude: 72.1,
      description: 'Significant construction activity detected'
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Service not available"
**Solution:** Make sure Next.js dev server is running:
```bash
npm run dev
```

### Issue: "Valhalla routing failed"
**Solution:** Valhalla may not be running. The system will auto-fallback to Mapbox:
```
⚠️ Valhalla service unavailable, will use Mapbox fallback
🗺️ Using Mapbox for routing (fallback)
```

### Issue: "No satellite images found"
**Solution:** This is expected for the mock implementation. Real integration requires:
- Sentinel-2 STAC API connection
- Google Earth Engine API key
- Or use Mapbox satellite (always available)

### Issue: Panel not showing
**Solution:** Check browser console for errors and verify panel is registered in PanelRouter

---

## Next Steps

1. **Test in browser console** - Fastest way to verify services work
2. **Create test page** - Build dedicated test UI at `/test-panels`
3. **Integrate with operations page** - Add panel routing
4. **Test natural language** - Use chat interface: "Analyze route from X to Y"
5. **Add to production** - Connect with real data sources

---

## Production Integration Checklist

- [ ] Configure Valhalla service URL (or rely on Mapbox fallback)
- [ ] Add Sentinel-2 STAC API integration
- [ ] Configure Google Earth Engine API key (optional)
- [ ] Wire up Copilot tool execution
- [ ] Add panel routes to PanelRouter
- [ ] Test with real coordinates
- [ ] Add export functionality for reports
- [ ] Configure layer visualization on map
- [ ] Add user permissions/access control
- [ ] Set up analytics/logging

---

## API Reference

See individual service files for complete API documentation:
- `lib/services/routeAnalysisService.ts`
- `lib/services/satelliteImageryService.ts`
- `lib/services/imageryAnalysisService.ts`
- `lib/services/isochroneAnalysisService.ts`
- `lib/services/multiLayerAnalysisService.ts`
