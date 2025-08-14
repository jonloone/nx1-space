#!/usr/bin/env python3
"""
Training Script for Network Intelligence ML Models

This script demonstrates how to train Random Forest models using 
the existing ground station data from the TypeScript frontend.

Usage:
    python train_ground_stations.py [--target profit|revenue|utilization|margin]
"""

import argparse
import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import pandas as pd
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_ground_station_data() -> List[Dict]:
    """Load ground station data from the TypeScript data file"""
    
    # Try to load from the TypeScript data files
    data_files = [
        '../data/groundStations.ts',
        'data/groundStations.ts', 
        '../data/ground_stations.json'
    ]
    
    for file_path in data_files:
        path = Path(file_path)
        if path.exists():
            try:
                if path.suffix == '.json':
                    with open(path, 'r') as f:
                        return json.load(f)
                elif path.suffix == '.ts':
                    # Parse TypeScript data file
                    return parse_typescript_data(path)
            except Exception as e:
                logger.warning(f"Failed to load {file_path}: {e}")
                continue
    
    # Fallback: create sample data based on known structure
    logger.warning("Could not load ground station data files, using sample data")
    return create_sample_data()

def parse_typescript_data(file_path: Path) -> List[Dict]:
    """Parse ground station data from TypeScript file"""
    logger.info(f"Parsing TypeScript data from {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the groundStationNetwork array
    start_marker = 'export const groundStationNetwork: GroundStation[] = ['
    end_marker = '];'
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        # Try alternative markers
        start_marker = 'groundStationNetwork = ['
        start_idx = content.find(start_marker)
    
    if start_idx == -1:
        raise ValueError("Could not find ground station data in TypeScript file")
    
    start_idx += len(start_marker)
    end_idx = content.find(end_marker, start_idx)
    
    if end_idx == -1:
        raise ValueError("Could not find end of ground station data")
    
    # Extract the array content
    array_content = content[start_idx:end_idx].strip()
    
    # Parse individual station objects
    stations = []
    station_objects = extract_station_objects(array_content)
    
    for obj_str in station_objects:
        try:
            station = parse_station_object(obj_str)
            if station:
                stations.append(station)
        except Exception as e:
            logger.warning(f"Failed to parse station object: {e}")
            continue
    
    logger.info(f"Parsed {len(stations)} stations from TypeScript file")
    return stations

def extract_station_objects(content: str) -> List[str]:
    """Extract individual station objects from TypeScript array"""
    objects = []
    current_obj = ""
    brace_count = 0
    in_object = False
    
    for char in content:
        if char == '{':
            if not in_object:
                in_object = True
                current_obj = "{"
            else:
                current_obj += char
            brace_count += 1
        elif char == '}':
            current_obj += char
            brace_count -= 1
            if brace_count == 0 and in_object:
                objects.append(current_obj)
                current_obj = ""
                in_object = False
        elif in_object:
            current_obj += char
    
    return objects

def parse_station_object(obj_str: str) -> Dict:
    """Parse a single station object from TypeScript"""
    station = {}
    
    # Remove braces and split by lines
    content = obj_str.strip('{}').strip()
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    for line in lines:
        if ':' not in line or line.startswith('//'):
            continue
            
        # Remove trailing comma
        line = line.rstrip(',')
        
        try:
            key, value = line.split(':', 1)
            key = key.strip().strip("'\"")
            value = value.strip()
            
            # Parse different value types
            if value.startswith("'") and value.endswith("'"):
                # String value
                station[key] = value.strip("'")
            elif value.startswith('"') and value.endswith('"'):
                # String value
                station[key] = value.strip('"')
            elif value.startswith('[') and value.endswith(']'):
                # Array value (simplified parsing)
                array_content = value.strip('[]')
                if array_content:
                    items = [item.strip().strip("'\"") for item in array_content.split(',')]
                    station[key] = items
                else:
                    station[key] = []
            elif value in ['true', 'false']:
                # Boolean value
                station[key] = value == 'true'
            else:
                # Try to parse as number
                try:
                    if '.' in value:
                        station[key] = float(value)
                    else:
                        station[key] = int(value)
                except ValueError:
                    # Fallback to string
                    station[key] = value
                    
        except ValueError:
            continue
    
    return station

def create_sample_data() -> List[Dict]:
    """Create sample ground station data for testing"""
    logger.info("Creating sample data for testing")
    
    sample_stations = []
    
    # SES stations (sample)
    ses_stations = [
        {
            'id': 'ses-betzdorf',
            'name': 'Betzdorf, Luxembourg',
            'operator': 'SES',
            'latitude': 49.6755,
            'longitude': 6.2663,
            'country': 'Luxembourg',
            'utilization': 92,
            'revenue': 56.5,
            'profit': 19.8,
            'margin': 0.35,
            'confidence': 0.95,
            'satellitesVisible': 18,
            'avgPassDuration': 45,
            'dataCapacity': 180,
            'serviceModel': 'Traditional',
            'networkType': 'GEO',
            'frequencyBands': ['C-band', 'Ku-band', 'Ka-band'],
            'opportunities': ['European hub', 'Regulatory advantages'],
            'risks': ['Limited expansion space'],
            'isActive': True
        },
        {
            'id': 'ses-princeton',
            'name': 'Princeton, NJ',
            'operator': 'SES',
            'latitude': 40.3573,
            'longitude': -74.6672,
            'country': 'United States',
            'utilization': 87,
            'revenue': 52.5,
            'profit': 15.8,
            'margin': 0.30,
            'confidence': 0.92,
            'satellitesVisible': 18,
            'avgPassDuration': 43,
            'dataCapacity': 180,
            'serviceModel': 'Traditional',
            'networkType': 'GEO',
            'opportunities': ['NYC market', 'Financial services'],
            'risks': ['High operational costs'],
            'isActive': True
        },
        {
            'id': 'ses-singapore',
            'name': 'Singapore Hub',
            'operator': 'SES',
            'latitude': 1.3521,
            'longitude': 103.8198,
            'country': 'Singapore',
            'utilization': 95,
            'revenue': 62.5,
            'profit': 21.9,
            'margin': 0.35,
            'confidence': 0.98,
            'satellitesVisible': 22,
            'avgPassDuration': 48,
            'dataCapacity': 200,
            'opportunities': ['Asia-Pacific hub', 'Maritime coordination'],
            'risks': ['High real estate costs'],
            'isActive': True
        }
    ]
    
    # Add some competitor stations
    competitor_stations = [
        {
            'id': 'viasat-san-diego',
            'name': 'San Diego, CA',
            'operator': 'Viasat',
            'latitude': 32.7157,
            'longitude': -117.1611,
            'country': 'United States',
            'utilization': 77,
            'revenue': 41.5,
            'profit': 8.3,
            'margin': 0.20,
            'confidence': 0.82,
            'satellitesVisible': 15,
            'avgPassDuration': 42,
            'dataCapacity': 110,
            'serviceModel': 'Traditional',
            'networkType': 'GEO',
            'opportunities': ['Military contracts', 'Border coverage'],
            'risks': ['High costs', 'Regulatory'],
            'isActive': True
        },
        {
            'id': 'spacex-redmond',
            'name': 'Redmond, WA',
            'operator': 'SpaceX',
            'latitude': 47.674,
            'longitude': -122.1215,
            'country': 'United States',
            'utilization': 82,
            'revenue': 45.4,
            'profit': 11.4,
            'margin': 0.25,
            'confidence': 0.85,
            'satellitesVisible': 25,
            'avgPassDuration': 12,
            'dataCapacity': 90,
            'serviceModel': 'Direct-to-Consumer',
            'networkType': 'LEO',
            'opportunities': ['Starlink gateway', 'Tech sector'],
            'risks': ['Constellation management', 'Competition'],
            'isActive': True
        }
    ]
    
    sample_stations.extend(ses_stations)
    sample_stations.extend(competitor_stations)
    
    # Add some variation to create more training data
    base_stations = sample_stations.copy()
    for i in range(15):  # Add 15 more stations with variations
        base_station = base_stations[i % len(base_stations)].copy()
        base_station['id'] = f"station_{i+10}"
        base_station['name'] = f"Station {i+10}"
        
        # Add some realistic variation
        base_station['utilization'] = max(50, min(100, base_station['utilization'] + (i % 20 - 10)))
        base_station['revenue'] = max(20, base_station['revenue'] * (0.8 + 0.4 * (i % 10) / 10))
        base_station['profit'] = base_station['revenue'] * (0.1 + 0.3 * (i % 8) / 8)
        base_station['margin'] = base_station['profit'] / base_station['revenue']
        base_station['confidence'] = 0.7 + 0.3 * (i % 5) / 5
        
        # Vary location slightly
        base_station['latitude'] += (i % 20 - 10) * 0.5
        base_station['longitude'] += (i % 20 - 10) * 0.5
        
        sample_stations.append(base_station)
    
    logger.info(f"Created {len(sample_stations)} sample stations")
    return sample_stations

def validate_station_data(stations: List[Dict]) -> List[Dict]:
    """Validate and clean station data"""
    valid_stations = []
    
    required_fields = ['latitude', 'longitude', 'revenue', 'profit', 'utilization']
    
    for station in stations:
        # Check required fields
        missing_fields = [field for field in required_fields if field not in station or station[field] is None]
        if missing_fields:
            logger.warning(f"Station {station.get('id', 'unknown')} missing fields: {missing_fields}")
            continue
        
        # Validate data types and ranges
        try:
            station['latitude'] = float(station['latitude'])
            station['longitude'] = float(station['longitude'])
            station['revenue'] = float(station['revenue'])
            station['profit'] = float(station['profit'])
            station['utilization'] = float(station['utilization'])
            
            # Validate ranges
            if not (-90 <= station['latitude'] <= 90):
                logger.warning(f"Invalid latitude for {station.get('id')}: {station['latitude']}")
                continue
                
            if not (-180 <= station['longitude'] <= 180):
                logger.warning(f"Invalid longitude for {station.get('id')}: {station['longitude']}")
                continue
                
            if station['revenue'] <= 0:
                logger.warning(f"Invalid revenue for {station.get('id')}: {station['revenue']}")
                continue
            
            # Calculate margin if missing
            if 'margin' not in station or station['margin'] is None:
                station['margin'] = station['profit'] / station['revenue']
            
            # Set default confidence if missing
            if 'confidence' not in station or station['confidence'] is None:
                station['confidence'] = 0.8
                
            valid_stations.append(station)
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Data validation error for {station.get('id')}: {e}")
            continue
    
    logger.info(f"Validated {len(valid_stations)} out of {len(stations)} stations")
    return valid_stations

async def train_model_via_api(stations: List[Dict], target_metric: str) -> bool:
    """Train model by calling the FastAPI service"""
    url = 'http://localhost:8000/train'
    
    payload = {
        'stations': stations,
        'target_metric': target_metric,
        'model_version': f'ground_stations_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    }
    
    try:
        logger.info(f"Sending training request to {url}")
        logger.info(f"Training {len(stations)} stations with target: {target_metric}")
        
        response = requests.post(url, json=payload, timeout=120)  # 2 minute timeout
        
        if response.status_code == 200:
            result = response.json()
            logger.info("Training completed successfully!")
            logger.info(f"Model version: {result['model_version']}")
            logger.info(f"Training duration: {result['training_duration_seconds']:.2f} seconds")
            logger.info(f"Performance metrics: {result['model_performance']}")
            logger.info("Top 5 feature importance:")
            
            # Sort and display feature importance
            importance = result['feature_importance']
            sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
            for feature, imp in sorted_features[:5]:
                logger.info(f"  {feature}: {imp:.4f}")
            
            return True
        else:
            logger.error(f"Training failed with status {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {e}")
        return False

def train_model_direct(stations: List[Dict], target_metric: str) -> bool:
    """Train model directly without API (fallback)"""
    logger.info("Training model directly (API not available)")
    
    try:
        from data_preprocessing import FeatureEngineer
        from models import OpportunityMLModel
        
        # Convert to DataFrame
        df = pd.DataFrame(stations)
        
        # Feature engineering
        feature_engineer = FeatureEngineer()
        X, feature_names = feature_engineer.engineer_features(df)
        
        # Extract target
        y = df[target_metric].values
        
        # Train model
        model = OpportunityMLModel()
        results = model.train(X, y, feature_names, target_metric)
        
        logger.info("Direct training completed!")
        logger.info(f"Performance: {results['performance']}")
        
        # Save model
        model_path = f"models/ground_stations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib"
        Path("models").mkdir(exist_ok=True)
        model.save_model(model_path)
        logger.info(f"Model saved to {model_path}")
        
        return True
        
    except ImportError as e:
        logger.error(f"Cannot import required modules: {e}")
        return False
    except Exception as e:
        logger.error(f"Direct training failed: {e}")
        return False

def check_service_health() -> bool:
    """Check if the ML service is running"""
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            health = response.json()
            logger.info(f"ML service is healthy: {health['status']}")
            return True
    except requests.exceptions.RequestException:
        pass
    
    logger.warning("ML service is not available")
    return False

async def main():
    """Main training script"""
    parser = argparse.ArgumentParser(description='Train Random Forest model for ground station opportunities')
    parser.add_argument(
        '--target', 
        choices=['profit', 'revenue', 'utilization', 'margin'],
        default='profit',
        help='Target metric to predict (default: profit)'
    )
    parser.add_argument(
        '--direct', 
        action='store_true',
        help='Train directly without using API service'
    )
    
    args = parser.parse_args()
    
    logger.info("Starting ground station ML training")
    logger.info(f"Target metric: {args.target}")
    
    # Load ground station data
    try:
        stations = load_ground_station_data()
        if not stations:
            logger.error("No ground station data available")
            return False
            
        logger.info(f"Loaded {len(stations)} ground stations")
        
        # Validate data
        valid_stations = validate_station_data(stations)
        if len(valid_stations) < 10:
            logger.error(f"Only {len(valid_stations)} valid stations, need at least 10")
            return False
        
        # Train model
        if args.direct or not check_service_health():
            success = train_model_direct(valid_stations, args.target)
        else:
            success = await train_model_via_api(valid_stations, args.target)
        
        if success:
            logger.info("Training completed successfully!")
            return True
        else:
            logger.error("Training failed")
            return False
            
    except Exception as e:
        logger.error(f"Training script failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)