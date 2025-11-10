#!/bin/bash

# Generate Cell Tower PMTiles from OpenCellID data
# SIGINT layer for Citizens360 intelligence platform
# Data source: https://opencellid.org/

set -e

echo "📡 OpenCellID Cell Towers PMTiles Generator"
echo "==========================================="

# Configuration
OUTPUT_DIR="/mnt/blockstorage/nx1-space/network-intelligence/public/tiles"
TEMP_DIR="/tmp/cell-towers"
PMTILES_FILE="$OUTPUT_DIR/cell-towers-usa.pmtiles"
DATA_DIR="/mnt/blockstorage/nx1-space/network-intelligence/data/external"

# NYC bounds (expanded to cover metro area)
NYC_MIN_LAT=40.4774
NYC_MAX_LAT=40.9176
NYC_MIN_LNG=-74.2591
NYC_MAX_LNG=-73.7004

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$DATA_DIR"

echo "📦 Output: $PMTILES_FILE"
echo "🗂️  Temp: $TEMP_DIR"
echo "📁 Data: $DATA_DIR"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."
command -v tippecanoe >/dev/null 2>&1 || { echo "❌ tippecanoe not found"; exit 1; }
echo "✅ Dependencies OK"
echo ""

# Step 1: Check for OpenCellID data
echo "📥 Step 1: Checking for OpenCellID data..."
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Sign up at: https://opencellid.org/"
echo "   2. Get your API token from: https://opencellid.org/account"
echo "   3. Download data using ONE of these methods:"
echo ""
echo "   METHOD A: Download full US dataset (recommended):"
echo "   wget -O $DATA_DIR/cell_towers_usa.csv.gz \\"
echo "     'https://opencellid.org/ocid/downloads?token=YOUR_TOKEN&type=mcc&file=310.csv.gz'"
echo ""
echo "   METHOD B: Use the OpenCellID API for NYC region:"
echo "   curl -H \"token: YOUR_TOKEN\" \\"
echo "     \"https://us1.unwiredlabs.com/v2/process.php\" \\"
echo "     -d '{\"token\":\"YOUR_TOKEN\",\"radio\":\"all\",\"mcc\":\"310\",\"mnc\":\"260\",\"area\":10000}' \\"
echo "     > $DATA_DIR/cell_towers_usa.json"
echo ""
echo "   METHOD C: Use demo/sample data (for testing only):"
echo "   # We'll generate synthetic data below"
echo ""

# Check if data exists
if [ -f "$DATA_DIR/cell_towers_usa.csv.gz" ]; then
    echo "✅ Found OpenCellID CSV data"
    echo "   Extracting..."
    gunzip -c "$DATA_DIR/cell_towers_usa.csv.gz" > "$TEMP_DIR/cell_towers.csv"
    USE_REAL_DATA=true
elif [ -f "$DATA_DIR/cell_towers_usa.csv" ]; then
    echo "✅ Found OpenCellID CSV data (uncompressed)"
    cp "$DATA_DIR/cell_towers_usa.csv" "$TEMP_DIR/cell_towers.csv"
    USE_REAL_DATA=true
else
    echo "⚠️  No OpenCellID data found"
    echo "   Generating synthetic cell tower data for demo purposes..."
    USE_REAL_DATA=false
fi

cd "$TEMP_DIR"

# Step 2: Generate or process data
if [ "$USE_REAL_DATA" = true ]; then
    echo ""
    echo "🔄 Step 2: Processing OpenCellID data..."

    # Filter for NYC region
    python3 << 'PYTHON'
import csv
import json

# OpenCellID CSV format:
# radio,mcc,net,area,cell,unit,lon,lat,range,samples,changeable,created,updated,averageSignal

towers = []
seen_cells = set()

print("Filtering cell towers for NYC region...")

