#!/usr/bin/env python3
"""
Process Space-Track Geosynchronous Report
Extract GEO satellite positions for ground station coverage planning
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json

def calculate_geo_longitude(inclination, apogee, perigee):
    """
    Estimate GEO longitude position based on orbital parameters
    This is approximate - actual longitude depends on RAAN and other factors
    """
    # For true GEO satellites (low inclination, circular orbit)
    if inclination < 5 and abs(apogee - perigee) < 100:
        # Would need RAAN for accurate longitude
        return None
    return None

def process_geosync_report():
    """Process Space-Track geosynchronous report"""
    print("🛰️ Processing Space-Track Geosynchronous Report")
    print("=" * 60)
    
    # Read the data
    df = pd.read_csv("data/raw/geosync_spacetrack.txt", sep='\t')
    
    print(f"Total objects in GEO catalog: {len(df)}")
    
    # Filter for active satellites (CURRENT = 'Y')
    active_geo = df[df['CURRENT'] == 'Y'].copy()
    print(f"Active GEO objects: {len(active_geo)}")
    
    # Filter for payloads only (exclude debris and rocket bodies)
    geo_satellites = active_geo[active_geo['OBJECT_TYPE'] == 'PAYLOAD'].copy()
    print(f"Active GEO satellites: {len(geo_satellites)}")
    
    # Extract launch year
    geo_satellites['LAUNCH_YEAR_NUM'] = pd.to_numeric(geo_satellites['LAUNCH_YEAR'], errors='coerce')
    
    # Calculate approximate longitude slots based on name patterns
    # Many GEO satellites include their longitude in the name
    def extract_longitude(name):
        """Extract longitude from satellite name if present"""
        import re
        
        # Common patterns: "XXX.XE", "XXX.XW", "XXX E", "XXX W"
        patterns = [
            r'(\d+\.?\d*)\s*[EW]',  # Matches "100.5E" or "100 E"
            r'(\d+\.?\d*)[EW]',     # Matches "100.5E" without space
            r'AT\s*(\d+)',          # Matches "AT 100" (Atlantic)
            r'(\d+)W',              # Matches "100W"
            r'(\d+)E'               # Matches "100E"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, str(name).upper())
            if match:
                lon = float(match.group(1))
                if 'W' in str(name).upper()[match.start():match.end()]:
                    lon = -lon
                return lon
        return None
    
    geo_satellites['extracted_longitude'] = geo_satellites['SATNAME'].apply(extract_longitude)
    
    # Analyze by country
    print("\n🌍 GEO Satellites by Country/Organization:")
    print("-" * 50)
    country_counts = geo_satellites['COUNTRY'].value_counts().head(15)
    for country, count in country_counts.items():
        print(f"  {country:15} {count:3d} satellites")
    
    # Analyze by decade
    print("\n📅 GEO Satellites by Launch Decade:")
    print("-" * 50)
    geo_satellites['decade'] = (geo_satellites['LAUNCH_YEAR_NUM'] // 10 * 10).astype('Int64')
    decade_counts = geo_satellites['decade'].value_counts().sort_index()
    for decade, count in decade_counts.items():
        if pd.notna(decade) and decade >= 1960:
            print(f"  {int(decade)}s: {count:3d} satellites")
    
    # Recent launches
    recent_geo = geo_satellites[geo_satellites['LAUNCH_YEAR_NUM'] >= 2020]
    print(f"\n🚀 Recent GEO launches (2020+): {len(recent_geo)}")
    
    # Identify major operators
    print("\n🏢 Major GEO Operators (by satellite name patterns):")
    print("-" * 50)
    
    operators = {
        'Intelsat': geo_satellites['SATNAME'].str.contains('INTELSAT', case=False, na=False).sum(),
        'SES': geo_satellites['SATNAME'].str.contains('SES-|ASTRA', case=False, na=False).sum(),
        'Eutelsat': geo_satellites['SATNAME'].str.contains('EUTELSAT', case=False, na=False).sum(),
        'Arabsat': geo_satellites['SATNAME'].str.contains('ARABSAT', case=False, na=False).sum(),
        'AsiaSat': geo_satellites['SATNAME'].str.contains('ASIASAT', case=False, na=False).sum(),
        'Telesat': geo_satellites['SATNAME'].str.contains('TELESAT|ANIK', case=False, na=False).sum(),
        'EchoStar': geo_satellites['SATNAME'].str.contains('ECHOSTAR', case=False, na=False).sum(),
        'Chinasat': geo_satellites['SATNAME'].str.contains('CHINASAT|ZHONGXING', case=False, na=False).sum(),
        'Sky Perfect': geo_satellites['SATNAME'].str.contains('JCSAT|SUPERBIRD', case=False, na=False).sum(),
        'Hispasat': geo_satellites['SATNAME'].str.contains('HISPASAT', case=False, na=False).sum()
    }
    
    for operator, count in sorted(operators.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"  {operator:15} {count:3d} satellites")
    
    # Analyze longitude distribution (where extracted)
    satellites_with_lon = geo_satellites[geo_satellites['extracted_longitude'].notna()]
    if len(satellites_with_lon) > 0:
        print(f"\n📍 Longitude Distribution ({len(satellites_with_lon)} satellites with known positions):")
        print("-" * 50)
        
        # Group by longitude regions
        regions = {
            'Americas Atlantic': (-90, -30),
            'Atlantic': (-30, 0),
            'Europe/Africa': (0, 60),
            'Middle East/India': (60, 90),
            'Asia Pacific': (90, 180),
            'Pacific': (-180, -90)
        }
        
        for region, (min_lon, max_lon) in regions.items():
            if min_lon < max_lon:
                count = len(satellites_with_lon[
                    (satellites_with_lon['extracted_longitude'] >= min_lon) & 
                    (satellites_with_lon['extracted_longitude'] < max_lon)
                ])
            else:  # Handle Pacific crossing dateline
                count = len(satellites_with_lon[
                    (satellites_with_lon['extracted_longitude'] >= min_lon) | 
                    (satellites_with_lon['extracted_longitude'] < max_lon)
                ])
            print(f"  {region:20} {count:3d} satellites")
    
    # Ground station implications
    print("\n📡 Ground Station Requirements for GEO:")
    print("-" * 50)
    print("  • Each GEO satellite needs 2-5 gateway stations")
    print(f"  • {len(geo_satellites)} active GEO satellites = ~{len(geo_satellites)*3} gateway stations needed globally")
    print("  • Key requirements:")
    print("    - Clear view of GEO arc (avoid high latitude >70°)")
    print("    - Fiber connectivity (>10 Gbps)")
    print("    - Power reliability")
    print("    - Minimal rain fade (avoid tropical regions)")
    
    # Save processed data
    output_data = geo_satellites[[
        'NORAD_CAT_ID', 'OBJECT_NAME', 'COUNTRY', 'LAUNCH_YEAR',
        'INCLINATION', 'APOGEE', 'PERIGEE', 'extracted_longitude'
    ]].copy()
    
    output_data.to_parquet("data/raw/geosync_satellites_processed.parquet", index=False)
    
    # Create summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "source": "Space-Track Geosynchronous Report",
        "total_geo_objects": len(df),
        "active_geo_satellites": len(geo_satellites),
        "recent_launches_2020+": len(recent_geo),
        "by_country": country_counts.head(10).astype(int).to_dict(),
        "major_operators": {k: v for k, v in operators.items() if v > 0},
        "satellites_with_longitude": len(satellites_with_lon),
        "ground_station_estimate": len(geo_satellites) * 3,
        "notes": [
            "GEO satellites provide fixed regional coverage",
            "Each satellite visible from ~42% of Earth's surface",
            "Gateway stations need excellent fiber connectivity",
            "Latitude constraints: best between ±70°"
        ]
    }
    
    with open("data/raw/geosync_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✅ Processed data saved to: data/raw/geosync_satellites_processed.parquet")
    print(f"✅ Summary saved to: data/raw/geosync_summary.json")
    
    return geo_satellites

def analyze_geo_coverage_gaps(df):
    """Analyze GEO coverage gaps for investment opportunities"""
    print("\n🎯 GEO Coverage Gap Analysis:")
    print("-" * 50)
    
    # Satellites with extracted longitude
    sats_with_pos = df[df['extracted_longitude'].notna()].copy()
    
    if len(sats_with_pos) > 0:
        # Sort by longitude
        sats_with_pos = sats_with_pos.sort_values('extracted_longitude')
        
        # Find gaps
        print("\n🔍 Longitude Gaps (potential underserved regions):")
        
        prev_lon = -180
        gaps = []
        
        for _, sat in sats_with_pos.iterrows():
            lon = sat['extracted_longitude']
            gap = lon - prev_lon
            
            if gap > 10:  # Significant gap
                gaps.append({
                    'start': prev_lon,
                    'end': lon,
                    'size': gap,
                    'center': (prev_lon + lon) / 2
                })
            
            prev_lon = lon
        
        # Check wrap-around gap
        wrap_gap = 180 - sats_with_pos['extracted_longitude'].max() + sats_with_pos['extracted_longitude'].min() + 180
        if wrap_gap > 10:
            gaps.append({
                'start': sats_with_pos['extracted_longitude'].max(),
                'end': sats_with_pos['extracted_longitude'].min(),
                'size': wrap_gap,
                'center': -180 if wrap_gap > 180 else (sats_with_pos['extracted_longitude'].max() - 180)
            })
        
        # Report significant gaps
        for gap in sorted(gaps, key=lambda x: x['size'], reverse=True)[:5]:
            print(f"  Gap: {gap['start']:.1f}° to {gap['end']:.1f}° ({gap['size']:.1f}° wide)")
            
            # Identify region
            center = gap['center']
            if -120 < center < -60:
                region = "Americas"
            elif -60 < center < -20:
                region = "Atlantic"
            elif -20 < center < 40:
                region = "Europe/Africa"
            elif 40 < center < 100:
                region = "Middle East/Asia"
            else:
                region = "Asia Pacific"
            
            print(f"    Region: {region}")
            print(f"    Opportunity: Gateway stations for new GEO capacity")
    
    print("\n💡 Investment Opportunities:")
    print("  1. Gateway stations in underserved GEO slots")
    print("  2. Multi-satellite gateways (serve 3-5 satellites)")
    print("  3. Diversity sites for existing gateways")
    print("  4. High-throughput gateways for HTS satellites")

if __name__ == "__main__":
    # Process the data
    geo_satellites = process_geosync_report()
    
    # Analyze coverage gaps
    analyze_geo_coverage_gaps(geo_satellites)
    
    print("\n🎯 Key Takeaways for Ground Station Investment:")
    print("1. GEO market is mature but still growing")
    print("2. Regional concentration creates gateway hub opportunities")
    print("3. High-throughput satellites need more gateway capacity")
    print("4. Geographic diversity essential for reliability")