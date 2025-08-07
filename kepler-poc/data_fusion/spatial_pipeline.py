"""
Spatial Analysis Pipeline
Implements H3 indexing, spatial joins, proximity calculations, and interpolation
"""

import pandas as pd
import numpy as np
import h3
from typing import Dict, List, Optional, Tuple, Union, Any
from dataclasses import dataclass
import logging
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import time
from functools import lru_cache
from scipy.spatial.distance import cdist
from scipy.interpolate import NearestNDInterpolator, LinearNDInterpolator
import warnings

from .schemas import (
    Coordinate, H3Cell, SpatialIndex, Factor, DataQuality, 
    SpatialType, ProcessingResult, STANDARD_FACTORS
)
from .connectors import BaseConnector

logger = logging.getLogger(__name__)


@dataclass
class SpatialJoinResult:
    """Result of spatial join operation"""
    matched_records: int
    unmatched_records: int
    duplicate_matches: int
    processing_time_seconds: float
    quality_score: float


class H3SpatialProcessor:
    """Core spatial processing engine using H3 hexagons"""
    
    def __init__(self, resolution: int = 6, buffer_distance_km: float = 50.0):
        self.resolution = resolution
        self.buffer_distance_km = buffer_distance_km
        self.spatial_index = SpatialIndex(h3_resolution=resolution)
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Cache for expensive operations
        self._distance_cache = {}
        self._neighbor_cache = {}
    
    def coordinate_to_h3(self, coord: Coordinate) -> str:
        """Convert coordinate to H3 index"""
        if not coord.validate():
            raise ValueError(f"Invalid coordinate: {coord}")
        return h3.geo_to_h3(coord.latitude, coord.longitude, self.resolution)
    
    def h3_to_coordinate(self, h3_index: str) -> Coordinate:
        """Convert H3 index to coordinate"""
        lat, lon = h3.h3_to_geo(h3_index)
        return Coordinate(latitude=lat, longitude=lon)
    
    @lru_cache(maxsize=10000)
    def get_h3_neighbors(self, h3_index: str, k: int = 1) -> List[str]:
        """Get H3 neighbors with caching"""
        return list(h3.k_ring(h3_index, k))
    
    def calculate_h3_distance(self, h3_a: str, h3_b: str) -> float:
        """Calculate distance between H3 cells in km"""
        cache_key = tuple(sorted([h3_a, h3_b]))
        if cache_key in self._distance_cache:
            return self._distance_cache[cache_key]
        
        distance = h3.point_dist(
            h3.h3_to_geo(h3_a),
            h3.h3_to_geo(h3_b),
            unit='km'
        )
        
        self._distance_cache[cache_key] = distance
        return distance
    
    def points_to_h3_cells(self, coordinates: List[Coordinate], 
                          factor_values: Optional[Dict[str, List[float]]] = None) -> List[H3Cell]:
        """Convert point coordinates to H3 cells"""
        cells = []
        
        for i, coord in enumerate(coordinates):
            try:
                h3_index = self.coordinate_to_h3(coord)
                
                # Get or create cell
                if h3_index in self.spatial_index.cell_index:
                    cell = self.spatial_index.cell_index[h3_index]
                else:
                    cell = H3Cell(
                        h3_index=h3_index,
                        resolution=self.resolution,
                        center_lat=coord.latitude,
                        center_lon=coord.longitude
                    )
                
                # Add factor values if provided
                if factor_values:
                    for factor_name, values in factor_values.items():
                        if i < len(values) and pd.notna(values[i]):
                            # Aggregate if multiple values for same cell
                            if factor_name in cell.factors:
                                cell.factors[factor_name] = (cell.factors[factor_name] + values[i]) / 2
                            else:
                                cell.factors[factor_name] = values[i]
                
                cells.append(cell)
                self.spatial_index.add_cell(cell)
                
            except Exception as e:
                self.logger.warning(f"Failed to process coordinate {coord}: {e}")
                continue
        
        return cells
    
    def polygons_to_h3_cells(self, polygon_coords: List[List[Tuple[float, float]]], 
                           factor_values: Optional[Dict[str, List[float]]] = None) -> List[H3Cell]:
        """Convert polygon coordinates to H3 cells"""
        cells = []
        
        for i, polygon in enumerate(polygon_coords):
            try:
                # Use H3 polyfill to get cells covering the polygon
                h3_indices = list(h3.polyfill(polygon, self.resolution))
                
                for h3_index in h3_indices:
                    # Get or create cell
                    if h3_index in self.spatial_index.cell_index:
                        cell = self.spatial_index.cell_index[h3_index]
                    else:
                        coord = self.h3_to_coordinate(h3_index)
                        cell = H3Cell(
                            h3_index=h3_index,
                            resolution=self.resolution,
                            center_lat=coord.latitude,
                            center_lon=coord.longitude
                        )
                    
                    # Add factor values if provided
                    if factor_values:
                        for factor_name, values in factor_values.items():
                            if i < len(values) and pd.notna(values[i]):
                                cell.factors[factor_name] = values[i]
                    
                    cells.append(cell)
                    self.spatial_index.add_cell(cell)
                    
            except Exception as e:
                self.logger.warning(f"Failed to process polygon {i}: {e}")
                continue
        
        return cells
    
    def grid_to_h3_cells(self, grid_data: pd.DataFrame, 
                        lat_col: str = 'lat', lon_col: str = 'lon',
                        value_cols: Optional[List[str]] = None) -> List[H3Cell]:
        """Convert regular grid data to H3 cells with interpolation"""
        cells = []
        
        if value_cols is None:
            value_cols = [col for col in grid_data.columns 
                         if col not in [lat_col, lon_col]]
        
        # Create coordinate arrays for interpolation
        coords = grid_data[[lat_col, lon_col]].values
        
        # For each value column, create interpolator
        interpolators = {}
        for col in value_cols:
            values = grid_data[col].values
            valid_mask = pd.notna(values)
            if valid_mask.sum() > 0:
                interpolators[col] = NearestNDInterpolator(
                    coords[valid_mask], 
                    values[valid_mask]
                )
        
        # Get bounds of the grid
        lat_min, lat_max = grid_data[lat_col].min(), grid_data[lat_col].max()
        lon_min, lon_max = grid_data[lon_col].min(), grid_data[lon_col].max()
        
        # Get H3 cells covering the grid area
        polygon = [
            [lat_min, lon_min],
            [lat_min, lon_max], 
            [lat_max, lon_max],
            [lat_max, lon_min],
            [lat_min, lon_min]
        ]
        
        h3_indices = list(h3.polyfill(polygon, self.resolution))
        
        # Interpolate values for each H3 cell
        for h3_index in h3_indices:
            coord = self.h3_to_coordinate(h3_index)
            
            cell = H3Cell(
                h3_index=h3_index,
                resolution=self.resolution,
                center_lat=coord.latitude,
                center_lon=coord.longitude
            )
            
            # Interpolate values
            for col, interpolator in interpolators.items():
                try:
                    value = interpolator(coord.latitude, coord.longitude)
                    if pd.notna(value):
                        cell.factors[col] = float(value)
                except:
                    continue
            
            if cell.factors:  # Only add cells with data
                cells.append(cell)
                self.spatial_index.add_cell(cell)
        
        return cells
    
    def calculate_proximity_factors(self, target_cells: List[H3Cell], 
                                  reference_points: List[Coordinate],
                                  factor_name: str, 
                                  max_distance_km: float = 200.0) -> None:
        """Calculate proximity-based factors for target cells"""
        
        if not reference_points:
            self.logger.warning(f"No reference points for proximity factor {factor_name}")
            return
        
        # Convert reference points to H3
        reference_h3 = [self.coordinate_to_h3(coord) for coord in reference_points]
        
        for cell in target_cells:
            min_distance = float('inf')
            
            # Find minimum distance to any reference point
            for ref_h3 in reference_h3:
                distance = self.calculate_h3_distance(cell.h3_index, ref_h3)
                min_distance = min(min_distance, distance)
            
            # Convert distance to proximity score (inverse distance)
            if min_distance <= max_distance_km:
                # Normalize: closer = higher score
                proximity_score = max(0.0, 1.0 - (min_distance / max_distance_km))
                cell.factors[factor_name] = proximity_score
            else:
                cell.factors[factor_name] = 0.0
    
    def aggregate_cells_by_region(self, cells: List[H3Cell], 
                                 region_mapping: Dict[str, str],
                                 aggregation_method: str = 'mean') -> Dict[str, H3Cell]:
        """Aggregate H3 cells by regions (e.g., countries)"""
        
        region_cells = {}
        region_data = {}
        
        # Group cells by region
        for cell in cells:
            # Find region for this cell (simplified - in production use proper geocoding)
            region = region_mapping.get(cell.h3_index, 'unknown')
            
            if region not in region_data:
                region_data[region] = {'cells': [], 'factors': {}}
            
            region_data[region]['cells'].append(cell)
            
            # Collect factor values
            for factor_name, value in cell.factors.items():
                if factor_name not in region_data[region]['factors']:
                    region_data[region]['factors'][factor_name] = []
                region_data[region]['factors'][factor_name].append(value)
        
        # Aggregate by region
        for region, data in region_data.items():
            if not data['cells']:
                continue
                
            # Calculate region centroid
            lats = [cell.center_lat for cell in data['cells']]
            lons = [cell.center_lon for cell in data['cells']]
            center_lat = np.mean(lats)
            center_lon = np.mean(lons)
            
            # Create representative H3 cell for region
            region_h3 = h3.geo_to_h3(center_lat, center_lon, self.resolution)
            
            region_cell = H3Cell(
                h3_index=f"{region}_{region_h3}",  # Unique identifier
                resolution=self.resolution,
                center_lat=center_lat,
                center_lon=center_lon
            )
            
            # Aggregate factor values
            for factor_name, values in data['factors'].items():
                if aggregation_method == 'mean':
                    region_cell.factors[factor_name] = np.mean(values)
                elif aggregation_method == 'max':
                    region_cell.factors[factor_name] = np.max(values)
                elif aggregation_method == 'min':
                    region_cell.factors[factor_name] = np.min(values)
                elif aggregation_method == 'sum':
                    region_cell.factors[factor_name] = np.sum(values)
            
            region_cells[region] = region_cell
        
        return region_cells
    
    def spatial_join(self, source_cells: List[H3Cell], 
                    target_cells: List[H3Cell],
                    join_radius_km: float = 50.0) -> SpatialJoinResult:
        """Perform spatial join between source and target cells"""
        start_time = time.time()
        
        matched = 0
        unmatched = 0
        duplicates = 0
        
        # Build spatial index for source cells
        source_index = {cell.h3_index: cell for cell in source_cells}
        
        for target_cell in target_cells:
            matches = []
            
            # Get neighbors within join radius
            k_radius = max(1, int(join_radius_km / (h3.edge_length(self.resolution, unit='km') * 2)))
            neighbors = self.get_h3_neighbors(target_cell.h3_index, k_radius)
            
            # Find matching source cells
            for neighbor_h3 in neighbors:
                if neighbor_h3 in source_index:
                    distance = self.calculate_h3_distance(target_cell.h3_index, neighbor_h3)
                    if distance <= join_radius_km:
                        matches.append((neighbor_h3, distance, source_index[neighbor_h3]))
            
            # Process matches
            if matches:
                matched += 1
                if len(matches) > 1:
                    duplicates += 1
                
                # Use closest match, or aggregate if multiple
                if len(matches) == 1:
                    source_cell = matches[0][2]
                    # Transfer factors from source to target
                    for factor_name, value in source_cell.factors.items():
                        if factor_name not in target_cell.factors:
                            target_cell.factors[factor_name] = value
                else:
                    # Distance-weighted average for multiple matches
                    for factor_name in set().union(*[m[2].factors.keys() for m in matches]):
                        weighted_sum = 0.0
                        weight_sum = 0.0
                        
                        for _, distance, source_cell in matches:
                            if factor_name in source_cell.factors:
                                weight = 1.0 / (1.0 + distance)  # Inverse distance weighting
                                weighted_sum += source_cell.factors[factor_name] * weight
                                weight_sum += weight
                        
                        if weight_sum > 0:
                            target_cell.factors[factor_name] = weighted_sum / weight_sum
            else:
                unmatched += 1
        
        processing_time = time.time() - start_time
        quality_score = matched / len(target_cells) if target_cells else 0.0
        
        return SpatialJoinResult(
            matched_records=matched,
            unmatched_records=unmatched,
            duplicate_matches=duplicates,
            processing_time_seconds=processing_time,
            quality_score=quality_score
        )
    
    def interpolate_missing_values(self, cells: List[H3Cell], 
                                 factor_name: str,
                                 method: str = 'inverse_distance',
                                 max_distance_km: float = 200.0) -> int:
        """Interpolate missing values using nearby cells"""
        
        # Find cells with and without the factor
        cells_with_values = [cell for cell in cells if factor_name in cell.factors]
        cells_without_values = [cell for cell in cells if factor_name not in cell.factors]
        
        if not cells_with_values or not cells_without_values:
            return 0
        
        interpolated_count = 0
        
        # Create coordinate and value arrays
        coords = np.array([[cell.center_lat, cell.center_lon] for cell in cells_with_values])
        values = np.array([cell.factors[factor_name] for cell in cells_with_values])
        
        # Create interpolator
        if method == 'nearest':
            interpolator = NearestNDInterpolator(coords, values)
        elif method == 'linear':
            interpolator = LinearNDInterpolator(coords, values, fill_value=np.nan)
        else:  # inverse_distance or default
            # Manual inverse distance weighting
            interpolator = None
        
        for cell in cells_without_values:
            try:
                if interpolator:
                    # Use scipy interpolator
                    interpolated_value = interpolator(cell.center_lat, cell.center_lon)
                    if pd.notna(interpolated_value):
                        cell.factors[factor_name] = float(interpolated_value)
                        interpolated_count += 1
                else:
                    # Manual inverse distance weighting
                    target_coord = np.array([cell.center_lat, cell.center_lon])
                    distances = cdist([target_coord], coords)[0]
                    
                    # Filter by max distance
                    valid_mask = distances <= max_distance_km
                    if not valid_mask.any():
                        continue
                    
                    valid_distances = distances[valid_mask]
                    valid_values = values[valid_mask]
                    
                    # Avoid division by zero
                    weights = 1.0 / (valid_distances + 0.001)
                    weights /= weights.sum()
                    
                    interpolated_value = np.average(valid_values, weights=weights)
                    cell.factors[factor_name] = float(interpolated_value)
                    interpolated_count += 1
                    
            except Exception as e:
                self.logger.warning(f"Failed to interpolate for cell {cell.h3_index}: {e}")
                continue
        
        return interpolated_count
    
    def calculate_factor_density(self, cells: List[H3Cell], 
                               factor_name: str,
                               radius_km: float = 25.0) -> None:
        """Calculate density-based factors (e.g., ground station density)"""
        
        for cell in cells:
            # Get neighboring cells within radius
            k_radius = max(1, int(radius_km / (h3.edge_length(self.resolution, unit='km') * 2)))
            neighbors = self.get_h3_neighbors(cell.h3_index, k_radius)
            
            # Count occurrences of the factor in neighboring cells
            count = 0
            total_area_km2 = 0
            
            for neighbor_h3 in neighbors:
                if neighbor_h3 in self.spatial_index.cell_index:
                    neighbor_cell = self.spatial_index.cell_index[neighbor_h3]
                    distance = self.calculate_h3_distance(cell.h3_index, neighbor_h3)
                    
                    if distance <= radius_km:
                        # Check if neighbor has the base factor
                        base_factor = factor_name.replace('_density', '')
                        if base_factor in neighbor_cell.factors and neighbor_cell.factors[base_factor] > 0:
                            count += neighbor_cell.factors[base_factor]
                        
                        # Add cell area (approximate)
                        total_area_km2 += h3.hex_area(self.resolution, unit='km^2')
            
            # Calculate density
            if total_area_km2 > 0:
                density = count / total_area_km2
                cell.factors[factor_name] = density
    
    def get_processing_statistics(self) -> Dict[str, Any]:
        """Get statistics about the spatial processing"""
        return {
            'total_cells': len(self.spatial_index.cell_index),
            'h3_resolution': self.resolution,
            'buffer_distance_km': self.buffer_distance_km,
            'cache_sizes': {
                'distance_cache': len(self._distance_cache),
                'neighbor_cache': len(self._neighbor_cache)
            },
            'factor_ranges': self.spatial_index.factor_ranges,
            'factor_statistics': {
                factor: self.spatial_index.get_factor_statistics(factor)
                for factor in self.spatial_index.factor_ranges.keys()
            }
        }


