#!/usr/bin/env python3
"""
Kepler.gl Data Transformer for Ground Station Intelligence
Transforms our existing commercial ground station data for Kepler.gl visualization
"""

import pandas as pd
import json
from pathlib import Path
import numpy as np
from datetime import datetime

class KeplerDataTransformer:
    def __init__(self, data_path='.'):
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
    
    def prepare_for_kepler(self, df):
        """Transform data to Kepler.gl format with rich metadata"""
        # Ensure all required columns are present
        required_cols = ['latitude', 'longitude', 'name', 'operator', 
                        'overall_investment_score', 'investment_recommendation']
        
        for col in required_cols:
            if col not in df.columns:
                print(f"⚠️ Missing column: {col}")
                
        # Clean and prepare data
        kepler_df = df.copy()
        
        # Add color coding based on recommendation
        color_map = {
            'excellent': [0, 255, 0],      # Green
            'good': [255, 255, 0],         # Yellow
            'moderate': [255, 165, 0],     # Orange
            'poor': [255, 0, 0]            # Red
        }
        
        kepler_df['color'] = kepler_df['investment_recommendation'].map(
            lambda x: color_map.get(x, [128, 128, 128])
        )
        
        # Add size based on investment score (normalize to 10-100 range)
        kepler_df['radius'] = kepler_df['overall_investment_score'].apply(
            lambda x: 10 + (x / 100) * 90
        )
        
        # Add elevation for 3D effect (higher score = higher elevation)
        kepler_df['elevation'] = kepler_df['overall_investment_score'] * 1000
        
        # Create hover information
        kepler_df['tooltip'] = kepler_df.apply(
            lambda row: f"{row['name']}<br/>" +
                       f"Operator: {row['operator']}<br/>" +
                       f"Score: {row['overall_investment_score']:.1f}/100<br/>" +
                       f"Recommendation: {row['investment_recommendation'].title()}<br/>" +
                       f"Country: {row['country']}",
            axis=1
        )
        
        # Add timestamp for animation potential
        kepler_df['timestamp'] = datetime.now().isoformat()
        
        # Create Kepler-compatible structure
        kepler_data = {
            'version': 'v1',
            'data': {
                'id': 'ground-stations',
                'label': 'Commercial Ground Stations',
                'color': [255, 203, 5],  # Default yellow
                'allData': kepler_df.to_dict('records'),
                'fields': self._generate_fields(kepler_df)
            },
            'config': self._generate_config()
        }
        
        return kepler_data
    
    def _generate_fields(self, df):
        """Generate field metadata for Kepler"""
        fields = []
        
        # Define field types and formatting
        field_config = {
            'name': {'type': 'string', 'format': ''},
            'operator': {'type': 'string', 'format': ''},
            'country': {'type': 'string', 'format': ''},
            'latitude': {'type': 'real', 'format': ''},
            'longitude': {'type': 'real', 'format': ''},
            'overall_investment_score': {'type': 'real', 'format': ''},
            'market_opportunity_score': {'type': 'real', 'format': ''},
            'strategic_location_score': {'type': 'real', 'format': ''},
            'competition_score': {'type': 'real', 'format': ''},
            'infrastructure_score': {'type': 'real', 'format': ''},
            'investment_recommendation': {'type': 'string', 'format': ''},
            'primary_antenna_size_m': {'type': 'real', 'format': ''},
            'estimated_g_t_db': {'type': 'real', 'format': ''},
            'estimated_eirp_dbw': {'type': 'real', 'format': ''},
            'frequency_bands': {'type': 'string', 'format': ''},
            'services_supported': {'type': 'string', 'format': ''},
            'investment_rationale': {'type': 'string', 'format': ''}
        }
        
        for col in df.columns:
            if col in field_config:
                fields.append({
                    'name': col,
                    'type': field_config[col]['type'],
                    'format': field_config[col]['format'],
                    'analyzerType': field_config[col]['type'].upper()
                })
        
        return fields
    
    def _generate_config(self):
        """Generate default Kepler configuration optimized for ground stations"""
        return {
            'version': 'v1',
            'config': {
                'visState': {
                    'filters': [],
                    'layers': [{
                        'id': 'ground-stations-layer',
                        'type': 'point',
                        'config': {
                            'dataId': 'ground-stations',
                            'label': 'Ground Stations',
                            'columns': {
                                'lat': 'latitude',
                                'lng': 'longitude',
                                'altitude': None
                            },
                            'isVisible': True,
                            'visConfig': {
                                'radius': 30,
                                'fixedRadius': False,
                                'opacity': 0.8,
                                'outline': True,
                                'thickness': 2,
                                'strokeColor': None,
                                'colorRange': {
                                    'name': 'Global Warming',
                                    'type': 'sequential',
                                    'category': 'Uber',
                                    'colors': [
                                        '#5A1846',
                                        '#900C3F',
                                        '#C70039',
                                        '#E3611C',
                                        '#F1920E',
                                        '#FFC300'
                                    ]
                                },
                                'strokeColorRange': {
                                    'name': 'Global Warming',
                                    'type': 'sequential',
                                    'category': 'Uber',
                                    'colors': [
                                        '#5A1846',
                                        '#900C3F',
                                        '#C70039',
                                        '#E3611C',
                                        '#F1920E',
                                        '#FFC300'
                                    ]
                                },
                                'radiusRange': [10, 100],
                                'filled': True
                            },
                            'colorField': {
                                'name': 'overall_investment_score',
                                'type': 'real'
                            },
                            'colorScale': 'quantile',
                            'sizeField': {
                                'name': 'overall_investment_score',
                                'type': 'real'
                            },
                            'sizeScale': 'sqrt'
                        },
                        'visualChannels': {
                            'colorField': {
                                'name': 'overall_investment_score',
                                'type': 'real'
                            },
                            'colorScale': 'quantile',
                            'sizeField': {
                                'name': 'overall_investment_score',
                                'type': 'real'
                            },
                            'sizeScale': 'sqrt'
                        }
                    }],
                    'interactionConfig': {
                        'tooltip': {
                            'fieldsToShow': {
                                'ground-stations': [
                                    {'name': 'name', 'format': None},
                                    {'name': 'operator', 'format': None},
                                    {'name': 'country', 'format': None},
                                    {'name': 'overall_investment_score', 'format': '.1f'},
                                    {'name': 'investment_recommendation', 'format': None},
                                    {'name': 'primary_antenna_size_m', 'format': '.1f'},
                                    {'name': 'frequency_bands', 'format': None}
                                ]
                            },
                            'compareMode': False,
                            'compareType': 'absolute',
                            'enabled': True
                        },
                        'brush': {
                            'size': 0.5,
                            'enabled': False
                        },
                        'geocoder': {
                            'enabled': False
                        },
                        'coordinate': {
                            'enabled': False
                        }
                    }
                },
                'mapState': {
                    'bearing': 0,
                    'dragRotate': False,
                    'latitude': 20,
                    'longitude': 0,
                    'pitch': 0,
                    'zoom': 2,
                    'isSplit': False
                },
                'mapStyle': {
                    'styleType': 'satellite',  # Will be handled by custom mapStyles
                    'topLayerGroups': {},
                    'visibleLayerGroups': {
                        'label': True,
                        'road': False,
                        'border': True,
                        'building': False,
                        'water': True,
                        'land': True,
                        '3d building': False
                    },
                    'threeDBuildingColor': [9.665468314072013, 17.18305478057247, 31.1442867897876],
                    'mapStyles': {}
                }
            }
        }
    
    def export_for_kepler(self, output_path='kepler_ground_stations.json'):
        """Export data in Kepler.gl format"""
        # Load data
        stations_df = self.load_ground_stations()
        
        # Transform for Kepler
        kepler_data = self.prepare_for_kepler(stations_df)
        
        # Save to file
        output_file = Path(output_path)
        with open(output_file, 'w') as f:
            json.dump(kepler_data, f, indent=2)
        
        print(f"✅ Exported Kepler.gl data to {output_file}")
        
        # Also export simplified CSV for direct upload
        csv_file = output_file.with_suffix('.csv')
        stations_df.to_csv(csv_file, index=False)
        print(f"✅ Exported CSV backup to {csv_file}")
        
        # Print summary statistics
        print("\n📊 Data Summary:")
        print(f"Total Stations: {len(stations_df)}")
        print(f"Countries: {stations_df['country'].nunique()}")
        print(f"Operators: {stations_df['operator'].nunique()}")
        print(f"\nInvestment Distribution:")
        print(stations_df['investment_recommendation'].value_counts())
        
        return kepler_data

if __name__ == "__main__":
    # Transform and export data
    transformer = KeplerDataTransformer()
    kepler_data = transformer.export_for_kepler('kepler_ground_stations.json')
    
    print("\n🎯 Ready for Kepler.gl visualization!")
    print("Next steps:")
    print("1. Upload kepler_ground_stations.json to kepler.gl/demo")
    print("2. Or use in React app with kepler.gl component")