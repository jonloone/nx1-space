"""
Data Connectors for Different Formats
Unified interface for reading Parquet, NetCDF4, JSON, CSV, and KML files
"""

import pandas as pd
import numpy as np
import json
import os
import glob
from typing import Dict, List, Optional, Any, Tuple, Union
from abc import ABC, abstractmethod
import logging
from datetime import datetime
import warnings

# Conditional imports for optional dependencies
try:
    import xarray as xr
    HAS_XARRAY = True
except ImportError:
    HAS_XARRAY = False
    warnings.warn("xarray not available - NetCDF4 support disabled")

try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False
    warnings.warn("geopandas not available - KML/shapefile support disabled")

try:
    from xml.etree import ElementTree as ET
    HAS_XML = True
except ImportError:
    HAS_XML = False

from .schemas import (
    DataSource, DataFormat, SpatialType, Coordinate, 
    ProcessingResult, DataQuality, DataLineage
)

logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """Base class for data connectors"""
    
    def __init__(self, data_source: DataSource):
        self.data_source = data_source
        self.logger = logging.getLogger(f"{self.__class__.__name__}")
    
    @abstractmethod
    def read(self, **kwargs) -> pd.DataFrame:
        """Read data and return as standardized DataFrame"""
        pass
    
    @abstractmethod
    def validate(self) -> ProcessingResult:
        """Validate the data source"""
        pass
    
    def extract_coordinates(self, df: pd.DataFrame) -> List[Coordinate]:
        """Extract coordinates from DataFrame based on source configuration"""
        coordinates = []
        coord_cols = self.data_source.coordinate_columns
        
        if len(coord_cols) >= 2:
            # Standard lat/lon columns
            lat_col = coord_cols[0] if 'lat' in coord_cols[0].lower() else coord_cols[1] 
            lon_col = coord_cols[1] if 'lon' in coord_cols[1].lower() else coord_cols[0]
            
            for _, row in df.iterrows():
                if pd.notna(row.get(lat_col)) and pd.notna(row.get(lon_col)):
                    coord = Coordinate(
                        latitude=float(row[lat_col]),
                        longitude=float(row[lon_col])
                    )
                    if coord.validate():
                        coordinates.append(coord)
        
        return coordinates
    
    def calculate_data_quality(self, df: pd.DataFrame) -> DataQuality:
        """Calculate data quality metrics"""
        total_cells = df.size
        non_null_cells = df.count().sum()
        
        completeness = non_null_cells / total_cells if total_cells > 0 else 0.0
        
        # Basic quality heuristics
        accuracy = 0.9  # Assume high accuracy for real data sources
        consistency = 0.8  # Default consistency score
        timeliness = 0.9  # Assume recent data
        
        return DataQuality(
            completeness=completeness,
            accuracy=accuracy,
            consistency=consistency,
            timeliness=timeliness
        )


class ParquetConnector(BaseConnector):
    """Connector for Parquet files"""
    
    def read(self, columns: Optional[List[str]] = None, 
             filters: Optional[List] = None, **kwargs) -> pd.DataFrame:
        """Read Parquet file"""
        try:
            df = pd.read_parquet(
                self.data_source.file_path,
                columns=columns,
                filters=filters,
                **kwargs
            )
            self.logger.info(f"Read {len(df)} records from {self.data_source.name}")
            return df
            
        except Exception as e:
            self.logger.error(f"Error reading Parquet file {self.data_source.file_path}: {e}")
            raise
    
    def validate(self) -> ProcessingResult:
        """Validate Parquet file"""
        errors = []
        warnings_list = []
        
        if not os.path.exists(self.data_source.file_path):
            errors.append(f"File not found: {self.data_source.file_path}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )
        
        try:
            # Read just the metadata to validate structure
            df_sample = pd.read_parquet(self.data_source.file_path, nrows=10)
            
            # Check for required coordinate columns
            missing_coords = [col for col in self.data_source.coordinate_columns 
                            if col not in df_sample.columns]
            if missing_coords:
                warnings_list.append(f"Missing coordinate columns: {missing_coords}")
            
            # Get full record count
            df_full = pd.read_parquet(self.data_source.file_path)
            record_count = len(df_full)
            
            quality = self.calculate_data_quality(df_full)
            
            return ProcessingResult(
                success=True,
                records_processed=record_count,
                records_failed=0,
                processing_time_seconds=0.1,
                data_quality=quality,
                warnings=warnings_list
            )
            
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )


