#!/usr/bin/env python3
"""
GeoJSON Data Transformer for Ground Station Intelligence
Converts our ground station data to GeoJSON format for MapLibre
"""

import pandas as pd
import json
from pathlib import Path
from datetime import datetime

class GeoJSONTransformer:
    def __init__(self, data_path='../data'):
        self.data_path = Path(data_path)
        
    def load_ground_stations(self):
        """Load existing commercial ground station data"""
        try:
            # Load our commercial BI analysis data
            stations = pd.read_parquet(self.data_path / 'commercial_bi_analysis.parquet')
            print(f"✅ Loaded {len(stations)} commercial ground stations")
            return stations
        except FileNotFoundError:
            # Fallback to CSV if parquet not available
            stations = pd.read_csv(self.data_path / 'commercial_bi_analysis.csv')
            print(f"✅ Loaded {len(stations)} commercial ground stations from CSV")
            return stations
    
    def create_geojson(self, df):
        """Transform dataframe to GeoJSON format"""
        features = []
        
        for _, station in df.iterrows():
            # Create feature for each station
            feature = {
                "type": "Feature",
                "properties": {
                    # Core identifiers
                    "id": station['station_id'],
                    "name": station['name'],
                    "operator": station['operator'],
                    "country": station['country'],
                    "region": station.get('region', 'Unknown'),
                    
                    # Investment scores
                    "investment_score": float(station['overall_investment_score']),
                    "investment_recommendation": station['investment_recommendation'],
                    "investment_rationale": station.get('investment_rationale', ''),
                    
                    # Component scores
                    "market_opportunity": float(station['market_opportunity_score']),
                    "strategic_location": float(station['strategic_location_score']),
                    "competition": float(station['competition_score']),
                    "infrastructure": float(station['infrastructure_score']),
                    
                    # Technical specifications
                    "antenna_size_m": float(station['primary_antenna_size_m']),
                    "g_t_db": float(station['estimated_g_t_db']),
                    "eirp_dbw": float(station['estimated_eirp_dbw']),
                    "frequency_bands": station['frequency_bands'],
                    "services": station['services_supported'],
                    
                    # Weather risk categorization
                    "weather_risk": self.categorize_weather_risk(station),
                    
                    # Visual properties for styling
                    "marker_size": self.calculate_marker_size(station['overall_investment_score']),
                    "marker_color": self.get_color_for_score(station['overall_investment_score']),
                    
                    # Metadata
                    "confidence_level": station.get('confidence_level', 'medium'),
                    "data_quality": "Real location, illustrative scoring"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        float(station['longitude']),
                        float(station['latitude'])
                    ]
                }
            }
            
            features.append(feature)
        
        # Create FeatureCollection
        geojson = {
            "type": "FeatureCollection",
            "properties": {
                "name": "Commercial Ground Stations",
                "description": "Investment analysis of commercial satellite ground stations",
                "generated": datetime.now().isoformat(),
                "total_stations": len(features),
                "data_attribution": {
                    "locations": "Real commercial teleport locations (Intelsat, SES, etc.)",
                    "scores": "BI-level investment analysis methodology (illustrative)",
                    "weather": "NASA LIS verified where available"
                }
            },
            "features": features
        }
        
        return geojson
    
    def categorize_weather_risk(self, station):
        """Categorize weather risk based on location"""
        # Simple categorization based on region
        region = station.get('region', '')
        country = station.get('country', '')
        
        # High risk regions (tropical, monsoon)
        high_risk = ['Singapore', 'Indonesia', 'Malaysia', 'Thailand', 'Philippines',
                     'India', 'Bangladesh', 'Myanmar', 'Brazil']
        
        # Low risk regions (desert, temperate)
        low_risk = ['Egypt', 'Saudi Arabia', 'UAE', 'Chile', 'Australia']
        
        if any(c in country for c in high_risk):
            return 'high'
        elif any(c in country for c in low_risk):
            return 'low'
        elif region == 'Equatorial':
            return 'medium-high'
        elif region == 'Northern':
            return 'medium'
        else:
            return 'medium'
    
    def calculate_marker_size(self, score):
        """Calculate marker size based on investment score"""
        # Scale from 5 to 25 based on score (0-100)
        return 5 + (score / 100) * 20
    
    def get_color_for_score(self, score):
        """Get hex color based on investment score"""
        if score >= 80:
            return '#00ff00'  # Green - Excellent
        elif score >= 70:
            return '#ffff00'  # Yellow - Good
        elif score >= 60:
            return '#ffa500'  # Orange - Moderate
        else:
            return '#ff0000'  # Red - Poor
    
    def export_geojson(self, output_path='ground_stations.geojson'):
        """Export data as GeoJSON"""
        # Load data
        stations_df = self.load_ground_stations()
        
        # Transform to GeoJSON
        geojson = self.create_geojson(stations_df)
        
        # Save to file
        output_file = Path(output_path)
        with open(output_file, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"✅ Exported GeoJSON to {output_file}")
        
        # Print summary
        print("\n📊 GeoJSON Summary:")
        print(f"Total Features: {len(geojson['features'])}")
        print(f"Bounding Box: {self.calculate_bounds(geojson)}")
        
        # Distribution summary
        recommendations = {}
        for feature in geojson['features']:
            rec = feature['properties']['investment_recommendation']
            recommendations[rec] = recommendations.get(rec, 0) + 1
        
        print("\nInvestment Distribution:")
        for rec, count in sorted(recommendations.items()):
            print(f"  {rec}: {count} stations")
        
        return geojson
    
    def calculate_bounds(self, geojson):
        """Calculate bounding box for the features"""
        lngs = []
        lats = []
        
        for feature in geojson['features']:
            coords = feature['geometry']['coordinates']
            lngs.append(coords[0])
            lats.append(coords[1])
        
        return {
            'min_lng': min(lngs),
            'max_lng': max(lngs),
            'min_lat': min(lats),
            'max_lat': max(lats)
        }

if __name__ == "__main__":
    # Transform and export data
    transformer = GeoJSONTransformer()
    geojson = transformer.export_geojson('ground_stations.geojson')
    
    print("\n🎯 Ready for MapLibre visualization!")
    print("GeoJSON file can be served directly - no API keys needed!")