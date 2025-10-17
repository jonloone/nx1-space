# Valhalla Routing Engine Integration

## Overview

Valhalla is a self-hosted open-source routing engine that provides advanced geospatial routing capabilities. This integration replaces the Mapbox Directions API with Valhalla for cost savings, offline capability, and enhanced features.

## Why Valhalla?

### Benefits
- ✅ **Cost Savings**: No API rate limits or usage fees
- ✅ **Offline Capability**: Works in air-gapped environments (critical for government/defense)
- ✅ **Enhanced Features**: Isochrones, map matching, time-distance matrices
- ✅ **Full Control**: Customize routing algorithms and parameters
- ✅ **Automatic Fallback**: Falls back to Mapbox if Valhalla unavailable

### Comparison

| Feature | Valhalla | Mapbox Directions API |
|---------|----------|----------------------|
| **Cost** | Free (hosting only) | $4/1000 requests after free tier |
| **Rate Limits** | None | Yes (600/min max) |
| **Offline** | ✅ Yes | ❌ No |
| **Isochrones** | ✅ Yes | ❌ No (separate API) |
| **Map Matching** | ✅ Yes | ❌ No (separate API) |
| **Custom Routing** | ✅ Yes | ❌ Limited |
| **Air-Gap Deploy** | ✅ Yes | ❌ No |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  realisticRouteGenerator.ts                       │  │
│  │  ├─ generateRealisticRoute()                      │  │
│  │  └─ generateMultipleRoutes()                      │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │  valhallaRoutingService.ts                        │  │
│  │  ├─ generateRoute() ──────► isValhallaAvailable?  │  │
│  │  ├─ generateIsochrone()           │               │  │
│  │  ├─ mapMatch()                    ▼               │  │
│  │  └─ getServiceHealth()    ┌──────────────┐       │  │
│  │                            │ Valhalla?    │       │  │
│  │                            └──────┬───────┘       │  │
│  │                                   │               │  │
│  │                          Yes ─────┼───── No      │  │
│  │                            │              │       │  │
│  │                            ▼              ▼       │  │
│  │                    ┌───────────┐  ┌──────────┐  │  │
│  │                    │ Valhalla  │  │  Mapbox  │  │  │
│  │                    │  Service  │  │   API    │  │  │
│  │                    └───────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Docker Services  │
                    │  ┌──────────────┐ │
                    │  │  Valhalla    │ │
                    │  │  Container   │ │
                    │  │  Port: 8002  │ │
                    │  └──────────────┘ │
                    │  ┌──────────────┐ │
                    │  │ OSM Routing  │ │
                    │  │    Tiles     │ │
                    │  │ (NYC region) │ │
                    │  └──────────────┘ │
                    └──────────────────┘
```

## Setup

### 1. Docker Compose Configuration

Valhalla is configured in `docker-compose.yml`:

```yaml
valhalla:
  image: valhalla/valhalla:latest
  container_name: valhalla-routing-engine
  ports:
    - "8002:8002"
  environment:
    - tile_urls=https://download.geofabrik.de/north-america/us/new-york-latest.osm.pbf
    - use_tiles_ignore_pbf=False
    - build_tar=False
  volumes:
    - ./valhalla_tiles:/custom_files
  networks:
    - app-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8002/status"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 120s
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# Valhalla Configuration
VALHALLA_URL=http://localhost:8002
NEXT_PUBLIC_VALHALLA_URL=http://localhost:8002
```

For production (Docker):
```bash
VALHALLA_URL=http://valhalla:8002
```

### 3. Start Services

```bash
# Start all services (includes Valhalla)
docker-compose up -d

# Check Valhalla health
curl http://localhost:8002/status

# View logs
docker logs valhalla-routing-engine -f
```

### 4. First-Time Setup

On first start, Valhalla will:
1. Download NYC OSM data (~200 MB)
2. Build routing tiles (~5-10 minutes)
3. Start routing service

**Important**: Wait for tile building to complete before using routing features.

## Usage

### Basic Routing

```typescript
import { generateRoute } from '@/lib/services/valhallaRoutingService'

// Generate a route (automatically uses Valhalla or falls back to Mapbox)
const route = await generateRoute(
  [-73.9851, 40.7589], // Times Square [lng, lat]
  [-73.9712, 40.7661], // Hell's Kitchen [lng, lat]
  'driving',
  new Date()
)

console.log(`Distance: ${route.distance}m`)
console.log(`Duration: ${route.duration}s`)
console.log(`Path: ${route.path.length} coordinates`)
```

### Isochrone Generation

Isochrones show reachability zones (not available with Mapbox):

```typescript
import { generateIsochrone } from '@/lib/services/valhallaRoutingService'

const isochrones = await generateIsochrone({
  center: [-73.9851, 40.7589], // [lng, lat]
  mode: 'driving',
  contours: [15, 30, 45], // Minutes
  polygons: true,
  denoise: 0.5
})

