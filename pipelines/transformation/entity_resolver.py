"""
Entity Resolution and Data Fusion for Ground Station Intelligence
Matches and links entities across different data sources
"""

import duckdb
import pandas as pd
import numpy as np
from geopy.distance import geodesic
import logging

logger = logging.getLogger(__name__)

class LocationEntityResolver:
    def __init__(self, conn=None):
        self.conn = conn or duckdb.connect('data/ground_stations.db')
        self._init_schemas()
        
    def _init_schemas(self):
        """Initialize DuckDB schemas if not exists"""
        self.conn.execute("""
            CREATE SCHEMA IF NOT EXISTS raw;
            CREATE SCHEMA IF NOT EXISTS processed;
            CREATE SCHEMA IF NOT EXISTS enriched;
        """)
        
    def match_weather_to_ground_stations(self, distance_threshold_km=50):
        """Match weather stations to nearest ground stations"""
        logger.info("Matching weather stations to ground stations...")
        
        # Get data from DuckDB
        try:
            ground_stations = self.conn.execute("""
                SELECT station_id, name, lat as latitude, lng as longitude 
                FROM raw.satnogs_stations
                WHERE status = 'Online' AND lat IS NOT NULL AND lng IS NOT NULL
            """).df()
        except:
            # Handle different column names
            ground_stations = self.conn.execute("""
                SELECT id as station_id, name, latitude, longitude 
                FROM raw.satnogs_stations
                WHERE status = 'Online' AND latitude IS NOT NULL AND longitude IS NOT NULL
            """).df()
        
        weather_stations = self.conn.execute("""
            SELECT USAF || '-' || WBAN as weather_id, 
                   "STATION NAME" as station_name, LAT, LON
            FROM raw.filtered_weather_stations
            WHERE LAT IS NOT NULL AND LON IS NOT NULL
        """).df()
        
        # Create nearest neighbor matches
        matches = []
        for _, gs in ground_stations.iterrows():
            gs_loc = (gs['latitude'], gs['longitude'])
            
            # Find nearest weather station
            min_dist = float('inf')
            best_match = None
            
            for _, ws in weather_stations.iterrows():
                try:
                    ws_loc = (ws['LAT'], ws['LON'])
                    dist = geodesic(gs_loc, ws_loc).km
                    
                    if dist < min_dist and dist < distance_threshold_km:
                        min_dist = dist
                        best_match = {
                            'ground_station_id': str(gs['station_id']),
                            'weather_station_id': ws['weather_id'],
                            'distance_km': dist
                        }
                except:
                    continue
            
            if best_match:
                matches.append(best_match)
        
        # Store matches
        if matches:
            matches_df = pd.DataFrame(matches)
            self.conn.execute("""
                CREATE OR REPLACE TABLE processed.station_weather_mapping AS
                SELECT * FROM matches_df
            """)
            logger.info(f"Created {len(matches)} weather station mappings")
        
        return matches
    
    def create_demand_regions(self, grid_size_deg=1.0):
        """Create demand region entities from population/economic data"""
        logger.info("Creating demand regions...")
        
        # Load population grid
        try:
            pop_data = self.conn.execute("""
                SELECT * FROM raw.population_grid
            """).df()
        except:
            logger.warning("Population grid not found, creating default regions")
            # Create default regions
            lat_range = np.arange(-60, 60, grid_size_deg * 5)
            lon_range = np.arange(-180, 180, grid_size_deg * 5)
            
            regions = []
            region_id = 0
            
            for lat in lat_range:
                for lon in lon_range:
                    region = {
                        'region_id': f'region_{region_id}',
                        'center_lat': lat + grid_size_deg * 2.5,
                        'center_lon': lon + grid_size_deg * 2.5,
                        'min_lat': lat,
                        'max_lat': lat + grid_size_deg * 5,
                        'min_lon': lon,
                        'max_lon': lon + grid_size_deg * 5,
                        'name': f'Region_{region_id}'
                    }
                    regions.append(region)
                    region_id += 1
            
            regions_df = pd.DataFrame(regions)
        else:
            # Create regions from population data
            regions = []
            for idx, row in pop_data.iterrows():
                region = {
                    'region_id': row['grid_id'],
                    'center_lat': row['center_lat'],
                    'center_lon': row['center_lon'],
                    'min_lat': row['center_lat'] - 0.5,
                    'max_lat': row['center_lat'] + 0.5,
                    'min_lon': row['center_lon'] - 0.5,
                    'max_lon': row['center_lon'] + 0.5,
                    'name': row.get('urban_area', f"Region_{idx}"),
                    'population_density': row.get('population_density', 0)
                }
                regions.append(region)
            
            regions_df = pd.DataFrame(regions)
        
        # Store regions
        self.conn.execute("""
            CREATE OR REPLACE TABLE processed.demand_regions AS
            SELECT * FROM regions_df
        """)
        logger.info(f"Created {len(regions_df)} demand regions")
        
        return regions_df
    
    def link_stations_to_regions(self):
        """Link ground stations to their serving regions"""
        logger.info("Linking ground stations to demand regions...")
        
        query = """
        WITH station_region_pairs AS (
            SELECT 
                s.station_id,
                s.name as station_name,
                s.latitude as station_lat,
                s.longitude as station_lon,
                r.region_id,
                r.name as region_name,
                r.center_lat,
                r.center_lon,
                -- Calculate distance
                SQRT(POWER(s.latitude - r.center_lat, 2) + 
                     POWER(s.longitude - r.center_lon, 2)) * 111.0 as distance_km
            FROM raw.satnogs_stations s
            CROSS JOIN processed.demand_regions r
            WHERE s.status = 'Online'
            AND s.latitude IS NOT NULL
            AND s.longitude IS NOT NULL
        )
        SELECT 
            station_id,
            region_id,
            distance_km,
            -- Calculate coverage quality based on distance
            CASE 
                WHEN distance_km < 100 THEN 'excellent'
                WHEN distance_km < 300 THEN 'good'
                WHEN distance_km < 500 THEN 'fair'
                ELSE 'poor'
            END as coverage_quality,
            -- Estimated latency
            20 + distance_km * 0.1 as latency_ms
        FROM station_region_pairs
        WHERE distance_km < 1000  -- Only link if within 1000km
        """
        
        self.conn.execute(f"""
            CREATE OR REPLACE TABLE processed.station_region_links AS
            {query}
        """)
        
        result = self.conn.execute("""
            SELECT COUNT(*) as link_count FROM processed.station_region_links
        """).fetchone()
        
        logger.info(f"Created {result[0]} station-region links")
    
    def identify_station_clusters(self):
        """Identify clusters of ground stations for competition analysis"""
        logger.info("Identifying ground station clusters...")
        
        # Simple distance-based clustering
        query = """
        WITH station_pairs AS (
            SELECT 
                s1.station_id as station1_id,
                s1.name as station1_name,
                s2.station_id as station2_id,
                s2.name as station2_name,
                SQRT(POWER(s1.latitude - s2.latitude, 2) + 
                     POWER(s1.longitude - s2.longitude, 2)) * 111.0 as distance_km
            FROM raw.satnogs_stations s1
            JOIN raw.satnogs_stations s2 
                ON s1.station_id < s2.station_id
            WHERE s1.status = 'Online' AND s2.status = 'Online'
            AND s1.latitude IS NOT NULL AND s2.latitude IS NOT NULL
        )
        SELECT 
            station1_id,
            station2_id,
            distance_km,
            CASE 
                WHEN distance_km < 50 THEN 'high_competition'
                WHEN distance_km < 200 THEN 'moderate_competition'
                ELSE 'low_competition'
            END as competition_level
        FROM station_pairs
        WHERE distance_km < 500  -- Only consider stations within 500km
        """
        
        self.conn.execute(f"""
            CREATE OR REPLACE TABLE processed.station_competition AS
            {query}
        """)
        
        result = self.conn.execute("""
            SELECT 
                competition_level,
                COUNT(*) as pair_count
            FROM processed.station_competition
            GROUP BY competition_level
        """).df()
        
        logger.info(f"Competition analysis complete: {result.to_dict('records')}")