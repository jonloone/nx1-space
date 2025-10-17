# LLM-to-Map Integration - Quick Start Guide

**Version**: 1.0
**Last Updated**: 2025-01-17

## What's Been Implemented

### Core Services

1. **Location Resolver** (`lib/services/locationResolver.ts`)
   - Resolves location names to coordinates
   - Supports 20+ known landmarks (Central Park, Times Square, etc.)
   - Falls back to GERS place search
   - Parses natural language queries

2. **Map Action Handler** (`lib/services/mapActionHandler.ts`)
   - Orchestrates map operations
   - Handles search, navigation, and analysis
   - Updates map store automatically
   - Returns user-friendly messages

3. **Enhanced Copilot Adapter** (`lib/adapters/copilotVultrAdapter.ts`)
   - Added 4 new map-specific actions
   - Updated system prompt with map control capabilities
   - Includes category mappings and examples

4. **Updated Provider** (`components/chat/CopilotProvider.tsx`)
   - Enhanced instructions for map control
   - Included available actions and categories

## Supported Queries

### Search Queries
```
"Show me coffee shops near Central Park"
"Find hospitals in downtown Los Angeles"
"Where are the ports near Long Beach?"
"Show warehouses around here"
```

### Navigation Queries
```
"Zoom to Los Angeles"
"Go to Central Park"
"Fly to Times Square"
"Navigate to Port of LA"
```

### Analysis Queries
```
"Analyze downtown LA"
"What's around here?"
"Show me nearby places"
```

## Known Locations

The system knows about:

### NYC Landmarks
- Central Park
- Times Square
- Empire State Building
- Brooklyn Bridge
- Statue of Liberty

### NYC Neighborhoods
- Manhattan
- Brooklyn
- Queens
- Downtown Manhattan
- Midtown Manhattan

### Other Cities
- Los Angeles (and Downtown LA)
- Chicago
- Houston
- Miami
- Seattle
- San Francisco
- Denver
- Washington DC
- Boston
- Atlanta

### Infrastructure (from GERS)
- LAX Airport
- Port of Los Angeles
- Port of Long Beach
- Major hospitals, universities, etc.

## Categories

### Supported Categories
- **Coffee/Cafes**: coffee_shop, cafe
- **Restaurants**: restaurant, fast_food
- **Hospitals**: hospital, emergency_room, clinic
- **Gas Stations**: gas_station, fuel
- **Ports**: port, seaport, marine_terminal
- **Warehouses**: warehouse, logistics_facility, distribution_center
- **Airports**: airport
- **Schools**: school, university, college
- **Emergency**: police_station, fire_station, emergency_room

## How It Works

### Flow Diagram
```
User Query
    ↓
CopilotSidebarWrapper.sendMessage()
    ↓
/api/copilot (POST)
    ↓
CopilotVultrAdapter.processRequest()
    ↓
[LLM detects intent and extracts parameters]
    ↓
CopilotVultrAdapter.executeAction('searchPlaces', params, context)
    ↓
MapActionHandler.handleSearchNearLocation()
    ↓
LocationResolverService.resolveLocation()
    → Coordinates: [-73.9654, 40.7829]
    ↓
GERSDemoService.search({ categories, near, radius })
    → Returns: GERSPlace[]
    ↓
mapStore.flyTo() + mapStore.setVisiblePlaces()
    ↓
Map Updates + LLM Response
    ↓
User sees results on map + chat message
```

## Next Steps for Full Integration

### 1. Wire Actions to /api/copilot Route

The `/api/copilot/route.ts` needs to be updated to actually execute the map actions, not just generate prompts.

**Current behavior**: LLM generates JSON describing what should happen
**Needed behavior**: Actually execute the map actions

**Implementation**:

