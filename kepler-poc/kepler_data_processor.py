#!/usr/bin/env python3
"""
Kepler.gl Data Processor - Ultimate Compatibility Utility
Ensures perfect data formatting and compatibility with Kepler.gl visualization
"""

import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KeplerDataProcessor:
    """
    Advanced data processor for Kepler.gl compatibility
    Handles data cleaning, transformation, and optimization
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """Initialize processor with optional configuration"""
        self.config = config or self._get_default_config()
        self.validation_errors = []
        self.processing_warnings = []
        
    def _get_default_config(self) -> Dict:
        """Get default processing configuration"""
        return {
            'color_mapping': {
                'excellent': [0, 255, 0],      # Green
                'good': [255, 255, 0],          # Yellow  
                'moderate': [255, 165, 0],      # Orange
                'poor': [255, 0, 0]             # Red
            },
            'score_range': {'min': 0, 'max': 100},
            'radius_range': {'min': 10, 'max': 100},
            'elevation_multiplier': 1000,
            'required_fields': [
                'latitude', 'longitude', 'name', 
                'overall_investment_score', 'investment_recommendation'
            ],
            'field_types': {
                'latitude': 'real',
                'longitude': 'real', 
                'name': 'string',
                'operator': 'string',
                'country': 'string',
                'overall_investment_score': 'real',
                'investment_recommendation': 'string',
                'primary_antenna_size_m': 'real',
                'frequency_bands': 'string',
                'services_supported': 'string'
            }
        }
    
    def load_source_data(self, source_path: str) -> pd.DataFrame:
        """Load data from various source formats"""
        source_path = Path(source_path)
        
        try:
            if source_path.suffix.lower() == '.parquet':
                df = pd.read_parquet(source_path)
                logger.info(f"Loaded {len(df)} records from parquet file")
            elif source_path.suffix.lower() == '.csv':
                df = pd.read_csv(source_path)
                logger.info(f"Loaded {len(df)} records from CSV file")
            elif source_path.suffix.lower() == '.json':
                with open(source_path, 'r') as f:
                    data = json.load(f)
                if isinstance(data, dict) and 'data' in data and 'allData' in data['data']:
                    df = pd.DataFrame(data['data']['allData'])
                elif isinstance(data, list):
                    df = pd.DataFrame(data)
                else:
                    df = pd.DataFrame([data])
                logger.info(f"Loaded {len(df)} records from JSON file")
            else:
                raise ValueError(f"Unsupported file format: {source_path.suffix}")
                
            return df
            
        except Exception as e:
            logger.error(f"Failed to load data from {source_path}: {e}")
            raise
    
    def validate_and_clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate and clean the input data"""
        logger.info("Starting data validation and cleaning...")
        
        # Check required fields
        missing_fields = []
        for field in self.config['required_fields']:
            if field not in df.columns:
                missing_fields.append(field)
                
        if missing_fields:
            error_msg = f"Missing required fields: {missing_fields}"
            self.validation_errors.append(error_msg)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Clean the data
        cleaned_df = df.copy()
        
        # Validate and fix coordinates
        cleaned_df = self._clean_coordinates(cleaned_df)
        
        # Validate and fix scores
        cleaned_df = self._clean_scores(cleaned_df)
        
        # Validate and fix recommendations
        cleaned_df = self._clean_recommendations(cleaned_df)
        
        # Remove rows with critical missing data
        initial_count = len(cleaned_df)
        cleaned_df = cleaned_df.dropna(subset=self.config['required_fields'])
        if len(cleaned_df) < initial_count:
            warning = f"Removed {initial_count - len(cleaned_df)} rows with missing critical data"
            self.processing_warnings.append(warning)
            logger.warning(warning)
        
        logger.info(f"Data validation completed. {len(cleaned_df)} valid records.")
        return cleaned_df
    
    def _clean_coordinates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate geographical coordinates"""
        # Validate latitude
        invalid_lat = (df['latitude'] < -90) | (df['latitude'] > 90)
        if invalid_lat.any():
            warning = f"Found {invalid_lat.sum()} invalid latitude values"
            self.processing_warnings.append(warning)
            logger.warning(warning)
            # Clamp invalid values
            df.loc[df['latitude'] < -90, 'latitude'] = -90
            df.loc[df['latitude'] > 90, 'latitude'] = 90
        
        # Validate longitude
        invalid_lng = (df['longitude'] < -180) | (df['longitude'] > 180)
        if invalid_lng.any():
            warning = f"Found {invalid_lng.sum()} invalid longitude values"
            self.processing_warnings.append(warning)
            logger.warning(warning)
            # Wrap longitude values
            df['longitude'] = ((df['longitude'] + 180) % 360) - 180
        
        return df
    
    def _clean_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate investment scores"""
        if 'overall_investment_score' in df.columns:
            # Ensure scores are numeric
            df['overall_investment_score'] = pd.to_numeric(df['overall_investment_score'], errors='coerce')
            
            # Clamp scores to expected range
            score_min = self.config['score_range']['min']
            score_max = self.config['score_range']['max']
            
            invalid_scores = (df['overall_investment_score'] < score_min) | (df['overall_investment_score'] > score_max)
            if invalid_scores.any():
                warning = f"Found {invalid_scores.sum()} scores outside range [{score_min}, {score_max}]"
                self.processing_warnings.append(warning)
                logger.warning(warning)
                df.loc[df['overall_investment_score'] < score_min, 'overall_investment_score'] = score_min
                df.loc[df['overall_investment_score'] > score_max, 'overall_investment_score'] = score_max
        
        return df
    
    def _clean_recommendations(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate investment recommendations"""
        if 'investment_recommendation' in df.columns:
            valid_recommendations = set(self.config['color_mapping'].keys())
            invalid_recs = ~df['investment_recommendation'].isin(valid_recommendations)
            
            if invalid_recs.any():
                warning = f"Found {invalid_recs.sum()} invalid recommendations"
                self.processing_warnings.append(warning)
                logger.warning(warning)
                # Set invalid recommendations to 'moderate'
                df.loc[invalid_recs, 'investment_recommendation'] = 'moderate'
        
        return df
    
    def enhance_data_for_visualization(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add visualization-specific enhancements"""
        logger.info("Enhancing data for visualization...")
        
        enhanced_df = df.copy()
        
        # Add color coding
        enhanced_df['color'] = enhanced_df['investment_recommendation'].map(
            self.config['color_mapping']
        )
        
        # Add radius based on investment score
        if 'overall_investment_score' in enhanced_df.columns:
            score_range = enhanced_df['overall_investment_score'].max() - enhanced_df['overall_investment_score'].min()
            if score_range > 0:
                normalized_scores = (enhanced_df['overall_investment_score'] - enhanced_df['overall_investment_score'].min()) / score_range
            else:
                normalized_scores = 0.5  # Default to middle size if all scores are the same
                
            radius_range = self.config['radius_range']['max'] - self.config['radius_range']['min']
            enhanced_df['radius'] = self.config['radius_range']['min'] + (normalized_scores * radius_range)
        
        # Add elevation for 3D effect
        if 'overall_investment_score' in enhanced_df.columns:
            enhanced_df['elevation'] = enhanced_df['overall_investment_score'] * self.config['elevation_multiplier']
        
        # Create rich tooltips
        enhanced_df['tooltip'] = enhanced_df.apply(self._create_tooltip, axis=1)
        
        # Add timestamp
        enhanced_df['timestamp'] = datetime.now().isoformat()
        
        # Add station ID if missing
        if 'station_id' not in enhanced_df.columns:
            enhanced_df['station_id'] = enhanced_df.apply(
                lambda x: f"STATION_{enhanced_df.index.get_loc(x.name):03d}", axis=1
            )
        
        logger.info("Data enhancement completed")
        return enhanced_df
    
    def _create_tooltip(self, row) -> str:
        """Create rich HTML tooltip for a station"""
        tooltip_parts = []
        
        # Station name
        if 'name' in row and pd.notna(row['name']):
            tooltip_parts.append(f"<b>{row['name']}</b>")
        
        # Operator
        if 'operator' in row and pd.notna(row['operator']):
            tooltip_parts.append(f"Operator: {row['operator']}")
        
        # Investment info
        if 'overall_investment_score' in row and pd.notna(row['overall_investment_score']):
            tooltip_parts.append(f"Score: {row['overall_investment_score']:.1f}/100")
        
        if 'investment_recommendation' in row and pd.notna(row['investment_recommendation']):
            tooltip_parts.append(f"Recommendation: {row['investment_recommendation'].title()}")
        
        # Location
        if 'country' in row and pd.notna(row['country']):
            tooltip_parts.append(f"Country: {row['country']}")
        
        # Technical specs
        if 'primary_antenna_size_m' in row and pd.notna(row['primary_antenna_size_m']):
            tooltip_parts.append(f"Antenna: {row['primary_antenna_size_m']:.1f}m")
        
        if 'frequency_bands' in row and pd.notna(row['frequency_bands']):
            tooltip_parts.append(f"Bands: {row['frequency_bands']}")
        
        return "<br/>".join(tooltip_parts)
    
    def generate_kepler_structure(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate complete Kepler.gl data structure"""
        logger.info("Generating Kepler.gl data structure...")
        
        # Generate field definitions
        fields = self._generate_field_definitions(df)
        
        # Create data structure
        kepler_data = {
            'version': 'v1',
            'data': {
                'id': 'ground-stations',
                'label': 'Commercial Ground Stations',
                'color': [255, 203, 5],  # Default dataset color
                'allData': df.to_dict('records'),
                'fields': fields
            },
            'config': self._generate_kepler_config()
        }
        
        logger.info(f"Generated Kepler.gl structure with {len(df)} stations")
        return kepler_data
    
    def _generate_field_definitions(self, df: pd.DataFrame) -> List[Dict]:
        """Generate field definitions for Kepler.gl"""
        fields = []
        
        for column in df.columns:
            # Determine field type
            field_type = self.config['field_types'].get(column, 'string')
            
            # Map pandas dtypes to Kepler types if not in config
            if column not in self.config['field_types']:
                if df[column].dtype in ['int64', 'float64']:
                    field_type = 'real'
                elif df[column].dtype == 'bool':
                    field_type = 'boolean'
                else:
                    field_type = 'string'
            
            fields.append({
                'name': column,
                'type': field_type,
                'format': '',
                'analyzerType': field_type.upper()
            })
        
        return fields
    
    def _generate_kepler_config(self) -> Dict[str, Any]:
        """Generate optimized Kepler.gl configuration"""
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
                                'radius': 25,
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
                                        '#5A1846', '#900C3F', '#C70039',
                                        '#E3611C', '#F1920E', '#FFC300'
                                    ]
                                },
                                'strokeColorRange': {
                                    'name': 'Global Warming', 
                                    'type': 'sequential',
                                    'category': 'Uber',
                                    'colors': [
                                        '#5A1846', '#900C3F', '#C70039',
                                        '#E3611C', '#F1920E', '#FFC300'
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
                        'brush': {'size': 0.5, 'enabled': False},
                        'geocoder': {'enabled': False},
                        'coordinate': {'enabled': False}
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
                    'styleType': 'satellite',
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
    
    def process_and_export(self, source_path: str, output_path: str = 'kepler_ground_stations_processed.json') -> Dict[str, Any]:
        """Complete processing pipeline"""
        logger.info(f"Starting complete processing pipeline for {source_path}")
        
        try:
            # Load source data
            df = self.load_source_data(source_path)
            
            # Validate and clean
            cleaned_df = self.validate_and_clean_data(df)
            
            # Enhance for visualization
            enhanced_df = self.enhance_data_for_visualization(cleaned_df)
            
            # Generate Kepler structure
            kepler_data = self.generate_kepler_structure(enhanced_df)
            
            # Export to file
            output_file = Path(output_path)
            with open(output_file, 'w') as f:
                json.dump(kepler_data, f, indent=2)
            
            logger.info(f"Processing complete. Output saved to {output_file}")
            
            # Generate summary report
            report = {
                'source_file': str(source_path),
                'output_file': str(output_file),
                'records_processed': len(enhanced_df),
                'validation_errors': self.validation_errors,
                'processing_warnings': self.processing_warnings,
                'data_summary': {
                    'total_stations': len(enhanced_df),
                    'countries': enhanced_df['country'].nunique() if 'country' in enhanced_df.columns else 0,
                    'operators': enhanced_df['operator'].nunique() if 'operator' in enhanced_df.columns else 0,
                    'score_range': {
                        'min': float(enhanced_df['overall_investment_score'].min()),
                        'max': float(enhanced_df['overall_investment_score'].max())
                    } if 'overall_investment_score' in enhanced_df.columns else {},
                    'recommendation_distribution': enhanced_df['investment_recommendation'].value_counts().to_dict() if 'investment_recommendation' in enhanced_df.columns else {}
                }
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            raise

def main():
    """Main processing function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Process data for Kepler.gl visualization')
    parser.add_argument('input_file', help='Input data file (CSV, Parquet, or JSON)')
    parser.add_argument('-o', '--output', default='kepler_ground_stations_processed.json', 
                       help='Output JSON file for Kepler.gl')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Process data
    processor = KeplerDataProcessor()
    report = processor.process_and_export(args.input_file, args.output)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 PROCESSING SUMMARY")
    print("="*60)
    print(f"✅ Successfully processed: {report['records_processed']} records")
    print(f"📁 Output file: {report['output_file']}")
    
    if report['validation_errors']:
        print(f"\n❌ Validation Errors:")
        for error in report['validation_errors']:
            print(f"   • {error}")
    
    if report['processing_warnings']:
        print(f"\n⚠️  Processing Warnings:")
        for warning in report['processing_warnings']:
            print(f"   • {warning}")
    
    summary = report['data_summary']
    print(f"\n📈 Data Summary:")
    print(f"   • Total Stations: {summary['total_stations']}")
    print(f"   • Countries: {summary['countries']}")
    print(f"   • Operators: {summary['operators']}")
    if summary['score_range']:
        print(f"   • Score Range: {summary['score_range']['min']:.1f} - {summary['score_range']['max']:.1f}")
    print(f"   • Recommendations: {summary['recommendation_distribution']}")
    
    print(f"\n🎯 Ready for Kepler.gl visualization!")
    print(f"   Use file: {report['output_file']}")

if __name__ == "__main__":
    main()