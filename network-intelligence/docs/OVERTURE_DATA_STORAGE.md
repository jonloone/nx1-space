# Overture Maps Data Storage Architecture

## Overview

This document explains how we store and query Overture Maps data for the network intelligence platform, specifically for investigation scenarios.

## Current Data Storage Approach

### Storage Format: PMTiles (No Traditional Database)

We use **PMTiles** - a cloud-optimized vector tile format that stores geographic data in a single file with efficient random access.

**Key Characteristics**:
- ✅ Self-contained single file (no database server required)
- ✅ Efficient for map visualization
- ✅ HTTP range request support
- ✅ Progressive loading based on zoom level
- ❌ Not optimized for complex queries
- ❌ Read-only (no updates after generation)

### Available Datasets

Currently stored in `/public/tiles/`:

| Dataset | Size | Features | Use Case |
|---------|------|----------|----------|
| **places-global.pmtiles** | 142 MB | 50,000 landmarks | POI markers for investigation scenarios |
| **buildings-usa.pmtiles** | 1.2 GB | Millions of buildings | Building footprints, 3D visualization |
| **addresses-nyc.pmtiles** | 15 MB | 200,000 addresses | Address validation for scenarios |

### Data Not in Database

**Important**: We do NOT use a traditional database (PostgreSQL, MongoDB, etc.) for Overture data.

Instead:
1. **PMTiles files** serve data directly to the frontend
2. **DuckDB** is used temporarily during generation to query Overture Parquet files
3. **No persistent query layer** - data is pre-processed into tiles

## How Data is Queried

### Frontend Querying

```typescript
// lib/services/overturePlacesService.ts

// Query PMTiles via API endpoint
const response = await fetch(
  `/api/tiles/places/${zoom}/${tileX}/${tileY}.pbf`
)

// Tiles are decoded and rendered on map
const features = decodeMVT(response)
```

**Query Pattern**:
- Frontend requests tiles by zoom/x/y coordinates
- Tiles are decoded into GeoJSON features
- Features filtered client-side by category, bounds, etc.

### Generation-Time Querying

```bash
# scripts/generate-addresses-tiles.sh

# DuckDB queries Overture Parquet files from S3
duckdb << EOF
  SELECT id, street, number, postcode
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=addresses/type=address/*')
  WHERE ST_Y(geometry) >= $NYC_MIN_LAT AND ST_Y(geometry) <= $NYC_MAX_LAT
  LIMIT 200000
EOF
```

**Query Pattern**:
- Scripts use DuckDB to query remote Parquet files
- Results exported to CSV, then GeoJSON
- Tippecanoe converts GeoJSON to PMTiles
- PMTiles served to frontend

## Overture Maps Data Sources

### Available Themes

Overture Maps provides 6 data themes (we use 3):

| Theme | Status | Size | What We Have |
|-------|--------|------|--------------|
| **Places** | ✅ Stored | 142 MB | 50,000 major landmarks (airports, hospitals, stadiums) |
| **Buildings** | ✅ Stored | 1.2 GB | USA building footprints |
| **Addresses** | ✅ Stored | 15 MB | 200,000 NYC addresses |
| **Transportation** | ⚠️ Partial | - | Connectors downloaded, segments too large |
| **Base (Land Use)** | ❌ Not stored | - | Industrial zones, parks (script available) |
| **Divisions** | ❌ Not needed | - | Administrative boundaries |

### Why Not All Themes?

**Transportation Segments**:
- Dataset is massive (millions of road segments)
- Query timed out after 10 minutes
- Valhalla routing provides street-level navigation already
- **Alternative**: Use connectors (transit stations) only

**Base Land Use**:
- Not critical for investigation scenarios
- Can be added later if needed
- Script ready: `scripts/generate-landuse-tiles.sh`

**Divisions**:
- Administrative boundaries not needed
- Adds overhead without clear benefit

## Data Generation Pipeline

### Architecture

```
Overture S3 (Parquet)
         ↓
    DuckDB Query
         ↓
    CSV Export
         ↓
  Python → GeoJSON
         ↓
    Tippecanoe
         ↓
     PMTiles
         ↓
  Next.js API (/api/tiles/)
         ↓
Frontend (DeckGL, Mapbox)
```

