#!/bin/bash

# Generate Overture Maps Addresses PMTiles (NYC Region)
# Provides real address validation for investigation scenarios

set -e  # Exit on error

echo "🏠 Overture Maps Addresses PMTiles Generator"
echo "============================================"

# Configuration
OUTPUT_DIR="/mnt/blockstorage/nx1-space/network-intelligence/public/tiles"
TEMP_DIR="/tmp/overture-addresses"
PMTILES_FILE="$OUTPUT_DIR/addresses-nyc.pmtiles"

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
echo "🗽 Region: NYC Metro (${NYC_MIN_LAT},${NYC_MIN_LNG} to ${NYC_MAX_LAT},${NYC_MAX_LNG})"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."
command -v duckdb >/dev/null 2>&1 || { echo "❌ duckdb not found"; exit 1; }
command -v tippecanoe >/dev/null 2>&1 || { echo "❌ tippecanoe not found"; exit 1; }
echo "✅ Dependencies OK"
echo ""

# Step 1: Download Overture Addresses for NYC
echo "📥 Step 1: Downloading NYC addresses..."
echo "   Filter: NYC metro area only"
echo ""

cd "$TEMP_DIR"

# Query addresses from Overture Parquet
duckdb << EOF
INSTALL spatial;
LOAD spatial;

COPY (
  SELECT
    id,
    COALESCE(number, '') as number,
    COALESCE(street, '') as street,
    COALESCE(postcode, '') as postcode,
    COALESCE(unit, '') as unit,
    ST_X(geometry) as longitude,
    ST_Y(geometry) as latitude
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=addresses/type=address/*',
    hive_partitioning=true)
  WHERE ST_Y(geometry) >= $NYC_MIN_LAT
    AND ST_Y(geometry) <= $NYC_MAX_LAT
    AND ST_X(geometry) >= $NYC_MIN_LNG
    AND ST_X(geometry) <= $NYC_MAX_LNG
  LIMIT 200000
) TO 'addresses-nyc.csv' (HEADER true, DELIMITER ',');
EOF

ADDR_COUNT=$(wc -l < addresses-nyc.csv)
echo "✅ Downloaded $ADDR_COUNT addresses"
echo ""

# Step 2: Convert CSV to GeoJSON
echo "🔄 Step 2: Converting to GeoJSON..."

python3 << 'PYTHON'
import csv
import json

features = []
with open('addresses-nyc.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Build address string
        address_parts = []
        if row['number']:
            address_parts.append(row['number'])
        if row['street']:
            address_parts.append(row['street'])
        if row['unit']:
            address_parts.append(f"Unit {row['unit']}")

        address = ' '.join(address_parts) if address_parts else 'Unknown Address'

        if row['postcode']:
            address += f", {row['postcode']}"

        feature = {
            "type": "Feature",
            "id": row['id'],
            "properties": {
                "id": row['id'],
                "address": address,
                "number": row['number'],
                "street": row['street'],
                "postcode": row['postcode'],
                "unit": row['unit']
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

with open('addresses-nyc.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"✅ Converted {len(features)} addresses to GeoJSON")
PYTHON

echo ""

# Step 3: Generate PMTiles
echo "🔨 Step 3: Generating PMTiles with tippecanoe..."
echo "   Zoom levels: 10-16 (addresses visible at street level)"
echo ""

tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=16 \
  --minimum-zoom=10 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=addresses \
  --name="NYC Addresses" \
  --attribution="© Overture Maps Foundation" \
  addresses-nyc.geojson

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

echo "✨ SUCCESS! NYC Addresses PMTiles ready at:"
echo "   $PMTILES_FILE"
echo ""
du -h "$PMTILES_FILE"
echo ""
echo "🔍 Use case: Validate addresses in investigation scenarios"
echo ""
