# Overture Maps Integration Guide

## Overview

This project uses **Overture Maps** global places dataset (50M+ places) served via self-hosted PMTiles for:
- Viewport-aware search
- GIS selection tools
- Progressive caching (load what you need, when you need it)

**Storage**: 500 MB - 2 GB (depending on zoom levels)
**Location**: `/public/tiles/places-global.pmtiles`

---

## Quick Start

### 1. Install Dependencies

```bash
# macOS
brew install duckdb tippecanoe

# Ubuntu/Debian
sudo apt-get install duckdb
npm install -g @mapbox/tippecanoe

# Verify
duckdb --version
tippecanoe --version
```

### 2. Generate PMTiles

```bash
# Run the generation script
cd /mnt/blockstorage/nx1-space/network-intelligence
chmod +x scripts/generate-overture-tiles.sh
./scripts/generate-overture-tiles.sh
```

**What it does**:
1. Downloads Overture Places data from S3 (major landmarks only)
2. Filters to high-confidence places (confidence >= 0.7)
3. Generates PMTiles (zoom 6-10) optimized for progressive loading
4. Saves to `/public/tiles/places-global.pmtiles` (~500 MB)

**Time**: ~5-10 minutes (depending on network speed)

### 3. Verify Setup

```bash
# Check file exists
ls -lh public/tiles/places-global.pmtiles

# Should see: ~500M - 1G file

# Restart dev server
npm run dev

# PMTiles will be served at:
# http://localhost:3000/tiles/places-global.pmtiles
```

---

## Architecture

### Progressive Loading Strategy

```
Zoom Level    Data Loaded           Use Case
──────────────────────────────────────────────────
6-8           Countries, states     Global overview
9-10          Major cities          Regional view
11-12         Neighborhoods         City view
13-14         Individual places     Street level
```

**Initial Load** (zoom 6-10): ~500 MB PMTiles
**On-Demand** (zoom 11-14): Cached in IndexedDB as users browse

### Storage Breakdown

```
/public/tiles/
├── places-global.pmtiles    [500 MB]  ← Global zoom 6-10
└── cache/                   [auto]    ← IndexedDB browser cache
    ├── tiles-z11/          [50 MB]
    ├── tiles-z12/          [100 MB]
    ├── tiles-z13/          [200 MB]
    └── tiles-z14/          [400 MB]

Total Server: 500 MB
Total Client Cache: ~750 MB (grows over time)
```

---

## Usage

### In Your Component

```typescript
import { getOverturePlacesService } from '@/lib/services/overturePlacesService'

// Initialize service
const overturePlaces = getOverturePlacesService()
await overturePlaces.initialize()

// Add to map
await overturePlaces.addToMap(map)

// Query visible places (viewport-aware)
const places = overturePlaces.queryVisiblePlaces(map)
console.log(`Found ${places.length} places in viewport`)
```

### Example: Operations Page

```typescript
// app/operations/page.tsx
const [visiblePlaces, setVisiblePlaces] = useState<GERSPlace[]>([])

useEffect(() => {
  if (!map.current || !isLoaded) return

  const overturePlaces = getOverturePlacesService()

  overturePlaces.initialize().then(() => {
    overturePlaces.addToMap(map.current!)

    // Update visible places on map move
    const updatePlaces = () => {
      const places = overturePlaces.queryVisiblePlaces(map.current!)
      setVisiblePlaces(places)
    }

    map.current.on('moveend', updatePlaces)
    updatePlaces()  // Initial load
  })
}, [isLoaded])
```

---

## Categories Included

The PMTiles include major place categories:

**Transportation**:
- Airports, seaports, bus stations, train stations

**Healthcare**:
- Hospitals, clinics, emergency rooms

**Education**:
- Universities, colleges, schools

**Cultural**:
- Museums, libraries, theaters, stadiums

**Government**:
- Embassies, courthouses, city halls

**Recreation**:
- Parks, beaches, national parks, zoos

**Infrastructure**:
- Fire stations, police stations, power plants

**Commercial** (major only):
- Shopping malls, hotels, resorts

---

## Customization

### Generate Different Zoom Levels

```bash
# Higher detail (zoom 6-14, larger file ~2 GB)
tippecanoe -o places-global.pmtiles \
  --maximum-zoom=14 \
  --minimum-zoom=6 \
  places-global.geojson

# Lower detail (zoom 6-8, smaller file ~100 MB)
tippecanoe -o places-global.pmtiles \
  --maximum-zoom=8 \
  --minimum-zoom=6 \
  places-global.geojson
```

### Filter by Category

Edit `scripts/generate-overture-tiles.sh`:

```sql
WHERE categories.primary IN (
  'airport',  -- Add/remove categories
  'hospital',
  'university'
  -- ... your categories
)
```

### Regional Extract

Extract just USA, Europe, etc.:

```sql
WHERE categories.primary IN (...)
  AND bbox.xmin BETWEEN -125 AND -66  -- USA bounding box
  AND bbox.ymin BETWEEN 24 AND 49
```

---

## Troubleshooting

### PMTiles not loading

**Check 1**: File exists
```bash
ls -lh public/tiles/places-global.pmtiles
```

**Check 2**: Next.js headers configured
```typescript
// next.config.ts should have PMTiles headers
source: '/tiles/:path*.pmtiles'
```

**Check 3**: Dev server restarted
```bash
npm run dev
```

### Empty results

**Problem**: No places showing in viewport

**Solution**: Zoom in more (places start appearing at zoom 6+)

```typescript
// Check current zoom
console.log(map.getZoom())  // Should be >= 6

// Force zoom
map.flyTo({ zoom: 10 })
```

### Slow loading

**Problem**: Initial load takes > 5 seconds

**Solutions**:
1. **Reduce zoom range**: Generate zoom 6-8 only (~100 MB)
2. **Add CDN**: Use Cloudflare R2 or CloudFront
3. **Enable compression**: Gzip PMTiles (50% size reduction)

---

## Performance Metrics

**Target Performance**:
- Initial PMTiles load: < 2 seconds
- Viewport query: < 100ms
- Search latency: < 50ms
- Supports: 10,000+ places in viewport

**Actual Performance** (on your hardware):
```typescript
// Measure in browser console
console.time('pmtiles-load')
await overturePlaces.initialize()
console.timeEnd('pmtiles-load')
// Expected: 500-2000ms
```

---

## Next Steps

1. ✅ Generate PMTiles (this guide)
2. ⏳ Implement viewport-aware search
3. ⏳ Add GIS selection tools (Turf.js)
4. ⏳ Enable IndexedDB caching
5. ⏳ Add export features (GeoJSON, CSV)

---

## Resources

- **Overture Maps**: https://overturemaps.org
- **PMTiles Spec**: https://github.com/protomaps/PMTiles
- **DuckDB Spatial**: https://duckdb.org/docs/extensions/spatial
- **Tippecanoe**: https://github.com/mapbox/tippecanoe

---

## Support

Questions? Check:
1. `network-intelligence/lib/services/overturePlacesService.ts`
2. `network-intelligence/scripts/generate-overture-tiles.sh`
3. Browser console logs for errors
