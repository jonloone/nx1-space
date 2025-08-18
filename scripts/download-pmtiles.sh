#!/bin/bash

# Script to download Overture PMTiles locally for caching
# This improves performance and enables offline support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Downloading Overture PMTiles for Local Caching ===${NC}"
echo ""

# Create directory for PMTiles
PMTILES_DIR="/mnt/blockstorage/nx1-space/frontend/public/pmtiles"
mkdir -p "$PMTILES_DIR"

# Overture PMTiles URLs (2024-08-20 release)
BASE_URL="https://overturemaps-tiles-us-west-2-beta.s3.amazonaws.com/2024-08-20"

# Files to download (with size estimates)
declare -A PMTILES_FILES=(
  ["base.pmtiles"]="15MB"
  ["buildings.pmtiles"]="20MB"
  ["places.pmtiles"]="10MB"
  ["transportation.pmtiles"]="18MB"
)

echo -e "${YELLOW}PMTiles to download:${NC}"
for file in "${!PMTILES_FILES[@]}"; do
  echo "  • $file (~${PMTILES_FILES[$file]})"
done
echo ""

# Total estimated size
echo -e "${YELLOW}Total estimated size: ~63MB${NC}"
echo ""

# Download each PMTiles file
for file in "${!PMTILES_FILES[@]}"; do
  echo -e "${YELLOW}Downloading $file...${NC}"
  
  if [ -f "$PMTILES_DIR/$file" ]; then
    echo -e "${GREEN}  ✓ Already exists, skipping${NC}"
  else
    # Download with progress bar
    wget --progress=bar:force \
         --timeout=60 \
         --tries=3 \
         -O "$PMTILES_DIR/$file" \
         "$BASE_URL/$file" 2>&1 | \
         grep --line-buffered "%" | \
         sed -u -e "s,.*\([0-9]\+%\).*,  Progress: \1,"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}  ✓ Downloaded successfully${NC}"
      
      # Get actual file size
      size=$(du -h "$PMTILES_DIR/$file" | cut -f1)
      echo -e "${GREEN}  Size: $size${NC}"
    else
      echo -e "${RED}  ✗ Download failed${NC}"
      rm -f "$PMTILES_DIR/$file"
    fi
  fi
  echo ""
done

# Create an index file for the PMTiles
echo -e "${YELLOW}Creating PMTiles index...${NC}"
cat > "$PMTILES_DIR/index.json" << EOF
{
  "version": "1.0.0",
  "release": "2024-08-20",
  "tiles": {
    "base": "/pmtiles/base.pmtiles",
    "buildings": "/pmtiles/buildings.pmtiles",
    "places": "/pmtiles/places.pmtiles",
    "transportation": "/pmtiles/transportation.pmtiles"
  },
  "local": true,
  "cached": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "${GREEN}✓ Index created${NC}"
echo ""

# Summary
echo -e "${BLUE}=== Download Complete ===${NC}"
echo ""
echo -e "${GREEN}PMTiles location:${NC} $PMTILES_DIR"
echo -e "${GREEN}Files downloaded:${NC}"
ls -lh "$PMTILES_DIR"/*.pmtiles 2>/dev/null | awk '{print "  • " $9 " (" $5 ")"}'
echo ""

# Calculate total size
total_size=$(du -sh "$PMTILES_DIR" | cut -f1)
echo -e "${GREEN}Total size:${NC} $total_size"
echo ""

echo -e "${YELLOW}Note:${NC} PMTiles are now available locally at /pmtiles/"
echo "The service worker will cache and serve these files for offline support."
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Update GeoCoreMap.tsx to use local PMTiles URLs"
echo "2. Enable service worker with: NEXT_PUBLIC_ENABLE_SW=true"
echo "3. Test offline functionality"