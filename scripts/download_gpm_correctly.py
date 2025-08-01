#!/usr/bin/env python3
"""
Download NASA GPM precipitation data with correct URL structure
"""

import os
import subprocess
import time
from datetime import datetime

def download_gpm_data():
    """Download GPM precipitation data for 2023-2025"""
    
    base_url = "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07"
    output_dir = "data/raw/precipitation"
    os.makedirs(output_dir, exist_ok=True)
    
    # Get current date for limiting downloads
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    downloaded = 0
    failed = 0
    
    print("🌧️  Downloading NASA GPM precipitation data (2023-2025)")
    print("=" * 60)
    
    for year in [2023, 2024, 2025]:
        print(f"\n📅 Year {year}:")
        
        for month in range(1, 13):
            # Skip future months
            if year == current_year and month > current_month:
                break
            if year > current_year:
                break
            
            # Format month with leading zero
            month_str = f"{month:02d}"
            
            # Construct filename using NASA's naming convention
            # Format: 3B-MO.MS.MRG.3IMERG.YYYYMMDD-S000000-E235959.MM.V07B.HDF5
            filename = f"3B-MO.MS.MRG.3IMERG.{year}{month_str}01-S000000-E235959.{month_str}.V07B.HDF5"
            
            # Full URL
            url = f"{base_url}/{year}/{filename}"
            
            # Output filename
            output_file = os.path.join(output_dir, f"gpm_precip_{year}_{month_str}.hdf5")
            
            # Skip if already exists
            if os.path.exists(output_file):
                print(f"  ✓ {year}-{month_str} already exists")
                downloaded += 1
                continue
            
            print(f"  📥 Downloading {year}-{month_str}...", end="", flush=True)
            
            # Try different download methods
            # Method 1: wget with no certificate check (for POC only)
            cmd = [
                "wget", 
                "--no-check-certificate",
                "-q",
                "-O", output_file,
                url
            ]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                # Check if file was downloaded and has content
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(" ✓")
                    downloaded += 1
                else:
                    # Try with .nc4 extension instead
                    nc4_url = url.replace('.HDF5', '.nc4')
                    cmd[4] = nc4_url
                    
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                    
                    if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                        print(" ✓ (nc4)")
                        downloaded += 1
                    else:
                        print(" ❌ (access denied - need NASA Earthdata login)")
                        if os.path.exists(output_file):
                            os.remove(output_file)
                        failed += 1
                
            except subprocess.TimeoutExpired:
                print(" ❌ (timeout)")
                if os.path.exists(output_file):
                    os.remove(output_file)
                failed += 1
            except Exception as e:
                print(f" ❌ ({str(e)})")
                if os.path.exists(output_file):
                    os.remove(output_file)
                failed += 1
            
            # Be polite to the server
            time.sleep(0.5)
    
    print("\n" + "=" * 60)
    print(f"Download summary:")
    print(f"  ✅ Successfully downloaded: {downloaded}")
    print(f"  ❌ Failed: {failed}")
    
    if failed > 0:
        print("\n⚠️  Note: NASA GPM data requires Earthdata authentication")
        print("  1. Create account at: https://urs.earthdata.nasa.gov/")
        print("  2. Configure .netrc file with credentials")
        print("  3. Or use NASA's Earthdata Search interface")
        
        print("\n📊 Creating sample precipitation data for POC...")
        create_sample_precipitation_data()
    
    return downloaded, failed


def create_sample_precipitation_data():
    """Create realistic sample precipitation data for POC"""
    import pandas as pd
    import numpy as np
    import json
    
    # Create sample data based on real precipitation patterns
    print("\n🌧️  Generating sample precipitation data...")
    
    data = []
    
    # Define regions with realistic precipitation patterns
    regions = [
        # Region, lat, lon, base_precip_mm, seasonality
        ("Tropical_Pacific", 0, 180, 250, "wet_dry"),
        ("Southeast_Asia", 10, 110, 200, "monsoon"),
        ("Sahel_Africa", 15, 10, 80, "wet_dry"),
        ("Amazon_Basin", -5, -60, 220, "year_round"),
        ("Northern_Europe", 60, 20, 70, "winter_max"),
        ("US_Midwest", 40, -95, 85, "summer_max"),
        ("Australia_Outback", -25, 135, 35, "irregular"),
        ("India_Monsoon", 20, 80, 150, "monsoon"),
        ("Mediterranean", 40, 15, 65, "winter_max"),
        ("Siberia", 60, 100, 45, "summer_max"),
    ]
    
    # Generate monthly data for each region
    for year in [2023, 2024]:
        for month in range(1, 13):
            for region_name, lat, lon, base_precip, pattern in regions:
                
                # Calculate seasonal variation
                if pattern == "monsoon":
                    # Peak in July-September
                    factor = 2.5 if month in [7, 8, 9] else 0.3
                elif pattern == "wet_dry":
                    # Wet season in summer
                    factor = 1.8 if month in [5, 6, 7, 8] else 0.4
                elif pattern == "winter_max":
                    # Peak in winter months
                    factor = 1.5 if month in [11, 12, 1, 2] else 0.6
                elif pattern == "summer_max":
                    # Peak in summer months
                    factor = 1.6 if month in [6, 7, 8] else 0.5
                elif pattern == "year_round":
                    # Relatively constant
                    factor = 1.0 + 0.2 * np.sin(month * np.pi / 6)
                else:  # irregular
                    factor = 0.5 + np.random.random()
                
                # Add random variation
                precip_mm = base_precip * factor * (0.8 + 0.4 * np.random.random())
                
                # Calculate anomaly from mean
                anomaly = (precip_mm - base_precip) / base_precip * 100
                
                data.append({
                    'year': year,
                    'month': month,
                    'region': region_name,
                    'latitude': lat,
                    'longitude': lon,
                    'precipitation_mm': round(precip_mm, 1),
                    'anomaly_percent': round(anomaly, 1),
                    'pattern_type': pattern,
                    'extreme_event': anomaly > 50 or anomaly < -40
                })
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Save as parquet
    output_path = "data/raw/precipitation_monthly.parquet"
    df.to_parquet(output_path, index=False)
    
    print(f"✅ Sample precipitation data created:")
    print(f"   Regions: {len(regions)}")
    print(f"   Time period: 2023-2024")
    print(f"   Total records: {len(df)}")
    print(f"   Saved to: {output_path}")
    
    # Create summary statistics
    summary = {
        "data_source": "Sample data based on NASA GPM patterns",
        "regions": len(regions),
        "temporal_coverage": "2023-2024 monthly",
        "extreme_events": int(df['extreme_event'].sum()),
        "average_precipitation_mm": float(df['precipitation_mm'].mean()),
        "notes": [
            "Sample data created for POC",
            "Based on realistic precipitation patterns",
            "Includes seasonal variations and extreme events",
            "For production, use actual NASA GPM data with Earthdata credentials"
        ]
    }
    
    with open("data/raw/precipitation/precipitation_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    return df


if __name__ == "__main__":
    # Try to download actual data
    downloaded, failed = download_gpm_data()
    
    print("\n✅ Precipitation data preparation complete!")
    print("\nNext steps:")
    print("1. For real NASA data: Set up Earthdata credentials")
    print("2. Run the pipeline to integrate weather patterns")
    print("3. The data will be used for weather impact analysis")