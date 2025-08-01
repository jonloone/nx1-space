#!/usr/bin/env python3
"""
Download and process Jonathan McDowell's GCAT satellite catalog
More comprehensive than Space-Track SATCAT with easier access
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime
import json
import time

def download_gcat_data():
    """Download GCAT satellite catalog data"""
    print("🛰️ Downloading GCAT Satellite Catalog")
    print("=" * 60)
    
    base_url = "https://planet4589.org/space/gcat/tsv/cat/"
    
    datasets = {
        "satcat": {
            "url": f"{base_url}satcat.tsv",
            "description": "Main satellite catalog"
        },
        "lcat": {
            "url": "https://planet4589.org/space/gcat/tsv/launch/lcat.tsv",
            "description": "Launch catalog"
        },
        "dcat": {
            "url": "https://planet4589.org/space/gcat/tsv/decay/dcat.tsv",
            "description": "Decay/reentry catalog"
        },
        "payloads": {
            "url": f"{base_url}payloads.tsv",
            "description": "Payload details"
        }
    }
    
    downloaded_files = {}
    
    for name, info in datasets.items():
        print(f"\n📥 Downloading {info['description']}...")
        print(f"   URL: {info['url']}")
        
        try:
            response = requests.get(info['url'], timeout=30)
            response.raise_for_status()
            
            # Save raw file
            filename = f"data/raw/gcat_{name}.tsv"
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            print(f"   ✅ Downloaded {len(response.content)/1024/1024:.1f} MB")
            downloaded_files[name] = filename
            
            time.sleep(1)  # Be polite
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    return downloaded_files

def process_satcat(filename):
    """Process the main satellite catalog"""
    print("\n📊 Processing GCAT Satellite Catalog...")
    
    try:
        # Read TSV file
        df = pd.read_csv(filename, sep='\t', low_memory=False)
        
        print(f"   Total objects: {len(df)}")
        
        # Clean and process data
        # Filter for actual satellites (not debris)
        if 'Type' in df.columns:
            satellites = df[df['Type'].isin(['P', 'P/'])].copy()  # P = Payload
        else:
            satellites = df.copy()
        
        # Extract key fields (column names may vary)
        processed_data = []
        
        for _, row in satellites.iterrows():
            try:
                sat = {
                    'satcat_id': row.get('Satcat', row.get('#JCAT', '')),
                    'name': row.get('Name', row.get('Satellite', '')),
                    'launch_date': row.get('LDate', row.get('Launch_Date', '')),
                    'country': row.get('State', row.get('Country', '')),
                    'owner': row.get('Owner', row.get('Operator', '')),
                    'status': row.get('Status', row.get('OpStatus', 'Unknown')),
                    'orbit_type': classify_orbit(row),
                    'purpose': row.get('Type', row.get('Purpose', '')),
                    'mass_kg': row.get('Mass', row.get('DryMass', 0)),
                    'decay_date': row.get('DDate', row.get('Decay', ''))
                }
                processed_data.append(sat)
            except Exception as e:
                continue
        
        # Create DataFrame
        processed_df = pd.DataFrame(processed_data)
        
        # Filter active satellites
        active_satellites = processed_df[
            (processed_df['decay_date'].isna() | (processed_df['decay_date'] == '')) &
            (processed_df['status'] != 'Inactive')
        ].copy()
        
        print(f"\n✅ Processed satellite data:")
        print(f"   Total satellites: {len(processed_df)}")
        print(f"   Active satellites: {len(active_satellites)}")
        
        # Save processed data
        output_path = "data/raw/gcat_satellites_processed.parquet"
        active_satellites.to_parquet(output_path, index=False)
        
        # Generate summary statistics
        summary = {
            "processing_date": datetime.now().isoformat(),
            "source": "GCAT - Jonathan McDowell",
            "total_objects": len(df),
            "total_satellites": len(processed_df),
            "active_satellites": len(active_satellites),
            "by_country": active_satellites['country'].value_counts().head(20).to_dict(),
            "by_orbit_type": active_satellites['orbit_type'].value_counts().to_dict(),
            "by_status": processed_df['status'].value_counts().to_dict()
        }
        
        # Show top satellite operators
        print("\n🏢 Top Satellite Operators (by active satellites):")
        print("-" * 50)
        country_counts = active_satellites['country'].value_counts().head(10)
        for country, count in country_counts.items():
            print(f"{country:20} {count:5d} satellites")
        
        # Show orbit distribution
        print("\n🌍 Orbit Type Distribution:")
        print("-" * 50)
        orbit_counts = active_satellites['orbit_type'].value_counts()
        for orbit, count in orbit_counts.items():
            print(f"{orbit:20} {count:5d} satellites")
        
        # Save summary
        with open("data/raw/gcat_summary.json", 'w') as f:
            json.dump(summary, f, indent=2)
        
        return active_satellites
        
    except Exception as e:
        print(f"❌ Error processing SATCAT: {e}")
        return None

def classify_orbit(row):
    """Classify orbit type based on orbital parameters"""
    # Try different column names
    period = row.get('Period', row.get('Per', 0))
    perigee = row.get('Perigee', row.get('Peri', 0))
    apogee = row.get('Apogee', row.get('Apo', 0))
    
    try:
        period = float(period) if period else 0
        perigee = float(perigee) if perigee else 0
        apogee = float(apogee) if apogee else 0
    except:
        return 'Unknown'
    
    # Classify based on period or altitude
    if period > 1200:  # > 20 hours
        return 'GEO'
    elif period > 600:  # 10-20 hours
        return 'MEO'
    elif apogee > 0 and apogee < 2000:
        return 'LEO'
    elif perigee > 35000:
        return 'GEO'
    elif perigee > 2000:
        return 'MEO'
    elif perigee > 0:
        return 'LEO'
    else:
        return 'Unknown'

def analyze_for_ground_stations(df):
    """Analyze satellite data for ground station demand"""
    print("\n📡 Ground Station Demand Analysis")
    print("=" * 60)
    
    if df is None or len(df) == 0:
        print("No data to analyze")
        return
    
    # LEO satellites need the most ground stations
    leo_sats = df[df['orbit_type'] == 'LEO']
    print(f"\n🌍 LEO Satellites: {len(leo_sats)}")
    print("   - Require global ground station networks")
    print("   - Need stations every ~3,000-5,000 km")
    print("   - High data downlink demand")
    
    # Top LEO operators
    if len(leo_sats) > 0:
        print("\n   Top LEO Operators:")
        leo_operators = leo_sats['country'].value_counts().head(5)
        for op, count in leo_operators.items():
            print(f"   - {op}: {count} satellites")
    
    # MEO satellites
    meo_sats = df[df['orbit_type'] == 'MEO']
    print(f"\n🌍 MEO Satellites: {len(meo_sats)}")
    print("   - Require fewer ground stations than LEO")
    print("   - Strategic positioning important")
    
    # GEO satellites
    geo_sats = df[df['orbit_type'] == 'GEO']
    print(f"\n🌍 GEO Satellites: {len(geo_sats)}")
    print("   - Need gateway stations with fiber connectivity")
    print("   - Location less critical but infrastructure more important")
    
    # Growth trends
    recent_sats = df[df['launch_date'].str.contains('202', na=False)]
    print(f"\n📈 Recent Growth (2020s): {len(recent_sats)} satellites")
    
    print("\n💡 Key Insights for Ground Station Investment:")
    print("1. LEO constellations driving massive demand")
    print("2. Polar regions critical for LEO coverage")
    print("3. Fiber connectivity essential for all ground stations")
    print("4. Weather diversity important for reliability")

def main():
    """Download and process GCAT satellite catalog"""
    
    # Download data
    files = download_gcat_data()
    
    # Process main satellite catalog
    if "satcat" in files:
        active_satellites = process_satcat(files["satcat"])
        
        # Analyze for ground station demand
        analyze_for_ground_stations(active_satellites)
    
    print("\n✅ GCAT satellite catalog processing complete!")
    print("\nThis provides:")
    print("- Complete satellite inventory")
    print("- Active satellite identification")
    print("- Orbit type classification")
    print("- Operator/country analysis")
    print("- Ground station demand indicators")

if __name__ == "__main__":
    main()