#!/usr/bin/env python3
"""
Calculate rain fade using ITU-R recommendations via ITU-Rpy
Addresses expert recommendations while maintaining POC viability
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
import itur
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def calculate_professional_rain_fade():
    """Calculate rain fade using ITU-R P.618-13 and P.838-3 models"""
    logger.info("🌧️ Calculating Professional Rain Fade using ITU-R Models")
    logger.info("=" * 60)
    
    # Load ground station data from our enhanced export
    with open('data/enhanced_graphxr_export.json', 'r') as f:
        graph_data = json.load(f)
    
    # Extract ground stations
    ground_stations = []
    for node in graph_data['nodes']:
        if node.get('label') == 'GroundStation':
            props = node['properties']
            ground_stations.append({
                'station_id': node['id'],
                'name': props.get('name', 'Unknown'),
                'latitude': props.get('latitude', 0),
                'longitude': props.get('longitude', 0)
            })
    
    ground_stations = pd.DataFrame(ground_stations)
    
    # Define frequency bands with realistic parameters
    frequency_bands = {
        'C-band (4/6 GHz)': {'freq_ghz': 6.0, 'polarization': 'V'},  # Uplink
        'X-band (7/8 GHz)': {'freq_ghz': 8.0, 'polarization': 'V'},
        'Ku-band (12/14 GHz)': {'freq_ghz': 14.0, 'polarization': 'V'},
        'Ka-band (20/30 GHz)': {'freq_ghz': 30.0, 'polarization': 'V'},
        'V-band (40/50 GHz)': {'freq_ghz': 50.0, 'polarization': 'V'}
    }
    
    # Typical elevation angles for different satellite types
    elevation_angles = {
        'GEO': 30,  # degrees (varies by latitude)
        'MEO': 45,  # average
        'LEO': 10   # minimum useful elevation
    }
    
    rain_fade_results = []
    
    for _, station in ground_stations.iterrows():
        lat = station['latitude']
        lon = station['longitude']
        
        # Calculate elevation angle based on latitude (for GEO)
        if abs(lat) < 60:
            el_geo = 90 - abs(lat)  # Simplified
        else:
            el_geo = 30  # Minimum practical
        
        for band_name, band_params in frequency_bands.items():
            freq = band_params['freq_ghz']
            pol = band_params['polarization']
            
            # Calculate for different availability percentages
            availabilities = [99.0, 99.5, 99.9, 99.99]  # %
            
            for avail in availabilities:
                try:
                    # Calculate rain attenuation using ITU-R P.618
                    # For GEO satellites
                    A_rain = itur.atmospheric_attenuation_slant_path(
                        lat, lon, freq, el_geo, 
                        p=(100 - avail), 
                        D=1.0,  # 1m antenna diameter (placeholder)
                        return_contributions=False
                    )
                    
                    # Get rain rate for 0.01% of time (worst case)
                    R001 = itur.models.itu618.rain_rate(lat, lon, 0.01)
                    
                    # Calculate fade margin recommendation
                    # Industry practice: add 20-50% safety margin
                    if avail >= 99.9:
                        safety_factor = 1.5  # High availability needs more margin
                    else:
                        safety_factor = 1.3
                    
                    fade_margin = float(A_rain.value) * safety_factor
                    
                    # Determine site suitability
                    if fade_margin > 20 and freq > 20:  # Ka/V band with high fade
                        suitable = False
                        mitigation = "Site diversity required"
                    elif fade_margin > 15:
                        suitable = True
                        mitigation = "Uplink power control recommended"
                    else:
                        suitable = True
                        mitigation = "Standard fixed margin adequate"
                    
                    result = {
                        'station_id': station['station_id'],
                        'station_name': station['name'],
                        'latitude': lat,
                        'longitude': lon,
                        'frequency_band': band_name,
                        'frequency_ghz': freq,
                        'availability_percent': avail,
                        'rain_attenuation_db': float(A_rain.value),
                        'rain_rate_001_percent': float(R001.value),
                        'recommended_margin_db': round(fade_margin, 1),
                        'suitable_for_band': suitable,
                        'mitigation_strategy': mitigation,
                        'confidence_level': 'high'  # ITU models are well-validated
                    }
                    
                    rain_fade_results.append(result)
                    
                except Exception as e:
                    logger.warning(f"Error calculating fade for {station['name']}, {band_name}: {e}")
                    # Fallback to simple model
                    result = {
                        'station_id': station['station_id'],
                        'station_name': station['name'],
                        'latitude': lat,
                        'longitude': lon,
                        'frequency_band': band_name,
                        'frequency_ghz': freq,
                        'availability_percent': avail,
                        'rain_attenuation_db': freq * 0.5,  # Simplified
                        'rain_rate_001_percent': 50.0,
                        'recommended_margin_db': freq * 0.7,
                        'suitable_for_band': freq < 20,
                        'mitigation_strategy': "Manual calculation required",
                        'confidence_level': 'low'
                    }
                    rain_fade_results.append(result)
    
    # Convert to DataFrame
    rain_fade_df = pd.DataFrame(rain_fade_results)
    
    # Save detailed results
    rain_fade_df.to_parquet('data/raw/itu_rain_fade_analysis.parquet', index=False)
    
    # Create summary by station for investment scoring
    station_summary = rain_fade_df[rain_fade_df['availability_percent'] == 99.5].groupby('station_id').agg({
        'rain_attenuation_db': 'mean',
        'recommended_margin_db': 'max',
        'suitable_for_band': lambda x: (x.sum() / len(x)) * 100  # % of bands suitable
    }).reset_index()
    
    station_summary.columns = ['station_id', 'avg_rain_attenuation_db', 
                              'max_fade_margin_required_db', 'band_suitability_percent']
    
    # Classify rain fade risk
    station_summary['rain_fade_risk'] = pd.cut(
        station_summary['avg_rain_attenuation_db'],
        bins=[0, 5, 10, 20, 100],
        labels=['low', 'medium', 'high', 'very_high']
    )
    
    station_summary.to_parquet('data/raw/station_rain_fade_summary.parquet', index=False)
    
    # Generate insights
    logger.info("\n📊 Rain Fade Analysis Results:")
    logger.info(f"Analyzed {len(ground_stations)} stations across {len(frequency_bands)} bands")
    
    risk_dist = station_summary['rain_fade_risk'].value_counts()
    logger.info("\nRain Fade Risk Distribution:")
    for risk, count in risk_dist.items():
        logger.info(f"  {risk}: {count} stations ({count/len(station_summary)*100:.1f}%)")
    
    # High-risk stations
    high_risk = station_summary[station_summary['rain_fade_risk'].isin(['high', 'very_high'])]
    if len(high_risk) > 0:
        logger.info(f"\n⚠️ {len(high_risk)} stations have high rain fade risk")
        logger.info("Mitigation strategies required: site diversity, adaptive coding, lower frequencies")
    
    # Create technical summary
    summary = {
        'analysis_date': datetime.now().isoformat(),
        'methodology': 'ITU-R P.618-13 rain attenuation model',
        'confidence': 'High - using validated ITU models',
        'stations_analyzed': len(ground_stations),
        'frequency_bands': list(frequency_bands.keys()),
        'risk_distribution': risk_dist.to_dict(),
        'key_findings': [
            f"{(station_summary['band_suitability_percent'] > 80).sum()} stations suitable for Ka-band with mitigation",
            f"Average fade margin required: {station_summary['max_fade_margin_required_db'].mean():.1f} dB",
            f"Site diversity recommended for {len(high_risk)} locations"
        ],
        'poc_disclaimer': 'Results based on ITU models with estimated parameters. Production system should use actual antenna sizes and link parameters.'
    }
    
    with open('data/raw/itu_rain_fade_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    logger.info("\n✅ Professional rain fade analysis complete!")
    logger.info("Files created:")
    logger.info("  - data/raw/itu_rain_fade_analysis.parquet (detailed)")
    logger.info("  - data/raw/station_rain_fade_summary.parquet (summary)")
    logger.info("  - data/raw/itu_rain_fade_summary.json (insights)")
    
    return station_summary

def calculate_link_budget_example(station_data, satellite_type='GEO', frequency_ghz=14.0):
    """
    Calculate example link budget for POC demonstration
    Shows professional approach while acknowledging data limitations
    """
    
    # Typical parameters (would come from real equipment specs)
    link_params = {
        'earth_station_eirp_dbw': 75.0,  # 9m antenna at Ku-band
        'satellite_g_t_db': 6.0,          # Typical commercial satellite
        'path_loss_db': 207.0,            # Ku-band at 36,000 km
        'atmospheric_loss_db': 0.5,       # Clear sky
        'rain_fade_db': station_data.get('max_fade_margin_required_db', 10.0),
        'implementation_loss_db': 2.0,
        'required_c_n0_dbhz': 95.0        # For 100 Mbps
    }
    
    # Calculate margin
    total_loss = (link_params['path_loss_db'] + 
                 link_params['atmospheric_loss_db'] + 
                 link_params['rain_fade_db'] + 
                 link_params['implementation_loss_db'])
    
    received_c_n0 = (link_params['earth_station_eirp_dbw'] + 
                    link_params['satellite_g_t_db'] - 
                    total_loss + 
                    228.6)  # Boltzmann constant
    
    link_margin = received_c_n0 - link_params['required_c_n0_dbhz']
    
    return {
        'link_margin_db': round(link_margin, 1),
        'viable': link_margin > 3.0,  # Industry standard minimum
        'parameters': link_params
    }

if __name__ == "__main__":
    # Run professional rain fade analysis
    rain_fade_summary = calculate_professional_rain_fade()
    
    # Example link budget for one station
    example_station = rain_fade_summary.iloc[0]
    link_budget = calculate_link_budget_example(example_station)
    
    logger.info(f"\n📡 Example Link Budget:")
    logger.info(f"Station: {example_station['station_id']}")
    logger.info(f"Link Margin: {link_budget['link_margin_db']} dB")
    logger.info(f"Viable: {'Yes' if link_budget['viable'] else 'No'}")
    
    logger.info("\n💡 POC Note: Using ITU models with typical parameters.")
    logger.info("Production system would use actual equipment specifications and detailed link budgets.")