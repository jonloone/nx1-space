"""
Data Harmonization Engine
Handles coordinate alignment, temporal alignment, interpolation, and normalization
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
import logging
from datetime import datetime, timedelta
from scipy.interpolate import interp1d, griddata
from scipy.spatial.distance import cdist
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler
import warnings

from .schemas import (
    Coordinate, H3Cell, Factor, NormalizationType, TemporalRange,
    DataQuality, ProcessingResult, FusionConfig
)
from .connectors import geocode_location, create_geocoding_cache

logger = logging.getLogger(__name__)


@dataclass
class HarmonizationRule:
    """Rule for harmonizing data from different sources"""
    source_field: str
    target_field: str
    transformation: str  # 'direct', 'scale', 'convert_units', 'geocode', 'temporal_align'
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CoordinateTransformation:
    """Coordinate system transformation parameters"""
    source_crs: str = "EPSG:4326"  # WGS84
    target_crs: str = "EPSG:4326"  # WGS84
    precision_decimal_places: int = 6
    
    def apply_transformation(self, coords: List[Coordinate]) -> List[Coordinate]:
        """Apply coordinate transformation (placeholder for complex transformations)"""
        # For now, just validate and standardize precision
        transformed = []
        for coord in coords:
            if coord.validate():
                transformed_coord = Coordinate(
                    latitude=round(coord.latitude, self.precision_decimal_places),
                    longitude=round(coord.longitude, self.precision_decimal_places),
                    elevation=coord.elevation
                )
                transformed.append(transformed_coord)
        return transformed


@dataclass
class TemporalAlignment:
    """Temporal data alignment configuration"""
    reference_timeline: List[datetime]
    interpolation_method: str = 'linear'  # 'linear', 'nearest', 'cubic'
    extrapolation_limit_days: int = 30
    
    def align_timeseries(self, timestamps: List[datetime], 
                        values: List[float]) -> Dict[datetime, float]:
        """Align time series data to reference timeline"""
        if not timestamps or not values or len(timestamps) != len(values):
            return {}
        
        # Convert to numeric for interpolation
        timestamp_numeric = [ts.timestamp() for ts in timestamps]
        reference_numeric = [ts.timestamp() for ts in self.reference_timeline]
        
        # Remove NaN values
        valid_mask = ~np.isnan(values)
        if not valid_mask.any():
            return {}
        
        timestamp_numeric = np.array(timestamp_numeric)[valid_mask]
        values = np.array(values)[valid_mask]
        
        try:
            # Create interpolation function
            if self.interpolation_method == 'nearest':
                kind = 'nearest'
            elif self.interpolation_method == 'cubic' and len(values) >= 4:
                kind = 'cubic'
            else:
                kind = 'linear'
            
            f = interp1d(timestamp_numeric, values, kind=kind, 
                        bounds_error=False, fill_value=np.nan)
            
            # Interpolate to reference timeline
            interpolated_values = f(reference_numeric)
            
            # Create result dictionary
            result = {}
            for i, ref_time in enumerate(self.reference_timeline):
                if not np.isnan(interpolated_values[i]):
                    result[ref_time] = interpolated_values[i]
            
            return result
            
        except Exception as e:
            logger.warning(f"Temporal alignment failed: {e}")
            return {}


class GeospatialHarmonizer:
    """Harmonize geospatial data from different coordinate systems and projections"""
    
    def __init__(self, target_crs: str = "EPSG:4326"):
        self.target_crs = target_crs
        self.geocoding_cache = create_geocoding_cache()
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def harmonize_coordinates(self, df: pd.DataFrame, 
                            coord_columns: List[str],
                            spatial_type: str = "point") -> List[Coordinate]:
        """Harmonize coordinates from various formats to standard Coordinate objects"""
        coordinates = []
        
        if len(coord_columns) >= 2:
            # Standard lat/lon columns
            lat_col = None
            lon_col = None
            
            # Try to identify lat/lon columns
            for col in coord_columns:
                col_lower = col.lower()
                if any(term in col_lower for term in ['lat', 'y']):
                    lat_col = col
                elif any(term in col_lower for term in ['lon', 'lng', 'x']):
                    lon_col = col
            
            # If not found by name, assume first is lat, second is lon
            if lat_col is None or lon_col is None:
                lat_col = coord_columns[0]
                lon_col = coord_columns[1]
            
            # Extract coordinates
            for _, row in df.iterrows():
                lat_val = row.get(lat_col)
                lon_val = row.get(lon_col)
                
                if pd.notna(lat_val) and pd.notna(lon_val):
                    try:
                        coord = Coordinate(
                            latitude=float(lat_val),
                            longitude=float(lon_val)
                        )
                        if coord.validate():
                            coordinates.append(coord)
                    except (ValueError, TypeError):
                        continue
        
        elif len(coord_columns) == 1:
            # Single column that might need geocoding
            coord_col = coord_columns[0]
            
            for _, row in df.iterrows():
                location = row.get(coord_col)
                if pd.notna(location):
                    coord = geocode_location(str(location), self.geocoding_cache)
                    if coord:
                        coordinates.append(coord)
        
        return coordinates
    
    def harmonize_country_regions(self, df: pd.DataFrame, 
                                country_column: str) -> Dict[str, Coordinate]:
        """Convert country codes/names to representative coordinates"""
        country_coords = {}
        
        for _, row in df.iterrows():
            country = row.get(country_column)
            if pd.notna(country):
                coord = geocode_location(str(country), self.geocoding_cache)
                if coord:
                    country_coords[str(country)] = coord
        
        return country_coords
    
    def snap_to_grid(self, coordinates: List[Coordinate], 
                    grid_resolution: float = 0.1) -> List[Coordinate]:
        """Snap coordinates to a regular grid"""
        snapped = []
        
        for coord in coordinates:
            snapped_lat = round(coord.latitude / grid_resolution) * grid_resolution
            snapped_lon = round(coord.longitude / grid_resolution) * grid_resolution
            
            snapped_coord = Coordinate(
                latitude=snapped_lat,
                longitude=snapped_lon,
                elevation=coord.elevation
            )
            snapped.append(snapped_coord)
        
        return snapped


class DataNormalizer:
    """Normalize data values using various methods"""
    
    def __init__(self):
        self.scalers = {}
        self.normalization_params = {}
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def fit_normalizer(self, factor_name: str, values: List[float], 
                      method: NormalizationType) -> None:
        """Fit normalization parameters for a factor"""
        values_array = np.array([v for v in values if pd.notna(v)])
        
        if len(values_array) == 0:
            self.logger.warning(f"No valid values to fit normalizer for {factor_name}")
            return
        
        if method == NormalizationType.MIN_MAX:
            scaler = MinMaxScaler()
            scaler.fit(values_array.reshape(-1, 1))
            self.scalers[factor_name] = scaler
            
        elif method == NormalizationType.Z_SCORE:
            scaler = StandardScaler()
            scaler.fit(values_array.reshape(-1, 1))
            self.scalers[factor_name] = scaler
            
        elif method == NormalizationType.LOG:
            # Store min value for log transformation
            min_val = np.min(values_array)
            self.normalization_params[factor_name] = {'min_value': min_val}
            
        elif method == NormalizationType.INVERSE:
            # Store max value for inverse transformation
            max_val = np.max(values_array)
            self.normalization_params[factor_name] = {'max_value': max_val}
    
    def normalize_values(self, factor_name: str, values: List[float], 
                        method: NormalizationType) -> List[float]:
        """Normalize values using fitted parameters"""
        if not values:
            return []
        
        values_array = np.array(values)
        valid_mask = ~np.isnan(values_array)
        
        if not valid_mask.any():
            return values
        
        normalized = values_array.copy()
        
        if method == NormalizationType.LINEAR:
            # Simple 0-1 scaling
            min_val = np.nanmin(values_array)
            max_val = np.nanmax(values_array)
            if max_val > min_val:
                normalized[valid_mask] = (values_array[valid_mask] - min_val) / (max_val - min_val)
        
        elif method == NormalizationType.MIN_MAX:
            if factor_name in self.scalers:
                valid_values = values_array[valid_mask].reshape(-1, 1)
                normalized_values = self.scalers[factor_name].transform(valid_values).flatten()
                normalized[valid_mask] = normalized_values
        
        elif method == NormalizationType.Z_SCORE:
            if factor_name in self.scalers:
                valid_values = values_array[valid_mask].reshape(-1, 1)
                normalized_values = self.scalers[factor_name].transform(valid_values).flatten()
                normalized[valid_mask] = normalized_values
        
        elif method == NormalizationType.LOG:
            # Log transformation with offset to handle zeros
            offset = 1.0
            if factor_name in self.normalization_params:
                min_val = self.normalization_params[factor_name]['min_value']
                if min_val < 0:
                    offset = abs(min_val) + 1.0
            
            normalized[valid_mask] = np.log(values_array[valid_mask] + offset)
        
        elif method == NormalizationType.INVERSE:
            # Inverse transformation
            normalized[valid_mask] = 1.0 / (1.0 + values_array[valid_mask])
        
        elif method == NormalizationType.INVERSE_DISTANCE:
            # For distance values, convert to proximity scores
            max_val = np.nanmax(values_array) if factor_name not in self.normalization_params else \
                     self.normalization_params[factor_name]['max_value']
            normalized[valid_mask] = 1.0 - (values_array[valid_mask] / max_val)
            normalized = np.clip(normalized, 0.0, 1.0)
        
        return normalized.tolist()


class MissingDataHandler:
    """Handle missing data through various imputation methods"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def spatial_interpolation(self, cells: List[H3Cell], 
                            factor_name: str,
                            method: str = 'inverse_distance',
                            max_distance_km: float = 200.0,
                            min_neighbors: int = 3) -> int:
        """Spatially interpolate missing values"""
        
        # Separate cells with and without values
        cells_with_values = [cell for cell in cells if factor_name in cell.factors]
        cells_without_values = [cell for cell in cells if factor_name not in cell.factors]
        
        if len(cells_with_values) < min_neighbors:
            self.logger.warning(f"Insufficient data for spatial interpolation of {factor_name}")
            return 0
        
        interpolated_count = 0
        
        # Prepare coordinate and value arrays
        coords = np.array([[cell.center_lat, cell.center_lon] for cell in cells_with_values])
        values = np.array([cell.factors[factor_name] for cell in cells_with_values])
        
        for cell in cells_without_values:
            target_coord = np.array([[cell.center_lat, cell.center_lon]])
            
            # Calculate distances to all known points
            distances = cdist(target_coord, coords)[0]
            
            # Filter by maximum distance
            valid_mask = distances <= max_distance_km
            if valid_mask.sum() < min_neighbors:
                continue
            
            valid_distances = distances[valid_mask]
            valid_values = values[valid_mask]
            
            try:
                if method == 'inverse_distance':
                    # Inverse distance weighting
                    weights = 1.0 / (valid_distances + 0.001)  # Avoid division by zero
                    weights /= weights.sum()
                    interpolated_value = np.average(valid_values, weights=weights)
                    
                elif method == 'nearest':
                    # Nearest neighbor
                    nearest_idx = np.argmin(valid_distances)
                    interpolated_value = valid_values[nearest_idx]
                    
                elif method == 'mean':
                    # Simple mean of nearby values
                    interpolated_value = np.mean(valid_values)
                    
                else:
                    # Default to inverse distance
                    weights = 1.0 / (valid_distances + 0.001)
                    weights /= weights.sum()
                    interpolated_value = np.average(valid_values, weights=weights)
                
                cell.factors[factor_name] = float(interpolated_value)
                interpolated_count += 1
                
            except Exception as e:
                self.logger.warning(f"Failed to interpolate for cell {cell.h3_index}: {e}")
                continue
        
        return interpolated_count
    
    def temporal_interpolation(self, temporal_data: Dict[datetime, float],
                             target_times: List[datetime],
                             method: str = 'linear') -> Dict[datetime, float]:
        """Interpolate temporal data to target timestamps"""
        
        if not temporal_data or not target_times:
            return {}
        
        # Sort data by timestamp
        sorted_times = sorted(temporal_data.keys())
        sorted_values = [temporal_data[t] for t in sorted_times]
        
        # Convert to numeric for interpolation
        time_numeric = [t.timestamp() for t in sorted_times]
        target_numeric = [t.timestamp() for t in target_times]
        
        try:
            # Create interpolation function
            if method == 'linear':
                f = interp1d(time_numeric, sorted_values, kind='linear',
                           bounds_error=False, fill_value=np.nan)
            elif method == 'nearest':
                f = interp1d(time_numeric, sorted_values, kind='nearest',
                           bounds_error=False, fill_value=np.nan)
            else:
                f = interp1d(time_numeric, sorted_values, kind='linear',
                           bounds_error=False, fill_value=np.nan)
            
            # Interpolate
            interpolated_values = f(target_numeric)
            
            # Return result
            result = {}
            for i, target_time in enumerate(target_times):
                if not np.isnan(interpolated_values[i]):
                    result[target_time] = interpolated_values[i]
            
            return result
            
        except Exception as e:
            self.logger.warning(f"Temporal interpolation failed: {e}")
            return {}
    
    def fill_with_regional_average(self, cells: List[H3Cell],
                                 factor_name: str,
                                 region_mapping: Dict[str, str]) -> int:
        """Fill missing values with regional averages"""
        
        # Calculate regional averages
        regional_sums = {}
        regional_counts = {}
        
        for cell in cells:
            if factor_name in cell.factors:
                region = region_mapping.get(cell.h3_index, 'unknown')
                if region != 'unknown':
                    regional_sums[region] = regional_sums.get(region, 0) + cell.factors[factor_name]
                    regional_counts[region] = regional_counts.get(region, 0) + 1
        
        regional_averages = {
            region: regional_sums[region] / regional_counts[region]
            for region in regional_sums.keys()
            if regional_counts[region] > 0
        }
        
        # Fill missing values
        filled_count = 0
        
        for cell in cells:
            if factor_name not in cell.factors:
                region = region_mapping.get(cell.h3_index, 'unknown')
                if region in regional_averages:
                    cell.factors[factor_name] = regional_averages[region]
                    filled_count += 1
        
        return filled_count