```typescript
// app/api/copilot/route.ts

import { getCopilotAdapter } from '@/lib/adapters/copilotVultrAdapter'
import { getMapActionHandler } from '@/lib/services/mapActionHandler'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { messages, action, parameters, context } = body

  const adapter = getCopilotAdapter()
  const actionHandler = getMapActionHandler()

  // If action is a map action, execute it directly
  if (action && ['searchPlaces', 'flyToLocation', 'showNearby', 'analyzeArea'].includes(action)) {
    let result

    switch (action) {
      case 'searchPlaces':
        result = await actionHandler.handleSearchNearLocation(
          parameters.location,
          parameters.categories,
          parameters.radius
        )
        break

      case 'flyToLocation':
        result = await actionHandler.handleFlyTo(parameters.location, parameters.zoom)
        break

      case 'showNearby':
        result = await actionHandler.handleSearchInViewport(
          parameters.categories,
          parameters.radius
        )
        break

      case 'analyzeArea':
        result = await actionHandler.handleAnalyzeArea(
          parameters.location,
          parameters.radius
        )
        break
    }

    return NextResponse.json({ result })
  }

  // For chat messages, let LLM decide what action to take
  if (messages && Array.isArray(messages)) {
    const response = await adapter.processRequest(messages)

    // Try to detect if LLM wants to execute a map action
    // This is a simple heuristic - could be improved
    const actionMatch = response.match(/\[Execute (\w+)\((.*?)\)\]/)
    if (actionMatch) {
      const [, actionName, paramsStr] = actionMatch
      // Parse parameters and execute action
      // Then replace the action marker with the result message
    }

    return NextResponse.json({
      id: `msg-${Date.now()}`,
      model: 'llama2-13b-chat-Q5_K_M',
      choices: [{
        message: { role: 'assistant', content: response },
        finish_reason: 'stop'
      }]
    })
  }
}
```

### 2. Add More Landmarks to GERS

Add more NYC places to `gersDemoService.ts`:

```typescript
// Central Park POIs
{
  gersId: 'gers_central_park_zoo',
  name: 'Central Park Zoo',
  categories: ['zoo', 'attraction', 'landmark'],
  levelOfDetail: 'place',
  location: { type: 'Point', coordinates: [-73.9719, 40.7678] }
},
{
  gersId: 'gers_central_park_bethesda',
  name: 'Bethesda Fountain',
  categories: ['landmark', 'attraction'],
  levelOfDetail: 'landmark',
  location: { type: 'Point', coordinates: [-73.9714, 40.7739] }
},

// NYC Coffee Shops (for demo)
{
  gersId: 'gers_starbucks_central_park_south',
  name: 'Starbucks - Central Park South',
  categories: ['coffee_shop', 'cafe'],
  levelOfDetail: 'place',
  location: { type: 'Point', coordinates: [-73.9782, 40.7672] }
}
```

### 3. Client-Side Integration

Currently, map updates happen server-side through the store. For real-time updates, you might want to:

1. **Use WebSockets** for instant map updates
2. **Implement action callbacks** in CopilotSidebarWrapper
3. **Add loading states** during map transitions

Example:

```typescript
// components/chat/CopilotSidebarWrapper.tsx

const handleMapAction = async (action: string, params: any) => {
  setIsMapUpdating(true)

  try {
    const response = await fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, parameters: params, context: {} })
    })

    const result = await response.json()

    // Show visual feedback
    if (result.result.success) {
      toast.success(result.result.message)
    } else {
      toast.error(result.result.message)
    }
  } finally {
    setIsMapUpdating(false)
  }
}
```

### 4. Add Geocoding Fallback

For locations not in the known list, integrate a geocoding service:

```typescript
// lib/services/locationResolver.ts

async resolveLocation(locationName: string): Promise<ResolvedLocation | null> {
  // ... existing checks ...

  // 4. Fallback to Mapbox Geocoding API
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    const geocoded = await this.geocodeWithMapbox(locationName)
    if (geocoded) {
      return geocoded
    }
  }

  return null
}

private async geocodeWithMapbox(query: string): Promise<ResolvedLocation | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.features && data.features.length > 0) {
    const feature = data.features[0]
    return {
      name: feature.place_name,
      coordinates: feature.center as [number, number],
      type: this.mapboxTypeToLoD(feature.place_type[0]),
      confidence: 0.7,
      suggestedZoom: 14,
      source: 'geocoding',
      bbox: feature.bbox
    }
  }

  return null
}
```

