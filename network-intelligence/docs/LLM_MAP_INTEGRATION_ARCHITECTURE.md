# LLM-to-Map Integration Architecture

**Version**: 1.0
**Date**: 2025-01-17
**Status**: Design Document

## Overview

This document describes the architecture for integrating LLM responses with map view changes, enabling natural language commands like "Show me coffee shops near Central Park" to trigger map actions.

## Problem Statement

Users should be able to interact with the map using natural language. When they ask questions like:
- "Show me coffee shops near Central Park"
- "Find hospitals in downtown Los Angeles"
- "Zoom to the Port of Long Beach"
- "What's around this area?"

The LLM should:
1. Parse the user intent
2. Extract location and query parameters
3. Trigger appropriate map actions
4. Display relevant data on the map
5. Respond with contextual information

## Current Architecture

### Data Sources

1. **GERS Demo Service** (`lib/services/gersDemoService.ts`)
   - Demo places for Maritime, Logistics, Defense scenarios
   - Categories: ports, warehouses, hospitals, gas stations, etc.
   - Search capabilities: by category, proximity, scenario, text
   - Coverage: Major US cities (LA, NYC, Houston, etc.)

2. **Overture Places Service** (`lib/services/overturePlacesService.ts`)
   - Global POI data from Overture Maps
   - Categories: airports, hospitals, schools, cultural venues, etc.
   - PMTiles-based with IndexedDB caching
   - Vector tile rendering on map

### State Management

**Map Store** (`lib/stores/mapStore.ts`)
```typescript
interface MapStore {
  // Viewport control
  flyTo(longitude: number, latitude: number, zoom?: number): void
  setViewport(viewport: Partial<MapViewport>): void
  setViewportBounds(bounds: ViewportBounds): void

  // Place management
  visiblePlaces: GERSPlace[]
  setVisiblePlaces(places: GERSPlace[]): void
  searchPlaces(query: string): GERSPlace[]

  // Feature selection
  selectFeature(feature: SelectedFeature | null): void

  // Context for LLM
  getViewportContext(): {
    bounds?: [number, number, number, number] // [west, south, east, north]
    center?: [number, number]
    zoom?: number
  }
}
```

### LLM Integration

**Copilot Vultr Adapter** (`lib/adapters/copilotVultrAdapter.ts`)
```typescript
interface CopilotVultrAdapter {
  processRequest(messages: CopilotMessage[]): Promise<string>
  executeAction(actionName: string, parameters: any, context: any): Promise<any>
}
```

**Current Actions** (Ground Station focused):
- `analyzeStation`
- `findOpportunities`
- `compareStations`
- `summarizeData`
- `predictTrends`
- `generateInsights`

## Proposed Architecture

### 1. Intent Detection & Parsing

#### Natural Language Commands

The LLM should detect and extract:

```typescript
interface MapIntent {
  action: 'search' | 'flyTo' | 'show' | 'filter' | 'analyze'
  location?: {
    name: string          // "Central Park", "downtown LA"
    coordinates?: [number, number]
    zoom?: number
  }
  query?: {
    category: string[]    // ["coffee_shop", "restaurant"]
    radius?: number       // meters
    filters?: Record<string, any>
  }
  context?: {
    currentViewport: boolean  // Use current map view
    nearby: boolean          // Search nearby
  }
}
```

#### Example Mappings

| User Query | Parsed Intent |
|------------|---------------|
| "Show me coffee shops near Central Park" | `{ action: 'search', location: { name: 'Central Park', zoom: 15 }, query: { category: ['coffee_shop', 'cafe'] } }` |
| "Find hospitals in downtown Los Angeles" | `{ action: 'search', location: { name: 'downtown Los Angeles' }, query: { category: ['hospital', 'emergency_room'] } }` |
| "Zoom to Port of Long Beach" | `{ action: 'flyTo', location: { name: 'Port of Long Beach', zoom: 14 } }` |
| "What's around here?" | `{ action: 'search', context: { currentViewport: true } }` |

### 2. Location Resolution Service

Create a new service to resolve location names to coordinates:

```typescript
// lib/services/locationResolver.ts

export interface ResolvedLocation {
  name: string
  coordinates: [number, number]
  type: 'city' | 'landmark' | 'place' | 'address'
  confidence: number
  bbox?: [number, number, number, number] // [west, south, east, north]
  suggestedZoom: number
}

export class LocationResolverService {
  /**
   * Resolve location name to coordinates
   * Priority:
   * 1. GERS demo places (known locations)
   * 2. Overture Places cache
   * 3. Geocoding API (future)
   */
  async resolveLocation(locationName: string): Promise<ResolvedLocation | null>

  /**
   * Get suggested zoom level for location type
   */
  getSuggestedZoom(locationType: string): number

  /**
   * Find location by category and proximity
   */
  async findNearby(
    location: [number, number],
    category: string[],
    radius: number
  ): Promise<GERSPlace[]>
}
```

