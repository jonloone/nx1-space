#!/usr/bin/env python3
"""
Data Exploration and Validation for Ground Station Investment Analysis
Rigorous examination of all available real data sources
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Try to import optional dependencies
try:
    import netCDF4 as nc
    HAS_NETCDF = True
except ImportError:
    HAS_NETCDF = False

try:
    from scipy import stats
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

class DataExplorer:
    def __init__(self, data_path: str = '/mnt/blockstorage/nx1-space/data/raw'):
        self.data_path = Path(data_path)
        self.data_inventory = {}
        self.quality_report = {}
        
    def explore_all_data_sources(self) -> Dict[str, Any]:
        """Comprehensive exploration of all available data sources"""
        
        print("=== COMPREHENSIVE DATA SOURCE EXPLORATION ===")
        print(f"Data directory: {self.data_path}")
        
        # Key data sources to examine
        data_sources = {
            'commercial_ground_stations': 'commercial_ground_stations.parquet',
            'economic_indicators': 'economic_indicators.parquet', 
            'population_grid': 'population_grid.parquet',
            'power_reliability': 'power_reliability_scores.parquet',
            'fiber_connectivity': 'fiber_connectivity_index.parquet',
            'submarine_cables': 'submarine_cables_sample.parquet',
            'internet_exchanges': 'internet_exchanges.parquet',
            'seismic_risk': 'seismic_risk_zones.parquet',
            'precipitation_processed': 'gpm_precipitation_processed.parquet',
            'weather_patterns': 'weather_patterns_gpm_real.parquet',
            'cable_landing_points': 'cable_landing_points.parquet',
            'datacenter_locations': 'cloud_datacenter_locations.parquet',
            'peeringdb_exchanges': 'peeringdb_exchanges.parquet',
            'political_stability': 'political_stability_index.parquet',
            'bandwidth_pricing': 'bandwidth_pricing.parquet'
        }
        
        for source_name, filename in data_sources.items():
            file_path = self.data_path / filename
            if file_path.exists():
                print(f"\n--- Examining {source_name} ---")
                self.examine_parquet_file(source_name, file_path)
            else:
                print(f"❌ Missing: {filename}")
                
        # Examine NetCDF precipitation files
        self.examine_precipitation_netcdf()
        
        # Generate comprehensive quality report
        self.generate_quality_report()
        
        return self.data_inventory
    
    def examine_parquet_file(self, source_name: str, file_path: Path):
        """Examine a parquet file comprehensively"""
        try:
            df = pd.read_parquet(file_path)
            
            # Basic statistics
            info = {
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': df.dtypes.to_dict(),
                'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024**2,
                'file_size_mb': file_path.stat().st_size / 1024**2
            }
            
            print(f"✅ {source_name}: {info['rows']:,} rows, {info['columns']} columns")
            print(f"   Columns: {info['column_names']}")
            
            # Data quality assessment
            quality = self.assess_data_quality(df, source_name)
            info['quality'] = quality
            
            # Sample data
            info['sample'] = df.head(3).to_dict('records')
            
            # Geographic data detection
            geo_info = self.detect_geographic_columns(df)
            if geo_info:
                info['geographic'] = geo_info
                print(f"   Geographic: {geo_info}")
            
            # Statistical summary for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                info['numeric_summary'] = df[numeric_cols].describe().to_dict()
                
            # Categorical analysis
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns
            if len(categorical_cols) > 0:
                info['categorical_summary'] = {}
                for col in categorical_cols:
                    info['categorical_summary'][col] = {
                        'unique_values': df[col].nunique(),
                        'top_values': df[col].value_counts().head(5).to_dict()
                    }
            
            self.data_inventory[source_name] = info
            
        except Exception as e:
            print(f"❌ Error reading {source_name}: {e}")
            self.data_inventory[source_name] = {'error': str(e)}
    
    def examine_precipitation_netcdf(self):
        """Examine NetCDF precipitation files"""
        precip_dir = self.data_path / 'precipitation'
        if not precip_dir.exists():
            print("❌ No precipitation directory found")
            return
            
        nc_files = list(precip_dir.glob('*.nc4'))
        if not nc_files:
            print("❌ No NetCDF files found in precipitation directory")
            return
            
        print(f"\n--- Examining {len(nc_files)} NetCDF precipitation files ---")
        
        if not HAS_NETCDF:
            print("⚠️  NetCDF4 not available, using file count only")
            total_size = sum(f.stat().st_size for f in nc_files) / 1024**2
            self.data_inventory['nasa_gpm_precipitation'] = {
                'total_files': len(nc_files),
                'total_size_mb': total_size,
                'note': 'NetCDF4 library not available for detailed analysis'
            }
            return
        
        # Examine first file for structure
        try:
            sample_file = nc_files[0]
            with nc.Dataset(sample_file, 'r') as dataset:
                info = {
                    'total_files': len(nc_files),
                    'sample_file': sample_file.name,
                    'dimensions': dict(dataset.dimensions.items()),
                    'variables': list(dataset.variables.keys()),
                    'global_attributes': dict(dataset.__dict__),
                    'file_size_mb': sample_file.stat().st_size / 1024**2
                }
                
                # Get variable details
                var_details = {}
                for var_name, var in dataset.variables.items():
                    var_details[var_name] = {
                        'dimensions': var.dimensions,
                        'shape': var.shape,
                        'dtype': str(var.dtype),
                        'attributes': dict(var.__dict__)
                    }
                info['variable_details'] = var_details
                
                print(f"✅ NASA GPM Precipitation: {info['total_files']} files")
                print(f"   Dimensions: {info['dimensions']}")
                print(f"   Variables: {info['variables']}")
                
                self.data_inventory['nasa_gpm_precipitation'] = info
                
        except Exception as e:
            print(f"❌ Error reading NetCDF files: {e}")
            self.data_inventory['nasa_gpm_precipitation'] = {'error': str(e)}
    
    def assess_data_quality(self, df: pd.DataFrame, source_name: str) -> Dict[str, Any]:
        """Comprehensive data quality assessment"""
        quality = {}
        
        # Completeness
        quality['completeness'] = {
            'total_cells': df.size,
            'missing_cells': df.isnull().sum().sum(),
            'completeness_ratio': 1 - (df.isnull().sum().sum() / df.size),
            'missing_by_column': df.isnull().sum().to_dict()
        }
        
        # Uniqueness
        quality['uniqueness'] = {}
        for col in df.columns:
            total = len(df)
            unique = df[col].nunique()
            quality['uniqueness'][col] = {
                'unique_count': unique,
                'uniqueness_ratio': unique / total if total > 0 else 0,
                'duplicates': total - unique
            }
        
        # Outlier detection for numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0 and HAS_SCIPY:
            quality['outliers'] = {}
            for col in numeric_cols:
                if df[col].notna().sum() > 0:
                    z_scores = np.abs(stats.zscore(df[col].dropna()))
                    outliers = (z_scores > 3).sum()
                    quality['outliers'][col] = {
                        'outlier_count': int(outliers),
                        'outlier_ratio': outliers / len(df[col].dropna())
                    }
        elif len(numeric_cols) > 0:
            # Simple outlier detection without scipy
            quality['outliers'] = {}
            for col in numeric_cols:
                if df[col].notna().sum() > 0:
                    data = df[col].dropna()
                    q1, q3 = data.quantile(0.25), data.quantile(0.75)
                    iqr = q3 - q1
                    outliers = ((data < (q1 - 1.5 * iqr)) | (data > (q3 + 1.5 * iqr))).sum()
                    quality['outliers'][col] = {
                        'outlier_count': int(outliers),
                        'outlier_ratio': outliers / len(data)
                    }
        
        # Data type consistency
        quality['type_consistency'] = {}
        for col in df.columns:
            quality['type_consistency'][col] = {
                'dtype': str(df[col].dtype),
                'is_numeric': pd.api.types.is_numeric_dtype(df[col]),
                'is_datetime': pd.api.types.is_datetime64_any_dtype(df[col]),
                'is_categorical': pd.api.types.is_categorical_dtype(df[col])
            }
        
        return quality
    
    def detect_geographic_columns(self, df: pd.DataFrame) -> Optional[Dict[str, Any]]:
        """Detect and validate geographic columns"""
        geo_info = {}
        
        # Common geographic column patterns
        lat_patterns = ['lat', 'latitude', 'y', 'lat_deg']
        lon_patterns = ['lon', 'lng', 'longitude', 'x', 'lon_deg', 'long']
        
        lat_col = None
        lon_col = None
        
        # Find latitude column
        for col in df.columns:
            if any(pattern in col.lower() for pattern in lat_patterns):
                if pd.api.types.is_numeric_dtype(df[col]):
                    lat_col = col
                    break
        
        # Find longitude column  
        for col in df.columns:
            if any(pattern in col.lower() for pattern in lon_patterns):
                if pd.api.types.is_numeric_dtype(df[col]):
                    lon_col = col
                    break
        
        if lat_col and lon_col:
            lat_data = df[lat_col].dropna()
            lon_data = df[lon_col].dropna()
            
            geo_info = {
                'latitude_column': lat_col,
                'longitude_column': lon_col,
                'coordinate_count': min(len(lat_data), len(lon_data)),
                'lat_range': [float(lat_data.min()), float(lat_data.max())],
                'lon_range': [float(lon_data.min()), float(lon_data.max())],
                'valid_coordinates': self.validate_coordinates(lat_data, lon_data)
            }
            
            return geo_info
        
        return None
    
    def validate_coordinates(self, lat_data: pd.Series, lon_data: pd.Series) -> Dict[str, Any]:
        """Validate coordinate ranges and detect anomalies"""
        validation = {}
        
        # Valid ranges
        valid_lat = (-90 <= lat_data) & (lat_data <= 90)
        valid_lon = (-180 <= lon_data) & (lon_data <= 180)
        
        validation['valid_latitude_count'] = valid_lat.sum()
        validation['valid_longitude_count'] = valid_lon.sum()
        validation['invalid_latitude_count'] = (~valid_lat).sum()
        validation['invalid_longitude_count'] = (~valid_lon).sum()
        validation['valid_coordinate_pairs'] = (valid_lat & valid_lon).sum()
        
        # Check for (0,0) coordinates which might be null island
        null_island_count = ((lat_data == 0) & (lon_data == 0)).sum()
        validation['null_island_coordinates'] = int(null_island_count)
        
        return validation
    
    def generate_quality_report(self):
        """Generate comprehensive data quality report"""
        print("\n" + "="*60)
        print("COMPREHENSIVE DATA QUALITY REPORT")
        print("="*60)
        
        total_sources = len(self.data_inventory)
        valid_sources = len([s for s in self.data_inventory.values() if 'error' not in s])
        
        print(f"Total Data Sources: {total_sources}")
        print(f"Successfully Loaded: {valid_sources}")
        print(f"Load Success Rate: {valid_sources/total_sources*100:.1f}%")
        
        total_rows = 0
        total_geographic = 0
        
        for source_name, info in self.data_inventory.items():
            if 'error' not in info:
                if 'rows' in info:
                    total_rows += info['rows']
                if 'geographic' in info:
                    total_geographic += 1
        
        print(f"Total Data Records: {total_rows:,}")
        print(f"Geographic Data Sources: {total_geographic}")
        
        # Quality assessment summary
        print(f"\n--- DATA QUALITY SUMMARY ---")
        high_quality_sources = []
        medium_quality_sources = []
        low_quality_sources = []
        
        for source_name, info in self.data_inventory.items():
            if 'quality' in info:
                completeness = info['quality']['completeness']['completeness_ratio']
                if completeness >= 0.95:
                    high_quality_sources.append(source_name)
                elif completeness >= 0.80:
                    medium_quality_sources.append(source_name)
                else:
                    low_quality_sources.append(source_name)
        
        print(f"High Quality (>95% complete): {len(high_quality_sources)} sources")
        for source in high_quality_sources:
            print(f"  ✅ {source}")
            
        print(f"Medium Quality (80-95% complete): {len(medium_quality_sources)} sources") 
        for source in medium_quality_sources:
            print(f"  ⚠️  {source}")
            
        if low_quality_sources:
            print(f"Low Quality (<80% complete): {len(low_quality_sources)} sources")
            for source in low_quality_sources:
                print(f"  ❌ {source}")
        
        # Save detailed report
        self.save_exploration_report()
    
    def save_exploration_report(self):
        """Save detailed exploration report"""
        report_path = Path('/mnt/blockstorage/nx1-space/kepler-poc/data_exploration_report.json')
        
        # Convert numpy types to native Python types for JSON serialization
        def convert_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_types(item) for item in obj]
            else:
                return obj
        
        clean_inventory = convert_types(self.data_inventory)
        
        with open(report_path, 'w') as f:
            json.dump(clean_inventory, f, indent=2, default=str)
        
        print(f"\n📊 Detailed exploration report saved: {report_path}")
        return report_path

def main():
    """Main exploration routine"""
    explorer = DataExplorer()
    inventory = explorer.explore_all_data_sources()
    
    print(f"\n🎯 Data exploration complete!")
    print(f"📊 {len(inventory)} data sources analyzed")
    print(f"🚀 Ready for factor engineering phase")

if __name__ == "__main__":
    main()