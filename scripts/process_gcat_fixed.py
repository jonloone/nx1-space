#!/usr/bin/env python3
"""
Process GCAT satellite catalog with correct column names
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json

def process_gcat_catalog():
    """Process the GCAT satellite catalog"""
    print("🛰️ Processing GCAT Satellite Catalog")
    print("=" * 60)
    
    # Read TSV file
    df = pd.read_csv("data/raw/gcat_satcat.tsv", sep='\t', comment='#', low_memory=False)
    
    print(f"Total objects in catalog: {len(df)}")
    
    # Filter for satellites (Type contains 'P' for payload)
    satellites = df[df['Type'].str.contains('P', na=False)].copy()
    print(f"Total satellites (payloads): {len(satellites)}")
    
    # Process satellite data
    satellites['is_active'] = satellites['DDate'].isna() | (satellites['DDate'] == '-')
    active_satellites = satellites[satellites['is_active']].copy()
    
    print(f"Active satellites: {len(active_satellites)}")
    
    # Classify orbits based on Perigee and Apogee
    def classify_orbit(row):
        try:
            perigee = float(str(row['Perigee']).replace('?', '').strip()) if pd.notna(row['Perigee']) else 0
            apogee = float(str(row['Apogee']).replace('?', '').strip()) if pd.notna(row['Apogee']) else 0
            
            # Calculate average altitude
            avg_altitude = (perigee + apogee) / 2
            
            if avg_altitude > 35000:
                return 'GEO'
            elif avg_altitude > 2000:
                return 'MEO'
            elif avg_altitude > 0:
                return 'LEO'
            else:
                return 'Unknown'
        except:
            return 'Unknown'
    
    active_satellites['orbit_type'] = active_satellites.apply(classify_orbit, axis=1)
    
    # Extract launch year
    active_satellites['launch_year'] = active_satellites['LDate'].str[:4]
    
    # Clean up country codes
    active_satellites['country_clean'] = active_satellites['State'].fillna('Unknown')
    
    # Save processed data
    output_path = "data/raw/gcat_active_satellites.parquet"
    active_satellites.to_parquet(output_path, index=False)
    
    # Generate summary statistics
    print("\n📊 Summary Statistics:")
    print("-" * 50)
    
    # By country
    print("\n🌍 Top 15 Countries by Active Satellites:")
    country_counts = active_satellites['country_clean'].value_counts().head(15)
    for country, count in country_counts.items():
        print(f"  {country:15} {count:5d} satellites")
    
    # By orbit type
    print("\n🌍 Satellites by Orbit Type:")
    orbit_counts = active_satellites['orbit_type'].value_counts()
    for orbit, count in orbit_counts.items():
        print(f"  {orbit:15} {count:5d} satellites")
    
    # Recent launches (2020+)
    recent = active_satellites[active_satellites['launch_year'] >= '2020']
    print(f"\n🚀 Recent Launches (2020+): {len(recent)} satellites")
    
    # By decade
    print("\n📅 Launches by Decade:")
    active_satellites['decade'] = (active_satellites['launch_year'].astype(float) // 10 * 10).astype(int)
    decade_counts = active_satellites['decade'].value_counts().sort_index()
    for decade, count in decade_counts.items():
        if decade >= 1950:
            print(f"  {decade}s: {count:5d} satellites")
    
    # Major satellite operators/manufacturers
    print("\n🏢 Top 10 Satellite Owners:")
    owner_counts = active_satellites['Owner'].value_counts().head(10)
    for owner, count in owner_counts.items():
        print(f"  {str(owner)[:30]:30} {count:5d} satellites")
    
    # Ground station demand analysis
    print("\n📡 Ground Station Demand Analysis:")
    print("-" * 50)
    
    leo_count = len(active_satellites[active_satellites['orbit_type'] == 'LEO'])
    meo_count = len(active_satellites[active_satellites['orbit_type'] == 'MEO'])
    geo_count = len(active_satellites[active_satellites['orbit_type'] == 'GEO'])
    
    print(f"\n💡 Key Insights:")
    print(f"  - LEO satellites ({leo_count}): Need global ground station networks")
    print(f"  - MEO satellites ({meo_count}): Need strategic regional stations")
    print(f"  - GEO satellites ({geo_count}): Need high-bandwidth gateway stations")
    print(f"\n  - Recent growth: {len(recent)} satellites launched since 2020")
    print(f"  - This represents {len(recent)/len(active_satellites)*100:.1f}% of all active satellites!")
    
    # Identify mega-constellations
    print("\n🌌 Potential Mega-Constellations:")
    constellation_owners = active_satellites[active_satellites['launch_year'] >= '2019']['Owner'].value_counts().head(5)
    for owner, count in constellation_owners.items():
        if count > 50:
            print(f"  - {owner}: {count} satellites (launched since 2019)")
    
    # Save summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "source": "GCAT - Jonathan McDowell",
        "total_objects": len(df),
        "total_satellites": len(satellites),
        "active_satellites": len(active_satellites),
        "by_country": country_counts.to_dict(),
        "by_orbit": orbit_counts.to_dict(),
        "recent_launches_2020+": len(recent),
        "growth_rate": f"{len(recent)/len(active_satellites)*100:.1f}%"
    }
    
    with open("data/raw/gcat_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✅ Processed data saved to: {output_path}")
    print(f"✅ Summary saved to: data/raw/gcat_summary.json")
    
    return active_satellites

if __name__ == "__main__":
    process_gcat_catalog()