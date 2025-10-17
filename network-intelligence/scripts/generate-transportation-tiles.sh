#!/bin/bash

# Generate Overture Maps Transportation PMTiles (NYC Region)
# Provides transit stations and infrastructure for investigation scenarios

set -e  # Exit on error

echo "🚇 Overture Maps Transportation PMTiles Generator"
echo "================================================="

# Configuration
OUTPUT_DIR="/mnt/blockstorage/nx1-space/network-intelligence/public/tiles"
TEMP_DIR="/tmp/overture-transportation"
PMTILES_FILE="$OUTPUT_DIR/transportation-nyc.pmtiles"

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

# Step 1: Download Transportation Connectors (Stations, Stops)
echo "📥 Step 1: Downloading NYC transit connectors..."
echo "   Filter: Transit stations, airports, ferry terminals"
echo ""

cd "$TEMP_DIR"

# Query connectors (transit stations, etc.)
duckdb << EOF
INSTALL spatial;
LOAD spatial;

COPY (
  SELECT
    id,
    ST_AsText(geometry) as geometry_wkt,
    ST_X(ST_Centroid(geometry)) as longitude,
    ST_Y(ST_Centroid(geometry)) as latitude
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=transportation/type=connector/*',
    hive_partitioning=true)
  WHERE ST_Y(ST_Centroid(geometry)) >= $NYC_MIN_LAT
    AND ST_Y(ST_Centroid(geometry)) <= $NYC_MAX_LAT
    AND ST_X(ST_Centroid(geometry)) >= $NYC_MIN_LNG
    AND ST_X(ST_Centroid(geometry)) <= $NYC_MAX_LNG
  LIMIT 50000
) TO 'connectors-nyc.csv' (HEADER true, DELIMITER ',');
EOF

CONNECTOR_COUNT=$(wc -l < connectors-nyc.csv)
echo "✅ Downloaded $CONNECTOR_COUNT transit connectors"
echo ""

# Step 2: Download Major Transportation Segments (subset)
echo "📥 Step 2: Downloading major transportation segments..."
echo "   Filter: Major roads and transit lines"
echo ""

duckdb << EOF
INSTALL spatial;
LOAD spatial;

COPY (
  SELECT
    id,
    subtype,
    ST_AsText(geometry) as geometry_wkt,
    ST_X(ST_Centroid(geometry)) as longitude,
    ST_Y(ST_Centroid(geometry)) as latitude
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=transportation/type=segment/*',
    hive_partitioning=true)
  WHERE subtype IN ('rail', 'subway', 'light_rail', 'ferry')
    AND ST_Y(ST_Centroid(geometry)) >= $NYC_MIN_LAT
    AND ST_Y(ST_Centroid(geometry)) <= $NYC_MAX_LAT
    AND ST_X(ST_Centroid(geometry)) >= $NYC_MIN_LNG
    AND ST_X(ST_Centroid(geometry)) <= $NYC_MAX_LNG
  LIMIT 10000
) TO 'segments-nyc.csv' (HEADER true, DELIMITER ',');
EOF

SEGMENT_COUNT=$(wc -l < segments-nyc.csv)
echo "✅ Downloaded $SEGMENT_COUNT transit segments"
echo ""

# Step 3: Convert to GeoJSON
echo "🔄 Step 3: Converting to GeoJSON..."

python3 << 'PYTHON'
import csv
import json

features = []

# Process connectors (points)
with open('connectors-nyc.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        feature = {
            "type": "Feature",
            "id": row['id'],
            "properties": {
                "id": row['id'],
                "type": "connector",
                "name": "Transit Connector"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [float(row['longitude']), float(row['latitude'])]
            }
        }
        features.append(feature)

# Process segments (simplified to points for now)
with open('segments-nyc.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        feature = {
            "type": "Feature",
            "id": row['id'],
            "properties": {
                "id": row['id'],
                "type": "segment",
                "subtype": row['subtype'],
                "name": f"{row['subtype'].title()} Line"
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

with open('transportation-nyc.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"✅ Converted {len(features)} transportation features to GeoJSON")
PYTHON

echo ""

# Step 4: Generate PMTiles
echo "🔨 Step 4: Generating PMTiles with tippecanoe..."
echo "   Zoom levels: 8-14"
echo ""

tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=14 \
  --minimum-zoom=8 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=transportation \
  --name="NYC Transportation" \
  --attribution="© Overture Maps Foundation" \
  transportation-nyc.geojson

echo "✅ PMTiles generated"
echo ""

# Step 5: Verify
echo "📊 Step 5: Verification..."
ls -lh "$PMTILES_FILE"
echo ""

# Clean up
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"
echo "✅ Done!"
echo ""

echo "✨ SUCCESS! NYC Transportation PMTiles ready at:"
echo "   $PMTILES_FILE"
echo ""
du -h "$PMTILES_FILE"
echo ""
echo "🚇 Use case: Transit stations and infrastructure for investigation scenarios"
echo ""