class CSVConnector(BaseConnector):
    """Connector for CSV files"""
    
    def read(self, encoding: str = 'utf-8', delimiter: str = ',', **kwargs) -> pd.DataFrame:
        """Read CSV file"""
        try:
            df = pd.read_csv(
                self.data_source.file_path,
                encoding=encoding,
                delimiter=delimiter,
                **kwargs
            )
            self.logger.info(f"Read {len(df)} records from {self.data_source.name}")
            return df
            
        except Exception as e:
            self.logger.error(f"Error reading CSV file {self.data_source.file_path}: {e}")
            raise
    
    def validate(self) -> ProcessingResult:
        """Validate CSV file"""
        errors = []
        warnings_list = []
        
        if not os.path.exists(self.data_source.file_path):
            errors.append(f"File not found: {self.data_source.file_path}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )
        
        try:
            # Try different encodings and delimiters
            encodings = ['utf-8', 'latin-1', 'cp1252']
            delimiters = [',', ';', '\t']
            
            df = None
            for encoding in encodings:
                for delimiter in delimiters:
                    try:
                        df = pd.read_csv(
                            self.data_source.file_path, 
                            encoding=encoding, 
                            delimiter=delimiter,
                            nrows=10
                        )
                        if len(df.columns) > 1:  # Successfully parsed
                            break
                    except:
                        continue
                if df is not None and len(df.columns) > 1:
                    break
            
            if df is None or len(df.columns) <= 1:
                errors.append("Could not parse CSV file with standard encodings/delimiters")
                return ProcessingResult(
                    success=False,
                    records_processed=0,
                    records_failed=0,
                    processing_time_seconds=0.0,
                    errors=errors
                )
            
            # Check for required coordinate columns
            missing_coords = [col for col in self.data_source.coordinate_columns 
                            if col not in df.columns]
            if missing_coords:
                warnings_list.append(f"Missing coordinate columns: {missing_coords}")
            
            # Get full record count
            df_full = self.read()
            record_count = len(df_full)
            quality = self.calculate_data_quality(df_full)
            
            return ProcessingResult(
                success=True,
                records_processed=record_count,
                records_failed=0,
                processing_time_seconds=0.1,
                data_quality=quality,
                warnings=warnings_list
            )
            
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )


