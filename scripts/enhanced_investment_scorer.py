#!/usr/bin/env python3
"""
Enhanced Investment Scorer with Statistical Rigor
Implements confidence intervals, data quality metrics, and professional terminology
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
from scipy import stats
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import pycountry
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedInvestmentScorer:
    """Professional investment scoring with statistical confidence"""
    
    def __init__(self):
        self.geocoder = Nominatim(user_agent="ground_station_poc")
        self.data_quality_threshold = 0.6  # Minimum data completeness for high confidence
        
    def load_all_data(self):
        """Load and consolidate all data sources"""
        logger.info("📊 Loading comprehensive dataset...")
        
        data = {}
        
        # Load core datasets
        try:
            data['ground_stations'] = pd.read_parquet('data/raw/satnogs_stations.parquet')
            data['weather'] = pd.read_parquet('data/raw/weather_patterns_gpm_real.parquet')
            data['fiber'] = pd.read_parquet('data/raw/fiber_connectivity_index.parquet')
            data['power'] = pd.read_parquet('data/raw/power_reliability_scores.parquet')
            data['political'] = pd.read_parquet('data/raw/political_stability_index.parquet')
            data['rain_fade'] = pd.read_parquet('data/raw/station_rain_fade_summary.parquet')
            data['economic'] = pd.read_parquet('data/raw/world_bank_indicators.parquet')
            data['disasters'] = pd.read_parquet('data/raw/seismic_risk_zones.parquet')
            
            logger.info("✅ Successfully loaded all core datasets")
            
        except Exception as e:
            logger.error(f"❌ Error loading datasets: {e}")
            return None
            
        return data
    
    def calculate_data_completeness(self, station_data):
        """Calculate data completeness score for a station"""
        total_fields = 0
        complete_fields = 0
        
        # Core location data (always available)
        core_fields = ['latitude', 'longitude', 'name']
        for field in core_fields:
            total_fields += 1
            if field in station_data and pd.notna(station_data[field]):
                complete_fields += 1
        
        # Enhanced data fields
        enhanced_fields = [
            'fiber_score', 'power_reliability_score', 'political_stability_score',
            'rain_fade_risk', 'economic_stability', 'disaster_risk'
        ]
        for field in enhanced_fields:
            total_fields += 1
            if field in station_data and pd.notna(station_data[field]):
                complete_fields += 1
        
        return complete_fields / total_fields if total_fields > 0 else 0
    
    def bootstrap_confidence_interval(self, scores, n_iterations=1000, confidence=0.95):
        """Calculate confidence interval using bootstrap resampling"""
        if len(scores) < 2:
            return {'lower': np.nan, 'upper': np.nan, 'width': np.nan}
        
        bootstrap_means = []
        for _ in range(n_iterations):
            sample = np.random.choice(scores, size=len(scores), replace=True)
            bootstrap_means.append(np.mean(sample))
        
        alpha = 1 - confidence
        lower_percentile = (alpha/2) * 100
        upper_percentile = (1 - alpha/2) * 100
        
        lower = np.percentile(bootstrap_means, lower_percentile)
        upper = np.percentile(bootstrap_means, upper_percentile)
        
        return {
            'lower': round(lower, 1),
            'upper': round(upper, 1),
            'width': round(upper - lower, 1)
        }
    
    def resolve_location_enhanced(self, name=None, lat=None, lon=None):
        """Enhanced location resolution with country information"""
        location_info = {
            'country_iso2': 'XX',
            'country_iso3': 'XXX',
            'country_name': 'Unknown',
            'region': 'Unknown',
            'confidence': 'low'
        }
        
        try:
            # Try coordinates first (most reliable)
            if lat and lon and not (pd.isna(lat) or pd.isna(lon)):
                location = self.geocoder.reverse((lat, lon), language='en', timeout=10)
                if location and location.raw.get('address'):
                    address = location.raw['address']
                    country_code = address.get('country_code', '').upper()
                    
                    if country_code and len(country_code) == 2:
                        try:
                            country = pycountry.countries.get(alpha_2=country_code)
                            if country:
                                location_info.update({
                                    'country_iso2': country.alpha_2,
                                    'country_iso3': country.alpha_3,
                                    'country_name': country.name,
                                    'confidence': 'high'
                                })
                                
                                # Determine region based on coordinates
                                if lat > 60:
                                    location_info['region'] = 'Arctic'
                                elif lat > 35:
                                    location_info['region'] = 'Northern'
                                elif lat > -35:
                                    location_info['region'] = 'Equatorial'
                                else:
                                    location_info['region'] = 'Southern'
                                    
                        except Exception:
                            pass
            
            # Fallback to name-based resolution
            elif name and not pd.isna(name):
                # Extract country from station name if possible
                common_countries = {
                    'US': 'US', 'USA': 'US', 'United States': 'US',
                    'Germany': 'DE', 'Japan': 'JP', 'UK': 'GB',
                    'France': 'FR', 'Italy': 'IT', 'Spain': 'ES'
                }
                
                for country_name, code in common_countries.items():
                    if country_name.lower() in name.lower():
                        try:
                            country = pycountry.countries.get(alpha_2=code)
                            if country:
                                location_info.update({
                                    'country_iso2': country.alpha_2,
                                    'country_iso3': country.alpha_3,
                                    'country_name': country.name,
                                    'confidence': 'medium'
                                })
                                break
                        except Exception:
                            pass
                            
        except Exception as e:
            logger.debug(f"Location resolution error: {e}")
        
        return location_info
    
    def calculate_professional_metrics(self, station_data):
        """Calculate professional satellite industry metrics"""
        metrics = {}
        
        # Antenna size estimation (if not provided)
        if 'antenna_size' not in station_data:
            # Estimate based on station type/name
            name = str(station_data.get('name', '')).lower()
            if any(x in name for x in ['large', 'major', 'primary']):
                antenna_size = 13.0  # meters
            elif any(x in name for x in ['medium', 'regional']):
                antenna_size = 9.0
            else:
                antenna_size = 6.3  # Standard commercial
        else:
            antenna_size = station_data['antenna_size']
        
        # Professional G/T estimation
        g_t_lookup = {
            3.7: 19.5,   # Small Ku-band
            6.3: 23.0,   # Medium Ku-band
            9.0: 27.5,   # Large Ku-band
            13.0: 31.0,  # C-band typical
            18.0: 33.0   # Large C-band
        }
        
        # Find closest antenna size
        closest_size = min(g_t_lookup.keys(), key=lambda x: abs(x - antenna_size))
        estimated_g_t = g_t_lookup[closest_size]
        
        # EIRP capability estimation
        estimated_eirp = 50 + 20 * np.log10(antenna_size)  # dBW, simplified
        
        # Service capabilities
        services_supported = []
        if antenna_size >= 9.0:
            services_supported.extend(['DTH', 'Broadcasting'])
        if antenna_size >= 3.7:
            services_supported.extend(['VSAT', 'Enterprise'])
        if antenna_size >= 6.0 and station_data.get('fiber_score', 0) > 50:
            services_supported.append('Gateway')
        if station_data.get('redundancy') == 'high':
            services_supported.append('TT&C')
            
        metrics.update({
            'antenna_size_m': antenna_size,
            'estimated_g_t_db': round(estimated_g_t, 1),
            'estimated_eirp_dbw': round(estimated_eirp, 1),
            'services_supported': services_supported,
            'service_capability_score': len(services_supported) * 20  # 0-100 scale
        })
        
        return metrics
    
    def calculate_investment_score_with_confidence(self, station_data, all_data=None):
        """Calculate investment score with statistical confidence"""
        
        # Extract all relevant scores
        scores = {}
        
        # Base infrastructure scores
        scores['location'] = 70  # Base score for having coordinates
        scores['fiber'] = station_data.get('fiber_score', 50)
        scores['power'] = station_data.get('power_reliability_score', 60)
        scores['political'] = station_data.get('political_stability_score', 50)
        scores['economic'] = station_data.get('economic_stability', 60)
        
        # Weather and environmental
        rain_fade_risk = station_data.get('rain_fade_risk', 'medium')
        rain_fade_scores = {'low': 90, 'medium': 70, 'high': 40, 'very_high': 20}
        scores['weather'] = rain_fade_scores.get(rain_fade_risk, 50)
        
        # Disaster risk
        disaster_risk = station_data.get('disaster_risk', 'medium')
        disaster_scores = {'low': 85, 'medium': 65, 'high': 35, 'very_high': 15}
        scores['disaster'] = disaster_scores.get(disaster_risk, 50)
        
        # Professional metrics
        professional_metrics = self.calculate_professional_metrics(station_data)
        scores['technical'] = professional_metrics['service_capability_score']
        
        # Calculate data completeness
        data_quality = self.calculate_data_completeness(station_data)
        
        # Weighted average (professional approach)
        weights = {
            'location': 0.10,
            'fiber': 0.20,
            'power': 0.15,
            'political': 0.15,
            'economic': 0.10,
            'weather': 0.15,
            'disaster': 0.05,
            'technical': 0.10
        }
        
        # Calculate weighted score
        weighted_score = sum(scores[key] * weights[key] for key in scores.keys())
        
        # Bootstrap confidence interval
        score_values = list(scores.values())
        confidence_interval = self.bootstrap_confidence_interval(score_values)
        
        # Determine confidence level
        if data_quality >= 0.8:
            confidence_level = 'high'
        elif data_quality >= 0.6:
            confidence_level = 'medium'
        else:
            confidence_level = 'low'
        
        # Generate recommendation
        if weighted_score >= 80 and confidence_level == 'high':
            recommendation = 'excellent'
            action = 'Proceed with investment planning'
        elif weighted_score >= 70 and confidence_level in ['high', 'medium']:
            recommendation = 'good'
            action = 'Detailed feasibility study recommended'
        elif weighted_score >= 60:
            recommendation = 'moderate'
            action = 'Risk assessment required'
        else:
            recommendation = 'poor'
            action = 'Not recommended without significant improvements'
        
        # If low data quality, adjust recommendation
        if data_quality < self.data_quality_threshold:
            action = f"Data collection required - {action.lower()}"
        
        return {
            'investment_score': round(weighted_score, 1),
            'confidence_interval': confidence_interval,
            'confidence_level': confidence_level,
            'data_quality': round(data_quality, 2),
            'recommendation': recommendation,
            'action': action,
            'component_scores': scores,
            'professional_metrics': professional_metrics,
            'score_weights': weights
        }

def enhance_all_stations():
    """Process all ground stations with enhanced scoring"""
    logger.info("🚀 Starting Enhanced Investment Analysis")
    logger.info("=" * 60)
    
    scorer = EnhancedInvestmentScorer()
    data = scorer.load_all_data()
    
    if data is None:
        logger.error("❌ Failed to load data")
        return False
    
    # Load existing enhanced export
    try:
        with open('data/enhanced_graphxr_export.json', 'r') as f:
            graph_data = json.load(f)
        logger.info("✅ Loaded existing GraphXR export")
    except Exception as e:
        logger.error(f"❌ Error loading GraphXR export: {e}")
        return False
    
    # Process ground stations
    enhanced_stations = []
    processed_count = 0
    
    for node in graph_data['nodes']:
        if node.get('label') == 'GroundStation':
            station_data = node['properties'].copy()
            
            # Add location resolution
            location_info = scorer.resolve_location_enhanced(
                name=station_data.get('name'),
                lat=station_data.get('latitude'),
                lon=station_data.get('longitude')
            )
            station_data.update(location_info)
            
            # Calculate enhanced investment score
            enhanced_score = scorer.calculate_investment_score_with_confidence(station_data, data)
            
            # Update node properties
            node['properties'].update({
                'enhanced_investment_score': enhanced_score['investment_score'],
                'confidence_interval_lower': enhanced_score['confidence_interval']['lower'],
                'confidence_interval_upper': enhanced_score['confidence_interval']['upper'],
                'confidence_level': enhanced_score['confidence_level'],
                'data_quality': enhanced_score['data_quality'],
                'investment_recommendation': enhanced_score['recommendation'],
                'investment_action': enhanced_score['action'],
                'estimated_g_t_db': enhanced_score['professional_metrics']['estimated_g_t_db'],
                'estimated_eirp_dbw': enhanced_score['professional_metrics']['estimated_eirp_dbw'],
                'services_supported': enhanced_score['professional_metrics']['services_supported'],
                'service_capability_score': enhanced_score['professional_metrics']['service_capability_score'],
                'country_iso2': location_info['country_iso2'],
                'country_name': location_info['country_name'],
                'region': location_info['region']
            })
            
            enhanced_stations.append({
                'station_id': node['id'],
                'name': station_data.get('name', 'Unknown'),
                **enhanced_score
            })
            
            processed_count += 1
            
            if processed_count % 10 == 0:
                logger.info(f"Processed {processed_count} stations...")
    
    # Save enhanced GraphXR export
    enhanced_filename = 'data/enhanced_graphxr_export_v2.json'
    with open(enhanced_filename, 'w') as f:
        json.dump(graph_data, f, indent=2)
    
    # Create analysis summary
    enhanced_df = pd.DataFrame(enhanced_stations)
    
    summary = {
        'analysis_date': datetime.now().isoformat(),
        'methodology': 'Enhanced statistical investment scoring with confidence intervals',
        'total_stations': len(enhanced_stations),
        'confidence_distribution': enhanced_df['confidence_level'].value_counts().to_dict(),
        'recommendation_distribution': enhanced_df['recommendation'].value_counts().to_dict(),
        'average_investment_score': round(enhanced_df['investment_score'].mean(), 1),
        'score_statistics': {
            'mean': round(enhanced_df['investment_score'].mean(), 1),
            'median': round(enhanced_df['investment_score'].median(), 1),
            'std': round(enhanced_df['investment_score'].std(), 1),
            'min': round(enhanced_df['investment_score'].min(), 1),
            'max': round(enhanced_df['investment_score'].max(), 1)
        },
        'high_confidence_investments': len(enhanced_df[
            (enhanced_df['confidence_level'] == 'high') & 
            (enhanced_df['investment_score'] >= 70)
        ]),
        'files_created': [
            enhanced_filename,
            'data/enhanced_investment_analysis.json'
        ]
    }
    
    with open('data/enhanced_investment_analysis.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Log results
    logger.info(f"\n📊 Enhanced Investment Analysis Complete!")
    logger.info(f"Processed: {processed_count} ground stations")
    logger.info(f"Average Score: {summary['average_investment_score']}")
    logger.info(f"High Confidence Investments: {summary['high_confidence_investments']}")
    
    logger.info(f"\nConfidence Distribution:")
    for level, count in summary['confidence_distribution'].items():
        logger.info(f"  {level}: {count} stations ({count/len(enhanced_stations)*100:.1f}%)")
    
    logger.info(f"\nRecommendation Distribution:")
    for rec, count in summary['recommendation_distribution'].items():
        logger.info(f"  {rec}: {count} stations ({count/len(enhanced_stations)*100:.1f}%)")
    
    logger.info(f"\n✅ Files created:")
    logger.info(f"  - {enhanced_filename}")
    logger.info(f"  - data/enhanced_investment_analysis.json")
    
    return True

if __name__ == "__main__":
    success = enhance_all_stations()
    if success:
        logger.info("\n🎯 Enhanced investment scoring complete! Ready for Kineviz visualization.")
    else:
        logger.error("\n❌ Enhancement failed. Check data files and try again.")