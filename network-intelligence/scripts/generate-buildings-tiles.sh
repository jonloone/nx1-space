#!/bin/bash

# Generate Overture Maps Buildings PMTiles
# Buildings layer with footprints and height data

set -e

echo "🏢 Overture Maps Buildings PMTiles Generator"
echo "============================================"

# Configuration
OUTPUT_DIR="/mnt/blockstorage/nx1-space/network-intelligence/public/tiles"
TEMP_DIR="/tmp/overture-buildings"
PMTILES_FILE="$OUTPUT_DIR/buildings-usa.pmtiles"

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "📦 Output: $PMTILES_FILE"
echo "🗂️  Temp: $TEMP_DIR"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."
command -v duckdb >/dev/null 2>&1 || { echo "❌ duckdb not found"; exit 1; }
command -v tippecanoe >/dev/null 2>&1 || { echo "❌ tippecanoe not found"; exit 1; }
echo "✅ Dependencies OK"
echo ""

# Step 1: Download Overture Buildings (Top 7 US Port Cities - Complete Coverage)
echo "📥 Step 1: Downloading Overture Buildings data..."
echo "   Region: Top 7 US Port Cities (100% Complete)"
echo "   Cities: LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland"
echo "   Coverage: ALL buildings in each city (no limit)"
echo ""

cd "$TEMP_DIR"

# Export buildings as GeoJSON directly (simpler and more reliable)
duckdb << 'EOF'
INSTALL spatial;
LOAD spatial;

COPY (
  SELECT
    json_object(
      'type', 'Feature',
      'id', id,
      'properties', json_object(
        'id', id,
        'name', COALESCE(names.primary, 'Building'),
        'class', COALESCE(class, 'building'),
        'height', COALESCE(height, 0),
        'floors', COALESCE(num_floors, 0)
      ),
      'geometry', ST_AsGeoJSON(geometry)::JSON
    )::VARCHAR as geojson
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=buildings/type=building/*',
    hive_partitioning=true)
  WHERE (
    -- Los Angeles/Long Beach, CA (busiest container port)
    (bbox.xmin BETWEEN -118.5 AND -117.8 AND bbox.ymin BETWEEN 33.5 AND 34.2) OR
    -- New York/Newark, NJ (major East Coast port)
    (bbox.xmin BETWEEN -74.3 AND -73.7 AND bbox.ymin BETWEEN 40.5 AND 40.9) OR
    -- Houston/Galveston, TX (largest by tonnage)
    (bbox.xmin BETWEEN -95.8 AND -94.9 AND bbox.ymin BETWEEN 29.3 AND 29.9) OR
    -- Savannah, GA (fastest-growing port)
    (bbox.xmin BETWEEN -81.3 AND -81.0 AND bbox.ymin BETWEEN 31.9 AND 32.2) OR
    -- Seattle/Tacoma, WA (Pacific Northwest gateway)
    (bbox.xmin BETWEEN -122.5 AND -122.1 AND bbox.ymin BETWEEN 47.3 AND 47.8) OR
    -- Charleston, SC (East Coast hub)
    (bbox.xmin BETWEEN -80.1 AND -79.8 AND bbox.ymin BETWEEN 32.6 AND 32.9) OR
    -- Oakland, CA (Bay Area port)
    (bbox.xmin BETWEEN -122.4 AND -122.1 AND bbox.ymin BETWEEN 37.6 AND 37.9)
  )
) TO 'buildings.geojson.lines' (FORMAT CSV, HEADER false, DELIMITER '\t', QUOTE '');
EOF

echo "✅ Downloaded $(wc -l < buildings.geojson.lines) buildings"
echo ""

# Step 2: Wrap GeoJSON features in FeatureCollection (streaming)
echo "🔄 Step 2: Creating GeoJSON FeatureCollection (streaming mode)..."

python3 << 'PYTHON'
import json
import sys

# Stream processing to avoid memory issues
print("Processing buildings...")
feature_count = 0

with open('buildings-usa.geojson', 'w') as out:
    # Write opening
    out.write('{"type":"FeatureCollection","features":[')

    first = True
    with open('buildings.geojson.lines', 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    # Validate it's valid JSON
                    feature = json.loads(line)

                    # Write comma separator (except for first feature)
                    if not first:
                        out.write(',')
                    else:
                        first = False

                    # Write feature as compact JSON
                    out.write(json.dumps(feature, separators=(',', ':')))
                    feature_count += 1

                    # Progress indicator every 100k features
                    if feature_count % 100000 == 0:
                        print(f"  Processed {feature_count:,} buildings...", file=sys.stderr)

                except json.JSONDecodeError as e:
                    print(f"Warning: Skipping invalid JSON: {e}", file=sys.stderr)
                    continue

    # Write closing
    out.write(']}')

print(f"✅ Created FeatureCollection with {feature_count:,} buildings")
PYTHON

echo ""

# Step 3: Generate PMTiles
echo "🔨 Step 3: Generating PMTiles with tippecanoe..."
echo "   Zoom levels: 12-16 (city/street level)"
echo ""

tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=16 \
  --minimum-zoom=12 \
  --drop-densest-as-needed \
  --layer=buildings \
  --name="Overture Buildings" \
  --attribution="© Overture Maps Foundation" \
  buildings-usa.geojson

echo "✅ PMTiles generated"
echo ""

# Step 4: Verify
echo "📊 Step 4: Verification..."
ls -lh "$PMTILES_FILE"
echo ""

# Clean up
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"
echo "✅ Done!"
echo ""

echo "✨ SUCCESS! Buildings PMTiles ready at:"
echo "   $PMTILES_FILE"
echo ""
du -h "$PMTILES_FILE"
echo ""
echo "🚀 Next: Add OvertureBuildings service and restart dev server"
echo ""