## Testing

### Manual Testing Queries

Try these in the chat interface:

1. **Basic Search**
   ```
   Show me hospitals near Los Angeles
   ```
   Expected: Map flies to LA, shows hospitals within 5km

2. **Navigation**
   ```
   Zoom to Central Park
   ```
   Expected: Map flies to Central Park at zoom level 15

3. **Nearby Search**
   ```
   What's around here?
   ```
   Expected: Shows all places in current viewport

4. **Analysis**
   ```
   Analyze downtown LA
   ```
   Expected: Shows all facilities within 10km, breaks down by type

### Unit Tests

Create `lib/services/locationResolver.test.ts`:

```typescript
import { getLocationResolverService } from './locationResolver'

describe('LocationResolverService', () => {
  const service = getLocationResolverService()

  test('resolves known landmark', async () => {
    const result = await service.resolveLocation('Central Park')
    expect(result).toBeTruthy()
    expect(result?.name).toBe('Central Park')
    expect(result?.coordinates).toEqual([-73.9654, 40.7829])
  })

  test('parses natural language query', () => {
    const parsed = service.parseQuery('Show me coffee shops near Central Park')
    expect(parsed.location).toBe('Central Park')
    expect(parsed.categories).toContain('coffee_shop')
  })

  test('resolves category aliases', () => {
    const categories = service.resolveCategory('coffee shop')
    expect(categories).toContain('coffee_shop')
    expect(categories).toContain('cafe')
  })
})
```

## Troubleshooting

### Issue: "Location not found"

**Cause**: Location not in known locations or GERS data

**Solution**:
1. Add location to `KNOWN_LOCATIONS` map in `locationResolver.ts`
2. Add to GERS demo data in `gersDemoService.ts`
3. Implement geocoding fallback (see above)

### Issue: "No places found"

**Cause**: No data for that category in that area

**Solution**:
1. Check available categories in GERS data
2. Expand search radius
3. Try different category keywords

### Issue: "Map doesn't update"

**Cause**: Map store not connected properly

**Solution**:
1. Check that mapStore is initialized
2. Verify flyTo and setVisiblePlaces are called
3. Check browser console for errors

## Performance Considerations

### Caching

The LocationResolverService should cache resolved locations:

```typescript
private locationCache = new Map<string, ResolvedLocation>()

async resolveLocation(locationName: string): Promise<ResolvedLocation | null> {
  const cached = this.locationCache.get(locationName.toLowerCase())
  if (cached) return cached

  const resolved = await this.doResolveLocation(locationName)
  if (resolved) {
    this.locationCache.set(locationName.toLowerCase(), resolved)
  }
  return resolved
}
```

### Rate Limiting

If using geocoding APIs, implement rate limiting:

```typescript
private lastGeocodeTime = 0
private readonly GEOCODE_RATE_LIMIT = 100 // ms between calls

private async geocodeWithRateLimit(query: string) {
  const now = Date.now()
  const timeSinceLastCall = now - this.lastGeocodeTime

  if (timeSinceLastCall < this.GEOCODE_RATE_LIMIT) {
    await new Promise(resolve =>
      setTimeout(resolve, this.GEOCODE_RATE_LIMIT - timeSinceLastCall)
    )
  }

  this.lastGeocodeTime = Date.now()
  return this.geocodeWithMapbox(query)
}
```

## Future Enhancements

1. **Multi-location queries**: "Compare hospitals in LA and NYC"
2. **Route planning**: "Show me a route from A to B"
3. **Temporal queries**: "What's open now?"
4. **Advanced filters**: "Show 5-star restaurants under $50"
5. **Conversational context**: "Show more like that"

## References

- Architecture Doc: `/docs/LLM_MAP_INTEGRATION_ARCHITECTURE.md`
- Location Resolver: `/lib/services/locationResolver.ts`
- Map Action Handler: `/lib/services/mapActionHandler.ts`
- Copilot Adapter: `/lib/adapters/copilotVultrAdapter.ts`