### Generation Scripts

| Script | Output | Runtime | Status |
|--------|--------|---------|--------|
| `generate-overture-tiles.sh` | places-global.pmtiles (142 MB) | ~5 min | ✅ Complete |
| `generate-buildings-tiles.sh` | buildings-usa.pmtiles (1.2 GB) | ~30 min | ✅ Complete |
| `generate-addresses-tiles.sh` | addresses-nyc.pmtiles (15 MB) | ~3 min | ✅ Complete |
| `generate-transportation-tiles.sh` | - | Timeout | ❌ Too large |
| `generate-landuse-tiles.sh` | - | Not run | ⏸️ Available |

## Database Alternatives (Future Consideration)

### Option 1: PostgreSQL + PostGIS (Traditional GIS)

**Pros**:
- Complex spatial queries (ST_Distance, ST_Intersects)
- ACID transactions
- Mature ecosystem

**Cons**:
- Requires database server
- More infrastructure complexity
- Slower for tile rendering vs PMTiles

**Use Case**: If we need complex spatial analysis (e.g., "find all addresses within 500m of suspicious locations")

### Option 2: DuckDB (Serverless Analytics)

**Pros**:
- Query Parquet files directly
- No server required
- Fast analytics on large datasets

**Cons**:
- Read-only (can't update data)
- Limited spatial functions vs PostGIS

**Use Case**: Already using for data generation, could use for analysis queries

### Option 3: Hybrid (PMTiles + DuckDB)

**Recommended Approach**:
- **PMTiles** for visualization (current approach)
- **DuckDB** for analytics queries on-demand
- **No persistent database** - query Parquet files when needed

**Example**:
```typescript
// For visualization: Use PMTiles
const tiles = await fetch('/api/tiles/places/10/301/384.pbf')

// For analysis: Use DuckDB
const analysis = await duckdb.query(`
  SELECT category, COUNT(*)
  FROM read_parquet('places.parquet')
  WHERE lat >= 40.7 AND lat <= 40.8
  GROUP BY category
`)
```

## Investigation Scenario Integration

### How Scenarios Use Overture Data

**Pre-Generated Scenarios** (lib/demo/investigation-scenarios.ts):
- Uses hand-picked real NYC locations
- Coordinates verified against Google Maps
- Addresses from Overture for validation

**AI-Generated Scenarios** (lib/services/authenticInvestigationDataService.ts):
- Vultr LLM generates scenario with landmark names
- Could query PMTiles to validate locations exist
- **Future**: Query addresses-nyc.pmtiles to autocomplete addresses

### Validation Workflow

```typescript
// Future: Validate scenario locations against Overture
async function validateScenarioLocation(address: string) {
  // Query DuckDB or PMTiles
  const matches = await queryAddresses(address)

  if (matches.length === 0) {
    throw new Error(`Address not found: ${address}`)
  }

  return matches[0] // { lat, lng, postcode, ... }
}
```

## Performance Characteristics

### PMTiles Performance

**Tile Load Time** (at zoom 12):
- First load: 50-150ms (HTTP range request)
- Cached: <10ms (browser cache)
- Tile size: 5-50 KB (gzip compressed)

**Memory Usage**:
- Files stored on disk, not in memory
- Only requested tiles loaded
- LRU cache on frontend

### Query Performance (DuckDB vs Database)

| Operation | DuckDB (Parquet) | PostgreSQL/PostGIS | PMTiles |
|-----------|------------------|-------------------|---------|
| Count features | 2-5s | <1s | N/A |
| Spatial filter | 3-8s | 1-3s | N/A |
| Nearest neighbor | 5-15s | <1s | N/A |
| Render tiles | N/A | 50-200ms | 20-100ms |

**Verdict**: PMTiles is fastest for tile rendering, database best for complex queries

## Storage Recommendations

### Current Approach (Recommended)

✅ **Keep PMTiles** for visualization
- Fast tile serving
- No database overhead
- Works offline

### When to Add Database

Consider adding PostgreSQL + PostGIS if you need:

1. **Complex Spatial Queries**:
   - "Find all addresses within X meters of location Y"
   - "Count POIs by neighborhood polygon"
   - Spatial joins across datasets

2. **Dynamic Data**:
   - User-generated investigation locations
   - Real-time tracking data
   - Editable scenario locations

3. **Advanced Analytics**:
   - Heatmap aggregations
   - Clustering algorithms
   - Statistical analysis

### Hybrid Recommendation

**Best of Both Worlds**:

```typescript
// For map display: PMTiles (fast, efficient)
<DeckGL layers={pmtilesLayers} />

// For analytics: DuckDB on-demand
const stats = await analyzeWithDuckDB(bounds)

// For user data: PostgreSQL (if needed later)
await db.investigation.create({ ... })
```

## Data Update Strategy

### Overture Data Updates

Overture Maps releases monthly updates: `2025-09-24.0`, `2025-10-24.0`, etc.

**Update Process**:
1. Modify script to point to new release
2. Re-run generation scripts
3. Replace PMTiles files
4. Restart Next.js server

**Example**:
```bash
# Update release version in script
vim scripts/generate-addresses-tiles.sh
# Change: s3://.../2025-09-24.0/... → s3://.../2025-10-24.0/...

# Re-generate
./scripts/generate-addresses-tiles.sh

# New file overwrites old one
# addresses-nyc.pmtiles updated automatically
```

### Automation (Future)

```bash
# Cron job to check for new releases
0 0 1 * * /scripts/update-overture-data.sh

# Script checks for new release and regenerates if available
```

## API Endpoints

### Current Endpoints

```typescript
// Serve PMTiles
GET /api/tiles/places/{z}/{x}/{y}.pbf
GET /api/tiles/buildings/{z}/{x}/{y}.pbf
GET /api/tiles/addresses/{z}/{x}/{y}.pbf

// Future: Query endpoints
GET /api/query/addresses?street=Broadway&number=123
GET /api/query/places?category=restaurant&bounds=...
```

### Example Usage

```typescript
// Frontend code
import { PMTilesSource } from '@/lib/utils/pmtilesFileSource'

const placesSource = new PMTilesSource('/tiles/places-global.pmtiles')

// Query specific tile
const tile = await placesSource.getTile(10, 301, 384)

// Or use via API
const response = await fetch('/api/tiles/places/10/301/384.pbf')
const features = decodePBF(response)
```

## Security Considerations

### Data Access

**PMTiles**:
- Public files (anyone can download entire dataset)
- No authentication required
- Suitable for public data only

**If Using Database**:
- Implement authentication
- Row-level security for sensitive data
- Audit logging

### Investigation Data

**Important**: Investigation scenarios use fictional data
- No real person tracking
- Locations are public places only
- Subject IDs randomized

## Summary

### Current Architecture

✅ **PMTiles-Based**:
- No traditional database
- Efficient map tile serving
- Simple infrastructure
- Read-only data

### Data We Have

- ✅ Places (142 MB): 50,000 landmarks
- ✅ Buildings (1.2 GB): USA footprints
- ✅ Addresses (15 MB): 200,000 NYC addresses

### What We Don't Have (Yet)

- ❌ Transportation segments (too large)
- ❌ Land use (not critical)
- ❌ Persistent query database

### When to Add Database

**Add PostgreSQL/PostGIS when**:
- Need complex spatial queries
- Storing user-generated data
- Require real-time updates
- Building analytics features

**Until then**: PMTiles + DuckDB is sufficient

## Next Steps

1. **Immediate**: Use existing PMTiles for investigation scenarios
2. **Short-term**: Integrate addresses for scenario validation
3. **Medium-term**: Add DuckDB analytics queries if needed
4. **Long-term**: Consider PostgreSQL for user data (not map data)

## References

- PMTiles Spec: https://github.com/protomaps/PMTiles
- Overture Maps: https://docs.overturemaps.org/
- DuckDB Spatial: https://duckdb.org/docs/extensions/spatial
- PostGIS: https://postgis.net/

## Related Documentation

- [Investigation Data Authenticity](./INVESTIGATION_DATA_AUTHENTICITY.md)
- [Overture Maps Setup](./OVERTURE_MAPS_SETUP.md)
- [Overture Layers Guide](./OVERTURE_LAYERS_GUIDE.md)
