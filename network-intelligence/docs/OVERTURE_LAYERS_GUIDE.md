# Overture Maps Layers Guide

Complete guide to all available Overture Maps data layers and how to integrate them.

---

## Available Themes/Layers

### 1. **Places** ✅ (Already Implemented)
**Data Type:** Points
**Count:** 50+ million globally
**Use Case:** POIs, landmarks, facilities

**Includes:**
- Airports, seaports
- Hospitals, clinics
- Universities, schools
- Museums, theaters
- Hotels, restaurants
- Parks, stadiums

**Status:** ✅ Implemented at `/public/tiles/places-global.pmtiles` (4.6MB)

---

### 2. **Buildings** 🏢
**Data Type:** Polygons
**Count:** 2.3 billion globally
**Use Case:** 3D cityscapes, urban analysis, building density

**Data Fields:**
```typescript
{
  id: string
  name?: string
  class: 'residential' | 'commercial' | 'industrial' | 'public' | 'mixed'
  height: number  // in meters
  num_floors: number
  geometry: Polygon
}
```

**Categories:**
- **Residential**: Houses, apartments, condos
- **Commercial**: Offices, retail, malls
- **Industrial**: Factories, warehouses
- **Public**: Government buildings, schools
- **Mixed**: Multi-use buildings

**Visualization Options:**
- 2D footprints (fill polygons)
- 3D extrusions (height-based)
- Color by building type
- Color by height/floors

**File Size Estimates:**
- USA: ~2-5 GB
- Major cities only: ~500 MB
- Single city: ~50-100 MB

**Script:** `/scripts/generate-buildings-tiles.sh`

---

### 3. **Transportation** 🛣️
**Data Type:** LineStrings + Points
**Use Case:** Road networks, routing, navigation

**Components:**

#### **3a. Segments** (Road lines)
```typescript
{
  id: string
  class: 'motorway' | 'trunk' | 'primary' | 'secondary' | 'residential'
  surface: 'paved' | 'unpaved' | 'gravel'
  lanes: number
  max_speed: number  // km/h
  geometry: LineString
}
```

**Road Classes:**
- **Motorway**: Highways, freeways
- **Trunk**: Major roads
- **Primary**: Main roads
- **Secondary**: Secondary roads
- **Tertiary**: Minor roads
- **Residential**: Neighborhood streets
- **Service**: Access roads, parking lots

#### **3b. Connectors** (Intersections)
```typescript
{
  id: string
  type: 'intersection' | 'dead_end' | 'crossing'
  geometry: Point
}
```

**Visualization Options:**
- Color by road class
- Width by road importance
- Speed limits as labels
- Turn restrictions as arrows

**File Size Estimates:**
- USA: ~1-3 GB
- State level: ~50-200 MB

---

### 4. **Base** 🌍
**Data Type:** Polygons
**Use Case:** Contextual layers, land use analysis

**Components:**

#### **4a. Land Use**
```typescript
{
  id: string
  class: 'residential' | 'commercial' | 'industrial' | 'park' | 'forest' | 'agricultural'
  subclass?: string
  geometry: Polygon
}
```

**Categories:**
- **Residential**: Neighborhoods
- **Commercial**: Business districts
- **Industrial**: Manufacturing zones
- **Recreation**: Parks, playgrounds, sports fields
- **Forest**: Wooded areas
- **Agricultural**: Farms, cropland
- **Institutional**: Schools, hospitals, government

#### **4b. Water**
```typescript
{
  id: string
  class: 'ocean' | 'sea' | 'lake' | 'river' | 'stream'
  geometry: Polygon | LineString
}
```

**Categories:**
- **Ocean/Sea**: Large water bodies
- **Lake/Pond**: Enclosed water
- **River**: Major waterways
- **Stream**: Small waterways
- **Canal**: Man-made waterways

#### **4c. Land Cover**
```typescript
{
  id: string
  class: 'forest' | 'grass' | 'wetland' | 'bare' | 'urban'
  geometry: Polygon
}
```

**Visualization Options:**
- Color by land use type
- Opacity for overlays
- Pattern fills for textures

**File Size Estimates:**
- Global water: ~100-500 MB
- USA land use: ~500 MB - 1 GB

---

### 5. **Administrative Boundaries** 📍
**Data Type:** Polygons
**Use Case:** Choropleth maps, regional analysis

**Levels:**

#### **Level 1: Countries**
```typescript
{
  id: string
  name: string
  iso_3166_1: string  // Country code (e.g., 'US', 'GB')
  geometry: Polygon | MultiPolygon
}
```

#### **Level 2: States/Provinces**
```typescript
{
  id: string
  name: string
  parent_id: string  // Country ID
  iso_3166_2: string  // State code (e.g., 'US-CA')
  geometry: Polygon
}
```

#### **Level 3: Counties/Districts**
```typescript
{
  id: string
  name: string
  parent_id: string  // State ID
  geometry: Polygon
}
```

