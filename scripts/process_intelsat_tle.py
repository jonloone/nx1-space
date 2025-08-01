#!/usr/bin/env python3
"""
Process Intelsat TLE data from XML format
Extract orbital parameters for GEO satellite coverage analysis
"""

import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np
from datetime import datetime
import json

def parse_intelsat_tle(xml_file):
    """Parse Intelsat TLE XML data"""
    print("🛰️ Processing Intelsat TLE Data...")
    print("=" * 60)
    
    # Parse XML
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    satellites = []
    
    # Find all satellite entries
    for item in root.findall('.//item'):
        try:
            # Extract satellite data
            sat_data = {
                'name': item.find('OBJECT_NAME').text if item.find('OBJECT_NAME') is not None else '',
                'norad_id': item.find('NORAD_CAT_ID').text if item.find('NORAD_CAT_ID') is not None else '',
                'object_type': item.find('OBJECT_TYPE').text if item.find('OBJECT_TYPE') is not None else '',
                'classification': item.find('CLASSIFICATION_TYPE').text if item.find('CLASSIFICATION_TYPE') is not None else '',
                'intl_designator': item.find('INTLDES').text if item.find('INTLDES') is not None else '',
                'epoch': item.find('EPOCH').text if item.find('EPOCH') is not None else '',
                'mean_motion': float(item.find('MEAN_MOTION').text) if item.find('MEAN_MOTION') is not None else 0,
                'eccentricity': float(item.find('ECCENTRICITY').text) if item.find('ECCENTRICITY') is not None else 0,
                'inclination': float(item.find('INCLINATION').text) if item.find('INCLINATION') is not None else 0,
                'ra_asc_node': float(item.find('RA_OF_ASC_NODE').text) if item.find('RA_OF_ASC_NODE') is not None else 0,
                'arg_pericenter': float(item.find('ARG_OF_PERICENTER').text) if item.find('ARG_OF_PERICENTER') is not None else 0,
                'mean_anomaly': float(item.find('MEAN_ANOMALY').text) if item.find('MEAN_ANOMALY') is not None else 0,
                'ephemeris_type': item.find('EPHEMERIS_TYPE').text if item.find('EPHEMERIS_TYPE') is not None else '',
                'element_set_no': item.find('ELEMENT_SET_NO').text if item.find('ELEMENT_SET_NO') is not None else '',
                'tle_line1': item.find('TLE_LINE1').text if item.find('TLE_LINE1') is not None else '',
                'tle_line2': item.find('TLE_LINE2').text if item.find('TLE_LINE2') is not None else ''
            }
            
            # Calculate orbital period (minutes)
            if sat_data['mean_motion'] > 0:
                sat_data['orbital_period_min'] = 1440.0 / sat_data['mean_motion']
            else:
                sat_data['orbital_period_min'] = 0
            
            # Determine orbit type based on period
            period = sat_data['orbital_period_min']
            if period > 1200:  # > 20 hours
                sat_data['orbit_type'] = 'GEO'
            elif period > 600:  # 10-20 hours
                sat_data['orbit_type'] = 'MEO'
            elif period > 0:
                sat_data['orbit_type'] = 'LEO'
            else:
                sat_data['orbit_type'] = 'Unknown'
            
            # Calculate approximate altitude for GEO satellites
            if sat_data['orbit_type'] == 'GEO':
                # For GEO, calculate longitude position
                # Semi-major axis from mean motion
                n = sat_data['mean_motion'] * 2 * np.pi / 86400  # rad/s
                mu = 398600.4418  # Earth's gravitational parameter (km^3/s^2)
                a = (mu / (n**2))**(1/3)  # Semi-major axis in km
                sat_data['altitude_km'] = a - 6378.137  # Subtract Earth's radius
                
                # Approximate longitude for GEO (simplified)
                sat_data['geo_longitude'] = sat_data['ra_asc_node'] + sat_data['arg_pericenter'] + sat_data['mean_anomaly']
                sat_data['geo_longitude'] = sat_data['geo_longitude'] % 360
                if sat_data['geo_longitude'] > 180:
                    sat_data['geo_longitude'] -= 360
            else:
                sat_data['altitude_km'] = None
                sat_data['geo_longitude'] = None
            
            satellites.append(sat_data)
            
        except Exception as e:
            print(f"Error processing satellite: {e}")
            continue
    
    # Convert to DataFrame
    df = pd.DataFrame(satellites)
    
    # Save processed data
    output_path = "data/raw/intelsat_satellites.parquet"
    df.to_parquet(output_path, index=False)
    
    print(f"\n✅ Processed {len(df)} Intelsat satellites")
    print(f"Saved to: {output_path}")
    
    # Generate summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "total_satellites": len(df),
        "by_orbit_type": df['orbit_type'].value_counts().to_dict(),
        "active_geo_satellites": len(df[df['orbit_type'] == 'GEO']),
        "geo_longitude_coverage": {
            "min": float(df[df['orbit_type'] == 'GEO']['geo_longitude'].min()) if len(df[df['orbit_type'] == 'GEO']) > 0 else None,
            "max": float(df[df['orbit_type'] == 'GEO']['geo_longitude'].max()) if len(df[df['orbit_type'] == 'GEO']) > 0 else None
        },
        "notes": [
            "Intelsat operates primarily GEO satellites",
            "GEO satellites provide fixed coverage areas",
            "Each GEO satellite covers approximately 1/3 of Earth's surface",
            "Ground stations need clear line of sight to GEO arc"
        ]
    }
    
    # Show GEO satellite positions
    if len(df[df['orbit_type'] == 'GEO']) > 0:
        print("\n📍 GEO Satellite Positions:")
        print("-" * 60)
        geo_sats = df[df['orbit_type'] == 'GEO'].sort_values('geo_longitude')
        for _, sat in geo_sats.iterrows():
            print(f"{sat['name']:30} | Longitude: {sat['geo_longitude']:7.1f}°")
    
    # Save summary
    with open("data/raw/intelsat_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    return df


def analyze_coverage_requirements(df):
    """Analyze ground station requirements for Intelsat fleet"""
    print("\n📡 Ground Station Coverage Analysis for Intelsat")
    print("=" * 60)
    
    geo_sats = df[df['orbit_type'] == 'GEO']
    
    if len(geo_sats) > 0:
        # Group satellites by longitude regions
        regions = {
            'Americas': (-180, -30),
            'Atlantic': (-30, 30),
            'Europe/Africa': (30, 90),
            'Asia/Pacific': (90, 180)
        }
        
        print("\nSatellites by Region:")
        for region, (min_lon, max_lon) in regions.items():
            if min_lon < 0 and max_lon < 0:
                sats_in_region = geo_sats[
                    (geo_sats['geo_longitude'] >= min_lon) & 
                    (geo_sats['geo_longitude'] <= max_lon)
                ]
            else:
                sats_in_region = geo_sats[
                    (geo_sats['geo_longitude'] >= min_lon) & 
                    (geo_sats['geo_longitude'] <= max_lon)
                ]
            
            print(f"\n{region}: {len(sats_in_region)} satellites")
            if len(sats_in_region) > 0:
                print(f"  Longitude range: {sats_in_region['geo_longitude'].min():.1f}° to {sats_in_region['geo_longitude'].max():.1f}°")
                print(f"  Optimal ground station latitudes: 0° to ±70°")
        
        # Calculate optimal ground station locations
        print("\n🎯 Optimal Ground Station Considerations:")
        print("- Each GEO satellite is visible from ~42% of Earth's surface")
        print("- Ground stations need elevation angle > 5° (ideally > 10°)")
        print("- Avoid extreme latitudes (>70°) for GEO visibility")
        print("- Consider rain fade in tropical regions")
        print("- Proximity to fiber infrastructure crucial for GEO gateways")


def main():
    """Process Intelsat TLE data"""
    xml_file = "data/raw/intelsat_tle.xml"
    
    # Process TLE data
    df = parse_intelsat_tle(xml_file)
    
    # Analyze coverage requirements
    analyze_coverage_requirements(df)
    
    print("\n✅ Intelsat TLE processing complete!")
    print("\nThis data shows:")
    print("1. GEO satellite positions for coverage planning")
    print("2. Ground station latitude constraints")
    print("3. Regional satellite distribution")
    print("4. Gateway location requirements")


if __name__ == "__main__":
    main()