**Known Locations** (from GERS):
- Cities: New York, Los Angeles, Chicago, Houston, etc.
- Landmarks: LAX, Port of LA, Central Park (if added), etc.
- Places: Specific warehouses, hospitals, ports

**Zoom Levels**:
- `landmark`: 17 (very close)
- `place`: 15 (building level)
- `city`: 12 (city overview)
- `state`: 7 (state overview)
- `country`: 5 (country overview)

### 3. Map Action Handler

Create a centralized action handler:

```typescript
// lib/services/mapActionHandler.ts

export interface MapAction {
  type: 'flyTo' | 'search' | 'highlight' | 'filter' | 'layer'
  payload: any
}

export class MapActionHandler {
  constructor(
    private mapStore: MapStore,
    private gersService: GERSDemoService,
    private overtureService: OverturePlacesService,
    private locationResolver: LocationResolverService
  )

  /**
   * Execute map action from LLM intent
   */
  async executeMapAction(intent: MapIntent): Promise<ActionResult>

  /**
   * Handle "Show me X near Y" queries
   */
  private async handleSearchNearLocation(
    locationName: string,
    categories: string[],
    radius: number
  ): Promise<ActionResult>

  /**
   * Handle "Zoom to X" queries
   */
  private async handleFlyTo(locationName: string): Promise<ActionResult>

  /**
   * Handle "What's around here?" queries
   */
  private async handleSearchInViewport(
    categories?: string[]
  ): Promise<ActionResult>
}

export interface ActionResult {
  success: boolean
  action: string
  data?: {
    location?: ResolvedLocation
    places?: GERSPlace[]
    viewport?: MapViewport
  }
  message: string  // User-friendly message
}
```

### 4. CopilotKit Action Integration

Extend `copilotVultrAdapter.ts` with new map-specific actions:

```typescript
// Add to executeAction() switch statement

case 'searchPlaces':
  return await this.handleSearchPlaces(parameters, context)

case 'flyToLocation':
  return await this.handleFlyToLocation(parameters, context)

case 'showNearby':
  return await this.handleShowNearby(parameters, context)

case 'analyzeArea':
  return await this.handleAnalyzeArea(parameters, context)
```

**Action Definitions**:

```typescript
private async handleSearchPlaces(parameters: any, context: any) {
  const { query, location, category, radius } = parameters

  // 1. Resolve location if provided
  const resolvedLocation = location
    ? await locationResolver.resolveLocation(location)
    : null

  // 2. Execute search
  const places = await gersService.search({
    text: query,
    categories: category,
    near: resolvedLocation?.coordinates,
    radius: radius || 5000
  })

  // 3. Update map
  mapStore.setVisiblePlaces(places)
  if (resolvedLocation) {
    mapStore.flyTo(
      resolvedLocation.coordinates[0],
      resolvedLocation.coordinates[1],
      resolvedLocation.suggestedZoom
    )
  }

  // 4. Return result
  return {
    success: true,
    places: places.length,
    location: resolvedLocation?.name,
    summary: `Found ${places.length} places near ${resolvedLocation?.name}`
  }
}
```

### 5. Response Flow

```
User: "Show me coffee shops near Central Park"
  ↓
CopilotSidebarWrapper.handleSubmit()
  ↓
useCopilotChat().sendMessage()
  ↓
/api/copilot POST
  ↓
CopilotVultrAdapter.processRequest()
  ↓
[LLM Intent Detection]
  → Detects: action=search, location="Central Park", category=["coffee_shop"]
  ↓
CopilotVultrAdapter.executeAction('searchPlaces', params, context)
  ↓
MapActionHandler.executeMapAction()
  ↓
LocationResolverService.resolveLocation("Central Park")
  → Returns: { coordinates: [-73.9654, 40.7829], zoom: 15 }
  ↓
GERSDemoService.search({
  categories: ['coffee_shop', 'cafe'],
  near: [-73.9654, 40.7829],
  radius: 5000
})
  → Returns: GERSPlace[]
  ↓
mapStore.flyTo(-73.9654, 40.7829, 15)
mapStore.setVisiblePlaces(places)
  ↓
Map animates to Central Park, shows coffee shops
  ↓
LLM Response: "I found 12 coffee shops near Central Park..."
```

### 6. Implementation Plan

