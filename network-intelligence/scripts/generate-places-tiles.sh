#!/bin/bash

# Generate Overture Places PMTiles for 7 US Port Cities
# Uses DuckDB to query Overture Places data from S3 and tippecanoe to create PMTiles
# Cities: LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland

set -e

echo "📍 Generating Overture Places PMTiles for 7 US Port Cities..."

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
GEOJSON_FILE="$TEMP_DIR/places-usa.geojson.lines"
PMTILES_FILE="$OUTPUT_DIR/places-global.pmtiles"

echo "📥 Querying Overture Places data from S3 (7 US Port Cities)..."
echo "   Cities: LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland"
echo "   Coverage: ALL places in each city (no limit)"
echo ""

# Query Overture Places data for 7 US port cities
# Use same bounding boxes as buildings layer for consistency
duckdb -c "
INSTALL spatial;
LOAD spatial;
INSTALL httpfs;
LOAD httpfs;
SET s3_region='us-west-2';

-- Export Places to newline-delimited GeoJSON
COPY (
  SELECT
    json_object(
      'type', 'Feature',
      'id', id,
      'properties', json_object(
        'id', id,
        'name', COALESCE(names.primary, 'Unknown'),
        'category', COALESCE(categories.primary, 'unknown'),
        'confidence', COALESCE(confidence, 0.0)
      ),
      'geometry', ST_AsGeoJSON(geometry)::JSON
    )::VARCHAR as geojson
  FROM read_parquet('s3://overturemaps-us-west-2/release/2025-09-24.0/theme=places/type=place/*',
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
  AND confidence > 0.5
) TO '$GEOJSON_FILE' (FORMAT CSV, HEADER false, DELIMITER '\t', QUOTE '');
"

if [ ! -f "$GEOJSON_FILE" ]; then
    echo "❌ Failed to generate GeoJSON file"
    exit 1
fi

# Count features
FEATURE_COUNT=$(wc -l < "$GEOJSON_FILE")
echo "✅ Exported $FEATURE_COUNT places from Overture"

# Convert newline-delimited GeoJSON to proper GeoJSON FeatureCollection
echo "🔄 Converting to GeoJSON FeatureCollection..."
echo '{"type":"FeatureCollection","features":[' > "$TEMP_DIR/places-usa.geojson"
awk '{
  if (NR > 1) printf ",\n"
  printf "%s", $0
}' "$GEOJSON_FILE" >> "$TEMP_DIR/places-usa.geojson"
echo ']}' >> "$TEMP_DIR/places-usa.geojson"

echo "🗺️ Generating PMTiles with tippecanoe..."

# Generate PMTiles
# - Max zoom 14 for detailed view
# - Min zoom 6 for overview
# - Drop densest features to keep file size manageable
# - Layer name: places
tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=14 \
  --minimum-zoom=6 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=places \
  --name="Overture Places (7 US Port Cities)" \
  --attribution="© Overture Maps Foundation" \
  "$TEMP_DIR/places-usa.geojson"

# Clean up temp files
rm -rf "$TEMP_DIR"

# Check output
if [ -f "$PMTILES_FILE" ]; then
    FILE_SIZE=$(du -h "$PMTILES_FILE" | cut -f1)
    echo "✅ PMTiles generated: $PMTILES_FILE ($FILE_SIZE)"
    echo "📊 Features: $FEATURE_COUNT places"
    echo "🗺️ Coverage: 7 US Port Cities (LA, NYC, Houston, Savannah, Seattle, Charleston, Oakland)"
    echo "🔍 Zoom levels: 6-14"
else
    echo "❌ Failed to generate PMTiles"
    exit 1
fi

echo "✅ Done! Places PMTiles ready for use."