#### **Level 4: Cities/Municipalities**
```typescript
{
  id: string
  name: string
  parent_id: string  // County ID
  population?: number
  geometry: Polygon
}
```

#### **Level 5: Neighborhoods**
```typescript
{
  id: string
  name: string
  parent_id: string  // City ID
  geometry: Polygon
}
```

**Visualization Options:**
- Choropleth maps (color by data)
- Boundary outlines
- Labels at appropriate zoom
- Click to zoom to boundary

**File Size Estimates:**
- Global countries: ~10-50 MB
- USA states: ~5-10 MB
- USA counties: ~50-100 MB
- USA cities: ~200-500 MB

---

## Integration Priority (Recommended Order)

### **Phase 1: Already Complete** ✅
1. Places (POIs) - 4.6 MB

### **Phase 2: Visual Impact**
2. **Buildings** - High visual impact for urban areas
   - Start with major cities (100k buildings)
   - Add 3D extrusion support
   - File size: ~500 MB

3. **Water** (Base theme) - Great for context
   - Rivers, lakes, oceans
   - File size: ~100 MB

### **Phase 3: Network Analysis**
4. **Transportation (Roads)** - For routing and navigation
   - Road network
   - File size: ~1-3 GB (USA)

5. **Administrative Boundaries** - For regional analysis
   - Countries, states, counties
   - File size: ~500 MB

### **Phase 4: Contextual Layers**
6. **Land Use** (Base theme) - Urban planning
   - Residential, commercial, industrial zones
   - File size: ~500 MB - 1 GB

---

## Sample Query Templates

### Buildings (with height filter)
```sql
SELECT
  id,
  COALESCE(names.primary, '') as name,
  COALESCE(class, 'building') as building_class,
  COALESCE(height, 0) as height,
  COALESCE(num_floors, 0) as num_floors,
  ST_AsText(geometry) as geometry_wkt
FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=buildings/type=building/*',
  hive_partitioning=true)
WHERE bbox.xmin BETWEEN -125 AND -66
  AND bbox.ymin BETWEEN 24 AND 49
  AND height > 10  -- Buildings taller than 10m
LIMIT 100000
```

### Transportation (major roads only)
```sql
SELECT
  id,
  COALESCE(class, 'unknown') as road_class,
  COALESCE(surface, 'unknown') as surface,
  COALESCE(lanes, 2) as lanes,
  ST_AsText(geometry) as geometry_wkt
FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=transportation/type=segment/*',
  hive_partitioning=true)
WHERE class IN ('motorway', 'trunk', 'primary')
  AND bbox.xmin BETWEEN -125 AND -66
  AND bbox.ymin BETWEEN 24 AND 49
LIMIT 50000
```

### Administrative Boundaries (USA states)
```sql
SELECT
  id,
  COALESCE(names.primary, '') as name,
  COALESCE(iso_3166_2, '') as state_code,
  admin_level,
  ST_AsText(geometry) as geometry_wkt
FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=boundaries/type=locality/*',
  hive_partitioning=true)
WHERE admin_level = 2  -- State level
  AND iso_3166_1 = 'US'
```

---

## Layer Control Example

```typescript
// lib/services/overtureLayersManager.ts
export type OvertureLayer =
  | 'places'
  | 'buildings'
  | 'transportation'
  | 'water'
  | 'land-use'
  | 'boundaries'

export interface LayerConfig {
  id: OvertureLayer
  name: string
  theme: string
  minZoom: number
  maxZoom: number
  enabled: boolean
  style: mapboxgl.Layer
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'places',
    name: 'Places',
    theme: 'places',
    minZoom: 6,
    maxZoom: 14,
    enabled: true,
    style: { /* ... */ }
  },
  {
    id: 'buildings',
    name: 'Buildings',
    theme: 'buildings',
    minZoom: 12,
    maxZoom: 16,
    enabled: false,
    style: {
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-opacity': 0.8
      }
    }
  },
  // ... more layers
]
```

---

## Performance Tips

### 1. **Zoom-Based Loading**
- Places: 6-14
- Buildings: 12-16 (city/street level)
- Transportation: 8-14
- Boundaries: 2-10

### 2. **Regional Filtering**
Always use bounding box filters:
```sql
WHERE bbox.xmin BETWEEN minLng AND maxLng
  AND bbox.ymin BETWEEN minLat AND maxLat
```

### 3. **Limit Results**
Start with smaller datasets:
```sql
LIMIT 50000  -- For testing
LIMIT 500000 -- For production
```

### 4. **Progressive Enhancement**
1. Load low-detail global view
2. Load high-detail for visible area
3. Cache in IndexedDB

---

## Next Steps

1. **Buildings Layer** (recommended first)
   - Run `/scripts/generate-buildings-tiles.sh`
   - Create `OvertureBuildings` service
   - Add to layer control UI

2. **Layer Control UI**
   - Create toggle switches
   - Zoom-based auto-enable/disable
   - Legend with categories

3. **3D View**
   - Enable pitch/bearing controls
   - Add building extrusions
   - Add shadows and lighting

Would you like me to implement any of these layers?
