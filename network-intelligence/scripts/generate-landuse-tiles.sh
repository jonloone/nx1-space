#!/bin/bash

# Generate Overture Maps Base Land Use PMTiles (NYC Region)
# Provides land use classification for investigation scenarios

set -e  # Exit on error

echo "🏭 Overture Maps Land Use PMTiles Generator"
echo "==========================================="

# Configuration
OUTPUT_DIR="/mnt/blockstorage/nx1-space/network-intelligence/public/tiles"
TEMP_DIR="/tmp/overture-landuse"
PMTILES_FILE="$OUTPUT_DIR/landuse-nyc.pmtiles"

# NYC bounds (expanded to cover metro area)
NYC_MIN_LAT=40.4774
NYC_MAX_LAT=40.9176
NYC_MIN_LNG=-74.2591
NYC_MAX_LNG=-73.7004

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "📦 Output: $PMTILES_FILE"
echo "🗂️  Temp: $TEMP_DIR"
echo "🗽 Region: NYC Metro"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."
command -v duckdb >/dev/null 2>&1 || { echo "❌ duckdb not found"; exit 1; }
command -v tippecanoe >/dev/null 2>&1 || { echo "❌ tippecanoe not found"; exit 1; }
echo "✅ Dependencies OK"
echo ""

# Step 1: Download Land Use data
echo "📥 Step 1: Downloading NYC land use data..."
echo "   Filter: Industrial, commercial, recreational zones"
echo ""

cd "$TEMP_DIR"

# Query land use features
duckdb << EOF
INSTALL spatial;
LOAD spatial;

COPY (
  SELECT
    id,
    class,
    subclass,
    ST_X(ST_Centroid(geometry)) as longitude,
    ST_Y(ST_Centroid(geometry)) as latitude
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=base/type=land_use/*',
    hive_partitioning=true)
  WHERE class IN ('industrial', 'commercial', 'recreation', 'port', 'transportation')
    AND ST_Y(ST_Centroid(geometry)) >= $NYC_MIN_LAT
    AND ST_Y(ST_Centroid(geometry)) <= $NYC_MAX_LAT
    AND ST_X(ST_Centroid(geometry)) >= $NYC_MIN_LNG
    AND ST_X(ST_Centroid(geometry)) <= $NYC_MAX_LNG
  LIMIT 10000
) TO 'landuse-nyc.csv' (HEADER true, DELIMITER ',');
EOF

LANDUSE_COUNT=$(wc -l < landuse-nyc.csv)
echo "✅ Downloaded $LANDUSE_COUNT land use features"
echo ""

# Step 2: Convert to GeoJSON
echo "🔄 Step 2: Converting to GeoJSON..."

python3 << 'PYTHON'
import csv
import json

features = []

# Map land use to investigation significance
significance_map = {
    'industrial': 'suspicious',
    'port': 'suspicious',
    'commercial': 'routine',
    'recreation': 'routine',
    'transportation': 'transport'
}

with open('landuse-nyc.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        land_class = row['class']
        subclass = row.get('subclass', '')

        feature = {
            "type": "Feature",
            "id": row['id'],
            "properties": {
                "id": row['id'],
                "class": land_class,
                "subclass": subclass,
                "significance": significance_map.get(land_class, 'routine'),
                "name": f"{land_class.title()} Zone"
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

with open('landuse-nyc.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"✅ Converted {len(features)} land use features to GeoJSON")
PYTHON

echo ""

# Step 3: Generate PMTiles
echo "🔨 Step 3: Generating PMTiles with tippecanoe..."
echo "   Zoom levels: 8-12"
echo ""

tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=12 \
  --minimum-zoom=8 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=landuse \
  --name="NYC Land Use" \
  --attribution="© Overture Maps Foundation" \
  landuse-nyc.geojson

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

echo "✨ SUCCESS! NYC Land Use PMTiles ready at:"
echo "   $PMTILES_FILE"
echo ""
du -h "$PMTILES_FILE"
echo ""
echo "🏭 Use case: Identify industrial zones and land use patterns for investigation scenarios"
echo ""
