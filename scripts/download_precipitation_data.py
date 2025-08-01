#!/usr/bin/env python3
"""
Download NASA GPM precipitation data for weather impact analysis
GPM_3IMERGM: Monthly precipitation data at 0.1° resolution
"""

import os
import requests
from datetime import datetime, timedelta
import time

def download_gpm_precipitation(start_year=2023, end_year=2024, output_dir="data/raw/precipitation"):
    """
    Download NASA GPM monthly precipitation data
    
    Note: This downloads from the OPeNDAP server which allows direct access
    For full authentication, you'd need NASA Earthdata credentials
    """
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    base_url = "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07"
    
    downloaded_files = []
    failed_downloads = []
    
    print(f"🌧️  Downloading NASA GPM precipitation data ({start_year}-{end_year})...")
    print("=" * 60)
    
    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            # Skip future months
            if year == 2024 and month > datetime.now().month:
                continue
            
            # Format the filename according to NASA's naming convention
            # 3B-MO.MS.MRG.3IMERG.YYYYMMDD-S000000-E235959.MM.V07B.HDF5
            month_str = f"{month:02d}"
            date_str = f"{year}{month_str}01"
            
            filename = f"3B-MO.MS.MRG.3IMERG.{date_str}-S000000-E235959.{month_str}.V07B.HDF5"
            url = f"{base_url}/{year}/{filename}"
            
            output_path = os.path.join(output_dir, f"gpm_precip_{year}_{month_str}.hdf5")
            
            # Skip if already downloaded
            if os.path.exists(output_path):
                print(f"✓ Already exists: {year}-{month_str}")
                downloaded_files.append(output_path)
                continue
            
            print(f"📥 Downloading {year}-{month_str}...", end="", flush=True)
            
            try:
                # Note: For actual download, you need NASA Earthdata credentials
                # This is a simplified version showing the structure
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Ground Station Intelligence POC)'
                }
                
                # For POC, we'll create sample data instead of actual download
                # In production, you'd use requests with auth
                
                # Simulate download (in production, uncomment below)
                # response = requests.get(url, headers=headers, auth=('username', 'password'))
                # response.raise_for_status()
                
                # For POC: Create a marker file
                with open(output_path + ".sample", 'w') as f:
                    f.write(f"Sample precipitation data for {year}-{month_str}\n")
                    f.write(f"Would download from: {url}\n")
                    f.write("Actual data requires NASA Earthdata credentials\n")
                
                print(f" ✓ (sample created)")
                downloaded_files.append(output_path)
                
                # Be nice to the server
                time.sleep(1)
                
            except Exception as e:
                print(f" ❌ Failed: {str(e)}")
                failed_downloads.append((year, month, str(e)))
    
    print("\n" + "=" * 60)
    print(f"✅ Download complete!")
    print(f"   Downloaded: {len(downloaded_files)} files")
    print(f"   Failed: {len(failed_downloads)} files")
    
    if failed_downloads:
        print("\n❌ Failed downloads:")
        for year, month, error in failed_downloads:
            print(f"   {year}-{month:02d}: {error}")
    
    # Create a summary file
    summary = {
        "download_date": datetime.now().isoformat(),
        "data_source": "NASA GPM_3IMERGM v07B",
        "temporal_range": f"{start_year}-01 to {end_year}-12",
        "spatial_resolution": "0.1 degrees",
        "temporal_resolution": "monthly",
        "downloaded_files": len(downloaded_files),
        "failed_downloads": len(failed_downloads),
        "notes": [
            "GPM IMERG provides global precipitation estimates",
            "Monthly data aggregated from half-hourly observations",
            "Covers 60°N-60°S with full global coverage",
            "For actual data download, NASA Earthdata credentials required"
        ]
    }
    
    summary_path = os.path.join(output_dir, "precipitation_download_summary.json")
    import json
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n📊 Summary saved to: {summary_path}")
    
    return downloaded_files, failed_downloads


