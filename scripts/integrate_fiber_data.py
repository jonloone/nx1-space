#!/usr/bin/env python3
"""
Integrate fiber optic network data for ground station site selection
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def create_fiber_connectivity_index():
    """Create comprehensive fiber connectivity index from multiple sources"""
    print("🌐 Creating Fiber Connectivity Index")
    print("=" * 60)
    
    # Load PeeringDB data
    ix_df = pd.read_parquet("data/raw/peeringdb_exchanges.parquet")
    fac_df = pd.read_parquet("data/raw/peeringdb_facilities.parquet")
    
    # Load existing cable landing points
    landing_df = pd.read_parquet("data/raw/cable_landing_points.parquet")
    
    # Load data center locations
    dc_df = pd.read_parquet("data/raw/cloud_datacenter_locations.parquet")
    
    print(f"Loaded data:")
    print(f"  - {len(ix_df)} Internet Exchange Points")
    print(f"  - {len(fac_df)} Colocation facilities")
    print(f"  - {len(landing_df)} Cable landing points")
    print(f"  - {len(dc_df)} Cloud data centers")
    
    # Create city-level connectivity scores
    connectivity = {}
    
    # Process IXPs (highest weight - critical for connectivity)
    for _, ix in ix_df.iterrows():
        city = ix['city']
        country = ix['country']
        if city and country:
            key = f"{city}, {country}"
            if key not in connectivity:
                connectivity[key] = {
                    'city': city,
                    'country': country,
                    'ix_count': 0,
                    'facility_count': 0,
                    'datacenter_count': 0,
                    'landing_points': 0,
                    'has_ipv6': False,
                    'international_connectivity': False
                }
            connectivity[key]['ix_count'] += 1
            if ix.get('proto_ipv6'):
                connectivity[key]['has_ipv6'] = True
    
    # Process facilities
    for _, fac in fac_df.iterrows():
        city = fac['city']
        country = fac['country']
        if city and country:
            key = f"{city}, {country}"
            if key not in connectivity:
                connectivity[key] = {
                    'city': city,
                    'country': country,
                    'ix_count': 0,
                    'facility_count': 0,
                    'datacenter_count': 0,
                    'landing_points': 0,
                    'has_ipv6': False,
                    'international_connectivity': False
                }
            connectivity[key]['facility_count'] += 1
            
            # Add coordinates if available
            if pd.notna(fac.get('latitude')) and pd.notna(fac.get('longitude')):
                connectivity[key]['latitude'] = fac['latitude']
                connectivity[key]['longitude'] = fac['longitude']
    
    # Process data centers
    for _, dc in dc_df.iterrows():
        city = dc['city']
        country = dc['country']
        key = f"{city}, {country}"
        if key not in connectivity:
            connectivity[key] = {
                'city': city,
                'country': country,
                'ix_count': 0,
                'facility_count': 0,
                'datacenter_count': 0,
                'landing_points': 0,
                'has_ipv6': True,  # All major cloud providers support IPv6
                'international_connectivity': True,
                'latitude': dc['lat'],
                'longitude': dc['lon']
            }
        connectivity[key]['datacenter_count'] += 1
    
    # Process cable landing points
    for _, landing in landing_df.iterrows():
        # Match to nearest city (simplified - using country for now)
        country = landing['country']
        for key, data in connectivity.items():
            if data['country'] == country:
                data['landing_points'] += 1
                data['international_connectivity'] = True
    
    # Calculate composite fiber connectivity score
    results = []
    for key, data in connectivity.items():
        # Scoring weights
        score = (
            data['ix_count'] * 20 +           # IXPs most important
            data['facility_count'] * 5 +       # Facilities indicate options
            data['datacenter_count'] * 15 +    # Cloud presence important
            data['landing_points'] * 10 +      # International connectivity
            (10 if data['has_ipv6'] else 0) + # IPv6 readiness
            (10 if data['international_connectivity'] else 0)
        )
        
        data['fiber_connectivity_score'] = score
        data['location_key'] = key
        results.append(data)
    
    # Convert to DataFrame and sort
    fiber_df = pd.DataFrame(results)
    fiber_df = fiber_df.sort_values('fiber_connectivity_score', ascending=False)
    
    # Save results
    fiber_df.to_parquet("data/raw/fiber_connectivity_index.parquet", index=False)
    
    print(f"\n✅ Created fiber connectivity index for {len(fiber_df)} locations")
    
    # Print top locations
    print("\n🏆 Top 20 locations by fiber connectivity:")
    for idx, row in fiber_df.head(20).iterrows():
        print(f"  {row['location_key']:30} Score: {row['fiber_connectivity_score']:>4} "
              f"(IXPs: {row['ix_count']}, Facilities: {row['facility_count']}, "
              f"DCs: {row['datacenter_count']})")
    
    return fiber_df

def create_ground_station_fiber_assessment(fiber_df):
    """Create ground station specific fiber assessment"""
    print("\n📡 Ground Station Fiber Infrastructure Assessment")
    print("-" * 50)
    
    # Categorize locations
    fiber_df['fiber_category'] = pd.cut(
        fiber_df['fiber_connectivity_score'],
        bins=[0, 50, 100, 200, 1000],
        labels=['limited', 'moderate', 'good', 'excellent']
    )
    
    # Regional analysis
    regional_avg = fiber_df.groupby('country')['fiber_connectivity_score'].agg(['mean', 'max', 'count'])
    regional_avg = regional_avg[regional_avg['count'] >= 3].sort_values('mean', ascending=False)
    
    print("\nTop countries by average fiber connectivity:")
    for country, stats in regional_avg.head(15).iterrows():
        print(f"  {country:20} Avg: {stats['mean']:>6.1f}, Max: {stats['max']:>4.0f}, Cities: {stats['count']:>3}")
    
    # Ground station recommendations
    excellent_sites = fiber_df[fiber_df['fiber_category'] == 'excellent']
    
    print(f"\n💎 Premium fiber locations (excellent category): {len(excellent_sites)}")
    print("These locations offer:")
    print("  • Multiple IXPs for peering options")
    print("  • Numerous colocation facilities")
    print("  • Major cloud provider presence")
    print("  • International submarine cable access")
    print("  • Competitive bandwidth pricing")
    
    # Create summary
    summary = {
        "processing_date": datetime.now().isoformat(),
        "total_locations_analyzed": len(fiber_df),
        "locations_by_category": fiber_df['fiber_category'].value_counts().to_dict(),
        "top_10_locations": fiber_df.head(10)[['location_key', 'fiber_connectivity_score']].to_dict('records'),
        "countries_with_excellent_fiber": list(excellent_sites['country'].unique()),
        "ground_station_recommendations": [
            "Prioritize 'excellent' category locations for primary sites",
            "Consider 'good' category for backup/diversity sites",
            "Evaluate specific carrier presence at facilities",
            "Negotiate bandwidth commitments for better pricing",
            "Ensure diverse fiber paths for redundancy"
        ],
        "key_fiber_hubs": [
            "Amsterdam - European interconnection hub",
            "Frankfurt - Central Europe + finance",
            "Singapore - Asia-Pacific hub",
            "London - Transatlantic gateway",
            "Ashburn - US East Coast hub",
            "São Paulo - South America hub",
            "Mumbai - South Asia gateway",
            "Hong Kong - China gateway"
        ]
    }
    
    with open("data/raw/fiber_assessment_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ Fiber assessment complete!")

if __name__ == "__main__":
    # Create fiber connectivity index
    fiber_index = create_fiber_connectivity_index()
    
    # Create ground station assessment
    create_ground_station_fiber_assessment(fiber_index)
    
    print("\n🎯 Key Takeaways:")
    print("1. Major IX locations offer best connectivity options")
    print("2. Cloud DC presence indicates mature fiber infrastructure")
    print("3. Coastal cities with cable landings crucial for international")
    print("4. Consider both local and international connectivity needs")