// isochrones = [
//   { time: 15, geometry: {...}, color: '#10B981' },
//   { time: 30, geometry: {...}, color: '#F59E0B' },
//   { time: 45, geometry: {...}, color: '#EF4444' }
// ]
```

### Map Matching

Clean noisy GPS tracks to actual roads:

```typescript
import { mapMatch } from '@/lib/services/valhallaRoutingService'

const matched = await mapMatch({
  coordinates: noisyGPSPoints, // [[lng, lat], ...]
  timestamps: timestamps,
  mode: 'driving',
  accuracy: accuracyValues
})

console.log(`Confidence: ${matched.confidence_score}`)
console.log(`Matched points: ${matched.matched_points.length}`)
```

### React Components

#### Isochrone Layer (DeckGL)

```typescript
import { useIsochroneLayers } from '@/lib/layers/IsochroneLayer'

function MyMap() {
  const { layers, loading, error } = useIsochroneLayers({
    center: stationCoordinates,
    mode: 'driving',
    contours: [15, 30, 45],
    visible: true,
    opacity: 0.4,
    interactive: true
  })

  return (
    <DeckGL
      layers={[...otherLayers, ...layers]}
      // ... other props
    />
  )
}
```

#### Isochrone Control Panel

```typescript
import IsochroneControl from '@/components/opintel/panels/IsochroneControl'

function Sidebar() {
  const [visible, setVisible] = useState(true)
  const [mode, setMode] = useState<TransportMode>('driving')
  const [contours, setContours] = useState([15, 30, 45])
  const [opacity, setOpacity] = useState(0.4)

  return (
    <IsochroneControl
      visible={visible}
      mode={mode}
      contours={contours}
      opacity={opacity}
      onVisibilityChange={setVisible}
      onModeChange={setMode}
      onContoursChange={setContours}
      onOpacityChange={setOpacity}
      centerPoint={selectedStation}
    />
  )
}
```

## Use Cases

### 1. Investigation Intelligence (Implemented)

**File**: `lib/demo/investigation-demo-data-realistic.ts`

```typescript
// Automatically uses Valhalla for route generation
const data = await generateOperationNightfallDataRealistic()
```

Routes now follow actual NYC streets instead of straight lines.

### 2. Ground Station Accessibility Analysis

Show reachability zones from ground stations:

```typescript
const { layers } = useIsochroneLayers({
  center: groundStationCoordinates,
  mode: 'driving',
  contours: [30, 60, 90], // 30min, 1hr, 1.5hr drive zones
  visible: true
})
```

**Benefits**:
- Identify underserved regions
- Optimize station placement
- Analyze coverage gaps
- Plan emergency response

### 3. Infrastructure Planning

Calculate travel times between facilities:

```typescript
import { generateMultipleRoutes } from '@/lib/services/valhallaRoutingService'

const routes = await generateMultipleRoutes(
  stations.flatMap(from =>
    stations.map(to => ({
      from: from.coordinates,
      to: to.coordinates,
      mode: 'driving',
      startTime: new Date()
    }))
  )
)

// Build time-distance matrix
const matrix = buildMatrix(routes)
```

### 4. Fleet Operations

Optimize inspection routes:

```typescript
// Get realistic routes for fleet simulation
const fleetRoutes = await generateMultipleRoutes(
  waypoints.map((wp, i) => ({
    from: waypoints[i].coordinates,
    to: waypoints[i + 1]?.coordinates || waypoints[0].coordinates,
    mode: 'driving',
    startTime: wp.departureTime
  }))
)
```

## Feature Flags

Valhalla routing is controlled via environment configuration:

```typescript
import { config } from '@/lib/config/environment'

// Check if Valhalla is enabled
if (config.features.enableValhallaRouting) {
  // Use Valhalla routing
}

// Check service health
const health = await getServiceHealth()
console.log(health.preferredService) // 'valhalla' or 'mapbox'
```

### Configuration

**Development** (`enableValhallaRouting: true`)
- Uses Valhalla if available
- Falls back to Mapbox automatically

**Production** (`enableValhallaRouting: true`)
- Uses Valhalla in production
- Critical for air-gapped deployments

**Testing** (`enableValhallaRouting: false`)
- Disabled in test environment
- Uses Mapbox fallback

## API Reference

### `generateRoute(from, to, mode, startTime)`

Generate a route between two points.

**Parameters**:
- `from: [number, number]` - Origin [lng, lat]
- `to: [number, number]` - Destination [lng, lat]
- `mode: TransportMode` - 'driving' | 'walking' | 'cycling'
- `startTime: Date` - Route start time

**Returns**: `Promise<Route>`
- `path: [number, number][]` - Coordinates along route
- `distance: number` - Distance in meters
- `duration: number` - Duration in seconds
- `waypoints: RoutePoint[]` - Detailed tracking points

### `generateIsochrone(options)`

Generate isochrone reachability zones.

**Parameters**:
- `center: [number, number]` - Center point [lng, lat]
- `mode: TransportMode` - Transport mode
- `contours: number[]` - Time thresholds in minutes
- `polygons: boolean` - Return polygons (default: true)
- `denoise: number` - Simplification (0-1)

**Returns**: `Promise<IsochroneContour[]>`

### `mapMatch(options)`

Clean noisy GPS tracks to roads.

**Parameters**:
- `coordinates: [number, number][]` - GPS points
- `timestamps: Date[]` - Optional timestamps
- `mode: TransportMode` - Transport mode
- `accuracy: number[]` - GPS accuracy per point

**Returns**: `Promise<MapMatchResult>`

### `getServiceHealth()`

Check service availability.

**Returns**: `Promise<{ valhalla: boolean, mapbox: boolean, preferredService: 'valhalla' | 'mapbox' }>`

## Deployment

### Development

```bash
# Start local Valhalla
docker-compose up -d valhalla