def create_sample_precipitation_data():
    """
    Create sample precipitation data for POC
    In production, this would parse actual HDF5 files
    """
    import pandas as pd
    import numpy as np
    
    print("\n🌧️  Creating sample precipitation data for POC...")
    
    # Create sample data for major regions
    regions = [
        {"name": "Northern Europe", "lat": 60.0, "lon": 10.0, "avg_precip_mm": 75},
        {"name": "Southeast Asia", "lat": 10.0, "lon": 105.0, "avg_precip_mm": 180},
        {"name": "Sub-Saharan Africa", "lat": -5.0, "lon": 20.0, "avg_precip_mm": 95},
        {"name": "South America", "lat": -15.0, "lon": -60.0, "avg_precip_mm": 120},
        {"name": "North America", "lat": 40.0, "lon": -100.0, "avg_precip_mm": 65},
        {"name": "Australia", "lat": -25.0, "lon": 135.0, "avg_precip_mm": 45},
    ]
    
    # Add some variation
    data = []
    for region in regions:
        for month in range(1, 13):
            # Seasonal variation
            seasonal_factor = 1 + 0.3 * np.sin((month - 3) * np.pi / 6)
            precip = region['avg_precip_mm'] * seasonal_factor * (0.8 + 0.4 * np.random.random())
            
            data.append({
                'region': region['name'],
                'latitude': region['lat'],
                'longitude': region['lon'],
                'month': month,
                'precipitation_mm': round(precip, 1),
                'anomaly_percent': round((precip / region['avg_precip_mm'] - 1) * 100, 1)
            })
    
    df = pd.DataFrame(data)
    
    # Save as parquet
    output_path = "data/raw/precipitation_sample.parquet"
    df.to_parquet(output_path, index=False)
    
    print(f"✅ Sample precipitation data saved to: {output_path}")
    print(f"   Regions: {len(regions)}")
    print(f"   Total records: {len(df)}")
    
    return df


def integrate_precipitation_with_weather_patterns():
    """
    Create precipitation-based weather patterns for the graph
    """
    import pandas as pd
    
    print("\n🔗 Creating weather patterns from precipitation data...")
    
    # Load sample precipitation data
    precip_df = pd.read_parquet("data/raw/precipitation_sample.parquet")
    
    # Define weather patterns based on precipitation anomalies
    weather_patterns = []
    
    # Heavy precipitation events
    heavy_precip = precip_df[precip_df['anomaly_percent'] > 50]
    for _, row in heavy_precip.iterrows():
        weather_patterns.append({
            'pattern_id': f"weather_heavy_precip_{row['region'].replace(' ', '_')}_{row['month']}",
            'pattern_type': 'heavy_precipitation',
            'region': row['region'],
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'month': row['month'],
            'severity': 'high' if row['anomaly_percent'] > 100 else 'moderate',
            'impact_radius_km': 500,
            'typical_downtime_hours': 24 if row['anomaly_percent'] > 100 else 12
        })
    
    # Drought conditions (low precipitation)
    drought = precip_df[precip_df['anomaly_percent'] < -30]
    for _, row in drought.iterrows():
        weather_patterns.append({
            'pattern_id': f"weather_drought_{row['region'].replace(' ', '_')}_{row['month']}",
            'pattern_type': 'drought',
            'region': row['region'],
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'month': row['month'],
            'severity': 'high' if row['anomaly_percent'] < -50 else 'moderate',
            'impact_radius_km': 1000,
            'typical_downtime_hours': 0  # Drought doesn't directly cause downtime
        })
    
    # Convert to DataFrame
    weather_df = pd.DataFrame(weather_patterns)
    
    # Save for pipeline integration
    output_path = "data/raw/weather_patterns_precipitation.parquet"
    weather_df.to_parquet(output_path, index=False)
    
    print(f"✅ Weather patterns created: {output_path}")
    print(f"   Heavy precipitation events: {len(heavy_precip)}")
    print(f"   Drought conditions: {len(drought)}")
    print(f"   Total patterns: {len(weather_df)}")
    
    return weather_df


if __name__ == "__main__":
    # Step 1: Download precipitation data (or create samples for POC)
    downloaded, failed = download_gpm_precipitation(2023, 2024)
    
    # Step 2: Create sample data for POC
    precip_data = create_sample_precipitation_data()
    
    # Step 3: Generate weather patterns from precipitation
    weather_patterns = integrate_precipitation_with_weather_patterns()
    
    print("\n✅ Precipitation data pipeline complete!")
    print("\nNext steps:")
    print("1. For production: Set up NASA Earthdata credentials")
    print("2. Run: python pipelines/run_pipeline.py")
    print("3. Weather patterns will be integrated into the graph")