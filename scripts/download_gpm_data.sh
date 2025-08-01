#!/bin/bash
# Download NASA GPM precipitation data for 2023-2025

echo "🌧️  Downloading NASA GPM precipitation data (2023-2025)"
echo "======================================================="

# Base URL
BASE_URL="https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07"
OUTPUT_DIR="data/raw/precipitation"

# Create output directory
mkdir -p $OUTPUT_DIR

# Function to download a month's data
download_month() {
    YEAR=$1
    MONTH=$2
    MONTH_PADDED=$(printf "%02d" $MONTH)
    
    FILENAME="3B-MO.MS.MRG.3IMERG.${YEAR}${MONTH_PADDED}01-S000000-E235959.${MONTH_PADDED}.V07B.HDF5"
    URL="${BASE_URL}/${YEAR}/${FILENAME}"
    OUTPUT_FILE="${OUTPUT_DIR}/gpm_precip_${YEAR}_${MONTH_PADDED}.hdf5"
    
    if [ -f "$OUTPUT_FILE" ]; then
        echo "✓ Already exists: ${YEAR}-${MONTH_PADDED}"
    else
        echo -n "📥 Downloading ${YEAR}-${MONTH_PADDED}... "
        wget -q -O "$OUTPUT_FILE" "$URL" 2>/dev/null
        
        if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
            echo "✓"
        else
            echo "❌ Failed"
            rm -f "$OUTPUT_FILE"
        fi
    fi
}

# Download 2023 data
echo -e "\n📅 Downloading 2023 data..."
for month in {1..12}; do
    download_month 2023 $month
    sleep 1  # Be nice to the server
done

# Download 2024 data
echo -e "\n📅 Downloading 2024 data..."
CURRENT_MONTH=$(date +%m | sed 's/^0//')
CURRENT_YEAR=$(date +%Y)

if [ "$CURRENT_YEAR" -gt "2024" ]; then
    END_MONTH=12
else
    END_MONTH=$CURRENT_MONTH
fi

for month in $(seq 1 $END_MONTH); do
    download_month 2024 $month
    sleep 1
done

# Download 2025 data (if we're in 2025)
if [ "$CURRENT_YEAR" -eq "2025" ]; then
    echo -e "\n📅 Downloading 2025 data..."
    for month in $(seq 1 $CURRENT_MONTH); do
        download_month 2025 $month
        sleep 1
    done
fi

# Count downloaded files
DOWNLOADED=$(ls -1 $OUTPUT_DIR/*.hdf5 2>/dev/null | wc -l)

echo -e "\n======================================================="
echo "✅ Download complete!"
echo "   Downloaded files: $DOWNLOADED"
echo "   Location: $OUTPUT_DIR"
echo ""
echo "Note: If downloads failed, you may need:"
echo "1. NASA Earthdata credentials"
echo "2. Configure wget with .netrc file"
echo "3. Or use the NASA Earthdata download tool"