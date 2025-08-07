"""
Data Fusion Schemas and Core Data Structures
Defines unified H3 hexagon-based coordinate system and schemas for all data sources
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Union, Tuple
from enum import Enum
import pandas as pd
import numpy as np
from datetime import datetime, timezone
import h3


class SpatialType(Enum):
    """Types of spatial data representations"""
    POINT = "point"
    POLYGON = "polygon" 
    LINESTRING = "linestring"
    GRID = "grid"
    REGION = "region"


class DataFormat(Enum):
    """Supported data formats"""
    PARQUET = "parquet"
    NETCDF4 = "netcdf4"
    JSON = "json"
    CSV = "csv"
    KML = "kml"


class NormalizationType(Enum):
    """Data normalization methods"""
    LINEAR = "linear"
    LOG = "log"
    INVERSE = "inverse"
    INVERSE_DISTANCE = "inverse_distance"
    Z_SCORE = "zscore"
    MIN_MAX = "min_max"


@dataclass
class Coordinate:
    """Standard coordinate representation"""
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    
    def to_h3(self, resolution: int = 6) -> str:
        """Convert to H3 hexagon index"""
        return h3.geo_to_h3(self.latitude, self.longitude, resolution)
    
    def validate(self) -> bool:
        """Validate coordinate ranges"""
        return (-90 <= self.latitude <= 90 and -180 <= self.longitude <= 180)


@dataclass
class TemporalRange:
    """Temporal data range"""
    start: datetime
    end: datetime
    resolution: str  # "daily", "monthly", "yearly"
    
    def overlaps(self, other: 'TemporalRange') -> bool:
        """Check if temporal ranges overlap"""
        return not (self.end < other.start or other.end < self.start)


@dataclass
class DataQuality:
    """Data quality metrics"""
    completeness: float  # 0-1, percentage of non-null values
    accuracy: float      # 0-1, estimated accuracy score
    consistency: float   # 0-1, consistency with other sources
    timeliness: float    # 0-1, how recent/relevant the data is
    
    @property
    def overall_score(self) -> float:
        """Calculate overall quality score"""
        return (self.completeness * 0.3 + 
                self.accuracy * 0.3 + 
                self.consistency * 0.2 + 
                self.timeliness * 0.2)


@dataclass
class DataLineage:
    """Track data lineage and transformations"""
    source_file: str
    processing_date: datetime
    transformations: List[str] = field(default_factory=list)
    quality_checks: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class H3Cell:
    """H3 hexagon cell with aggregated data"""
    h3_index: str
    resolution: int
    center_lat: float
    center_lon: float
    
    # Factor values for this cell
    factors: Dict[str, float] = field(default_factory=dict)
    
    # Data quality and lineage
    quality: Optional[DataQuality] = None
    lineage: List[DataLineage] = field(default_factory=list)
    
    # Temporal data if applicable
    temporal_data: Optional[Dict[str, Dict[datetime, float]]] = None
    
    def get_neighbors(self, k: int = 1) -> List[str]:
        """Get neighboring H3 cells"""
        return h3.k_ring(self.h3_index, k)
    
    def distance_to(self, other: Union['H3Cell', str]) -> float:
        """Calculate distance to another H3 cell in km"""
        other_index = other.h3_index if isinstance(other, H3Cell) else other
        return h3.point_dist(
            h3.h3_to_geo(self.h3_index),
            h3.h3_to_geo(other_index),
            unit='km'
        )


@dataclass
class Factor:
    """Analysis factor definition"""
    name: str
    weight: float
    category: str  # infrastructure, economic, risk, market, regulatory
    normalization: NormalizationType
    description: str = ""
    unit: str = ""
    
    # Value ranges for normalization
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    
    def normalize_value(self, value: float, 
                       context_min: Optional[float] = None,
                       context_max: Optional[float] = None) -> float:
        """Normalize a value based on the normalization type"""
        if pd.isna(value):
            return 0.0
            
        if self.normalization == NormalizationType.LINEAR:
            if context_min is not None and context_max is not None:
                return (value - context_min) / (context_max - context_min)
            return value
            
        elif self.normalization == NormalizationType.LOG:
            return np.log1p(max(0, value))
            
        elif self.normalization == NormalizationType.INVERSE:
            return 1.0 / (1.0 + value) if value >= 0 else 0.0
            
        elif self.normalization == NormalizationType.Z_SCORE:
            if context_min is not None and context_max is not None:
                mean = (context_min + context_max) / 2
                std = (context_max - context_min) / 4  # Approximate std
                return (value - mean) / std if std > 0 else 0.0
            return value
            
        elif self.normalization == NormalizationType.MIN_MAX:
            if context_min is not None and context_max is not None:
                return (value - context_min) / (context_max - context_min)
            return value
            
        return value


@dataclass
class DataSource:
    """Data source definition"""
    name: str
    file_path: str
    format: DataFormat
    spatial_type: SpatialType
    
    # Coordinate column mappings
    coordinate_columns: List[str]
    
    # Factor mappings
    factors: List[str]
    
    # Processing options
    geocoding_required: bool = False
    temporal: bool = False
    
    # Quality and metadata
    last_updated: Optional[datetime] = None
    expected_records: Optional[int] = None
    
    def validate_file_exists(self) -> bool:
        """Check if source file exists"""
        import os
        return os.path.exists(self.file_path)


@dataclass 
class SpatialIndex:
    """Spatial index for efficient lookups"""
    h3_resolution: int
    cell_index: Dict[str, H3Cell] = field(default_factory=dict)
    factor_ranges: Dict[str, Tuple[float, float]] = field(default_factory=dict)
    
    def add_cell(self, cell: H3Cell):
        """Add cell to spatial index"""
        self.cell_index[cell.h3_index] = cell
        
        # Update factor ranges
        for factor_name, value in cell.factors.items():
            if pd.notna(value):
                current_range = self.factor_ranges.get(factor_name, (float('inf'), float('-inf')))
                self.factor_ranges[factor_name] = (
                    min(current_range[0], value),
                    max(current_range[1], value)
                )
    
    def get_cells_in_radius(self, center_h3: str, radius_km: float) -> List[H3Cell]:
        """Get all cells within radius of center point"""
        # Convert radius to H3 k-ring radius (approximate)
        k_radius = max(1, int(radius_km / (h3.edge_length(self.h3_resolution, unit='km') * 2)))
        
        neighbor_indices = h3.k_ring(center_h3, k_radius)
        return [self.cell_index[idx] for idx in neighbor_indices if idx in self.cell_index]
    
    def get_factor_statistics(self, factor_name: str) -> Dict[str, float]:
        """Get statistics for a factor across all cells"""
        values = [cell.factors.get(factor_name, np.nan) 
                 for cell in self.cell_index.values()]
        values = [v for v in values if pd.notna(v)]
        
        if not values:
            return {}
            
        return {
            'count': len(values),
            'mean': np.mean(values),
            'std': np.std(values),
            'min': np.min(values),
            'max': np.max(values),
            'median': np.median(values)
        }


@dataclass
class ProcessingResult:
    """Result of data processing operation"""
    success: bool
    records_processed: int
    records_failed: int
    processing_time_seconds: float
    
    # Quality metrics
    data_quality: Optional[DataQuality] = None
    
    # Error information
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    # Output information
    output_files: List[str] = field(default_factory=list)
    h3_cells_created: int = 0


@dataclass
class FusionConfig:
    """Configuration for data fusion pipeline"""
    h3_resolution: int = 6
    buffer_distance_km: float = 50.0
    interpolation_method: str = "inverse_distance_weighted"
    max_interpolation_distance_km: float = 200.0
    
    # Processing configuration
    chunk_size: int = 10000
    parallel_workers: int = 4
    cache_duration_hours: int = 24
    quality_threshold: float = 0.7
    
    # Output configuration
    output_format: str = "parquet"
    include_lineage: bool = True
    include_quality_metrics: bool = True


# Standard factor definitions used across the system
STANDARD_FACTORS = {
    # Infrastructure factors
    "ground_station_density": Factor(
        name="ground_station_density",
        weight=0.08,
        category="infrastructure", 
        normalization=NormalizationType.LOG,
        description="Density of ground stations per area",
        unit="stations per km²"
    ),
    "internet_exchange_presence": Factor(
        name="internet_exchange_presence",
        weight=0.06,
        category="infrastructure",
        normalization=NormalizationType.LINEAR,
        description="Presence and capacity of internet exchanges",
        unit="normalized score"
    ),
    "submarine_cable_proximity": Factor(
        name="submarine_cable_proximity", 
        weight=0.07,
        category="infrastructure",
        normalization=NormalizationType.INVERSE_DISTANCE,
        description="Proximity to submarine cable landing points",
        unit="km (inverse weighted)"
    ),
    
    # Economic factors
    "gdp_per_capita": Factor(
        name="gdp_per_capita",
        weight=0.08,
        category="economic",
        normalization=NormalizationType.LOG,
        description="GDP per capita",
        unit="USD"
    ),
    "bandwidth_cost_per_mbps": Factor(
        name="bandwidth_cost_per_mbps",
        weight=0.07,
        category="economic", 
        normalization=NormalizationType.INVERSE,
        description="Cost of bandwidth per Mbps",
        unit="USD/Mbps (inverse)"
    ),
    
    # Risk factors
    "rain_fade_risk": Factor(
        name="rain_fade_risk",
        weight=0.06,
        category="risk",
        normalization=NormalizationType.INVERSE,
        description="Risk of signal degradation due to precipitation",
        unit="probability (inverse)"
    ),
    "earthquake_risk": Factor(
        name="earthquake_risk",
        weight=0.04,
        category="risk",
        normalization=NormalizationType.INVERSE,
        description="Seismic activity risk",
        unit="risk score (inverse)"
    ),
    
    # Market factors
    "population_density": Factor(
        name="population_density",
        weight=0.06,
        category="market",
        normalization=NormalizationType.LOG,
        description="Population density",
        unit="people per km²"
    ),
    
    # Add more factors as needed...
}


def create_h3_grid(bounds: Tuple[float, float, float, float], 
                   resolution: int = 6) -> List[str]:
    """
    Create H3 hexagon grid covering the specified bounds
    
    Args:
        bounds: (min_lat, min_lon, max_lat, max_lon)
        resolution: H3 resolution level
        
    Returns:
        List of H3 indices covering the area
    """
    min_lat, min_lon, max_lat, max_lon = bounds
    
    # Create a polygon covering the bounds
    polygon = [
        [min_lat, min_lon],
        [min_lat, max_lon], 
        [max_lat, max_lon],
        [max_lat, min_lon],
        [min_lat, min_lon]  # Close the polygon
    ]
    
    return list(h3.polyfill(polygon, resolution))


def validate_h3_index(h3_index: str) -> bool:
    """Validate H3 index format"""
    try:
        return h3.h3_is_valid(h3_index)
    except:
        return False