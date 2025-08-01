#!/usr/bin/env python3
"""
Simple GCAT processor focusing on essential satellite data
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json

def process_gcat_simple():
    """Process GCAT with simplified approach"""
    print("🛰️ Processing GCAT Satellite Catalog (Simplified)")
    print("=" * 60)
    
    # Read with generic column names
    df = pd.read_csv("data/raw/gcat_satcat.tsv", sep='\t', header=None, comment='#', low_memory=False)
    
    # Based on the file structure, assign meaningful column indices
    # Key columns: 4=Type, 5=Name, 7=LaunchDate, 11=DecayDate, 15=State, 16=Owner, 33=Perigee, 35=Apogee
    
    df.columns = [f'col_{i}' for i in range(len(df.columns))]
    
    # Rename key columns
    column_mapping = {
        'col_0': 'gcat_id',
        'col_1': 'norad_id', 
        'col_4': 'type',
        'col_5': 'name',
        'col_7': 'launch_date',
        'col_11': 'decay_date',
        'col_15': 'country',
        'col_16': 'owner',
        'col_33': 'perigee',
        'col_35': 'apogee',
        'col_39': 'orbit_class'
    }
    
    for old, new in column_mapping.items():
        if old in df.columns:
            df[new] = df[old]
    
    print(f"Total objects: {len(df)}")
    
    # Filter for satellites (type contains 'P' for payload)
    satellites = df[df['type'].str.contains('P', na=False, regex=False)].copy()
    print(f"Total satellites: {len(satellites)}")
    
    # Identify active satellites (no decay date or uncertain)
    satellites['is_active'] = (
        satellites['decay_date'].isna() | 
        (satellites['decay_date'] == '-') |
        satellites['decay_date'].str.contains('?', na=False, regex=False)
    )
    
    active_satellites = satellites[satellites['is_active']].copy()
    print(f"Active satellites: {len(active_satellites)}")
    
    # Extract launch year
    active_satellites['launch_year'] = active_satellites['launch_date'].str[:4]
    
    # Classify orbits
    def classify_orbit_simple(row):
        try:
            # Try orbit class field first
            orbit_str = str(row.get('orbit_class', '')).upper()
            if 'GEO' in orbit_str:
                return 'GEO'
            elif 'MEO' in orbit_str:
                return 'MEO'
            elif 'LEO' in orbit_str:
                return 'LEO'
            
            # Fall back to altitude
            perigee = float(str(row['perigee']).replace('?','').strip() or 0)
            apogee = float(str(row['apogee']).replace('?','').strip() or 0)
            avg_alt = (perigee + apogee) / 2
            
            if avg_alt > 35000:
                return 'GEO'
            elif avg_alt > 2000:
                return 'MEO'
            elif avg_alt > 0:
                return 'LEO'
        except:
            pass
        return 'Unknown'
    
    active_satellites['orbit_type'] = active_satellites.apply(classify_orbit_simple, axis=1)
    
    # Identify major constellations
    active_satellites['constellation'] = 'Other'
    constellation_patterns = {
        'Starlink': 'STARLINK',
        'OneWeb': 'ONEWEB', 
        'Iridium': 'IRIDIUM',
        'Globalstar': 'GLOBALSTAR',
        'Intelsat': 'INTELSAT',
        'SES': 'SES-',
        'Planet': 'FLOCK',
        'Spire': 'LEMUR'
    }
    
    for const, pattern in constellation_patterns.items():
        mask = active_satellites['name'].str.upper().str.contains(pattern, na=False, regex=False)
        active_satellites.loc[mask, 'constellation'] = const
    
    # Summary statistics
    print("\n📊 Key Statistics:")
    print("-" * 50)
    
    # By country
    print("\n🌍 Top 10 Countries:")
    country_counts = active_satellites['country'].value_counts().head(10)
    for country, count in country_counts.items():
        print(f"  {str(country)[:15]:15} {count:5d} satellites")
    
    # By orbit
    print("\n🌍 By Orbit Type:")
    orbit_counts = active_satellites['orbit_type'].value_counts()
    for orbit, count in orbit_counts.items():
        print(f"  {orbit:15} {count:5d} satellites")
    
    # By constellation
    print("\n🌌 Major Constellations:")
    const_counts = active_satellites[active_satellites['constellation'] != 'Other']['constellation'].value_counts()
    for const, count in const_counts.items():
        print(f"  {const:15} {count:5d} satellites")
    
    # Recent growth
    recent = active_satellites[active_satellites['launch_year'] >= '2020']
    print(f"\n🚀 Growth Metrics:")
    print(f"  Launched since 2020: {len(recent)} ({len(recent)/len(active_satellites)*100:.1f}%)")
    
    # Ground station insights
    leo_sats = active_satellites[active_satellites['orbit_type'] == 'LEO']
    starlink_sats = active_satellites[active_satellites['constellation'] == 'Starlink']
    
    print(f"\n📡 Ground Station Demand Drivers:")
    print(f"  LEO satellites: {len(leo_sats)} (need global coverage)")
    print(f"  Starlink alone: {len(starlink_sats)} satellites")
    print(f"  Other LEO constellations: {len(leo_sats) - len(starlink_sats)} satellites")
    
    # Save processed data
    output_data = active_satellites[[
        'gcat_id', 'norad_id', 'name', 'country', 'owner', 
        'launch_date', 'launch_year', 'orbit_type', 'constellation',
        'perigee', 'apogee'
    ]].copy()
    
    output_data.to_parquet("data/raw/gcat_satellites_simplified.parquet", index=False)
    
    # Save summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "total_satellites": len(satellites),
        "active_satellites": len(active_satellites),
        "leo_satellites": len(leo_sats),
        "recent_launches": len(recent),
        "top_countries": country_counts.head(5).to_dict(),
        "top_constellations": const_counts.to_dict(),
        "orbit_distribution": orbit_counts.to_dict()
    }
    
    with open("data/raw/gcat_simplified_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✅ Data saved to: data/raw/gcat_satellites_simplified.parquet")
    print(f"✅ Summary saved to: data/raw/gcat_simplified_summary.json")

if __name__ == "__main__":
    process_gcat_simple()