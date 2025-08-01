#!/usr/bin/env python3
"""
Master Pipeline for Ground Station Intelligence POC
Orchestrates data collection, processing, and export
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime
import duckdb
import json

# Import our modules
from scripts.download_all_data import GroundStationDataDownloader
from pipelines.transformation.entity_resolver import LocationEntityResolver
from pipelines.enrichment.intelligence_calculator import GroundStationIntelligence
from pipelines.export.graphxr_exporter import GraphXRExporter

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GroundStationPipeline:
    def __init__(self):
        self.db_path = "data/ground_stations.db"
        self.conn = None
        
    def initialize_database(self):
        """Initialize DuckDB connection and load data"""
        logger.info("Initializing database...")
        self.conn = duckdb.connect(self.db_path)
        
        # Create schemas
        self.conn.execute("""
            CREATE SCHEMA IF NOT EXISTS raw;
            CREATE SCHEMA IF NOT EXISTS processed;
            CREATE SCHEMA IF NOT EXISTS enriched;
        """)
        
    def load_raw_data(self):
        """Load downloaded data into DuckDB"""
        logger.info("Loading raw data into DuckDB...")
        
        # Check if we have downloaded data
        raw_dir = "data/raw"
        if not os.path.exists(raw_dir):
            logger.warning(f"Raw data directory {raw_dir} not found. Running download...")
            downloader = GroundStationDataDownloader()
            downloader.download_all()
        
        # Load parquet files into DuckDB
        parquet_files = [
            ("satnogs_stations", "raw.satnogs_stations"),
            ("satnogs_observations", "raw.satnogs_observations"),
            ("filtered_weather_stations", "raw.filtered_weather_stations"),
            ("population_grid", "raw.population_grid"),
            ("economic_indicators", "raw.economic_indicators"),
            ("active_satellites", "raw.active_satellites")
        ]
        
        loaded_count = 0
        for file_name, table_name in parquet_files:
            file_path = f"{raw_dir}/{file_name}.parquet"
            if os.path.exists(file_path):
                try:
                    self.conn.execute(f"""
                        CREATE OR REPLACE TABLE {table_name} AS 
                        SELECT * FROM read_parquet('{file_path}')
                    """)
                    count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                    logger.info(f"Loaded {count} records into {table_name}")
                    loaded_count += 1
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
            else:
                logger.warning(f"File not found: {file_path}")
        
        logger.info(f"Loaded {loaded_count}/{len(parquet_files)} data files")
        
    def run_entity_resolution(self):
        """Run entity resolution and matching"""
        logger.info("Running entity resolution...")
        
        resolver = LocationEntityResolver(self.conn)
        
        # Match weather stations
        weather_matches = resolver.match_weather_to_ground_stations()
        logger.info(f"Created {len(weather_matches)} weather station matches")
        
        # Create demand regions
        regions = resolver.create_demand_regions()
        logger.info(f"Created {len(regions)} demand regions")
        
        # Link stations to regions
        resolver.link_stations_to_regions()
        
        # Identify competition
        resolver.identify_station_clusters()
        
    def run_intelligence_enrichment(self):
        """Calculate intelligence metrics"""
        logger.info("Running intelligence enrichment...")
        
        intelligence = GroundStationIntelligence(self.conn)
        
        # Calculate utilization patterns
        intelligence.calculate_utilization_patterns()
        
        # Calculate weather impact
        intelligence.calculate_weather_impact()
        
        # Calculate investment scores
        intelligence.calculate_investment_scores()
        
        # Identify network bridges
        intelligence.identify_network_bridges()
        
    def export_to_graphxr(self):
        """Export data in GraphXR format"""
        logger.info("Exporting to GraphXR format...")
        
        exporter = GraphXRExporter(self.conn)
        
        # Generate nodes
        exporter.generate_ground_station_nodes()
        exporter.generate_demand_region_nodes()
        exporter.generate_weather_pattern_nodes()
        
        # Generate relationships
        exporter.generate_relationships()
        
        # Export
        graph_data = exporter.export_to_graphxr()
        
        return graph_data
    
    def generate_analytics_summary(self):
        """Generate summary statistics for validation"""
        logger.info("Generating analytics summary...")
        
        summary = {}
        
        # Station statistics
        station_stats = self.conn.execute("""
            SELECT 
                COUNT(*) as total_stations,
                COUNT(DISTINCT CASE WHEN investment_priority = 'high_priority' THEN station_id END) as high_priority_stations,
                AVG(composite_score) as avg_investment_score,
                MAX(composite_score) as max_investment_score
            FROM enriched.investment_scores
        """).fetchone()
        
        summary['stations'] = {
            'total': station_stats[0],
            'high_priority': station_stats[1],
            'avg_score': round(station_stats[2], 2) if station_stats[2] else 0,
            'max_score': round(station_stats[3], 2) if station_stats[3] else 0
        }
        
        # Region statistics
        region_stats = self.conn.execute("""
            SELECT 
                COUNT(*) as total_regions,
                AVG(population_density) as avg_pop_density
            FROM processed.demand_regions
        """).fetchone()
        
        summary['regions'] = {
            'total': region_stats[0],
            'avg_population_density': round(region_stats[1], 2) if region_stats[1] else 0
        }
        
        # Relationship statistics
        rel_stats = self.conn.execute("""
            SELECT 
                (SELECT COUNT(*) FROM processed.station_region_links) as serves_count,
                (SELECT COUNT(*) FROM processed.station_competition) as competition_count
        """).fetchone()
        
        summary['relationships'] = {
            'serves': rel_stats[0],
            'competition': rel_stats[1]
        }
        
        # Top investment opportunities
        top_stations = self.conn.execute("""
            SELECT 
                s.name,
                i.composite_score,
                i.investment_priority,
                s.latitude,
                s.longitude
            FROM enriched.investment_scores i
            JOIN raw.satnogs_stations s ON i.station_id = s.station_id
            ORDER BY i.composite_score DESC
            LIMIT 5
        """).df()
        
        summary['top_opportunities'] = top_stations.to_dict('records')
        
        # Save summary
        with open('data/analytics_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Analytics summary: {summary}")
        
        return summary
    
    def run_full_pipeline(self):
        """Execute the complete pipeline"""
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("Starting Ground Station Intelligence POC Pipeline")
        logger.info("=" * 60)
        
        try:
            # Initialize
            self.initialize_database()
            
            # Load data
            self.load_raw_data()
            
            # Process data
            self.run_entity_resolution()
            self.run_intelligence_enrichment()
            
            # Export
            graph_data = self.export_to_graphxr()
            
            # Generate summary
            summary = self.generate_analytics_summary()
            
            # Calculate runtime
            elapsed = datetime.now() - start_time
            
            logger.info("=" * 60)
            logger.info(f"Pipeline completed successfully in {elapsed.total_seconds():.1f} seconds")
            logger.info(f"Generated {len(graph_data['nodes'])} nodes and {len(graph_data['edges'])} edges")
            logger.info("=" * 60)
            
            return {
                'success': True,
                'runtime_seconds': elapsed.total_seconds(),
                'summary': summary,
                'output_files': [
                    'data/graphxr_export.json',
                    'data/graphxr_export_sample.json',
                    'data/analytics_summary.json'
                ]
            }
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            if self.conn:
                self.conn.close()

if __name__ == "__main__":
    pipeline = GroundStationPipeline()
    result = pipeline.run_full_pipeline()
    
    if result['success']:
        print("\n✅ Pipeline completed successfully!")
        print(f"\n📊 Summary:")
        print(f"   - Total stations: {result['summary']['stations']['total']}")
        print(f"   - High priority opportunities: {result['summary']['stations']['high_priority']}")
        print(f"   - Output files created in data/ directory")
        print(f"\n🚀 Ready for GraphXR visualization!")
    else:
        print(f"\n❌ Pipeline failed: {result['error']}")