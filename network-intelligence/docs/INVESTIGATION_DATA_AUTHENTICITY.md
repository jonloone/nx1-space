# Investigation Data Authenticity Guide

## Overview

This document explains the data authenticity approach for the Investigation Mode feature, detailing how we generate realistic, story-driven surveillance scenarios with authentic NYC locations and coherent narratives.

## Problem Statement

**Before**: Investigation demo showed "random data floating around the map" with no clear story or context.

**After**: Story-driven investigation scenarios with:
- Real NYC addresses and landmarks
- Coherent 72-hour narratives
- Contextual notes for each location
- Subject profiles and key findings
- Realistic routing via Valhalla

## Architecture

### Data Generation Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Investigation Mode UI                     │
│              (InvestigationMode.tsx)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌────────────────────┐         ┌─────────────────────┐
│  Pre-Generated     │         │  AI-Generated       │
│  Scenarios         │         │  Scenarios          │
│                    │         │                     │
│  investigation-    │         │  authenticInvest-   │
│  scenarios.ts      │         │  igationData        │
│                    │         │  Service.ts         │
│  - Digital Shadow  │         │                     │
│  - Night Market    │         │  Uses Vultr LLM     │
└────────────────────┘         └─────────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
           ┌──────────────────────────┐
           │   Valhalla Routing       │
           │   (Real street routes)   │
           └──────────────────────────┘
                         │
                         ▼
           ┌──────────────────────────┐
           │  InvestigationDemoData   │
           │  - Subject profile       │
           │  - Location stops        │
           │  - Tracking points       │
           │  - Route segments        │
           └──────────────────────────┘
```

## Data Sources

### 1. Pre-Generated Scenarios (Recommended)

**File**: `lib/demo/investigation-scenarios.ts`

**Use Case**: Production-ready scenarios with vetted data

**Scenarios Available**:
- **Operation Digital Shadow**: Tech worker with cryptocurrency activity
- **Operation Night Market**: Retail manager with import/export connections (partial)

**Example**:
```typescript
import { SCENARIO_DIGITAL_SHADOW, getScenarioById } from '@/lib/demo/investigation-scenarios'

// Use specific scenario
const scenario = SCENARIO_DIGITAL_SHADOW

// Or get by ID
const scenario = getScenarioById('digital-shadow')

// Convert to demo data (requires authenticInvestigationDataService)
const service = getAuthenticInvestigationDataService()
const demoData = await service.scenarioToDemo(scenario)
```

### 2. AI-Generated Scenarios (Advanced)

**File**: `lib/services/authenticInvestigationDataService.ts`

**Use Case**: Dynamic scenario generation for custom investigations

**Requirements**:
- Vultr API key configured
- Valhalla routing service running

**Example**:
```typescript
import { getAuthenticInvestigationDataService } from '@/lib/services/authenticInvestigationDataService'

const service = getAuthenticInvestigationDataService()

// Generate new scenario
const scenario = await service.generateScenario('tech_worker')
// Options: 'tech_worker' | 'financial' | 'retail'

// Convert to demo data with real routes
const demoData = await service.scenarioToDemo(scenario)
```

### 3. Existing Realistic Data (Legacy)

**File**: `lib/demo/investigation-demo-data-realistic.ts`

**Status**: Still functional, but pre-generated scenarios preferred

**Note**: Already uses real NYC locations and Valhalla routing

## Scenario Structure

### InvestigationScenario Format

```typescript
interface InvestigationScenario {
  id: string                    // Unique identifier
  title: string                 // "Operation [Name]"
  description: string           // Brief overview
  narrative: string             // 3-paragraph story

  subject: {
    profile: string             // Detailed profile
    occupation: string          // Job title
    ageRange: string            // e.g., "30-35"
    homeNeighborhood: string    // e.g., "Hell's Kitchen"
    workLocation: string        // e.g., "Chelsea, Manhattan"
  }

  keyFindings: string[]         // Critical observations

  locations: ScenarioLocation[] // Chronological visit sequence
}
```

### ScenarioLocation Format

```typescript
interface ScenarioLocation {
  name: string                  // "Brooklyn Navy Yard Warehouse"
  address: string               // Full street address
  lat: number                   // Latitude
  lng: number                   // Longitude
  type: 'residence' | 'workplace' | 'commercial' | 'meeting' | 'transport' | 'unknown'
  day: number                   // Day 1, 2, or 3
  time: string                  // "14:30" format
  dwellMinutes: number          // Time spent at location
  significance: 'routine' | 'suspicious' | 'anomaly'
  notes: string                 // Investigative context
}
```

## Creating a New Scenario

### Option 1: Manual Pre-Generation (Recommended)

1. Open `lib/demo/investigation-scenarios.ts`

2. Create new scenario object:

```typescript
export const SCENARIO_MY_CASE: InvestigationScenario = {
  id: 'my-case',
  title: 'Operation [Name]',
  description: 'Brief description of investigation',

  narrative: `Multi-paragraph narrative explaining:
  - Subject background
  - Investigation trigger
  - Pattern of behavior observed
  - Critical findings
  - Recommended action`,

  subject: {
    profile: 'Detailed subject description',
    occupation: 'Job title',
    ageRange: '35-40',
    homeNeighborhood: 'Brooklyn Heights',
    workLocation: 'Manhattan'
  },

  keyFindings: [
    '🚨 CRITICAL: Major finding',
    '⚠️  SUSPICIOUS: Unusual pattern',
    '📊 ANALYTICAL: Data observation'
  ],

  locations: [
    {
      name: 'Real NYC Place Name',
      address: 'Real street address',
      lat: 40.7128,  // Real coordinates
      lng: -74.0060,
      type: 'residence',
      day: 1,
      time: '07:00',
      dwellMinutes: 480,
      significance: 'routine',
      notes: 'Detailed context about why this location matters'
    }
    // Add more locations...
  ]
}
```

3. Add to `getAllScenarios()`:

```typescript
export function getAllScenarios(): InvestigationScenario[] {
  return [
    SCENARIO_DIGITAL_SHADOW,
    SCENARIO_NIGHT_MARKET,
    SCENARIO_MY_CASE  // Add here
  ]
}
```

### Option 2: AI Generation

```typescript
const service = getAuthenticInvestigationDataService()

