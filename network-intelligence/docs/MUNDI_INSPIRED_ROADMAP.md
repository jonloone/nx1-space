# Mundi.ai-Inspired OpIntel Enhancements

Roadmap to add Mundi.ai's best features to OpIntel platform.

## Philosophy

Instead of adding heavy QGIS integration, we'll use:
- **Turf.js** - JavaScript spatial analysis (70% of QGIS capabilities)
- **Vultr LLM** - AI-powered natural language queries
- **Modern UI** - Clean, GIS-professional interface
- **Real-time focus** - Operational intelligence, not static data analysis

## Phase 1: AI-Powered Interface (Week 1)

### 1.1 AI Chat Sidebar (2 days)

**Component**: `/components/ai/AIChatPanel.tsx`

```typescript
interface AIChatPanelProps {
  onQuery: (query: string, results: AnalysisResults) => void
}

// Example queries:
// "Show all vehicles within 5km of downtown"
// "Highlight delayed vehicles"
// "Create heatmap of vehicle density"
// "Find optimal route between these points"
```

**Features**:
- Chat interface with message history
- Pre-built query suggestions
- Entity filtering from AI responses
- Spatial analysis triggers
- Visualization recommendations

### 1.2 Enhanced Layer Manager (2 days)

**Component**: `/components/layers/AdvancedLayerPanel.tsx`

**Features**:
- Drag-and-drop layer reordering
- Opacity slider per layer
- Color picker with AI suggestions
- Blend modes (normal, multiply, screen)
- Style presets (heatmap, clusters, routes)
- AI-powered symbology: "Make active vehicles green, idle yellow"

### 1.3 Natural Language Query Parser (1 day)

**Service**: `/lib/services/nlQueryService.ts`

```typescript
class NLQueryService {
  async parseQuery(query: string): Promise<QueryPlan> {
    // Use Vultr LLM to parse:
    // "vehicles near downtown" → { type: 'proximity', center: 'downtown', radius: 5km }
    // "delayed deliveries" → { filter: { status: 'delayed', type: 'delivery' } }
    // "create buffer" → { analysis: 'buffer', radius: 10km }
  }

  async executeQuery(plan: QueryPlan): Promise<Results> {
    // Filter entities
    // Run spatial analysis
    // Return visualization config
  }
}
```

## Phase 2: Spatial Analysis Tools (Week 2)

### 2.1 Turf.js Integration (2 days)

**Installation**:
```bash
npm install @turf/turf @turf/helpers @turf/buffer @turf/circle @turf/nearest-point
```

**Service**: `/lib/services/spatialAnalysisService.ts`

```typescript
import * as turf from '@turf/turf'

class SpatialAnalysisService {
  // Buffer zones
  createBuffer(entity: SpatialEntity, radiusKm: number) {
    const point = turf.point([entity.position.longitude, entity.position.latitude])
    return turf.buffer(point, radiusKm, { units: 'kilometers' })
  }

  // Proximity search
  findWithinRadius(center: Position, entities: SpatialEntity[], radiusKm: number) {
    const searchCircle = turf.circle(
      [center.longitude, center.latitude],
      radiusKm,
      { units: 'kilometers' }
    )

    return entities.filter(entity => {
      const point = turf.point([entity.position.longitude, entity.position.latitude])
      return turf.booleanPointInPolygon(point, searchCircle)
    })
  }

  // Heatmap generation
  generateDensityMap(entities: SpatialEntity[], cellSizeKm: number) {
    const points = entities.map(e =>
      turf.point([e.position.longitude, e.position.latitude])
    )

    const bbox = turf.bbox(turf.featureCollection(points))
    const hexgrid = turf.hexGrid(bbox, cellSizeKm, { units: 'kilometers' })

    // Count points per hex
    hexgrid.features.forEach(hex => {
      const count = points.filter(point =>
        turf.booleanPointInPolygon(point, hex)
      ).length
      hex.properties.density = count
    })

    return hexgrid
  }

  // Route optimization (simple nearest neighbor)
  optimizeRoute(waypoints: SpatialEntity[]) {
    const route: SpatialEntity[] = []
    let remaining = [...waypoints]
    let current = remaining[0]

    while (remaining.length > 0) {
      route.push(current)
      remaining = remaining.filter(w => w.id !== current.id)

      if (remaining.length > 0) {
        const currentPoint = turf.point([current.position.longitude, current.position.latitude])
        const nearestPoints = turf.featureCollection(
          remaining.map(w => turf.point([w.position.longitude, w.position.latitude], w))
        )
        const nearest = turf.nearestPoint(currentPoint, nearestPoints)
        current = nearest.properties as SpatialEntity
      }
    }

    return route
  }

  // Cluster analysis
  clusterEntities(entities: SpatialEntity[], maxDistance: number) {
    // DBSCAN clustering using distance threshold
    const clusters: SpatialEntity[][] = []
    const visited = new Set<string>()

    entities.forEach(entity => {
      if (visited.has(entity.id)) return

      const cluster = this.findWithinRadius(
        entity.position,
        entities.filter(e => !visited.has(e.id)),
        maxDistance
      )

      cluster.forEach(e => visited.add(e.id))
      clusters.push(cluster)
    })

    return clusters
  }
}
```