class JSONConnector(BaseConnector):
    """Connector for JSON files"""
    
    def read(self, **kwargs) -> pd.DataFrame:
        """Read JSON file"""
        try:
            with open(self.data_source.file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle different JSON structures
            if isinstance(data, list):
                df = pd.json_normalize(data)
            elif isinstance(data, dict):
                if 'features' in data:  # GeoJSON format
                    features = data['features']
                    records = []
                    for feature in features:
                        record = feature.get('properties', {})
                        if 'geometry' in feature:
                            geom = feature['geometry']
                            if geom['type'] == 'Point':
                                coords = geom['coordinates']
                                record['longitude'] = coords[0]
                                record['latitude'] = coords[1]
                        records.append(record)
                    df = pd.DataFrame(records)
                else:
                    # Try to normalize the dictionary
                    df = pd.json_normalize(data)
            else:
                raise ValueError(f"Unsupported JSON structure: {type(data)}")
            
            self.logger.info(f"Read {len(df)} records from {self.data_source.name}")
            return df
            
        except Exception as e:
            self.logger.error(f"Error reading JSON file {self.data_source.file_path}: {e}")
            raise
    
    def validate(self) -> ProcessingResult:
        """Validate JSON file"""
        errors = []
        warnings_list = []
        
        if not os.path.exists(self.data_source.file_path):
            errors.append(f"File not found: {self.data_source.file_path}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )
        
        try:
            df = self.read()
            
            # Check for required coordinate columns
            missing_coords = [col for col in self.data_source.coordinate_columns 
                            if col not in df.columns]
            if missing_coords:
                warnings_list.append(f"Missing coordinate columns: {missing_coords}")
            
            quality = self.calculate_data_quality(df)
            
            return ProcessingResult(
                success=True,
                records_processed=len(df),
                records_failed=0,
                processing_time_seconds=0.1,
                data_quality=quality,
                warnings=warnings_list
            )
            
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )


class NetCDF4Connector(BaseConnector):
    """Connector for NetCDF4 files"""
    
    def __init__(self, data_source: DataSource):
        super().__init__(data_source)
        if not HAS_XARRAY:
            raise ImportError("xarray required for NetCDF4 support")
    
    def read(self, variables: Optional[List[str]] = None, 
             time_slice: Optional[slice] = None, **kwargs) -> pd.DataFrame:
        """Read NetCDF4 file(s)"""
        try:
            # Handle wildcard paths
            if '*' in self.data_source.file_path:
                files = glob.glob(self.data_source.file_path)
                if not files:
                    raise FileNotFoundError(f"No files found matching {self.data_source.file_path}")
                files.sort()  # Ensure consistent ordering
            else:
                files = [self.data_source.file_path]
            
            datasets = []
            for file_path in files:
                ds = xr.open_dataset(file_path)
                if time_slice:
                    ds = ds.isel(time=time_slice)
                if variables:
                    ds = ds[variables]
                datasets.append(ds)
            
            # Combine datasets if multiple files
            if len(datasets) > 1:
                combined_ds = xr.concat(datasets, dim='time')
            else:
                combined_ds = datasets[0]
            
            # Convert to DataFrame
            df = combined_ds.to_dataframe().reset_index()
            
            # Close datasets
            for ds in datasets:
                ds.close()
            
            self.logger.info(f"Read {len(df)} records from {len(files)} NetCDF4 file(s)")
            return df
            
        except Exception as e:
            self.logger.error(f"Error reading NetCDF4 file(s) {self.data_source.file_path}: {e}")
            raise
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get NetCDF4 file metadata"""
        try:
            files = glob.glob(self.data_source.file_path) if '*' in self.data_source.file_path else [self.data_source.file_path]
            if not files:
                return {}
            
            ds = xr.open_dataset(files[0])
            metadata = {
                'dimensions': dict(ds.dims),
                'variables': list(ds.data_vars),
                'coordinates': list(ds.coords),
                'attributes': dict(ds.attrs)
            }
            ds.close()
            return metadata
            
        except Exception as e:
            self.logger.error(f"Error reading NetCDF4 metadata: {e}")
            return {}
    
    def validate(self) -> ProcessingResult:
        """Validate NetCDF4 file(s)"""
        errors = []
        warnings_list = []
        
        try:
            files = glob.glob(self.data_source.file_path) if '*' in self.data_source.file_path else [self.data_source.file_path]
            
            if not files:
                errors.append(f"No files found matching: {self.data_source.file_path}")
                return ProcessingResult(
                    success=False,
                    records_processed=0,
                    records_failed=0,
                    processing_time_seconds=0.0,
                    errors=errors
                )
            
            # Validate each file
            total_records = 0
            for file_path in files[:3]:  # Check first 3 files only for performance
                if not os.path.exists(file_path):
                    errors.append(f"File not found: {file_path}")
                    continue
                
                try:
                    ds = xr.open_dataset(file_path)
                    
                    # Check for required coordinate dimensions
                    missing_coords = [col for col in self.data_source.coordinate_columns 
                                    if col not in ds.coords and col not in ds.dims]
                    if missing_coords:
                        warnings_list.append(f"Missing coordinates in {file_path}: {missing_coords}")
                    
                    # Estimate record count
                    total_records += ds.sizes.get('time', 1) * ds.sizes.get('lat', 1) * ds.sizes.get('lon', 1)
                    ds.close()
                    
                except Exception as e:
                    errors.append(f"Error validating {file_path}: {str(e)}")
            
            if errors:
                return ProcessingResult(
                    success=False,
                    records_processed=0,
                    records_failed=len(errors),
                    processing_time_seconds=0.1,
                    errors=errors
                )
            
            # Basic quality assessment for NetCDF data
            quality = DataQuality(
                completeness=0.95,  # NetCDF usually has complete grids
                accuracy=0.9,       # High accuracy for scientific data
                consistency=0.9,    # Consistent format
                timeliness=0.8      # May not be real-time
            )
            
            return ProcessingResult(
                success=True,
                records_processed=total_records,
                records_failed=0,
                processing_time_seconds=0.1,
                data_quality=quality,
                warnings=warnings_list
            )
            
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )


class KMLConnector(BaseConnector):
    """Connector for KML files"""
    
    def __init__(self, data_source: DataSource):
        super().__init__(data_source)
        if not HAS_GEOPANDAS:
            raise ImportError("geopandas required for KML support")
    
    def read(self, **kwargs) -> pd.DataFrame:
        """Read KML file"""
        try:
            # Use geopandas to read KML
            gdf = gpd.read_file(self.data_source.file_path, driver='KML')
            
            # Extract coordinates from geometry
            if 'geometry' in gdf.columns:
                # Get centroids for polygons, direct coordinates for points
                coords = gdf.geometry.centroid
                gdf['longitude'] = coords.x
                gdf['latitude'] = coords.y
                
                # For linestrings, use the first point
                linestring_mask = gdf.geometry.geom_type == 'LineString'
                if linestring_mask.any():
                    first_coords = gdf.loc[linestring_mask, 'geometry'].apply(
                        lambda x: x.coords[0] if x.coords else (None, None)
                    )
                    gdf.loc[linestring_mask, 'longitude'] = [c[0] for c in first_coords]
                    gdf.loc[linestring_mask, 'latitude'] = [c[1] for c in first_coords]
            
            # Convert to regular DataFrame
            df = pd.DataFrame(gdf.drop(columns=['geometry'] if 'geometry' in gdf.columns else []))
            
            self.logger.info(f"Read {len(df)} records from {self.data_source.name}")
            return df
            
        except Exception as e:
            self.logger.error(f"Error reading KML file {self.data_source.file_path}: {e}")
            raise
    
    def validate(self) -> ProcessingResult:
        """Validate KML file"""
        errors = []
        warnings_list = []
        
        if not os.path.exists(self.data_source.file_path):
            errors.append(f"File not found: {self.data_source.file_path}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )
        
        try:
            df = self.read()
            quality = self.calculate_data_quality(df)
            
            return ProcessingResult(
                success=True,
                records_processed=len(df),
                records_failed=0,
                processing_time_seconds=0.1,
                data_quality=quality,
                warnings=warnings_list
            )
            
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=0.0,
                errors=errors
            )


class ConnectorFactory:
    """Factory for creating appropriate data connectors"""
    
    _connectors = {
        DataFormat.PARQUET: ParquetConnector,
        DataFormat.CSV: CSVConnector,
        DataFormat.JSON: JSONConnector,
        DataFormat.NETCDF4: NetCDF4Connector,
        DataFormat.KML: KMLConnector,
    }
    
    @classmethod
    def create_connector(cls, data_source: DataSource) -> BaseConnector:
        """Create appropriate connector for data source"""
        connector_class = cls._connectors.get(data_source.format)
        
        if connector_class is None:
            raise ValueError(f"Unsupported data format: {data_source.format}")
        
        return connector_class(data_source)
    
    @classmethod
    def validate_all_sources(cls, data_sources: List[DataSource]) -> Dict[str, ProcessingResult]:
        """Validate all data sources"""
        results = {}
        
        for source in data_sources:
            try:
                connector = cls.create_connector(source)
                result = connector.validate()
                results[source.name] = result
                
            except Exception as e:
                results[source.name] = ProcessingResult(
                    success=False,
                    records_processed=0,
                    records_failed=0,
                    processing_time_seconds=0.0,
                    errors=[f"Connector creation failed: {str(e)}"]
                )
        
        return results


def create_geocoding_cache() -> Dict[str, Coordinate]:
    """Create cache for commonly geocoded locations"""
    cache = {
        # Major cities and regions
        "New York": Coordinate(40.7128, -74.0060),
        "London": Coordinate(51.5074, -0.1278),
        "Tokyo": Coordinate(35.6762, 139.6503),
        "Singapore": Coordinate(1.3521, 103.8198),
        "Frankfurt": Coordinate(50.1109, 8.6821),
        "Hong Kong": Coordinate(22.3193, 114.1694),
        
        # Country codes to approximate centroids
        "US": Coordinate(39.8283, -98.5795),
        "GB": Coordinate(55.3781, -3.4360),
        "DE": Coordinate(51.1657, 10.4515),
        "JP": Coordinate(36.2048, 138.2529),
        "SG": Coordinate(1.3521, 103.8198),
        "CN": Coordinate(35.8617, 104.1954),
        "IN": Coordinate(20.5937, 78.9629),
        "BR": Coordinate(-14.2350, -51.9253),
        "AU": Coordinate(-25.2744, 133.7751),
        "CA": Coordinate(56.1304, -106.3468),
    }
    
    return cache


def geocode_location(location: str, cache: Optional[Dict[str, Coordinate]] = None) -> Optional[Coordinate]:
    """
    Simple geocoding function using cache
    For production, integrate with geocoding service API
    """
    if cache is None:
        cache = create_geocoding_cache()
    
    # Clean location string
    location_clean = location.strip().title()
    
    # Try exact match first
    if location_clean in cache:
        return cache[location_clean]
    
    # Try country code match
    if len(location.strip()) == 2:
        country_code = location.strip().upper()
        if country_code in cache:
            return cache[country_code]
    
    # For production, add API calls to geocoding services here
    logger.warning(f"Could not geocode location: {location}")
    return None