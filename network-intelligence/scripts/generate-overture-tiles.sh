#!/bin/bash

# Generate Overture Maps Places PMTiles (Global)
# Simplified approach: Use CSV intermediate format

set -e  # Exit on error

echo "🌍 Overture Maps Places PMTiles Generator"
echo "=========================================="

# Configuration
OUTPUT_DIR="/mnt/blockstorage/nx1-space/network-intelligence/public/tiles"
TEMP_DIR="/tmp/overture-tiles"
PMTILES_FILE="$OUTPUT_DIR/places-global.pmtiles"

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

# Step 1: Download Overture Places
echo "📥 Step 1: Downloading Overture Places data..."
echo "   Limit: 50,000 major landmarks (airports, hospitals, universities, etc.)"
echo ""

cd "$TEMP_DIR"

# Export as CSV first (simpler, more reliable)
duckdb << 'EOF'
INSTALL spatial;
LOAD spatial;

COPY (
  SELECT
    id,
    COALESCE(names.primary, 'Unknown') as name,
    COALESCE(categories.primary, 'unknown') as category,
    confidence,
    ST_X(geometry) as longitude,
    ST_Y(geometry) as latitude
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=places/type=place/*',
    hive_partitioning=true)
  WHERE categories.primary IN (
    'airport', 'seaport', 'hospital', 'clinic', 'emergency_room', 'pharmacy', 'dentist',
    'university', 'college', 'school', 'library',
    'museum', 'theater', 'stadium', 'arena', 'park', 'national_park', 'nature_reserve',
    'zoo', 'aquarium', 'botanical_garden', 'art_gallery',
    'restaurant', 'cafe', 'bar', 'fast_food',
    'hotel', 'motel', 'resort', 'hostel', 'campground',
    'shopping_mall', 'supermarket', 'market',
    'bank', 'post_office', 'police_station', 'fire_station', 'government',
    'gas_station', 'fuel', 'train_station', 'bus_station', 'ferry_terminal', 'marina'
  )
  AND confidence >= 0.75
  LIMIT 100000
) TO 'places.csv' (HEADER true, DELIMITER ',');
EOF

echo "✅ Downloaded $(wc -l < places.csv) places"
echo ""

# Step 2: Convert CSV to GeoJSON
echo "🔄 Step 2: Converting to GeoJSON..."

python3 << 'PYTHON'
import csv
import json

features = []
with open('places.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        feature = {
            "type": "Feature",
            "id": row['id'],
            "properties": {
                "id": row['id'],
                "name": row['name'],
                "category": row['category'],
                "confidence": float(row['confidence'])
            },
            "geometry": {
                "type": "Point",
                "coordinates": [float(row['longitude']), float(row['latitude'])]
            }
        }
        features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open('places-global.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"✅ Converted {len(features)} features to GeoJSON")
PYTHON

echo ""

# Step 3: Generate PMTiles
echo "🔨 Step 3: Generating PMTiles with tippecanoe..."
echo "   Zoom levels: 6-10"
echo ""

tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=10 \
  --minimum-zoom=6 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=places \
  --name="Overture Places" \
  --attribution="© Overture Maps Foundation" \
  places-global.geojson

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

echo "✨ SUCCESS! PMTiles ready at:"
echo "   $PMTILES_FILE"
echo ""
du -h "$PMTILES_FILE"
echo ""
echo "🚀 Next: Restart dev server and visit /operations"
echo ""