### 2.2 Analysis Toolbox UI (2 days)

**Component**: `/components/analysis/AnalysisToolbox.tsx`

```typescript
const tools = [
  {
    id: 'buffer',
    name: 'Buffer Zone',
    icon: '⭕',
    description: 'Create radius around entities',
    params: [
      { name: 'radius', type: 'number', unit: 'km', default: 5 }
    ]
  },
  {
    id: 'proximity',
    name: 'Proximity Search',
    icon: '📍',
    description: 'Find entities within distance',
    params: [
      { name: 'center', type: 'entity' },
      { name: 'radius', type: 'number', unit: 'km', default: 10 }
    ]
  },
  {
    id: 'heatmap',
    name: 'Density Heatmap',
    icon: '🔥',
    description: 'Visualize entity concentration',
    params: [
      { name: 'cellSize', type: 'number', unit: 'km', default: 1 }
    ]
  },
  {
    id: 'route',
    name: 'Route Optimizer',
    icon: '🛣️',
    description: 'Optimize path through waypoints',
    params: []
  },
  {
    id: 'cluster',
    name: 'Cluster Analysis',
    icon: '📊',
    description: 'Group nearby entities',
    params: [
      { name: 'maxDistance', type: 'number', unit: 'km', default: 2 }
    ]
  }
]
```

### 2.3 AI-Powered Analysis (1 day)

**Example AI Queries**:
```typescript
// "Create a 10km buffer around all delayed vehicles"
{
  analysis: 'buffer',
  filter: { status: 'delayed', type: 'vehicle' },
  params: { radius: 10 }
}

// "Show heatmap of vehicle density with 5km cells"
{
  analysis: 'heatmap',
  filter: { type: 'vehicle' },
  params: { cellSize: 5 }
}

// "Find all vehicles within 15km of alert zones"
{
  analysis: 'proximity',
  filter: { type: 'vehicle' },
  params: { radius: 15 },
  reference: { type: 'zone', status: 'alert' }
}
```

## Phase 3: QGIS-Lite (Optional, Week 3)

### 3.1 Python Backend Service (if truly needed)

**Only if Turf.js can't handle a specific algorithm**

```python
# /backend/qgis_service/main.py
from fastapi import FastAPI
from qgis.core import QgsApplication, QgsVectorLayer
from processing.core.Processing import Processing

app = FastAPI()

@app.post("/buffer")
async def buffer_analysis(geojson: dict, distance: float):
    layer = QgsVectorLayer(geojson, "temp", "ogr")
    result = processing.run("native:buffer", {
        'INPUT': layer,
        'DISTANCE': distance,
        'OUTPUT': 'memory:'
    })
    return result['OUTPUT'].asGeoJSON()
```