class DataHarmonizationEngine:
    """Main harmonization engine coordinating all harmonization processes"""
    
    def __init__(self, config: FusionConfig):
        self.config = config
        self.geospatial_harmonizer = GeospatialHarmonizer()
        self.normalizer = DataNormalizer()
        self.missing_data_handler = MissingDataHandler()
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Track harmonization operations
        self.harmonization_log = []
    
    def harmonize_dataset(self, df: pd.DataFrame, 
                         harmonization_rules: List[HarmonizationRule],
                         spatial_type: str = "point") -> Tuple[pd.DataFrame, ProcessingResult]:
        """Apply harmonization rules to a dataset"""
        
        start_time = datetime.now()
        harmonized_df = df.copy()
        errors = []
        warnings_list = []
        
        for rule in harmonization_rules:
            try:
                if rule.transformation == 'direct':
                    # Direct column mapping
                    if rule.source_field in harmonized_df.columns:
                        harmonized_df[rule.target_field] = harmonized_df[rule.source_field]
                
                elif rule.transformation == 'scale':
                    # Scale values
                    if rule.source_field in harmonized_df.columns:
                        scale_factor = rule.parameters.get('scale_factor', 1.0)
                        harmonized_df[rule.target_field] = harmonized_df[rule.source_field] * scale_factor
                
                elif rule.transformation == 'convert_units':
                    # Unit conversion
                    if rule.source_field in harmonized_df.columns:
                        from_unit = rule.parameters.get('from_unit')
                        to_unit = rule.parameters.get('to_unit')
                        
                        # Implement common unit conversions
                        if from_unit == 'mm' and to_unit == 'm':
                            harmonized_df[rule.target_field] = harmonized_df[rule.source_field] / 1000.0
                        elif from_unit == 'km' and to_unit == 'm':
                            harmonized_df[rule.target_field] = harmonized_df[rule.source_field] * 1000.0
                        else:
                            harmonized_df[rule.target_field] = harmonized_df[rule.source_field]
                
                elif rule.transformation == 'geocode':
                    # Geocoding transformation
                    if rule.source_field in harmonized_df.columns:
                        coords = []
                        for location in harmonized_df[rule.source_field]:
                            coord = geocode_location(str(location), self.geospatial_harmonizer.geocoding_cache)
                            coords.append(coord)
                        
                        harmonized_df[f'{rule.target_field}_lat'] = [c.latitude if c else np.nan for c in coords]
                        harmonized_df[f'{rule.target_field}_lon'] = [c.longitude if c else np.nan for c in coords]
                
                self.harmonization_log.append(f"Applied {rule.transformation} transformation: {rule.source_field} -> {rule.target_field}")
                
            except Exception as e:
                error_msg = f"Failed to apply rule {rule.transformation} for {rule.source_field}: {str(e)}"
                errors.append(error_msg)
                self.logger.error(error_msg)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        result = ProcessingResult(
            success=len(errors) == 0,
            records_processed=len(harmonized_df),
            records_failed=0,
            processing_time_seconds=processing_time,
            errors=errors,
            warnings=warnings_list
        )
        
        return harmonized_df, result
    
    def normalize_factors(self, cells: List[H3Cell], 
                         factors: Dict[str, Factor]) -> ProcessingResult:
        """Normalize factor values across all cells"""
        
        start_time = datetime.now()
        errors = []
        
        # First pass: fit normalizers
        for factor_name, factor in factors.items():
            values = [cell.factors.get(factor_name) for cell in cells 
                     if factor_name in cell.factors]
            values = [v for v in values if pd.notna(v)]
            
            if values:
                try:
                    self.normalizer.fit_normalizer(factor_name, values, factor.normalization)
                except Exception as e:
                    errors.append(f"Failed to fit normalizer for {factor_name}: {str(e)}")
        
        # Second pass: apply normalization
        normalized_count = 0
        
        for factor_name, factor in factors.items():
            values = []
            cell_indices = []
            
            for i, cell in enumerate(cells):
                if factor_name in cell.factors:
                    values.append(cell.factors[factor_name])
                    cell_indices.append(i)
            
            if values:
                try:
                    normalized_values = self.normalizer.normalize_values(
                        factor_name, values, factor.normalization
                    )
                    
                    # Update cell values
                    for i, normalized_value in enumerate(normalized_values):
                        if pd.notna(normalized_value):
                            cells[cell_indices[i]].factors[factor_name] = normalized_value
                            normalized_count += 1
                            
                except Exception as e:
                    errors.append(f"Failed to normalize {factor_name}: {str(e)}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ProcessingResult(
            success=len(errors) == 0,
            records_processed=normalized_count,
            records_failed=len(errors),
            processing_time_seconds=processing_time,
            errors=errors
        )
    
    def fill_missing_data(self, cells: List[H3Cell], 
                         factors: Dict[str, Factor]) -> ProcessingResult:
        """Fill missing data using various imputation methods"""
        
        start_time = datetime.now()
        filled_count = 0
        errors = []
        
        for factor_name in factors.keys():
            try:
                # Count missing values
                missing_count = sum(1 for cell in cells if factor_name not in cell.factors)
                
                if missing_count == 0:
                    continue
                
                # Apply spatial interpolation
                interpolated = self.missing_data_handler.spatial_interpolation(
                    cells, factor_name, 
                    method=self.config.interpolation_method,
                    max_distance_km=self.config.max_interpolation_distance_km
                )
                
                filled_count += interpolated
                self.logger.info(f"Filled {interpolated} missing values for {factor_name}")
                
            except Exception as e:
                errors.append(f"Failed to fill missing data for {factor_name}: {str(e)}")
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ProcessingResult(
            success=len(errors) == 0,
            records_processed=filled_count,
            records_failed=len(errors),
            processing_time_seconds=processing_time,
            errors=errors
        )
    
    def get_harmonization_summary(self) -> Dict[str, Any]:
        """Get summary of harmonization operations"""
        return {
            'operations_performed': len(self.harmonization_log),
            'harmonization_log': self.harmonization_log,
            'config': {
                'h3_resolution': self.config.h3_resolution,
                'interpolation_method': self.config.interpolation_method,
                'max_interpolation_distance_km': self.config.max_interpolation_distance_km,
                'quality_threshold': self.config.quality_threshold
            }
        }