// Generate scenario using LLM
const scenario = await service.generateScenario('tech_worker')

// Review and validate generated data
console.log(scenario.title)
console.log(scenario.locations.length)

// Save as pre-generated scenario if quality is good
// Copy output to investigation-scenarios.ts
```

## Data Authenticity Standards

### Location Requirements

✅ **DO**:
- Use real NYC addresses
- Include real landmark names (Empire State Building, Brooklyn Bridge)
- Use actual neighborhood names (Williamsburg, Red Hook, Hell's Kitchen)
- Verify coordinates match addresses
- Include business hours where applicable

❌ **DON'T**:
- Make up fake street addresses
- Use placeholder coordinates
- Create fictional business names
- Mix neighborhoods incorrectly

### Narrative Requirements

✅ **DO**:
- Write coherent 3-paragraph stories
- Establish routine before anomalies
- Provide investigative context
- Use realistic financial figures
- Include plausible motivations

❌ **DON'T**:
- Create disjointed random events
- Skip background establishment
- Leave findings unexplained
- Use unrealistic details

### Temporal Requirements

✅ **DO**:
- Day 1: Normal routine (home → work → routine activities)
- Day 2: Minor anomalies (unusual locations, brief meetings)
- Day 3: Critical findings (late-night meetings, suspicious activity)
- Match business hours to location types
- Allow realistic travel time between locations

❌ **DON'T**:
- Jump immediately to suspicious activity
- Use impossible timing (across city in 5 minutes)
- Visit closed businesses
- Skip sleep/home time

## Integration with Investigation Mode

### Current Usage

`components/investigation/InvestigationMode.tsx` uses:

```typescript
// Currently generates data on mount
useEffect(() => {
  async function generateData() {
    const data = await generateOperationNightfallDataRealistic()
    setDemoData(data)
  }
  generateData()
}, [])
```

### Recommended Migration

Replace with scenario-based approach:

```typescript
import { SCENARIO_DIGITAL_SHADOW } from '@/lib/demo/investigation-scenarios'
import { getAuthenticInvestigationDataService } from '@/lib/services/authenticInvestigationDataService'

useEffect(() => {
  async function loadScenario() {
    const service = getAuthenticInvestigationDataService()

    // Use pre-generated scenario
    const demoData = await service.scenarioToDemo(SCENARIO_DIGITAL_SHADOW)
    setDemoData(demoData)
  }
  loadScenario()
}, [])
```

## Real-World Data Sources

### Available Assets

1. **Overture Maps PMTiles** (142MB)
   - File: `public/tiles/places-global.pmtiles`
   - API: `/api/tiles/places/{z}/{x}/{y}.pbf`
   - Contains: Real POI data (restaurants, offices, landmarks)

2. **Valhalla Routing**
   - Service: `lib/services/valhallaRoutingService.ts`
   - Provides: Real street-level routes
   - Accuracy: Actual NYC road network

3. **Vultr LLM**
   - Model: llama2-13b-chat-Q5_K_M
   - Purpose: Scenario narrative generation
   - Configuration: `lib/services/vultrLLMService.ts`

### External Data Sources (Future)

**Not Currently Implemented** - Reference for future enhancement:

- NYC Open Data Portal: Crime statistics, mobility patterns
- Overture Maps GeoJSON: Additional POI enrichment
- Kaggle Datasets: Synthetic movement patterns
- DeepFabric: LLM-powered synthetic data generation (requires Python)

## Performance Considerations

### Route Generation

**Bottleneck**: Valhalla API calls for each route segment

**Optimization**:
- Pre-generate scenarios with routes
- Cache route results
- Use fallback timing if routing fails

### LLM Generation

**Bottleneck**: Vultr API latency (2-5 seconds per scenario)

**Optimization**:
- Use pre-generated scenarios for production
- Generate scenarios in background
- Implement fallback scenarios

### Best Practice

```typescript
// RECOMMENDED: Pre-generated scenario (instant load)
const data = await service.scenarioToDemo(SCENARIO_DIGITAL_SHADOW)