**Deployment**:
```dockerfile
# backend/Dockerfile
FROM qgis/qgis:latest
COPY requirements.txt .
RUN pip install fastapi uvicorn
COPY . /app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

**Only use this if:**
- Turf.js can't do it (rare)
- Algorithm is complex (3D analysis, raster processing)
- Performance is critical (QGIS C++ is faster)

## Turf.js vs QGIS Comparison

| Feature | Turf.js | QGIS | Winner |
|---------|---------|------|--------|
| **Buffer** | ✅ | ✅ | Tie |
| **Proximity** | ✅ | ✅ | Tie |
| **Heatmap** | ✅ | ✅ | Tie |
| **Route Optimization** | ⚠️ Basic | ✅ Advanced | QGIS |
| **Cluster Analysis** | ✅ | ✅ | Tie |
| **Intersection** | ✅ | ✅ | Tie |
| **Difference** | ✅ | ✅ | Tie |
| **Union** | ✅ | ✅ | Tie |
| **Convex Hull** | ✅ | ✅ | Tie |
| **Voronoi** | ✅ | ✅ | Tie |
| **Delaunay** | ✅ | ✅ | Tie |
| **Raster Analysis** | ❌ | ✅ | QGIS |
| **3D Analysis** | ❌ | ✅ | QGIS |
| **Topology** | ❌ | ✅ | QGIS |
| **Setup Complexity** | Easy | Hard | Turf.js |
| **Performance** | Fast | Faster | QGIS |
| **Bundle Size** | 200KB | 2GB+ | Turf.js |

**Verdict**: Turf.js handles 90% of OpIntel needs. Use QGIS only for advanced cases.

## UI/UX Patterns from Mundi.ai

### Clean Sidebar Design
```typescript
// Collapsible sections
- Data Sources (files, databases, streams)
- Layers (with previews)
- Analysis Tools
- AI Chat
- Settings
```

### Map-First Layout
```
┌─────────────────────────────────────┐
│ Toolbar (minimal)                    │
├──────┬──────────────────────┬────────┤
│      │                      │        │
│ Side │     Map Canvas       │ Right  │
│ bar  │     (85% width)      │ Panel  │
│ 15%  │                      │ (opt)  │
│      │                      │        │
├──────┴──────────────────────┴────────┤
│ Timeline (collapsible)               │
└──────────────────────────────────────┘
```

### AI Integration Points
1. **Chat panel** - Natural language queries
2. **Layer styling** - AI suggests colors/symbols
3. **Analysis** - AI recommends appropriate tools
4. **Insights** - AI highlights patterns in data

## Implementation Priority

**Must Have (Week 1)**:
1. ✅ AI chat sidebar
2. ✅ Natural language entity filtering
3. ✅ Enhanced layer controls

**Should Have (Week 2)**:
4. ✅ Turf.js spatial analysis
5. ✅ Analysis toolbox UI
6. ✅ Buffer/proximity/heatmap tools

**Nice to Have (Week 3+)**:
7. ⚠️ Advanced route optimization
8. ⚠️ QGIS backend (only if needed)
9. ⚠️ Raster analysis capabilities

## Success Metrics

After implementation, OpIntel should:
- ✅ Answer 90% of spatial queries with AI
- ✅ Perform common GIS operations in-browser
- ✅ Match Mundi.ai's UX simplicity
- ✅ Maintain real-time operational focus
- ✅ Stay fast (no QGIS overhead for 90% of tasks)

## Conclusion

**Build Mundi-inspired features WITHOUT full QGIS**:
- Use Turf.js for 90% of spatial analysis
- Add AI chat for natural language queries
- Enhance UI with GIS-professional design
- Only add QGIS backend if specific algorithms are absolutely needed

This gives us:
- ⚡ Fast implementation (2 weeks vs 4+ weeks)
- 🪶 Lightweight (200KB vs 2GB+)
- 🚀 Better performance (JavaScript in browser)
- 💰 Lower hosting costs (no Python backend needed initially)
