#!/usr/bin/env python3
"""
Process real NASA GPM precipitation data from NetCDF files
Creates weather patterns for ground station impact analysis
"""

import os
import glob
import pandas as pd
import numpy as np
from datetime import datetime
import json

# Check if netCDF4 is available, install if needed
try:
    import netCDF4 as nc
except ImportError:
    print("Installing netCDF4...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'netCDF4'])
    import netCDF4 as nc

def process_gpm_files():
    """Process all GPM NetCDF files and extract precipitation data"""
    
    precip_dir = "data/raw/precipitation"
    nc_files = sorted(glob.glob(os.path.join(precip_dir, "*.nc4")))
    
    print(f"🌧️  Processing {len(nc_files)} NASA GPM precipitation files...")
    print("=" * 60)
    
    all_data = []
    
    for i, nc_file in enumerate(nc_files):
        # Extract date from filename
        filename = os.path.basename(nc_file)
        date_str = filename.split('.')[4].split('-')[0]  # YYYYMMDD
        year = int(date_str[:4])
        month = int(date_str[4:6])
        
        print(f"\n📁 Processing {year}-{month:02d}...")
        
        try:
            # Open NetCDF file
            dataset = nc.Dataset(nc_file, 'r')
            
            # Get precipitation data
            # GPM IMERG precipitation is in mm/hour, we need monthly total
            precip = dataset.variables['precipitation'][:]
            lat = dataset.variables['lat'][:]
            lon = dataset.variables['lon'][:]
            
            # Create a grid of lat/lon
            lon_grid, lat_grid = np.meshgrid(lon, lat)
            
            # Sample key regions for ground station analysis
            regions = [
                {"name": "Northern_Europe", "lat_min": 50, "lat_max": 70, "lon_min": -10, "lon_max": 30},
                {"name": "Southeast_Asia", "lat_min": -10, "lat_max": 20, "lon_min": 90, "lon_max": 130},
                {"name": "Sub_Saharan_Africa", "lat_min": -20, "lat_max": 10, "lon_min": -20, "lon_max": 50},
                {"name": "South_America", "lat_min": -30, "lat_max": 0, "lon_min": -80, "lon_max": -40},
                {"name": "North_America", "lat_min": 30, "lat_max": 50, "lon_min": -120, "lon_max": -80},
                {"name": "Australia", "lat_min": -40, "lat_max": -20, "lon_min": 120, "lon_max": 150},
                {"name": "Middle_East", "lat_min": 20, "lat_max": 40, "lon_min": 30, "lon_max": 60},
                {"name": "Central_Asia", "lat_min": 35, "lat_max": 55, "lon_min": 60, "lon_max": 90},
                {"name": "India_Subcontinent", "lat_min": 10, "lat_max": 30, "lon_min": 70, "lon_max": 90},
                {"name": "Eastern_Europe", "lat_min": 45, "lat_max": 60, "lon_min": 20, "lon_max": 40}
            ]
            
            # Extract regional precipitation statistics
            for region in regions:
                # Find indices for region
                lat_mask = (lat >= region['lat_min']) & (lat <= region['lat_max'])
                lon_mask = (lon >= region['lon_min']) & (lon <= region['lon_max'])
                
                # Extract regional precipitation
                regional_precip = precip[0, lat_mask, :][:, lon_mask]
                
                # Calculate statistics
                mean_precip = np.nanmean(regional_precip)
                max_precip = np.nanmax(regional_precip)
                std_precip = np.nanstd(regional_precip)
                
                # Find hotspots (areas with extreme precipitation)
                threshold_high = mean_precip + 2 * std_precip
                threshold_low = mean_precip - 1.5 * std_precip
                
                # Get center coordinates for region
                center_lat = (region['lat_min'] + region['lat_max']) / 2
                center_lon = (region['lon_min'] + region['lon_max']) / 2
                
                # Store data
                all_data.append({
                    'year': year,
                    'month': month,
                    'region': region['name'],
                    'center_lat': center_lat,
                    'center_lon': center_lon,
                    'mean_precipitation_mm': mean_precip * 24 * 30,  # Convert to monthly
                    'max_precipitation_mm': max_precip * 24 * 30,
                    'std_precipitation_mm': std_precip * 24 * 30,
                    'extreme_threshold_high': threshold_high * 24 * 30,
                    'extreme_threshold_low': threshold_low * 24 * 30
                })
            
            dataset.close()
            print(f"  ✓ Processed {len(regions)} regions")
            
        except Exception as e:
            print(f"  ❌ Error processing {nc_file}: {str(e)}")
            continue
    
    # Convert to DataFrame
    df = pd.DataFrame(all_data)
    
    # Save processed data
    output_path = "data/raw/gpm_precipitation_processed.parquet"
    df.to_parquet(output_path, index=False)
    
    print(f"\n✅ Processed precipitation data saved to: {output_path}")
    print(f"   Total records: {len(df)}")
    print(f"   Time range: {df['year'].min()}-{df['month'].min():02d} to {df['year'].max()}-{df['month'].max():02d}")
    
    return df


def create_weather_patterns_from_gpm(df):
    """Create weather patterns from processed GPM data"""
    
    print("\n🌧️  Creating weather patterns from real GPM data...")
    
    weather_patterns = []
    
    # Calculate long-term averages for anomaly detection
    monthly_avg = df.groupby(['region', 'month'])['mean_precipitation_mm'].mean().reset_index()
    monthly_avg.columns = ['region', 'month', 'avg_precipitation']
    
    # Merge with original data
    df = df.merge(monthly_avg, on=['region', 'month'])
    
    # Calculate anomalies
    df['anomaly_percent'] = ((df['mean_precipitation_mm'] - df['avg_precipitation']) / df['avg_precipitation'] * 100)
    
    # Create weather patterns for extreme events
    for _, row in df.iterrows():
        # Heavy precipitation events
        if row['mean_precipitation_mm'] > row['extreme_threshold_high']:
            weather_patterns.append({
                'pattern_id': f"gpm_heavy_{row['region']}_{row['year']}_{row['month']:02d}",
                'pattern_type': 'heavy_precipitation',
                'data_source': 'NASA_GPM_IMERG',
                'severity': 'severe' if row['anomaly_percent'] > 100 else 'moderate',
                'region_name': row['region'].replace('_', ' '),
                'latitude': row['center_lat'],
                'longitude': row['center_lon'],
                'year': row['year'],
                'month': row['month'],
                'precipitation_mm': round(row['mean_precipitation_mm'], 1),
                'max_precipitation_mm': round(row['max_precipitation_mm'], 1),
                'anomaly_percent': round(row['anomaly_percent'], 1),
                'impact_radius_km': 500,
                'typical_downtime_hours': 48 if row['anomaly_percent'] > 100 else 24,
                'impact_description': f"Heavy rainfall {row['mean_precipitation_mm']:.0f}mm ({row['anomaly_percent']:.0f}% above normal)"
            })
        
        # Drought conditions
        elif row['mean_precipitation_mm'] < row['extreme_threshold_low'] and row['anomaly_percent'] < -30:
            weather_patterns.append({
                'pattern_id': f"gpm_drought_{row['region']}_{row['year']}_{row['month']:02d}",
                'pattern_type': 'drought',
                'data_source': 'NASA_GPM_IMERG',
                'severity': 'severe' if row['anomaly_percent'] < -50 else 'moderate',
                'region_name': row['region'].replace('_', ' '),
                'latitude': row['center_lat'],
                'longitude': row['center_lon'],
                'year': row['year'],
                'month': row['month'],
                'precipitation_mm': round(row['mean_precipitation_mm'], 1),
                'anomaly_percent': round(row['anomaly_percent'], 1),
                'impact_radius_km': 1000,
                'typical_downtime_hours': 12,  # Dust storms
                'impact_description': f"Drought conditions {row['mean_precipitation_mm']:.0f}mm ({abs(row['anomaly_percent']):.0f}% below normal)"
            })
    
    # Convert to DataFrame
    weather_df = pd.DataFrame(weather_patterns)
    
    # Save weather patterns
    output_path = "data/raw/weather_patterns_gpm_real.parquet"
    weather_df.to_parquet(output_path, index=False)
    
    print(f"\n✅ Weather patterns created from real GPM data:")
    print(f"   Total patterns: {len(weather_df)}")
    print(f"   Heavy precipitation events: {len(weather_df[weather_df['pattern_type'] == 'heavy_precipitation'])}")
    print(f"   Drought conditions: {len(weather_df[weather_df['pattern_type'] == 'drought'])}")
    print(f"   Saved to: {output_path}")
    
    # Create summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "data_source": "NASA GPM IMERG (Real Data)",
        "files_processed": len(glob.glob("data/raw/precipitation/*.nc4")),
        "weather_patterns": {
            "total": len(weather_df),
            "by_type": weather_df['pattern_type'].value_counts().to_dict(),
            "by_severity": weather_df['severity'].value_counts().to_dict() if 'severity' in weather_df.columns else {}
        },
        "geographic_coverage": {
            "regions": list(weather_df['region_name'].unique()),
            "time_range": f"{df['year'].min()}-{df['month'].min():02d} to {df['year'].max()}-{df['month'].max():02d}"
        },
        "notes": [
            "Processed from real NASA GPM IMERG monthly precipitation data",
            "Weather patterns based on statistical anomalies",
            "Ready for integration with ground station network"
        ]
    }
    
    with open("data/raw/weather_patterns_gpm_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    return weather_df


def main():
    """Process real GPM precipitation data"""
    
    print("🚀 Processing Real NASA GPM Precipitation Data")
    print("=" * 60)
    
    # Process NetCDF files
    processed_df = process_gpm_files()
    
    # Create weather patterns
    weather_patterns = create_weather_patterns_from_gpm(processed_df)
    
    # Show sample results
    print("\n📊 Sample Weather Patterns:")
    print("-" * 60)
    
    # Show a few heavy precipitation events
    heavy = weather_patterns[weather_patterns['pattern_type'] == 'heavy_precipitation'].head(3)
    for _, pattern in heavy.iterrows():
        print(f"\n🌧️  Heavy Precipitation Event:")
        print(f"   Location: {pattern['region_name']} ({pattern['latitude']:.1f}, {pattern['longitude']:.1f})")
        print(f"   Date: {pattern['year']}-{pattern['month']:02d}")
        print(f"   Precipitation: {pattern['precipitation_mm']:.0f}mm (max: {pattern.get('max_precipitation_mm', 'N/A')}mm)")
        print(f"   Anomaly: {pattern['anomaly_percent']:.0f}% above normal")
        print(f"   Impact: {pattern['typical_downtime_hours']} hours downtime expected")
    
    print("\n✅ Real precipitation data processing complete!")
    print("\nNext steps:")
    print("1. Run the main pipeline to integrate weather patterns")
    print("2. Weather impacts will be matched to ground stations")
    print("3. View results in GraphXR visualization")


if __name__ == "__main__":
    main()