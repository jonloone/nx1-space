#!/usr/bin/env python3
"""
Generate rain fade statistics from NASA GPM precipitation data
Calculate signal attenuation for different frequency bands
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def calculate_rain_fade_statistics():
    """Calculate rain fade statistics from precipitation data"""
    print("🌧️ Calculating Rain Fade Statistics from Precipitation Data")
    print("=" * 60)
    
    # Load precipitation data
    precip_df = pd.read_parquet('data/raw/gpm_precipitation_processed.parquet')
    
    print(f"Loaded precipitation data for {len(precip_df)} locations")
    
    # ITU-R rain attenuation model parameters
    # Frequency-dependent coefficients (ITU-R P.838)
    freq_coefficients = {
        'C-band (4 GHz)': {'k': 0.00175, 'alpha': 1.308, 'freq_ghz': 4},
        'C-band (6 GHz)': {'k': 0.00616, 'alpha': 1.265, 'freq_ghz': 6},
        'X-band (8 GHz)': {'k': 0.0168, 'alpha': 1.217, 'freq_ghz': 8},
        'Ku-band (12 GHz)': {'k': 0.0533, 'alpha': 1.128, 'freq_ghz': 12},
        'Ku-band (14 GHz)': {'k': 0.0775, 'alpha': 1.099, 'freq_ghz': 14},
        'Ka-band (20 GHz)': {'k': 0.187, 'alpha': 1.021, 'freq_ghz': 20},
        'Ka-band (30 GHz)': {'k': 0.387, 'alpha': 0.928, 'freq_ghz': 30},
        'V-band (40 GHz)': {'k': 0.65, 'alpha': 0.851, 'freq_ghz': 40},
        'V-band (50 GHz)': {'k': 0.95, 'alpha': 0.791, 'freq_ghz': 50}
    }
    
    rain_fade_data = []
    
    # Group by location
    # First aggregate by region to get annual statistics
    region_stats = precip_df.groupby(['region', 'center_lat', 'center_lon']).agg({
        'mean_precipitation_mm': 'sum',  # Sum monthly to get annual
        'max_precipitation_mm': 'max',    # Max across months
        'percentile_95': 'max'            # Extreme precipitation
    }).reset_index()
    
    for idx, location in region_stats.iterrows():
        lat = location['center_lat']
        lon = location['center_lon']
        
        # Get precipitation statistics
        annual_precip = location['mean_precipitation_mm']
        max_precip = location['max_precipitation_mm']
        # Estimate rain days (days with >1mm rain)
        rain_days = annual_precip / 10  # Rough estimate
        
        # Calculate rain rate statistics (mm/hr)
        # Typical conversion: assume heavy rain events last 2-4 hours
        if rain_days > 0:
            avg_rain_rate = (annual_precip / rain_days) / 3  # mm/hr average
            # 0.01% exceeded rain rate (R0.01) - critical for link budget
            r001 = max_precip / 2  # Simplified estimate
        else:
            avg_rain_rate = 0
            r001 = 0
        
        # Calculate attenuation for each frequency band
        for band_name, coeffs in freq_coefficients.items():
            # Specific attenuation (dB/km) = k * R^alpha
            # where R is rain rate in mm/hr
            
            # Average attenuation
            avg_atten_db_km = coeffs['k'] * (avg_rain_rate ** coeffs['alpha']) if avg_rain_rate > 0 else 0
            
            # 0.01% exceeded attenuation (worst case)
            atten_001_db_km = coeffs['k'] * (r001 ** coeffs['alpha']) if r001 > 0 else 0
            
            # Typical slant path length through rain (simplified)
            # Depends on elevation angle and rain height
            if lat < 23:  # Tropical
                effective_path_km = 5.0
                rain_height_km = 5.0
            elif lat < 40:  # Temperate
                effective_path_km = 4.0
                rain_height_km = 4.0
            else:  # High latitude
                effective_path_km = 3.0
                rain_height_km = 3.0
            
            # Total path attenuation
            avg_fade_db = avg_atten_db_km * effective_path_km
            fade_001_db = atten_001_db_km * effective_path_km
            
            # Availability calculation
            # Rough estimate: heavy rain (>25mm/hr) causes outage
            if coeffs['freq_ghz'] <= 6:  # C-band and below
                availability = 99.9 if fade_001_db < 10 else 99.5
            elif coeffs['freq_ghz'] <= 14:  # Ku-band
                availability = 99.5 if fade_001_db < 15 else 99.0
            else:  # Ka-band and above
                availability = 99.0 if fade_001_db < 20 else 98.5
            
            rain_fade_data.append({
                'latitude': lat,
                'longitude': lon,
                'frequency_band': band_name,
                'frequency_ghz': coeffs['freq_ghz'],
                'annual_precipitation_mm': annual_precip,
                'rain_rate_avg_mm_hr': round(avg_rain_rate, 2),
                'rain_rate_001_mm_hr': round(r001, 2),
                'attenuation_avg_db_km': round(avg_atten_db_km, 3),
                'attenuation_001_db_km': round(atten_001_db_km, 3),
                'total_fade_avg_db': round(avg_fade_db, 2),
                'total_fade_001_db': round(fade_001_db, 2),
                'link_availability_percent': availability,
                'effective_path_length_km': effective_path_km,
                'rain_height_km': rain_height_km,
                'fade_margin_required_db': round(fade_001_db * 1.2, 1),  # 20% safety margin
                'suitable_for_band': fade_001_db < 20  # Practical threshold
            })
    
    # Convert to DataFrame
    fade_df = pd.DataFrame(rain_fade_data)
    
    # Save results
    fade_df.to_parquet('data/raw/rain_fade_statistics.parquet', index=False)
    print(f"✅ Generated rain fade statistics for {len(fade_df)} location/frequency combinations")
    
    # Analyze by frequency band
    print("\n📊 Rain Fade Impact by Frequency Band:")
    band_summary = fade_df.groupby('frequency_band').agg({
        'total_fade_001_db': ['mean', 'max'],
        'link_availability_percent': 'mean',
        'suitable_for_band': 'sum'
    }).round(2)
    
    print(band_summary)
    
    return fade_df

def create_rain_fade_recommendations():
    """Create recommendations based on rain fade analysis"""
    print("\n💡 Creating Rain Fade Mitigation Recommendations")
    print("=" * 60)
    
    fade_df = pd.read_parquet('data/raw/rain_fade_statistics.parquet')
    
    # Group by location and find best bands
    location_recommendations = []
    
    unique_locations = fade_df[['latitude', 'longitude', 'annual_precipitation_mm']].drop_duplicates()
    
    for _, loc in unique_locations.iterrows():
        lat, lon = loc['latitude'], loc['longitude']
        loc_data = fade_df[(fade_df['latitude'] == lat) & (fade_df['longitude'] == lon)]
        
        # Find bands with acceptable fade
        suitable_bands = loc_data[loc_data['suitable_for_band']]
        
        # Classify location
        annual_precip = loc['annual_precipitation_mm']
        if annual_precip < 500:
            climate = 'arid'
            risk_level = 'low'
        elif annual_precip < 1000:
            climate = 'moderate'
            risk_level = 'medium'
        elif annual_precip < 2000:
            climate = 'wet'
            risk_level = 'high'
        else:
            climate = 'tropical'
            risk_level = 'very high'
        
        # Best band recommendation
        if len(suitable_bands) > 0:
            # Prefer lower frequencies in high rain areas
            if risk_level in ['high', 'very high']:
                best_band = suitable_bands[suitable_bands['frequency_ghz'] <= 14].iloc[0] if len(suitable_bands[suitable_bands['frequency_ghz'] <= 14]) > 0 else suitable_bands.iloc[0]
            else:
                best_band = suitable_bands.iloc[-1]  # Higher frequency OK
            
            recommended_band = best_band['frequency_band']
            fade_margin = best_band['fade_margin_required_db']
        else:
            recommended_band = 'C-band (4 GHz)'  # Fallback
            fade_margin = 30
        
        location_recommendations.append({
            'latitude': lat,
            'longitude': lon,
            'annual_precipitation_mm': annual_precip,
            'climate_type': climate,
            'rain_fade_risk': risk_level,
            'recommended_primary_band': recommended_band,
            'required_fade_margin_db': fade_margin,
            'site_diversity_recommended': risk_level in ['high', 'very high'],
            'uplink_power_control_required': risk_level != 'low'
        })
    
    rec_df = pd.DataFrame(location_recommendations)
    rec_df.to_parquet('data/raw/rain_fade_recommendations.parquet', index=False)
    
    # Create summary
    summary = {
        'generation_date': datetime.now().isoformat(),
        'data_source': 'NASA GPM precipitation data',
        'locations_analyzed': len(rec_df),
        'risk_distribution': rec_df['rain_fade_risk'].value_counts().to_dict(),
        'mitigation_strategies': {
            'low_risk': {
                'fade_margin': '3-6 dB',
                'strategies': ['Standard link budget', 'Fixed power']
            },
            'medium_risk': {
                'fade_margin': '6-12 dB',
                'strategies': ['Uplink power control', 'Consider site diversity']
            },
            'high_risk': {
                'fade_margin': '12-20 dB',
                'strategies': ['Site diversity recommended', 'Adaptive coding/modulation', 'Lower frequency bands']
            },
            'very_high_risk': {
                'fade_margin': '20+ dB',
                'strategies': ['Site diversity required', 'C-band preferred', 'Multiple mitigation techniques']
            }
        },
        'frequency_recommendations': {
            'arid_regions': 'Any band suitable, Ka/V-band for high capacity',
            'moderate_regions': 'Ku/Ka-band with adequate margin',
            'wet_regions': 'C/Ku-band preferred, avoid Ka-band',
            'tropical_regions': 'C-band strongly preferred'
        }
    }
    
    with open('data/raw/rain_fade_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("✅ Rain fade analysis complete!")
    print(f"\nRisk distribution:")
    for risk, count in rec_df['rain_fade_risk'].value_counts().items():
        print(f"  {risk}: {count} locations")

if __name__ == "__main__":
    # Calculate rain fade statistics
    fade_stats = calculate_rain_fade_statistics()
    
    # Create recommendations
    create_rain_fade_recommendations()
    
    print("\n🎯 Generated rain fade data files:")
    print("  - data/raw/rain_fade_statistics.parquet")
    print("  - data/raw/rain_fade_recommendations.parquet") 
    print("  - data/raw/rain_fade_summary.json")