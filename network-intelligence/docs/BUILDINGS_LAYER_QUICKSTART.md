# Buildings Layer Quick Start

Add 3D building footprints to your map in 3 steps.

---

## Step 1: Generate Buildings PMTiles

```bash
cd /mnt/blockstorage/nx1-space/network-intelligence

# Make script executable
chmod +x scripts/generate-buildings-tiles.sh

# Run generation (takes ~5-10 minutes)
./scripts/generate-buildings-tiles.sh
```

**What it does:**
- Downloads 100,000 USA buildings from Overture Maps
- Filters for buildings with height data
- Generates PMTiles (zoom 12-16) at `/public/tiles/buildings-usa.pmtiles`
- File size: ~50-100 MB

---

## Step 2: Add to Operations Page

```typescript
// app/operations/page.tsx
import { getOvertureBuildingsService } from '@/lib/services/overtureBuildingsService'

// In your component:
useEffect(() => {
  if (!map.current || !isLoaded) return

  const initializeBuildings = async () => {
    const buildingsService = getOvertureBuildingsService()

    // Add buildings in 3D mode
    await buildingsService.addToMap(map.current!, true)

    console.log('🏢 Buildings loaded')
  }

  initializeBuildings()
}, [isLoaded])
```

---

## Step 3: Toggle 2D/3D

```typescript
// Add a button to toggle
<Button onClick={() => {
  const buildingsService = getOvertureBuildingsService()
  buildingsService.toggle3D(map.current!, !is3DEnabled)
  setIs3DEnabled(!is3DEnabled)
}}>
  {is3DEnabled ? '2D View' : '3D View'}
</Button>
```

---

## Features

### **2D Mode**
- Flat building footprints
- Color-coded by type:
  - 🔴 Residential
  - 🔵 Commercial
  - 🟣 Industrial
  - 🟢 Public
  - 🟡 Mixed

### **3D Mode**
- Extruded buildings based on actual height
- Automatic pitch/tilt (60°)
- Realistic shadows
- Vertical gradient for depth

---

## Building Data

Each building has:
```typescript
{
  id: string
  name?: string
  class: 'residential' | 'commercial' | 'industrial' | 'public' | 'mixed'
  height: number  // meters
  floors: number
}
```

---

## Performance

**Zoom Levels:**
- Hidden: zoom < 12
- Visible: zoom 12-16
- Optimal: zoom 14-16 (street level)

**Recommended Map Bounds:**
- Start zoomed out (zoom 4-8) - buildings hidden
- Zoom to city level (zoom 12+) - buildings appear
- Best experience at zoom 14-16

---

## Customization

### Change Colors
```typescript
// In overtureBuildingsService.ts:add3DLayers()
'fill-extrusion-color': [
  'match',
  ['get', 'class'],
  'residential', '#YOUR_COLOR_HERE',
  // ...
]
```

### Adjust Opacity
```typescript
'fill-extrusion-opacity': 0.8  // 0.0 - 1.0
```

### Filter by Height
```typescript
map.addLayer({
  // ...
  filter: ['>=', ['get', 'height'], 20]  // Only buildings > 20m
})
```

---

## Next Steps

1. **Add Layer Control UI**
   - Toggle buildings on/off
   - Switch between 2D/3D
   - Filter by building type

2. **Add Transportation Layer**
   - Roads network
   - Complements buildings

3. **Add Water Layer**
   - Rivers, lakes
   - Great context for cities

See `/docs/OVERTURE_LAYERS_GUIDE.md` for more layers!
