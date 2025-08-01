#!/usr/bin/env python3
"""
Process GCAT satellite catalog with correct header parsing
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json

def process_gcat_catalog():
    """Process the GCAT satellite catalog"""
    print("🛰️ Processing GCAT Satellite Catalog")
    print("=" * 60)
    
    # Read the file properly - the first non-comment line contains headers
    with open("data/raw/gcat_satcat.tsv", 'r') as f:
        # Skip comment lines
        for line in f:
            if not line.startswith('#'):
                # This should be the header line
                headers = line.strip().split('\t')
                break
    
    # Now read the data with proper headers
    df = pd.read_csv("data/raw/gcat_satcat.tsv", sep='\t', comment='#', 
                     names=headers, skiprows=2, low_memory=False)
    
    print(f"Total objects in catalog: {len(df)}")
    
    # Filter for satellites (Type contains 'P' for payload)
    satellites = df[df['Type'].str.contains('P', na=False)].copy()
    print(f"Total satellites (payloads): {len(satellites)}")
    
    # Process satellite data
    satellites['is_active'] = (satellites['DDate'].isna()) | (satellites['DDate'] == '-') | (satellites['DDate'].str.contains('?', na=False))
    active_satellites = satellites[satellites['is_active']].copy()
    
    print(f"Active satellites: {len(active_satellites)}")
    
    # Classify orbits based on Perigee and Apogee
    def classify_orbit(row):
        try:
            # Clean the values
            perigee_str = str(row['Perigee']).replace('?', '').strip()
            apogee_str = str(row['Apogee']).replace('?', '').strip()
            
            perigee = float(perigee_str) if perigee_str and perigee_str != 'nan' else 0
            apogee = float(apogee_str) if apogee_str and apogee_str != 'nan' else 0
            
            # Calculate average altitude
            avg_altitude = (perigee + apogee) / 2
            
            if avg_altitude > 35000:
                return 'GEO'
            elif avg_altitude > 2000:
                return 'MEO'
            elif avg_altitude > 0:
                return 'LEO'
            else:
                # Try to use OpOrbit field
                op_orbit = str(row.get('OpOrbit', '')).upper()
                if 'GEO' in op_orbit:
                    return 'GEO'
                elif 'MEO' in op_orbit:
                    return 'MEO'
                elif 'LEO' in op_orbit:
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
    
    # Major constellations identification
    active_satellites['constellation'] = 'Other'
    
    # Identify major constellations by name patterns
    active_satellites.loc[active_satellites['Name'].str.contains('Starlink', case=False, na=False), 'constellation'] = 'Starlink'
    active_satellites.loc[active_satellites['Name'].str.contains('OneWeb', case=False, na=False), 'constellation'] = 'OneWeb'
    active_satellites.loc[active_satellites['Name'].str.contains('Iridium', case=False, na=False), 'constellation'] = 'Iridium'
    active_satellites.loc[active_satellites['Name'].str.contains('Globalstar', case=False, na=False), 'constellation'] = 'Globalstar'
    active_satellites.loc[active_satellites['Name'].str.contains('INTELSAT', case=False, na=False), 'constellation'] = 'Intelsat'
    active_satellites.loc[active_satellites['Name'].str.contains('SES-', case=False, na=False), 'constellation'] = 'SES'
    active_satellites.loc[active_satellites['Name'].str.contains('Eutelsat', case=False, na=False), 'constellation'] = 'Eutelsat'
    
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
    
    # By constellation
    print("\n🌌 Major Constellations:")
    const_counts = active_satellites['constellation'].value_counts().head(10)
    for const, count in const_counts.items():
        if const != 'Other':
            print(f"  {const:15} {count:5d} satellites")
    
    # Recent launches (2020+)
    recent = active_satellites[active_satellites['launch_year'] >= '2020']
    print(f"\n🚀 Recent Launches (2020+): {len(recent)} satellites")
    
    # Ground station demand analysis
    print("\n📡 Ground Station Demand Analysis:")
    print("-" * 50)
    
    leo_count = len(active_satellites[active_satellites['orbit_type'] == 'LEO'])
    meo_count = len(active_satellites[active_satellites['orbit_type'] == 'MEO'])
    geo_count = len(active_satellites[active_satellites['orbit_type'] == 'GEO'])
    
    print(f"\n💡 Key Insights:")
    print(f"  - LEO satellites ({leo_count}): Need dense ground station networks")
    print(f"  - MEO satellites ({meo_count}): Need regional ground stations")
    print(f"  - GEO satellites ({geo_count}): Need high-capacity gateway stations")
    
    # Starlink analysis
    starlink_count = len(active_satellites[active_satellites['constellation'] == 'Starlink'])
    if starlink_count > 0:
        print(f"\n  - Starlink alone has {starlink_count} active satellites!")
        print(f"    This represents {starlink_count/leo_count*100:.1f}% of all LEO satellites")
    
    # Save summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "source": "GCAT - Jonathan McDowell",
        "total_objects": len(df),
        "total_satellites": len(satellites),
        "active_satellites": len(active_satellites),
        "by_country": country_counts.head(10).to_dict(),
        "by_orbit": orbit_counts.to_dict(),
        "by_constellation": const_counts.head(10).to_dict(),
        "recent_launches_2020+": len(recent),
        "insights": {
            "leo_dominance": f"{leo_count/len(active_satellites)*100:.1f}%",
            "recent_growth": f"{len(recent)/len(active_satellites)*100:.1f}%",
            "starlink_share": f"{starlink_count/len(active_satellites)*100:.1f}%"
        }
    }
    
    with open("data/raw/gcat_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✅ Processed data saved to: {output_path}")
    print(f"✅ Summary saved to: data/raw/gcat_summary.json")
    
    return active_satellites

if __name__ == "__main__":
    df = process_gcat_catalog()
    
    print("\n🎯 For Your Ground Station POC:")
    print("1. Focus on LEO constellations (highest demand)")
    print("2. Consider polar regions for complete LEO coverage")
    print("3. GEO satellites need fewer but larger stations")
    print("4. Recent growth shows accelerating demand")