#!/usr/bin/env python3
"""
Generate synthetic ITU-style spectrum and regulatory data for POC
Based on realistic patterns from public ITU information
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def generate_spectrum_allocations():
    """Generate realistic spectrum allocation data by country"""
    print("📡 Generating ITU Spectrum Allocation Data")
    print("=" * 60)
    
    # Countries list (focus on major markets)
    countries = [
        'USA', 'GBR', 'DEU', 'FRA', 'JPN', 'AUS', 'CAN', 'BRA', 'IND', 'CHN',
        'SGP', 'ARE', 'ZAF', 'NGA', 'EGY', 'KEN', 'IDN', 'THA', 'VNM', 'MYS',
        'NLD', 'BEL', 'CHE', 'SWE', 'NOR', 'DNK', 'FIN', 'POL', 'ESP', 'ITA',
        'MEX', 'ARG', 'CHL', 'COL', 'PER', 'KOR', 'TWN', 'HKG', 'NZL', 'ISR',
        'SAU', 'TUR', 'RUS', 'UKR', 'KAZ', 'PAK', 'BGD', 'LKA', 'PHL', 'MAR'
    ]
    
    # Common satellite bands for ground stations
    bands = [
        {'band': 'C-band', 'freq_range': '3.4-4.2 GHz (downlink), 5.85-6.725 GHz (uplink)', 
         'typical_use': 'GEO satellites, broadcast', 'interference_risk': 'moderate'},
        {'band': 'Ku-band', 'freq_range': '10.7-12.75 GHz (downlink), 13.75-14.5 GHz (uplink)', 
         'typical_use': 'VSAT, broadcast, HTS', 'interference_risk': 'low'},
        {'band': 'Ka-band', 'freq_range': '17.7-21.2 GHz (downlink), 27.5-31 GHz (uplink)', 
         'typical_use': 'HTS, broadband', 'interference_risk': 'low'},
        {'band': 'X-band', 'freq_range': '7.25-7.75 GHz (downlink), 7.9-8.4 GHz (uplink)', 
         'typical_use': 'Military, government', 'interference_risk': 'restricted'},
        {'band': 'S-band', 'freq_range': '2.17-2.29 GHz (downlink), 2.025-2.11 GHz (uplink)', 
         'typical_use': 'Mobile satellite', 'interference_risk': 'high'},
        {'band': 'L-band', 'freq_range': '1.525-1.559 GHz (downlink), 1.626-1.660 GHz (uplink)', 
         'typical_use': 'Mobile satellite, GPS', 'interference_risk': 'moderate'},
        {'band': 'V-band', 'freq_range': '37.5-42.5 GHz (downlink), 47.2-50.2 GHz (uplink)', 
         'typical_use': 'Future HTS', 'interference_risk': 'very low'},
        {'band': 'Q-band', 'freq_range': '37.5-42.5 GHz (downlink), 42.5-43.5 GHz (uplink)', 
         'typical_use': 'Experimental', 'interference_risk': 'very low'}
    ]
    
    spectrum_data = []
    
    for country in countries:
        # Simulate regulatory environment
        if country in ['USA', 'GBR', 'DEU', 'FRA', 'JPN', 'AUS', 'CAN', 'SGP', 'NLD']:
            regulatory_complexity = 'low'
            licensing_time = np.random.randint(30, 90)  # days
            annual_fees_base = np.random.randint(5000, 15000)  # USD
        elif country in ['CHN', 'RUS', 'SAU', 'ARE', 'VNM', 'IRN']:
            regulatory_complexity = 'high'
            licensing_time = np.random.randint(180, 365)
            annual_fees_base = np.random.randint(20000, 50000)
        else:
            regulatory_complexity = 'medium'
            licensing_time = np.random.randint(90, 180)
            annual_fees_base = np.random.randint(10000, 25000)
        
        for band in bands:
            # Simulate availability and restrictions
            if band['band'] == 'X-band' and country not in ['USA', 'GBR', 'FRA', 'ISR']:
                availability = 'restricted'
                civilian_use = False
            elif band['band'] == 'C-band' and country in ['USA', 'JPN', 'KOR']:
                availability = 'limited'  # 5G conflict
                civilian_use = True
            else:
                availability = 'available'
                civilian_use = True
            
            # Calculate interference risk based on country development
            if country in ['USA', 'JPN', 'GBR', 'DEU', 'FRA', 'SGP', 'HKG', 'KOR']:
                # Developed markets = more terrestrial services = higher interference
                if band['interference_risk'] == 'moderate':
                    actual_interference = 'high'
                elif band['interference_risk'] == 'low':
                    actual_interference = 'moderate'
                else:
                    actual_interference = band['interference_risk']
            else:
                actual_interference = band['interference_risk']
            
            spectrum_data.append({
                'country_code': country,
                'band_name': band['band'],
                'frequency_range': band['freq_range'],
                'typical_use': band['typical_use'],
                'availability': availability,
                'civilian_use': civilian_use,
                'interference_risk': actual_interference,
                'regulatory_complexity': regulatory_complexity,
                'typical_licensing_time_days': licensing_time,
                'annual_fee_usd_base': annual_fees_base,
                'coordination_required': band['band'] in ['C-band', 'Ku-band'],
                'rain_fade_sensitivity': band['band'] in ['Ka-band', 'V-band', 'Q-band']
            })
    
    spectrum_df = pd.DataFrame(spectrum_data)
    
    # Save spectrum data
    spectrum_df.to_parquet('data/raw/itu_spectrum_allocations.parquet', index=False)
    print(f"✅ Generated spectrum allocations for {len(countries)} countries across {len(bands)} bands")
    
    return spectrum_df

def generate_earth_station_regulations():
    """Generate earth station licensing requirements by country"""
    print("\n📋 Generating Earth Station Regulatory Data")
    print("=" * 60)
    
    countries_extended = pd.read_parquet('data/raw/itu_spectrum_allocations.parquet')['country_code'].unique()
    
    regulations = []
    
    for country in countries_extended:
        # Base requirements
        if country in ['USA', 'CAN', 'GBR', 'AUS', 'NZL']:
            reg_framework = 'streamlined'
            foreign_ownership = 'allowed'
            local_partner = False
            import_duties = np.random.uniform(0, 5)
        elif country in ['CHN', 'RUS', 'IND', 'IDN', 'VNM']:
            reg_framework = 'restrictive'
            foreign_ownership = 'restricted'
            local_partner = True
            import_duties = np.random.uniform(15, 30)
        else:
            reg_framework = 'standard'
            foreign_ownership = 'allowed_with_conditions'
            local_partner = np.random.choice([True, False])
            import_duties = np.random.uniform(5, 15)
        
        # Technical requirements
        min_antenna_spacing = np.random.choice([50, 100, 200, 500])  # meters
        max_eirp_dbw = np.random.choice([55, 60, 65, 70])  # dBW
        
        regulations.append({
            'country_code': country,
            'regulatory_framework': reg_framework,
            'foreign_ownership': foreign_ownership,
            'local_partner_required': local_partner,
            'import_duties_percent': round(import_duties, 1),
            'min_antenna_spacing_m': min_antenna_spacing,
            'max_eirp_dbw': max_eirp_dbw,
            'environmental_assessment': np.random.choice([True, False]),
            'aviation_clearance': True,  # Always required
            'landing_rights_process': np.random.choice(['automatic', 'per_satellite', 'negotiated']),
            'typical_approval_time_days': np.random.randint(30, 365),
            'annual_inspection': np.random.choice([True, False]),
            '24x7_monitoring_required': country in ['USA', 'CHN', 'RUS', 'IND'],
            'data_sovereignty_rules': country in ['CHN', 'RUS', 'IND', 'DEU', 'FRA', 'BRA']
        })
    
    reg_df = pd.DataFrame(regulations)
    reg_df.to_parquet('data/raw/itu_earth_station_regulations.parquet', index=False)
    print(f"✅ Generated earth station regulations for {len(reg_df)} countries")
    
    return reg_df

def generate_interference_zones():
    """Generate radio frequency interference risk zones"""
    print("\n⚠️ Generating RF Interference Risk Zones")
    print("=" * 60)
    
    # Major cities with high interference risk
    interference_zones = []
    
    # High-risk urban areas
    high_risk_cities = [
        {'city': 'New York', 'country': 'USA', 'lat': 40.7128, 'lon': -74.0060},
        {'city': 'Los Angeles', 'country': 'USA', 'lat': 34.0522, 'lon': -118.2437},
        {'city': 'London', 'country': 'GBR', 'lat': 51.5074, 'lon': -0.1278},
        {'city': 'Tokyo', 'country': 'JPN', 'lat': 35.6762, 'lon': 139.6503},
        {'city': 'Shanghai', 'country': 'CHN', 'lat': 31.2304, 'lon': 121.4737},
        {'city': 'Mumbai', 'country': 'IND', 'lat': 19.0760, 'lon': 72.8777},
        {'city': 'São Paulo', 'country': 'BRA', 'lat': -23.5505, 'lon': -46.6333},
        {'city': 'Mexico City', 'country': 'MEX', 'lat': 19.4326, 'lon': -99.1332},
        {'city': 'Cairo', 'country': 'EGY', 'lat': 30.0444, 'lon': 31.2357},
        {'city': 'Lagos', 'country': 'NGA', 'lat': 6.5244, 'lon': 3.3792}
    ]
    
    for city_info in high_risk_cities:
        # C-band interference (5G deployment)
        interference_zones.append({
            'zone_id': f"{city_info['city'].replace(' ', '_')}_C_band",
            'city': city_info['city'],
            'country': city_info['country'],
            'latitude': city_info['lat'],
            'longitude': city_info['lon'],
            'affected_band': 'C-band',
            'interference_type': '5G terrestrial',
            'risk_level': 'high',
            'radius_km': np.random.randint(30, 50),
            'mitigation': 'Use Ku/Ka-band or relocate >50km from city center'
        })
        
        # S-band interference (mobile services)
        interference_zones.append({
            'zone_id': f"{city_info['city'].replace(' ', '_')}_S_band",
            'city': city_info['city'],
            'country': city_info['country'],
            'latitude': city_info['lat'],
            'longitude': city_info['lon'],
            'affected_band': 'S-band',
            'interference_type': 'Mobile services',
            'risk_level': 'moderate',
            'radius_km': np.random.randint(20, 35),
            'mitigation': 'Use directional antennas and filtering'
        })
    
    # Radio telescope exclusion zones
    radio_telescopes = [
        {'name': 'Arecibo area', 'country': 'PRI', 'lat': 18.3464, 'lon': -66.7528, 'radius': 100},
        {'name': 'Green Bank', 'country': 'USA', 'lat': 38.4322, 'lon': -79.8397, 'radius': 160},
        {'name': 'Parkes', 'country': 'AUS', 'lat': -32.9977, 'lon': 148.2635, 'radius': 80},
        {'name': 'Effelsberg', 'country': 'DEU', 'lat': 50.5248, 'lon': 6.8836, 'radius': 50}
    ]
    
    for telescope in radio_telescopes:
        interference_zones.append({
            'zone_id': f"{telescope['name'].replace(' ', '_')}_exclusion",
            'city': telescope['name'],
            'country': telescope['country'],
            'latitude': telescope['lat'],
            'longitude': telescope['lon'],
            'affected_band': 'All bands',
            'interference_type': 'Radio telescope protection',
            'risk_level': 'exclusion',
            'radius_km': telescope['radius'],
            'mitigation': 'No transmissions allowed'
        })
    
    interference_df = pd.DataFrame(interference_zones)
    interference_df.to_parquet('data/raw/itu_interference_zones.parquet', index=False)
    print(f"✅ Generated {len(interference_df)} RF interference zones")
    
    return interference_df

def create_itu_summary():
    """Create summary of ITU-style data for ground station planning"""
    print("\n📊 Creating ITU Data Summary")
    print("=" * 60)
    
    # Load generated data
    spectrum_df = pd.read_parquet('data/raw/itu_spectrum_allocations.parquet')
    reg_df = pd.read_parquet('data/raw/itu_earth_station_regulations.parquet')
    interference_df = pd.read_parquet('data/raw/itu_interference_zones.parquet')
    
    # Best countries for ground stations
    reg_scores = reg_df.copy()
    reg_scores['regulatory_score'] = 0
    reg_scores.loc[reg_scores['regulatory_framework'] == 'streamlined', 'regulatory_score'] += 40
    reg_scores.loc[reg_scores['regulatory_framework'] == 'standard', 'regulatory_score'] += 20
    reg_scores.loc[reg_scores['foreign_ownership'] == 'allowed', 'regulatory_score'] += 20
    reg_scores.loc[~reg_scores['local_partner_required'], 'regulatory_score'] += 10
    reg_scores.loc[reg_scores['import_duties_percent'] < 10, 'regulatory_score'] += 10
    reg_scores.loc[reg_scores['typical_approval_time_days'] < 90, 'regulatory_score'] += 10
    reg_scores.loc[~reg_scores['data_sovereignty_rules'], 'regulatory_score'] += 10
    
    top_countries = reg_scores.nlargest(15, 'regulatory_score')[['country_code', 'regulatory_score']]
    
    summary = {
        'generation_date': datetime.now().isoformat(),
        'disclaimer': 'SYNTHETIC DATA FOR POC - Real ITU data requires membership',
        'statistics': {
            'countries_analyzed': len(spectrum_df['country_code'].unique()),
            'frequency_bands': len(spectrum_df['band_name'].unique()),
            'interference_zones': len(interference_df),
            'high_risk_zones': len(interference_df[interference_df['risk_level'] == 'high']),
            'exclusion_zones': len(interference_df[interference_df['risk_level'] == 'exclusion'])
        },
        'top_regulatory_countries': top_countries.to_dict('records'),
        'band_recommendations': {
            'primary': 'Ku-band (low interference, widely available)',
            'secondary': 'Ka-band (high capacity, rain fade consideration)',
            'avoid_urban': 'C-band (5G interference in developed markets)',
            'future': 'V-band (minimal interference, technology developing)'
        },
        'key_insights': [
            'C-band faces increasing interference from 5G in urban areas',
            'Ku/Ka-band optimal for most commercial applications',
            'Regulatory complexity varies significantly by region',
            'Radio telescope exclusion zones must be avoided',
            'Import duties can add 15-30% to equipment costs in some markets'
        ],
        'poc_note': 'This synthetic data represents typical ITU patterns. Production deployment requires official ITU BRIFIC data and spectrum management system access.'
    }
    
    with open('data/raw/itu_data_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ ITU-style data generation complete!")
    print("\nTop 5 countries by regulatory ease:")
    for _, row in top_countries.head().iterrows():
        print(f"  {row['country_code']}: Score {row['regulatory_score']}/100")

if __name__ == "__main__":
    # Generate all ITU-style datasets
    spectrum_df = generate_spectrum_allocations()
    regulations_df = generate_earth_station_regulations()
    interference_df = generate_interference_zones()
    
    # Create summary
    create_itu_summary()
    
    print("\n🎯 Generated ITU-style data files:")
    print("  - data/raw/itu_spectrum_allocations.parquet")
    print("  - data/raw/itu_earth_station_regulations.parquet")
    print("  - data/raw/itu_interference_zones.parquet")
    print("  - data/raw/itu_data_summary.json")
    print("\n⚠️ Remember: This is synthetic data for POC purposes only!")