// SLOWER: AI-generated scenario (2-5 second delay)
const scenario = await service.generateScenario('tech_worker')
const data = await service.scenarioToDemo(scenario)
```

## Testing

### Verify Scenario Quality

```typescript
import { SCENARIO_DIGITAL_SHADOW } from '@/lib/demo/investigation-scenarios'

// Check location count
console.log(SCENARIO_DIGITAL_SHADOW.locations.length) // Should be 10+

// Verify NYC bounds
SCENARIO_DIGITAL_SHADOW.locations.forEach(loc => {
  if (loc.lat < 40.4774 || loc.lat > 40.9176) {
    console.error('Location outside NYC bounds:', loc.name)
  }
})

// Verify temporal coherence
let currentDay = 1
SCENARIO_DIGITAL_SHADOW.locations.forEach(loc => {
  if (loc.day < currentDay) {
    console.error('Time travel detected:', loc.name)
  }
  currentDay = loc.day
})
```

### Verify Route Generation

```typescript
const service = getAuthenticInvestigationDataService()
const demoData = await service.scenarioToDemo(SCENARIO_DIGITAL_SHADOW)

// Check route segments generated
console.log('Route segments:', demoData.routeSegments.length)
console.log('Tracking points:', demoData.trackingPoints.length)

// Verify all routes have paths
demoData.routeSegments.forEach(route => {
  if (!route.path || route.path.length === 0) {
    console.error('Route missing path:', route.id)
  }
})
```

## Troubleshooting

### "No NYC POIs found"

**Cause**: NDJSON file contains wrong dataset

**Solution**: Use PMTiles API endpoint or pre-generated scenarios

### "VULTR_API_KEY is not set"

**Cause**: Missing environment variable

**Solution**:
```bash
# Add to .env.local
VULTR_API_KEY=your_api_key_here
```

### "Valhalla routing failed"

**Cause**: Routing service not running or unreachable

**Solution**:
```bash
# Start Valhalla service (if self-hosted)
docker-compose up valhalla

# Or use fallback timing
# Service automatically falls back to 30-minute estimates
```

### "LLM generated invalid JSON"

**Cause**: LLM output not properly structured

**Solution**: Service automatically uses fallback scenario

```typescript
try {
  const scenario = await service.generateScenario('tech_worker')
} catch (error) {
  // Service returns getFallbackScenario() automatically
  console.log('Using fallback scenario due to LLM error')
}
```

## Security Considerations

### Legal Disclaimer

All investigation scenarios include legal authorization:

```typescript
legalAuthorization: 'Federal Warrant (SDNY)'
```

**Important**: This is demonstration software. Real-world use requires:
- Proper legal authorization
- Law enforcement credentials
- Compliance with privacy laws

### Data Privacy

- No real person data used
- All scenarios are fictional
- Subject IDs are randomized
- Coordinates point to public places only

## Future Enhancements

### Planned Features

1. **Multi-scenario selection UI**
   - Dropdown to choose scenario
   - Preview scenario narrative before loading
   - Scenario comparison mode

2. **Scenario builder tool**
   - Visual editor for creating scenarios
   - Map-based location selection
   - Auto-validation of temporal coherence

3. **Real data integration**
   - NYC Open Data crime patterns
   - Actual anonymized mobility data
   - Statistical modeling for realistic patterns

4. **Advanced AI generation**
   - Multi-agent scenarios
   - Network analysis (multiple subjects)
   - Predictive pattern detection

### Contributing Scenarios

To contribute a new pre-generated scenario:

1. Create scenario following format guidelines
2. Verify all locations are real NYC places
3. Ensure narrative coherence
4. Test with Investigation Mode
5. Submit PR with scenario added to `investigation-scenarios.ts`

## Example: Operation Digital Shadow

See full implementation in `lib/demo/investigation-scenarios.ts:41`

**Key Features**:
- 11 real NYC locations (Hell's Kitchen, Chelsea, Brooklyn Navy Yard)
- 72-hour narrative arc with clear routine → anomaly progression
- Detailed subject profile (32-year-old software engineer)
- 6 key findings with emoji indicators
- Contextual notes explaining investigative significance
- Critical 2:47 AM warehouse meeting as climax

**Usage**:
```typescript
import { SCENARIO_DIGITAL_SHADOW } from '@/lib/demo/investigation-scenarios'
import { getAuthenticInvestigationDataService } from '@/lib/services/authenticInvestigationDataService'

const service = getAuthenticInvestigationDataService()
const demoData = await service.scenarioToDemo(SCENARIO_DIGITAL_SHADOW)
// Ready to use in InvestigationMode component
```

## Summary

The investigation data authenticity system provides:

✅ Real NYC locations with accurate coordinates
✅ Story-driven narratives with coherent progression
✅ Subject profiles and key findings
✅ Valhalla-based real street routing
✅ Pre-generated scenarios for instant load
✅ AI-powered scenario generation for customization
✅ Temporal authenticity (realistic timing and business hours)

This ensures the investigation demo presents authentic, believable surveillance scenarios rather than "random data floating around the map."