with open('cell_towers.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            lat = float(row['lat'])
            lng = float(row['lon'])

            # NYC bounding box
            if 40.4774 <= lat <= 40.9176 and -74.2591 <= lng <= -73.7004:
                cell_id = f"{row['radio']}_{row['mcc']}_{row['net']}_{row['area']}_{row['cell']}"

                # Deduplicate by cell ID
                if cell_id not in seen_cells:
                    seen_cells.add(cell_id)

                    # Map MCC/MNC to operators
                    mcc_mnc = f"{row['mcc']}-{row['net']}"
                    operator_map = {
                        '310-260': 'T-Mobile',
                        '310-410': 'AT&T',
                        '311-480': 'Verizon',
                        '310-120': 'Sprint',
                        '310-150': 'AT&T',
                        '310-170': 'T-Mobile',
                        '310-380': 'AT&T',
                        '310-410': 'AT&T',
                        '310-560': 'AT&T',
                        '310-680': 'AT&T',
                        '311-480': 'Verizon',
                        '311-490': 'Verizon',
                    }
                    operator = operator_map.get(mcc_mnc, 'Unknown')

                    tower = {
                        'id': cell_id,
                        'radio': row['radio'],
                        'mcc': row['mcc'],
                        'mnc': row['net'],
                        'operator': operator,
                        'lat': lat,
                        'lng': lng,
                        'range': int(row.get('range', 1000)),
                        'samples': int(row.get('samples', 0))
                    }
                    towers.append(tower)
        except (ValueError, KeyError) as e:
            continue

print(f"✅ Filtered {len(towers)} cell towers in NYC region")

# Save filtered data
with open('cell_towers_filtered.json', 'w') as f:
    json.dump(towers, f, indent=2)

PYTHON

else
    # Generate synthetic cell tower data for demo
    echo ""
    echo "🔄 Step 2: Generating synthetic cell tower data..."

    python3 << 'PYTHON'
import json
import random

# Generate realistic synthetic cell towers for NYC
# Based on typical cell tower density: ~1 tower per 2-4 city blocks

towers = []
tower_id = 1000

# NYC grid: roughly 0.002 degrees per block
# Generate towers in a grid pattern with some randomness

operators = [
    {'name': 'Verizon', 'mcc': '311', 'mnc': '480', 'weight': 0.35},
    {'name': 'AT&T', 'mcc': '310', 'mnc': '410', 'weight': 0.30},
    {'name': 'T-Mobile', 'mcc': '310', 'mnc': '260', 'weight': 0.25},
    {'name': 'Sprint', 'mcc': '310', 'mnc': '120', 'weight': 0.10},
]

radio_types = ['LTE', '5G', 'UMTS', 'GSM']
radio_weights = [0.50, 0.30, 0.15, 0.05]

# NYC regions with different tower densities
regions = [
    # Manhattan (high density)
    {'lat_min': 40.7000, 'lat_max': 40.8000, 'lng_min': -74.0200, 'lng_max': -73.9500, 'density': 0.003},
    # Brooklyn (medium density)
    {'lat_min': 40.6000, 'lat_max': 40.7000, 'lng_min': -74.0200, 'lng_max': -73.8500, 'density': 0.005},
    # Queens (medium density)
    {'lat_min': 40.6500, 'lat_max': 40.7500, 'lng_min': -73.9500, 'lng_max': -73.7500, 'density': 0.005},
    # Bronx (lower density)
    {'lat_min': 40.8000, 'lat_max': 40.9000, 'lng_min': -73.9500, 'lng_max': -73.8000, 'density': 0.006},
]

print("Generating synthetic cell towers for NYC...")

for region in regions:
    lat = region['lat_min']
    while lat < region['lat_max']:
        lng = region['lng_min']
        while lng < region['lng_max']:
            # Add some randomness to tower placement
            if random.random() < 0.7:  # 70% chance of tower at this location
                # Randomly select operator
                operator = random.choices(operators, weights=[o['weight'] for o in operators])[0]

                # Randomly select radio type
                radio = random.choices(radio_types, weights=radio_weights)[0]

                # Add position jitter
                tower_lat = lat + random.uniform(-region['density']/2, region['density']/2)
                tower_lng = lng + random.uniform(-region['density']/2, region['density']/2)

                # Tower range depends on radio type
                range_map = {'5G': 500, 'LTE': 2000, 'UMTS': 3000, 'GSM': 5000}
                tower_range = range_map[radio] + random.randint(-200, 200)

                tower = {
                    'id': f"{radio}_{operator['mcc']}_{operator['mnc']}_{tower_id}",
                    'radio': radio,
                    'mcc': operator['mcc'],
                    'mnc': operator['mnc'],
                    'operator': operator['name'],
                    'lat': round(tower_lat, 6),
                    'lng': round(tower_lng, 6),
                    'range': tower_range,
                    'samples': random.randint(100, 10000)
                }
                towers.append(tower)
                tower_id += 1

            lng += region['density']
        lat += region['density']

print(f"✅ Generated {len(towers)} synthetic cell towers")

# Save synthetic data
with open('cell_towers_filtered.json', 'w') as f:
    json.dump(towers, f, indent=2)

PYTHON

fi

echo ""
echo "📊 Cell tower statistics:"
cat cell_towers_filtered.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'   Total towers: {len(data)}')
print(f'   Radio types: {len(set(t[\"radio\"] for t in data))}')
print(f'   Operators: {len(set(t[\"operator\"] for t in data))}')
"
echo ""

