#!/bin/bash

# Script to download and set up GERS Bridge Files from Overture Maps
# Bridge files map GERS IDs to properties and relationships

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setting up GERS Bridge Files ===${NC}"
echo ""

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p /mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files
mkdir -p /mnt/blockstorage/nx1-space/frontend/public/data/gers/processed

# Base URL for Overture Maps data
OVERTURE_BASE_URL="https://overturemaps-us-west-2.s3.amazonaws.com/release/2024-11-19"

# Download GERS Bridge Files
echo -e "${YELLOW}Downloading GERS Bridge Files...${NC}"
echo ""

# Places Bridge File (contains name→ID mappings for POIs)
echo -e "Downloading places bridge file..."
wget -q --show-progress -O /mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files/places-bridge.parquet \
  "${OVERTURE_BASE_URL}/theme=places/type=place/*/*.parquet" 2>/dev/null || {
    echo -e "${YELLOW}Note: Direct download may require AWS CLI. Using sample data for POC.${NC}"
    # For POC, we'll create sample data
    touch /mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files/places-bridge.parquet
}

# Buildings Bridge File (contains building GERS IDs and properties)
echo -e "Downloading buildings bridge file..."
wget -q --show-progress -O /mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files/buildings-bridge.parquet \
  "${OVERTURE_BASE_URL}/theme=buildings/type=building/*/*.parquet" 2>/dev/null || {
    echo -e "${YELLOW}Note: Direct download may require AWS CLI. Using sample data for POC.${NC}"
    touch /mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files/buildings-bridge.parquet
}

echo ""
echo -e "${GREEN}✓ Bridge file directories created${NC}"

# For POC, create sample GERS data
echo -e "${YELLOW}Creating sample GERS data for POC...${NC}"

# Create sample GERS index JSON
cat > /mnt/blockstorage/nx1-space/frontend/public/data/gers/gers-index.json << 'EOF'
{
  "08f2a5b7c9d3e1f6": {
    "id": "08f2a5b7c9d3e1f6",
    "names": ["Los Angeles International Airport", "LAX", "LAX Airport"],
    "category": "place",
    "subtype": "airport",
    "confidence": 0.99,
    "bbox": [-118.4085, 33.9416, -118.3885, 33.9516]
  },
  "08f2a5b7c9d3e1f7": {
    "id": "08f2a5b7c9d3e1f7",
    "names": ["Port of Los Angeles", "LA Port", "San Pedro Port"],
    "category": "place",
    "subtype": "port",
    "confidence": 0.98,
    "bbox": [-118.2923, 33.7072, -118.2323, 33.7672]
  },
  "08f2a5b7c9d3e1f8": {
    "id": "08f2a5b7c9d3e1f8",
    "names": ["Empire State Building"],
    "category": "building",
    "subtype": "commercial",
    "confidence": 0.99,
    "bbox": [-73.9857, 40.7484, -73.9847, 40.7494],
    "height": 443
  },
  "08f2a5b7c9d3e1f9": {
    "id": "08f2a5b7c9d3e1f9",
    "names": ["Pentagon", "The Pentagon"],
    "category": "building",
    "subtype": "government",
    "confidence": 1.0,
    "bbox": [-77.0562, 38.8704, -77.0532, 38.8734]
  },
  "08f2a5b7c9d3e1fa": {
    "id": "08f2a5b7c9d3e1fa",
    "names": ["Houston Space Center", "Johnson Space Center", "JSC", "NASA JSC"],
    "category": "place",
    "subtype": "government",
    "confidence": 0.97,
    "bbox": [-95.0985, 29.5518, -95.0885, 29.5618]
  },
  "08f2a5b7c9d3e1fb": {
    "id": "08f2a5b7c9d3e1fb",
    "names": ["Port of Houston", "Houston Ship Channel"],
    "category": "place",
    "subtype": "port",
    "confidence": 0.96,
    "bbox": [-95.2789, 29.7481, -95.2189, 29.7681]
  },
  "08f2a5b7c9d3e1fc": {
    "id": "08f2a5b7c9d3e1fc",
    "names": ["Washington Monument"],
    "category": "place",
    "subtype": "monument",
    "confidence": 1.0,
    "bbox": [-77.0353, 38.8893, -77.0343, 38.8903]
  },
  "08f2a5b7c9d3e1fd": {
    "id": "08f2a5b7c9d3e1fd",
    "names": ["JFK Airport", "John F. Kennedy International Airport"],
    "category": "place",
    "subtype": "airport",
    "confidence": 0.99,
    "bbox": [-73.7889, 40.6397, -73.7689, 40.6597]
  }
}
EOF

