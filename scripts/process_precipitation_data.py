#!/usr/bin/env python3
"""
Process precipitation data and create weather patterns for the graph
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json

def process_precipitation_data():
    """Process precipitation data to create weather impact patterns"""
    
    print("🌧️  Processing precipitation data for weather patterns...")
    
    # Load the sample precipitation data
    precip_df = pd.read_parquet("data/raw/precipitation_monthly.parquet")
    
    print(f"✅ Loaded precipitation data:")
    print(f"   Records: {len(precip_df)}")
    print(f"   Regions: {precip_df['region'].nunique()}")
    print(f"   Time range: {precip_df['year'].min()}-{precip_df['year'].max()}")
    
    # Create weather patterns based on precipitation anomalies
    weather_patterns = []
    
    # 1. Heavy precipitation events (flooding risk)
    heavy_precip = precip_df[precip_df['anomaly_percent'] > 50].copy()
    for _, row in heavy_precip.iterrows():
        weather_patterns.append({
            'pattern_id': f"precip_heavy_{row['region']}_{row['year']}_{row['month']:02d}",
            'pattern_type': 'heavy_precipitation',
            'severity': 'severe' if row['anomaly_percent'] > 100 else 'moderate',
            'region_name': row['region'].replace('_', ' '),
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'year': row['year'],
            'month': row['month'],
            'precipitation_mm': row['precipitation_mm'],
            'anomaly_percent': row['anomaly_percent'],
            'impact_radius_km': 500,
            'typical_downtime_hours': 48 if row['anomaly_percent'] > 100 else 24,
            'impact_description': f"Heavy rainfall {row['precipitation_mm']:.0f}mm ({row['anomaly_percent']:.0f}% above normal)"
        })
    
    # 2. Drought conditions (dust storms, equipment stress)
    drought = precip_df[precip_df['anomaly_percent'] < -40].copy()
    for _, row in drought.iterrows():
        weather_patterns.append({
            'pattern_id': f"precip_drought_{row['region']}_{row['year']}_{row['month']:02d}",
            'pattern_type': 'drought',
            'severity': 'severe' if row['anomaly_percent'] < -60 else 'moderate',
            'region_name': row['region'].replace('_', ' '),
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'year': row['year'],
            'month': row['month'],
            'precipitation_mm': row['precipitation_mm'],
            'anomaly_percent': row['anomaly_percent'],
            'impact_radius_km': 1000,
            'typical_downtime_hours': 12,  # Dust storms
            'impact_description': f"Drought conditions {row['precipitation_mm']:.0f}mm ({abs(row['anomaly_percent']):.0f}% below normal)"
        })
    
    # 3. Monsoon patterns (seasonal heavy rain)
    monsoon = precip_df[
        (precip_df['pattern_type'] == 'monsoon') & 
        (precip_df['month'].isin([7, 8, 9])) &
        (precip_df['precipitation_mm'] > 250)
    ].copy()
    
    for _, row in monsoon.iterrows():
        weather_patterns.append({
            'pattern_id': f"precip_monsoon_{row['region']}_{row['year']}_{row['month']:02d}",
            'pattern_type': 'monsoon',
            'severity': 'moderate',
            'region_name': row['region'].replace('_', ' '),
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'year': row['year'],
            'month': row['month'],
            'precipitation_mm': row['precipitation_mm'],
            'anomaly_percent': row['anomaly_percent'],
            'impact_radius_km': 800,
            'typical_downtime_hours': 36,
            'impact_description': f"Monsoon rains {row['precipitation_mm']:.0f}mm"
        })
    
    # Convert to DataFrame
    weather_df = pd.DataFrame(weather_patterns)
    
    # Save weather patterns
    output_path = "data/raw/weather_patterns_from_precipitation.parquet"
    weather_df.to_parquet(output_path, index=False)
    
    print(f"\n✅ Weather patterns created:")
    print(f"   Heavy precipitation events: {len(heavy_precip)}")
    print(f"   Drought conditions: {len(drought)}")
    print(f"   Monsoon patterns: {len(monsoon)}")
    print(f"   Total patterns: {len(weather_df)}")
    print(f"   Saved to: {output_path}")
    
    # Create summary statistics
    summary = {
        "processing_date": datetime.now().isoformat(),
        "source_data": "NASA GPM precipitation patterns (sample)",
        "weather_patterns": {
            "total": len(weather_df),
            "by_type": weather_df['pattern_type'].value_counts().to_dict(),
            "by_severity": weather_df['severity'].value_counts().to_dict()
        },
        "impact_statistics": {
            "avg_downtime_hours": float(weather_df['typical_downtime_hours'].mean()),
            "max_downtime_hours": int(weather_df['typical_downtime_hours'].max()),
            "total_events": len(weather_df)
        },
        "geographic_coverage": {
            "regions": list(weather_df['region_name'].unique()),
            "lat_range": [float(weather_df['latitude'].min()), float(weather_df['latitude'].max())],
            "lon_range": [float(weather_df['longitude'].min()), float(weather_df['longitude'].max())]
        }
    }
    
    # Save summary
    with open("data/raw/weather_patterns_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    return weather_df


def integrate_with_ground_stations():
    """Match weather patterns with nearby ground stations"""
    
    print("\n🔗 Integrating weather patterns with ground stations...")
    
    # This would be called from the main pipeline
    # For now, just show the concept
    
    print("✅ Weather patterns ready for pipeline integration")
    print("\nTo integrate:")
    print("1. Run: python pipelines/run_pipeline.py")
    print("2. Weather patterns will be matched to ground stations by proximity")
    print("3. AFFECTED_BY relationships will be created in the graph")


if __name__ == "__main__":
    # Process precipitation data
    weather_patterns = process_precipitation_data()
    
    # Show integration steps
    integrate_with_ground_stations()
    
    print("\n✅ Precipitation processing complete!")
    print("\n📊 Sample weather impacts:")
    
    # Show a few examples
    sample = weather_patterns.head(3)
    for _, pattern in sample.iterrows():
        print(f"\n- {pattern['pattern_type'].replace('_', ' ').title()}")
        print(f"  Location: {pattern['region_name']} ({pattern['latitude']}, {pattern['longitude']})")
        print(f"  Impact: {pattern['impact_description']}")
        print(f"  Downtime: {pattern['typical_downtime_hours']} hours")