class SpatialPipeline:
    """High-level spatial processing pipeline"""
    
    def __init__(self, h3_resolution: int = 6, 
                 buffer_distance_km: float = 50.0,
                 parallel_workers: int = 4):
        self.processor = H3SpatialProcessor(h3_resolution, buffer_distance_km)
        self.parallel_workers = parallel_workers
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def process_data_source(self, connector: BaseConnector,
                          spatial_type: SpatialType,
                          factor_mapping: Dict[str, str]) -> ProcessingResult:
        """Process a single data source through the spatial pipeline"""
        start_time = time.time()
        
        try:
            # Read data
            df = connector.read()
            self.logger.info(f"Processing {len(df)} records from {connector.data_source.name}")
            
            # Extract coordinates
            coordinates = connector.extract_coordinates(df)
            if not coordinates:
                return ProcessingResult(
                    success=False,
                    records_processed=0,
                    records_failed=len(df),
                    processing_time_seconds=time.time() - start_time,
                    errors=["No valid coordinates found"]
                )
            
            # Prepare factor values
            factor_values = {}
            for df_col, factor_name in factor_mapping.items():
                if df_col in df.columns:
                    factor_values[factor_name] = df[df_col].tolist()
            
            # Convert to H3 cells based on spatial type
            if spatial_type == SpatialType.POINT:
                cells = self.processor.points_to_h3_cells(coordinates, factor_values)
            elif spatial_type == SpatialType.GRID:
                cells = self.processor.grid_to_h3_cells(df, 
                    lat_col=connector.data_source.coordinate_columns[0],
                    lon_col=connector.data_source.coordinate_columns[1],
                    value_cols=list(factor_mapping.keys())
                )
            else:
                # For now, treat polygons and regions as points (centroids)
                cells = self.processor.points_to_h3_cells(coordinates, factor_values)
            
            processing_time = time.time() - start_time
            
            return ProcessingResult(
                success=True,
                records_processed=len(cells),
                records_failed=len(df) - len(cells),
                processing_time_seconds=processing_time,
                h3_cells_created=len(cells),
                data_quality=connector.calculate_data_quality(df)
            )
            
        except Exception as e:
            return ProcessingResult(
                success=False,
                records_processed=0,
                records_failed=0,
                processing_time_seconds=time.time() - start_time,
                errors=[f"Processing failed: {str(e)}"]
            )
    
    def get_unified_dataset(self) -> pd.DataFrame:
        """Export unified H3-based dataset"""
        records = []
        
        for h3_index, cell in self.processor.spatial_index.cell_index.items():
            record = {
                'h3_index': h3_index,
                'h3_resolution': cell.resolution,
                'latitude': cell.center_lat,
                'longitude': cell.center_lon,
                **cell.factors
            }
            records.append(record)
        
        return pd.DataFrame(records)
    
    def export_to_file(self, output_path: str, format: str = 'parquet') -> None:
        """Export unified dataset to file"""
        df = self.get_unified_dataset()
        
        if format.lower() == 'parquet':
            df.to_parquet(output_path, index=False)
        elif format.lower() == 'csv':
            df.to_csv(output_path, index=False)
        elif format.lower() == 'json':
            df.to_json(output_path, orient='records', indent=2)
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        self.logger.info(f"Exported {len(df)} records to {output_path}")


def calculate_multi_factor_score(cell: H3Cell, factors: Dict[str, Factor]) -> float:
    """Calculate weighted multi-factor score for a cell"""
    total_score = 0.0
    total_weight = 0.0
    
    for factor_name, factor in factors.items():
        if factor_name in cell.factors:
            value = cell.factors[factor_name]
            
            # Get normalization context
            if hasattr(cell, 'spatial_index') and cell.spatial_index:
                factor_range = cell.spatial_index.factor_ranges.get(factor_name)
                context_min = factor_range[0] if factor_range else None
                context_max = factor_range[1] if factor_range else None
            else:
                context_min = context_max = None
            
            # Normalize value
            normalized_value = factor.normalize_value(value, context_min, context_max)
            
            # Add to weighted score
            total_score += normalized_value * factor.weight
            total_weight += factor.weight
    
    return total_score / total_weight if total_weight > 0 else 0.0