# Check status
curl http://localhost:8002/status

# Use in development
npm run dev
```

### Production

```bash
# Build and deploy
docker-compose up -d --build

# Verify routing works
curl -X POST http://localhost:8002/route \
  -H "Content-Type: application/json" \
  -d '{"locations":[{"lat":40.7589,"lon":-73.9851},{"lat":40.7661,"lon":-73.9712}],"costing":"auto"}'
```

### Air-Gapped Deployment

For government/defense customers:

1. **Download OSM data offline**:
```bash
wget https://download.geofabrik.de/north-america/us/new-york-latest.osm.pbf
```

2. **Build tiles offline**:
```bash
docker run -v $(pwd)/valhalla_tiles:/custom_files \
  valhalla/valhalla:latest \
  valhalla_build_tiles -c /custom_files/valhalla.json /custom_files/new-york-latest.osm.pbf
```

3. **Deploy with pre-built tiles**:
```yaml
valhalla:
  image: valhalla/valhalla:latest
  volumes:
    - ./valhalla_tiles:/custom_files
  environment:
    - use_tiles_ignore_pbf=True  # Use existing tiles
```

## Monitoring

### Health Checks

```bash
# Service status
curl http://localhost:8002/status

# Docker health
docker ps | grep valhalla

# Logs
docker logs valhalla-routing-engine --tail 100 -f
```

### Performance Metrics

```typescript
import { getServiceHealth } from '@/lib/services/valhallaRoutingService'

const health = await getServiceHealth()
console.log('Routing Service:', health.preferredService)
console.log('Valhalla Available:', health.valhalla)
console.log('Mapbox Available:', health.mapbox)
```

## Troubleshooting

### Valhalla Not Starting

**Problem**: Container exits immediately

**Solution**: Check logs and ensure enough memory
```bash
docker logs valhalla-routing-engine
# Valhalla needs ~2GB RAM for NYC tiles
```

### Routes Failing

**Problem**: All routes fail

**Solution**: Check service availability
```bash
curl http://localhost:8002/status
# Should return {"available":true}
```

### Tile Building Slow

**Problem**: First start takes 10+ minutes

**Solution**: This is normal. Valhalla is building routing tiles from OSM data. Wait for completion.

```bash
# Monitor progress
docker logs valhalla-routing-engine -f | grep "Building tiles"
```

### Port Conflicts

**Problem**: Port 8002 already in use

**Solution**: Change port in docker-compose.yml
```yaml
ports:
  - "8003:8002"  # Use different external port
```

## Cost Savings Analysis

### Before Valhalla (Mapbox only)
- Investigation demo: ~25 API calls per generation
- 1000 demos/month = 25,000 calls
- Cost: $100/month (after free tier)

### After Valhalla
- Valhalla calls: Unlimited (free)
- Fallback to Mapbox: Only when Valhalla down (~1%)
- Cost: ~$1/month
- **Savings**: $99/month = $1,188/year

### Scale Impact
At 10,000 demos/month:
- Mapbox only: ~$1,000/month
- Valhalla: ~$10/month (hosting)
- **Savings**: $11,880/year

## Future Enhancements

### Planned Features

1. **Time-Distance Matrices** (bulk analysis)
2. **Tour Optimization** (traveling salesman)
3. **Elevation Profiles** (terrain analysis)
4. **Multi-Region Support** (global routing)
5. **Custom Costing Models** (vehicle-specific)

### Advanced Use Cases

1. **Network Analysis**: Analyze ground station network topology
2. **Predictive Routing**: ML-based traffic prediction
3. **Emergency Response**: Optimize response times
4. **Supply Chain**: Route optimization for logistics

## References

- [Valhalla Documentation](https://valhalla.github.io/valhalla/)
- [Valhalla API Reference](https://valhalla.github.io/valhalla/api/)
- [OpenStreetMap Data](https://download.geofabrik.de/)
- [GeoFabrik Extracts](https://download.geofabrik.de/north-america.html)

## Support

For issues or questions:
1. Check this documentation
2. Review Docker logs: `docker logs valhalla-routing-engine`
3. Test service health: `curl http://localhost:8002/status`
4. Check Mapbox fallback is working
5. Review environment configuration

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-15
**Integration**: Complete with automatic Mapbox fallback
