"""
Intelligence Enrichment for Ground Station Investment Analysis
Calculates derived metrics and investment scores
"""

import duckdb
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class GroundStationIntelligence:
    def __init__(self, conn=None):
        self.conn = conn or duckdb.connect('data/ground_stations.db')
        
    def calculate_utilization_patterns(self):
        """Analyze SatNOGS observation patterns"""
        logger.info("Calculating utilization patterns...")
        
        # Check if observations table exists
        try:
            obs_count = self.conn.execute("""
                SELECT COUNT(*) FROM raw.satnogs_observations
            """).fetchone()[0]
            
            if obs_count == 0:
                logger.warning("No observations found, creating synthetic patterns")
                self._create_synthetic_patterns()
                return
        except:
            logger.warning("Observations table not found, creating synthetic patterns")
            self._create_synthetic_patterns()
            return
        
        query = """
        WITH hourly_obs AS (
            SELECT 
                ground_station,
                DATE_TRUNC('hour', CAST(start AS TIMESTAMP)) as hour,
                COUNT(*) as obs_count,
                AVG(CASE WHEN vetted_status = 'good' THEN 1.0 ELSE 0.0 END) as success_rate
            FROM raw.satnogs_observations
            GROUP BY ground_station, DATE_TRUNC('hour', CAST(start AS TIMESTAMP))
        ),
        station_patterns AS (
            SELECT
                ground_station,
                AVG(obs_count) as avg_hourly_obs,
                STDDEV(obs_count) as obs_variability,
                AVG(success_rate) as overall_success_rate,
                COUNT(DISTINCT hour) as active_hours
            FROM hourly_obs
            GROUP BY ground_station
        )
        SELECT * FROM station_patterns
        """
        
        try:
            patterns = self.conn.execute(query).df()
            
            # Store enriched data
            self.conn.execute("""
                CREATE OR REPLACE TABLE enriched.station_utilization_patterns AS
                SELECT * FROM patterns
            """)
            
            logger.info(f"Calculated patterns for {len(patterns)} stations")
        except Exception as e:
            logger.error(f"Error calculating patterns: {e}")
            self._create_synthetic_patterns()
    
    def _create_synthetic_patterns(self):
        """Create synthetic utilization patterns for POC"""
        logger.info("Creating synthetic utilization patterns...")
        
        # Get all stations
        stations = self.conn.execute("""
            SELECT station_id, name, latitude, longitude
            FROM raw.satnogs_stations
            WHERE status = 'Online'
        """).df()
        
        # Generate synthetic patterns
        patterns = []
        for _, station in stations.iterrows():
            # Base utilization on latitude (higher at mid-latitudes)
            lat_factor = 1 - abs(station['latitude']) / 90.0
            
            pattern = {
                'ground_station': str(station['station_id']),
                'avg_hourly_obs': np.random.normal(2 + lat_factor * 3, 1),
                'obs_variability': np.random.uniform(0.5, 2.0),
                'overall_success_rate': np.random.uniform(0.7, 0.95),
                'active_hours': np.random.randint(100, 8760)  # Hours per year
            }
            patterns.append(pattern)
        
        patterns_df = pd.DataFrame(patterns)
        
        # Ensure non-negative values
        patterns_df['avg_hourly_obs'] = patterns_df['avg_hourly_obs'].clip(lower=0.1)
        
        self.conn.execute("""
            CREATE OR REPLACE TABLE enriched.station_utilization_patterns AS
            SELECT * FROM patterns_df
        """)
        
        logger.info(f"Created synthetic patterns for {len(patterns_df)} stations")
    
    def calculate_weather_impact(self):
        """Correlate weather conditions with observation success"""
        logger.info("Calculating weather impact...")
        
        # Check if we have weather mapping
        try:
            mapping_count = self.conn.execute("""
                SELECT COUNT(*) FROM processed.station_weather_mapping
            """).fetchone()[0]
            
            if mapping_count == 0:
                logger.warning("No weather mappings found, creating synthetic impact")
                self._create_synthetic_weather_impact()
                return
        except:
            logger.warning("Weather mapping not found, creating synthetic impact")
            self._create_synthetic_weather_impact()
            return
        
        # For POC, create synthetic weather impact based on location
        self._create_synthetic_weather_impact()
    
    def _create_synthetic_weather_impact(self):
        """Create synthetic weather impact data"""
        logger.info("Creating synthetic weather impact analysis...")
        
        stations = self.conn.execute("""
            SELECT station_id, latitude, longitude
            FROM raw.satnogs_stations
            WHERE status = 'Online'
        """).df()
        
        weather_impacts = []
        weather_conditions = ['clear', 'rainy', 'foggy', 'windy', 'stormy']
        
        for _, station in stations.iterrows():
            # Weather patterns based on latitude
            tropical = abs(station['latitude']) < 23.5
            temperate = 23.5 <= abs(station['latitude']) < 66.5
            polar = abs(station['latitude']) >= 66.5
            
            for condition in weather_conditions:
                if condition == 'clear':
                    success_rate = 0.95 if not tropical else 0.90
                    freq = 0.6 if temperate else 0.4
                elif condition == 'rainy':
                    success_rate = 0.75 if not tropical else 0.65
                    freq = 0.2 if not tropical else 0.3
                elif condition == 'foggy':
                    success_rate = 0.70
                    freq = 0.1 if not polar else 0.2
                elif condition == 'windy':
                    success_rate = 0.85
                    freq = 0.05
                else:  # stormy
                    success_rate = 0.50
                    freq = 0.05 if not tropical else 0.1
                
                weather_impacts.append({
                    'ground_station': str(station['station_id']),
                    'weather_condition': condition,
                    'total_obs': int(freq * 1000),
                    'success_rate': success_rate,
                    'annual_impact_hours': int((1 - success_rate) * freq * 8760)
                })
        
        weather_df = pd.DataFrame(weather_impacts)
        
        self.conn.execute("""
            CREATE OR REPLACE TABLE enriched.weather_impact_analysis AS
            SELECT * FROM weather_df
        """)
        
        # Also create a summary table
        self.conn.execute("""
            CREATE OR REPLACE TABLE enriched.weather_summary AS
            SELECT 
                ground_station,
                SUM(CASE WHEN weather_condition = 'clear' THEN success_rate ELSE 0 END) as clear_weather_success_rate,
                SUM(annual_impact_hours) as total_weather_impact_hours,
                AVG(success_rate) as avg_weather_success_rate
            FROM enriched.weather_impact_analysis
            GROUP BY ground_station
        """)
        
        logger.info(f"Created weather impact for {len(stations)} stations")
    
    def calculate_investment_scores(self):
        """Create composite investment attractiveness scores"""
        logger.info("Calculating investment scores...")
        
        query = """
        WITH station_metrics AS (
            SELECT 
                s.station_id,
                s.name,
                s.latitude,
                s.longitude,
                s.status,
                COALESCE(u.avg_hourly_obs, 1.0) as avg_hourly_obs,
                COALESCE(u.overall_success_rate, 0.8) as success_rate,
                COALESCE(w.avg_weather_success_rate, 0.85) as weather_reliability,
                COALESCE(w.total_weather_impact_hours, 200) as weather_downtime
            FROM raw.satnogs_stations s
            LEFT JOIN enriched.station_utilization_patterns u
                ON s.station_id = CAST(u.ground_station AS INTEGER)
            LEFT JOIN enriched.weather_summary w
                ON s.station_id = CAST(w.ground_station AS INTEGER)
            WHERE s.status = 'Online'
        ),
        competition_metrics AS (
            SELECT 
                station1_id as station_id,
                COUNT(*) as nearby_station_count,
                MIN(distance_km) as nearest_competitor_km
            FROM processed.station_competition
            WHERE competition_level IN ('high_competition', 'moderate_competition')
            GROUP BY station1_id
        ),
        demand_metrics AS (
            SELECT 
                station_id,
                COUNT(DISTINCT region_id) as served_regions,
                AVG(CASE WHEN coverage_quality IN ('excellent', 'good') THEN 1 ELSE 0 END) as quality_coverage_pct
            FROM processed.station_region_links
            GROUP BY station_id
        ),
        scored_stations AS (
            SELECT 
                m.station_id,
                m.name,
                m.latitude,
                m.longitude,
                
                -- Utilization score (0-100)
                LEAST(m.avg_hourly_obs * 10, 100) as utilization_score,
                
                -- Reliability score (0-100)
                (m.success_rate * 0.7 + m.weather_reliability * 0.3) * 100 as reliability_score,
                
                -- Weather score (0-100)  
                GREATEST(0, 100 - (m.weather_downtime / 87.6)) as weather_score,
                
                -- Demand score (0-100)
                LEAST(COALESCE(d.served_regions, 1) * 20 * COALESCE(d.quality_coverage_pct, 0.5), 100) as demand_score,
                
                -- Competition score (0-100)
                CASE 
                    WHEN COALESCE(c.nearby_station_count, 0) = 0 THEN 100
                    WHEN c.nearby_station_count < 3 THEN 75
                    WHEN c.nearby_station_count < 5 THEN 50
                    ELSE 25
                END as competition_score,
                
                -- Strategic location bonus
                CASE
                    WHEN ABS(m.latitude) < 30 AND ABS(m.longitude) < 30 THEN 20  -- Europe/Africa
                    WHEN m.latitude BETWEEN 20 AND 40 AND m.longitude BETWEEN -130 AND -70 THEN 20  -- North America
                    WHEN m.latitude BETWEEN -10 AND 10 AND m.longitude BETWEEN 90 AND 150 THEN 20  -- Southeast Asia
                    ELSE 0
                END as strategic_bonus
                
            FROM station_metrics m
            LEFT JOIN competition_metrics c ON m.station_id = c.station_id
            LEFT JOIN demand_metrics d ON m.station_id = d.station_id
        )
        SELECT 
            *,
            (utilization_score * 0.2 + 
             reliability_score * 0.25 + 
             weather_score * 0.15 +
             demand_score * 0.25 + 
             competition_score * 0.15 +
             strategic_bonus * 0.5) as composite_score,
             
            -- Investment recommendation
            CASE
                WHEN (utilization_score * 0.2 + reliability_score * 0.25 + weather_score * 0.15 + demand_score * 0.25 + competition_score * 0.15 + strategic_bonus * 0.5) > 80 THEN 'high_priority'
                WHEN (utilization_score * 0.2 + reliability_score * 0.25 + weather_score * 0.15 + demand_score * 0.25 + competition_score * 0.15 + strategic_bonus * 0.5) > 60 THEN 'medium_priority'
                ELSE 'low_priority'
            END as investment_priority
        FROM scored_stations
        """
        
        scores = self.conn.execute(query).df()
        
        self.conn.execute("""
            CREATE OR REPLACE TABLE enriched.investment_scores AS
            SELECT * FROM scores
        """)
        
        logger.info(f"Calculated investment scores for {len(scores)} stations")
        
        # Log summary statistics
        summary = self.conn.execute("""
            SELECT 
                investment_priority,
                COUNT(*) as station_count,
                AVG(composite_score) as avg_score
            FROM enriched.investment_scores
            GROUP BY investment_priority
            ORDER BY avg_score DESC
        """).df()
        
        logger.info(f"Investment summary: {summary.to_dict('records')}")
    
    def identify_network_bridges(self):
        """Find stations that serve as critical network bridges"""
        logger.info("Identifying network bridge stations...")
        
        # For POC, identify stations that connect multiple regions
        query = """
        WITH station_connectivity AS (
            SELECT 
                sl.station_id,
                COUNT(DISTINCT sl.region_id) as connected_regions,
                COUNT(DISTINCT sl2.station_id) as connected_stations,
                AVG(sl.distance_km) as avg_region_distance
            FROM processed.station_region_links sl
            LEFT JOIN processed.station_region_links sl2
                ON sl.region_id = sl2.region_id
                AND sl.station_id != sl2.station_id
            GROUP BY sl.station_id
        ),
        bridge_candidates AS (
            SELECT 
                sc.station_id,
                s.name,
                s.latitude,
                s.longitude,
                sc.connected_regions,
                sc.connected_stations,
                sc.avg_region_distance,
                -- Bridge value based on connectivity
                (sc.connected_regions * 1000000 + 
                 sc.connected_stations * 100000) as bridge_value_usd
            FROM station_connectivity sc
            JOIN raw.satnogs_stations s ON sc.station_id = s.station_id
            WHERE sc.connected_regions > 1
        )
        SELECT * FROM bridge_candidates
        ORDER BY bridge_value_usd DESC
        """
        
        bridges = self.conn.execute(query).df()
        
        self.conn.execute("""
            CREATE OR REPLACE TABLE enriched.network_bridges AS
            SELECT * FROM bridges
        """)
        
        logger.info(f"Identified {len(bridges)} potential network bridge stations")