#### Phase 1: Location Resolution (Week 1)

**Files to create:**
- `lib/services/locationResolver.ts` - Core location resolution
- `lib/services/locationResolver.test.ts` - Unit tests

**Tasks:**
1. Implement `resolveLocation()` using GERS data
2. Add well-known locations (Central Park, downtown areas, etc.)
3. Implement category-based search
4. Add zoom level suggestions

#### Phase 2: Map Action Handler (Week 1-2)

**Files to create:**
- `lib/services/mapActionHandler.ts` - Action orchestration
- `lib/services/mapActionHandler.test.ts` - Unit tests

**Tasks:**
1. Implement `handleSearchNearLocation()`
2. Implement `handleFlyTo()`
3. Implement `handleSearchInViewport()`
4. Add error handling and fallbacks

#### Phase 3: CopilotKit Integration (Week 2)

**Files to modify:**
- `lib/adapters/copilotVultrAdapter.ts` - Add map actions
- `components/chat/CopilotSidebarWrapper.tsx` - Add action callbacks

**Tasks:**
1. Add new action handlers to `buildActionPrompt()`
2. Implement `handleSearchPlaces()`
3. Implement `handleFlyToLocation()`
4. Update system instructions to include map capabilities

#### Phase 4: Enhanced Intent Detection (Week 3)

**Tasks:**
1. Train LLM to detect map intents from natural language
2. Add few-shot examples to system prompt
3. Implement intent validation
4. Add confidence scoring

#### Phase 5: Testing & Refinement (Week 3-4)

**Tasks:**
1. End-to-end testing with real queries
2. Performance optimization
3. Error handling improvements
4. UI/UX refinements

## Example Implementation

### Location Resolver (Basic)

```typescript
// lib/services/locationResolver.ts

import { getGERSDemoService, type GERSPlace } from './gersDemoService'

export class LocationResolverService {
  private gersService = getGERSDemoService()

  // Known locations with coordinates
  private knownLocations = new Map([
    ['central park', { coordinates: [-73.9654, 40.7829] as [number, number], zoom: 15 }],
    ['downtown los angeles', { coordinates: [-118.2437, 34.0522] as [number, number], zoom: 14 }],
    ['manhattan', { coordinates: [-73.9712, 40.7831] as [number, number], zoom: 13 }],
    ['brooklyn', { coordinates: [-73.9442, 40.6782] as [number, number], zoom: 13 }],
    ['times square', { coordinates: [-73.9855, 40.7580] as [number, number], zoom: 16 }],
  ])

  async resolveLocation(locationName: string): Promise<ResolvedLocation | null> {
    const normalized = locationName.toLowerCase().trim()

    // 1. Check known locations
    const known = this.knownLocations.get(normalized)
    if (known) {
      return {
        name: locationName,
        coordinates: known.coordinates,
        type: 'landmark',
        confidence: 1.0,
        suggestedZoom: known.zoom
      }
    }

    // 2. Search GERS places
    const places = await this.gersService.search({
      text: locationName,
      limit: 1
    })

    if (places.length > 0) {
      const place = places[0]
      return {
        name: place.name,
        coordinates: place.location.coordinates,
        type: place.levelOfDetail,
        confidence: 0.8,
        suggestedZoom: this.getZoomForLoD(place.levelOfDetail)
      }
    }

    return null
  }

  private getZoomForLoD(lod: string): number {
    const zoomMap = {
      'landmark': 17,
      'place': 15,
      'city': 12,
      'state': 7,
      'country': 5
    }
    return zoomMap[lod] || 14
  }
}
```

### Map Action Handler (Basic)

```typescript
// lib/services/mapActionHandler.ts

import { useMapStore } from '../stores/mapStore'
import { getGERSDemoService } from './gersDemoService'
import { LocationResolverService } from './locationResolver'

export class MapActionHandler {
  private locationResolver = new LocationResolverService()

  async handleSearchNearLocation(
    locationName: string,
    categories: string[],
    radius: number = 5000
  ) {
    // 1. Resolve location
    const location = await this.locationResolver.resolveLocation(locationName)

    if (!location) {
      return {
        success: false,
        message: `Could not find location: ${locationName}`
      }
    }

    // 2. Search for places
    const gersService = getGERSDemoService()
    const places = await gersService.search({
      categories,
      near: location.coordinates,
      radius,
      limit: 50
    })

    // 3. Update map
    const mapStore = useMapStore.getState()
    mapStore.flyTo(
      location.coordinates[0],
      location.coordinates[1],
      location.suggestedZoom
    )
    mapStore.setVisiblePlaces(places)

    return {
      success: true,
      action: 'search',
      data: {
        location,
        places,
        count: places.length
      },
      message: `Found ${places.length} places near ${location.name}`
    }
  }
}
```