# Step 3: Convert to GeoJSON
echo "🔄 Step 3: Converting to GeoJSON..."

python3 << 'PYTHON'
import json

with open('cell_towers_filtered.json', 'r') as f:
    towers = json.load(f)

# Assign colors and significance scores
color_map = {
    'Verizon': '#EE0000',
    'AT&T': '#0099FF',
    'T-Mobile': '#E20074',
    'Sprint': '#FFD400',
    'Unknown': '#888888'
}

radio_significance = {
    '5G': 90,
    'LTE': 70,
    'UMTS': 40,
    'GSM': 20
}

features = []
for tower in towers:
    # Intelligence metadata
    significance = radio_significance.get(tower['radio'], 50)
    if tower['range'] > 3000:
        significance += 10  # Larger range = more significant for SIGINT

    feature = {
        "type": "Feature",
        "id": tower['id'],
        "properties": {
            "id": tower['id'],
            "intel_category": "SIGINT",
            "intel_type": "Communications Infrastructure",
            "operator": tower['operator'],
            "radio": tower['radio'],
            "mcc": tower['mcc'],
            "mnc": tower['mnc'],
            "range_meters": tower['range'],
            "coverage_area_sqkm": round(3.14159 * (tower['range']/1000)**2, 2),
            "samples": tower['samples'],
            "significance_score": min(significance, 100),
            "surveillance_notes": f"{tower['radio']} tower operated by {tower['operator']}. Range: {tower['range']}m",
            "color": color_map.get(tower['operator'], '#888888')
        },
        "geometry": {
            "type": "Point",
            "coordinates": [tower['lng'], tower['lat']]
        }
    }
    features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open('cell-towers-usa.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"✅ Created GeoJSON with {len(features)} cell tower features")
PYTHON

echo ""

# Step 4: Generate PMTiles
echo "🔨 Step 4: Generating PMTiles with tippecanoe..."
echo "   Zoom levels: 8-16 (city to street level)"
echo ""

tippecanoe \
  --output="$PMTILES_FILE" \
  --force \
  --maximum-zoom=16 \
  --minimum-zoom=8 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --layer=cell-towers \
  --name="Cell Towers (SIGINT)" \
  --attribution="© OpenCellID / Synthetic Demo Data" \
  cell-towers-usa.geojson

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

echo "✨ SUCCESS! Cell Towers PMTiles ready at:"
echo "   $PMTILES_FILE"
echo ""
du -h "$PMTILES_FILE"
echo ""
echo "📡 SIGINT Intelligence Layer:"
echo "   - Cell tower locations with operator information"
echo "   - Coverage range estimates for signal correlation"
echo "   - Ready for timeline event correlation"
echo ""
if [ "$USE_REAL_DATA" = false ]; then
    echo "⚠️  NOTE: Using synthetic demo data"
    echo "   For production, download real OpenCellID data:"
    echo "   https://opencellid.org/downloads.php"
    echo ""
fi
