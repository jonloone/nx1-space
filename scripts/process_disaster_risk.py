#!/usr/bin/env python3
"""
Process natural disaster risk data for ground station site selection
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def process_earthquake_data():
    """Process earthquake data to identify seismic risk zones"""
    print("🌍 Processing Earthquake Risk Data")
    print("=" * 60)
    
    # Load earthquake data
    eq_df = pd.read_csv("data/raw/kaggle/Significant Earthquake Dataset 1900-2023.csv")
    
    print(f"Total earthquakes: {len(eq_df)}")
    print(f"Columns: {list(eq_df.columns)}")
    
    # Clean and prepare data
    eq_df = eq_df.dropna(subset=['Latitude', 'Longitude', 'Mag'])
    
    # Filter for significant earthquakes (magnitude > 5.0)
    significant = eq_df[eq_df['Mag'] > 5.0]
    print(f"Significant earthquakes (M>5.0): {len(significant)}")
    
    # Create risk grid (10-degree cells)
    eq_df['lat_grid'] = (eq_df['Latitude'] // 10) * 10
    eq_df['lon_grid'] = (eq_df['Longitude'] // 10) * 10
    
    # Calculate risk metrics per grid cell
    risk_zones = eq_df.groupby(['lat_grid', 'lon_grid']).agg({
        'Mag': ['count', 'max', 'mean']
    }).reset_index()
    
    # Flatten column names
    risk_zones.columns = ['lat_grid', 'lon_grid', 'earthquake_count', 
                         'max_magnitude', 'avg_magnitude']
    
    # Calculate composite seismic risk score (0-100)
    # Higher score = higher risk
    risk_zones['seismic_risk_score'] = (
        (risk_zones['earthquake_count'] / risk_zones['earthquake_count'].max() * 40) +
        (risk_zones['max_magnitude'] / 10 * 30) +
        ((risk_zones['avg_magnitude'] - 4) / 4 * 30)
    ).clip(0, 100)
    
    # Invert for ground station suitability (100 = safest)
    risk_zones['seismic_safety_score'] = 100 - risk_zones['seismic_risk_score']
    
    # Sort by safety
    safe_zones = risk_zones.sort_values('seismic_safety_score', ascending=False)
    
    print(f"\nSeismic risk zones identified: {len(risk_zones)}")
    print("\nTop 10 safest zones from earthquakes:")
    for _, zone in safe_zones.head(10).iterrows():
        print(f"  Lat: {zone['lat_grid']:>4.0f}° to {zone['lat_grid']+10:>4.0f}°, "
              f"Lon: {zone['lon_grid']:>4.0f}° to {zone['lon_grid']+10:>4.0f}° - "
              f"Safety Score: {zone['seismic_safety_score']:>5.1f}")
    
    return risk_zones

def process_flood_data():
    """Process flood risk data"""
    print("\n💧 Processing Flood Risk Data")
    print("=" * 60)
    
    # Load flood data
    flood_df = pd.read_csv("data/raw/kaggle/flood.csv")
    
    print(f"Total flood records: {len(flood_df)}")
    print(f"Columns: {list(flood_df.columns)}")
    
    # Analyze flood risk indicators
    if 'FloodProbability' in flood_df.columns:
        # Group by region if available
        flood_summary = flood_df.groupby('Region' if 'Region' in flood_df.columns else flood_df.columns[0]).agg({
            'FloodProbability': ['mean', 'max']
        }).reset_index()
        
        # Create flood safety score (inverse of probability)
        flood_summary['flood_safety_score'] = 100 - (flood_summary[('FloodProbability', 'mean')] * 100)
        
        print(f"\nFlood risk regions analyzed: {len(flood_summary)}")
        return flood_summary
    else:
        # If no probability column, analyze available metrics
        numeric_cols = flood_df.select_dtypes(include=[np.number]).columns
        print(f"Numeric columns available: {list(numeric_cols)}")
        return flood_df

def process_world_risk_index():
    """Process World Risk Index data"""
    print("\n🌐 Processing World Risk Index")
    print("=" * 60)
    
    # Load risk index
    risk_df = pd.read_csv("data/raw/kaggle/world_risk_index.csv")
    
    print(f"Total countries: {len(risk_df)}")
    print(f"Columns: {list(risk_df.columns)}")
    
    # Calculate composite disaster risk score
    if 'WRI' in risk_df.columns:  # World Risk Index
        risk_df['disaster_safety_score'] = 100 - (risk_df['WRI'] / risk_df['WRI'].max() * 100)
    
    # Sort by safety
    safe_countries = risk_df.sort_values('disaster_safety_score', ascending=False) if 'disaster_safety_score' in risk_df.columns else risk_df
    
    print("\nTop 20 safest countries for ground stations:")
    for idx, (_, country) in enumerate(safe_countries.head(20).iterrows()):
        country_name = country.get('Country', country.iloc[0])
        safety_score = country.get('disaster_safety_score', 'N/A')
        print(f"  {idx+1:2d}. {country_name:<30} Safety Score: {safety_score}")
    
    return risk_df

def create_integrated_risk_assessment():
    """Integrate all disaster risk data"""
    print("\n🎯 Creating Integrated Disaster Risk Assessment")
    print("=" * 60)
    
    # Process all risk data
    seismic_risk = process_earthquake_data()
    flood_risk = process_flood_data()
    world_risk = process_world_risk_index()
    
    # Save processed data
    seismic_risk.to_parquet("data/raw/seismic_risk_zones.parquet", index=False)
    print("✅ Saved seismic risk zones")
    
    # Create summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "data_sources": {
            "earthquakes": "Significant Earthquake Dataset 1900-2023",
            "floods": "Flood Prediction Dataset",
            "world_risk": "Global Disaster Risk Index"
        },
        "risk_zones_identified": {
            "seismic": len(seismic_risk),
            "high_seismic_risk": len(seismic_risk[seismic_risk['seismic_risk_score'] > 70]),
            "safe_seismic": len(seismic_risk[seismic_risk['seismic_safety_score'] > 80])
        },
        "ground_station_implications": [
            "Avoid high seismic risk zones (Pacific Ring of Fire)",
            "Prefer inland locations for flood safety",
            "Consider redundant sites in different risk zones",
            "Factor insurance costs in high-risk areas"
        ],
        "recommended_safe_regions": [
            "Northern Europe (low seismic, moderate flood)",
            "Central Canada (low overall risk)",
            "Western Australia (low seismic)",
            "Parts of Africa (varies by specific location)"
        ]
    }
    
    with open("data/raw/disaster_risk_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ Disaster risk assessment complete!")
    print("Files created:")
    print("  - data/raw/seismic_risk_zones.parquet")
    print("  - data/raw/disaster_risk_summary.json")

if __name__ == "__main__":
    create_integrated_risk_assessment()