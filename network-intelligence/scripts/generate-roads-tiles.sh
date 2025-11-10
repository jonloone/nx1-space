#!/bin/bash

# Generate Overture Transportation PMTiles for 7 US Port Cities
# Uses DuckDB to query Overture transportation data from S3 and tippecanoe to create PMTiles
# Cities: LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland
# Includes: Roads, highways, paths, pedestrian ways

set -e

echo "🛣️ Generating Overture Transportation PMTiles for 7 US Port Cities..."

# Check if DuckDB is installed
if ! command -v duckdb &> /dev/null; then
    echo "❌ DuckDB not found. Installing..."
    wget https://github.com/duckdb/duckdb/releases/download/v1.0.0/duckdb_cli-linux-amd64.zip
    unzip duckdb_cli-linux-amd64.zip
    sudo mv duckdb /usr/local/bin/
    rm duckdb_cli-linux-amd64.zip
fi

# Check if tippecanoe is installed
if ! command -v tippecanoe &> /dev/null; then
    echo "❌ Tippecanoe not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y build-essential libsqlite3-dev zlib1g-dev
    git clone https://github.com/felt/tippecanoe.git /tmp/tippecanoe
    cd /tmp/tippecanoe
    make -j
    sudo make install
    cd -
    rm -rf /tmp/tippecanoe
fi

# Output directory
OUTPUT_DIR="public/tiles"
mkdir -p "$OUTPUT_DIR"

# Temporary files
TEMP_DIR=$(mktemp -d)
GEOJSON_FILE="$TEMP_DIR/roads-usa.geojson.lines"
PMTILES_FILE="$OUTPUT_DIR/roads-usa.pmtiles"

echo "📥 Querying Overture Transportation data from S3 (7 US Port Cities)..."
echo "   Cities: LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland"
echo "   Coverage: Major roads, highways, and streets"
echo ""

# Query Overture Transportation data for 7 US port cities
# Use same bounding boxes as buildings layer for consistency
duckdb -c "
INSTALL spatial;
LOAD spatial;
INSTALL httpfs;
LOAD httpfs;
SET s3_region='us-west-2';

-- Export roads to newline-delimited GeoJSON
COPY (
  SELECT
    json_object(
      'type', 'Feature',
      'id', id,
      'properties', json_object(
        'id', id,
        'class', COALESCE(class, 'unknown'),
        'subclass', COALESCE(subclass, 'unknown'),
        'name', COALESCE(names.primary, 'Road')
      ),
      'geometry', ST_AsGeoJSON(geometry)::JSON
    )::VARCHAR as geojson
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=transportation/type=segment/*',
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
  AND class IN ('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service')
) TO '$GEOJSON_FILE' (FORMAT CSV, HEADER false, DELIMITER '\t', QUOTE '');
"

if [ ! -f "$GEOJSON_FILE" ]; then
    echo "❌ Failed to generate GeoJSON file"
    exit 1
fi

# Count features
FEATURE_COUNT=$(wc -l < "$GEOJSON_FILE")
echo "✅ Exported $FEATURE_COUNT road segments from Overture"

# Convert newline-delimited GeoJSON to proper GeoJSON FeatureCollection
echo "🔄 Converting to GeoJSON FeatureCollection..."
echo '{"type":"FeatureCollection","features":[' > "$TEMP_DIR/roads-usa.geojson"
awk '{
  if (NR > 1) printf ",\n"
  printf "%s", $0
}' "$GEOJSON_FILE" >> "$TEMP_DIR/roads-usa.geojson"
echo ']}' >> "$TEMP_DIR/roads-usa.geojson"

echo "🗺️ Generating PMTiles with tippecanoe..."

# Generate PMTiles
# - Max zoom 14 for detailed streets
# - Min zoom 8 for regional overview
# - Drop densest features to keep file size manageable
# - Layer name: roads
tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=14 \
  --minimum-zoom=8 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=roads \
  --name="Overture Roads (7 US Port Cities)" \
  --attribution="© Overture Maps Foundation" \
  "$TEMP_DIR/roads-usa.geojson"

# Clean up temp files
rm -rf "$TEMP_DIR"

# Check output
if [ -f "$PMTILES_FILE" ]; then
    FILE_SIZE=$(du -h "$PMTILES_FILE" | cut -f1)
    echo "✅ PMTiles generated: $PMTILES_FILE ($FILE_SIZE)"
    echo "📊 Features: $FEATURE_COUNT road segments"
    echo "🗺️ Coverage: 7 US Port Cities (LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland)"
    echo "🔍 Zoom levels: 8-14"
else
    echo "❌ Failed to generate PMTiles"
    exit 1
fi

echo "✅ Done! Roads PMTiles ready for use."