### Enhanced System Prompt

```typescript
// Add to CopilotProvider.tsx

instructions={`You are an AI assistant for a geospatial intelligence platform.

Your role is to help users:
- Search and discover locations (POIs, buildings, addresses)
- Navigate the map using natural language
- Analyze spatial patterns and relationships
- Calculate routes and isochrones
- Understand map data and features

MAP CONTROL CAPABILITIES:
You can control the map through these actions:

1. searchPlaces - Search for places by category and location
   Example: "Show me coffee shops near Central Park"
   Parameters: { location: string, category: string[], radius: number }

2. flyToLocation - Navigate to a specific location
   Example: "Zoom to Los Angeles"
   Parameters: { location: string, zoom?: number }

3. showNearby - Show places in current viewport
   Example: "What's around here?"
   Parameters: { category?: string[], radius?: number }

AVAILABLE DATA:
- GERS Demo Places: Maritime (ports, fuel docks), Logistics (warehouses, truck stops), Defense (hospitals, emergency services)
- Overture Places: Global POIs (airports, schools, restaurants, cultural venues)
- Cities: New York, Los Angeles, Chicago, Houston, Miami, Seattle, San Francisco, Denver, DC, Boston, Atlanta
- Landmarks: LAX, Port of LA, Port of Long Beach, major hospitals, universities

When responding:
- Parse location names and categories from user queries
- Execute the appropriate map action
- Provide clear feedback about what was found
- Suggest follow-up actions or related queries
- Use markdown formatting for clarity

Example responses:
User: "Show me coffee shops near Central Park"
Assistant: *[Executes searchPlaces action]*
"I found 12 coffee shops within 5km of Central Park. The map has zoomed to the area and marked all locations. Would you like to see restaurants or other amenities nearby?"
`}
```

## Technical Considerations

### 1. Geocoding Fallback

For locations not in GERS or Overture:
- Integrate Mapbox Geocoding API
- Fallback to OpenStreetMap Nominatim (free)
- Cache geocoded results

### 2. Category Mapping

Map natural language to GERS categories:

```typescript
const CATEGORY_ALIASES = {
  'coffee shop': ['coffee_shop', 'cafe'],
  'hospital': ['hospital', 'emergency_room', 'clinic'],
  'restaurant': ['restaurant', 'fast_food', 'cafe'],
  'gas station': ['gas_station', 'fuel'],
  'port': ['port', 'seaport', 'marine_terminal'],
  'warehouse': ['warehouse', 'logistics_facility', 'distribution_center']
}
```

### 3. Error Handling

```typescript
try {
  const result = await mapActionHandler.execute(intent)
} catch (error) {
  if (error instanceof LocationNotFoundError) {
    return "I couldn't find that location. Could you be more specific?"
  }
  if (error instanceof NoCategoriesFoundError) {
    return "I found the location but couldn't find any places matching your criteria."
  }
  // Generic fallback
  return "I encountered an issue. Could you rephrase your request?"
}
```

### 4. Performance

- Cache location resolutions in memory
- Debounce map updates during rapid queries
- Limit visible markers (max 100-200)
- Use clustering for dense results

### 5. Context Awareness

The LLM should be aware of:
- Current map viewport (via `getViewportContext()`)
- Previously selected features
- Recent search history
- Enabled layers

## Success Metrics

1. **Intent Detection Accuracy**: >90% for common queries
2. **Location Resolution Success**: >85% for known locations
3. **Response Time**: <2s from query to map update
4. **User Satisfaction**: Subjective feedback from testing

## Future Enhancements

1. **Multi-modal Responses**
   - Show route from A to B
   - Draw isochrones
   - Highlight regions

2. **Advanced Queries**
   - "Show me the 3 nearest hospitals to downtown LA"
   - "Find warehouses within 10km of Port of Long Beach"
   - "Compare traffic patterns between morning and evening"

3. **Conversational Context**
   - "Show more like this"
   - "Zoom out a bit"
   - "What about New York?"

4. **Proactive Suggestions**
   - "I notice you're looking at ports. Would you like to see nearby fuel docks?"

## References

- GERS Demo Service: `lib/services/gersDemoService.ts`
- Overture Places Service: `lib/services/overturePlacesService.ts`
- Map Store: `lib/stores/mapStore.ts`
- Copilot Vultr Adapter: `lib/adapters/copilotVultrAdapter.ts`
- CopilotKit Docs: https://docs.copilotkit.ai/