# Create name-to-ID mapping
cat > /mnt/blockstorage/nx1-space/frontend/public/data/gers/name-to-id.json << 'EOF'
{
  "los angeles international airport": ["08f2a5b7c9d3e1f6"],
  "lax": ["08f2a5b7c9d3e1f6"],
  "lax airport": ["08f2a5b7c9d3e1f6"],
  "port of los angeles": ["08f2a5b7c9d3e1f7"],
  "la port": ["08f2a5b7c9d3e1f7"],
  "san pedro port": ["08f2a5b7c9d3e1f7"],
  "empire state building": ["08f2a5b7c9d3e1f8"],
  "pentagon": ["08f2a5b7c9d3e1f9"],
  "the pentagon": ["08f2a5b7c9d3e1f9"],
  "houston space center": ["08f2a5b7c9d3e1fa"],
  "johnson space center": ["08f2a5b7c9d3e1fa"],
  "jsc": ["08f2a5b7c9d3e1fa"],
  "nasa jsc": ["08f2a5b7c9d3e1fa"],
  "port of houston": ["08f2a5b7c9d3e1fb"],
  "houston ship channel": ["08f2a5b7c9d3e1fb"],
  "washington monument": ["08f2a5b7c9d3e1fc"],
  "jfk airport": ["08f2a5b7c9d3e1fd"],
  "john f. kennedy international airport": ["08f2a5b7c9d3e1fd"]
}
EOF

echo -e "${GREEN}✓ Sample GERS index created${NC}"
echo ""

# Python script to process actual Parquet files when available
cat > /mnt/blockstorage/nx1-space/scripts/convert-gers-bridge.py << 'EOF'
#!/usr/bin/env python3
"""
Convert GERS Bridge Files from Parquet to searchable JSON indices
This will be used when we have actual Overture data
"""

import json
import os
import sys

try:
    import pandas as pd
    import pyarrow.parquet as pq
except ImportError:
    print("Installing required packages...")
    os.system("pip install pandas pyarrow")
    import pandas as pd
    import pyarrow.parquet as pq

def process_gers_bridge():
    """
    Convert GERS bridge files to searchable JSON index
    Bridge files contain: GERS ID ↔ names, categories, relationships
    """
    
    bridge_dir = "/mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files"
    output_dir = "/mnt/blockstorage/nx1-space/frontend/public/data/gers"
    
    # Check if we have actual Parquet files
    places_file = os.path.join(bridge_dir, "places-bridge.parquet")
    buildings_file = os.path.join(bridge_dir, "buildings-bridge.parquet")
    
    if not os.path.exists(places_file) or os.path.getsize(places_file) == 0:
        print("No actual Parquet files found. Using sample data.")
        return
    
    print("Processing GERS Bridge Files...")
    
    # Load places bridge file
    places_df = pd.read_parquet(places_file)
    
    # Create searchable index
    gers_index = {}
    name_to_id = {}
    
    for _, row in places_df.iterrows():
        gers_id = row.get('id', '')
        
        # Extract all names (primary and alternates)
        names = []
        if 'names' in row and row['names']:
            if isinstance(row['names'], dict):
                # Handle different name structures
                if 'primary' in row['names']:
                    names.append(row['names']['primary'])
                if 'common' in row['names']:
                    names.extend(row['names']['common'])
            elif isinstance(row['names'], list):
                names = row['names']
            elif isinstance(row['names'], str):
                names = [row['names']]
        
        # Create entity entry
        gers_index[gers_id] = {
            'id': gers_id,
            'names': names,
            'category': row.get('category', ''),
            'subtype': row.get('subtype', ''),
            'confidence': row.get('confidence', 1.0),
            'geometry': row.get('geometry', None)
        }
        
        # Build reverse index for search
        for name in names:
            name_lower = name.lower()
            if name_lower not in name_to_id:
                name_to_id[name_lower] = []
            name_to_id[name_lower].append(gers_id)
    
    # Save as JSON
    with open(os.path.join(output_dir, 'gers-index.json'), 'w') as f:
        json.dump(gers_index, f, indent=2)
    
    with open(os.path.join(output_dir, 'name-to-id.json'), 'w') as f:
        json.dump(name_to_id, f, indent=2)
    
    print(f"Processed {len(gers_index)} GERS entities")
    print(f"Indexed {len(name_to_id)} unique names")

if __name__ == "__main__":
    process_gers_bridge()
EOF

chmod +x /mnt/blockstorage/nx1-space/scripts/convert-gers-bridge.py

echo ""
echo -e "${BLUE}=== GERS Bridge Files Setup Complete ===${NC}"
echo ""
echo -e "${GREEN}Created:${NC}"
echo "  • GERS index at: /frontend/public/data/gers/gers-index.json"
echo "  • Name mapping at: /frontend/public/data/gers/name-to-id.json"
echo "  • Conversion script at: /scripts/convert-gers-bridge.py"
echo ""
echo -e "${YELLOW}Note:${NC} Sample data created for POC. To use real Overture data:"
echo "  1. Install AWS CLI: aws configure"
echo "  2. Download actual Parquet files from Overture S3"
echo "  3. Run: python /scripts/convert-gers-bridge.py"
echo ""
echo -e "${GREEN}You can now use GERS entities in your application!${NC}"